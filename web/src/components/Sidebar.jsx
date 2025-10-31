// web/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LayoutDashboard, ListChecks, Users, BookOpen, FolderOpen, Wallet, BarChart2, Film, CreditCard, Menu, X } from 'lucide-react';

const Item = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-2 px-4 py-2 rounded-xl mx-3 my-1 ${
        isActive ? 'bg-[#e6eeff] text-navy' : 'text-royal hover:bg-[#f3f6ff]'
      }`
    }
  >
    {icon}<span>{label}</span>
  </NavLink>
);

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();

  const MENU_BY_ROLE = {
    SuperAdmin: [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
      { to: '/assign-tasks', label: 'Assign Task', icon: <ListChecks size={18}/> },
      { to: '/employees', label: 'Employee ', icon: <Users size={18}/> },
      { to: '/courses', label: 'Courses ', icon: <BookOpen size={18}/> },
      { to: '/leads-center-view', label: 'Leads Center ', icon: <FolderOpen size={18}/> },     
      { to: '/admission/dashboard', label: 'Admission Reports', icon: <FolderOpen size={18}/> },
      { to: '/recruitment', label: 'Recruitment Reports', icon: <LayoutDashboard size={18}/> },
      { to: '/accounting/dashboard', label: 'Accounts Dashboard', icon: <Wallet size={18}/> },
      { to: '/dm/dashboard', label: 'Digital Marketing Reports', icon: <BarChart2 size={18}/> },
      { to: '/mg/dashboard', label: 'Motion Graphics Report', icon: <Film size={18}/> },
    ],
    Admin: [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
      { to: '/assign-tasks', label: 'Assign Task', icon: <ListChecks size={18}/> },
      { to: '/my-tasks', label: 'My Task', icon: <ListChecks size={18}/> },
      { to: '/employees', label: 'Employee', icon: <Users size={18}/> },
      { to: '/leads-center-view', label: 'Leads Center ', icon: <FolderOpen size={18}/> },
      { to: '/courses', label: 'Courses ', icon: <BookOpen size={18}/> },
      { to: '/admission/dashboard', label: 'Admission Reports', icon: <FolderOpen size={18}/> },
      { to: '/recruitment', label: 'Recruitment Reports', icon: <LayoutDashboard size={18}/> },
      { to: '/accounting/dashboard', label: 'Accounts Dashboard', icon: <Wallet size={18}/> },
      { to: '/dm/dashboard', label: 'Digital Marketing Reports', icon: <BarChart2 size={18}/> },
      { to: '/mg/dashboard', label: 'Motion Graphics Report', icon: <Film size={18}/> },
    ],
    DigitalMarketing: [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
      { to: '/my-tasks', label: 'My Task', icon: <ListChecks size={18}/> },
      { to: '/courses', label: 'Courses', icon: <BookOpen size={18}/> },
      { to: '/lead-entry', label: 'Lead Entry / CSV', icon: <FolderOpen size={18}/> },
      { to: '/leads-center', label: 'Leads Center', icon: <FolderOpen size={18}/> },
  { to: '/dm-metrics', label: 'Cost / Social / SEO', icon: <BarChart2 size={18}/> }
    ],
    Admission: [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
      { to: '/my-tasks', label: 'My Task', icon: <ListChecks size={18}/> },
      { to: '/courses', label: 'Courses', icon: <BookOpen size={18}/> },
      { to: '/admission/assigned', label: 'Assigned Lead', icon: <FolderOpen size={18}/> },
      { to: '/admission/counseling', label: 'Counseling', icon: <FolderOpen size={18}/> },
      { to: '/admission/follow-up', label: 'In Follow-Up', icon: <FolderOpen size={18}/> },
      { to: '/admission/admitted', label: 'Admitted', icon: <FolderOpen size={18}/> },
      { to: '/admission/not-admitted', label: 'Not Admitted', icon: <FolderOpen size={18}/> },
      { to: '/admission/fees', label: 'Admission Fees', icon: <FolderOpen size={18}/> }
    ],
    Accountant: [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
      { to: '/my-tasks', label: 'My Task', icon: <ListChecks size={18}/> },
      { to: '/accounting/dashboard', label: 'Accounts Dashboard', icon: <Wallet size={18}/> },
      { to: '/accounting/fees', label: 'Fees Approval', icon: <FolderOpen size={18}/> },
      { to: '/accounting/income', label: 'Income', icon: <FolderOpen size={18}/> },
      { to: '/accounting/expense', label: 'Expense', icon: <FolderOpen size={18}/> }
    ],
    // make employee accounts also easily reachable by accountant
    AccountantExtra: [
      { to: '/employee-accounts/bank', label: 'Employee Bank Account', icon: <CreditCard size={18}/> },
      { to: '/employee-accounts/salary', label: 'Employee Salary', icon: <Wallet size={18}/> }
    ],
    Recruitment: [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
      { to: '/my-tasks', label: 'My Task', icon: <ListChecks size={18}/> },
      { to: '/courses', label: 'Courses', icon: <BookOpen size={18}/> },

      // --- Recruitment core menu ---
      { to: '/recruitment', label: 'Recruitment Dashboard', icon: <LayoutDashboard size={18}/> },
      { to: '/recruitment/candidates', label: 'Candidates', icon: <Users size={18}/> },
      { to: '/recruitment/jobs', label: 'Job Positions', icon: <FolderOpen size={18}/> },
      { to: '/recruitment/employers', label: 'Employers', icon: <FolderOpen size={18}/> },
      { to: '/recruitment/income', label: 'Recruitment Income', icon: <Wallet size={18}/> },
      { to: '/recruitment/expenses', label: 'Recruitment Expense', icon: <Wallet size={18}/> },
    ],
    
MotionGraphics: [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
  { to: '/my-tasks', label: 'My Task', icon: <ListChecks size={18}/> },
  { to: '/courses', label: 'Courses', icon: <BookOpen size={18}/> },
  { to: '/mg/production', label: 'Production Log', icon: <FolderOpen size={18}/> }
],
  };

  let items = MENU_BY_ROLE[user?.role] || [];
  // merge accountant extra links when role is Accountant
  if (user?.role === 'Accountant' && Array.isArray(MENU_BY_ROLE.AccountantExtra)) {
    items = [...items, ...MENU_BY_ROLE.AccountantExtra];
  }

  const closeSidebar = () => setIsOpen && setIsOpen(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-72 hidden md:flex bg-white border-r min-h-screen sticky top-0 flex-col">
        <div className="px-4 py-4"><img src="https://primeacademy.org/logo-full.png" alt="Prime Academy" className="w-40 object-contain"/></div>
        <nav className="flex-1">
          {items.map((m) => <Item key={m.to} {...m} />)}
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50" onClick={closeSidebar}></div>
          
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl flex flex-col transform transition-transform">
            <div className="flex items-center justify-between p-4 border-b">
              <img src="https://primeacademy.org/logo-full.png" alt="Prime Academy" className="w-32 object-contain"/>
              <button onClick={closeSidebar} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-600"/>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto">
              {items.map((m) => <Item key={m.to} {...m} onClick={closeSidebar} />)}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
