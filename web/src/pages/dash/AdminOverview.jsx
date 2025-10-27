// web/src/pages/dash/AdminOverview.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api, fmtBDT } from '../../lib/api.js';

function todayISO(){ return new Date().toISOString().slice(0,10); }
function firstOfMonthISO(){ const d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10); }

export default function AdminOverview() {
  const [from, setFrom] = useState(firstOfMonthISO());
  const [to, setTo] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [rec, setRec] = useState(null);
  const [mg, setMg] = useState(null);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const [r, rs, ms] = await Promise.all([
        api.reportsOverview(from, to),
        api.getRecruitmentSummary().catch(()=>null),
        api.mgStats?.().catch(()=>null),
      ]);
      setReport(r); setRec(rs); setMg(ms); setErr('');
    } catch(e) { setErr(e.message || 'Failed to load'); }
  };

  useEffect(()=>{ load(); }, []);

  const cards = useMemo(()=> {
    if (!report) return [];
    const k = [];
    k.push({ label:'Combined Income', val: report.combined.income });
    k.push({ label:'Combined Expense', val: report.combined.expense });
    k.push({ label:'Combined Net', val: report.combined.net, emph:true });
    if (rec) {
      k.push({ label:'Recruitment Net', val: report.recruitment.net });
      k.push({ label:'Active Job Positions', val: rec.activeJobs ?? 0 });
      k.push({ label:'Pending Candidates', val: rec.pending ?? 0 });
    }
    if (mg) {
      k.push({ label:'MG Total', val: mg.total ?? 0 });
      k.push({ label:'MG In Progress', val: mg.inProgress ?? 0 });
      k.push({ label:'MG Done', val: mg.done ?? 0 });
    }
    return k;
  }, [report, rec, mg]);

  const onApply = (e)=>{ e.preventDefault(); load(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">Admin Overview</h1>
        <form onSubmit={onApply} className="flex items-center gap-2">
          <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)}/>
          <span className="text-royal">to</span>
          <input type="date" className="input" value={to} onChange={e=>setTo(e.target.value)}/>
          <button className="btn btn-primary">Apply</button>
        </form>
      </div>

      {err && <div className="text-red-600">{err}</div>}
      {!report && <div>Loading…</div>}

      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {cards.map((c,i)=>(
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-royal text-sm">{c.label}</div>
              <div className={`text-2xl font-extrabold ${c.emph ? (c.val>=0 ? 'text-green-600':'text-red-600') : 'text-navy'}`}>
                {typeof c.val === 'number' ? fmtBDT(c.val) : c.val}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
