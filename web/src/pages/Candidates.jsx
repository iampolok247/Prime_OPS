// web/src/pages/Candidates.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "recruited", label: "Recruited" }
];

export default function Candidates() {
  const [tab, setTab] = useState("");
  const [items, setItems] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showRecruit, setShowRecruit] = useState(null); // candidate obj

  const load = async (status = tab) => {
    const data = await api.listCandidates(status);
    setItems(data);
  };

  useEffect(() => { load(""); }, []);
  useEffect(() => { (async () => { setEmployers(await api.listEmployers()); setJobs(await api.listJobs()); })(); }, []);
  useEffect(() => { load(tab); }, [tab]);

  return (
    <div className="p-4 md:p-6 space-y-4 font-[Poppins]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#053867]">Candidates</h1>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-2xl bg-[#F7BA23] text-[#053867] hover:bg-[#F3CE49]">
          Add Candidate
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full border ${t.key===tab ? 'bg-[#253985] text-white' : 'bg-white text-[#253985] border-[#253985]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white shadow rounded-2xl p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#053867]">
              <th className="py-2">CanID</th>
              <th className="py-2">Name</th>
              <th className="py-2">Interest</th>
              <th className="py-2">Source</th>
              <th className="py-2">District</th>
              <th className="py-2">Trained</th>
              <th className="py-2">Date</th>
              <th className="py-2">CV</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => (
              <tr key={c._id} className="border-t">
                <td className="py-2">{c.canId}</td>
                <td className="py-2">{c.name}</td>
                <td className="py-2">{c.jobInterest}</td>
                <td className="py-2">{c.source}</td>
                <td className="py-2">{c.district || '-'}</td>
                <td className="py-2">{c.trained ? 'Yes' : 'No'}</td>
                <td className="py-2">{new Date(c.date).toLocaleDateString('en-GB')}</td>
                <td className="py-2">{c.cvLink ? <a className="text-[#253985] underline" href={c.cvLink} target="_blank">View</a> : '-'}</td>
                <td className="py-2">
                  {!c.recruited ? (
                    <button onClick={() => setShowRecruit(c)} className="px-3 py-1 rounded-xl bg-[#253985] text-white">Recruit</button>
                  ) : (
                    <span className="px-2 py-1 rounded bg-green-100 text-green-700">Recruited</span>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="py-2 text-gray-500" colSpan={9}>No candidates</td></tr>}
          </tbody>
        </table>
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {showRecruit && <RecruitModal
        candidate={showRecruit}
        employers={employers}
        jobs={jobs.filter(j => j.status === 'Active')}
        onClose={() => setShowRecruit(null)}
        onSaved={() => { setShowRecruit(null); load(tab); }}
      />}
    </div>
  );
}

function AddModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', jobInterest: '', source: 'Facebook', district: '', trained: false, cvLink: '' });

  const submit = async () => {
    if (!form.name || !form.jobInterest) return alert('Name & Job Interest required');
    await api.addCandidate(form);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-4 w-full max-w-xl space-y-3">
        <h3 className="text-lg font-semibold text-[#253985]">Add Candidate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <Input label="Job Interest" value={form.jobInterest} onChange={v => setForm(f => ({ ...f, jobInterest: v }))} />
          <Select label="CV Source" value={form.source} onChange={v => setForm(f => ({ ...f, source: v }))} options={['Facebook','LinkedIn','Bdjobs','Reference','Prime Academy','Others']} />
          <Input label="District" value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))} />
          <Checkbox label="Trained?" checked={form.trained} onChange={v => setForm(f => ({ ...f, trained: v }))} />
          <Input label="CV Link (GDrive/OneDrive)" value={form.cvLink} onChange={v => setForm(f => ({ ...f, cvLink: v }))} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-2xl bg-gray-100">Cancel</button>
          <button onClick={submit} className="px-4 py-2 rounded-2xl bg-[#F7BA23] text-[#053867] hover:bg-[#F3CE49]">Save</button>
        </div>
      </div>
    </div>
  );
}

function RecruitModal({ candidate, employers, jobs, onClose, onSaved }) {
  const [form, setForm] = useState({ employerId: '', jobId: '', date: new Date().toISOString().slice(0,10) });

  const submit = async () => {
    if (!form.employerId || !form.jobId) return alert('Select employer & job');
    await api.recruitCandidate(candidate._id, form);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-4 w-full max-w-lg space-y-3">
        <h3 className="text-lg font-semibold text-[#253985]">Recruit {candidate.name}</h3>
        <Select label="Employer" value={form.employerId} onChange={v => setForm(f => ({ ...f, employerId: v }))} options={employers.map(e => ({ label: `${e.name} (${e.empId})`, value: e._id }))} />
        <Select label="Job Position" value={form.jobId} onChange={v => setForm(f => ({ ...f, jobId: v }))} options={jobs.map(j => ({ label: `${j.position} — ${j.jobId}`, value: j._id }))} />
        <Input label="Date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-2xl bg-gray-100">Cancel</button>
          <button onClick={submit} className="px-4 py-2 rounded-2xl bg-[#253985] text-white">Confirm Recruit</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type='text' }) {
  return (
    <label className="text-sm text-[#053867] space-y-1">
      <span>{label}</span>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#253985]" />
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  const opts = Array.isArray(options) ? options.map(v => ({label: v, value: v})) : options;
  return (
    <label className="text-sm text-[#053867] space-y-1">
      <span>{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)}
        className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#253985]">
        <option value="">Select...</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#053867]">
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
