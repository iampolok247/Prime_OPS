import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function FeesApproval() {
  const { user } = useAuth();
  if (user?.role !== 'Accountant') {
    return <div className="text-royal">Only Accountant can approve fees.</div>;
  }

  const [status, setStatus] = useState('Pending');
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const { fees } = await api.listFeesForApproval(status);
      setRows(fees || []);
      setErr(null);
    } catch (e) { setErr(e.message); }
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const approve = async (id) => {
    setMsg(null); setErr(null);
    try { await api.approveFee(id); setMsg('Approved'); load(); } catch (e) { setErr(e.message); }
  };
  const reject = async (id) => {
    setMsg(null); setErr(null);
    try { await api.rejectFee(id); setMsg('Rejected'); load(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-navy">Fees Approval</h1>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded-xl px-3 py-2">
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
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
              <th className="p-3 text-left">Submitted By</th>
              <th className="p-3 text-left">Status</th>
              {status === 'Pending' && <th className="p-3 text-left">Action</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(f => (
              <tr key={f._id} className="border-t">
                <td className="p-3">
                  {f.lead?.leadId} — {f.lead?.name}
                  <div className="text-xs text-royal/70">{f.lead?.phone} {f.lead?.email ? `• ${f.lead.email}` : ''}</div>
                </td>
                <td className="p-3">{f.courseName}</td>
                <td className="p-3">৳ {f.amount}</td>
                <td className="p-3">{f.method}</td>
                <td className="p-3">{new Date(f.paymentDate).toLocaleDateString()}</td>
                <td className="p-3">{f.submittedBy?.name || '-'}</td>
                <td className="p-3">{f.status}</td>
                {status === 'Pending' && (
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={()=>approve(f._id)} className="px-3 py-1 rounded-lg border hover:bg-[#f0fff4]">Approve</button>
                      <button onClick={()=>reject(f._id)} className="px-3 py-1 rounded-lg border hover:bg-red-50 text-red-700">Reject</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="p-4 text-royal/70" colSpan="8">No items</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
