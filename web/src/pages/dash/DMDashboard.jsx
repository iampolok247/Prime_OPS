// web/src/pages/dash/DMDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { api, fmtBDT } from '../../lib/api.js';

export default function DMDashboard() {
  const [err, setErr] = useState('');

  // filters
  const [period, setPeriod] = useState('monthly'); // daily, weekly, monthly, yearly, lifetime, custom
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // data
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    loadAll();
  }, []);

  const parseRange = () => {
    if (period === 'lifetime') return { from: null, to: null };
    if (period === 'custom' && from && to) return { from: new Date(from), to: new Date(to) };
    const now = new Date();
    let f = new Date();
    if (period === 'daily') { f.setDate(now.getDate() - 1); }
    else if (period === 'weekly') { f.setDate(now.getDate() - 7); }
    else if (period === 'monthly') { f.setMonth(now.getMonth() - 1); }
    else if (period === 'yearly') { f.setFullYear(now.getFullYear() - 1); }
    return { from: f, to: now };
  };

  async function loadAll() {
    setLoading(true);
    try {
      const [leadsResp, tasksResp, costsResp] = await Promise.all([
        api.listLeads().catch(()=>({ leads: [] })),
        api.listMyTasks().catch(()=>({ tasks: [] })),
        api.listDMCosts().catch(()=>({ items: [] }))
      ]);
      setLeads(leadsResp?.leads || []);
      setTasks(tasksResp?.tasks || []);
      // costs may return { items } or array
      const c = Array.isArray(costsResp) ? costsResp : (costsResp?.items || costsResp?.costs || []);
      setCosts(c || []);
      setErr('');
    } catch(e) {
      setErr(e.message || 'Failed to load dashboard data');
    } finally { setLoading(false); }
  }

  // helpers to filter by date range
  const inRange = (d, fromD, toD) => {
    if (!d) return false;
    const t = new Date(d).getTime();
    if (fromD && t < fromD.getTime()) return false;
    if (toD && t > toD.getTime()) return false;
    return true;
  };

  const { from: rangeFrom, to: rangeTo } = parseRange();

  // computed metrics
  const metrics = useMemo(()=>{
    const fromD = rangeFrom ? new Date(rangeFrom) : null;
    const toD = rangeTo ? new Date(rangeTo) : null;

    const leadsInRange = leads.filter(l => inRange(l.createdAt || l.date || l._id && null, fromD, toD) || (!fromD && !toD));
    // safer: use createdAt mainly
    const totalLeads = leadsInRange.length;

    const sourceCounts = { meta:0, linkedin:0, manual:0, others:0 };
    leadsInRange.forEach(l => {
      const s = (l.source || '').toLowerCase();
      if (s.includes('meta')) sourceCounts.meta++;
      else if (s.includes('linkedin') || s.includes('linked in')) sourceCounts.linkedin++;
      else if (s.includes('manual')) sourceCounts.manual++;
      else sourceCounts.others++;
    });

    const tasksInRange = tasks.filter(t => inRange(t.createdAt || t.createdAt, fromD, toD) || (!fromD && !toD));
  const totalTasksCompleted = tasksInRange.filter(t => (t.status || '').toLowerCase() === 'completed').length;
  const pendingTasks = tasksInRange.filter(t => (t.status || '').toLowerCase() !== 'completed');

    const costsInRange = costs.filter(c => inRange(c.date || c.createdAt, fromD, toD) || (!fromD && !toD));
    const totalExpense = costsInRange.reduce((s, x) => s + (Number(x.amount) || 0), 0);

    // prepare series for line chart: leads per day
    const series = [];
    if (fromD && toD) {
      const cur = new Date(fromD);
      while (cur <= toD) {
        const key = cur.toISOString().slice(0,10);
        const count = leads.filter(l => {
          const d = new Date(l.createdAt || l.date || l._id && null);
          return d && d.toISOString().slice(0,10) === key;
        }).length;
        series.push({ date: key, value: count });
        cur.setDate(cur.getDate()+1);
      }
    }

    // content published count: tasks with category containing 'content' and status completed
    const contentPublished = tasksInRange.filter(t => {
      const cat = (t.category || '').toLowerCase();
      return (cat.includes('content') || cat.includes('published')) && (t.status || '').toLowerCase() === 'completed';
    }).length;

    return { totalLeads, sourceCounts, totalTasksCompleted, totalExpense, series, pendingTasks, contentPublished };
  }, [leads, tasks, costs, rangeFrom, rangeTo]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">Digital Marketing — Dashboard</h1>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e=>setPeriod(e.target.value)} className="border rounded-xl px-3 py-2">
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
              <button onClick={()=>{ if (from && to) setPeriod('custom'); }} className="px-3 py-2 bg-gold rounded-xl">Apply</button>
            </div>
          )}
        </div>
      </div>

      {err && <div className="text-red-600">{err}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="Total Leads" value={metrics.totalLeads} />
        <StatCard title="Leads from Meta" value={metrics.sourceCounts.meta} />
        <StatCard title="Leads from LinkedIn" value={metrics.sourceCounts.linkedin} />
        <StatCard title="Manual Leads" value={metrics.sourceCounts.manual} />
        <StatCard title="Total Expense" value={fmtBDT(metrics.totalExpense)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm text-royal mb-2">Leads Over Time</h3>
          <LineChart data={metrics.series} />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm text-royal mb-2">Lead Source Distribution</h3>
          <PieChart parts={metrics.sourceCounts} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm text-royal mb-2">My Pending Tasks</h3>
          {metrics.pendingTasks && metrics.pendingTasks.length > 0 ? (
            <ul className="space-y-2">
              {metrics.pendingTasks.slice(0,8).map(t => (
                <li key={t._id} className={`p-2 rounded-md border ${new Date(t.deadline) < new Date() ? 'bg-red-50' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{t.title}</div>
                    <div className="text-xs text-royal/70">{new Date(t.deadline).toLocaleDateString()}</div>
                  </div>
                  <div className="text-xs text-royal/60">{t.category || ''} {t.assignedTo?.name ? `• ${t.assignedTo.name}` : ''}</div>
                </li>
              ))}
            </ul>
          ) : <div className="text-royal/70">No pending tasks</div>}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm text-royal mb-2">Total Content Published</h3>
          <div className="text-3xl font-extrabold">{metrics.contentPublished}</div>
          <div className="text-xs text-royal/70 mt-2">(Based on completed tasks with category containing 'content')</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }){
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-royal text-sm">{title}</div>
      <div className="text-2xl font-extrabold mt-1">{value}</div>
    </div>
  );
}

function LineChart({ data }){
  const width = 600, height = 180, padding = 24;
  if (!data || data.length === 0) return <div className="text-royal/70">No data</div>;
  const max = Math.max(...data.map(d=>d.value));
  const stepX = (width - padding*2) / Math.max(1, data.length-1);
  const points = data.map((d,i)=>{
    const x = padding + i*stepX;
    const y = height - padding - (max ? (d.value / max) * (height - padding*2) : 0);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
      <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
      {data.map((d,i)=>{
        const x = padding + i*stepX;
        const y = height - padding - (max ? (d.value / max) * (height - padding*2) : 0);
        return <circle key={d.date} cx={x} cy={y} r={3} fill="#1e40af" />;
      })}
    </svg>
  );
}

function PieChart({ parts }){
  const total = Object.values(parts || {}).reduce((s,n)=>s+(n||0),0);
  const entries = Object.entries(parts || {});
  if (total === 0) return <div className="text-royal/70">No data</div>;
  let acc = 0;
  const size = 120; const cx = size/2; const cy = size/2; const r = size/2 - 2;
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {entries.map(([k,v], idx) => {
          const start = acc/total * Math.PI*2;
          acc += v||0;
          const end = acc/total * Math.PI*2;
          const x1 = cx + r * Math.cos(start - Math.PI/2);
          const y1 = cy + r * Math.sin(start - Math.PI/2);
          const x2 = cx + r * Math.cos(end - Math.PI/2);
          const y2 = cy + r * Math.sin(end - Math.PI/2);
          const large = end - start > Math.PI ? 1 : 0;
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
          const colors = ['#3b82f6','#06b6d4','#f59e0b','#ef4444'];
          return <path key={k} d={path} fill={colors[idx % colors.length]} stroke="#fff" strokeWidth="1" />;
        })}
      </svg>
      <div className="flex flex-col text-sm">
        {entries.map(([k,v], idx)=> (
          <div key={k} className="flex items-center gap-2"><span style={{width:12,height:12,background:['#3b82f6','#06b6d4','#f59e0b','#ef4444'][idx%4]}} className="inline-block rounded-sm"/> <span className="capitalize">{k.replace(/([A-Z])/g,' $1')}</span>: <strong className="ml-1">{v}</strong></div>
        ))}
      </div>
    </div>
  );
}
