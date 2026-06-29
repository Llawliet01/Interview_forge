'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Mail, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

function GithubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function ContactPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const contacts = [
    {
      title: "GitHub Portfolio",
      desc: "Explore repositories, code solutions, and other open-source mock platform tools.",
      link: "https://github.com/Llawliet01",
      label: "github.com/Llawliet01",
      icon: GithubIcon,
      color: "hover:border-slate-400 text-slate-800 dark:text-white"
    },
    {
      title: "LinkedIn Profile",
      desc: "Connect for professional inquiries, campus recruitment, or engineering opportunities.",
      link: "https://www.linkedin.com/in/yug-patel-595ba4264/",
      label: "linkedin.com/in/yug-patel",
      icon: LinkedinIcon,
      color: "hover:border-blue-400 text-blue-500"
    },
    {
      title: "Report a Bug / Support",
      desc: "Found an error or language compiler offset issue? Drop an email to notify the developer.",
      link: "mailto:patelyug01234@gmail.com?subject=InterviewForge%20Bug%20Report",
      label: "patelyug01234@gmail.com",
      icon: Mail,
      color: "hover:border-[#f86624] text-[#ffd60a]"
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Contact Us & Support
        </h1>
        <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-blue-200/80'}`}>
          Have feedback or want to report a technical issue? Connect directly with the developer or file a bug ticket.
        </p>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {contacts.map((contact, index) => {
          const Icon = contact.icon;

          return (
            <motion.a
              key={index}
              href={contact.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between h-48 select-none group cursor-pointer ${
                isLight 
                  ? 'bg-white border-slate-200 hover:shadow-md' 
                  : 'bg-[#2b1542]/80 border-[#552a82]/30 hover:shadow-lg'
              } ${contact.color}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl border ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-700' 
                      : 'bg-[#211033] border-[#552a82]/30 text-[#ffd60a]'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                </div>

                <h3 className={`font-extrabold text-sm mt-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {contact.title}
                </h3>
                <p className={`text-[11px] leading-relaxed mt-1 ${isLight ? 'text-slate-500' : 'text-blue-200/70'}`}>
                  {contact.desc}
                </p>
              </div>

              <span className="text-[10px] font-bold tracking-wide mt-2 block underline">
                {contact.label}
              </span>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
