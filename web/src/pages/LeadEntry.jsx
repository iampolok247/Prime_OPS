import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LeadEntry() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name:'', phone:'', email:'', interestedCourse:'', source:'Manually Generated Lead' });
  const [csv, setCsv] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [fileErr, setFileErr] = useState(null);

  const isDM = user?.role === 'DigitalMarketing';

  const submitSingle = async (e) => {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      await api.createLead(form);
      setMsg('Lead added');
      setForm({ name:'', phone:'', email:'', interestedCourse:'', source:'Manually Generated Lead' });
    } catch (e) { setErr(e.message); }
  };

  const submitBulk = async (e) => {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      const { created, skipped } = await api.bulkUploadLeads(csv);
      setMsg(`Bulk upload done. Created: ${created}, Skipped duplicates/invalid: ${skipped}`);
      setCsv('');
    } catch (e) { setErr(e.message); }
  };

  if (!isDM) return <div className="text-royal">Only Digital Marketing can add or upload leads.</div>;

  return (
    <div className="">
      <h1 className="text-2xl font-bold text-navy mb-3">Lead Entry</h1>

      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      {err && <div className="mb-2 text-red-600">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single lead form */}
        <form onSubmit={submitSingle} className="bg-white rounded-2xl shadow-soft p-4">
          <h2 className="text-lg font-semibold text-navy mb-3">Add Single Lead</h2>
          <label className="block text-sm text-royal mb-1">Name *</label>
          <input className="w-full border rounded-xl px-3 py-2 mb-3" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <label className="block text-sm text-royal mb-1">Phone</label>
          <input className="w-full border rounded-xl px-3 py-2 mb-3" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
          <label className="block text-sm text-royal mb-1">Email</label>
          <input type="email" className="w-full border rounded-xl px-3 py-2 mb-3" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
          <label className="block text-sm text-royal mb-1">Interested Course</label>
          <input className="w-full border rounded-xl px-3 py-2 mb-3" value={form.interestedCourse} onChange={e=>setForm(f=>({...f,interestedCourse:e.target.value}))}/>
          <label className="block text-sm text-royal mb-1">Source</label>
          <select className="w-full border rounded-xl px-3 py-2 mb-4" value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>
            <option>Meta Lead</option>
            <option>LinkedIn Lead</option>
            <option>Manually Generated Lead</option>
            <option>Others</option>
          </select>
          <button className="bg-gold text-navy rounded-xl px-4 py-2 font-semibold hover:bg-lightgold">Add Lead</button>
        </form>

        {/* Bulk CSV */}
        <form onSubmit={submitBulk} className="bg-white rounded-2xl shadow-soft p-4">
          <h2 className="text-lg font-semibold text-navy mb-3">Bulk Upload (CSV)</h2>
          <p className="text-xs text-royal/80 mb-2">Headers required: <b>Name,Phone,Email,InterestedCourse,Source</b></p>
          <div className="mb-2">
            <input type="file" accept=".csv,text/csv" onChange={async (e)=>{
              setFileErr(null); setErr(null); setMsg(null);
              const f = e.target.files && e.target.files[0];
              if (!f) return;
              const name = (f.name || '').toLowerCase();
              const isCsv = f.type === 'text/csv' || name.endsWith('.csv');
              if (!isCsv) {
                setFileErr('Please select a CSV file (.csv)');
                return;
              }
              try {
                const text = await f.text();
                setCsv(text);
              } catch (err) {
                setFileErr('Unable to read file');
              }
            }} />
          </div>
          <textarea rows="10" className="w-full border rounded-xl px-3 py-2 mb-3" placeholder="Or paste CSV here..." value={csv} onChange={e=>setCsv(e.target.value)} />
          {fileErr && <div className="text-red-600 mb-2">{fileErr}</div>}
          <button className="bg-gold text-navy rounded-xl px-4 py-2 font-semibold hover:bg-lightgold">Upload CSV</button>
        </form>
      </div>
    </div>
  );
}
