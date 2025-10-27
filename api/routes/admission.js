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

// ---------- Leads (Admission pipeline) ----------

// List leads for Admission (own) or Admin/SA (all)
router.get('/leads', requireAuth, async (req, res) => {
  const { status } = req.query;
  const q = {};
  if (status) q.status = status;

  if (isAdmission(req.user)) {
    q.assignedTo = req.user.id;
  } else if (!(isAdmin(req.user) || isSA(req.user))) {
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
  const { status } = req.body || {};
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
  const ok =
    (from === 'Assigned' && status === 'Counseling') ||
    (from === 'Counseling' && ['Admitted', 'In Follow Up', 'Not Admitted'].includes(status)) ||
    (from === 'In Follow Up' && ['Admitted', 'Not Admitted'].includes(status));

  if (!ok) {
    return res.status(400).json({ code: 'BAD_TRANSITION', message: `Cannot move ${from} -> ${status}` });
  }

  lead.status = status;
  await lead.save();
  return res.json({ lead });
});

// ---------- Fees Collection (Admission submit; Accountant approve in Phase 5) ----------

// List fees: Admission sees own, Admin/SA/Accountant see all
router.get('/fees', requireAuth, async (req, res) => {
  const q = {};
  if (isAdmission(req.user)) q.submittedBy = req.user.id;
  else if (!(isAdmin(req.user) || isSA(req.user) || isAccountant(req.user))) {
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
  const { leadId, courseName, amount, method, paymentDate, note } = req.body || {};
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
    amount: Number(amount),
    method,
    paymentDate: new Date(paymentDate),
    note: note || '',
    status: 'Pending',
    submittedBy: req.user.id
  });

  const populated = await AdmissionFee.findById(row._id).populate('lead', 'leadId name phone email status');
  return res.status(201).json({ fee: populated });
});

export default router;
