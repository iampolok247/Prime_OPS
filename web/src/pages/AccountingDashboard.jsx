import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AccountingDashboard() {
  const { user } = useAuth();
  if (user?.role !== 'Accountant') {
    return <div className="text-royal">Only Accountant can access this dashboard.</div>;
  }

  const [range, setRange] = useState({
    from: new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10),
    to: new Date().toISOString().slice(0,10)
  });
  const [data, setData] = useState({ totalIncome:0, totalExpense:0, profit:0 });
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const d = await api.accountingSummary(range.from, range.to);
      setData(d);
    } catch (e) { setErr(e.message); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-3">Accounting Dashboard</h1>
      {err && <div className="mb-2 text-red-600">{err}</div>}
      <div className="flex gap-2 mb-4 items-end">
        <div>
          <label className="block text-sm text-royal mb-1">From</label>
          <input type="date" className="border rounded-xl px-3 py-2" value={range.from} onChange={e=>setRange(r=>({...r,from:e.target.value}))}/>
        </div>
        <div>
          <label className="block text-sm text-royal mb-1">To</label>
          <input type="date" className="border rounded-xl px-3 py-2" value={range.to} onChange={e=>setRange(r=>({...r,to:e.target.value}))}/>
        </div>
        <button onClick={load} className="bg-gold text-navy rounded-xl px-4 py-2 font-semibold">Apply</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card title="Income" value={`৳ ${data.totalIncome || 0}`} />
        <Card title="Expense" value={`৳ ${data.totalExpense || 0}`} />
        <Card title="Profit" value={`৳ ${data.profit || 0}`} />
        <Card title="Balance in My Hand" value={`৳ ${(data.totalIncome||0) - (data.totalExpense||0)}`} />
      </div>

      {/* You can add a chart later; for now we keep it simple per your performance guidance */}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-4">
      <div className="text-royal text-sm mb-1">{title}</div>
      <div className="text-2xl font-extrabold text-navy">{value}</div>
    </div>
  );
}
