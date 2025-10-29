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
  { key:'Assigned', label:'Assigned' },
  { key:'Counseling', label:'Counseling' },
  { key:'In Follow Up', label:'In Follow-Up' },
  { key:'Admitted', label:'Admitted' },
  { key:'Not Admitted', label:'Not Admitted' },
];

export default function AdmissionDashboard() {
  const [err, setErr] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all leads once
  useEffect(()=> {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      // Fetch all leads without status filter to get complete dataset
      const resp = await api.listAdmissionLeads().catch(()=>({ leads: [] }));
      const leads = resp?.leads || resp || [];
      setAllLeads(Array.isArray(leads) ? leads : []);
      setErr('');
    } catch(e) { 
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
      // If custom selected but dates not set yet, return null to show all data
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

  const metrics = React.useMemo(() => {
    const fromD = rangeFrom ? new Date(rangeFrom) : null;
    const toD = rangeTo ? new Date(rangeTo) : null;

    const leadsInRange = allLeads.filter(l => inRange(l.createdAt, fromD, toD) || (!fromD && !toD));

    const counts = {};
    // "Assigned" card shows TOTAL leads created in the period (all statuses)
    counts['Assigned'] = leadsInRange.length;
    
    // Other cards show current status counts
    STATUSES.forEach(s => {
      if (s.key !== 'Assigned') {
        counts[s.key] = leadsInRange.filter(l => l.status === s.key).length;
      }
    });

    // Compute series for chart
    const series = [];
    if (fromD && toD) {
      const cur = new Date(fromD);
      while (cur <= toD) {
        const key = cur.toISOString().slice(0,10);
        const leadsCount = allLeads.filter(l => {
          const d = new Date(l.createdAt);
          return d && d.toISOString().slice(0,10) === key;
        }).length;
        const admittedCount = allLeads.filter(l => {
          const d = l.admittedAt ? new Date(l.admittedAt) : null;
          return d && d.toISOString().slice(0,10) === key;
        }).length;
        series.push({ date: key, leads: leadsCount, admitted: admittedCount });
        cur.setDate(cur.getDate()+1);
      }
    }

    return { counts, series };
  }, [allLeads, rangeFrom, rangeTo]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-navy">Admission — Dashboard</h1>
      {err && <div className="text-red-600">{err}</div>}

      {/* Period Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate">Range</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="border rounded-xl px-3 py-2">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {period === 'custom' && (
            <>
              <input type="date" className="border rounded-xl px-3 py-2" value={from} onChange={e => setFrom(e.target.value)} />
              <input type="date" className="border rounded-xl px-3 py-2" value={to} onChange={e => setTo(e.target.value)} />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {STATUSES.map(s=>(
          <div key={s.key} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-royal text-sm">{s.label}</div>
            <div className="text-3xl font-extrabold">{metrics.counts[s.key] ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h4 className="text-sm text-royal mb-2">Leads vs Admitted</h4>
        <LineChartDualSmall data={metrics.series} />
      </div>
    </div>
  );
}
