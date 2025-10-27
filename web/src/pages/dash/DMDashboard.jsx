// web/src/pages/dash/DMDashboard.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

export default function DMDashboard() {
  const [openTasks, setOpenTasks] = useState(0);
  const [err, setErr] = useState('');

  useEffect(()=> {
    (async ()=>{
      try {
        // if your backend supports a status query, pass 'Open'; otherwise just count all
        // api.listMyTasks() returns { tasks: [...] }
        const resp = await api.listMyTasks();
        const tasks = resp?.tasks || [];
        setOpenTasks(tasks.filter(t => (t.status || '').toLowerCase() !== 'done').length);
        setErr('');
      } catch(e) { setErr(e.message || 'Failed to load'); }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-navy">Digital Marketing — Dashboard</h1>
      {err && <div className="text-red-600">{err}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-royal text-sm">My Open Tasks</div>
          <div className="text-3xl font-extrabold">{openTasks}</div>
        </div>

        {/* Quick links to your existing pages */}
        <a href="/lead-entry" className="bg-white rounded-xl p-4 shadow-sm hover:bg-[#f6f9ff]">
          <div className="text-royal text-sm">Quick Link</div>
          <div className="font-semibold">Lead Entry / CSV</div>
        </a>
        <a href="/dm-metrics" className="bg-white rounded-xl p-4 shadow-sm hover:bg-[#f6f9ff]">
          <div className="text-royal text-sm">Quick Link</div>
          <div className="font-semibold">Cost / Social / SEO</div>
        </a>
      </div>
    </div>
  );
}
