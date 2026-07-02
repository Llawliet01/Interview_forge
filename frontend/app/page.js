'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Terminal,
  Award,
  TrendingUp,
  Activity,
  Map,
  ArrowRight,
  CheckCircle,
  Play
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const features = [
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: "Resume Analysis",
      desc: "Upload your resume in PDF format to instantly parse and extract skills, projects, and domains."
    },
    {
      icon: <Terminal className="h-6 w-6 text-primary" />,
      title: "Coding Interviews",
      desc: "Solve coding questions on a Monaco Editor with compilers running Java, C++, Python, and JS."
    },
    {
      icon: <Award className="h-6 w-6 text-primary" />,
      title: "System Evaluation",
      desc: "Receive real-time technical grading, communication analysis, and detailed feedback."
    },
    {
      icon: <Activity className="h-6 w-6 text-primary" />,
      title: "Progress Tracking",
      desc: "Monitor your historical scores and trace accuracy rates over time to measure career growth."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: "Performance Reports",
      desc: "Analyze individual strengths, weak subjects, and actionable suggestions to improve."
    },
    {
      icon: <Map className="h-6 w-6 text-primary" />,
      title: "Study Roadmaps",
      desc: "Follow a tailored 30-day preparation roadmap with curated items focused on your weak areas."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#150a21] text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#552a82]/20 bg-[#2b1542]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo-dark.png" alt="InterviewForge Logo" className="h-10 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-blue-200/80">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <span className="text-[#552a82]/50">|</span>
            <a href="https://github.com/Llawliet01/interview_forge" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Open Source</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-primary hover:bg-[#f86624] text-[#2b1542] px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-md"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-blue-200/70 hover:text-white transition-colors">
                  Login
                </Link>
                <Link
                  href="/login?signup=true"
                  className="bg-primary hover:bg-[#f86624] text-[#2b1542] px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-md shadow-sm shadow-[#43bccd]/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-[#552a82]/20 bg-[#150a21]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left side text and buttons */}
            <div className="lg:col-span-6 text-center lg:text-left flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#211033] border border-[#552a82]/30 text-primary mb-6">
                  <span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
                  Next Generation Mock Interviews
                </span>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-6">
                  Crack Technical <span className="text-primary">Interviews</span>
                </h1>
                <p className="text-lg text-blue-200/70 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                  Personalized coding interviews, resume-based questions, real-time code compilation, structured feedback and 30-day progress roadmaps.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    href={user ? "/dashboard" : "/login"}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#f86624] text-[#2b1542] px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg group shadow-sm shadow-[#43bccd]/20"
                  >
                    Start Practice Interview
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button
                    onClick={() => alert("Demo video is coming soon! Feel free to upload a resume and try the mock coding room.")}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2b1542] hover:bg-[#391c57] text-white border border-[#552a82]/40 px-6 py-3 rounded-lg font-semibold transition-all"
                  >
                    <Play className="h-4 w-4 fill-blue-300 text-blue-300" />
                    Watch Demo
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Right side Dashboard Mockup */}
            <div className="lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative mx-auto max-w-lg lg:max-w-none rounded-xl border border-[#552a82]/30 bg-[#2b1542] p-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-[#552a82]/25 pb-3 mb-4">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#552a82]/40"></span>
                    <span className="w-3 h-3 rounded-full bg-[#43bccd]/40"></span>
                    <span className="w-3 h-3 rounded-full bg-[#ffd60a]/40"></span>
                  </div>
                  <span className="text-xs text-blue-200/50 font-medium">interviewforge-dashboard.app</span>
                  <span className="w-4"></span>
                </div>

                <div className="space-y-4">
                  {/* Mock dashboard content */}
                  <div className="flex items-center justify-between bg-[#211033] p-3 rounded-lg border border-[#552a82]/20">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded bg-[#2b1542] border border-[#552a82]/30 flex items-center justify-center text-primary font-bold text-xs">Y</div>
                      <div>
                        <div className="text-xs font-semibold text-white">Welcome back, Yug 👋</div>
                        <div className="text-[10px] text-blue-200/70">Your average score is 83%</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#ffd60a]/10 text-primary px-2.5 py-0.5 rounded-full border border-[#ffd60a]/20 font-medium">Ready</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-[#552a82]/20 p-3 rounded-lg bg-[#211033]/50">
                      <div className="text-[10px] text-blue-200/60 uppercase font-bold tracking-wider">Interviews Taken</div>
                      <div className="text-xl font-bold text-white">12</div>
                    </div>
                    <div className="border border-[#552a82]/20 p-3 rounded-lg bg-[#211033]/50">
                      <div className="text-[10px] text-blue-200/60 uppercase font-bold tracking-wider">Coding Accuracy</div>
                      <div className="text-xl font-bold text-white">92%</div>
                    </div>
                  </div>

                  <div className="border border-[#552a82]/20 rounded-lg p-3 space-y-2 bg-[#211033]/20">
                    <div className="text-xs font-bold text-white">Coding Interview Progress</div>
                    <div className="h-2 w-full bg-[#150a21] rounded-full overflow-hidden border border-[#552a82]/15">
                      <div className="h-full bg-primary rounded-full w-[83%]"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-blue-200/60">
                      <span>83 / 100 Overall Score</span>
                      <span>Next Level SDE</span>
                    </div>
                  </div>

                  <div className="bg-[#150a21] text-blue-200/80 p-3 rounded-lg font-mono text-[10px] leading-normal shadow-inner space-y-1 border border-[#552a82]/10">
                    <div><span className="text-primary">~/interview-room$</span> npm run compile</div>
                    <div><span className="text-[#f86624]">[info]</span> Code execution complete. Running 3 assertions...</div>
                    <div><span className="text-primary">✔</span> Test Case 1: Passed (2ms)</div>
                    <div><span className="text-primary">✔</span> Test Case 2: Passed (1ms)</div>
                    <div><span className="text-[#ffd60a]">✔</span> Test Case 3: Passed (12ms) - Accepted!</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#2b1542] border-b border-[#552a82]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Professional Prep Platform
            </h2>
            <p className="mt-4 text-lg text-blue-200/70">
              Unlike other platforms, InterviewForge provides fully personalized mock sessions matching your tech stack, projects, and work experience.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="p-6 rounded-xl border border-[#552a82]/20 bg-[#211033]/30 hover:bg-[#211033] hover:shadow-2xl hover:border-[#552a82]/40 transition-all duration-300 flex flex-col gap-4 cursor-default group"
              >
                <div className="p-3 rounded-lg bg-[#2b1542] border border-[#552a82]/30 w-fit group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <p className="text-blue-200/75 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-[#150a21] border-b border-[#552a82]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-blue-200/70">
              Go from profile submission to deep analytics review in five simple steps.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-0.5 bg-[#552a82]/20 -translate-y-1/2 z-0"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
              {[
                { step: "01", title: "Upload Resume", desc: "Drag & drop PDF to analyze tech background." },
                { step: "02", title: "Setup Profile", desc: "Configure role, count, and difficulty." },
                { step: "03", title: "Solve Problems", desc: "Write solutions in Monaco coding room." },
                { step: "04", title: "System Feedback", desc: "Get detailed grades." },
                { step: "05", title: "Improve Skills", desc: "Follow customized 30-day study roadmaps." }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#2b1542] p-5 rounded-xl border border-[#552a82]/25 text-center shadow-md">
                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-extrabold text-sm mx-auto mb-4 border border-primary/20">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-sm text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-blue-200/60 leading-normal">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#2b1542] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#43bccd]/10 via-[#150a21] to-[#150a21] opacity-80"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready To Ace Your Next Interview?
          </h2>
          <p className="text-blue-200/60 max-w-xl mx-auto text-sm sm:text-base">
            Upload your resume and simulate actual coding rounds with active compilation, tests, and deep scoring.
          </p>
          <div className="pt-4">
            <Link
              href={user ? "/dashboard" : "/login?signup=true"}
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#f86624] text-[#2b1542] px-8 py-3.5 rounded-lg font-semibold transition-all hover:scale-105 shadow-md shadow-[#43bccd]/20"
            >
              Start Practice Now
            </Link>
          </div>
        </div>
      </section>
 
      {/* Footer */}
      <footer className="bg-[#2b1542] border-t border-[#552a82]/25 py-8 text-center text-blue-200/50 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>© {new Date().getFullYear()} InterviewForge. All rights reserved.</div>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
            <span className="cursor-pointer hover:text-white transition-colors">Terms of Use</span>
            <span className="cursor-pointer hover:text-white font-semibold text-primary transition-colors">Student Prep Tools</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
