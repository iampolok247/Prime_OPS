// web/src/pages/dash/AdmissionDashboard.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { 
  Users, 
  UserCheck, 
  UserX, 
  ClipboardList, 
  PhoneCall,
  GraduationCap,
  TrendingUp,
  BarChart2
} from 'lucide-react';

function fmtDT(d){ if (!d) return '-'; try { return new Date(d).toLocaleString(); } catch { return d; } }

function LineChartDualSmall({ data }){
  const width = 700, height = 220, padding = 40;
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
        <div className="text-center">
          <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">No data available</p>
        </div>
      </div>
    );
  }
  
  const max = Math.max(...data.map(d=>Math.max(d.leads||0,d.admitted||0)), 1);
  const stepX = (width - padding*2) / Math.max(1, data.length-1);
  
  const leadsPoints = data.map((d,i)=>`${padding + i*stepX},${height - padding - (max ? (d.leads / max) * (height - padding*2) : 0)}`).join(' ');
  const admittedPoints = data.map((d,i)=>`${padding + i*stepX},${height - padding - (max ? (d.admitted / max) * (height - padding*2) : 0)}`).join(' ');
  
  // Create gradient fill areas
  const leadsArea = `${leadsPoints} ${padding + (data.length-1)*stepX},${height-padding} ${padding},${height-padding}`;
  const admittedArea = `${admittedPoints} ${padding + (data.length-1)*stepX},${height-padding} ${padding},${height-padding}`;
  
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
        <defs>
          <linearGradient id="leadsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="admittedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={height - padding - (height - padding*2) * ratio}
            x2={width - padding}
            y2={height - padding - (height - padding*2) * ratio}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}
        
        {/* Area fills */}
        <polygon fill="url(#leadsGradient)" points={leadsArea} />
        <polygon fill="url(#admittedGradient)" points={admittedArea} />
        
        {/* Lines */}
        <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={leadsPoints} strokeLinecap="round" strokeLinejoin="round" />
        <polyline fill="none" stroke="#10b981" strokeWidth="3" points={admittedPoints} strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Data points */}
        {data.map((d, i) => {
          const x = padding + i * stepX;
          const yLeads = height - padding - (max ? (d.leads / max) * (height - padding*2) : 0);
          const yAdmitted = height - padding - (max ? (d.admitted / max) * (height - padding*2) : 0);
          return (
            <g key={i}>
              <circle cx={x} cy={yLeads} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
              <circle cx={x} cy={yAdmitted} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const STATUSES = [
  { key:'Assigned', label:'Assigned' },
  { key:'Counseling', label:'Counseling' },
  { key:'In Follow Up', label:'In Follow-Up' },
  { key:'Admitted', label:'Admitted' },
  { key:'Not Admitted', label:'Not Admitted' },
];

export default function AdmissionDashboard() {
  const [err, setErr] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [allLeads, setAllLeads] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all leads and batches once
  useEffect(()=> {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      // Fetch all leads and batches
      const [leadsResp, batchesResp] = await Promise.all([
        api.listAdmissionLeads().catch(()=>({ leads: [] })),
        api.listBatches().catch(()=>({ batches: [] }))
      ]);
      const leads = leadsResp?.leads || leadsResp || [];
      setAllLeads(Array.isArray(leads) ? leads : []);
      setBatches(batchesResp?.batches || []);
      setErr('');
    } catch(e) { 
      setErr(e.message || 'Failed to load'); 
    } finally {
      setLoading(false);
    }
  }

  const parseRange = () => {
    if (period === 'lifetime') return { from: null, to: null };
    if (period === 'custom') {
      if (from && to) {
        const f = new Date(from);
        f.setHours(0, 0, 0, 0);
        const t = new Date(to);
        t.setHours(23, 59, 59, 999);
        return { from: f, to: t };
      }
      // If custom selected but dates not set yet, return null to show all data
      return { from: null, to: null };
    }
    const now = new Date();
    let f = new Date();
    if (period === 'daily') { f.setDate(now.getDate() - 1); }
    else if (period === 'weekly') { f.setDate(now.getDate() - 7); }
    else if (period === 'monthly') { f.setMonth(now.getMonth() - 1); }
    else if (period === 'yearly') { f.setFullYear(now.getFullYear() - 1); }
    return { from: f, to: now };
  };

  const inRange = (d, fromD, toD) => {
    if (!d) return false;
    const t = new Date(d).getTime();
    if (fromD && t < fromD.getTime()) return false;
    if (toD && t > toD.getTime()) return false;
    return true;
  };

  const { from: rangeFrom, to: rangeTo } = parseRange();

  const metrics = React.useMemo(() => {
    const fromD = rangeFrom ? new Date(rangeFrom) : null;
    const toD = rangeTo ? new Date(rangeTo) : null;

    const leadsInRange = allLeads.filter(l => inRange(l.createdAt, fromD, toD) || (!fromD && !toD));

    const counts = {};
    // "Assigned" card shows TOTAL leads created in the period (all statuses)
    counts['Assigned'] = leadsInRange.length;
    
    // Other cards show current status counts
    STATUSES.forEach(s => {
      if (s.key !== 'Assigned') {
        counts[s.key] = leadsInRange.filter(l => l.status === s.key).length;
      }
    });

    // Compute series for chart
    const series = [];
    if (fromD && toD) {
      const cur = new Date(fromD);
      while (cur <= toD) {
        const key = cur.toISOString().slice(0,10);
        const leadsCount = allLeads.filter(l => {
          const d = new Date(l.createdAt);
          return d && d.toISOString().slice(0,10) === key;
        }).length;
        const admittedCount = allLeads.filter(l => {
          const d = l.admittedAt ? new Date(l.admittedAt) : null;
          return d && d.toISOString().slice(0,10) === key;
        }).length;
        series.push({ date: key, leads: leadsCount, admitted: admittedCount });
        cur.setDate(cur.getDate()+1);
      }
    }

    return { counts, series };
  }, [allLeads, rangeFrom, rangeTo]);

  const getStatusIcon = (key) => {
    const icons = {
      'Assigned': <ClipboardList className="w-5 h-5 text-white" />,
      'Counseling': <PhoneCall className="w-5 h-5 text-white" />,
      'In Follow Up': <Users className="w-5 h-5 text-white" />,
      'Admitted': <GraduationCap className="w-5 h-5 text-white" />,
      'Not Admitted': <UserX className="w-5 h-5 text-white" />
    };
    return icons[key] || <Users className="w-5 h-5 text-white" />;
  };

  const getStatusColor = (key) => {
    const colors = {
      'Assigned': 'from-blue-500 to-indigo-600',
      'Counseling': 'from-purple-500 to-violet-600',
      'In Follow Up': 'from-orange-500 to-amber-600',
      'Admitted': 'from-green-500 to-emerald-600',
      'Not Admitted': 'from-red-500 to-pink-600'
    };
    return colors[key] || 'from-gray-500 to-slate-600';
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Admission Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Track student admissions and pipeline</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)} 
            className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
            <option value="custom">Custom</option>
          </select>
          {period === 'custom' && (
            <>
              <input 
                type="date" 
                className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors" 
                value={from} 
                onChange={e => setFrom(e.target.value)} 
              />
              <span className="text-gray-500 font-medium">to</span>
              <input 
                type="date" 
                className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors" 
                value={to} 
                onChange={e => setTo(e.target.value)} 
              />
            </>
          )}
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700 font-medium">{err}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {STATUSES.map(s=>(
          <div key={s.key} className={`group relative bg-gradient-to-br ${getStatusColor(s.key)} rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 overflow-hidden`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  {getStatusIcon(s.key)}
                </div>
              </div>
              <p className="text-white/80 text-xs font-medium mb-1">{s.label}</p>
              <h3 className="text-2xl font-bold text-white">{metrics.counts[s.key] ?? 0}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Batch Overview Section */}
      {batches.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800">Active Batches Overview</h3>
            <p className="text-sm text-gray-500 mt-1">Track progress across all batches</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches
              .filter(b => b.status === 'Active')
              .map(batch => {
                const admitted = batch.admittedStudents?.length || 0;
                const target = batch.targetedStudent || 0;
                const progress = target > 0 ? Math.round((admitted / target) * 100) : 0;
                
                return (
                  <div 
                    key={batch._id} 
                    className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Batch Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-base mb-1">{batch.batchName}</h4>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                          {batch.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Batch ID</div>
                        <div className="text-xs font-mono font-semibold text-gray-700">{batch.batchId}</div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">Target</div>
                        <div className="text-2xl font-bold text-gray-800">{target}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">Admitted</div>
                        <div className="text-2xl font-bold text-blue-600">{admitted}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-medium">Progress</span>
                        <span className={`font-bold ${
                          progress >= 100 ? 'text-green-600' : 
                          progress >= 75 ? 'text-blue-600' : 
                          progress >= 50 ? 'text-yellow-600' : 'text-orange-600'
                        }`}>
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                            progress >= 75 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 
                            progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 
                            'bg-gradient-to-r from-orange-500 to-red-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      {progress >= 100 && (
                        <div className="flex items-center gap-1 text-green-600 text-xs font-medium mt-1">
                          <GraduationCap className="w-3 h-3" />
                          <span>Target Achieved! 🎉</span>
                        </div>
                      )}
                    </div>

                    {/* Remaining Spots */}
                    {admitted < target && (
                      <div className="mt-3 text-center">
                        <span className="text-xs text-gray-600">
                          {target - admitted} spot{target - admitted !== 1 ? 's' : ''} remaining
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {batches.filter(b => b.status === 'Active').length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No active batches available</p>
            </div>
          )}
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Leads vs Admitted</h3>
            <p className="text-sm text-gray-500 mt-1">Conversion tracking over time</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600 font-medium">Leads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600 font-medium">Admitted</span>
            </div>
          </div>
        </div>
        <LineChartDualSmall data={metrics.series} />
      </div>
    </div>
  );
}
