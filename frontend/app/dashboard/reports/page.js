'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Award, 
  ArrowRight, 
  BrainCircuit, 
  TrendingUp, 
  Sparkles,
  Filter,
  Clock
} from 'lucide-react';

export default function ReportsHistoryPage() {
  const { apiRequest } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sorting state
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDiff, setSelectedDiff] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'highest-score'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiRequest('/report/history');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Failed to load history list:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic performance stats calculation
  const totalAttempts = reports.length;
  const avgOverall = totalAttempts > 0
    ? Math.round(reports.reduce((acc, r) => acc + (r.overallScore || 0), 0) / totalAttempts)
    : 0;
  const avgTech = totalAttempts > 0
    ? Math.round(reports.reduce((acc, r) => acc + (r.technicalScore || 0), 0) / totalAttempts)
    : 0;
  const highestScore = totalAttempts > 0
    ? Math.max(...reports.map(r => r.overallScore || 0))
    : 0;

  // Extract unique roles for filters
  const uniqueRoles = ['All', ...new Set(reports.map(r => r.interviewId?.role).filter(Boolean))];

  // Filtering logic
  const filteredReports = reports.filter(report => {
    const roleMatch = selectedRole === 'All' || report.interviewId?.role === selectedRole;
    const diffMatch = selectedDiff === 'All' || report.interviewId?.difficulty === selectedDiff;
    return roleMatch && diffMatch;
  });

  // Sorting logic
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'highest-score') return (b.overallScore || 0) - (a.overallScore || 0);
    return 0;
  });

  // Pagination bounds
  const paginatedReports = sortedReports.slice(0, currentPage * itemsPerPage);
  const hasMore = sortedReports.length > paginatedReports.length;

  return (
    <div className="space-y-6 pb-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Reports History</h2>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-650' : 'text-blue-200'}`}>
            Review detailed outcomes of all your mock interview attempts and performance evaluations.
          </p>
        </div>
        <Link
          href="/dashboard/setup"
          className={`inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all shadow-sm shrink-0 self-start md:self-auto cursor-pointer ${isLight ? 'bg-black hover:bg-slate-800 text-white border-black' : 'bg-[#43bccd] hover:bg-[#552a82] text-white border-[#ffd60a]/30'}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Start New Round
        </Link>
      </div>

      {/* Dynamic Performance Stats Row */}
      {totalAttempts > 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Rounds Completed', val: totalAttempts, suffix: '', icon: <FileText className="h-4 w-4" />, color: 'text-[#ffd60a]', bg: 'bg-[#391c57] border-[#552a82]/30' },
            { label: 'Avg Overall Score', val: avgOverall, suffix: '%', icon: <TrendingUp className="h-4 w-4" />, color: 'text-[#ffd60a]', bg: 'bg-[#391c57] border-[#552a82]/30' },
            { label: 'Avg Technical Score', val: avgTech, suffix: '%', icon: <BrainCircuit className="h-4 w-4" />, color: 'text-[#ffd60a]', bg: 'bg-[#391c57] border-[#552a82]/30' },
            { label: 'Highest Performance', val: highestScore, suffix: '%', icon: <Award className="h-4 w-4" />, color: 'text-[#ffd60a]', bg: 'bg-[#391c57] border-[#552a82]/30' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`border rounded-2xl p-4 flex items-center justify-between shadow-md ${isLight ? 'bg-white border-slate-200' : 'border-[#552a82]/30 bg-[#2b1542]/80'}`}
            >
              <div className="space-y-1">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>{stat.label}</p>
                <h3 className={`text-xl font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>
                  {stat.val}{stat.suffix}
                </h3>
              </div>
              <div className={`p-2 rounded-lg border shrink-0 ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#391c57] border-[#552a82]/30 text-[#ffd60a]'}`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Filters Toolbar */}
      {totalAttempts > 0 && !loading && (
        <div 
          className={`border p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md ${isLight ? 'bg-white border-slate-200' : 'border-[#552a82]/30 bg-[#2b1542]/80'}`}
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Role */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Filter className="h-3.5 w-3.5 text-[#ffd60a] shrink-0" />
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setCurrentPage(1);
                }}
                className={`border text-xs font-bold py-1.5 px-3 rounded-xl focus:outline-none cursor-pointer min-w-[120px] ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-black' : 'bg-[#211033] border-[#552a82]/30 text-white focus:border-[#ffd60a]'}`}
              >
                <option value="All">All Roles</option>
                {uniqueRoles.filter(r => r !== 'All').map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Filter by Difficulty */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Difficulty</span>
              <select
                value={selectedDiff}
                onChange={(e) => {
                  setSelectedDiff(e.target.value);
                  setCurrentPage(1);
                }}
                className={`border text-xs font-bold py-1.5 px-3 rounded-xl focus:outline-none cursor-pointer min-w-[100px] ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-black' : 'bg-[#211033] border-[#552a82]/30 text-white focus:border-[#ffd60a]'}`}
              >
                <option value="All">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Sort By selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="h-3.5 w-3.5 text-[#ffd60a]" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className={`border text-xs font-bold py-1.5 px-3 rounded-xl focus:outline-none cursor-pointer min-w-[130px] ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-black' : 'bg-[#211033] border-[#552a82]/30 text-white focus:border-[#ffd60a]'}`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest-score">Highest Score</option>
            </select>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className={`text-center p-12 text-xs animate-pulse ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Fetching report records...</div>
      ) : reports.length === 0 ? (
        <div 
          className={`border rounded-2xl p-12 text-center max-w-md mx-auto shadow-md space-y-4 ${isLight ? 'bg-white border-slate-200' : 'border-[#552a82]/35 bg-[#2b1542]/80'}`}
        >
          <FileText className="h-10 w-10 text-blue-300 mx-auto" />
          <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>No reports recorded</h4>
          <p className={`text-[11px] leading-normal ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
            You need to setup and complete an interview coding session first. Let's get started.
          </p>
          <Link 
            href="/dashboard/setup" 
            className="inline-flex items-center gap-1.5 bg-[#43bccd] hover:bg-[#552a82] border border-[#ffd60a]/35 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-md"
          >
            Start Mock Interview
          </Link>
        </div>
      ) : sortedReports.length === 0 ? (
        <div className={`text-center p-12 border border-dashed rounded-2xl max-w-md mx-auto ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'border-[#552a82]/35 bg-[#211033]'}`}>
          <p className="text-xs text-blue-200 font-semibold">No reports matched your filters</p>
          <p className="text-[10px] text-blue-300 mt-1">Try resetting the role or difficulty selectors.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedReports.map((report, idx) => (
                <motion.div
                  layout
                  key={report._id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className={`border p-6 flex flex-col justify-between transition-all duration-300 cursor-default group rounded-2xl shadow-md ${isLight ? 'bg-white border-slate-200' : 'border-[#552a82]/30 bg-[#2b1542]/80'}`}
                  whileHover={isLight ? { y: -3, borderColor: '#000000', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' } : { y: -3, borderColor: '#ffd60a', boxShadow: '0 8px 24px rgba(67, 188, 205, 0.35)' }}
                >
                  <div className="space-y-4">
                    <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#552a82]/20'}`}>
                      <div className="space-y-1">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#391c57] border-[#552a82]/35 text-[#ffd60a]'}`}>
                          {report.interviewId?.difficulty || 'Medium'}
                        </span>
                        <h3 className={`text-sm font-extrabold mt-1 group-hover:text-white transition-colors ${isLight ? 'text-black group-hover:text-black' : 'text-white'}`}>
                          {report.interviewId?.role || 'SDE Candidate'}
                        </h3>
                      </div>

                      <div className="text-right">
                        <div className={`text-2xl font-black ${isLight ? 'text-black' : 'text-white'}`}>{report.overallScore}%</div>
                        <div className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${isLight ? 'text-slate-500' : 'text-blue-250'}`}>Overall Grade</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-blue-200">
                      <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#211033] border-[#552a82]/30'}`}>
                        <div className={`text-[9px] font-bold uppercase mb-0.5 tracking-wider ${isLight ? 'text-slate-400' : 'text-blue-300'}`}>Technical</div>
                        <div className={`mt-0.5 font-bold ${isLight ? 'text-black' : 'text-white'}`}>{report.technicalScore}%</div>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#211033] border-[#552a82]/30'}`}>
                        <div className={`text-[9px] font-bold uppercase mb-0.5 tracking-wider ${isLight ? 'text-slate-400' : 'text-blue-300'}`}>Communication</div>
                        <div className={`mt-0.5 font-bold ${isLight ? 'text-black' : 'text-white'}`}>{report.communicationScore}%</div>
                      </div>
                    </div>

                    <div className={`flex justify-between items-center text-[10px] ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-blue-300" />
                        {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold">
                        <BrainCircuit className="h-3.5 w-3.5 text-blue-300" />
                        {report.interviewId?.questionCount || 10} questions checked
                      </span>
                    </div>
                  </div>

                  <div className={`pt-6 border-t mt-6 ${isLight ? 'border-slate-100' : 'border-[#552a82]/25'}`}>
                    <Link 
                      href={`/dashboard/reports/${report.interviewId?._id || report.interviewId}`} 
                      className={`w-full inline-flex items-center justify-between text-xs font-bold hover:underline transition-colors group/link ${isLight ? 'text-black hover:text-slate-650' : 'text-[#ffd60a] hover:text-[#ffd60a]/80'}`}
                    >
                      <span>Review detailed evaluation</span>
                      <ArrowRight className="h-4 w-4 transform group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Load More Trigger */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-6 py-2.5 border font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md outline-btn ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-black border-slate-250' : 'bg-[#391c57] hover:bg-[#552a82]/30 border-[#552a82]/35 text-white'}`}
              >
                Load More Reports
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
