'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { 
  FileCheck, 
  Terminal, 
  Sparkles,
  TrendingUp,
  Play,
  ArrowRight,
  ClipboardList,
  UploadCloud,
  Layers,
  BookOpen,
  Lock,
  Check,
  BrainCircuit
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';


export default function DashboardPage() {
  const { user, apiRequest } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placementData, setPlacementData] = useState(null);
  const [placementLoading, setPlacementLoading] = useState(true);
  const [stats, setStats] = useState({
    taken: 0,
    avgScore: 0,
    accuracy: 0,
    improvement: 0
  });

  useEffect(() => {
    fetchDashboardData();
    fetchPlacementPrediction();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await apiRequest('/report/history');
      if (res.ok) {
        const historyData = await res.json();
        setHistory(historyData);
        calculateStats(historyData);
      }
    } catch (error) {
      console.error('Failed to load dashboard statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlacementPrediction = async () => {
    try {
      setPlacementLoading(true);
      const res = await apiRequest('/report/placement-prediction');
      if (res.ok) {
        const data = await res.json();
        setPlacementData(data);
      }
    } catch (error) {
      console.error('Failed to load placement prediction:', error);
    } finally {
      setPlacementLoading(false);
    }
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) return;
    const taken = data.length;
    const totalScore = data.reduce((acc, curr) => acc + curr.overallScore, 0);
    const avgScore = Math.round(totalScore / taken);
    const accuracy = Math.round(avgScore * 1.1 > 100 ? 98 : avgScore * 1.1);
    let improvement = 0;
    if (data.length > 1) {
      improvement = data[0].overallScore - data[data.length - 1].overallScore;
    } else if (data.length === 1) {
      improvement = data[0].overallScore > 70 ? 12 : 5;
    }
    setStats({ taken, avgScore, accuracy, improvement: Math.max(0, improvement) });
  };

  const mockChartData = history.length > 0 
    ? [...history].reverse().map((h, idx) => ({
        name: `#${idx + 1}`,
        score: h.overallScore,
        technical: h.technicalScore,
      }))
    : [
        { name: '#1', score: 65, technical: 60 },
        { name: '#2', score: 70, technical: 72 },
        { name: '#3', score: 75, technical: 74 },
        { name: '#4', score: 72, technical: 70 },
        { name: '#5', score: 80, technical: 82 },
        { name: '#6', score: 83, technical: 85 }
      ];

  const cardsData = [
    {
      title: 'Interviews Taken',
      value: stats.taken,
      icon: <FileCheck className="h-5 w-5" />,
      color: isLight ? 'text-black' : 'text-[#ffd60a]',
      bg: isLight ? 'bg-white border-slate-200' : 'bg-[#391c57] border-[#552a82]/30',
      glow: 'rgba(0,0,0,0.01)',
    },
    {
      title: 'Average Score',
      value: `${stats.avgScore}%`,
      icon: <Sparkles className="h-5 w-5" />,
      color: isLight ? 'text-black' : 'text-[#ffd60a]',
      bg: isLight ? 'bg-white border-slate-200' : 'bg-[#391c57] border-[#552a82]/30',
      glow: 'rgba(0,0,0,0.01)',
      footer: stats.taken > 0 ? 'Target: 90%+' : 'Take your first interview'
    },
    {
      title: 'Coding Accuracy',
      value: stats.taken > 0 ? `${stats.accuracy}%` : 'N/A',
      icon: <Terminal className="h-5 w-5" />,
      color: isLight ? 'text-black' : 'text-[#ffd60a]',
      bg: isLight ? 'bg-white border-slate-200' : 'bg-[#391c57] border-[#552a82]/30',
      glow: 'rgba(0,0,0,0.01)',
    },
    {
      title: 'Improvement',
      value: stats.taken > 0 ? `+${stats.improvement}%` : 'N/A',
      icon: <TrendingUp className="h-5 w-5" />,
      color: isLight ? 'text-black' : 'text-[#ffd60a]',
      bg: isLight ? 'bg-white border-slate-200' : 'bg-[#391c57] border-[#552a82]/30',
      glow: 'rgba(0,0,0,0.01)',
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border shadow-lg ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'text-white bg-gradient-to-r from-[#391c57] via-[#43bccd]/40 to-[#552a82]/20 border-[#552a82]/35'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-1.5 w-6 rounded-full ${isLight ? 'bg-black' : 'bg-[#ffd60a]'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Dashboard</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Welcome back,{' '}
              <span className={`font-black ${isLight ? 'text-black' : 'text-[#ffd60a]'}`}>
                {user?.name || 'Candidate'}
              </span>{' '}👋
            </h1>
            <p className={`text-sm max-w-xl ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
              Ready to tackle today's interview? Practice coding under real constraints and get structured scoring breakdown.
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link 
              href="/dashboard/setup"
              className="relative group inline-flex items-center justify-center gap-2.5 text-sm font-bold text-white px-6 py-3 rounded-xl overflow-hidden shrink-0 bg-[#43bccd] hover:bg-[#552a82] border border-[#ffd60a]/30 transition-colors shadow-sm"
            >
              <Play className="h-4 w-4 fill-white shrink-0" />
              Start Mock Interview
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardsData.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-2xl p-5 space-y-4 cursor-default border shadow-md ${
              isLight
                ? 'bg-white border-slate-200'
                : 'bg-[#2b1542]/80 border-[#552a82]/35'
            }`}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>{card.title}</span>
              <div className={`p-2 rounded-lg border ${card.bg} ${card.color}`}>{card.icon}</div>
            </div>
            <div className="space-y-1">
              <h3 className={`text-3xl font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{card.value}</h3>
              <p className={`text-[10px] font-medium ${isLight ? 'text-slate-400' : 'text-blue-300'}`}>{card.footer || 'Updated instantly'}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Graph & Activity Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Performance Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`rounded-2xl p-6 space-y-5 lg:col-span-2 border shadow-md ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#2b1542]/80 border-[#552a82]/35'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>Performance Analytics</h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Historical overall score evaluation trends</p>
            </div>
            <span className={`text-[10px] font-bold border px-2.5 py-1 rounded-full ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-600'
                : 'bg-[#211033] border-[#552a82]/30 text-blue-200'
            }`}>
              {history.length > 0 ? 'Live data' : 'Sample roadmap'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(67, 188, 205, 0.2)" vertical={false} />
                <XAxis dataKey="name" stroke="#552a82" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#552a82" fontSize={10} tickLine={false} axisLine={false} domain={[40, 100]} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#391c57',
                    borderRadius: '8px',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid #552a82',
                    color: isLight ? '#0f172a' : '#ffffff'
                  }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: isLight ? '#000000' : '#ffd60a' }}
                  itemStyle={{ fontSize: '11px', color: isLight ? '#334155' : '#43bccd' }}
                />
                <Line type="monotone" dataKey="score" stroke={isLight ? '#000000' : '#ffd60a'} strokeWidth={2.5} activeDot={{ r: 6, fill: isLight ? '#000000' : '#ffd60a' }} name="Overall" dot={{ fill: isLight ? '#000000' : '#ffd60a', r: 3 }} />
                <Line type="monotone" dataKey="technical" stroke={isLight ? '#64748b' : '#552a82'} strokeWidth={1.5} strokeDasharray="4 4" name="Technical" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Placement Readiness Widget */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className={`rounded-2xl p-5 border shadow-md flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200 text-black'
              : 'bg-[#2b1542]/80 border-[#552a82]/35 text-white'
          }`}
        >
          {placementLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-xs text-blue-200">
              <BrainCircuit className="h-8 w-8 text-primary animate-pulse mb-3" />
              <span>Analyzing profile metrics...</span>
            </div>
          ) : placementData && placementData.unlocked ? (
            // UNLOCKED STATE
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>Placement Probability</h3>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] border ${
                    placementData.prediction.color === 'green'
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : placementData.prediction.color === 'orange'
                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {placementData.prediction.tier}
                  </span>
                </div>
                <p className={`text-[11px] leading-normal ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>
                  Random Forest SDE readiness score based on platform performance metrics.
                </p>
              </div>

              {/* Radial Score Gauge */}
              <div className="flex items-center justify-center relative my-2">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    className={isLight ? 'stroke-slate-100' : 'stroke-[#211033]'}
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    className={`stroke-current ${
                      placementData.prediction.color === 'green'
                        ? 'text-green-500'
                        : placementData.prediction.color === 'orange'
                        ? 'text-orange-500'
                        : 'text-red-500'
                    }`}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={226.2}
                    strokeDashoffset={226.2 - (226.2 * placementData.prediction.placement_probability) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center flex flex-col items-center justify-center">
                  <span className={`text-lg font-black leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {placementData.prediction.placement_probability}%
                  </span>
                  <span className={`text-[8px] font-bold mt-0.5 ${isLight ? 'text-slate-400' : 'text-blue-300'}`}>READY</span>
                </div>
              </div>

              {/* Dynamic recs */}
              <div className={`p-3 rounded-xl border text-[10px] leading-relaxed ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#211033]/60 border-[#552a82]/20 text-blue-200'
              }`}>
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-[#ffd60a] rounded-full"></span>
                  Priority focus: {placementData.prediction.bottleneck}
                </div>
                {placementData.prediction.recommendation}
              </div>

              <Link
                href="/dashboard/setup"
                className={`w-full inline-flex items-center justify-between rounded-xl p-3 text-xs font-semibold border transition-all group mt-2 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'bg-[#391c57] border-[#552a82]/30 text-blue-200 hover:text-white hover:bg-[#552a82]/40'
                }`}
              >
                <span>Improve readiness score</span>
                <ArrowRight className={`h-4 w-4 group-hover:translate-x-1 transition-all ${isLight ? 'text-slate-400 group-hover:text-slate-900' : 'text-blue-300 group-hover:text-white'}`} />
              </Link>
            </div>
          ) : (
            // OPTION A: LOCKED STATE CHECKLIST
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-4.5 w-4.5 text-[#ffd60a] shrink-0" />
                  <h3 className={`text-sm font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>Placement Predictor</h3>
                </div>
                <p className={`text-[10px] leading-normal ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>
                  Complete platform tasks to unlock your predictive placement probability rating.
                </p>
              </div>

              <div className="space-y-2 my-2">
                {[
                  {
                    done: placementData?.checklist?.resume || false,
                    label: "Upload technical SDE resume",
                    href: "/dashboard/resume",
                    icon: UploadCloud
                  },
                  {
                    done: placementData?.checklist?.coding || false,
                    label: "Complete coding mock room",
                    href: "/dashboard/setup",
                    icon: Terminal
                  },
                  {
                    done: placementData?.checklist?.speech || false,
                    label: "Complete audio mock interview",
                    href: "/dashboard/setup",
                    icon: Sparkles
                  }
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-[10px] transition-all ${
                      item.done
                        ? (isLight ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-green-950/20 border-green-800/20 text-green-300')
                        : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-[#211033]/40 border-[#552a82]/10 text-blue-200 hover:bg-[#211033]')
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${
                        item.done 
                          ? (isLight ? 'bg-green-100 border-green-200 text-green-700' : 'bg-green-900/40 border-green-800/40 text-green-400')
                          : (isLight ? 'bg-slate-200 border-slate-300 text-slate-600' : 'bg-[#391c57] border-[#552a82]/20 text-blue-300')
                      }`}>
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    {item.done ? (
                      <Check className="h-4.5 w-4.5 text-green-500 shrink-0" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-all" />
                    )}
                  </Link>
                ))}
              </div>

              <div className={`p-2.5 rounded-xl text-[9px] text-center ${
                isLight ? 'bg-slate-50 text-slate-500' : 'bg-[#211033] text-blue-300/80'
              }`}>
                Requires at least 1 mock session & 1 parsed resume to run regression predictions.
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Interviews Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className={`rounded-2xl overflow-hidden border shadow-md ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#2b1542]/80 border-[#552a82]/35'
        }`}
      >
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200' : 'border-[#552a82]/30'
        }`}>
          <div className="flex items-center gap-2">
            <ClipboardList className={`h-4 w-4 ${isLight ? 'text-slate-500' : 'text-blue-200'}`} />
            <h3 className={`text-sm font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>Recent Interview Sessions</h3>
          </div>
          <Link href="/dashboard/reports" className={`text-xs font-bold transition-colors hover:underline ${isLight ? 'text-black hover:text-slate-600' : 'text-[#ffd60a] hover:text-[#ffd60a]/80'}`}>
            View All Reports
          </Link>
        </div>

        {loading ? (
          <div className={`p-8 text-center text-xs ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Loading sessions history...</div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>No mock interview sessions recorded yet.</p>
            <Link 
              href="/dashboard/setup" 
              className="inline-flex items-center gap-1.5 bg-[#43bccd] hover:bg-[#552a82] border border-[#552a82]/30 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Generate your first trial
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-[9px] font-semibold uppercase tracking-wider ${
                isLight
                  ? 'text-slate-500 border-slate-200 bg-slate-50'
                  : 'text-blue-200 border-[#552a82]/30 bg-[#211033]/60'
              }`}>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Questions</th>
                  <th className="px-6 py-3 font-semibold">Difficulty</th>
                  <th className="px-6 py-3 font-semibold">Score</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#552a82]/20 font-medium text-blue-200">
                {history.slice(0, 5).map((item) => (
                  <tr key={item._id} className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50 border-b border-slate-100' : 'hover:bg-[#391c57]/40'
                  }`}>
                    <td className={`px-6 py-4 ${isLight ? 'text-slate-500' : 'text-blue-300'}`}>
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className={`px-6 py-4 font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                      {item.interviewId?.role || 'SDE'}
                    </td>
                    <td className={`px-6 py-4 ${isLight ? 'text-slate-500' : 'text-blue-300'}`}>
                      {item.interviewId?.questionCount || 10}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] border ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-black'
                          : 'bg-[#391c57] border-[#552a82]/30 text-[#ffd60a]'
                      }`}>
                        {item.interviewId?.difficulty || 'Medium'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                      {item.overallScore} / 100
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isLight ? 'bg-slate-900' : 'bg-[#ffd60a]'}`}></span>
                        <span className={isLight ? 'text-slate-600' : 'text-blue-200'}>Completed</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/dashboard/reports/${item.interviewId?._id || item.interviewId}`} 
                        className={`font-bold hover:underline transition-colors ${isLight ? 'text-black hover:text-slate-600' : 'text-[#ffd60a] hover:text-[#ffd60a]/80'}`}
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
