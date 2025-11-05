// web/src/pages/RecruitmentDashboard.jsx
import React, { useEffect, useState } from "react";
import { api, fmtBDT } from "../lib/api";
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  Building2,
  Clock,
  TrendingUp,
  BarChart2,
  Target,
  DollarSign
} from 'lucide-react';

export default function RecruitmentDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  
  // Target data
  const [targets, setTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  
  // filters
  const [period, setPeriod] = useState('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    loadAll();
    loadTargets();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [candResp, jobsResp, empResp] = await Promise.all([
        api.listCandidates().catch(() => ({ candidates: [] })),
        api.listJobs().catch(() => ({ jobs: [] })),
        api.listEmployers().catch(() => ({ employers: [] }))
      ]);
      setCandidates(candResp?.candidates || candResp || []);
      setJobs(jobsResp?.jobs || jobsResp || []);
      setEmployers(empResp?.employers || empResp || []);
      setErr('');
    } catch (e) {
      setErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function loadTargets() {
    setLoadingTargets(true);
    try {
      // Get current month in YYYY-MM format
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const currentMonth = `${year}-${month}`;
      
      // Get recruitment targets for current month
      const resp = await api.getTargets(currentMonth, null, null);
      const allTargets = resp?.targets || [];
      
      // Filter only recruitment targets
      const recruitmentTargets = allTargets.filter(t => 
        t.targetType === 'RecruitmentCandidate' || t.targetType === 'RecruitmentRevenue'
      );
      
      setTargets(recruitmentTargets);
    } catch (e) {
      console.error('Failed to load targets:', e);
    } finally {
      setLoadingTargets(false);
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

    const candInRange = candidates.filter(c => inRange(c.createdAt, fromD, toD) || (!fromD && !toD));
    const jobsInRange = jobs.filter(j => inRange(j.createdAt, fromD, toD) || (!fromD && !toD));

    const totalRecruitment = candInRange.length;
    const pendingCandidate = candInRange.filter(c => c.status === 'pending').length;
    const activeJobPosition = jobsInRange.filter(j => j.status === 'active').length;
    const totalEmployer = employers.length; // Employers don't have date filter

    // Compute series for last 6 months from range end
    const series = [];
    if (toD) {
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(toD);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const monthLabel = monthStart.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const candidatesCount = candidates.filter(c => inRange(c.createdAt, monthStart, monthEnd)).length;
        const recruitedCount = candidates.filter(c => c.status === 'recruited' && inRange(c.recruitedAt || c.updatedAt, monthStart, monthEnd)).length;
        
        series.push({ month: monthLabel, candidates: candidatesCount, recruited: recruitedCount });
      }
    }

    return { totalRecruitment, pendingCandidate, activeJobPosition, totalEmployer, series };
  }, [candidates, jobs, employers, rangeFrom, rangeTo]);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Recruitment Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Track candidates and job positions</p>
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
                value={from} 
                onChange={e=>setFrom(e.target.value)} 
                className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
              />
              <span className="text-gray-500 font-medium">to</span>
              <input 
                type="date" 
                value={to} 
                onChange={e=>setTo(e.target.value)} 
                className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recruitment */}
        <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-xs font-medium mb-1">Total Recruitment</p>
            <h3 className="text-2xl font-bold text-white">{metrics.totalRecruitment}</h3>
          </div>
        </div>

        {/* Pending Candidate */}
        <div className="group relative bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-xs font-medium mb-1">Pending Candidate</p>
            <h3 className="text-2xl font-bold text-white">{metrics.pendingCandidate}</h3>
          </div>
        </div>

        {/* Active Job Position */}
        <div className="group relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-xs font-medium mb-1">Active Job Position</p>
            <h3 className="text-2xl font-bold text-white">{metrics.activeJobPosition}</h3>
          </div>
        </div>

        {/* Total Employer */}
        <div className="group relative bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-xs font-medium mb-1">Total Employer</p>
            <h3 className="text-2xl font-bold text-white">{metrics.totalEmployer}</h3>
          </div>
        </div>
      </div>

      {/* Team Target Card */}
      {!loadingTargets && (
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Team Targets</h2>
              <p className="text-white/80 text-sm">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          
          {targets.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 border border-white/20 text-center">
              <Target className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Targets Set</h3>
              <p className="text-white/70 text-sm">
                Contact your admin to set recruitment targets for this month
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {targets.map((target) => {
              const isCandidate = target.targetType === 'RecruitmentCandidate';
              const achieved = target.achieved || 0;
              const targetValue = target.targetValue || 0;
              const percentage = targetValue > 0 ? Math.round((achieved / targetValue) * 100) : 0;
              const assignedUser = target.assignedTo?.name || 'Team';
              
              return (
                <div key={target._id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        {isCandidate ? (
                          <Users className="w-5 h-5 text-white" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {isCandidate ? 'Candidates' : 'Revenue'}
                        </h3>
                        <p className="text-white/70 text-sm">{assignedUser}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white/70 text-sm mb-1">Achievement</p>
                        <p className="text-3xl font-bold text-white">
                          {isCandidate ? achieved : fmtBDT(achieved)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/70 text-sm mb-1">Target</p>
                        <p className="text-xl font-semibold text-white">
                          {isCandidate ? targetValue : fmtBDT(targetValue)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80 font-medium">Progress</span>
                        <span className="text-white font-bold">{percentage}%</span>
                      </div>
                      <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage >= 100
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                              : percentage >= 75
                              ? 'bg-gradient-to-r from-blue-400 to-cyan-500'
                              : percentage >= 50
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                              : 'bg-gradient-to-r from-red-400 to-pink-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {target.note && (
                      <p className="text-white/70 text-sm mt-3 italic">
                        "{target.note}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Candidate vs Recruited</h3>
            <p className="text-sm text-gray-500 mt-1">Last 6 months performance</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600 font-medium">Candidates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600 font-medium">Recruited</span>
            </div>
          </div>
        </div>
        <RecruitmentChart data={metrics.series} />
      </div>
    </div>
  );
}

function RecruitmentChart({ data }) {
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

  const maxValue = Math.max(...data.map(d => Math.max(d.candidates || 0, d.recruited || 0)), 1);
  const barWidth = 40;
  const barGap = 10;
  const groupWidth = barWidth * 2 + barGap;
  const padding = { left: 50, right: 30, top: 30, bottom: 60 };
  const chartWidth = padding.left + padding.right + (groupWidth + 30) * data.length;
  const chartHeight = 300;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="min-w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={padding.top + graphHeight * (1 - ratio)}
              x2={chartWidth - padding.right}
              y2={padding.top + graphHeight * (1 - ratio)}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <text
              x={padding.left - 10}
              y={padding.top + graphHeight * (1 - ratio) + 4}
              textAnchor="end"
              fontSize="12"
              fill="#6b7280"
            >
              {Math.round(maxValue * ratio)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((item, index) => {
          const x = padding.left + index * (groupWidth + 30);
          const candidatesHeight = (item.candidates / maxValue) * graphHeight;
          const recruitedHeight = (item.recruited / maxValue) * graphHeight;

          return (
            <g key={index}>
              {/* Candidates bar */}
              <rect
                x={x}
                y={padding.top + graphHeight - candidatesHeight}
                width={barWidth}
                height={candidatesHeight}
                fill="url(#candidatesGradient)"
                rx="4"
              />
              <text
                x={x + barWidth / 2}
                y={padding.top + graphHeight - candidatesHeight - 5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#3b82f6"
              >
                {item.candidates}
              </text>

              {/* Recruited bar */}
              <rect
                x={x + barWidth + barGap}
                y={padding.top + graphHeight - recruitedHeight}
                width={barWidth}
                height={recruitedHeight}
                fill="url(#recruitedGradient)"
                rx="4"
              />
              <text
                x={x + barWidth + barGap + barWidth / 2}
                y={padding.top + graphHeight - recruitedHeight - 5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#10b981"
              >
                {item.recruited}
              </text>

              {/* Month label */}
              <text
                x={x + groupWidth / 2}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#374151"
                fontWeight="500"
              >
                {item.month}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="candidatesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="recruitedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
