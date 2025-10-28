import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function LeadsCenterView() {
  const [status, setStatus] = useState('All Leads');
  const [leads, setLeads] = useState([]);
  const [err, setErr] = useState(null);

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
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td className="p-4 text-royal/70" colSpan={6}>No leads</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
