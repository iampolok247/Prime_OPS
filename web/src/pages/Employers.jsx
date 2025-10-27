// web/src/pages/Employers.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Employers() {
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => setItems(await api.listEmployers());
  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 md:p-6 space-y-4 font-[Poppins]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#053867]">Employers</h1>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-2xl bg-[#F7BA23] text-[#053867] hover:bg-[#F3CE49]">Add Employer</button>
      </div>

      <div className="bg-white shadow rounded-2xl p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#053867]">
              <th className="py-2">EmpID</th><th className="py-2">Name</th><th className="py-2">Address</th><th className="py-2">Job Location</th><th className="py-2">MoU Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map(e => (
              <tr key={e._id} className="border-t">
                <td className="py-2">{e.empId}</td>
                <td className="py-2">{e.name}</td>
                <td className="py-2">{e.address || '-'}</td>
                <td className="py-2">{e.jobLocation || '-'}</td>
                <td className="py-2">{e.mouDate ? new Date(e.mouDate).toLocaleDateString('en-GB') : '-'}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="py-2 text-gray-500" colSpan={5}>No employers</td></tr>}
          </tbody>
        </table>
      </div>

      {showAdd && <AddModal onClose={()=>setShowAdd(false)} onSaved={()=>{setShowAdd(false); load();}} />}
    </div>
  );
}

function AddModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', address: '', jobLocation: '', mouDate: '' });
  const submit = async () => {
    if (!form.name) return alert('Name is required');
    await api.addEmployer(form);
    onSaved();
  };
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-4 w-full max-w-xl space-y-3">
        <h3 className="text-lg font-semibold text-[#253985]">Add Employer</h3>
        <Field label="Name" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))}/>
        <Field label="Address" value={form.address} onChange={v=>setForm(f=>({...f,address:v}))}/>
        <Field label="Job Location" value={form.jobLocation} onChange={v=>setForm(f=>({...f,jobLocation:v}))}/>
        <Field label="MoU Date" type="date" value={form.mouDate} onChange={v=>setForm(f=>({...f,mouDate:v}))}/>
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
