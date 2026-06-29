'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { HelpCircle, ChevronDown, ChevronUp, Terminal, Mic, ShieldAlert, FileText, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const faqs = [
    {
      question: "Why does the code execution speed (runtime) vary between languages?",
      answer: "Execution runtimes differ depending on the language design. Compiled languages like C++ and Java run extremely close to machine-level speeds, while interpreted languages like Python and JavaScript have dynamic overhead and execution wrappers. Our compiler backend compensates for this by applying language-specific time offsets to keep evaluations fair.",
      icon: Terminal
    },
    {
      question: "How does the hidden test-case verification pipeline work?",
      answer: "When you compile your code, we do not just execute a simple print statement. We run your code sandboxed against multiple edge-case arguments (like empty bounds, duplicates, or negative inputs) using standard test runners. To pass, ensure your logic avoids infinite recursions or syntax compilation traps.",
      icon: ShieldAlert
    },
    {
      question: "What is the Audio Interview Prep simulator?",
      answer: "This is a voice-controlled dialogue prep dashboard. It acts like a live recruiter by choosing questions customized to your target domain and speaking them out loud. It then transcribes your answer and runs strict system grading algorithms to rate your strengths, weaknesses, and speaking pace.",
      icon: Mic
    },
    {
      question: "Why does the audio system transcribe 'I don't know' for silent responses?",
      answer: "When recording silence or quiet room static, speech-to-text engines (like Whisper) tend to hallucinate common YouTube intro greeting loops or standard template text (like 'Thank you'). To keep your interview natural, our system filters these out and automatically submits 'I don't know' so the interviewer continues forward.",
      icon: Cpu
    },
    {
      question: "How does uploading my resume customize my mock sessions?",
      answer: "When you upload a PDF resume, our backend extracts key concepts, languages, and tools using semantic keywords. This creates a candidate framework that tailors the coding questions, database prompts, and system design topics specifically to your professional stack.",
      icon: FileText
    }
  ];

  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title Header */}
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Frequently Asked Questions (FAQ)
        </h1>
        <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-blue-200/80'}`}>
          Everything you need to know about the platform runtimes, compilers, and mock audio interviews to ensure a smooth training experience.
        </p>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-4 pt-2">
        {faqs.map((faq, index) => {
          const Icon = faq.icon;
          const isOpen = expandedIndex === index;

          return (
            <div
              key={index}
              className={`rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden ${
                isLight 
                  ? 'bg-white border-slate-200 hover:border-slate-350' 
                  : 'bg-[#2b1542]/80 border-[#552a82]/35 hover:border-[#552a82]/60'
              }`}
            >
              {/* Question Trigger Header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleExpand(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(index);
                  }
                }}
                className={`w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer select-none outline-none ${
                  isOpen 
                    ? (isLight ? 'bg-slate-50' : 'bg-[#391c57]/30') 
                    : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${
                    isLight 
                      ? 'bg-slate-100 border-slate-200 text-slate-700' 
                      : 'bg-[#211033] border-[#552a82]/40 text-[#ffd60a]'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className={`font-bold text-xs sm:text-sm pt-0.5 leading-relaxed ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    {faq.question}
                  </h3>
                </div>
                <div className={isLight ? 'text-slate-400' : 'text-blue-300/60'}>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {/* Collapsible Answer Body */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className={`p-5 text-xs leading-relaxed border-t ${
                      isLight 
                        ? 'border-slate-100 text-slate-650 bg-white' 
                        : 'border-[#552a82]/20 text-blue-200/90 bg-[#211033]/40'
                    }`}>
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
