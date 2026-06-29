'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle2,
  Code2,
  Briefcase,
  GraduationCap,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Award,
  Trophy,
  Sparkles,
  Heart,
  Globe,
  Target,
  TrendingUp,
  BookOpen,
  Layers,
  ChevronRight,
  Search,
  X,
  Zap,
  Shield,
  Star,
  RefreshCw
} from 'lucide-react';

/* ─── Framer Motion variants ─────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }
  })
};

const cardHover = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  hover: { y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }
};

/* ─── Animated Progress Bar ──────────────────────────────── */
function AnimatedBar({ value, color = 'bg-[#ffd60a]', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const { theme } = useTheme();
  const isLight = theme === 'light';
  return (
    <div ref={ref} className={`h-2 rounded-full overflow-hidden border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#211033] border-[#552a82]/10'}`}>
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={inView ? { width: `${value}%` } : { width: 0 }}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/* ─── Circular Gauge ────────────────────────────────────── */
function ScoreGauge({ score }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = isLight ? '#000000' : (score >= 75 ? '#ffd60a' : score >= 50 ? '#552a82' : '#43bccd');
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-24 h-24">
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full opacity-5 blur-md"
          style={{ background: color }}
        />
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke={isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(67, 188, 205, 0.2)"} strokeWidth="8" />
          <motion.circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-xl font-black ${isLight ? 'text-black' : 'text-white'}`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {score}
          </motion.span>
          <span className={`text-[8px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>%</span>
        </div>
      </div>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'border-[#552a82]/35 text-[#ffd60a] bg-[#391c57]'}`}
      >
        {label} Match
      </span>
    </div>
  );
}

/* ─── Section Card ──────────────────────────────────────── */
function SectionCard({ icon: Icon, title, accent = 'blue', children, className = '', delay = 0 }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const accents = isLight ? {
    blue:   { icon: 'text-black',    border: 'border-slate-200',    bg: 'bg-slate-100' },
    violet: { icon: 'text-black',  border: 'border-slate-200',  bg: 'bg-slate-100' },
    emerald:{ icon: 'text-black', border: 'border-slate-200', bg: 'bg-slate-100' },
    amber:  { icon: 'text-black',   border: 'border-slate-200',   bg: 'bg-slate-100' },
    rose:   { icon: 'text-black',    border: 'border-slate-200',    bg: 'bg-slate-100' },
    cyan:   { icon: 'text-black',    border: 'border-slate-200',    bg: 'bg-slate-100' },
  } : {
    blue:   { icon: 'text-[#ffd60a]',    border: 'border-[#552a82]/30',    bg: 'bg-[#391c57]' },
    violet: { icon: 'text-[#ffd60a]',  border: 'border-[#552a82]/30',  bg: 'bg-[#391c57]' },
    emerald:{ icon: 'text-[#ffd60a]', border: 'border-[#552a82]/30', bg: 'bg-[#391c57]' },
    amber:  { icon: 'text-[#ffd60a]',   border: 'border-[#552a82]/30',   bg: 'bg-[#391c57]' },
    rose:   { icon: 'text-[#ffd60a]',    border: 'border-[#552a82]/30',    bg: 'bg-[#391c57]' },
    cyan:   { icon: 'text-[#ffd60a]',    border: 'border-[#552a82]/30',    bg: 'bg-[#391c57]' },
  };
  const a = accents[accent] || accents.blue;

  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      custom={delay}
      className={`rounded-2xl border overflow-hidden ${className} ${isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-[#552a82]/30 bg-[#2b1542]/80 text-white'}`}
      style={{
        transition: 'box-shadow 0.3s, transform 0.3s',
      }}
    >
      {/* Header stripe */}
      <div className={`px-4 py-2.5 flex items-center gap-2.5 border-b ${a.border}`}>
        <div className={`p-1.5 rounded-lg ${a.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${a.icon}`} />
        </div>
        <h3 className={`font-bold text-xs ${isLight ? 'text-black' : 'text-white'}`}>{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

/* ─── Skill / Tag Chip ──────────────────────────────────── */
function Chip({ label, variant = 'default', size = 'md' }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const variants = isLight ? {
    default: 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350 hover:text-black',
    tech:    'bg-slate-100 border-slate-250 text-black',
    green:   'bg-slate-100 border-slate-250 text-black',
    red:     'bg-slate-100 border-slate-250 text-black',
    amber:   'bg-slate-100 border-slate-250 text-black',
    violet:  'bg-slate-100 border-slate-250 text-black',
  } : {
    default: 'bg-[#211033] border-[#552a82]/30 text-blue-200 hover:border-[#552a82]/60 hover:text-white',
    tech:    'bg-[#391c57] border-[#552a82]/35 text-[#ffd60a]',
    green:   'bg-[#391c57] border-[#552a82]/35 text-[#ffd60a]',
    red:     'bg-[#391c57] border-[#552a82]/35 text-[#43bccd]',
    amber:   'bg-[#391c57] border-[#552a82]/35 text-[#ffd60a]',
    violet:  'bg-[#391c57] border-[#552a82]/35 text-[#ffd60a]',
  };
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-3 py-1',
  };
  return (
    <span className={`inline-flex items-center font-semibold border rounded-full transition-colors cursor-default ${variants[variant]} ${sizes[size]}`}>
      {label}
    </span>
  );
}

const atsWeights = [
  { label: 'Skills Match', pct: 40, color: 'bg-[#ffd60a]', icon: Target },
  { label: 'Experience Match', pct: 30, color: 'bg-[#43bccd]', icon: Briefcase },
  { label: 'Projects Match', pct: 15, color: 'bg-[#552a82]', icon: Layers },
  { label: 'Certifications', pct: 8, color: 'bg-[#ffd60a]', icon: Shield },
  { label: 'Achievements & Awards', pct: 4, color: 'bg-[#f86624]', icon: Trophy },
  { label: 'Education', pct: 3, color: 'bg-[#ffd60a]', icon: GraduationCap }
];

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function ResumeUploadPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { apiRequest } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [analyzingAts, setAnalyzingAts] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [atsTab, setAtsTab] = useState('checker'); // 'checker' | 'howto'

  /* ── API calls ── */
  const handleCalculateAts = async () => {
    setAnalyzingAts(true);
    setAtsResult(null);
    try {
      const res = await apiRequest('/calculate-ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jobDesc })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to analyze ATS match.');
      setAtsResult(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setAnalyzingAts(false);
    }
  };

  useEffect(() => { fetchParsedResume(); }, []);

  const fetchParsedResume = async () => {
    try {
      const res = await apiRequest('/resume');
      if (res.ok) setResumeData(await res.json());
    } catch { /* no resume yet */ }
  };

  /* ── Drag & drop ── */
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndUpload(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e) => {
    if (e.target.files?.[0]) validateAndUpload(e.target.files[0]);
  };

  const validateAndUpload = async (targetFile) => {
    if (targetFile.type !== 'application/pdf') {
      setErrorMsg('Please upload a PDF file.');
      return;
    }
    setFile(targetFile);
    setErrorMsg('');
    setUploading(true);
    const formData = new FormData();
    formData.append('resume', targetFile);
    try {
      const res = await apiRequest('/upload-resume', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Upload failed.');
      setResumeData(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">

      {/* ── PAGE HEADER ── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="visible"
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border shadow-lg ${isLight ? 'bg-white border-slate-200 text-black' : 'text-white bg-gradient-to-r from-[#391c57] via-[#43bccd]/40 to-[#552a82]/20 border-[#552a82]/35'}`}
      >
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-8 h-60 w-60 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="h-4 w-4 text-[#ffd60a]" />
              <span className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Smart Parser</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Resume Analysis</h1>
            <p className="text-blue-200 text-xs mt-0.5 max-w-md">
              Upload your PDF resume — our proprietary parser extracts details to supercharge your interview prep.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`rounded-xl px-3 py-1.5 text-center border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#391c57] border-[#552a82]/30'}`}>
              <div className={`text-sm font-black ${isLight ? 'text-black' : 'text-white'}`}>100%</div>
              <div className={`text-[8px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Offline ATS</div>
            </div>
            <div className={`rounded-xl px-3 py-1.5 text-center border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#391c57] border-[#552a82]/30'}`}>
              <div className={`text-sm font-black ${isLight ? 'text-black' : 'text-white'}`}>Free</div>
              <div className={`text-[8px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Instant</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── TOP CARDS ROW (Upload & ATS Checker) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

          {/* Upload card */}
          <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
            className={`rounded-2xl border overflow-hidden shadow-md ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'border-[#552a82]/30 bg-[#2b1542]/80 text-white'}`}
          >
            <div className={`px-4 py-2.5 border-b flex items-center gap-2.5 ${isLight ? 'border-slate-200' : 'border-[#552a82]/30'}`}>
              <div className={`p-1.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#211033] border-[#552a82]/30 text-white'}`}>
                <Upload className="h-3.5 w-3.5 text-[#ffd60a]" />
              </div>
              <h3 className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Upload Resume</h3>
              {resumeData && (
                <span className={`ml-auto flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${isLight ? 'text-black bg-slate-100 border-slate-200' : 'text-[#ffd60a] bg-[#391c57] border-[#552a82]/30'}`}>
                  <CheckCircle2 className="h-2.5 w-2.5 text-[#ffd60a]" /> Synced
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              {/* Error Banner */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-rose-950/70 border border-rose-800/40 text-rose-200 rounded-xl p-2.5 flex items-start gap-2 text-[11px] font-medium"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-300" />
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg('')} className="ml-auto ghost-btn text-rose-300 hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Drop zone */}
              <form
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onSubmit={(e) => e.preventDefault()}
                className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center text-center gap-2 transition-all duration-300 ${
                  isLight
                    ? (dragActive ? 'border-black bg-slate-100 scale-[1.01]' : (file ? 'border-slate-400 bg-slate-50' : 'border-slate-200 bg-white hover:border-black'))
                    : (dragActive ? 'border-[#ffd60a] bg-[#391c57] scale-[1.01]' : (file ? 'border-[#552a82]/60 bg-[#211033]' : 'border-[#552a82]/35 bg-[#211033]/60 hover:border-[#ffd60a]/60'))
                }`}
              >
                <input
                  type="file"
                  id="resume-file-input"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                />

                {/* Icon */}
                <label 
                  htmlFor={uploading ? undefined : "resume-file-input"}
                  className={uploading ? "cursor-not-allowed" : "cursor-pointer"}
                >
                  <motion.div
                    animate={uploading ? { scale: [1, 1.12, 1], rotate: [0, 8, -8, 0] } : {}}
                    transition={{ duration: 1.2, repeat: uploading ? Infinity : 0 }}
                    className={`p-2.5 rounded-xl border hover:scale-105 transition-transform ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#391c57] border-[#552a82]/30'}`}
                  >
                    {file && !uploading
                      ? <CheckCircle2 className="h-5 w-5 text-[#ffd60a]" />
                      : uploading
                      ? <RefreshCw className="h-5 w-5 text-white animate-spin" />
                      : <Upload className="h-5 w-5 text-blue-300" />
                    }
                  </motion.div>
                </label>

                <AnimatePresence mode="wait">
                  {uploading ? (
                    <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1">
                      <p className={`text-xs font-bold ${isLight ? 'text-black' : 'text-white'}`}>Analyzing resume…</p>
                      <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Extracting skills via system parser</p>
                      <div className={`h-1 w-28 rounded-full mx-auto overflow-hidden mt-1 ${isLight ? 'bg-slate-150' : 'bg-[#211033]'}`}>
                        <div className={`h-full rounded-full animate-soft-pulse w-full ${isLight ? 'bg-black' : 'bg-[#ffd60a]'}`} />
                      </div>
                    </motion.div>
                  ) : file ? (
                    <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-0.5">
                      <p className={`text-xs font-bold truncate max-w-[150px] ${isLight ? 'text-slate-800' : 'text-white'}`}>{file.name}</p>
                      <label htmlFor="resume-file-input" className={`text-[10px] font-semibold hover:underline cursor-pointer ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
                        Replace file
                      </label>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-0.5">
                      <p className={`text-xs font-semibold ${isLight ? 'text-slate-650' : 'text-blue-200'}`}>
                        Drop your resume, or{' '}
                        <label htmlFor="resume-file-input" className={`font-bold hover:underline cursor-pointer ${isLight ? 'text-black' : 'text-[#ffd60a]'}`}>
                          browse
                        </label>
                      </p>
                      <p className="text-[10px] text-blue-300">PDF format · up to 10 MB</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>

          {/* ATS How-It-Works / Checker toggle card */}
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible"
            className={`rounded-2xl border overflow-hidden shadow-md ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'border-[#552a82]/30 bg-[#2b1542]/80 text-white'}`}
          >
            {/* Tab switcher */}
            <div className={`px-4 py-2.5 border-b flex gap-1 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#552a82]/30 bg-[#211033]/60'}`}>
              {[
                { key: 'checker', label: 'ATS Checker', icon: Target },
                { key: 'howto',   label: 'How It Works', icon: BookOpen },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setAtsTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 text-[11px] font-bold rounded-lg transition-all duration-200 ${
                    atsTab === key
                      ? 'bg-[#43bccd] text-white shadow-sm border border-[#ffd60a]/35'
                      : 'text-blue-200 hover:text-white hover:bg-[#552a82]/20'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {atsTab === 'checker' ? (
                <motion.div
                  key="checker"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                  className="p-4 space-y-3"
                >
                  <p className="text-[11px] text-blue-200 leading-normal">
                    Paste a job description to score how well your resume matches.
                  </p>
                  <textarea
                    rows={3}
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Paste the Job Description here…"
                    className={`w-full text-xs p-3 border rounded-xl focus:outline-none focus:ring-2 resize-none font-medium transition-all ${isLight ? 'border-slate-200 bg-slate-50 text-black placeholder-slate-400 focus:border-black focus:ring-slate-200/50' : 'border-[#552a82]/30 bg-[#211033] text-white placeholder-blue-300 focus:border-[#ffd60a] focus:ring-[#ffd60a]/10'}`}
                  />
                  <motion.button
                    onClick={handleCalculateAts}
                    disabled={analyzingAts || !jobDesc.trim() || !resumeData}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs bg-[#43bccd] text-white py-2.5 rounded-xl font-bold border border-[#ffd60a]/30 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#552a82] transition-all shadow-sm cursor-pointer"
                  >
                    {analyzingAts ? (
                      <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analyzing…</>
                    ) : (
                      <><Zap className="h-3.5 w-3.5" /> Calculate ATS Score</>
                    )}
                  </motion.button>
                  {!resumeData && (
                    <p className="text-[9px] text-blue-300 text-center font-medium">
                      ↑ Upload a resume first to enable scoring
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="howto"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="p-4 space-y-2.5"
                >
                  <p className="text-[11px] text-blue-200 leading-normal mb-1">
                    Offline weighted matrix matching resume against JD:
                  </p>
                  {atsWeights.map(({ label, pct, color, icon: Icon }, i) => (
                    <div key={label} className="space-y-0.5">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-blue-200">
                        <span className="flex items-center gap-1">
                          <Icon className="h-3 w-3 text-blue-300" />
                          {label}
                        </span>
                        <span className={`${isLight ? 'text-slate-500' : 'text-blue-300'}`}>{pct}%</span>
                      </div>
                      <AnimatedBar value={pct * 2.5} color={color} delay={i * 0.05} />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>

        {/* ── BOTTOM SECTIONS (Extracted Info & ATS Results) ── */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {resumeData ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >

                {/* ── ATS RESULT PANEL ── */}
                <AnimatePresence>
                  {atsResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className={`rounded-2xl border overflow-hidden shadow-md ${isLight ? 'bg-white border-slate-200 text-slate-850' : 'border-[#552a82]/30 bg-[#2b1542]/80 text-white'}`}
                    >
                      {/* Header */}
                      <div className={`px-4 py-2.5 border-b flex items-center gap-2.5 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#552a82]/30 bg-[#211033]/65'}`}>
                        <div className={`p-1.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#391c57] border-[#552a82]/30'}`}>
                          <Target className="h-3.5 w-3.5 text-[#ffd60a]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-xs">ATS Match Result</h3>
                          <p className="text-[9px] text-blue-200 font-medium">Offline weighted keyword analysis</p>
                        </div>
                        <button
                          onClick={() => setAtsResult(null)}
                          className="ml-auto ghost-btn text-blue-300 hover:text-white transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Gauge */}
                          <div className="md:col-span-3 flex justify-center">
                            <ScoreGauge score={atsResult.score} />
                          </div>

                          {/* Breakdown bars */}
                          <div className="md:col-span-9 space-y-2">
                            {[
                              { label: 'Skills Match (40%)', val: atsResult.breakdown?.skills, color: 'bg-[#ffd60a]' },
                              { label: 'Experience Match (30%)', val: atsResult.breakdown?.experience, color: 'bg-[#43bccd]' },
                              { label: 'Projects Match (15%)', val: atsResult.breakdown?.projects, color: 'bg-[#552a82]' },
                            ].map(({ label, val, color }, i) => (
                              <div key={label} className="space-y-0.5">
                                <div className="flex justify-between text-[11px] font-semibold text-white">
                                  <span>{label}</span>
                                  <span className={`${isLight ? 'text-slate-600' : 'text-blue-200'}`}>{val ?? 0}%</span>
                                </div>
                                <AnimatedBar value={val ?? 0} color={color} delay={i * 0.1} />
                              </div>
                            ))}
                            {/* Mini chips row */}
                            <div className="flex gap-2 pt-0.5 flex-wrap">
                              {[
                                { l: 'Certs (8%)', v: atsResult.breakdown?.certifications },
                                { l: 'Awards (4%)', v: atsResult.breakdown?.achievements },
                                { l: 'Edu (3%)', v: atsResult.breakdown?.education },
                              ].map(({ l, v }) => (
                                <span key={l} className={`text-[9px] font-semibold border px-1.5 py-0.5 rounded-lg ${isLight ? 'text-black bg-slate-100 border-slate-200' : 'text-[#ffd60a] bg-[#391c57] border-[#552a82]/30'}`}>
                                  {l}: <span className={`${isLight ? 'text-black' : 'text-white'}`}>{v ?? 0}%</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Keyword grids */}
                        <div className="mt-4 pt-3.5 border-t border-[#552a82]/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {atsResult.matchedKeywords?.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 mb-1.5">
                                <CheckCircle2 className="h-3 w-3 text-[#ffd60a]" />
                                <span className="text-[10px] font-bold text-white">
                                  Matched ({atsResult.matchedKeywords.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {atsResult.matchedKeywords.map((kw, i) => (
                                  <Chip key={i} label={kw.toUpperCase()} variant="green" size="sm" />
                                ))}
                              </div>
                            </div>
                          )}
                          {atsResult.missingKeywords?.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 mb-1.5">
                                <AlertCircle className="h-3 w-3 text-blue-300" />
                                <span className="text-[10px] font-bold text-blue-200">
                                  Missing ({atsResult.missingKeywords.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {atsResult.missingKeywords.map((kw, i) => (
                                  <Chip key={i} label={kw.toUpperCase()} variant="red" size="sm" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── CONTACT CARD ── */}
                {resumeData.additionalInfo?.contact && (
                  <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible">
                    <SectionCard icon={Globe} title="Contact & Profile Links" accent="blue" delay={1}>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {resumeData.additionalInfo.contact.email && (
                            <a href={`mailto:${resumeData.additionalInfo.contact.email}`}
                              className={`flex items-center gap-2 p-2 rounded-lg border transition-all group text-xs ${isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-400 hover:bg-slate-100' : 'bg-[#211033] border-[#552a82]/30 hover:border-[#ffd60a]/35 hover:bg-[#391c57]/30'}`}>
                              <Mail className={`h-3.5 w-3.5 shrink-0 ${isLight ? 'text-slate-400 group-hover:text-black' : 'text-blue-300 group-hover:text-[#ffd60a]'}`} />
                              <span className={`font-medium truncate ${isLight ? 'text-slate-600 group-hover:text-black' : 'text-blue-200 group-hover:text-white'}`}>
                                {resumeData.additionalInfo.contact.email}
                              </span>
                            </a>
                          )}
                          {resumeData.additionalInfo.contact.phone && (
                            <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#211033] border-[#552a82]/30'}`}>
                              <Phone className={`h-3.5 w-3.5 shrink-0 ${isLight ? 'text-slate-400' : 'text-blue-300'}`} />
                              <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-blue-200'}`}>{resumeData.additionalInfo.contact.phone}</span>
                            </div>
                          )}
                          {resumeData.additionalInfo.contact.location && (
                            <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#211033] border-[#552a82]/30'}`}>
                              <MapPin className={`h-3.5 w-3.5 shrink-0 ${isLight ? 'text-slate-400' : 'text-blue-300'}`} />
                              <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-blue-200'}`}>{resumeData.additionalInfo.contact.location}</span>
                            </div>
                          )}
                        </div>
                        {resumeData.additionalInfo.contact.links?.length > 0 && (
                           <div className="flex flex-wrap gap-1.5">
                            {resumeData.additionalInfo.contact.links.map((link, i) => (
                              <a key={i}
                                href={link.startsWith('http') ? link : `https://${link}`}
                                target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-1 text-[10px] font-semibold border px-2 py-1 rounded-full transition-all ${isLight ? 'text-black bg-slate-100 border-slate-200 hover:bg-slate-200 hover:border-slate-300' : 'text-[#ffd60a] bg-[#391c57] border-[#552a82]/30 hover:bg-[#552a82]/20 hover:border-[#ffd60a]/60'}`}
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                {link.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

                {/* ── PROFESSIONAL SUMMARY ── */}
                {resumeData.additionalInfo?.summary && (
                  <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible">
                    <SectionCard icon={Sparkles} title="Professional Summary" accent="violet">
                      <div className="relative pl-3">
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-[#ffd60a]" />
                        <p className="text-xs text-blue-200 leading-relaxed italic">
                          &ldquo;{resumeData.additionalInfo.summary}&rdquo;
                        </p>
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

                {/* ── SKILLS ── */}
                <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible">
                  <SectionCard icon={Code2} title="Core Skills Extracted" accent="blue">
                    <div className="flex flex-wrap gap-1.5">
                      {resumeData.skills?.length > 0
                        ? resumeData.skills.map((skill, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.02 }}
                            >
                              <Chip label={skill} variant="tech" />
                            </motion.div>
                          ))
                        : <p className="text-xs text-blue-300 italic">No skills extracted</p>
                      }
                    </div>
                  </SectionCard>
                </motion.div>

                {/* ── PROJECTS ── */}
                <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible">
                  <SectionCard icon={Layers} title="Parsed Projects" accent="cyan">
                    <div className="space-y-3">
                      {resumeData.projects?.length > 0
                        ? resumeData.projects.map((project, i) => (
                            <div key={i} className={`${i > 0 ? 'pt-3 border-t border-[#552a82]/30' : ''} space-y-1.5`}>
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#ffd60a] shrink-0 animate-pulse" />
                                <h4 className="text-xs font-bold text-white">{project.title}</h4>
                              </div>
                              <p className="text-[11px] text-blue-200 leading-relaxed pl-3">{project.description}</p>
                              {project.technologies?.length > 0 && (
                                <div className="flex flex-wrap gap-1 pl-3">
                                  {project.technologies.map((tech, j) => (
                                    <Chip key={j} label={tech} variant="tech" size="sm" />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        : <p className="text-xs text-blue-300 italic">No projects found</p>
                      }
                    </div>
                  </SectionCard>
                </motion.div>

                {/* ── EXPERIENCE + EDUCATION ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible">
                    <SectionCard icon={Briefcase} title="Experience" accent="violet" className="h-full">
                      <div className="space-y-2.5">
                        {resumeData.experience?.length > 0
                          ? resumeData.experience.map((job, i) => (
                              <div key={i} className={`${i > 0 ? 'pt-2.5 border-t border-[#552a82]/30' : ''} space-y-0.5`}>
                                <div className="flex justify-between items-start gap-1.5">
                                  <span className="text-xs font-bold text-white leading-tight">{job.role}</span>
                                  <span className="text-[9px] text-blue-350 font-medium whitespace-nowrap shrink-0">{job.duration}</span>
                                </div>
                                <p className="text-[11px] font-semibold text-[#ffd60a] leading-none">{job.company}</p>
                                <p className="text-[10px] text-blue-200 leading-normal mt-0.5">{job.description}</p>
                              </div>
                            ))
                          : <p className="text-xs text-blue-300 italic">No experience listed</p>
                        }
                      </div>
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={6} initial="hidden" animate="visible">
                    <SectionCard icon={GraduationCap} title="Education" accent="emerald" className="h-full">
                      <div className="space-y-2.5">
                        {resumeData.education?.length > 0
                          ? resumeData.education.map((edu, i) => (
                              <div key={i} className={`${i > 0 ? 'pt-2.5 border-t border-[#552a82]/30' : ''} space-y-0.5`}>
                                <div className="flex justify-between items-start gap-1.5">
                                  <span className="text-xs font-bold text-white leading-tight">{edu.degree}</span>
                                  <span className="text-[9px] text-blue-355 font-medium shrink-0">{edu.year}</span>
                                </div>
                                <p className="text-[11px] text-[#ffd60a] font-semibold leading-none">{edu.school}</p>
                              </div>
                            ))
                          : <p className="text-xs text-blue-300 italic">No education listed</p>
                        }
                      </div>
                    </SectionCard>
                  </motion.div>
                </div>

                {/* ── CERTIFICATIONS + ACHIEVEMENTS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fadeUp} custom={7} initial="hidden" animate="visible">
                    <SectionCard icon={Award} title="Certifications" accent="amber" className="h-full">
                      {resumeData.additionalInfo?.certifications?.length > 0
                        ? <div className="space-y-1.5">
                            {resumeData.additionalInfo.certifications.map((cert, i) => (
                              <div key={i} className={`flex items-center gap-2 p-2 border rounded-xl text-[11px] font-semibold ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#211033] border-[#552a82]/30 text-blue-200'}`}>
                                <Shield className={`h-3 w-3 shrink-0 ${isLight ? 'text-black' : 'text-[#ffd60a]'}`} />
                                {cert}
                              </div>
                            ))}
                          </div>
                        : <p className="text-xs text-blue-300 italic">No certifications listed</p>
                      }
                    </SectionCard>
                  </motion.div>

                  <motion.div variants={fadeUp} custom={8} initial="hidden" animate="visible">
                    <SectionCard icon={Trophy} title="Achievements & Awards" accent="rose" className="h-full">
                      {resumeData.additionalInfo?.achievements?.length > 0
                        ? <div className="space-y-1.5">
                            {resumeData.additionalInfo.achievements.map((ach, i) => (
                              <div key={i} className={`flex items-start gap-2 p-2 border rounded-xl text-[11px] font-medium ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#211033] border-[#552a82]/30 text-blue-200'}`}>
                                <Star className={`h-3 w-3 shrink-0 mt-0.5 ${isLight ? 'text-black' : 'text-[#ffd60a]'}`} />
                                {ach}
                              </div>
                            ))}
                          </div>
                        : <p className="text-xs text-blue-300 italic">No achievements listed</p>
                      }
                    </SectionCard>
                  </motion.div>
                </div>

                {/* ── DYNAMIC FIELDS (Hobbies, Languages, Publications) ── */}
                {(resumeData.additionalInfo?.hobbies ||
                  resumeData.additionalInfo?.languages ||
                  resumeData.additionalInfo?.publications) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resumeData.additionalInfo.hobbies && (
                      <motion.div variants={fadeUp} custom={9} initial="hidden" animate="visible">
                        <SectionCard icon={Heart} title="Hobbies & Interests" accent="rose">
                          <div className="flex flex-wrap gap-1.5">
                            {resumeData.additionalInfo.hobbies.map((h, i) => (
                              <Chip key={i} label={h} variant="default" />
                            ))}
                          </div>
                        </SectionCard>
                      </motion.div>
                    )}
                    {resumeData.additionalInfo.languages && (
                      <motion.div variants={fadeUp} custom={10} initial="hidden" animate="visible">
                        <SectionCard icon={Globe} title="Languages" accent="cyan">
                          <div className="flex flex-wrap gap-1.5">
                            {resumeData.additionalInfo.languages.map((l, i) => (
                              <Chip key={i} label={l} variant="violet" />
                            ))}
                          </div>
                        </SectionCard>
                      </motion.div>
                    )}
                    {resumeData.additionalInfo.publications && (
                      <motion.div variants={fadeUp} custom={11} initial="hidden" animate="visible" className="sm:col-span-2">
                        <SectionCard icon={FileText} title="Publications & Research" accent="emerald">
                          <ul className="space-y-1.5">
                            {resumeData.additionalInfo.publications.map((pub, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[11px] text-blue-200 leading-normal">
                                <ChevronRight className="h-3 w-3 text-[#ffd60a] shrink-0 mt-0.5" />
                                {pub}
                              </li>
                            ))}
                          </ul>
                        </SectionCard>
                      </motion.div>
                    )}
                  </div>
                )}

              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`flex flex-col items-center justify-center rounded-2xl border border-dashed p-16 text-center shadow-md ${isLight ? 'bg-white border-slate-300 text-slate-800' : 'border-[#552a82]/35 bg-[#2b1542]/80 text-white'}`}
              >
                <div className="relative mb-6">
                  <div className={`h-20 w-20 rounded-3xl border flex items-center justify-center mx-auto ${isLight ? 'bg-slate-50 border-slate-200 text-black' : 'bg-[#211033] border-[#552a82]/30 text-white'}`}>
                    <FileText className="h-9 w-9 text-blue-300" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-[#43bccd] border border-[#ffd60a]/35 rounded-full flex items-center justify-center"
                  >
                    <Upload className="h-2.5 w-2.5 text-white" />
                  </motion.div>
                </div>
                <h4 className={`text-base font-bold mb-2 ${isLight ? 'text-black' : 'text-white'}`}>No resume parsed yet</h4>
                <p className={`text-sm max-w-xs leading-relaxed ${isLight ? 'text-slate-650' : 'text-blue-200'}`}>
                  Upload your PDF resume on the left — extracted skills, projects, and experience will appear here instantly.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-blue-300">
                  <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-full ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#391c57] border-[#552a82]/30 text-white'}`}>
                    <Shield className={`h-3 w-3 ${isLight ? 'text-black' : 'text-[#ffd60a]'}`} />
                    <span className={`font-medium ${isLight ? 'text-black' : 'text-white'}`}>Secure processing</span>
                  </div>
                  <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-full ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#391c57] border-[#552a82]/30 text-white'}`}>
                    <Zap className={`h-3 w-3 ${isLight ? 'text-black' : 'text-[#ffd60a]'}`} />
                    <span className={`font-medium ${isLight ? 'text-black' : 'text-white'}`}>Instant results</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    );
  }
