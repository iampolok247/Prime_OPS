// api/routes/accounting.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import AdmissionFee from '../models/AdmissionFee.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';

const router = express.Router();
const onlyAcc = [ 'Accountant' ];
const accOrAdmin = [ 'Accountant', 'Admin', 'SuperAdmin' ];

// ---------- Fees Approval ----------

// List fees: Accountant sees all; Admin/SA can view-only
router.get('/fees', requireAuth, authorize(accOrAdmin), async (req, res) => {
  const { status } = req.query;
  const q = {};
  if (status) q.status = status;
  const rows = await AdmissionFee
    .find(q)
    .sort({ createdAt: -1 })
    .populate('lead', 'leadId name phone email status')
    .populate('submittedBy', 'name email');
  res.json({ fees: rows });
});

// Approve a fee -> create Income if not already created
router.patch('/fees/:id/approve', requireAuth, authorize(onlyAcc), async (req, res) => {
  const fee = await AdmissionFee.findById(req.params.id);
  if (!fee) return res.status(404).json({ code:'NOT_FOUND', message:'Fee not found' });

  fee.status = 'Approved';
  await fee.save();

  // if there's no income linked to this fee, create one
  const exists = await Income.findOne({ refType: 'AdmissionFee', refId: fee._id });
  if (!exists) {
    await Income.create({
      date: fee.paymentDate,
      source: 'Admission Fee',
      amount: fee.amount,
      refType: 'AdmissionFee',
      refId: fee._id,
      addedBy: req.user.id,
      note: `${fee.lead?.leadId || ''} ${fee.courseName || ''}`.trim()
    });
  }

  const populated = await AdmissionFee
    .findById(fee._id)
    .populate('lead', 'leadId name phone email status')
    .populate('submittedBy', 'name email');

  res.json({ fee: populated });
});

// Reject a fee (no income created)
router.patch('/fees/:id/reject', requireAuth, authorize(onlyAcc), async (req, res) => {
  const fee = await AdmissionFee.findById(req.params.id);
  if (!fee) return res.status(404).json({ code:'NOT_FOUND', message:'Fee not found' });
  fee.status = 'Rejected';
  await fee.save();

  const populated = await AdmissionFee
    .findById(fee._id)
    .populate('lead', 'leadId name phone email status')
    .populate('submittedBy', 'name email');

  res.json({ fee: populated });
});

// ---------- Income ----------

router.get('/income', requireAuth, authorize(accOrAdmin), async (req, res) => {
  const list = await Income.find().sort({ date: -1 });
  res.json({ income: list });
});

router.post('/income', requireAuth, authorize(onlyAcc), async (req, res) => {
  const { date, source, amount, note } = req.body || {};
  if (!date || !source || amount === undefined) {
    return res.status(400).json({ code:'VALIDATION_ERROR', message:'date, source, amount required' });
  }
  const row = await Income.create({
    date: new Date(date),
    source,
    amount: Number(amount),
    refType: 'Manual',
    refId: null,
    addedBy: req.user.id,
    note: note || ''
  });
  res.status(201).json({ income: row });
});

// ---------- Expense ----------

router.get('/expense', requireAuth, authorize(accOrAdmin), async (req, res) => {
  const list = await Expense.find().sort({ date: -1 });
  res.json({ expenses: list });
});

router.post('/expense', requireAuth, authorize(onlyAcc), async (req, res) => {
  const { date, purpose, amount, note } = req.body || {};
  if (!date || !purpose || amount === undefined) {
    return res.status(400).json({ code:'VALIDATION_ERROR', message:'date, purpose, amount required' });
  }
  const row = await Expense.create({
    date: new Date(date),
    purpose,
    amount: Number(amount),
    addedBy: req.user.id,
    note: note || ''
  });
  res.status(201).json({ expense: row });
});

router.delete('/expense/:id', requireAuth, authorize(onlyAcc), async (req, res) => {
  const row = await Expense.findById(req.params.id);
  if (!row) return res.status(404).json({ code:'NOT_FOUND', message:'Expense not found' });
  await row.deleteOne();
  res.json({ ok: true });
});

// ---------- Summary (Dashboard) ----------

router.get('/summary', requireAuth, authorize(accOrAdmin), async (req, res) => {
  const { from, to } = req.query;
  const start = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const end = to ? new Date(to) : new Date();

  const [incomeRows, expenseRows] = await Promise.all([
    Income.find({ date: { $gte: start, $lte: end } }),
    Expense.find({ date: { $gte: start, $lte: end } })
  ]);

  const totalIncome = incomeRows.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenseRows.reduce((s, r) => s + r.amount, 0);

  // Simple time-series by date (yyyy-mm-dd)
  const bucket = (acc, d, amt) => {
    const key = new Date(d).toISOString().slice(0,10);
    acc[key] = (acc[key] || 0) + amt;
  };
  const incomeSeries = {};
  const expenseSeries = {};
  incomeRows.forEach(r => bucket(incomeSeries, r.date, r.amount));
  expenseRows.forEach(r => bucket(expenseSeries, r.date, r.amount));

  res.json({
    totalIncome,
    totalExpense,
    profit: totalIncome - totalExpense,
    incomeSeries,
    expenseSeries
  });
});

export default router;
