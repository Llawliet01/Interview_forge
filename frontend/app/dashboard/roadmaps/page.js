'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { Map, Calendar, BookOpen, Link2, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function StudyRoadmapPage() {
  const { apiRequest } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState({});

  useEffect(() => {
    fetchRoadmap();
    // Load completed tasks from localStorage to let user track completion locally
    const stored = localStorage.getItem('completed_roadmap_tasks');
    if (stored) {
      setCompletedTasks(JSON.parse(stored));
    }
  }, []);

  const fetchRoadmap = async () => {
    try {
      const res = await apiRequest('/report/roadmap');
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data);
      }
    } catch (error) {
      console.log('No roadmap currently available.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (weekNum, taskIdx) => {
    const key = `${weekNum}-${taskIdx}`;
    const nextState = {
      ...completedTasks,
      [key]: !completedTasks[key]
    };
    setCompletedTasks(nextState);
    localStorage.setItem('completed_roadmap_tasks', JSON.stringify(nextState));
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Study Roadmap</h2>
        <p className={`text-sm mt-1 ${isLight ? 'text-slate-650' : 'text-blue-200'}`}>
          A personalized 30-day preparation calendar tailored around focus areas identified in your mock coding sessions.
        </p>
      </div>

      {loading ? (
        <div className="text-center p-12 text-blue-200 text-xs animate-pulse">Syncing study schedules...</div>
      ) : !roadmap ? (
        <div className={`border rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 shadow-md ${isLight ? 'bg-white border-slate-200' : 'bg-[#2b1542]/80 border-[#552a82]/35'}`}>
          <Map className="h-10 w-10 text-blue-300 mx-auto" />
          <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>No active learning plans</h4>
          <p className={`text-[11px] leading-normal ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
            Your study roadmap is generated dynamically after completing an interview coding round. Let's generate one now.
          </p>
          <Link 
            href="/dashboard/setup" 
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm border cursor-pointer ${isLight ? 'bg-black hover:bg-slate-800 text-white border-black' : 'bg-[#43bccd] hover:bg-[#552a82] text-white border-[#ffd60a]/30'}`}
          >
            Launch Interview
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Weak Topics summary */}
          <div className={`rounded-2xl border p-5 shadow-md space-y-3.5 ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'border-[#552a82]/30 bg-[#2b1542]/80 text-white'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Identified focus areas:</h3>
            <div className="flex flex-wrap gap-2.5">
              {roadmap.weakTopics?.map((topic, idx) => (
                <span key={idx} className={`text-xs border px-3.5 py-1.5 rounded-full font-bold shadow-sm animate-soft-pulse ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#391c57] border-[#552a82]/35 text-[#ffd60a]'}`}>
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Week Cards timeline */}
          <div className="space-y-6">
            {roadmap.weeks?.map((week, idx) => {
              // Calculate completion progress
              const totalTasks = week.tasks?.length || 0;
              let doneCount = 0;
              for (let i = 0; i < totalTasks; i++) {
                if (completedTasks[`${week.weekNumber}-${i}`]) {
                  doneCount++;
                }
              }
              const pct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

              return (
                <motion.div
                  key={week.weekNumber}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`rounded-2xl border p-6 shadow-md space-y-6 relative overflow-hidden transition-all duration-300 ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'border-[#552a82]/30 bg-[#2b1542]/80 text-white'}`}
                >
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4 relative z-10 ${isLight ? 'border-slate-200' : 'border-[#552a82]/30'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 border rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#391c57] text-[#ffd60a] border-[#552a82]/30'}`}>
                        W{week.weekNumber}
                      </div>
                      <div>
                        <h3 className={`text-sm font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>
                          {week.topic || 'Revision and Practice'}
                        </h3>
                        <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Week {week.weekNumber} Strategy</p>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Progress: {pct}%</span>
                      <div className={`h-1.5 w-24 rounded-full overflow-hidden border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#211033] border-[#552a82]/20'}`}>
                        <div className={`h-full rounded-full transition-all duration-500 ease-out ${isLight ? 'bg-black' : 'bg-gradient-to-r from-[#43bccd] to-[#ffd60a]'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                    {/* Tasks checklist */}
                    <div className="md:col-span-8 space-y-3">
                      <h4 className={`text-xs font-bold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        <Calendar className="h-4 w-4 text-blue-200" />
                        Weekly Practice Tasks
                      </h4>
                      <div className="space-y-2">
                        {week.tasks?.map((task, tIdx) => {
                          const isDone = !!completedTasks[`${week.weekNumber}-${tIdx}`];
                          return (
                            <div 
                              key={tIdx}
                              onClick={() => toggleTask(week.weekNumber, tIdx)}
                              className={`p-3 rounded-xl border text-xs flex gap-3 items-start cursor-pointer transition-all duration-200 select-none ${
                                isDone 
                                  ? (isLight ? 'bg-slate-100 border-slate-200/50 text-slate-400' : 'bg-[#211033]/40 border-[#552a82]/20 text-blue-300/60') 
                                  : (isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-100' : 'bg-[#211033] border-[#552a82]/30 text-blue-200 hover:border-[#552a82]/60 hover:bg-[#391c57]/30')
                              }`}
                            >
                              <div 
                                className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                                  isDone 
                                    ? (isLight ? 'bg-black border-black text-white' : 'bg-[#43bccd] border-[#ffd60a]/35 text-white') 
                                    : (isLight ? 'border-slate-300 bg-white' : 'border-[#552a82]/50 bg-[#211033]')
                                }`}
                              >
                                {isDone && (
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`leading-relaxed ${isDone ? 'line-through opacity-50' : 'font-medium ${isLight ? "text-slate-800" : "text-white"}'}`}>{task}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Learning Resources */}
                    <div className="md:col-span-4 space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-200" />
                        Recommended Resources
                      </h4>
                      <div className={`border rounded-xl p-4 space-y-2.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#211033] border-[#552a82]/30'}`}>
                        {week.resources?.map((res, rIdx) => (
                          <div 
                            key={rIdx} 
                            className={`group/res text-xs flex gap-2.5 items-center font-semibold py-1 px-1.5 rounded-lg transition-all cursor-default ${isLight ? 'text-slate-650 hover:text-black hover:bg-slate-100' : 'text-blue-200 hover:text-white hover:bg-[#391c57]/30'}`}
                          >
                            <Link2 className="h-3.5 w-3.5 text-blue-350 group-hover/res:text-[#ffd60a] transition-all shrink-0" />
                            <span className="truncate">{res}</span>
                          </div>
                        ))}
                        {(!week.resources || week.resources.length === 0) && (
                          <p className="text-[10px] text-blue-300 italic px-1.5">Self-study resources list.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
