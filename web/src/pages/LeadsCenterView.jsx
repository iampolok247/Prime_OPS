import React, { useState } from 'react';

export default function LeadsCenterView() {
  const [status, setStatus] = useState('Assigned');
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-navy">Leads Center (View-only)</h1>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded-xl px-3 py-2">
          <option>Assigned</option>
          <option>Counseling</option>
          <option>In-Follow Up</option>
          <option>Admitted</option>
          <option>Not Admitted</option>
        </select>
      </div>
      <div className="bg-white rounded-2xl shadow-soft p-4 text-royal/80">
        Data will appear after Phase 3 (Digital Marketing + Admission pipeline).
      </div>
    </div>
  );
}
