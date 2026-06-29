'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  User, 
  Mail, 
  FileCheck,
  Sun,
  Moon,
  Volume2,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const { user, apiRequest } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  
  const [hasResume, setHasResume] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1.05);

  useEffect(() => {
    checkResumeStatus();
    // Load voice settings from localStorage
    const savedSpeed = localStorage.getItem('voiceSpeed');
    if (savedSpeed) {
      setVoiceSpeed(parseFloat(savedSpeed));
    }
  }, []);

  const checkResumeStatus = async () => {
    try {
      const res = await apiRequest('/resume');
      if (res.ok) {
        setHasResume(true);
      }
    } catch (e) {
      setHasResume(false);
    }
  };

  const handleSpeedChange = (speed) => {
    setVoiceSpeed(speed);
    localStorage.setItem('voiceSpeed', speed.toString());
  };

  const speeds = [
    { label: 'Slower (0.85x)', value: 0.85 },
    { label: 'Normal (1.0x)', value: 1.05 },
    { label: 'Faster (1.2x)', value: 1.2 },
    { label: 'Fast (1.35x)', value: 1.35 }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Settings</h2>
        <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
          Manage your account profile, configure theme preferences, and adjust voice assistant settings.
        </p>
      </div>

      {/* Account Info */}
      <div className={`rounded-2xl border p-6 shadow-sm space-y-6 ${isLight ? 'bg-white border-slate-200' : 'bg-[#2b1542]/80 border-[#552a82]/35'}`}>
        <h3 className={`text-xs font-bold border-b pb-3 uppercase tracking-wider ${isLight ? 'text-slate-800 border-slate-250' : 'text-white border-[#552a82]/30'}`}>Personal Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Candidate Name</span>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-300">
                <User className="h-4 w-4" />
              </span>
              <input 
                type="text" 
                value={user?.name || ''} 
                disabled 
                className={`w-full border rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-all cursor-not-allowed select-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#211033] border-[#552a82]/30 text-white'}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">Email Address</span>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-300">
                <Mail className="h-4 w-4" />
              </span>
              <input 
                type="email" 
                value={user?.email || ''} 
                disabled 
                className={`w-full border rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-all cursor-not-allowed select-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#211033] border-[#552a82]/30 text-white'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resume sync status */}
      <div className={`rounded-2xl border p-6 shadow-sm flex items-center justify-between gap-6 ${isLight ? 'bg-white border-slate-200' : 'bg-[#2b1542]/80 border-[#552a82]/35'}`}>
        <div className="space-y-1">
          <h3 className={`text-sm font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>Technical Resume Status</h3>
          <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
            Checks if you have parsed a tech stack profile to feed customized DSA trials.
          </p>
        </div>

        {hasResume ? (
          <span className={`inline-flex items-center gap-1.5 border text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-sm ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#391c57] border-[#552a82]/30 text-[#ffd60a]'}`}>
            <FileCheck className="h-4 w-4" />
            Resume Active
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 border text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-sm ${isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#391c57] border-[#552a82]/30 text-blue-200'}`}>
            No Resume Synced
          </span>
        )}
      </div>

      {/* Theme Settings */}
      <div className={`rounded-2xl border p-6 shadow-sm space-y-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#2b1542]/80 border-[#552a82]/35'}`}>
        <h3 className={`text-xs font-bold border-b pb-3 uppercase tracking-wider ${isLight ? 'text-slate-800 border-slate-250' : 'text-white border-[#552a82]/30'}`}>Theme Customization</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Interface Theme</h4>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>
              Toggle between Light and Dark interface appearance styles.
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs shadow-sm hover:scale-105 transition-all cursor-pointer ${
              isLight 
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700' 
                : 'bg-[#211033] hover:bg-[#391c57] border-[#552a82]/30 text-white'
            }`}
          >
            {isLight ? (
              <>
                <Moon className="h-4 w-4" />
                Switch to Dark
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 text-[#ffd60a]" />
                Switch to Light
              </>
            )}
          </button>
        </div>
      </div>

      {/* Audio Interview Voice Settings */}
      <div className={`rounded-2xl border p-6 shadow-sm space-y-6 ${isLight ? 'bg-white border-slate-200' : 'bg-[#2b1542]/80 border-[#552a82]/35'}`}>
        <h3 className={`text-xs font-bold border-b pb-3 uppercase tracking-wider ${isLight ? 'text-slate-800 border-slate-250' : 'text-white border-[#552a82]/30'}`}>Voice Assistant Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#211033] border-[#552a82]/30 text-[#ffd60a]'}`}>
              <Volume2 className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Text-to-Speech Speed</h4>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>
                Configure how fast the interviewer talks during mock audio sessions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {speeds.map((speed) => {
              const active = voiceSpeed === speed.value;
              return (
                <button
                  key={speed.value}
                  onClick={() => handleSpeedChange(speed.value)}
                  className={`py-2.5 px-4 rounded-xl border-2 font-semibold text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isLight
                      ? (active ? 'bg-slate-50 border-black text-black shadow-sm font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350')
                      : (active ? 'bg-[#391c57]/60 border-[#ffd60a] text-white shadow-md font-bold' : 'bg-[#211033] border-[#552a82]/30 text-blue-200 hover:border-[#552a82]/60')
                  }`}
                >
                  {speed.label}
                  {active && <Check className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
