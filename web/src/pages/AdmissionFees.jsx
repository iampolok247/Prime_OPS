// web/src/pages/AdmissionFees.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdmissionFees() {
  const { user } = useAuth();
  if (user?.role !== 'Admission' && user?.role !== 'Admin' && user?.role !== 'SuperAdmin' && user?.role !== 'Accountant') {
    return <div className="text-royal">Access denied</div>;
  }

  const [fees, setFees] = useState([]);
  const [admitted, setAdmitted] = useState([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({
    leadId: '', courseName:'', amount:0, method:'Bkash',
    paymentDate: new Date().toISOString().slice(0,10), note:''
  });

  const canSubmit = user?.role === 'Admission';

  const load = async () => {
    try {
      const [{ fees }, leadsResp] = await Promise.all([
        api.listAdmissionFees(),
        api.listAdmissionLeads('Admitted')
      ]);
      setFees(fees || []);
      setAdmitted(leadsResp?.leads || []);
    } catch (e) { setErr(e.message); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const submit = async (e) => {
    e.preventDefault(); setMsg(null); setErr(null);
    try {
      await api.createAdmissionFee(form);
      setMsg('Fee submitted for review');
      setOpen(false);
      setForm({ leadId:'', courseName:'', amount:0, method:'Bkash', paymentDate:new Date().toISOString().slice(0,10), note:'' });
      load();
    } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-navy">Admission Fees Collection</h1>
        {canSubmit && <button onClick={()=>setOpen(true)} className="bg-gold text-navy rounded-xl px-4 py-2 font-semibold">Collect Fees</button>}
      </div>

      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      {err && <div className="mb-2 text-red-600">{err}</div>}

      <div className="bg-white rounded-2xl shadow-soft overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f3f6ff] text-royal">
            <tr>
              <th className="p-3 text-left">Lead</th>
              <th className="p-3 text-left">Course</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Method</th>
              <th className="p-3 text-left">Payment Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Note</th>
            </tr>
          </thead>
          <tbody>
            {fees.map(f => (
              <tr key={f._id} className="border-t">
                <td className="p-3">
                  {f.lead?.leadId} — {f.lead?.name}
                  <div className="text-xs text-royal/70">{f.lead?.phone} {f.lead?.email ? `• ${f.lead.email}` : ''}</div>
                </td>
                <td className="p-3">{f.courseName}</td>
                <td className="p-3">৳ {f.amount}</td>
                <td className="p-3">{f.method}</td>
                <td className="p-3">{new Date(f.paymentDate).toLocaleDateString()}</td>
                <td className="p-3">{f.status}</td>
                <td className="p-3">{f.note || '-'}</td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr><td className="p-4 text-royal/70" colSpan="7">No fees yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && canSubmit && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-soft p-4 w-full max-w-xl">
            <h3 className="text-lg font-semibold text-navy mb-2">Collect Fees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm text-royal mb-1">Lead (Admitted)*</label>
                <select className="w-full border rounded-xl px-3 py-2" required
                  value={form.leadId} onChange={e=>setForm(f=>({...f,leadId:e.target.value}))}>
                  <option value="">Select lead</option>
                  {admitted.map(l => <option key={l._id} value={l._id}>{l.leadId} — {l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-royal mb-1">Course Name *</label>
                <input className="w-full border rounded-xl px-3 py-2" required
                  value={form.courseName} onChange={e=>setForm(f=>({...f,courseName:e.target.value}))}/>
              </div>
              <div>
                <label className="block text-sm text-royal mb-1">Amount *</label>
                <input type="number" className="w-full border rounded-xl px-3 py-2" required
                  value={form.amount} onChange={e=>setForm(f=>({...f,amount:Number(e.target.value)}))}/>
              </div>
              <div>
                <label className="block text-sm text-royal mb-1">Method *</label>
                <select className="w-full border rounded-xl px-3 py-2" value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))}>
                  <option>Bkash</option><option>Nagad</option><option>Rocket</option><option>Bank Transfer</option><option>Cash on Hand</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-royal mb-1">Payment Date *</label>
                <input type="date" className="w-full border rounded-xl px-3 py-2" required
                  value={form.paymentDate} onChange={e=>setForm(f=>({...f,paymentDate:e.target.value}))}/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-royal mb-1">Note</label>
                <textarea rows="3" className="w-full border rounded-xl px-3 py-2"
                  value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={()=>setOpen(false)} className="px-4 py-2 rounded-xl border">Cancel</button>
              <button className="px-4 py-2 rounded-xl bg-gold text-navy font-semibold">Submit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
