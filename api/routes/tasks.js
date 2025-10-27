import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

/**
 * Helpers
 */
const isSuperAdmin = (u) => u?.role === 'SuperAdmin';

/**
 * Assign Task (Super Admin + Admin)
 * Rules:
 * - Super Admin can assign to anyone EXCEPT Super Admin (no one can assign to Super Admin).
 * - Admin can assign to everyone EXCEPT Super Admin.
 */
router.post('/assign', requireAuth, authorize(['SuperAdmin', 'Admin']), async (req, res) => {
  try {
    const { title, description, category, assignedTo, deadline } = req.body || {};

    if (!title || !assignedTo || !deadline) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'title, assignedTo, deadline are required' });
    }

    const toUser = await User.findById(assignedTo);
    if (!toUser || !toUser.isActive) {
      return res.status(404).json({ code: 'USER_NOT_FOUND', message: 'Assignee not found' });
    }

    // No one can assign TO SuperAdmin
    if (isSuperAdmin(toUser)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot assign task to Super Admin' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      category: category || '',
      assignedBy: req.user.id,
      assignedTo: toUser._id,
      deadline: new Date(deadline),
      status: 'InProgress'
    });

    const populated = await Task.findById(task._id).populate('assignedBy', 'name email role').populate('assignedTo', 'name email role');
    return res.status(201).json({ task: populated });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

/**
 * List tasks (Assign Task page)
 * Only SuperAdmin/Admin can view the global assign list.
 * Query:
 *  - status=InProgress|Completed (optional)
 */
router.get('/', requireAuth, authorize(['SuperAdmin', 'Admin']), async (req, res) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status && ['InProgress', 'Completed'].includes(status)) q.status = status;

    const tasks = await Task.find(q)
      .sort({ createdAt: -1 })
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    return res.json({ tasks });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

/**
 * My Tasks (for all roles except SuperAdmin)
 * Query:
 *  - status=InProgress|Completed (optional)
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    // Super Admin has no "My Task" per product rule; but still allow viewing own tasks if any exists.
    const { status } = req.query;
    const q = { assignedTo: req.user.id };
    if (status && ['InProgress', 'Completed'].includes(status)) q.status = status;

    const tasks = await Task.find(q)
      .sort({ createdAt: -1 })
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    return res.json({ tasks });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

/**
 * Create Self Task (My Task → Add My Task)
 * Everyone except SuperAdmin can self-create a task assigned to themselves.
 */
router.post('/self', requireAuth, async (req, res) => {
  try {
    // Block Super Admin from creating self tasks (product rule)
    if (req.user.role === 'SuperAdmin') {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Super Admin has no self tasks' });
    }

    const { title, description, category, deadline } = req.body || {};
    if (!title || !deadline) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'title and deadline are required' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      category: category || '',
      assignedBy: req.user.id,
      assignedTo: req.user.id,
      deadline: new Date(deadline),
      status: 'InProgress'
    });

    const populated = await Task.findById(task._id).populate('assignedBy', 'name email role').populate('assignedTo', 'name email role');
    return res.status(201).json({ task: populated });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

/**
 * Update Status (InProgress → Completed OR Completed → InProgress)
 * Only the assignee can change their task status.
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['InProgress', 'Completed'].includes(status)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid status' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ code: 'NOT_FOUND', message: 'Task not found' });

    if (task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Only assignee can change status' });
    }

    task.status = status;
    task.completedAt = status === 'Completed' ? new Date() : undefined;
    await task.save();

    const populated = await Task.findById(task._id).populate('assignedBy', 'name email role').populate('assignedTo', 'name email role');
    return res.json({ task: populated });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

export default router;
