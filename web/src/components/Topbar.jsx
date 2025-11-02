import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Menu, Bell, Calendar } from 'lucide-react';
import { api } from '../lib/api.js';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [urgentTasks, setUrgentTasks] = useState([]);
  const [readNotifications, setReadNotifications] = useState([]);

  // Load read notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('readNotifications');
    if (stored) {
      try {
        setReadNotifications(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse read notifications:', e);
      }
    }
  }, []);

  // Fetch tasks and filter urgent ones
  useEffect(() => {
    const loadUrgentTasks = async () => {
      try {
        const isAdmin = ['SuperAdmin', 'Admin'].includes(user?.role);
        const data = isAdmin ? await api.listAllTasks() : await api.listMyTasks();
        const tasks = data.tasks || [];
        
        // Filter urgent tasks (overdue or due within 3 days)
        const urgent = tasks.filter(task => {
          if (task.status === 'Completed') return false;
          if (!task.dueDate) return false;
          
          const now = new Date();
          const due = new Date(task.dueDate);
          const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
          
          return diffDays <= 3;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        setUrgentTasks(urgent);
      } catch (error) {
        console.error('Failed to load urgent tasks:', error);
      }
    };

    if (user) {
      loadUrgentTasks();
      // Refresh every minute for real-time updates
      const interval = setInterval(loadUrgentTasks, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Clean up old read notifications (older than 7 days)
  useEffect(() => {
    const cleanup = () => {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const filtered = readNotifications.filter(n => n.readAt > sevenDaysAgo);
      if (filtered.length !== readNotifications.length) {
        setReadNotifications(filtered);
        localStorage.setItem('readNotifications', JSON.stringify(filtered));
      }
    };
    cleanup();
  }, [readNotifications]);

  // Get deadline color
  const getDeadlineColor = (dueDate, status) => {
    if (!dueDate || status === 'Completed') return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'Overdue' };
    }
    if (diffDays <= 1) {
      return { bg: 'bg-red-50', text: 'text-red-600', label: diffDays === 0 ? 'Due Today' : 'Due Tomorrow' };
    }
    if (diffDays <= 3) {
      return { bg: 'bg-orange-50', text: 'text-orange-600', label: `${diffDays} days left` };
    }
    return { bg: 'bg-gray-50', text: 'text-gray-600', label: null };
  };

  const PRIORITY_COLORS = {
    'Low': { bg: 'bg-blue-100', text: 'text-blue-600' },
    'Medium': { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    'High': { bg: 'bg-orange-100', text: 'text-orange-600' },
    'Critical': { bg: 'bg-red-100', text: 'text-red-600' }
  };

  const handleTaskClick = (task) => {
    // Mark notification as read
    const newRead = [...readNotifications.filter(n => n.taskId !== task._id), {
      taskId: task._id,
      readAt: Date.now()
    }];
    setReadNotifications(newRead);
    localStorage.setItem('readNotifications', JSON.stringify(newRead));
    
    setShowNotifications(false);
    
    // Store the full task object so TasksKanban can access it
    sessionStorage.setItem('openTaskId', task._id);
    sessionStorage.setItem('openTaskData', JSON.stringify(task));
    
    // Navigate to tasks board
    navigate('/tasks-board');
  };

  // Count unread urgent tasks
  const unreadCount = urgentTasks.filter(task => 
    !readNotifications.some(n => n.taskId === task._id)
  ).length;

  return (
    <header className="h-16 bg-navy text-white flex items-center justify-between px-4 shadow-soft">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-navy/80 rounded-lg transition"
        >
          <Menu size={20} />
        </button>
        
        {/* Logo - smaller on mobile */}
        <div className="px-2">
          <img src="https://primeacademy.org/logo-full.png" alt="Prime Academy" className="h-6 md:h-8 object-contain" />
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-navy/80 rounded-lg transition"
            title="Notifications"
          >
            <Bell size={20} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <>
              {/* Backdrop to close dropdown when clicking outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)}
              />
              
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold text-navy">Urgent Tasks ({urgentTasks.length})</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {urgentTasks.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No urgent tasks
                  </div>
                ) : (
                  <div className="divide-y">
                    {urgentTasks.map(task => {
                      const deadlineColor = getDeadlineColor(task.dueDate, task.status);
                      const isUnread = !readNotifications.some(n => n.taskId === task._id);
                      return (
                        <div 
                          key={task._id}
                          onClick={() => handleTaskClick(task)}
                          className={`p-3 hover:bg-gray-50 cursor-pointer relative ${isUnread ? 'bg-blue-50' : ''}`}
                        >
                          {isUnread && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                          )}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-sm ${isUnread ? 'font-semibold text-navy' : 'font-medium text-gray-700'}`}>
                                {task.title}
                              </p>
                              <div className={`text-xs mt-1 px-2 py-1 rounded inline-flex items-center gap-1 ${deadlineColor?.bg} ${deadlineColor?.text}`}>
                                <Calendar size={10} />
                                {new Date(task.dueDate).toLocaleDateString()}
                                {deadlineColor?.label && ` - ${deadlineColor.label}`}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${PRIORITY_COLORS[task.priority]?.bg} ${PRIORITY_COLORS[task.priority]?.text}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <img src={user?.avatar} alt="avatar" className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-gold object-cover"/>
        
        {/* User info - hidden on small mobile */}
        <div className="hidden sm:block text-sm leading-tight">
          <div className="font-semibold">{user?.name}</div>
          <div className="opacity-80 text-xs">{user?.designation}</div>
        </div>
        
        {/* Profile button - responsive */}
        <a href="/profile" className="hidden md:inline-flex items-center gap-1 bg-gold text-navy px-3 py-2 rounded-2xl hover:bg-lightgold transition text-sm">
          <UserIcon size={16}/> Profile
        </a>
        
        {/* Mobile profile icon */}
        <a href="/profile" className="md:hidden p-2 bg-gold text-navy rounded-full hover:bg-lightgold transition">
          <UserIcon size={16}/>
        </a>
        
        {/* Logout button - responsive */}
        <button onClick={logout} className="hidden md:inline-flex items-center gap-1 bg-white text-navy px-3 py-2 rounded-2xl hover:bg-lightgold transition text-sm">
          <LogOut size={16}/> Logout
        </button>
        
        {/* Mobile logout icon */}
        <button onClick={logout} className="md:hidden p-2 bg-white text-navy rounded-full hover:bg-lightgold transition">
          <LogOut size={16}/>
        </button>
      </div>
    </header>
  );
}
