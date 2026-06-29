'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  UploadCloud,
  FolderPlus,
  FileText,
  Map,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  UserCheck,
  ChevronRight,
  Globe,
  Sparkles,
  Zap,
  Sun,
  Moon,
  Mic,
  HelpCircle,
  Mail
} from 'lucide-react';

/* ── tiny SVG social icons not in lucide ─────────────── */
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
function TwitterIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD LAYOUT
   ═══════════════════════════════════════════════════════════ */
export default function DashboardLayout({ children }) {
  return (
    <ThemeProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ThemeProvider>
  );
}

function DashboardLayoutInner({ children }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarCollapsed(false);
    }
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, badge: null },
    { name: 'Resume Analysis', href: '/dashboard/resume', icon: UploadCloud, badge: null },
    { name: 'Audio Interview', href: '/dashboard/audio-interview', icon: Mic, badge: 'New' },
    { name: 'Start Interview', href: '/dashboard/setup', icon: FolderPlus, badge: null },
    { name: 'Reports History', href: '/dashboard/reports', icon: FileText, badge: null },
    { name: 'Study Roadmaps', href: '/dashboard/roadmaps', icon: Map, badge: null },
    { name: 'FAQ Support', href: '/dashboard/faq', icon: HelpCircle, badge: null },
    { name: 'Contact Us', href: '/dashboard/contact', icon: Mail, badge: null },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, badge: null },
  ];

  /* ── loading spinner ── */
  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${theme === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-[#150a21] text-white'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-[#43bccd] border-t-transparent rounded-full animate-spin" />
          <span className={`${theme === 'light' ? 'text-slate-655' : 'text-blue-200'} font-semibold text-sm animate-pulse`}>Syncing session…</span>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  /* ─── SIDEBAR INNER ──────────────────────────────────────── */
  const Sidebar = () => (
    <aside
      className={`
        fixed z-40 flex flex-col
        backdrop-blur-md
        transition-all duration-500 ease-out origin-left
        ${isSidebarCollapsed
          ? 'w-0 h-0 opacity-0 pointer-events-none left-6 top-1/2 -translate-y-1/2 rounded-full overflow-hidden'
          : 'w-64 h-[calc(100vh-1.5rem)] opacity-100 left-6 top-3 translate-y-0 rounded-2xl'
        }
        ${theme === 'light'
          ? 'bg-white text-slate-800 border border-slate-200'
          : 'bg-[#391c57]/95 text-white border border-[#552a82]/30'
        }
      `}
      style={{
        boxShadow: isSidebarCollapsed ? 'none' : (theme === 'light' ? '0 8px 32px rgba(0,0,0,0.06)' : '0 8px 32px rgba(57, 28, 87, 0.25)'),
      }}
    >
      {/* ── ZONE 1 · BRAND ── */}
      <div className={`px-4 py-1.5 border-b shrink-0 ${theme === 'light' ? 'border-slate-200' : 'border-[#552a82]/20'}`}>
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            {theme === 'light' ? (
              <img src="/logo-light.png" alt="InterviewForge Logo" className="h-20 w-auto object-contain" />
            ) : (
              <img src="/logo-dark.png" alt="InterviewForge Logo" className="h-20 w-auto object-contain" />
            )}
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleTheme}
              className={`transition-all p-1.5 rounded-lg cursor-pointer flex items-center justify-center ${theme === 'light' ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-100' : 'text-blue-200 hover:text-white hover:bg-[#552a82]/40'}`}
              title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className={`transition-colors p-1.5 rounded-lg cursor-pointer flex items-center justify-center ${theme === 'light' ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-100' : 'text-blue-200 hover:text-white hover:bg-[#552a82]/40'}`}
              title="Collapse Sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── ZONE 2 · NAVIGATION (scrollable) ── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3.5 space-y-0.5 scrollbar-none">
        <p className="text-[9px] font-bold text-[#43bccd]/85 uppercase tracking-widest px-2.5 mb-2">Navigation</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsSidebarCollapsed(true);
                }
              }}
              className={`
                group relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold
                transition-all duration-200 cursor-pointer select-none
                ${isActive
                  ? 'bg-[#43bccd] text-white shadow-sm border border-[#f86624]/35'
                  : (theme === 'light'
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-blue-100 hover:text-white hover:bg-[#552a82]/35')
                }
              `}
            >
              {/* Active left accent bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#f86624] rounded-full" />
              )}

              {/* Icon container */}
              <span className={`
                flex items-center justify-center h-7 w-7 rounded-md shrink-0 transition-colors
                ${isActive
                  ? 'bg-[#391c57] text-[#f86624]'
                  : (theme === 'light'
                    ? 'bg-slate-50 group-hover:bg-slate-200/50 text-slate-500'
                    : 'bg-[#391c57]/60 group-hover:bg-[#552a82]/50 text-blue-200')
                }
              `}>
                <Icon className="h-4 w-4" />
              </span>

              <span className="flex-1 truncate">{item.name}</span>

              {/* Badge */}
              {item.badge && (
                <span className="text-[9px] font-bold bg-[#f86624]/10 text-[#f86624] border border-[#f86624]/35 px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                  {item.badge}
                </span>
              )}

              {/* Chevron on active */}
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/60 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* ── ZONE 3 · FOOTER (sticky bottom) ── */}
      <div className={`shrink-0 border-t px-3 py-2.5 space-y-2 ${theme === 'light' ? 'border-slate-200' : 'border-[#552a82]/20'}`}>



        {/* User profile strip */}
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${theme === 'light'
            ? 'bg-slate-50 border-slate-200'
            : 'bg-[#391c57]/70 border-[#552a82]/30'
          }`}>
          {/* Avatar */}
          <div className="h-8 w-8 rounded-lg bg-[#43bccd] flex items-center justify-center font-bold text-xs text-white shrink-0 border border-[#552a82]/40 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold truncate leading-tight ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{user.name || 'User'}</p>
            <p className={`text-[10px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-blue-200'}`}>{user.email}</p>
          </div>
          {/* Online dot */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="h-2 w-2 rounded-full bg-[#43bccd] animate-pulse" />
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-transparent transition-all duration-200 group ${theme === 'light'
              ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              : 'text-blue-200 hover:bg-[#43bccd]/30 hover:text-white'
            }`}
        >
          <span className={`flex items-center justify-center h-6.5 w-6.5 rounded-md transition-colors ${theme === 'light'
              ? 'bg-slate-100 group-hover:bg-slate-200 text-slate-500 group-hover:text-slate-700'
              : 'bg-[#391c57] group-hover:bg-[#552a82] text-blue-200'
            }`}>
            <LogOut className="h-3 w-3" />
          </span>
          Sign Out
        </button>
      </div>
    </aside>
  );

  const isRoom = pathname.startsWith('/dashboard/room/');

  /* ─── RENDER ──────────────────────────────────────────────── */
  return (
    <div className={`min-h-screen flex relative transition-colors duration-300 ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#150a21] text-white'}`}>

      {/* Floating Menu Button (Left Side Center) */}
      {!isRoom && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className={`
            fixed left-4 top-1/2 -translate-y-1/2 z-50
            h-12 w-12 rounded-full
            bg-[#43bccd] hover:bg-[#552a82] text-white shadow-md
            flex items-center justify-center border border-[#43bccd]/35
            transition-all duration-300 hover:scale-110 cursor-pointer
            ${isSidebarCollapsed ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'}
          `}
          title="Open Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Mobile overlay */}
      {!isRoom && !isSidebarCollapsed && (
        <div
          className={`fixed inset-0 z-30 backdrop-blur-sm lg:hidden ${theme === 'light' ? 'bg-slate-900/45' : 'bg-[#150a21]/80'}`}
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      {!isRoom && <Sidebar />}

      {/* Main area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-500 ${isRoom || isSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-[19rem]'}`}>



        {/* ── CONTENT ── */}
        <main className={`flex-1 ${isRoom ? 'overflow-hidden h-screen' : 'overflow-y-auto'}`}>
          {isRoom ? (
            <div className="w-full h-full">
              {children}
            </div>
          ) : (
            <div className="p-5 sm:p-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
