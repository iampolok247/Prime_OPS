// web/src/pages/Dashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

// existing pages we already have
import AccountingDashboard from './AccountingDashboard.jsx';
import RecruitmentDashboard from './RecruitmentDashboard.jsx';
import MGDashboard from './MGDashboard.jsx';

// new lightweight dashboards below
import AdminOverview from './dash/AdminOverview.jsx';
import AdmissionDashboard from './dash/AdmissionDashboard.jsx';
import DMDashboard from './dash/DMDashboard.jsx';
import MyLite from './dash/MyLite.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === 'SuperAdmin' || role === 'Admin') return <AdminOverview />;
  if (role === 'Accountant') return <AccountingDashboard />;
  if (role === 'Recruitment') return <RecruitmentDashboard />;
  if (role === 'MotionGraphics') return <MGDashboard />;
  if (role === 'Admission') return <AdmissionDashboard />;
  if (role === 'DigitalMarketing') return <DMDashboard />;

  // default fallback
  return <MyLite />;
}
