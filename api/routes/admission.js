// api/routes/admission.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Lead from '../models/Lead.js';
import AdmissionFee from '../models/AdmissionFee.js';

const router = express.Router();

const isAdmission = (u) => u?.role === 'Admission';
const isAdmin = (u) => u?.role === 'Admin';
const isSA = (u) => u?.role === 'SuperAdmin';
const isAccountant = (u) => u?.role === 'Accountant';
const isCoordinator = (u) => u?.role === 'Coordinator';

// ---------- Leads (Admission pipeline) ----------

// List leads for Admission (own) or Admin/SA/Coordinator (all)
router.get('/leads', requireAuth, async (req, res) => {
  const { status } = req.query;
  const q = {};
  if (status) q.status = status;

  if (isAdmission(req.user)) {
    q.assignedTo = req.user.id;
  } else if (!(isAdmin(req.user) || isSA(req.user) || isCoordinator(req.user))) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Not allowed' });
  }

  const leads = await Lead.find(q).sort({ createdAt: -1 }).populate('assignedTo', 'name email');
  return res.json({ leads });
});

// Allowed transitions
// Assigned -> Counseling
// Counseling -> Admitted | In Follow Up | Not Admitted
// In Follow Up -> Admitted | Not Admitted
router.patch('/leads/:id/status', requireAuth, async (req, res) => {
  const { status, notes, courseId, batchId, nextFollowUpDate } = req.body || {};
  const allowed = ['Counseling', 'Admitted', 'In Follow Up', 'Not Admitted'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ code: 'INVALID_STATUS', message: 'Invalid target status' });
  }

  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lead not found' });

  // Admission can only move own leads; Admin/SA can move any
  if (isAdmission(req.user) && String(lead.assignedTo) !== String(req.user.id)) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot update unassigned lead' });
  }
  if (!(isAdmission(req.user) || isAdmin(req.user) || isSA(req.user))) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Not allowed' });
  }

  const from = lead.status;
  let ok =
    (from === 'Assigned' && status === 'Counseling') ||
    (from === 'Counseling' && ['Admitted', 'In Follow Up', 'Not Admitted'].includes(status)) ||
    (from === 'In Follow Up' && ['Admitted', 'Not Admitted'].includes(status));

  // Special case: allow adding an additional follow-up (notes) while already in 'In Follow Up'
  // without requiring a status change. This enables the frontend "Follow-Up Again" flow.
  if (!ok) {
    if (status === 'In Follow Up' && notes && String(notes).trim().length > 0) {
      ok = true;
    }
  }

  if (!ok) {
    return res.status(400).json({ code: 'BAD_TRANSITION', message: `Cannot move ${from} -> ${status}` });
  }

  // Update timestamps / follow-ups appropriately
  if (status === 'Counseling') {
    // mark counseling time if moving to Counseling
    lead.counselingAt = lead.counselingAt || new Date();
  }

  if (status === 'Admitted') {
    lead.admittedAt = lead.admittedAt || new Date();
    // Store the course they were admitted to
    if (courseId) {
      lead.admittedToCourse = courseId;
      // Also update interestedCourse with the actual course name for display
      const Course = (await import('../models/Course.js')).default;
      const course = await Course.findById(courseId);
      if (course) {
        lead.interestedCourse = course.name;
      }
    }
    
    // Store the batch they were admitted to
    if (batchId) {
      lead.admittedToBatch = batchId;
      // Also add student to batch's admittedStudents array
      const Batch = (await import('../models/Batch.js')).default;
      const batch = await Batch.findById(batchId);
      if (batch) {
        const alreadyInBatch = batch.admittedStudents.some(
          s => s.lead.toString() === lead._id.toString()
        );
        if (!alreadyInBatch) {
          batch.admittedStudents.push({
            lead: lead._id,
            admittedAt: new Date()
          });
          await batch.save();
        }
      }
    }
  }

  if (status === 'In Follow Up') {
    // if notes provided, append a follow-up entry
    if (notes && String(notes).trim().length > 0) {
      lead.followUps = lead.followUps || [];
      lead.followUps.push({ note: String(notes).trim(), at: new Date(), by: req.user.id });
    }
    
    // Update nextFollowUpDate if provided
    if (nextFollowUpDate) {
      lead.nextFollowUpDate = new Date(nextFollowUpDate);
    }
  }

  if (status === 'Not Admitted') {
    // if a reason/notes provided when marking Not Admitted, store it as a follow-up entry
    if (notes && String(notes).trim().length > 0) {
      lead.followUps = lead.followUps || [];
      lead.followUps.push({ note: `Not Admitted: ${String(notes).trim()}`, at: new Date(), by: req.user.id });
    }
  }

  lead.status = status;
  await lead.save();

  // populate follow-up authors
  await Lead.populate(lead, { path: 'followUps.by', select: 'name email' });

  return res.json({ lead });
});

// ---------- Fees Collection (Admission submit; Accountant approve in Phase 5) ----------

// List fees: Admission sees own, Admin/SA/Accountant/Coordinator see all
router.get('/fees', requireAuth, async (req, res) => {
  const q = {};
  if (isAdmission(req.user)) q.submittedBy = req.user.id;
  else if (!(isAdmin(req.user) || isSA(req.user) || isAccountant(req.user) || isCoordinator(req.user))) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Not allowed' });
  }
  const rows = await AdmissionFee.find(q)
    .sort({ createdAt: -1 })
    .populate('lead', 'leadId name phone email status');
  return res.json({ fees: rows });
});

// Create fee (Admission only)
router.post('/fees', requireAuth, async (req, res) => {
  if (!isAdmission(req.user)) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Admission only' });
  }
  const { leadId, courseName, totalAmount, amount, dueAmount, method, paymentDate, nextPaymentDate, note } = req.body || {};
  if (!leadId || !courseName || amount === undefined || !method || !paymentDate) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Missing required fields' });
  }

  const lead = await Lead.findById(leadId);
  if (!lead) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lead not found' });

  if (String(lead.assignedTo) !== String(req.user.id)) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot submit fee for unassigned lead' });
  }
  if (lead.status !== 'Admitted') {
    return res.status(400).json({ code: 'INVALID_STATE', message: 'Lead must be Admitted' });
  }

  const row = await AdmissionFee.create({
    lead: lead._id,
    courseName,
    totalAmount: Number(totalAmount) || 0,
    amount: Number(amount),
    dueAmount: Number(dueAmount) || 0,
    method,
    paymentDate: new Date(paymentDate),
    nextPaymentDate: nextPaymentDate ? new Date(nextPaymentDate) : undefined,
    note: note || '',
    status: 'Pending',
    submittedBy: req.user.id
  });

  const populated = await AdmissionFee.findById(row._id).populate('lead', 'leadId name phone email status');
  return res.status(201).json({ fee: populated });
});

// ---------- Follow-up Notifications ----------

// Get leads with upcoming/overdue follow-ups for Admission
router.get('/follow-up-notifications', requireAuth, async (req, res) => {
  if (!isAdmission(req.user) && !isAdmin(req.user) && !isSA(req.user)) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Not allowed' });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = {
      status: { $in: ['Assigned', 'Counseling', 'In Follow Up'] } // Not admitted or rejected
    };

    // Admission sees upcoming notifications (today + next 3 days)
    // Admin/SuperAdmin only see OVERDUE notifications (before today)
    if (isAdmission(req.user)) {
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      q.nextFollowUpDate = { $lte: threeDaysFromNow };
      q.assignedTo = req.user.id; // Only their own leads
    } else {
      // Admin/SuperAdmin: only overdue (< today)
      q.nextFollowUpDate = { $lt: today };
    }

    const leads = await Lead.find(q)
      .sort({ nextFollowUpDate: 1 })
      .populate('assignedTo', 'name email');

    const notifications = leads.map(lead => {
      const isOverdue = lead.nextFollowUpDate && new Date(lead.nextFollowUpDate) < today;
      const daysUntil = lead.nextFollowUpDate 
        ? Math.ceil((new Date(lead.nextFollowUpDate) - today) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...lead.toObject(),
        isOverdue,
        daysUntil
      };
    });

    return res.json({ notifications });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

export default router;
