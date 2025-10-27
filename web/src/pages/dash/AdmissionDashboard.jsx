// web/src/pages/dash/AdmissionDashboard.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const STATUSES = [
  { key:'assigned', label:'Assigned' },
  { key:'counseling', label:'Counseling' },
  { key:'follow-up', label:'In Follow-Up' },
  { key:'admitted', label:'Admitted' },
  { key:'not-admitted', label:'Not Admitted' },
];

export default function AdmissionDashboard() {
  const [counts, setCounts] = useState({});
  const [err, setErr] = useState('');

  useEffect(()=> {
    (async ()=>{
      try {
        const entries = await Promise.all(
          STATUSES.map(s => api.listAdmissionLeads(s.key).catch(()=>[]))
        );
        const map = {};
        STATUSES.forEach((s, i)=> { map[s.key] = (entries[i]||[]).length; });
        setCounts(map); setErr('');
      } catch(e) { setErr(e.message || 'Failed to load'); }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-navy">Admission — Dashboard</h1>
      {err && <div className="text-red-600">{err}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {STATUSES.map(s=>(
          <div key={s.key} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-royal text-sm">{s.label}</div>
            <div className="text-3xl font-extrabold">{counts[s.key] ?? 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
