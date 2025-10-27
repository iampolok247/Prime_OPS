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

  const canAssign = user?.role === 'DigitalMarketing';

  const load = async () => {
    try {
      const calls = [api.listLeads(status)];
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
