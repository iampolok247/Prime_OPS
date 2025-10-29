import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function MGDashboard() {
  const [stats, setStats] = useState({ total:0, done:0, inProgress:0, queued:0 });
  const [err, setErr] = useState('');
  // filters
  const [period, setPeriod] = useState('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    (async () => {
      try { setStats(await api.mgStats()); }
      catch (e) { setErr(e.message || 'Failed to load'); }
    })();
  }, []);
  
  useEffect(() => {
    (async () => {
      try { setStats(await api.mgStats()); }
      catch (e) { setErr(e.message || 'Failed to load'); }
    })();
  }, [period, from, to]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-navy">Motion Graphics — Dashboard</h1>
      <div className="flex items-center gap-3">
        <select value={period} onChange={e=>{
          const p = e.target.value; setPeriod(p);
          if (p !== 'custom') {
            const now = new Date(); let f = new Date();
            if (p === 'daily') f.setDate(now.getDate()-1);
            else if (p === 'weekly') f.setDate(now.getDate()-7);
            else if (p === 'monthly') f.setMonth(now.getMonth()-1);
            else if (p === 'yearly') f.setFullYear(now.getFullYear()-1);
            setFrom(f.toISOString().slice(0,10)); setTo(now.toISOString().slice(0,10));
          }
        }} className="border rounded-xl px-3 py-2">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="lifetime">Lifetime</option>
          <option value="custom">Custom</option>
        </select>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded-xl px-3 py-2" />
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded-xl px-3 py-2" />
          </div>
        )}
      </div>
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
