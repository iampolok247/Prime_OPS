import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LeadsCenter() {
  const { user } = useAuth();
  const [status, setStatus] = useState('Assigned');
  const [leads, setLeads] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [histLead, setHistLead] = useState(null);
  const [histLoading, setHistLoading] = useState(false);

  const canAssign = user?.role === 'DigitalMarketing';

  const load = async () => {
    try {
  const calls = [status === 'All Leads' ? api.listLeads() : api.listLeads(status)];
      if (canAssign) calls.push(api.listAdmissionUsers());
      const results = await Promise.all(calls);

      const leadsResp = results[0];
      const admissionsResp = canAssign ? results[1] : { users: [] };

      setLeads(leadsResp?.leads || []);
      setAdmissions(admissionsResp?.users || []);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const assign = async (id, assignedTo) => {
    setMsg(null); setErr(null);
    try {
      await api.assignLead(id, assignedTo);
      setMsg('Lead assigned');
      load();
    } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-navy">Leads Center</h1>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded-xl px-3 py-2">
          <option>All Leads</option>
          <option>Assigned</option>
          <option>Counseling</option>
          <option>In Follow Up</option>
          <option>Admitted</option>
          <option>Not Admitted</option>
        </select>
      </div>

      {msg && <div className="mb-2 text-green-700">{msg}</div>}
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
              {(user?.role === 'Admin' || user?.role === 'SuperAdmin' || user?.role === 'Admission' || user?.role === 'DigitalMarketing') && <th className="text-left p-3">History</th>}
              {canAssign && <th className="text-left p-3">Action</th>}
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
                {(user?.role === 'Admin' || user?.role === 'SuperAdmin' || user?.role === 'Admission' || user?.role === 'DigitalMarketing') && (
                  <td className="p-3">
                    <button disabled={histLoading} onClick={async ()=>{
                      try {
                        setErr(null);
                        setHistLoading(true);
                        const res = await api.getLeadHistory(l._id);
                        setHistLead(res.lead || res);
                        setShowHistory(true);
                      } catch (e) { setErr(e.message); }
                      finally { setHistLoading(false); }
                    }} className="px-3 py-1 rounded-xl border hover:bg-[#f3f6ff]">{histLoading ? 'Loading…' : 'History'}</button>
                  </td>
                )}
                {canAssign && (
                  <td className="p-3">
                    <AssignDropdown
                      current={l.assignedTo?._id || ''}
                      options={admissions}
                      onChange={(val) => assign(l._id, val)}
                    />
                  </td>
                )}
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td className="p-4 text-royal/70" colSpan={canAssign ? 7 : 6}>No leads</td></tr>
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
              <div>Assigned At: <strong>{(histLead.assignedAt || histLead.updatedAt) ? new Date(histLead.assignedAt || histLead.updatedAt).toLocaleString() : '-'}</strong></div>
              <div>Counseling At: <strong>{(histLead.counselingAt || histLead.updatedAt) ? new Date(histLead.counselingAt || histLead.updatedAt).toLocaleString() : '-'}</strong></div>
              <div>Admitted At: <strong>{(histLead.admittedAt || histLead.updatedAt) ? new Date(histLead.admittedAt || histLead.updatedAt).toLocaleString() : '-'}</strong></div>
              <div>Follow-ups ({(histLead.followUps||[]).length}):</div>
              <div className="pl-2">
                {(histLead.followUps||[]).length === 0 ? <div className="text-royal/70">No follow-ups</div> : (
                  (histLead.followUps||[]).map((f, i)=> (
                    <div key={i} className="mb-2">
                      <div className="text-sm font-medium">{new Date(f.at).toLocaleString()} {f.by?.name ? ` — ${f.by.name}` : ''}</div>
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

function AssignDropdown({ current, options, onChange }) {
  const [val, setVal] = useState(current || '');
  useEffect(() => setVal(current || ''), [current]);
  return (
    <div className="flex items-center gap-2">
      <select className="border rounded-xl px-3 py-2" value={val} onChange={e=>setVal(e.target.value)}>
        <option value="">Select Admission Member</option>
        {options.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
      </select>
      <button disabled={!val} onClick={()=>onChange(val)} className="px-3 py-1 rounded-lg border hover:bg-[#f3f6ff]">Assign</button>
    </div>
  );
}
