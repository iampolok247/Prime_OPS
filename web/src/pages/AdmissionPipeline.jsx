// web/src/pages/AdmissionPipeline.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

function fmtDT(d){ if (!d) return '-'; try { return new Date(d).toLocaleString(); } catch { return d; } }

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
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followNote, setFollowNote] = useState('');
  const [followTarget, setFollowTarget] = useState(null);
  const [showNotAdmitModal, setShowNotAdmitModal] = useState(false);
  const [notAdmitNote, setNotAdmitNote] = useState('');
  const [notAdmitTarget, setNotAdmitTarget] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [histLead, setHistLead] = useState(null);
  const [histLoading, setHistLoading] = useState(false);

  const load = async () => {
    try {
      const { leads } = await api.listAdmissionLeads(status);
      setRows(leads || []);
      setErr(null);
    } catch (e) { setErr(e.message); }
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const act = async (id, action, notes) => {
    setMsg(null); setErr(null);
    try {
      await api.updateLeadStatus(id, action, notes);
      setMsg(`Status updated to ${action}`);
      setShowFollowModal(false);
      setFollowNote(''); setFollowTarget(null);
      setShowNotAdmitModal(false); setNotAdmitNote(''); setNotAdmitTarget(null);
      setShowHistory(false); setHistLead(null); setHistLoading(false);
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
          <ActionBtn onClick={()=>{ setFollowTarget(row._id); setFollowNote(''); setShowFollowModal(true); }}>Follow-Up</ActionBtn>
          <ActionBtn variant="danger" onClick={()=>{ setNotAdmitTarget(row._id); setNotAdmitNote(''); setShowNotAdmitModal(true); }}>Not Admitted</ActionBtn>
          <ActionBtn onClick={async ()=>{
            try {
              setErr(null);
              setHistLoading(true);
              const res = await api.getLeadHistory(row._id);
              setHistLead(res.lead || res);
              setShowHistory(true);
            } catch (e) { setErr(e.message); }
            finally { setHistLoading(false); }
          }}>{histLoading ? 'Loading…' : 'History'}</ActionBtn>
        </div>
      );
    }
    if (status === 'In Follow Up') {
        return (
          <div className="flex gap-2">
            <ActionBtn onClick={()=>act(row._id,'Admitted')}>Admitted</ActionBtn>
            <ActionBtn onClick={()=>{ setFollowTarget(row._id); setFollowNote(''); setShowFollowModal(true); }}>Follow-Up Again</ActionBtn>
            <ActionBtn variant="danger" onClick={()=>{ setNotAdmitTarget(row._id); setNotAdmitNote(''); setShowNotAdmitModal(true); }}>Not Admitted</ActionBtn>
            <ActionBtn onClick={async ()=>{
              try {
                setErr(null);
                setHistLoading(true);
                const res = await api.getLeadHistory(row._id);
                setHistLead(res.lead || res);
                setShowHistory(true);
              } catch (e) { setErr(e.message); }
              finally { setHistLoading(false); }
            }}>{histLoading ? 'Loading…' : 'History'}</ActionBtn>
          </div>
        );
    }
    return <span className="text-royal/60">—</span>;
  };

  return (
    <div>
      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      {err && <div className="mb-2 text-red-600">{err}</div>}
      {showFollowModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-30" onClick={()=>setShowFollowModal(false)} />
          <div className="bg-white rounded-xl p-4 z-10 w-full max-w-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Add Follow-Up Note</h3>
            <textarea rows={6} className="w-full border rounded-xl px-3 py-2 mb-3" value={followNote} onChange={e=>setFollowNote(e.target.value)} placeholder="Enter follow-up note (optional)" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>{ setShowFollowModal(false); setFollowNote(''); setFollowTarget(null); }} className="px-3 py-2 rounded-xl border">Cancel</button>
              <button type="button" onClick={()=>act(followTarget,'In Follow Up', followNote)} className="px-3 py-2 rounded-xl bg-gold text-navy">Save Follow-Up</button>
            </div>
          </div>
        </div>
      )}
      {showHistory && histLead && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-30" onClick={()=>setShowHistory(false)} />
          <div className="bg-white rounded-xl p-4 z-10 w-full max-w-2xl shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Lead History — {histLead.leadId}</h3>
            <div className="grid grid-cols-1 gap-2">
              <div>Assigned At: <strong>{fmtDT(histLead.assignedAt || histLead.updatedAt)}</strong></div>
              <div>Counseling At: <strong>{fmtDT(histLead.counselingAt || histLead.updatedAt)}</strong></div>
              <div>Admitted At: <strong>{fmtDT(histLead.admittedAt || histLead.updatedAt)}</strong></div>
              <div>Follow-ups ({(histLead.followUps||[]).length}):</div>
              <div className="pl-2">
                {(histLead.followUps||[]).length === 0 ? <div className="text-royal/70">No follow-ups</div> : (
                  (histLead.followUps||[]).map((f, idx)=> (
                    <div key={idx} className="mb-2">
                      <div className="text-sm font-medium">{fmtDT(f.at)} {f.by?.name ? ` — ${f.by.name}` : ''}</div>
                      <div className="text-royal/70">{f.note || '-'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="mt-4 text-right">
              <button onClick={()=>setShowHistory(false)} className="px-3 py-2 rounded-xl border">Close</button>
            </div>
          </div>
        </div>
      )}
      {showNotAdmitModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-30" onClick={()=>setShowNotAdmitModal(false)} />
          <div className="bg-white rounded-xl p-4 z-10 w-full max-w-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Reason for Not Admitted</h3>
            <textarea rows={6} className="w-full border rounded-xl px-3 py-2 mb-3" value={notAdmitNote} onChange={e=>setNotAdmitNote(e.target.value)} placeholder="Enter reason (optional)" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>{ setShowNotAdmitModal(false); setNotAdmitNote(''); setNotAdmitTarget(null); }} className="px-3 py-2 rounded-xl border">Cancel</button>
              <button type="button" onClick={()=>act(notAdmitTarget,'Not Admitted', notAdmitNote)} className="px-3 py-2 rounded-xl bg-red-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
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
          {status === 'Assigned' && <th className="p-3 text-left">Assigned At</th>}
          {status === 'Counseling' && <th className="p-3 text-left">Counseling At</th>}
          {status === 'In Follow Up' && <th className="p-3 text-left">Follow-Ups</th>}
          {status === 'Admitted' && <th className="p-3 text-left">Admitted At</th>}
            <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r._id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div>{r.leadId}</div>
                    {((r.followUps||[]).length > 0) && (
                      <div className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{(r.followUps||[]).length} FU</div>
                    )}
                  </div>
                </td>
                <td className="p-3">{r.name}</td>
                <td className="p-3">
                  <div>{r.phone}</div>
                  <div className="text-xs text-royal/70">{r.email || '-'}</div>
                </td>
                <td className="p-3">{r.interestedCourse || '-'}</td>
                <td className="p-3">{r.source}</td>
                <td className="p-3">{r.assignedTo ? r.assignedTo.name : '-'}</td>
                {status === 'Assigned' && <td className="p-3">{fmtDT(r.assignedAt || r.updatedAt)}</td>}
                {status === 'Counseling' && <td className="p-3">{fmtDT(r.counselingAt || r.updatedAt)}</td>}
                {status === 'In Follow Up' && <td className="p-3">
                  {((r.followUps||[]).length === 0) ? <div className="text-royal/70">No follow-ups</div> : (
                    <div className="flex flex-col gap-1">
                      {(r.followUps||[]).map((f,idx)=> (
                        <div key={idx} className="text-xs">
                          <div className="font-medium">{fmtDT(f.at)}</div>
                          <div className="text-royal/70">{f.note || '-'} {f.by?.name ? ` — ${f.by.name}` : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </td>}
                {status === 'Admitted' && <td className="p-3">{fmtDT(r.admittedAt || r.updatedAt)}</td>}
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
