// web/src/pages/RecruitmentDashboard.jsx
import React, { useEffect, useState } from "react";
import { api, fmtBDT } from "../lib/api";

export default function RecruitmentDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  
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
      const [candResp, jobsResp, empResp] = await Promise.all([
        api.listCandidates().catch(() => ({ candidates: [] })),
        api.listJobs().catch(() => ({ jobs: [] })),
        api.listEmployers().catch(() => ({ employers: [] }))
      ]);
      setCandidates(candResp?.candidates || candResp || []);
      setJobs(jobsResp?.jobs || jobsResp || []);
      setEmployers(empResp?.employers || empResp || []);
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

  const metrics = React.useMemo(() => {
    const fromD = rangeFrom ? new Date(rangeFrom) : null;
    const toD = rangeTo ? new Date(rangeTo) : null;

    const candInRange = candidates.filter(c => inRange(c.createdAt, fromD, toD) || (!fromD && !toD));
    const jobsInRange = jobs.filter(j => inRange(j.createdAt, fromD, toD) || (!fromD && !toD));

    const totalRecruitment = candInRange.length;
    const pendingCandidate = candInRange.filter(c => c.status === 'pending').length;
    const activeJobPosition = jobsInRange.filter(j => j.status === 'active').length;
    const totalEmployer = employers.length; // Employers don't have date filter

    // Compute series for last 6 months from range end
    const series = [];
    if (toD) {
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(toD);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const monthLabel = monthStart.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const candidatesCount = candidates.filter(c => inRange(c.createdAt, monthStart, monthEnd)).length;
        const recruitedCount = candidates.filter(c => c.status === 'recruited' && inRange(c.recruitedAt || c.updatedAt, monthStart, monthEnd)).length;
        
        series.push({ month: monthLabel, candidates: candidatesCount, recruited: recruitedCount });
      }
    }

    return { totalRecruitment, pendingCandidate, activeJobPosition, totalEmployer, series };
  }, [candidates, jobs, employers, rangeFrom, rangeTo]);

  return (
    <div className="p-4 md:p-6 space-y-6 font-[Poppins]">
      <h1 className="text-2xl md:text-3xl font-semibold text-[#053867]">Recruitment Dashboard</h1>
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

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Total Recruitment" value={metrics.totalRecruitment} />
        <Card title="Pending Candidate" value={metrics.pendingCandidate} />
        <Card title="Active Job Position" value={metrics.activeJobPosition} />
        <Card title="Total Employer" value={metrics.totalEmployer} />
      </div>

      {/* Series (simple table placeholder; you can later swap with Recharts) */}
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-lg font-semibold text-[#253985] mb-3">Candidate vs Recruited (Last 6 months)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[#053867]">
                <th className="py-2">Month</th>
                <th className="py-2">Candidates</th>
                <th className="py-2">Recruited</th>
              </tr>
            </thead>
            <tbody>
              {metrics.series.map((r) => (
                <tr key={r.month} className="border-t">
                  <td className="py-2">{r.month}</td>
                  <td className="py-2">{r.candidates}</td>
                  <td className="py-2">{r.recruited}</td>
                </tr>
              ))}
              {metrics.series.length === 0 && (
                <tr><td className="py-2 text-gray-500" colSpan={3}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-sm text-[#253985]">{title}</div>
      <div className="text-2xl font-bold text-[#053867]">{typeof value === 'number' ? value : fmtBDT(value)}</div>
    </div>
  );
}
