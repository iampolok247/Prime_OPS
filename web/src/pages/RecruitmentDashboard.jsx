// web/src/pages/RecruitmentDashboard.jsx
import { useEffect, useState } from "react";
import { api, fmtBDT } from "../lib/api";

export default function RecruitmentDashboard() {
  const [cards, setCards] = useState({ totalRecruitment: 0, pendingCandidate: 0, activeJobPosition: 0, totalEmployer: 0 });
  const [series, setSeries] = useState([]);
  // filters
  const [period, setPeriod] = useState('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    (async () => {
      // TODO: server may accept date params in future; for now we fetch and rely on server-side defaults
      const data = await api.getRecruitmentStats();
      setCards(data.cards);
      setSeries(data.series);
    })();
  }, [period, from, to]);

  return (
    <div className="p-4 md:p-6 space-y-6 font-[Poppins]">
      <h1 className="text-2xl md:text-3xl font-semibold text-[#053867]">Recruitment Dashboard</h1>
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

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Total Recruitment" value={cards.totalRecruitment} />
        <Card title="Pending Candidate" value={cards.pendingCandidate} />
        <Card title="Active Job Position" value={cards.activeJobPosition} />
        <Card title="Total Employer" value={cards.totalEmployer} />
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
              {series.map((r) => (
                <tr key={r.month} className="border-t">
                  <td className="py-2">{r.month}</td>
                  <td className="py-2">{r.candidates}</td>
                  <td className="py-2">{r.recruited}</td>
                </tr>
              ))}
              {series.length === 0 && (
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
