import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function DMMetrics() {
  const { user } = useAuth();
  if (user?.role !== 'DigitalMarketing') {
    return <div className="text-royal">Only Digital Marketing can access this page.</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Costs />
      <Social />
      <SEOReports />
    </div>
  );
}

function Costs() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), purpose:'Meta Ads', amount:0 });
  const [msg, setMsg] = useState(null); const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const resp = await api.listDMCosts();
      // backend may return { items: [...] } or { costs: [...] } or plain array
      let arr = [];
      if (Array.isArray(resp)) arr = resp;
      else if (Array.isArray(resp?.costs)) arr = resp.costs;
      else if (Array.isArray(resp?.items)) arr = resp.items;
      setList(arr);
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault(); setMsg(null); setErr(null);
    try { await api.createDMCost(form); setMsg('Cost added'); setForm({ ...form, amount: 0 }); load(); } catch (e) { setErr(e.message); }
  };
  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.deleteDMCost(id); load(); } catch (e) { setErr(e.message); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-4">
      <h2 className="text-xl font-bold text-navy mb-2">Cost Entry / Expense</h2>
      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      {err && <div className="mb-2 text-red-600">{err}</div>}
      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        <input type="date" className="border rounded-xl px-3 py-2" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
        <select className="border rounded-xl px-3 py-2" value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}>
          <option>Meta Ads</option><option>LinkedIn Ads</option><option>Software Purchase</option><option>Subscription</option><option>Others</option>
        </select>
        <div className="flex gap-2">
          <input type="number" className="border rounded-xl px-3 py-2 flex-1" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
          <button className="bg-gold text-navy rounded-xl px-4">Add</button>
        </div>
      </form>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f3f6ff] text-royal">
            <tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Purpose</th><th className="p-2 text-left">Amount</th><th className="p-2 text-left">Action</th></tr>
          </thead>
          <tbody>
            {list.map(r=>(
              <tr key={r._id} className="border-t">
                <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
                <td className="p-2">{r.purpose}</td>
                <td className="p-2">৳ {r.amount}</td>
                <td className="p-2"><button onClick={()=>remove(r._id)} className="px-3 py-1 rounded-lg border hover:bg-red-50">Delete</button></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td className="p-3 text-royal/70" colSpan="4">No entries</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Social() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10),
    facebookFollowers: 0, instagramFollowers: 0, facebookGroupMembers: 0, youtubeSubscribers: 0,
    linkedinFollowers: 0, xFollowers: 0, pinterestViews: 0, bloggerImpressions: 0, totalPeopleReach: 0
  });
  const [msg, setMsg] = useState(null); const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const resp = await api.listSocial();
      // server exposes latest metrics as { metrics: { ... }, updatedAt }
      const m = resp?.metrics || resp?.social || {};
      if (m && Object.keys(m).length) {
        const mapped = {
          facebookFollowers: m.facebookFollowers || 0,
          instagramFollowers: m.instagramFollowers || 0,
          facebookGroupMembers: m.facebookGroupMembers || 0,
          youtubeSubscribers: m.youtubeSubscribers || 0,
          // server may use 'linkedInFollowers' (capital I) or 'linkedinFollowers'
          linkedinFollowers: m.linkedinFollowers || m.linkedInFollowers || 0,
          xFollowers: m.xFollowers || 0,
          pinterestViews: m.pinterestViews || m.pinterestView || 0,
          bloggerImpressions: m.bloggerImpressions || m.bloggerImpression || 0,
          totalPeopleReach: m.totalPeopleReach || m.totalReach || 0
        };
        setForm(f => ({ ...f, ...mapped }));
        setList([{ _id: resp?.updatedAt || 'latest', date: resp?.updatedAt || form.date, ...mapped }]);
      } else {
        setList([]);
      }
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault(); setMsg(null); setErr(null);
    try { await api.createSocial(form); setMsg('Social snapshot saved'); load(); } catch (e) { setErr(e.message); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-4">
      <h2 className="text-xl font-bold text-navy mb-2">Social Media Reports</h2>
      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      {err && <div className="mb-2 text-red-600">{err}</div>}
      <form onSubmit={add} className="grid grid-cols-2 gap-2 mb-3">
        <input type="date" className="border rounded-xl px-3 py-2 col-span-2" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
        {Object.keys(form).filter(k=>k!=='date').map(k=>(
          <input key={k} type="number" className="border rounded-xl px-3 py-2"
            value={form[k]} onChange={e=>setForm(f=>({...f,[k]:Number(e.target.value)}))}
            placeholder={k}/>
        ))}
        <div className="col-span-2">
          <button className="bg-gold text-navy rounded-xl px-4 py-2">Update</button>
        </div>
      </form>

      <div className="overflow-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-[#f3f6ff] text-royal">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Facebook</th>
              <th className="p-2 text-left">Instagram</th>
              <th className="p-2 text-left">Group</th>
              <th className="p-2 text-left">YouTube</th>
              <th className="p-2 text-left">LinkedIn</th>
              <th className="p-2 text-left">X</th>
              <th className="p-2 text-left">Pinterest</th>
              <th className="p-2 text-left">Blogger</th>
              <th className="p-2 text-left">Reach</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r=>(
              <tr key={r._id} className="border-t">
                <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
                <td className="p-2">{r.facebookFollowers}</td>
                <td className="p-2">{r.instagramFollowers}</td>
                <td className="p-2">{r.facebookGroupMembers}</td>
                <td className="p-2">{r.youtubeSubscribers}</td>
                <td className="p-2">{r.linkedinFollowers}</td>
                <td className="p-2">{r.xFollowers}</td>
                <td className="p-2">{r.pinterestViews}</td>
                <td className="p-2">{r.bloggerImpressions}</td>
                <td className="p-2">{r.totalPeopleReach}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td className="p-3 text-royal/70" colSpan="10">No snapshots</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SEOReports() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), typeOfWork:'Blogpost', challenge:'', details:'' });
  const [msg, setMsg] = useState(null); const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const resp = await api.listSEO();
      let arr = [];
      if (Array.isArray(resp)) arr = resp;
      else if (Array.isArray(resp?.seo)) arr = resp.seo;
      else if (Array.isArray(resp?.items)) arr = resp.items;
      setList(arr);
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault(); setMsg(null); setErr(null);
    try { await api.createSEO(form); setMsg('SEO report added'); setOpen(false); load(); } catch (e) { setErr(e.message); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy mb-2">SEO Reports</h2>
        <button onClick={()=>setOpen(true)} className="bg-gold text-navy rounded-xl px-3 py-2">+ Add</button>
      </div>
      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      {err && <div className="mb-2 text-red-600">{err}</div>}

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f3f6ff] text-royal">
            <tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Challenge</th><th className="p-2 text-left">Details</th></tr>
          </thead>
          <tbody>
            {list.map(r=>(
              <tr key={r._id} className="border-t">
                <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
                <td className="p-2">{r.typeOfWork}</td>
                <td className="p-2">{r.challenge || '-'}</td>
                <td className="p-2">{r.details || '-'}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td className="p-3 text-royal/70" colSpan="4">No SEO reports</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <form onSubmit={add} className="bg-white rounded-2xl shadow-soft p-4 w-full max-w-xl">
            <h3 className="text-lg font-semibold text-navy mb-2">Add SEO Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-royal mb-1">Date</label>
                <input type="date" className="w-full border rounded-xl px-3 py-2" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
              </div>
              <div>
                <label className="block text-sm text-royal mb-1">Type of Work</label>
                <select className="w-full border rounded-xl px-3 py-2" value={form.typeOfWork} onChange={e=>setForm(f=>({...f,typeOfWork:e.target.value}))}>
                  <option>Blogpost</option><option>Backlink</option><option>Social Bookmarking</option><option>Keyword Research</option><option>Others</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-royal mb-1">Challenge</label>
                <input className="w-full border rounded-xl px-3 py-2" value={form.challenge} onChange={e=>setForm(f=>({...f,challenge:e.target.value}))}/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-royal mb-1">Details</label>
                <textarea rows="3" className="w-full border rounded-xl px-3 py-2" value={form.details} onChange={e=>setForm(f=>({...f,details:e.target.value}))}/>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={()=>setOpen(false)} className="px-4 py-2 rounded-xl border">Cancel</button>
              <button className="px-4 py-2 rounded-xl bg-gold text-navy font-semibold">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
