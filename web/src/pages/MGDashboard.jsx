import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function MGDashboard() {
  const [works, setWorks] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  
  // filters
  const [period, setPeriod] = useState('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const resp = await api.listMGWorks().catch(() => ({ works: [] }));
      const allWorks = resp?.works || resp || [];
      setWorks(Array.isArray(allWorks) ? allWorks : []);
      setErr('');
    } catch (e) {
      setErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const parseRange = () => {
    if (period === 'lifetime') return { from: null, to: null };
    if (period === 'custom') {
      if (from && to) {
        const f = new Date(from);
        f.setHours(0, 0, 0, 0);
        const t = new Date(to);
        t.setHours(23, 59, 59, 999);
        return { from: f, to: t };
      }
      return { from: null, to: null };
    }
    const now = new Date();
    let f = new Date();
    if (period === 'daily') { f.setDate(now.getDate() - 1); }
    else if (period === 'weekly') { f.setDate(now.getDate() - 7); }
    else if (period === 'monthly') { f.setMonth(now.getMonth() - 1); }
    else if (period === 'yearly') { f.setFullYear(now.getFullYear() - 1); }
    return { from: f, to: now };
  };

  const inRange = (d, fromD, toD) => {
    if (!d) return false;
    const t = new Date(d).getTime();
    if (fromD && t < fromD.getTime()) return false;
    if (toD && t > toD.getTime()) return false;
    return true;
  };

  const { from: rangeFrom, to: rangeTo } = parseRange();

  const stats = React.useMemo(() => {
    const fromD = rangeFrom ? new Date(rangeFrom) : null;
    const toD = rangeTo ? new Date(rangeTo) : null;

    const worksInRange = works.filter(w => inRange(w.createdAt, fromD, toD) || (!fromD && !toD));

    return {
      total: worksInRange.length,
      queued: worksInRange.filter(w => w.status === 'queued').length,
      inProgress: worksInRange.filter(w => w.status === 'in-progress').length,
      done: worksInRange.filter(w => w.status === 'done').length
    };
  }, [works, rangeFrom, rangeTo]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-navy">Motion Graphics — Dashboard</h1>
      {err && <div className="text-red-600">{err}</div>}
      
      <div className="flex items-center gap-3">
        <select value={period} onChange={e => setPeriod(e.target.value)} className="border rounded-xl px-3 py-2">
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
