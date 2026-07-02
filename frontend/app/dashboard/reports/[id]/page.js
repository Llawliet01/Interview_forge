'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  ArrowLeft, 
  Terminal, 
  Cpu, 
  TrendingUp, 
  Database,
  Map
} from 'lucide-react';
import Link from 'next/link';

export default function DetailedReportPage() {
  const { id: interviewId } = useParams();
  const { apiRequest } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const router = useRouter();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportDetails();
  }, [interviewId]);

  const fetchReportDetails = async () => {
    try {
      const res = await apiRequest(`/report/interview/${interviewId}`);
      if (!res.ok) {
        throw new Error('Report details could not be found.');
      }
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Could not find a report for this interview. Please complete the mock first.');
      router.push('/dashboard/reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={isLight ? { background: '#ffffff', color: '#000000' } : { background: '#150a21' }}>
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-[#43bccd] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="text-blue-200 font-semibold text-sm">Compiling assessment metrics...</span>
        </div>
      </div>
    );
  }

  // Circular progress parameter calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (report.overallScore / 100) * circumference;

  const performanceAreas = [
    { name: 'DSA & Logic', score: report.scoresBreakdown?.dsa || 0, icon: <Terminal className="h-4.5 w-4.5 text-[#ffd60a]" />, bg: 'bg-[#391c57]' },
    { name: 'Operating Systems', score: report.scoresBreakdown?.os || 0, icon: <Cpu className="h-4.5 w-4.5 text-[#ffd60a]" />, bg: 'bg-[#391c57]' },
    { name: 'DBMS / SQL', score: report.scoresBreakdown?.dbms || 0, icon: <Database className="h-4.5 w-4.5 text-[#ffd60a]" />, bg: 'bg-[#391c57]' },
    { name: 'System Design / Projects', score: report.scoresBreakdown?.projects || 0, icon: <TrendingUp className="h-4.5 w-4.5 text-[#ffd60a]" />, bg: 'bg-[#391c57]' }
  ];

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/reports" 
          className={`p-2 border rounded-lg transition-colors ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-black' : 'p-2 border border-[#552a82]/30 bg-[#391c57] rounded-lg hover:bg-[#552a82]/40 text-blue-200 hover:text-white'}`}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className={`text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Evaluation Feedback</h2>
          <p className={`text-sm mt-0.5 ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
            Interviews results for SDE candidate. Evaluated via automated evaluation checks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Circular Score and Sub-scores */}
        <div className="lg:col-span-4 space-y-6">
          {/* Circular Score card */}
          <div className={`border p-6 shadow-md flex flex-col items-center justify-center text-center space-y-4 rounded-xl ${isLight ? 'bg-white border-slate-200 text-black' : 'bg-[#2b1542]/80 border-[#552a82]/35 text-white'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Overall Grade</h3>
            
            <div className="relative h-32 w-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke={isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(67, 188, 205, 0.2)"}
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke={isLight ? "#000000" : "#ffd60a"}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-3xl font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{report.overallScore}%</span>
                <span className="text-[9px] font-bold text-blue-300 uppercase tracking-wider">Score</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full text-xs font-semibold border-t pt-4 mt-2 ${isLight ? 'border-slate-200' : 'border-[#552a82]/20'}`">
              <div className="text-center">
                <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Technical</div>
                <div className={`text-sm font-extrabold mt-0.5 ${isLight ? 'text-black' : 'text-white'}`}>{report.technicalScore}%</div>
              </div>
              <div className="text-center">
                <div className="text-blue-200 text-[10px] uppercase font-bold">Comm.</div>
                <div className="text-white text-sm font-extrabold mt-0.5">{report.communicationScore}%</div>
              </div>
            </div>
          </div>

          {/* Sub-scores grid */}
          <div className={`border p-6 shadow-md space-y-4 rounded-xl ${isLight ? 'bg-white border-slate-200 text-black' : 'bg-[#2b1542]/80 border-[#552a82]/35 text-white'}`}>
            <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider">Skills Breakdown</h3>
            <div className="space-y-3">
              {performanceAreas.map((area, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className={`flex justify-between items-center text-xs ${isLight ? 'text-black' : ''}`}>
                    <span className={`flex items-center gap-2 font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      {area.icon}
                      {area.name}
                    </span>
                    <span className={`font-extrabold ${isLight ? 'text-black' : 'text-[#ffd60a]'}`}>{area.score}%</span>
                  </div>
                  <div className={`h-1.5 w-full rounded-full overflow-hidden border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#211033] border-[#552a82]/10'}`}>
                    <div className={`h-full rounded-full ${isLight ? 'bg-black' : 'bg-[#ffd60a]'}`} style={{ width: `${area.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Detailed AI Feedback and Actions */}
        <div className="lg:col-span-8 space-y-6">
          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className={`border p-6 shadow-md space-y-4 rounded-xl ${isLight ? 'bg-white border-slate-200 text-black' : 'bg-[#2b1542]/80 border-[#552a82]/35 text-white'}`}>
              <div className={`flex items-center gap-2 border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#552a82]/20'}`}>
                <CheckCircle2 className="h-4.5 w-4.5 text-[#ffd60a]" />
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider">Key Strengths</h3>
              </div>
              <ul className="text-xs space-y-2.5 text-blue-200 leading-normal">
                {report.strengths?.map((str, idx) => (
                  <li key={idx} className={`flex gap-2 items-start ${isLight ? 'text-slate-650' : 'text-blue-200'}`}>
                    <span className="text-[#ffd60a] shrink-0 mt-0.5">✔</span>
                    <span>{str}</span>
                  </li>
                ))}
                {(!report.strengths || report.strengths.length === 0) && (
                  <li className="italic text-blue-300">Not graded.</li>
                )}
              </ul>
            </div>

            {/* Weak areas */}
            <div className={`rounded-xl border p-6 shadow-md space-y-4 ${isLight ? 'bg-white border-slate-200 text-black' : 'bg-[#2b1542]/80 border-[#552a82]/35 text-white'}`}>
              <div className={`flex items-center gap-2 border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#552a82]/20'}`}>
                <XCircle className={`h-4.5 w-4.5 ${isLight ? 'text-slate-500' : 'text-[#43bccd]'}`} />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-black' : 'text-blue-200'}`}>Weak Areas</h3>
              </div>
              <ul className={`text-xs space-y-2.5 leading-normal ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
                {report.weakAreas?.map((weak, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <span className={`shrink-0 mt-0.5 ${isLight ? 'text-slate-400' : 'text-[#43bccd]'}`}>✖</span>
                    <span>{weak}</span>
                  </li>
                ))}
                {(!report.weakAreas || report.weakAreas.length === 0) && (
                  <li className={`italic ${isLight ? 'text-slate-400' : 'text-blue-300'}`}>Excellent! No weak areas marked.</li>
                )}
              </ul>
            </div>
          </div>

          {/* AI Narrative Feedback */}
          <div className={`border p-6 shadow-md space-y-6 rounded-xl ${isLight ? 'bg-white border-slate-200 text-black' : 'bg-[#2b1542]/80 border-[#552a82]/35 text-white'}`}>
            <div className={`flex items-center gap-2 border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#552a82]/20'}`}>
              <Sparkles className={`h-4.5 w-4.5 ${isLight ? 'text-black' : 'text-[#ffd60a]'}`} />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-black' : 'text-blue-200'}`}>Executive Summary</h3>
            </div>

            <div className={`space-y-4 text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-blue-200'}`}>
              <div className="space-y-1">
                <h4 className={`font-bold text-sm ${isLight ? 'text-black' : 'text-white'}`}>What you did well</h4>
                <p className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#211033] border-[#552a82]/25 text-blue-200'}`}>
                  {report.aiFeedback?.wellDone || 'Your submissions met correctness conditions and showcased clean design layout.'}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className={`font-bold text-sm ${isLight ? 'text-black' : 'text-white'}`}>What needs improvement</h4>
                <p className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#211033] border-[#552a82]/25 text-blue-200'}`}>
                  {report.aiFeedback?.needsImprovement || 'Focus on describing time-complexity parameters and optimizing sorting logic.'}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className={`font-bold text-sm ${isLight ? 'text-black' : 'text-white'}`}>Suggested next steps</h4>
                <p className={`p-3 rounded-lg border font-semibold ${isLight ? 'bg-slate-50 border-slate-200 text-black' : 'bg-[#211033] border-[#552a82]/25 text-[#ffd60a]'}`}>
                  {report.aiFeedback?.nextSteps || 'Brush up on dynamic programming and solve 5 indexing problems.'}
                </p>
              </div>
            </div>

            {/* Quick links to Roadmap */}
            <div className={`pt-4 border-t flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-[#552a82]/20'}`}>
              <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-blue-300'}`}>A customized study calendar has been prepared.</span>
              <Link 
                href="/dashboard/roadmaps"
                className={`inline-flex items-center gap-1.5 border text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer ${isLight ? 'bg-black hover:bg-slate-800 border-black' : 'bg-[#43bccd] hover:bg-[#552a82] border-[#552a82]/35'}`}
              >
                <Map className="h-3.5 w-3.5" />
                View 30-Day Learning Plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
