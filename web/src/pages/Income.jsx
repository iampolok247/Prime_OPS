import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function IncomePage() {
  const { user } = useAuth();
  const isAcc = user?.role === 'Accountant';
  if (!isAcc && user?.role !== 'Admin' && user?.role !== 'SuperAdmin') {
    return <div className="text-royal">Access denied</div>;
  }

  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), source:'Other', amount:0, note:'' });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const load = async () => {
    try { const { income } = await api.listIncome(); setRows(income || []); } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const add = async (e) => {
    e.preventDefault(); setMsg(null); setErr(null);
    try { await api.addIncome(form); setMsg('Income added'); setForm({ ...form, amount:0 }); load(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-navy">Income</h1>
      </div>
      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      {err && <div className="mb-2 text-red-600">{err}</div>}

      {isAcc && (
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3 bg-white rounded-2xl shadow-soft p-3">
          <input type="date" className="border rounded-xl px-3 py-2" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
          <input className="border rounded-xl px-3 py-2" placeholder="Source" value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}/>
          <input type="number" className="border rounded-xl px-3 py-2" placeholder="Amount" value={form.amount} onChange={e=>setForm(f=>({...f,amount:Number(e.target.value)}))}/>
          <div className="flex gap-2">
            <input className="border rounded-xl px-3 py-2 flex-1" placeholder="Note" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
            <button className="bg-gold text-navy rounded-xl px-4">Add</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-soft overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f3f6ff] text-royal">
            <tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Source</th><th className="p-3 text-left">Amount</th><th className="p-3 text-left">Note</th></tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r._id} className="border-t">
                <td className="p-3">{new Date(r.date).toLocaleDateString()}</td>
                <td className="p-3">{r.source}</td>
                <td className="p-3">৳ {r.amount}</td>
                <td className="p-3">{r.note || '-'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="p-4 text-royal/70" colSpan="4">No entries</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
