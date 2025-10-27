import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function MGDashboard() {
  const [stats, setStats] = useState({ total:0, done:0, inProgress:0, queued:0 });
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try { setStats(await api.mgStats()); }
      catch (e) { setErr(e.message || 'Failed to load'); }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-navy">Motion Graphics — Dashboard</h1>
      {err && <div className="text-red-600">{err}</div>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { k:'total', label:'Total' },
          { k:'queued', label:'Queued' },
          { k:'inProgress', label:'In Progress' },
          { k:'done', label:'Done' }
        ].map(x => (
          <div key={x.k} className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-royal text-sm">{x.label}</div>
            <div className="text-3xl font-extrabold">{stats[x.k] ?? 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
