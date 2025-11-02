import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TAG_OPTIONS = ['Marketing', 'Design', 'Content', 'HR', 'Finance', 'IT', 'Admin', 'Management'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export default function TaskCreateModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: [],
    dueDate: '',
    priority: 'Medium',
    tags: [],
    checklist: []
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Check if user is admin
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin';

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Reset form when modal opens
      setFormData({
        title: '',
        description: '',
        assignedTo: [],
        dueDate: '',
        priority: 'Medium',
        tags: [],
        checklist: []
      });
      setNewChecklistItem('');
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const response = await api.listAllUsers();
      // Filter out SuperAdmin users from the list
      const filteredUsers = (response.data || []).filter(u => u.role !== 'SuperAdmin');
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setFormData({
      ...formData,
      checklist: [...formData.checklist, { text: newChecklistItem, completed: false }]
    });
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (index) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index)
    });
  };

  const handleToggleTag = (tag) => {
    if (formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    if (formData.assignedTo.length === 0) {
      alert('Please assign the task to at least one user');
      return;
    }

    setLoading(true);
    try {
      await api.assignTask({
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate || undefined,
        priority: formData.priority,
        tags: formData.tags,
        checklist: formData.checklist.filter(item => item.text.trim())
      });
      
      if (onCreated) onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // If not admin, show access denied message
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              Only Admin and SuperAdmin can assign tasks to employees.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Assign New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task title..."
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task description..."
            />
          </div>

          {/* Assign To */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To Employee(s) <span className="text-red-500">*</span>
            </label>
            <select
              multiple
              value={formData.assignedTo}
              onChange={(e) => setFormData({ 
                ...formData, 
                assignedTo: Array.from(e.target.selectedOptions, opt => opt.value) 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={6}
              required
            >
              <option value="" disabled className="text-gray-400">
                -- Select Employee(s) --
              </option>
              {allUsers.length === 0 ? (
                <option disabled>No employees available</option>
              ) : (
                allUsers.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.fullName} - {u.role}
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple employees
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Note: SuperAdmins are excluded from the list
            </p>
          </div>

          {/* Priority and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.tags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Checklist
            </label>
            <div className="space-y-2 mb-2">
              {formData.checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm text-gray-900">{item.text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(index)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Minus size={16} className="text-red-600" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem())}
                placeholder="Add checklist item..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="border-t p-4 flex items-center justify-end gap-2 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
