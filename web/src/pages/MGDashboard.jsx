import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api.js';
import { Film, Image, FileImage, Video, TrendingUp, Calendar } from 'lucide-react';

export default function MGDashboard() {
  const [works, setWorks] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  
  // filters
  const [period, setPeriod] = useState('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const resp = await api.listMGWorks().catch(() => ({ works: [] }));
      const allWorks = resp?.works || resp || [];
      setWorks(Array.isArray(allWorks) ? allWorks : []);
      setErr('');
    } catch (e) {
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

  const stats = useMemo(() => {
    const fromD = rangeFrom ? new Date(rangeFrom) : null;
    const toD = rangeTo ? new Date(rangeTo) : null;

    const worksInRange = works.filter(w => inRange(w.createdAt, fromD, toD) || (!fromD && !toD));

    return {
      totalProduction: worksInRange.length,
      adDesign: worksInRange.filter(w => w.type === 'Ad Design' || w.type === 'ad-design').length,
      bannerDesign: worksInRange.filter(w => w.type === 'Banner Design' || w.type === 'banner-design').length,
      videoProduction: worksInRange.filter(w => w.type === 'Video Production' || w.type === 'video-production').length,
      other: worksInRange.filter(w => 
        w.type !== 'Ad Design' && 
        w.type !== 'ad-design' && 
        w.type !== 'Banner Design' && 
        w.type !== 'banner-design' && 
        w.type !== 'Video Production' && 
        w.type !== 'video-production'
      ).length,
      queued: worksInRange.filter(w => w.status === 'queued').length,
      inProgress: worksInRange.filter(w => w.status === 'in-progress').length,
      done: worksInRange.filter(w => w.status === 'done').length
    };
  }, [works, rangeFrom, rangeTo]);

  // Pie chart data
  const pieData = [
    { label: 'Ad Design', value: stats.adDesign, color: '#3b82f6' },
    { label: 'Banner Design', value: stats.bannerDesign, color: '#10b981' },
    { label: 'Video Production', value: stats.videoProduction, color: '#f59e0b' },
    { label: 'Other', value: stats.other, color: '#6366f1' }
  ].filter(item => item.value > 0);

  const totalForPie = pieData.reduce((sum, item) => sum + item.value, 0);

  // Generate pie chart paths
  const generatePieChart = () => {
    if (totalForPie === 0) return [];
    
    let currentAngle = -90; // Start from top
    return pieData.map((item, index) => {
      const percentage = item.value / totalForPie;
      const angle = percentage * 360;
      
      const startAngle = (currentAngle * Math.PI) / 180;
      const endAngle = ((currentAngle + angle) * Math.PI) / 180;
      
      const x1 = 50 + 40 * Math.cos(startAngle);
      const y1 = 50 + 40 * Math.sin(startAngle);
      const x2 = 50 + 40 * Math.cos(endAngle);
      const y2 = 50 + 40 * Math.sin(endAngle);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const path = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
        `Z`
      ].join(' ');
      
      currentAngle += angle;
      
      return { ...item, path, percentage: Math.round(percentage * 100) };
    });
  };

  const pieChartPaths = generatePieChart();

  // Bar chart data for status distribution
  const maxStatusValue = Math.max(stats.queued, stats.inProgress, stats.done, 1);
  const barData = [
    { label: 'Queued', value: stats.queued, color: '#ef4444', height: (stats.queued / maxStatusValue) * 100 },
    { label: 'In Progress', value: stats.inProgress, color: '#3b82f6', height: (stats.inProgress / maxStatusValue) * 100 },
    { label: 'Done', value: stats.done, color: '#10b981', height: (stats.done / maxStatusValue) * 100 }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Motion Graphics Dashboard</h1>
        <p className="text-gray-600 mt-1">Production analytics and performance metrics</p>
      </div>

      {err && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{err}</div>}
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 text-navy font-semibold mb-3">
          <Calendar size={20} />
          <span>Time Period</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)} 
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
            <option value="custom">Custom Range</option>
          </select>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={from} 
                onChange={e=>setFrom(e.target.value)} 
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <span className="text-gray-500">to</span>
              <input 
                type="date" 
                value={to} 
                onChange={e=>setTo(e.target.value)} 
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Total Production</p>
              <p className="text-4xl font-bold">{stats.totalProduction}</p>
            </div>
            <Film size={48} className="text-purple-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Ad Design</p>
              <p className="text-4xl font-bold">{stats.adDesign}</p>
            </div>
            <Image size={48} className="text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Total Banner Design</p>
              <p className="text-4xl font-bold">{stats.bannerDesign}</p>
            </div>
            <FileImage size={48} className="text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Total Video Production</p>
              <p className="text-4xl font-bold">{stats.videoProduction}</p>
            </div>
            <Video size={48} className="text-orange-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Production Type Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-navy mb-4">Production Type Distribution</h3>
          
          {totalForPie === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Film size={48} className="mx-auto mb-2 opacity-50" />
                <p>No production data available</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Pie Chart SVG */}
              <div className="flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-64 h-64">
                  {pieChartPaths.map((item, index) => (
                    <g key={index}>
                      <path
                        d={item.path}
                        fill={item.color}
                        stroke="white"
                        strokeWidth="0.5"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </g>
                  ))}
                  {/* Center circle for donut effect */}
                  <circle cx="50" cy="50" r="20" fill="white" />
                  <text 
                    x="50" 
                    y="48" 
                    textAnchor="middle" 
                    className="text-xs font-bold fill-navy"
                  >
                    Total
                  </text>
                  <text 
                    x="50" 
                    y="56" 
                    textAnchor="middle" 
                    className="text-lg font-bold fill-navy"
                  >
                    {totalForPie}
                  </text>
                </svg>
              </div>
              
              {/* Legend */}
              <div className="flex-1 space-y-3">
                {pieChartPaths.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-navy">{item.value}</span>
                      <span className="text-sm text-gray-500 ml-2">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart - Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Status Distribution
          </h3>
          
          {stats.totalProduction === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                <p>No status data available</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bar Chart */}
              <div className="flex items-end justify-around gap-4 h-64 px-4">
                {barData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-sm font-bold text-navy">{item.value}</div>
                    <div 
                      className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                      style={{ 
                        backgroundColor: item.color,
                        height: `${item.height}%`,
                        minHeight: item.value > 0 ? '20px' : '0'
                      }}
                    />
                    <div className="text-xs text-gray-600 text-center font-medium">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Summary */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                {barData.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <p className="text-xl font-bold text-navy">{item.value}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalProduction > 0 
                        ? `${Math.round((item.value / stats.totalProduction) * 100)}%` 
                        : '0%'
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
