// web/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import Topbar from './components/Topbar.jsx';
import Sidebar from './components/Sidebar.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import AssignTasks from './pages/AssignTasks.jsx';
import MyTasks from './pages/MyTasks.jsx';
import Employees from './pages/Employees.jsx';
import Courses from './pages/Courses.jsx';
import ReportsView from './pages/ReportsView.jsx';
import LeadsCenterView from './pages/LeadsCenterView.jsx';

import LeadEntry from './pages/LeadEntry.jsx';
import LeadsCenter from './pages/LeadsCenter.jsx';
import DMMetrics from './pages/DMMetrics.jsx';
import DMDashboard from './pages/dash/DMDashboard.jsx';

import AdmissionPipeline from './pages/AdmissionPipeline.jsx';
import AdmissionFees from './pages/AdmissionFees.jsx';

import AccountingDashboard from './pages/AccountingDashboard.jsx';
import FeesApproval from './pages/FeesApproval.jsx';
import IncomePage from './pages/Income.jsx';
import ExpensePage from './pages/Expense.jsx';
import AdmissionDashboard from './pages/dash/AdmissionDashboard.jsx';

// === Recruitment pages ===
import RecruitmentDashboard from './pages/RecruitmentDashboard.jsx';
import Candidates from './pages/Candidates.jsx';
import JobPositions from './pages/JobPositions.jsx';
import Employers from './pages/Employers.jsx';
import RecruitIncome from './pages/RecruitIncome.jsx';
import RecruitExpenses from './pages/RecruitExpenses.jsx';

// === Motion Graphics pages ===
import MGDashboard from './pages/MGDashboard.jsx';
import MGProduction from './pages/MGProduction.jsx';

function Layout() {
  return (
    <div className="min-h-screen flex bg-[#f7f9fc]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-tasks" element={<MyTasks />} />

          {/* SA/Admin */}
          <Route element={<RoleRoute roles={['SuperAdmin', 'Admin']} />}>
            <Route path="/assign-tasks" element={<AssignTasks />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/reports-view" element={<ReportsView />} />
            <Route path="/leads-center-view" element={<LeadsCenterView />} />
          </Route>

          {/* Digital Marketing */}
          <Route element={<RoleRoute roles={['DigitalMarketing']} />}>
            <Route path="/lead-entry" element={<LeadEntry />} />
            <Route path="/leads-center" element={<LeadsCenter />} />
            <Route path="/dm-metrics" element={<DMMetrics />} />
          </Route>

          {/* Digital Marketing dashboard (viewable by DM + Admin/SA) */}
          <Route element={<RoleRoute roles={['DigitalMarketing','Admin','SuperAdmin']} />}>
            <Route path="/dm/dashboard" element={<DMDashboard />} />
          </Route>

          {/* Admission */}
         <Route element={<RoleRoute roles={['Admission','Admin','SuperAdmin']} />}>
         <Route path="/admission/dashboard" element={<AdmissionDashboard />} />   {/* <-- NEW */}
         <Route path="/admission/assigned" element={<AdmissionPipeline />} />
         <Route path="/admission/counseling" element={<AdmissionPipeline />} />
         <Route path="/admission/follow-up" element={<AdmissionPipeline />} />
         <Route path="/admission/admitted" element={<AdmissionPipeline />} />
         <Route path="/admission/not-admitted" element={<AdmissionPipeline />} />
         <Route path="/admission/fees" element={<AdmissionFees />} />
</Route>

          {/* Accountant */}
          <Route element={<RoleRoute roles={['Accountant']} />}>
            <Route path="/accounting/dashboard" element={<AccountingDashboard />} />
            <Route path="/accounting/fees" element={<FeesApproval />} />
            <Route path="/accounting/income" element={<IncomePage />} />
            <Route path="/accounting/expense" element={<ExpensePage />} />
          </Route>

          {/* Motion Graphics */}
          <Route element={<RoleRoute roles={['MotionGraphics','Admin','SuperAdmin']} />}>
            <Route path="/mg/dashboard" element={<MGDashboard />} />
            <Route path="/mg/production" element={<MGProduction />} />
          </Route>

          {/* Recruitment */}
          <Route element={<RoleRoute roles={['Recruitment','Admin','SuperAdmin']} />}>
            <Route path="/recruitment" element={<RecruitmentDashboard />} />
            <Route path="/recruitment/candidates" element={<Candidates />} />
            <Route path="/recruitment/jobs" element={<JobPositions />} />
            <Route path="/recruitment/employers" element={<Employers />} />
            <Route path="/recruitment/income" element={<RecruitIncome />} />
            <Route path="/recruitment/expenses" element={<RecruitExpenses />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
