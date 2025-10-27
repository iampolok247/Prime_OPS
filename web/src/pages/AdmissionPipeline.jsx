// web/src/pages/AdmissionPipeline.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_TABS = [
  { key: 'Assigned', path: '/admission/assigned', label: 'Assigned Lead' },
  { key: 'Counseling', path: '/admission/counseling', label: 'Counseling' },
  { key: 'In Follow Up', path: '/admission/follow-up', label: 'In Follow-Up' },
  { key: 'Admitted', path: '/admission/admitted', label: 'Admitted' },
  { key: 'Not Admitted', path: '/admission/not-admitted', label: 'Not Admitted' }
];

export default function AdmissionPipeline() {
  const { user } = useAuth();
  const loc = useLocation();

  const active = useMemo(() => {
    const found = STATUS_TABS.find(t => t.path === loc.pathname);
    return found ? found.key : 'Assigned';
  }, [loc.pathname]);

  if (user?.role !== 'Admission' && user?.role !== 'Admin' && user?.role !== 'SuperAdmin') {
    return <div className="text-royal">Access denied</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-3">Admission Pipeline</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map(t => (
          <Link key={t.key} to={t.path}
            className={`px-3 py-1.5 rounded-xl border ${active===t.key ? 'bg-gold text-navy border-gold' : 'hover:bg-[#f3f6ff]'}`}>
            {t.label}
          </Link>
        ))}
        {active === 'Admitted' && user?.role === 'Admission' && (
          <Link to="/admission/fees" className="ml-auto px-3 py-1.5 rounded-xl bg-gold text-navy font-semibold">Admission Fees</Link>
        )}
      </div>
      <PipelineTable status={active} canAct={user?.role === 'Admission'} />
    </div>
  );
}

function PipelineTable({ status, canAct }) {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const { leads } = await api.listAdmissionLeads(status);
      setRows(leads || []);
      setErr(null);
    } catch (e) { setErr(e.message); }
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const act = async (id, action) => {
    setMsg(null); setErr(null);
    try {
      await api.updateLeadStatus(id, action);
      setMsg(`Status updated to ${action}`);
      load();
    } catch (e) { setErr(e.message); }
  };

  const actions = (row) => {
    if (!canAct) return null;
    if (status === 'Assigned') {
      return <ActionBtn onClick={()=>act(row._id,'Counseling')}>Start Counseling</ActionBtn>;
    }
    if (status === 'Counseling') {
      return (
        <div className="flex gap-2">
          <ActionBtn onClick={()=>act(row._id,'Admitted')}>Admitted</ActionBtn>
          <ActionBtn onClick={()=>act(row._id,'In Follow Up')}>Follow-Up</ActionBtn>
          <ActionBtn variant="danger" onClick={()=>act(row._id,'Not Admitted')}>Not Admitted</ActionBtn>
        </div>
      );
    }
    if (status === 'In Follow Up') {
      return (
        <div className="flex gap-2">
          <ActionBtn onClick={()=>act(row._id,'Admitted')}>Admitted</ActionBtn>
          <ActionBtn variant="danger" onClick={()=>act(row._id,'Not Admitted')}>Not Admitted</ActionBtn>
        </div>
      );
    }
    return <span className="text-royal/60">—</span>;
  };

  return (
    <div>
      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      {err && <div className="mb-2 text-red-600">{err}</div>}
      <div className="bg-white rounded-2xl shadow-soft overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f3f6ff] text-royal">
            <tr>
              <th className="p-3 text-left">Lead ID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Phone / Email</th>
              <th className="p-3 text-left">Course</th>
              <th className="p-3 text-left">Source</th>
              <th className="p-3 text-left">Assigned To</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r._id} className="border-t">
                <td className="p-3">{r.leadId}</td>
                <td className="p-3">{r.name}</td>
                <td className="p-3">
                  <div>{r.phone}</div>
                  <div className="text-xs text-royal/70">{r.email || '-'}</div>
                </td>
                <td className="p-3">{r.interestedCourse || '-'}</td>
                <td className="p-3">{r.source}</td>
                <td className="p-3">{r.assignedTo ? r.assignedTo.name : '-'}</td>
                <td className="p-3">{actions(r)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-4 text-royal/70" colSpan="7">No leads</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, variant = 'default' }) {
  const cls =
    variant === 'danger'
      ? 'px-3 py-1 rounded-lg border text-red-700 hover:bg-red-50'
      : 'px-3 py-1 rounded-lg border hover:bg-[#f3f6ff]';
  return <button onClick={onClick} className={cls}>{children}</button>;
}
