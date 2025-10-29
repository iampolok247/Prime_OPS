// web/src/pages/dash/AdmissionDashboard.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

function fmtDT(d){ if (!d) return '-'; try { return new Date(d).toLocaleString(); } catch { return d; } }

function LineChartDualSmall({ data }){
  const width = 700, height = 180, padding = 24;
  if (!data || data.length === 0) return <div className="text-royal/70">No data</div>;
  const max = Math.max(...data.map(d=>Math.max(d.leads||0,d.admitted||0)));
  const stepX = (width - padding*2) / Math.max(1, data.length-1);
  const leadsPoints = data.map((d,i)=>`${padding + i*stepX},${height - padding - (max ? (d.leads / max) * (height - padding*2) : 0)}`).join(' ');
  const admittedPoints = data.map((d,i)=>`${padding + i*stepX},${height - padding - (max ? (d.admitted / max) * (height - padding*2) : 0)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
      <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={leadsPoints} />
      <polyline fill="none" stroke="#10b981" strokeWidth="2" points={admittedPoints} />
    </svg>
  );
}

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
  const [range, setRange] = useState({ period: 'monthly', from: new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10), to: new Date().toISOString().slice(0,10) });
  const [series, setSeries] = useState([]);

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

  // load series for chart based on range
  useEffect(()=>{
    (async ()=>{
      try {
        // fetch all leads once and compute series on client
        const { leads } = await api.listAdmissionLeads();
        const from = range.from ? new Date(range.from) : null;
        const to = range.to ? new Date(range.to) : null;
        // create date keys between from and to
        let dates = [];
        if (!from || !to) { setSeries([]); return; }
        const cur = new Date(from);
        while (cur <= to) { dates.push(new Date(cur)); cur.setDate(cur.getDate()+1); }
        const s = dates.map(d=>{
          const key = d.toISOString().slice(0,10);
          const leadsCount = (leads || []).filter(l=> new Date(l.createdAt).toISOString().slice(0,10) === key).length;
          const admittedCount = (leads || []).filter(l=> l.admittedAt && new Date(l.admittedAt).toISOString().slice(0,10) === key).length;
          return { date: key, leads: leadsCount, admitted: admittedCount };
        });
        setSeries(s);
      } catch (e) { /* ignore chart errors */ }
    })();
  }, [range]);

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

      <div className="mt-4 bg-white rounded-xl p-4">
        <div className="flex items-end gap-3 mb-3">
          <div>
            <label className="block text-sm text-royal mb-1">Period</label>
            <select value={range.period} onChange={e=>{
              const p = e.target.value;
              // compute default from/to for non-custom
              if (p !== 'custom') {
                const now = new Date();
                let f = new Date();
                if (p === 'daily') f.setDate(now.getDate() - 1);
                else if (p === 'weekly') f.setDate(now.getDate() - 7);
                else if (p === 'monthly') f.setMonth(now.getMonth() - 1);
                else if (p === 'yearly') f.setFullYear(now.getFullYear() - 1);
                setRange({ period: p, from: f.toISOString().slice(0,10), to: now.toISOString().slice(0,10) });
              } else {
                setRange(r=>({...r, period: 'custom'}));
              }
            }} className="input">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {range.period === 'custom' && (
            <>
              <div>
                <label className="block text-sm text-royal mb-1">From</label>
                <input type="date" className="border rounded-xl px-3 py-2" value={range.from} onChange={e=>setRange(r=>({...r,from:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm text-royal mb-1">To</label>
                <input type="date" className="border rounded-xl px-3 py-2" value={range.to} onChange={e=>setRange(r=>({...r,to:e.target.value}))} />
              </div>
            </>
          )}
        </div>
        <div>
          <h4 className="text-sm text-royal mb-2">Leads vs Admitted</h4>
          <LineChartDualSmall data={series} />
        </div>
      </div>
    </div>
  );
}
