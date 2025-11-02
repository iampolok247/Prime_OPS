import React, { useEffect, useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import TaskDetailModal from '../components/TaskDetailModal';
import TaskCreateModal from '../components/TaskCreateModal';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  MessageSquare,
  Paperclip,
  MoreVertical
} from 'lucide-react';

// Color coding constants
const STATUS_COLORS = {
  'To Do': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-500' },
  'In Progress': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' },
  'In Review': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-500' },
  'Completed': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
  'Overdue': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-600' }
};

const PRIORITY_COLORS = {
  'Low': { bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-400' },
  'Medium': { bg: 'bg-yellow-100', text: 'text-yellow-600', dot: 'bg-yellow-500' },
  'High': { bg: 'bg-orange-100', text: 'text-orange-600', dot: 'bg-orange-500' },
  'Critical': { bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500' }
};

const TAG_OPTIONS = ['Marketing', 'Design', 'Content', 'HR', 'Finance', 'IT', 'Admin', 'Management'];

const BOARD_COLUMNS = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Completed'];

function TaskCard({ task, onClick, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.status !== 'Completed' && new Date(task.dueDate) < new Date();
  const statusColor = isOverdue ? STATUS_COLORS['Overdue'] : STATUS_COLORS[task.status];
  const priorityColor = PRIORITY_COLORS[task.priority];

  const checklistProgress = task.checklist?.length > 0
    ? `${task.checklist.filter(item => item.completed).length}/${task.checklist.length}`
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border-2 ${statusColor.border} p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all`}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColor.bg} ${priorityColor.text} font-semibold`}>
          {task.priority}
        </span>
        {isOverdue && (
          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 font-semibold flex items-center gap-1">
            <AlertCircle size={12} /> Overdue
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-navy mb-2 text-sm">{task.title}</h3>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-2 border-t">
        <div className="flex items-center gap-3">
          {/* Due Date */}
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>

          {/* Checklist Progress */}
          {checklistProgress && (
            <div className="flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>{checklistProgress}</span>
            </div>
          )}

          {/* Comments Count */}
          {task.comments?.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare size={12} />
              <span>{task.comments.length}</span>
            </div>
          )}

          {/* Attachments Count */}
          {task.attachments?.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip size={12} />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {task.assignedTo?.length > 0 && (
          <div className="flex -space-x-2">
            {task.assignedTo.slice(0, 3).map(user => (
              <img
                key={user._id}
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-full border-2 border-white"
                title={user.name}
              />
            ))}
            {task.assignedTo.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">
                +{task.assignedTo.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ column, tasks, onCardClick, onAddTask, activeId }) {
  const columnTasks = tasks.filter(t => t.boardColumn === column);
  const taskCount = columnTasks.length;
  const taskIds = columnTasks.map(t => t._id);

  const { setNodeRef, isOver } = useSortable({
    id: column,
    data: {
      type: 'column',
      accepts: ['task']
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] bg-gray-50 rounded-xl p-4 transition-colors ${
        isOver ? 'bg-blue-50 border-2 border-blue-300' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[column]?.dot || 'bg-gray-400'}`}></div>
          <h2 className="font-semibold text-navy">{column}</h2>
          <span className="text-sm text-gray-500">({taskCount})</span>
        </div>
        <button
          onClick={() => onAddTask(column)}
          className="p-1 hover:bg-gray-200 rounded transition"
        >
          <Plus size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Cards */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
          {columnTasks.map(task => (
            <TaskCard 
              key={task._id} 
              task={task} 
              onClick={(e) => onCardClick(task, e)}
              isDragging={activeId === task._id}
            />
          ))}
          {taskCount === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">
              No tasks
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function TasksKanban() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const loadTasks = async () => {
    try {
      setLoading(true);
      const isAdmin = ['SuperAdmin', 'Admin'].includes(user?.role);
      const data = isAdmin ? await api.listAllTasks() : await api.listMyTasks();
      setTasks(data.tasks || []);
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    if (filterTags.length > 0 && !filterTags.some(tag => task.tags?.includes(tag))) return false;
    return true;
  });

  const handleCardClick = (task, e) => {
    // Prevent opening modal when dragging
    if (e?.defaultPrevented) return;
    setSelectedTask(task);
  };

  const handleAddTask = (column) => {
    setShowCreateModal(true);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id;
    const targetColumn = over.id;

    // Find the task being dragged
    const task = tasks.find(t => t._id === taskId);
    if (!task || task.boardColumn === targetColumn) return;

    try {
      // Update board position
      await api.updateBoardPosition(taskId, {
        boardColumn: targetColumn,
        boardPosition: 0
      });

      // Reload tasks to reflect changes
      await loadTasks();
    } catch (error) {
      console.error('Error moving task:', error);
      alert('Failed to move task');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-royal">Loading tasks...</div>;
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-navy">Task Board</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                New Task
              </button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              {/* Tags Filter */}
              <select
                multiple={false}
                value={filterTags[0] || ''}
                onChange={(e) => setFilterTags(e.target.value ? [e.target.value] : [])}
                className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">All Tags</option>
                {TAG_OPTIONS.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {BOARD_COLUMNS.map(column => (
                <KanbanColumn
                  key={column}
                  column={column}
                  tasks={filteredTasks}
                  onCardClick={handleCardClick}
                  onAddTask={handleAddTask}
                  activeId={activeId}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <TaskCard 
              task={tasks.find(t => t._id === activeId)} 
              onClick={() => {}}
              isDragging={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask._id}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={loadTasks}
        />
      )}

      <TaskCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadTasks}
      />
    </>
  );
}
