import express from 'express';
import Lead from '../models/Lead.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

const genLeadId = async () => {
  const y = new Date().getFullYear();
  const count = await Lead.countDocuments({ leadId: new RegExp(`^LEAD-${y}-`) });
  const n = (count + 1).toString().padStart(4, '0');
  return `LEAD-${y}-${n}`;
};

// Create single lead (DM only)
router.post('/', requireAuth, authorize(['DigitalMarketing']), async (req, res) => {
  const { name, phone, email, interestedCourse, source } = req.body || {};
  if (!name) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Name required' });

  // simple dedupe guard: same phone OR email within last 180 days
  const since = new Date(); since.setDate(since.getDate() - 180);
  const dup = await Lead.findOne({
    $and: [
      { createdAt: { $gte: since } },
      { $or: [{ phone: phone || null }, { email: email?.toLowerCase() || null }] }
    ]
  });
  if (dup) return res.status(409).json({ code: 'DUPLICATE', message: 'Duplicate phone/email in recent leads' });

  const lead = await Lead.create({
    leadId: await genLeadId(),
    name, phone, email, interestedCourse, source,
    status: 'Assigned',
    assignedBy: req.user.id
  });

  return res.status(201).json({ lead });
});

// Bulk upload CSV (string body) — DM only
// CSV headers: Name,Phone,Email,InterestedCourse,Source
router.post('/bulk', requireAuth, authorize(['DigitalMarketing']), async (req, res) => {
  try {
    const { csv } = req.body || {};
    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'csv string required' });
    }
    const lines = csv.split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) return res.status(400).json({ code: 'NO_ROWS', message: 'No data rows' });

    const header = lines[0].split(',').map(h => h.trim());
    const idx = {
      Name: header.indexOf('Name'),
      Phone: header.indexOf('Phone'),
      Email: header.indexOf('Email'),
      InterestedCourse: header.indexOf('InterestedCourse'),
      Source: header.indexOf('Source')
    };
    if (Object.values(idx).some(v => v < 0)) {
      return res.status(400).json({ code: 'HEADER_MISSING', message: 'Headers must be Name,Phone,Email,InterestedCourse,Source' });
    }

    const since = new Date(); since.setDate(since.getDate() - 180);
    let created = 0, skipped = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(x => x.trim());
      if (!parts.length || parts.join('') === '') continue;

      const name = parts[idx.Name];
      const phone = parts[idx.Phone] || null;
      const email = (parts[idx.Email] || '').toLowerCase() || null;
      const interestedCourse = parts[idx.InterestedCourse] || '';
      const source = parts[idx.Source] || 'Others';

      if (!name) { skipped++; continue; }

      const dup = await Lead.findOne({
        $and: [
          { createdAt: { $gte: since } },
          { $or: [{ phone }, { email }] }
        ]
      });

      if (dup) { skipped++; continue; }

      await Lead.create({
        leadId: await genLeadId(),
        name, phone, email, interestedCourse, source,
        status: 'Assigned',
        assignedBy: req.user.id
      });
      created++;
    }

    return res.json({ ok: true, created, skipped });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

// List leads (DM full view; Admin/SuperAdmin view-only)
router.get('/', requireAuth, authorize(['DigitalMarketing', 'Admin', 'SuperAdmin']), async (req, res) => {
  const { status } = req.query;
  const q = {};
  if (status) q.status = status;
  const leads = await Lead.find(q)
    .sort({ createdAt: -1 })
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role');
  return res.json({ leads });
});

// Assign to Admission member (DM only) — support both POST and PATCH for compatibility
const assignHandler = async (req, res) => {
  const { assignedTo } = req.body || {};
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lead not found' });

  const user = await User.findById(assignedTo);
  if (!user || user.role !== 'Admission') {
    return res.status(400).json({ code: 'INVALID_ASSIGNEE', message: 'Assignee must be Admission member' });
  }

  lead.assignedTo = user._id;
  lead.status = 'Assigned';
  await lead.save();

  const populated = await Lead.findById(lead._id)
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role');

  return res.json({ lead: populated });
};

router.post('/:id/assign', requireAuth, authorize(['DigitalMarketing']), assignHandler);
router.patch('/:id/assign', requireAuth, authorize(['DigitalMarketing']), assignHandler); // <-- added


// Update status (DM only for now; Phase 4: Admission will change from their side)
router.patch('/:id/status', requireAuth, authorize(['DigitalMarketing']), async (req, res) => {
  const { status, notes } = req.body || {};
  const allowed = ['Assigned', 'Counseling', 'In Follow Up', 'Admitted', 'Not Admitted', 'Interested'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ code: 'INVALID_STATUS', message: 'Invalid status' });
  }
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lead not found' });
  lead.status = status;
  if (notes !== undefined) lead.notes = notes;
  await lead.save();
  const populated = await Lead.findById(lead._id).populate('assignedTo', 'name email role').populate('assignedBy', 'name email role');
  return res.json({ lead: populated });
});

export default router;
