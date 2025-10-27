// web/src/pages/RecruitIncome.jsx
import { useEffect, useMemo, useState } from "react";
import { api, fmtBDT } from "../lib/api";

export default function RecruitIncome() {
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.listRecIncome();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = useMemo(
    () => items.reduce((sum, x) => sum + (Number(x.amount) || 0), 0),
    [items]
  );

  const remove = async (id) => {
    if (!confirm("Delete this income entry?")) return;
    await api.deleteRecIncome(id);
    load();
  };

  return (
    <div className="p-4 md:p-6 space-y-4 font-[Poppins]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#053867]">Recruitment Income</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-2xl bg-[#F7BA23] text-[#053867] hover:bg-[#F3CE49]"
        >
          Add Income
        </button>
      </div>

      <div className="bg-white shadow rounded-2xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[#253985] font-semibold">
            Total: <span className="font-bold">{fmtBDT(total)}</span>
          </div>
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#053867]">
              <th className="py-2">Date</th>
              <th className="py-2">Source</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="py-2">{r.date ? new Date(r.date).toLocaleDateString('en-GB') : '-'}</td>
                <td className="py-2">{r.source || '-'}</td>
                <td className="py-2">{fmtBDT(r.amount)}</td>
                <td className="py-2">
                  <button
                    onClick={() => remove(r._id)}
                    className="px-3 py-1 rounded-xl bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="py-3 text-gray-500" colSpan={4}>No income entries</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function AddModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    source: "",
    amount: ""
  });

  const submit = async () => {
    if (!form.source) return alert("Source is required");
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return alert("Enter a valid amount");
    await api.addRecIncome({ date: form.date, source: form.source, amount });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-4 w-full max-w-lg space-y-3">
        <h3 className="text-lg font-semibold text-[#253985]">Add Income</h3>
        <Field label="Date" type="date" value={form.date} onChange={(v)=>setForm(f=>({...f, date:v}))} />
        <Field label="Source" value={form.source} onChange={(v)=>setForm(f=>({...f, source:v}))} placeholder="Employer Fee / Commission / Consultancy" />
        <Field label="Amount (BDT)" type="number" value={form.amount} onChange={(v)=>setForm(f=>({...f, amount:v}))} />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-2xl bg-gray-100">Cancel</button>
          <button onClick={submit} className="px-4 py-2 rounded-2xl bg-[#F7BA23] text-[#053867] hover:bg-[#F3CE49]">Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <label className="text-sm text-[#053867] space-y-1 block">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#253985]"
      />
    </label>
  );
}
