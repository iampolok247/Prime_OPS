import React, { useEffect, useMemo, useState } from 'react';
import { api, fmtDate } from '../lib/api.js';

const types = ['Reel','Short','Explainer','Ad','Banner','Other'];
const platforms = ['Facebook','Instagram','YouTube','TikTok','X','Other'];
const statuses = ['Queued','InProgress','Review','Done','Hold'];

export default function MGProduction() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10),
    title: '',
    type: 'Reel',
    platform: 'Facebook',
    durationSec: 0,
    assignedTo: '',
    status: 'Queued',
    assetLink: '',
    notes: ''
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await api.listMGWorks({});
      setItems(list);
      setErr('');
    } catch (e) {
      setErr(e.message || 'Load failed');
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createMGWork(form);
      setForm(prev => ({ ...prev, title:'', durationSec:0, notes:'', assetLink:'' }));
      refresh();
    } catch (e) { alert(e.message || 'Create failed'); }
  };

  const onUpdate = async (id, payload) => {
    try { await api.updateMGWork(id, payload); refresh(); }
    catch (e) { alert(e.message || 'Update failed'); }
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await api.deleteMGWork(id); refresh(); }
    catch (e) { alert(e.message || 'Delete failed'); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-navy">Motion Graphics — Production Log</h1>

      {/* Create */}
      <form onSubmit={onCreate} className="bg-white p-4 rounded-xl shadow-sm space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <input className="input" type="date" value={form.date}
                 onChange={(e)=>setForm(f=>({...f, date:e.target.value}))}/>
          <input className="input" placeholder="Title" value={form.title}
                 onChange={(e)=>setForm(f=>({...f, title:e.target.value}))}/>
          <select className="input" value={form.type}
                  onChange={(e)=>setForm(f=>({...f, type:e.target.value}))}>
            {types.map(t=><option key={t}>{t}</option>)}
          </select>
          <select className="input" value={form.platform}
                  onChange={(e)=>setForm(f=>({...f, platform:e.target.value}))}>
            {platforms.map(p=><option key={p}>{p}</option>)}
          </select>
          <input className="input" type="number" min="0" placeholder="Duration (sec)" value={form.durationSec}
                 onChange={(e)=>setForm(f=>({...f, durationSec:Number(e.target.value||0)}))}/>
          <input className="input" placeholder="Assigned to" value={form.assignedTo}
                 onChange={(e)=>setForm(f=>({...f, assignedTo:e.target.value}))}/>
          <select className="input" value={form.status}
                  onChange={(e)=>setForm(f=>({...f, status:e.target.value}))}>
            {statuses.map(s=><option key={s}>{s}</option>)}
          </select>
          <input className="input" placeholder="Asset link (Drive/YouTube)" value={form.assetLink}
                 onChange={(e)=>setForm(f=>({...f, assetLink:e.target.value}))}/>
          <input className="input md:col-span-3" placeholder="Notes" value={form.notes}
                 onChange={(e)=>setForm(f=>({...f, notes:e.target.value}))}/>
        </div>
        <button className="btn btn-primary">Add Work</button>
      </form>

      {/* Table */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        {err && <div className="text-red-600 mb-2">{err}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-royal">
                <th className="py-2">Date</th>
                <th>Title</th>
                <th>Type</th>
                <th>Platform</th>
                <th>Dur(s)</th>
                <th>Status</th>
                <th>Asset</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-3" colSpan={9}>Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td className="py-3" colSpan={9}>No records</td></tr>
              ) : items.map(it => (
                <tr key={it._id} className="border-t">
                  <td className="py-2">{fmtDate(it.date)}</td>
                  <td>{it.title}</td>
                  <td>
                    <select className="input h-8" value={it.type}
                            onChange={e=>onUpdate(it._id,{ type:e.target.value })}>
                      {types.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="input h-8" value={it.platform}
                            onChange={e=>onUpdate(it._id,{ platform:e.target.value })}>
                      {platforms.map(p=><option key={p}>{p}</option>)}
                    </select>
                  </td>
                  <td>
                    <input className="input h-8 w-20" type="number" min="0" value={it.durationSec||0}
                           onChange={e=>onUpdate(it._id,{ durationSec:Number(e.target.value||0) })}/>
                  </td>
                  <td>
                    <select className="input h-8" value={it.status}
                            onChange={e=>onUpdate(it._id,{ status:e.target.value })}>
                      {statuses.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="truncate max-w-[180px]">
                    {it.assetLink ? <a className="text-blue-600 underline" href={it.assetLink} target="_blank">open</a> : '-'}
                  </td>
                  <td className="truncate max-w-[220px]">{it.notes || '-'}</td>
                  <td>
                    <button className="text-red-600" onClick={()=>onDelete(it._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
