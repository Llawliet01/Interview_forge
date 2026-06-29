'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Terminal,
  Database,
  Network,
  Layers,
  BrainCircuit,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  ChevronDown,
  CheckCircle2,
  Cpu,
  Gamepad2,
  Code2,
  Binary,
  Globe,
  Smartphone,
  Palette,
  Cloud,
  Shield,
  Activity,
  BarChart3,
  Server,
  Eye,
  Languages,
  Search,
  X,
} from 'lucide-react';

/* ── Floating orb background ──────────────────────────────── */
function FloatingOrbs() {
  const { theme } = useTheme();
  if (theme === 'light') return null;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '60%',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 214, 10,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'orbFloat1 12s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '20%',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(67,188,205,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'orbFloat2 16s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '10%',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(248,102,36,0.10) 0%, transparent 70%)',
          filter: 'blur(30px)',
          animation: 'orbFloat3 10s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(-30px, 40px) scale(1.05); }
          66% { transform: translate(20px, -20px) scale(0.97); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(40px, -50px) scale(1.08); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0,0); }
          50% { transform: translate(20px, 30px); }
        }
      `}</style>
    </div>
  );
}

/* ── Animated grid lines ─────────────────────────────────── */
function GridLines() {
  const { theme } = useTheme();
  if (theme === 'light') return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(67,188,205,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(67,188,205,0.08) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
  );
}

/* ── Role Card ───────────────────────────────────────────── */
function RoleCard({ role, selected, onClick }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`relative cursor-pointer rounded-2xl p-5 border transition-all duration-300 shadow-sm no-hover-effect
        ${selected
          ? (isLight ? 'border-black bg-slate-50 text-black shadow-md' : 'border-[#ffd60a] bg-[#391c57] shadow-lg shadow-[#391c57]/50 text-white')
          : (isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-[#552a82]/30 bg-[#2b1542]/50 text-blue-200')
        }
      `}
    >
      {/* check badge */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="absolute top-3 right-3"
          >
            <CheckCircle2 className="h-5 w-5 text-[#ffd60a]" strokeWidth={2.5} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`relative flex items-center justify-center h-11 w-11 rounded-xl shrink-0 transition-all duration-300
            ${selected
              ? (isLight ? 'bg-black border border-black shadow-md' : 'bg-[#43bccd] border border-[#ffd60a]/35 shadow-md')
              : (isLight ? 'bg-slate-100 border border-slate-200' : 'bg-[#211033] border border-[#552a82]/30')
            }
          `}
        >
          <div className={`transition-colors duration-300 ${selected ? 'text-white' : 'text-blue-200 group-hover:text-white'}`}>
            {role.icon}
          </div>
          {selected && (
            <div className="absolute inset-0 rounded-xl bg-white/10 animate-pulse" />
          )}
        </div>

        <div className="space-y-1 flex-1">
          <h4 className={`text-sm font-bold transition-colors ${selected ? 'text-white' : 'text-white group-hover:text-white'}`}>
            {role.title}
          </h4>
          <p className="text-[11px] text-blue-200 leading-relaxed group-hover:text-white transition-colors">
            {role.desc}
          </p>
          {/* Tags */}
          <div className="flex flex-wrap gap-1 pt-1">
            {role.tags.map(t => (
              <span key={t} className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md transition-colors
                ${selected 
                  ? (isLight ? 'bg-black text-white border border-black' : 'bg-[#43bccd] text-white border border-[#ffd60a]/30') 
                  : (isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-[#211033] text-blue-300 border border-[#552a82]/20')
                }
              `}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Segment Button ───────────────────────────────────────── */
function SegmentButton({ options, value, onChange, colorMap }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  return (
    <div className="flex gap-2 w-full">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 relative py-3 px-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer overflow-hidden outline-btn ${isActive ? 'active' : ''}
              ${isActive
                ? (isLight ? 'bg-black text-white shadow-md border border-black' : 'bg-[#43bccd] text-white shadow-md border border-[#ffd60a]/35')
                : (isLight ? 'bg-white border border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50' : 'bg-[#2b1542]/50 border border-[#552a82]/30 text-blue-200 hover:text-white hover:border-[#552a82]/60 hover:bg-[#2b1542]/80')
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId={`seg-${opt.value}-indicator`}
                className="absolute inset-0 bg-white/5"
                initial={false}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
            {opt.sub && (
              <span className={`relative z-10 block text-[9px] font-normal mt-0.5 ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                {opt.sub}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── Expanded Roles Data (24 Roles) ───────────────────────── */
const allRoles = [
  // Core Systems Engineering
  {
    id: 'SDE',
    category: 'core',
    title: 'SDE / Generalist',
    desc: 'Core DSA, algorithms, and structural programming. The classic software engineering gauntlet.',
    icon: <Terminal className="h-5 w-5" />,
    tags: ['DSA', 'Algorithms', 'OOP'],
  },
  {
    id: 'Embedded Systems',
    category: 'core',
    title: 'Embedded Systems',
    desc: 'Low-level RTOS programming, hardware interfaces, microcontrollers, and C/C++ firmware.',
    icon: <Cpu className="h-5 w-5" />,
    tags: ['C/C++', 'RTOS', 'Firmware'],
  },
  {
    id: 'Game Programmer',
    category: 'core',
    title: 'Game Programmer',
    desc: 'Engine development, physics simulations, custom graphics APIs, and math-heavy gameplay logic.',
    icon: <Gamepad2 className="h-5 w-5" />,
    tags: ['C++', 'Math', 'Graphics'],
  },
  {
    id: 'C++ Systems Engineer',
    category: 'core',
    title: 'C++ Systems Engineer',
    desc: 'Low-latency systems, memory management, low-level optimization, and multi-threading.',
    icon: <Code2 className="h-5 w-5" />,
    tags: ['C++', 'Systems', 'GDB'],
  },
  {
    id: 'Rust Engineer',
    category: 'core',
    title: 'Rust Systems Engineer',
    desc: 'Memory-safe systems programming, high-performance web tooling, and low-overhead microservices.',
    icon: <Code2 className="h-5 w-5" />,
    tags: ['Rust', 'Cargo', 'Async'],
  },
  {
    id: 'Compiler Engineer',
    category: 'core',
    title: 'Compiler Engineer',
    desc: 'Intermediate representations, AST validation, static analysis, LLVM optimizations, and code gen.',
    icon: <Binary className="h-5 w-5" />,
    tags: ['LLVM', 'AST', 'Compilers'],
  },

  // Web & Mobile Development
  {
    id: 'Frontend',
    category: 'web-mobile',
    title: 'Frontend Developer',
    desc: 'JavaScript logic, React patterns, HTML/DOM structures, and client-side performance.',
    icon: <Layers className="h-5 w-5" />,
    tags: ['React', 'JS', 'CSS', 'DOM'],
  },
  {
    id: 'Full Stack',
    category: 'web-mobile',
    title: 'Full Stack Developer',
    desc: 'A comprehensive blend of server architecture and reactive client-side engineering.',
    icon: <Globe className="h-5 w-5" />,
    tags: ['Full Stack', 'Node', 'React'],
  },
  {
    id: 'iOS Developer',
    category: 'web-mobile',
    title: 'iOS Developer',
    desc: 'Native iOS engineering with Swift, SwiftUI, memory optimization, and App Store protocols.',
    icon: <Smartphone className="h-5 w-5" />,
    tags: ['Swift', 'SwiftUI', 'Cocoa'],
  },
  {
    id: 'Android Developer',
    category: 'web-mobile',
    title: 'Android Developer',
    desc: 'Native Android architecture, Kotlin coroutines, custom layout views, and Jetpack packages.',
    icon: <Smartphone className="h-5 w-5" />,
    tags: ['Kotlin', 'Android', 'Gradle'],
  },
  {
    id: 'React Native Developer',
    category: 'web-mobile',
    title: 'React Native Developer',
    desc: 'Cross-platform mobile apps, native bridge optimization, code push, and state management.',
    icon: <Smartphone className="h-5 w-5" />,
    tags: ['RN', 'TypeScript', 'Cross-Platform'],
  },
  {
    id: 'UI/UX Engineer',
    category: 'web-mobile',
    title: 'UI/UX Engineer',
    desc: 'Figma-to-code implementations, premium transitions, CSS layouts, and WCAG accessibility standards.',
    icon: <Palette className="h-5 w-5" />,
    tags: ['CSS', 'Design System', 'A11y'],
  },

  // Backend & Infrastructure
  {
    id: 'Backend',
    category: 'backend-infra',
    title: 'Backend Developer',
    desc: 'Databases, REST/GraphQL API design, DBMS queries, caching, and system scalability.',
    icon: <Database className="h-5 w-5" />,
    tags: ['APIs', 'SQL', 'Scaling'],
  },
  {
    id: 'DevOps Engineer',
    category: 'backend-infra',
    title: 'DevOps Engineer',
    desc: 'Infrastructure-as-code, automated deployment pipelines, telemetry setups, and configurations.',
    icon: <Network className="h-5 w-5" />,
    tags: ['CI/CD', 'Docker', 'K8s'],
  },
  {
    id: 'Cloud Architect',
    category: 'backend-infra',
    title: 'Cloud Architect',
    desc: 'Designing serverless functions, VPC gateways, cross-region replication, and IAM resource mappings.',
    icon: <Cloud className="h-5 w-5" />,
    tags: ['AWS', 'GCP', 'Terraform'],
  },
  {
    id: 'Database Admin',
    category: 'backend-infra',
    title: 'Database Administrator',
    desc: 'Schema migrations, query planning analytics, connection tuning, backup schemes, and clustering.',
    icon: <Database className="h-5 w-5" />,
    tags: ['SQL', 'NoSQL', 'Indexing'],
  },
  {
    id: 'Security Engineer',
    category: 'backend-infra',
    title: 'Security Engineer',
    desc: 'Threat model maps, network pen testing, key vaults, OAuth compliance, and cryptography checks.',
    icon: <Shield className="h-5 w-5" />,
    tags: ['KMS', 'Pen-Testing', 'Crypt'],
  },
  {
    id: 'SRE',
    category: 'backend-infra',
    title: 'Site Reliability Eng',
    desc: 'SLO tracking, post-mortems, kernel logs diagnostics, server redundancy, and automated failover.',
    icon: <Activity className="h-5 w-5" />,
    tags: ['SLO/SLA', 'Linux', 'Telemetry'],
  },

  // AI, ML & Data Science
  {
    id: 'ML Engineer',
    category: 'ai-data',
    title: 'ML Engineer',
    desc: 'Data pipelines, feature engineering, model optimization, and deployment patterns.',
    icon: <BrainCircuit className="h-5 w-5" />,
    tags: ['ML', 'Python', 'Data'],
  },
  {
    id: 'Data Scientist',
    category: 'ai-data',
    title: 'Data Scientist',
    desc: 'Statistical distributions, predictive regression modeling, notebooks exploration, and visual charts.',
    icon: <BarChart3 className="h-5 w-5" />,
    tags: ['Stats', 'Pandas', 'Numpy'],
  },
  {
    id: 'Data Engineer',
    category: 'ai-data',
    title: 'Data Engineer',
    desc: 'Building ETL pipelines, Spark computations, distributed logging streams, and massive warehouses.',
    icon: <Server className="h-5 w-5" />,
    tags: ['Spark', 'ETL', 'Hadoop'],
  },
  {
    id: 'Computer Vision',
    category: 'ai-data',
    title: 'Computer Vision Eng',
    desc: 'Spatial classification, neural model pipelines, OpenCV matrix scripts, and GPU utilization.',
    icon: <Eye className="h-5 w-5" />,
    tags: ['OpenCV', 'PyTorch', 'CNN'],
  },
  {
    id: 'NLP Engineer',
    category: 'ai-data',
    title: 'NLP Engineer',
    desc: 'Semantic embeddings matching, text parsing classifiers, transformers attention, and LLM tuning.',
    icon: <Languages className="h-5 w-5" />,
    tags: ['LLMs', 'BERT', 'Tokens'],
  },
  {
    id: 'AI Research Scientist',
    category: 'ai-data',
    title: 'AI Research Scientist',
    desc: 'Designing novel neural network architectures, publishing papers, GANs, and reinforcement learning.',
    icon: <BrainCircuit className="h-5 w-5" />,
    tags: ['Research', 'GANs', 'RL'],
  },
];

const categories = [
  { id: 'core', name: 'Core Systems', desc: 'DSA, game engines & compilers', icon: <Binary className="h-4 w-4" /> },
  { id: 'web-mobile', name: 'Web & Mobile', desc: 'React, mobile SDKs & design systems', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'backend-infra', name: 'Cloud & Database', desc: 'DevOps pipelines, DB & SRE tools', icon: <Cloud className="h-4 w-4" /> },
  { id: 'ai-data', name: 'AI & Data Science', desc: 'Model configs, big data & NLP libraries', icon: <BrainCircuit className="h-4 w-4" /> },
];

/* ── Main page ───────────────────────────────────────────── */
export default function InterviewSetupPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { apiRequest } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState('core');
  const [searchQuery, setSearchQuery] = useState('');
  const [config, setConfig] = useState({
    role: 'SDE',
    difficulty: 'Medium',
    questionCount: 10,
  });

  const difficultyOptions = [
    { value: 'Easy', label: 'Easy', sub: 'Fundamentals' },
    { value: 'Medium', label: 'Medium', sub: 'Standard' },
    { value: 'Hard', label: 'Hard', sub: 'Advanced' },
  ];

  const difficultyColors = {
    Easy: { active: 'from-emerald-500 to-teal-600', text: 'text-white', glow: 'shadow-emerald-900/40' },
    Medium: { active: 'from-amber-500 to-orange-600', text: 'text-white', glow: 'shadow-amber-900/40' },
    Hard: { active: 'from-rose-500 to-red-700', text: 'text-white', glow: 'shadow-rose-900/40' },
  };

  const countOptions = [
    { value: 10, label: '10', sub: '~25 min' },
    { value: 15, label: '15', sub: '~35 min' },
    { value: 20, label: '20', sub: '~50 min' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiRequest('/generate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to generate interview.');
      router.push(`/dashboard/room/${data._id}`);
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const selectedRole = allRoles.find(r => r.id === config.role);

  // Filter roles based on active category & search query
  const filteredRoles = allRoles.filter((role) => {
    const matchesSearch =
      role.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (searchQuery.trim() !== '') {
      return matchesSearch;
    }
    return role.category === activeCategory;
  });

  return (
    <>
      <GridLines />

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={isLight ? { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' } : { background: 'rgba(21,10,33,0.95)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className={`relative text-center px-10 py-10 rounded-3xl max-w-sm w-full mx-4 border shadow-2xl ${isLight ? 'bg-white border-slate-200 text-black' : 'border-[#552a82]/35 bg-[#2b1542]'}`}
            >
              {/* Spinner ring */}
              <div className="relative h-16 w-16 mx-auto mb-6">
                <div className={`absolute inset-0 rounded-full border-2 ${isLight ? 'border-slate-100' : 'border-[#391c57]'}`} />
                <div className="absolute inset-0 rounded-full border-2 border-t-[#ffd60a] border-r-[#ffd60a] border-b-transparent border-l-transparent animate-spin" />
                <div className={`absolute inset-2 rounded-full border animate-[spin_2s_linear_reverse_infinite] ${isLight ? 'border-slate-200' : 'border-[#552a82]/40'}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#ffd60a]" />
                </div>
              </div>
              <h3 className="text-base font-extrabold text-white mb-2 tracking-tight">
                Forging Your Interview
              </h3>
              <p className="text-xs text-blue-200 leading-relaxed mb-4">
                Analyzing your <span className="text-[#ffd60a] font-bold">{selectedRole?.title || config.role}</span> profile, 
                selecting {config.questionCount} <span className="text-[#ffd60a] font-bold">{config.difficulty}</span> questions tailored to your background.
              </p>
              <div className="flex items-center gap-2 justify-center">
                {['Parsing resume', 'Selecting questions', 'Personalizing'].map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                    className="text-[9px] font-bold text-blue-300 uppercase tracking-wider"
                  >
                    {step}{i < 2 ? ' →' : ''}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content Viewport */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-2 sm:px-4">

        {/* Header (Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-8 rounded-full bg-[#ffd60a]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
              Interview Setup
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-2">
            Configure Your Mock Round
          </h1>
          <p className="text-blue-200 text-sm max-w-lg">
            Choose your target specialization and round parameters. We'll use your parsed background context to customize the questions.
          </p>
        </motion.div>

        {/* Error Notification */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="mb-5 px-4 py-3 rounded-xl border border-rose-800/40 bg-rose-950/70 text-rose-200 text-xs font-semibold"
            >
              ⚠ {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3-Pane Desktop Layout Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* PANE 1: Category Selector (Col Span 3) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="lg:col-span-3 flex flex-col gap-3"
            >
              <div
                className={`rounded-2xl border p-4 flex flex-col gap-2 h-full justify-start shadow-md ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'border-[#552a82]/30 bg-[#2b1542]/80 text-white'}`}
              >
                <div className="px-2 mb-1">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Categories</p>
                  <p className="text-[8px] text-blue-300 uppercase mt-0.5">Filter specialized fields</p>
                </div>

                {/* Vertical Sidebar Category List */}
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none shrink-0">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat.id && searchQuery.trim() === '';
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveCategory(cat.id);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-300 relative select-none shrink-0 lg:shrink outline-btn
                          ${isActive
                            ? 'active bg-[#43bccd] text-white shadow-md border border-[#ffd60a]/35'
                            : 'text-blue-200 hover:text-white hover:bg-[#552a82]/20 border border-[#552a82]/30 lg:border-transparent'
                          }
                        `}
                      >
                        <span className={`flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-colors
                          ${isLight 
                            ? (isActive 
                                ? 'bg-slate-800 text-white' 
                                : 'bg-slate-100 text-slate-650'
                              ) 
                            : (isActive 
                                ? 'bg-[#391c57] text-[#ffd60a]' 
                                : 'bg-[#211033]/65 text-blue-200'
                              )
                          }
                        `}>
                          {cat.icon}
                        </span>
                        <div className="min-w-0 hidden sm:block lg:block">
                          <p className="text-xs font-bold truncate leading-tight">{cat.name}</p>
                          <p className={`text-[9px] truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-blue-300'}`}>
                            {cat.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* PANE 2: Target Roles Grid & Search (Col Span 6) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-6 flex flex-col gap-4 h-[600px] lg:h-auto"
            >
              <div
                className={`rounded-2xl border p-4 flex flex-col gap-4 h-full overflow-hidden shadow-md ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'border-[#552a82]/30 bg-[#2b1542]/80 text-white'}`}
              >
                {/* Search Header */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                  <div className="px-1">
                    <p className="text-xs font-bold text-white">Target Specialization</p>
                    <p className="text-[9px] text-blue-200">
                      {searchQuery.trim() !== '' ? `Found ${filteredRoles.length} matches` : `Select a specialized profile`}
                    </p>
                  </div>

                  {/* Search Input */}
                  <div className={`relative flex items-center border rounded-xl px-3 py-1.5 transition-all text-xs w-full sm:w-48 shrink-0 ${isLight ? 'bg-white border-slate-200 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10' : 'bg-[#211033] border-[#552a82]/30 focus-within:border-[#ffd60a] focus-within:ring-2 focus-within:ring-[#ffd60a]/20'}`}>
                    <Search className={`h-3.5 w-3.5 mr-2 shrink-0 ${isLight ? 'text-slate-400' : 'text-blue-300'}`} />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`bg-transparent border-none focus:outline-none w-full font-medium ${isLight ? 'text-black placeholder-slate-400' : 'text-white placeholder-blue-300'}`}
                    />
                    {searchQuery.trim() !== '' && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className={`ml-1.5 ghost-btn ${isLight ? 'text-slate-400 hover:text-black' : 'text-blue-300 hover:text-white'}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Roles Cards Grid container */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#552a82]/40">
                  <AnimatePresence mode="popLayout">
                    {filteredRoles.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`text-center py-16 border border-dashed rounded-xl ${isLight ? 'border-slate-300 bg-slate-50' : 'border-[#552a82]/35 bg-[#211033]'}`}
                      >
                        <p className={`text-xs font-semibold mb-1 ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>No roles matched "{searchQuery}"</p>
                        <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-blue-300'}`}>Try cleaning search terms or selecting categories.</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
                      >
                        {filteredRoles.map((role) => (
                          <RoleCard
                            key={role.id}
                            role={role}
                            selected={config.role === role.id}
                            onClick={() => {
                              setConfig((prev) => ({ ...prev, role: role.id }));
                              if (errorMsg) setErrorMsg('');
                            }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* PANE 3: Parametric Config & Begin CTA (Col Span 3) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-3 flex flex-col gap-4"
            >
              {/* Config Options */}
              <div className="flex flex-col gap-4 h-full justify-start">
                {/* Difficulty */}
                <div
                  className={`rounded-2xl border p-4 flex flex-col shrink-0 shadow-md ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'border-[#552a82]/30 bg-[#2b1542]/80 text-white'}`}
                >
                  <div className="flex items-center gap-2 mb-3.5">
                    <div className={`h-6 w-6 rounded-lg border flex items-center justify-center ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#211033] border-[#552a82]/30 text-blue-200'}`}>
                      <Zap className={`h-3 w-3 ${isLight ? 'text-black' : 'text-[#ffd60a]'}`} />
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>Difficulty</p>
                      <p className={`text-[8px] uppercase mt-0.5 ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Complexity Level</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <SegmentButton
                      options={difficultyOptions}
                      value={config.difficulty}
                      onChange={(v) => setConfig((prev) => ({ ...prev, difficulty: v }))}
                      colorMap={difficultyColors}
                    />
                    <p className="text-[9px] text-blue-200 leading-normal">
                      {config.difficulty === 'Easy' && 'Core syntax, introductory data structures, and fundamental CS paradigms.'}
                      {config.difficulty === 'Medium' && 'Intermediate DSA algorithms, system operations, and structural design.'}
                      {config.difficulty === 'Hard' && 'Complex multi-threading, concurrency locks, optimization, and hard assertions.'}
                    </p>
                  </div>
                </div>

                {/* Length */}
                <div
                  className={`rounded-2xl border p-4 flex flex-col shrink-0 shadow-md ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'border-[#552a82]/30 bg-[#2b1542]/80 text-white'}`}
                >
                  <div className="flex items-center gap-2 mb-3.5">
                    <div className={`h-6 w-6 rounded-lg border flex items-center justify-center ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#211033] border-[#552a82]/30 text-blue-200'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${isLight ? 'text-black' : 'text-[#ffd60a]'}`} />
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>Questions</p>
                      <p className={`text-[8px] uppercase mt-0.5 ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Round Duration</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <SegmentButton
                      options={countOptions}
                      value={config.questionCount}
                      onChange={(v) => setConfig((prev) => ({ ...prev, questionCount: v }))}
                    />
                    <p className="text-[9px] text-blue-200 leading-normal">
                      Allocates {Math.round(config.questionCount * 0.4)} algorithmic coding tasks, {Math.round(config.questionCount * 0.3)} systems reviews, and {Math.round(config.questionCount * 0.3)} conceptual checks.
                    </p>
                  </div>
                </div>

                {/* Summary & Submit Card */}
                <div
                  className={`rounded-2xl border p-4 flex flex-col gap-4 shadow-md ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#211033]/90 border-[#552a82]/30'}`}
                >
                  <div className="space-y-2">
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>
                      Setup Snapshot
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Role</span>
                        <span className={`font-bold max-w-[120px] truncate ${isLight ? 'text-black' : 'text-white'}`}>{selectedRole?.title || config.role}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Level</span>
                        <span className={`font-semibold ${isLight ? 'text-black' : 'text-white'}`}>{config.difficulty}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>Items</span>
                        <span className={`font-semibold ${isLight ? 'text-black' : 'text-white'}`}>{config.questionCount} Qs</span>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                    className="relative group w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-white cursor-pointer overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #43bccd, #ffd60a)',
                      boxShadow: '0 4px 20px rgba(255, 214, 10,0.25)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>Begin Interview</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

          </div>
        </form>
      </div>
    </>
  );
}

/* ── Small chip helper ─────────────────────────────────────── */
function Chip({ label, icon, color }) {
  const colorMap = {
    indigo: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    violet: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
    emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    rose: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${colorMap[color] || colorMap.indigo}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}
