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
 * Enhanced with new fields: priority, tags, multiple assignees, checklist, etc.
 */
router.post('/assign', requireAuth, authorize(['SuperAdmin', 'Admin']), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      assignedTo, // Can be single ID or array of IDs
      dueDate, 
      priority, 
      tags, 
      checklist,
      boardColumn 
    } = req.body || {};

    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'title, assignedTo, dueDate are required' });
    }

    // Handle multiple assignees
    const assigneeIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    
    // Validate all assignees
    for (const userId of assigneeIds) {
      const toUser = await User.findById(userId);
      if (!toUser || !toUser.isActive) {
        return res.status(404).json({ code: 'USER_NOT_FOUND', message: `Assignee ${userId} not found` });
      }
      // No one can assign TO SuperAdmin
      if (isSuperAdmin(toUser)) {
        return res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot assign task to Super Admin' });
      }
    }

    const task = await Task.create({
      title,
      description: description || '',
      assignedBy: req.user.id,
      assignedTo: assigneeIds,
      dueDate: new Date(dueDate),
      priority: priority || 'Medium',
      tags: tags || [],
      status: 'To Do',
      boardColumn: boardColumn || 'To Do',
      checklist: checklist || [],
      notificationsSent: { assigned: true } // Mark as sent
    });

    const populated = await Task.findById(task._id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role');
    
    return res.status(201).json({ task: populated });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

/**
 * List tasks (Assign Task page)
 * Only SuperAdmin/Admin can view the global assign list.
 * Query:
 *  - status, priority, tags, boardColumn (optional filters)
 */
router.get('/', requireAuth, authorize(['SuperAdmin', 'Admin']), async (req, res) => {
  try {
    const { status, priority, tags, boardColumn } = req.query;
    const q = {};
    
    if (status) q.status = status;
    if (priority) q.priority = priority;
    if (tags) q.tags = { $in: tags.split(',') };
    if (boardColumn) q.boardColumn = boardColumn;

    const tasks = await Task.find(q)
      .sort({ boardPosition: 1, createdAt: -1 })
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('comments.author', 'name email avatar')
      .populate('comments.mentions', 'name email')
      .populate('checklist.completedBy', 'name email');

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
 * Update Task Status
 * Enhanced with notification marking for automation
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {};
    const validStatuses = ['To Do', 'In Progress', 'In Review', 'Completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid status' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ code: 'NOT_FOUND', message: 'Task not found' });

    // Check if user is assignee
    const isAssignee = task.assignedTo.some(id => id.toString() === req.user.id);
    if (!isAssignee && req.user.role !== 'SuperAdmin' && req.user.role !== 'Admin') {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Only assignee or admin can change status' });
    }

    task.status = status;
    task.boardColumn = status;
    task.completedAt = status === 'Completed' ? new Date() : undefined;
    
    // Mark completion notification as sent when completed
    if (status === 'Completed') {
      task.notificationsSent.completed = true;
    }
    
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role');
    
    return res.json({ task: populated });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

/**
 * Update Task (full update including priority, tags, etc.)
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ code: 'NOT_FOUND', message: 'Task not found' });

    // Check permissions
    const isAssignee = task.assignedTo.some(id => id.toString() === req.user.id);
    const isAssigner = task.assignedBy.toString() === req.user.id;
    const isAdmin = ['SuperAdmin', 'Admin'].includes(req.user.role);
    
    if (!isAssignee && !isAssigner && !isAdmin) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }

    const { title, description, priority, tags, dueDate, assignedTo } = req.body;
    
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (tags) task.tags = tags;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (assignedTo) task.assignedTo = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role');
    
    return res.json({ task: populated });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

/**
 * Add Comment to Task
 */
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { text, mentions } = req.body;
    if (!text) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Comment text required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ code: 'NOT_FOUND', message: 'Task not found' });

    task.comments.push({
      text,
      author: req.user.id,
      mentions: mentions || []
    });
    
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('comments.author', 'name email avatar')
      .populate('comments.mentions', 'name email');
    
    return res.json({ task: populated });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

/**
 * Add Attachment to Task
 */
router.post('/:id/attachments', requireAuth, async (req, res) => {
  try {
    const { name, url, type, size } = req.body;
    if (!name || !url) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Name and URL required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ code: 'NOT_FOUND', message: 'Task not found' });

    task.attachments.push({
      name,
      url,
      type: type || 'file',
      size,
      uploadedBy: req.user.id
    });
    
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role');
    
    return res.json({ task: populated });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

/**
 * Update Checklist Item
 */
router.patch('/:id/checklist/:itemId', requireAuth, async (req, res) => {
  try {
    const { completed } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ code: 'NOT_FOUND', message: 'Task not found' });

    const item = task.checklist.id(req.params.itemId);
    if (!item) return res.status(404).json({ code: 'NOT_FOUND', message: 'Checklist item not found' });

    item.completed = completed;
    if (completed) {
      item.completedAt = new Date();
      item.completedBy = req.user.id;
    } else {
      item.completedAt = undefined;
      item.completedBy = undefined;
    }
    
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('checklist.completedBy', 'name email');
    
    return res.json({ task: populated });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

/**
 * Update Kanban Board Position (drag & drop)
 */
router.patch('/:id/board-position', requireAuth, async (req, res) => {
  try {
    const { boardColumn, boardPosition } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ code: 'NOT_FOUND', message: 'Task not found' });

    if (boardColumn) {
      task.boardColumn = boardColumn;
      // Auto-update status to match column
      if (boardColumn === 'Completed') {
        task.status = 'Completed';
        task.completedAt = new Date();
      } else {
        task.status = boardColumn;
      }
    }
    
    if (boardPosition !== undefined) task.boardPosition = boardPosition;
    
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role');
    
    return res.json({ task: populated });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

/**
 * Delete Task
 */
router.delete('/:id', requireAuth, authorize(['SuperAdmin', 'Admin']), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ code: 'NOT_FOUND', message: 'Task not found' });

    await task.deleteOne();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: e.message });
  }
});

export default router;
