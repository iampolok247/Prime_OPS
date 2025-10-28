// web/src/pages/dash/AdminOverview.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api, fmtBDTEn } from '../../lib/api.js';
import { Wallet, CreditCard, BarChart2, BookOpen, Users, ListChecks } from 'lucide-react';

function todayISO(){ return new Date().toISOString().slice(0,10); }
function firstOfMonthISO(){ const d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10); }

export default function AdminOverview() {
  const [period, setPeriod] = useState('monthly');
  const [from, setFrom] = useState(firstOfMonthISO());
  const [to, setTo] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [courses, setCourses] = useState([]);
  const [leads, setLeads] = useState([]);
  const [admissionLeads, setAdmissionLeads] = useState([]);
  const [recruited, setRecruited] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [err, setErr] = useState('');

  function parseRange() {
    if (period === 'custom' && from && to) return { from: new Date(from), to: new Date(to) };
    if (period === 'lifetime') return { from: null, to: null };
    const now = new Date();
    let f = new Date();
    if (period === 'daily') f.setDate(now.getDate() - 1);
    else if (period === 'weekly') f.setDate(now.getDate() - 7);
    else if (period === 'monthly') f.setMonth(now.getMonth() - 1);
    else if (period === 'yearly') f.setFullYear(now.getFullYear() - 1);
    return { from: f, to: now };
  }

  const load = async () => {
    try {
      // compute from/to to send to server for all period types (except lifetime)
      let qFrom, qTo;
      if (period === 'custom') { qFrom = from; qTo = to; }
      else if (period === 'lifetime') { qFrom = undefined; qTo = undefined; }
      else {
        // compute server-friendly YYYY-MM-DD
        const now = new Date();
        const f = new Date();
        if (period === 'daily') f.setDate(now.getDate() - 1);
        else if (period === 'weekly') f.setDate(now.getDate() - 7);
        else if (period === 'monthly') f.setMonth(now.getMonth() - 1);
        else if (period === 'yearly') f.setFullYear(now.getFullYear() - 1);
        qFrom = f.toISOString().slice(0,10);
        qTo = now.toISOString().slice(0,10);
      }
      const [r, cs, ls, als, recs, t, inc, exp] = await Promise.all([
        api.reportsOverview(qFrom, qTo),
        api.listCourses().catch(()=>({ courses: [] })),
        api.listLeads().catch(()=>({ leads: [] })),
        api.listAdmissionLeads().catch(()=>({ leads: [] })),
        api.listRecruited().catch(()=>[]),
        api.listAllTasks().catch(()=>({ tasks: [] })),
        api.listIncome().catch(()=>[]),
        api.listExpenses().catch(()=>[])
      ]);
      setReport(r);
      setCourses(cs?.courses || []);
      setLeads(ls?.leads || []);
      setAdmissionLeads(als?.leads || []);
      setRecruited(Array.isArray(recs) ? recs : (recs?.candidates || []));
      setTasks(t?.tasks || []);
      setIncomes(Array.isArray(inc) ? inc : (inc?.income || []));
      setExpenses(Array.isArray(exp) ? exp : (exp?.expenses || []));
      setErr('');
    } catch(e) { setErr(e.message || 'Failed to load'); }
  };

  useEffect(()=>{ load(); }, []);

  const { from: rangeFrom, to: rangeTo } = parseRange();

  const filteredLeads = useMemo(()=>{
    if (!rangeFrom && !rangeTo) return leads;
    return leads.filter(l=>{ const d=new Date(l.createdAt||l.date||l._id&&null); return d && (!rangeFrom||d>=rangeFrom) && (!rangeTo||d<=rangeTo); });
  }, [leads, rangeFrom, rangeTo]);

  const filteredAdmission = useMemo(()=>{
    if (!rangeFrom && !rangeTo) return admissionLeads;
    return admissionLeads.filter(l=>{ const d=new Date(l.createdAt||l.date||l._id&&null); return d && (!rangeFrom||d>=rangeFrom) && (!rangeTo||d<=rangeTo); });
  }, [admissionLeads, rangeFrom, rangeTo]);

  const filteredTasks = useMemo(()=>{
    if (!rangeFrom && !rangeTo) return tasks;
    return tasks.filter(t=>{ const d=new Date(t.createdAt||t.deadline||null); return d && (!rangeFrom||d>=rangeFrom) && (!rangeTo||d<=rangeTo); });
  }, [tasks, rangeFrom, rangeTo]);

  const totalIncome = report?.combined?.income ?? 0;
  const totalExpense = report?.combined?.expense ?? 0;
  const totalNet = report?.combined?.net ?? (totalIncome - totalExpense);
  const totalActiveCourses = (courses || []).filter(c=>c.status==='Active').length;
  const totalLeads = filteredLeads.length;
  const totalAdmitted = filteredAdmission.filter(l=> (l.status||'').toLowerCase() === 'admitted').length;
  const totalRecruited = (recruited || []).length;
  const pendingTasks = filteredTasks.filter(t=> (t.status||'').toLowerCase() !== 'completed');

  // prepare income/expense timeseries by day
  const series = useMemo(()=>{
    if (!rangeFrom || !rangeTo) return [];
    const out = [];
    const cur = new Date(rangeFrom);
    while (cur <= rangeTo) {
      const key = cur.toISOString().slice(0,10);
      const incSum = (incomes || []).filter(i=> new Date(i.date).toISOString().slice(0,10) === key).reduce((s,x)=>s+(Number(x.amount)||0),0);
      const expSum = (expenses || []).filter(e=> new Date(e.date).toISOString().slice(0,10) === key).reduce((s,x)=>s+(Number(x.amount)||0),0);
      out.push({ date: key, income: incSum, expense: expSum });
      cur.setDate(cur.getDate()+1);
    }
    return out;
  }, [incomes, expenses, rangeFrom, rangeTo]);

  const expenseBreakdown = useMemo(()=>{
    // combine accounting expenses + dm costs by purpose/category
    const map = {};
    (expenses || []).forEach(e=>{ const k = e.category || e.purpose || 'Other'; map[k] = (map[k]||0)+Number(e.amount||0); });
    return map;
  }, [expenses]);

  const onApply = (e)=>{ e?.preventDefault?.(); load(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">Admin Overview</h1>
        <form onSubmit={onApply} className="flex items-center gap-2">
          <select value={period} onChange={e=>setPeriod(e.target.value)} className="input">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
            <option value="custom">Custom</option>
          </select>
          {period === 'custom' && (
            <>
              <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)} />
              <span className="text-royal">to</span>
              <input type="date" className="input" value={to} onChange={e=>setTo(e.target.value)} />
            </>
          )}
          <button className="btn btn-primary">Apply</button>
        </form>
      </div>

      {err && <div className="text-red-600">{err}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-royal/90" />
            <div className="text-royal text-sm">Total Income</div>
          </div>
          <div className="text-2xl font-extrabold">{fmtBDTEn(totalIncome)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-royal/90" />
            <div className="text-royal text-sm">Total Expense</div>
          </div>
          <div className="text-2xl font-extrabold">{fmtBDTEn(totalExpense)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-royal/90" />
            <div className="text-royal text-sm">Total Net Balances</div>
          </div>
          <div className="text-2xl font-extrabold">{fmtBDTEn(totalNet)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-royal/90" />
            <div className="text-royal text-sm">Total Active Courses</div>
          </div>
          <div className="text-2xl font-extrabold">{totalActiveCourses}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-royal/90" />
            <div className="text-royal text-sm">Total Lead</div>
          </div>
          <div className="text-2xl font-extrabold">{totalLeads}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-royal/90" />
            <div className="text-royal text-sm">Total Admitted Student</div>
          </div>
          <div className="text-2xl font-extrabold">{totalAdmitted}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-royal/90" />
            <div className="text-royal text-sm">Total Recruited People</div>
          </div>
          <div className="text-2xl font-extrabold">{totalRecruited}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-royal/90" />
            <div className="text-royal text-sm">Pending Tasks</div>
          </div>
          <div className="text-2xl font-extrabold">{pendingTasks.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm text-royal mb-2">Income vs Expense</h3>
          <LineChartDual data={series} />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm text-royal mb-2">Expense Breakdown</h3>
          <PieChart parts={expenseBreakdown} />
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm text-royal mb-2">Pending Task List</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f3f6ff] text-royal">
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Assigned To</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-left">Deadline</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingTasks.map(t => (
                <tr key={t._id} className="border-t">
                  <td className="p-2">{t.title}</td>
                  <td className="p-2">{t.assignedTo?.name || t.assignedTo?.email || '-'}</td>
                  <td className="p-2">{t.category}</td>
                  <td className="p-2">{t.deadline ? new Date(t.deadline).toLocaleDateString() : '-'}</td>
                  <td className="p-2">{t.status}</td>
                </tr>
              ))}
              {pendingTasks.length === 0 && <tr><td className="p-3 text-royal/70" colSpan="5">No pending tasks</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
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
