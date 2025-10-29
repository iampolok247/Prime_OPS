import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

function fmtDT(d){ if (!d) return '-'; try { return new Date(d).toLocaleString(); } catch { return d; } }

export default function LeadsCenterView() {
  const { user } = useAuth();
  const [status, setStatus] = useState('All Leads');
  const [leads, setLeads] = useState([]);
  const [err, setErr] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [histLead, setHistLead] = useState(null);

  const load = async () => {
    try {
      const q = (status === 'All Leads') ? undefined : status;
      const res = await api.listLeads(q);
      setLeads(res?.leads || []);
      setErr(null);
    } catch (e) { setErr(e.message); }
  };

  useEffect(()=>{ load(); }, [status]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-navy">Leads Center (View-only)</h1>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded-xl px-3 py-2">
          <option>All Leads</option>
          <option>Assigned</option>
          <option>Counseling</option>
          <option>In Follow Up</option>
          <option>Admitted</option>
          <option>Not Admitted</option>
        </select>
      </div>

      {err && <div className="mb-2 text-red-600">{err}</div>}

      <div className="bg-white rounded-2xl shadow-soft overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f3f6ff] text-royal">
            <tr>
              <th className="text-left p-3">Lead ID</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Phone / Email</th>
              <th className="text-left p-3">Interested Course</th>
              <th className="text-left p-3">Source</th>
              <th className="text-left p-3">Assigned To</th>
              {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && <th className="text-left p-3">History</th>}
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l._id} className="border-t">
                <td className="p-3">{l.leadId}</td>
                <td className="p-3">{l.name}</td>
                <td className="p-3">
                  <div>{l.phone}</div>
                  <div className="text-xs text-royal/70">{l.email || '-'}</div>
                </td>
                <td className="p-3">{l.interestedCourse || '-'}</td>
                <td className="p-3">{l.source}</td>
                <td className="p-3">{l.assignedTo ? `${l.assignedTo.name} (${l.assignedTo.role})` : '-'}</td>
                {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
                  <td className="p-3">
                    <button onClick={()=>{ setHistLead(l); setShowHistory(true); }} className="px-3 py-1 rounded-xl border hover:bg-[#f3f6ff]">History</button>
                  </td>
                )}
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td className="p-4 text-royal/70" colSpan={6}>No leads</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {showHistory && histLead && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-30" onClick={()=>setShowHistory(false)} />
          <div className="bg-white rounded-xl p-4 z-10 w-full max-w-2xl shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Lead History — {histLead.leadId}</h3>
            <div className="grid grid-cols-1 gap-2">
              <div>Assigned At: <strong>{fmtDT(histLead.assignedAt || histLead.updatedAt)}</strong></div>
              <div>Counseling At: <strong>{fmtDT(histLead.counselingAt)}</strong></div>
              <div>Admitted At: <strong>{fmtDT(histLead.admittedAt)}</strong></div>
              <div>Follow-ups ({(histLead.followUps||[]).length}):</div>
              <div className="pl-2">
                {(histLead.followUps||[]).length === 0 ? <div className="text-royal/70">No follow-ups</div> : (
                  (histLead.followUps||[]).map((f, i)=> (
                    <div key={i} className="mb-2">
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
    </div>
  );
}
