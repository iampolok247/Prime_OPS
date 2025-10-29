import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api, fmtBDTEn } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Wallet, CreditCard, PieChart, BarChart2 } from 'lucide-react';

export default function AccountingDashboard() {
  const { user } = useAuth();
  // allow Accountant, Admin and SuperAdmin to access accounting dashboard and manage heads
  if (!['Accountant','Admin','SuperAdmin'].includes(user?.role)) {
    return <div className="text-royal">Only Accountant, Admin or SuperAdmin can access this dashboard.</div>;
  }

  const [range, setRange] = useState({
    period: 'monthly',
    from: new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10),
    to: new Date().toISOString().slice(0,10)
  });
  const [data, setData] = useState({ totalIncome:0, totalExpense:0, profit:0 });
  const [err, setErr] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showHeadsModal, setShowHeadsModal] = useState(false);
  const [heads, setHeads] = useState({ incomes: [], expenses: [] });

  const load = async () => {
    try {
      // compute from/to based on period selection
      let qFrom, qTo;
      if (range.period === 'custom') { qFrom = range.from; qTo = range.to; }
      else if (range.period === 'lifetime') { qFrom = undefined; qTo = undefined; }
      else {
        const now = new Date();
        const f = new Date();
        if (range.period === 'daily') f.setDate(now.getDate() - 1);
        else if (range.period === 'weekly') f.setDate(now.getDate() - 7);
        else if (range.period === 'monthly') f.setMonth(now.getMonth() - 1);
        else if (range.period === 'yearly') f.setFullYear(now.getFullYear() - 1);
        qFrom = f.toISOString().slice(0,10);
        qTo = now.toISOString().slice(0,10);
      }
      const [d, incResp, expResp] = await Promise.all([
        api.accountingSummary(qFrom, qTo),
        api.listIncome().catch(()=>({ income: [] })),
        api.listExpenses().catch(()=>({ expenses: [] }))
      ]);
      setData(d || { totalIncome:0, totalExpense:0, profit:0 });
      setIncomes(Array.isArray(incResp) ? incResp : (incResp?.income || []));
      setExpenses(Array.isArray(expResp) ? expResp : (expResp?.expenses || []));
    } catch (e) { setErr(e.message); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const location = useLocation();
  useEffect(() => {
    // load account heads from localStorage
    try {
      const raw = localStorage.getItem('accountHeads');
      setHeads(raw ? JSON.parse(raw) : { incomes: [], expenses: [] });
    } catch (e) { setHeads({ incomes: [], expenses: [] }); }
    // if URL requests to open heads modal (from shortcut), open it
    try {
      const qp = new URLSearchParams(location.search || '');
      const open = qp.get('openHeads') || qp.get('openHeadsModal');
      if (open) setShowHeadsModal(true);
    } catch (e) { /* ignore */ }
  }, [location.search]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-3">Accounting Dashboard</h1>
      {err && <div className="mb-2 text-red-600">{err}</div>}
      <div className="flex gap-2 mb-4 items-end">
        <div>
          <label className="block text-sm text-royal mb-1">Period</label>
          <select value={range.period} onChange={e=>setRange(r=>({...r,period:e.target.value}))} className="input">
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
              <input type="date" className="border rounded-xl px-3 py-2" value={range.from} onChange={e=>setRange(r=>({...r,from:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-sm text-royal mb-1">To</label>
              <input type="date" className="border rounded-xl px-3 py-2" value={range.to} onChange={e=>setRange(r=>({...r,to:e.target.value}))}/>
            </div>
          </>
        )}
        <button onClick={load} className="bg-gold text-navy rounded-xl px-4 py-2 font-semibold">Apply</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card icon={<Wallet className="w-5 h-5 text-royal/90" />} title="Income" value={fmtBDTEn(data.totalIncome || 0)} />
        <Card icon={<CreditCard className="w-5 h-5 text-royal/90" />} title="Expense" value={fmtBDTEn(data.totalExpense || 0)} />
        <Card icon={<BarChart2 className="w-5 h-5 text-royal/90" />} title="Profit" value={fmtBDTEn(data.profit || 0)} />
        <Card icon={<Wallet className="w-5 h-5 text-royal/90" />} title="Net Total Balance" value={fmtBDTEn((data.totalIncome||0) - (data.totalExpense||0))} />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setShowHeadsModal(true)} className="px-3 py-2 rounded-xl bg-blue-50 text-royal">Manage Account Heads</button>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm text-royal mb-2">Income vs Expense</h3>
          <LineChartDual data={makeSeries(incomes, expenses, range)} />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm text-royal mb-2">Expense Breakdown</h3>
          <PieChartComp parts={makeBreakdown(expenses)} />
        </div>
      </div>

      {showHeadsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-30" onClick={()=>setShowHeadsModal(false)} />
          <div className="bg-white rounded-xl p-4 z-10 w-full max-w-2xl shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Manage Account Heads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HeadEditor kind="incomes" heads={heads.incomes} onChange={(arr)=>setHeads(h=>({ ...h, incomes: arr }))} />
              <HeadEditor kind="expenses" heads={heads.expenses} onChange={(arr)=>setHeads(h=>({ ...h, expenses: arr }))} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setShowHeadsModal(false)} className="px-4 py-2 rounded-xl border">Close</button>
              <button onClick={()=>{ localStorage.setItem('accountHeads', JSON.stringify(heads)); setShowHeadsModal(false); }} className="px-4 py-2 rounded-xl bg-gold text-navy">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeadEditor({ kind, heads = [], onChange }){
  const [list, setList] = useState(heads || []);
  const [val, setVal] = useState('');
  useEffect(()=>{ setList(heads || []); }, [heads]);
  const add = ()=>{ if (!val) return; const next = [val.trim(), ...list]; setList(next); setVal(''); onChange && onChange(next); };
  const remove = (i)=>{ const next = list.filter((_,idx)=>idx!==i); setList(next); onChange && onChange(next); };
  return (
    <div>
      <h4 className="text-sm font-semibold capitalize mb-2">{kind === 'incomes' ? 'Income Heads' : 'Expense Heads'}</h4>
      <div className="flex gap-2 mb-2">
        <input value={val} onChange={e=>setVal(e.target.value)} placeholder={kind==='incomes'?'New income head':'New expense head'} className="border rounded-xl px-3 py-2 flex-1" />
        <button onClick={add} className="px-3 py-2 bg-gold text-navy rounded-xl">Add</button>
      </div>
      <div className="flex flex-col gap-2">
        {list.map((h, i)=> (
          <div key={h} className="flex items-center justify-between border rounded-md px-3 py-2">
            <div className="text-sm">{h}</div>
            <button onClick={()=>remove(i)} className="text-red-600">Remove</button>
          </div>
        ))}
        {list.length === 0 && <div className="text-royal/70">No heads defined</div>}
      </div>
    </div>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <div className="text-royal text-sm">{title}</div>
      </div>
      <div className="text-2xl font-extrabold text-navy">{value}</div>
    </div>
  );
}

function makeSeries(incomes = [], expenses = [], range) {
  // create daily series between computed from/to if available
  let from, to;
  if (range.period === 'custom') { from = new Date(range.from); to = new Date(range.to); }
  else if (range.period === 'lifetime') { return []; }
  else {
    const now = new Date();
    from = new Date();
    if (range.period === 'daily') from.setDate(now.getDate() - 1);
    else if (range.period === 'weekly') from.setDate(now.getDate() - 7);
    else if (range.period === 'monthly') from.setMonth(now.getMonth() - 1);
    else if (range.period === 'yearly') from.setFullYear(now.getFullYear() - 1);
    to = now;
  }
  if (!from || !to) return [];
  const out = [];
  const cur = new Date(from);
  while (cur <= to) {
    const key = cur.toISOString().slice(0,10);
    const incSum = incomes.filter(i=> new Date(i.date).toISOString().slice(0,10) === key).reduce((s,x)=>s+(Number(x.amount)||0),0);
    const expSum = expenses.filter(e=> new Date(e.date).toISOString().slice(0,10) === key).reduce((s,x)=>s+(Number(x.amount)||0),0);
    out.push({ date: key, income: incSum, expense: expSum });
    cur.setDate(cur.getDate()+1);
  }
  return out;
}

function makeBreakdown(expenses = []){
  const map = {};
  (expenses || []).forEach(e=>{ const k = e.purpose || e.category || 'Other'; map[k] = (map[k]||0) + Number(e.amount||0); });
  return map;
}

function LineChartDual({ data }){
  const width = 600, height = 180, padding = 24;
  if (!data || data.length === 0) return <div className="text-royal/70">No data</div>;
  const max = Math.max(...data.map(d=>Math.max(d.income||0,d.expense||0)));
  const stepX = (width - padding*2) / Math.max(1, data.length-1);
  const incomePoints = data.map((d,i)=>`${padding + i*stepX},${height - padding - (max ? (d.income / max) * (height - padding*2) : 0)}`).join(' ');
  const expensePoints = data.map((d,i)=>`${padding + i*stepX},${height - padding - (max ? (d.expense / max) * (height - padding*2) : 0)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
      <polyline fill="none" stroke="#10b981" strokeWidth="2" points={incomePoints} />
      <polyline fill="none" stroke="#ef4444" strokeWidth="2" points={expensePoints} />
    </svg>
  );
}

function PieChartComp({ parts }){
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
          const colors = ['#3b82f6','#06b6d4','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
          return <path key={k} d={path} fill={colors[idx % colors.length]} stroke="#fff" strokeWidth="1" />;
        })}
      </svg>
      <div className="flex flex-col text-sm">
        {entries.map(([k,v], idx)=> (
          <div key={k} className="flex items-center gap-2"><span style={{width:12,height:12,background:['#3b82f6','#06b6d4','#f59e0b','#ef4444','#8b5cf6','#06b6d4'][idx%6]}} className="inline-block rounded-sm"/> <span className="capitalize">{k.replace(/([A-Z])/g,' $1')}</span>: <strong className="ml-1">{v}</strong></div>
        ))}
      </div>
    </div>
  );
}
