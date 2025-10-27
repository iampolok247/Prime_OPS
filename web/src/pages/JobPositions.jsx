// web/src/pages/JobPositions.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function JobPositions() {
  const [jobs, setJobs] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => setJobs(await api.listJobs());
  useEffect(() => { load(); (async()=>setEmployers(await api.listEmployers()))(); }, []);

  return (
    <div className="p-4 md:p-6 space-y-4 font-[Poppins]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#053867]">Job Positions</h1>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-2xl bg-[#F7BA23] text-[#053867] hover:bg-[#F3CE49]">Add Job</button>
      </div>

      <div className="bg-white shadow rounded-2xl p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#053867]">
              <th className="py-2">JobID</th><th className="py-2">Position</th><th className="py-2">Employer</th><th className="py-2">Salary</th><th className="py-2">Deadline</th><th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j._id} className="border-t">
                <td className="py-2">{j.jobId}</td>
                <td className="py-2">{j.position}</td>
                <td className="py-2">{j.employer?.name || '-'}</td>
                <td className="py-2">{j.salaryRange || '-'}</td>
                <td className="py-2">{j.deadline ? new Date(j.deadline).toLocaleDateString('en-GB') : '-'}</td>
                <td className="py-2">{j.status}</td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td className="py-2 text-gray-500" colSpan={6}>No jobs</td></tr>}
          </tbody>
        </table>
      </div>

      {showAdd && <AddModal employers={employers} onClose={()=>setShowAdd(false)} onSaved={()=>{setShowAdd(false); load();}} />}
    </div>
  );
}

function AddModal({ employers, onClose, onSaved }) {
  const [form, setForm] = useState({ position: '', employerId: '', salaryRange: '', deadline: '', status: 'Active' });

  const submit = async () => {
    if (!form.position || !form.employerId) return alert('Position & Employer required');
    await api.addJob(form);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-4 w-full max-w-xl space-y-3">
        <h3 className="text-lg font-semibold text-[#253985]">Add Job Position</h3>
        <Field label="Position" value={form.position} onChange={v=>setForm(f=>({...f,position:v}))}/>
        <Select label="Employer" value={form.employerId} onChange={v=>setForm(f=>({...f,employerId:v}))}
                options={employers.map(e=>({label:`${e.name} (${e.empId})`, value:e._id}))}/>
        <Field label="Salary Range" value={form.salaryRange} onChange={v=>setForm(f=>({...f,salaryRange:v}))}/>
        <Field label="Deadline" type="date" value={form.deadline} onChange={v=>setForm(f=>({...f,deadline:v}))}/>
        <Select label="Status" value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} options={['Active','Inactive'].map(x=>({label:x,value:x}))}/>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-2xl bg-gray-100">Cancel</button>
          <button onClick={submit} className="px-4 py-2 rounded-2xl bg-[#F7BA23] text-[#053867] hover:bg-[#F3CE49]">Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type='text' }) {
  return (
    <label className="text-sm text-[#053867] space-y-1 block">
      <span>{label}</span>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#253985]"/>
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <label className="text-sm text-[#053867] space-y-1 block">
      <span>{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)} className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#253985]">
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
