'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Send, 
  Terminal as TermIcon, 
  CheckCircle2, 
  HelpCircle,
  XCircle,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Award,
  BookOpen,
  Sun,
  Moon,
  GripVertical,
  GripHorizontal
} from 'lucide-react';

export default function InterviewRoomPage() {
  const { id: interviewId } = useParams();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const { apiRequest } = useAuth();
  const router = useRouter();
  const isLeavingRef = useRef(false);
  


  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [interview, setInterview] = useState(null);
  const [activeQIdx, setActiveQIdx] = useState(0);
  
  // Track code and submissions for each question
  const [codeState, setCodeState] = useState({}); // { qId: { code, lang } }
  
  // Coding Actions feedback
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('Console output will appear here after compiling/running code.');
  const [terminalStatus, setTerminalStatus] = useState('idle'); // 'idle' | 'success' | 'error'

  // AI Assistant Chat Panel
  const [activeTab, setActiveTab] = useState('problem'); // 'problem' | 'ai-assist'
  const [chatHistory, setChatHistory] = useState({}); // { qId: [ { sender: 'user'|'ai', message } ] }
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Resizable Panels State
  const [leftWidth, setLeftWidth] = useState(550);
  const [terminalHeight, setTerminalHeight] = useState(176);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);

  const startLeftResize = (e) => {
    e.preventDefault();
    setIsResizingLeft(true);
  };

  const startTerminalResize = (e) => {
    e.preventDefault();
    setIsResizingTerminal(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        // Keep left panel between 300px and window width minus 300px
        const newWidth = Math.max(300, Math.min(e.clientX - 64, window.innerWidth - 300));
        setLeftWidth(newWidth);
      }
      if (isResizingTerminal) {
        // Keep terminal height between 80px and window height minus 200px
        const newHeight = Math.max(80, Math.min(window.innerHeight - e.clientY, window.innerHeight - 200));
        setTerminalHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingTerminal(false);
    };

    if (isResizingLeft || isResizingTerminal) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingTerminal]);

  useEffect(() => {
    fetchInterviewDetails();
  }, [interviewId]);



  useEffect(() => {
    // Push initial state to trap first back button click
    window.history.pushState(null, null, window.location.href);

    const handlePopState = () => {
      if (isLeavingRef.current) return;
      // Push state again to lock user to page
      window.history.pushState(null, null, window.location.href);
      alert('You cannot leave the interview room while the session is active. Please complete or end the interview first.');
    };

    const handleBeforeUnload = (e) => {
      if (isLeavingRef.current) return;
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your interview progress will be lost.';
      return 'Are you sure you want to leave? Your interview progress will be lost.';
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeQIdx, activeTab]);

  const fetchInterviewDetails = async () => {
    try {
      const res = await apiRequest(`/${interviewId}`);
      if (!res.ok) {
        throw new Error('Could not fetch interview configuration');
      }
      const data = await res.json();
      setInterview(data);
      
      // Initialize code state and chat history for all questions
      const initialCode = {};
      const initialChats = {};
      
      data.questions.forEach((q) => {
        // Default to javascript starter or fallback
        const defaultLang = 'javascript';
        initialCode[q.id] = {
          code: q.templates?.[defaultLang] || '// Write your solution here',
          lang: defaultLang,
          isSubmitted: false,
          result: null
        };
        initialChats[q.id] = [
          { sender: 'ai', message: `Hi there! I am your Interview Co-pilot. I can give you hints about constraints or logic optimization for "${q.title}". Just type your queries here!` }
        ];
      });
      
      setCodeState(initialCode);
      setChatHistory(initialChats);
    } catch (error) {
      console.error('Error loading interview data:', error);
      alert('Failed to load interview room. Returning to dashboard.');
      isLeavingRef.current = true;
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const activeQuestion = interview?.questions?.[activeQIdx];
  const activeQState = activeQuestion ? codeState[activeQuestion.id] : null;

  const handleEditorChange = (value) => {
    if (!activeQuestion) return;
    setCodeState(prev => ({
      ...prev,
      [activeQuestion.id]: {
        ...prev[activeQuestion.id],
        code: value
      }
    }));
  };

  const handleLangChange = (e) => {
    const nextLang = e.target.value;
    if (!activeQuestion) return;
    
    // Switch to language code template if current editor is empty or unchanged
    const currentCode = codeState[activeQuestion.id].code;
    const currentLang = codeState[activeQuestion.id].lang;
    const currentTemplate = activeQuestion.templates?.[currentLang] || '';
    
    let nextCode = currentCode;
    if (!currentCode || currentCode.trim() === '' || currentCode === currentTemplate) {
      nextCode = activeQuestion.templates?.[nextLang] || '// Write solution';
    }

    setCodeState(prev => ({
      ...prev,
      [activeQuestion.id]: {
        ...prev[activeQuestion.id],
        lang: nextLang,
        code: nextCode
      }
    }));
  };

  const resetTemplate = () => {
    if (!activeQuestion) return;
    if (confirm('Are you sure you want to reset the code template? This will erase your current code.')) {
      const lang = codeState[activeQuestion.id].lang;
      setCodeState(prev => ({
        ...prev,
        [activeQuestion.id]: {
          ...prev[activeQuestion.id],
          code: activeQuestion.templates?.[lang] || ''
        }
      }));
    }
  };

  const runCode = async () => {
    if (!activeQuestion || runLoading || submitLoading) return;
    
    setRunLoading(true);
    let compileWarning = '';
    if (activeQState.lang === 'java') {
      compileWarning = '\n(Please note: Java compiling might take a minimum of 3 seconds and a maximum depending on traffic.)';
    } else if (activeQState.lang === 'cpp') {
      compileWarning = '\n(Please note: C++ compiling might take a minimum of 2 seconds and a maximum depending on traffic.)';
    }
    setTerminalOutput(`Compiling code and executing public assertion checks...${compileWarning}`);
    setTerminalStatus('idle');

    try {
      const res = await apiRequest(`/${interviewId}/run-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: activeQuestion.id,
          code: activeQState.code,
          language: activeQState.lang
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.msg || 'Runtime error during compile.');
      }

      if (data.status === 'Accepted') {
        setTerminalStatus('success');
        setTerminalOutput(`Status: Success (Accepted)\nStdout:\n${data.runtimeOutput || 'Completed with no standard outputs.'}`);
      } else {
        setTerminalStatus('error');
        setTerminalOutput(`Status: ${data.status}\nCompile Log:\n${data.compileOutput || 'No logs'}\nStderr:\n${data.runtimeOutput || ''}`);
      }
    } catch (error) {
      setTerminalStatus('error');
      setTerminalOutput(`Execution failed: ${error.message}`);
    } finally {
      setRunLoading(false);
    }
  };

  const submitCode = async () => {
    if (!activeQuestion || runLoading || submitLoading) return;

    setSubmitLoading(true);
    let compileWarning = '';
    if (activeQState.lang === 'java') {
      compileWarning = '\n(Please note: Java compiling might take a minimum of 3 seconds and a maximum depending on traffic.)';
    } else if (activeQState.lang === 'cpp') {
      compileWarning = '\n(Please note: C++ compiling might take a minimum of 2 seconds and a maximum depending on traffic.)';
    }
    setTerminalOutput(`Running solutions against hidden test suites...${compileWarning}`);
    setTerminalStatus('idle');

    try {
      const res = await apiRequest(`/${interviewId}/submit-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: activeQuestion.id,
          code: activeQState.code,
          language: activeQState.lang
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.msg || 'Failed to submit solution.');
      }

      const isPass = data.result === 'Accepted';
      setTerminalStatus(isPass ? 'success' : 'error');

      if (isPass) {
        setTerminalOutput(`All assertions passed successfully!\nSubmission status: ${data.result}`);
        // Complexity audio alerts removed as per user request
      } else {
        setTerminalOutput(`Check failure: ${data.result}\nConsole Output:\n${data.runtimeOutput || ''}`);
      }

      // Save submission result locally
      setCodeState(prev => ({
        ...prev,
        [activeQuestion.id]: {
          ...prev[activeQuestion.id],
          isSubmitted: true,
          result: data.result
        }
      }));
    } catch (error) {
      setTerminalStatus('error');
      setTerminalOutput(`Submittal failed: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const sendAiQuery = async (e) => {
    e.preventDefault();
    if (!aiMessage.trim() || aiLoading || !activeQuestion) return;

    const userText = aiMessage;
    setAiMessage('');
    setAiLoading(true);

    // Append user message immediately
    const currentQChats = chatHistory[activeQuestion.id] || [];
    setChatHistory(prev => ({
      ...prev,
      [activeQuestion.id]: [...currentQChats, { sender: 'user', message: userText }]
    }));

    try {
      const updatedHistory = [...currentQChats, { sender: 'user', message: userText }]
        .slice(-6); // Limit context size

      const res = await apiRequest(`/${interviewId}/ai-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: activeQuestion.id,
          code: activeQState.code,
          language: activeQState.lang,
          chatHistory: updatedHistory
        })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.msg || 'AI error');

      setChatHistory(prev => ({
        ...prev,
        [activeQuestion.id]: [...prev[activeQuestion.id], { sender: 'ai', message: data.message }]
      }));
    } catch (error) {
      setChatHistory(prev => ({
        ...prev,
        [activeQuestion.id]: [
          ...prev[activeQuestion.id], 
          { sender: 'ai', message: 'I encountered an issue analyzing your code. Check your connection parameters.' }
        ]
      }));
    } finally {
      setAiLoading(false);
    }
  };

  const finishInterview = async () => {
    if (!confirm('Are you sure you want to end your mock session and request evaluation? This will evaluate all code solutions.')) {
      return;
    }

    setFinishing(true);

    try {
      console.log('Sending final evaluation trigger to backend report engine...');
      const res = await apiRequest(`/report/generate/${interviewId}`, {
        method: 'POST'
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.msg || 'Evaluation summary failed.');
      }

      console.log('Report generated. Redirecting to score view...');
      isLeavingRef.current = true;
      router.push(`/dashboard/reports/${interviewId}`);
    } catch (error) {
      alert(`Could not compile mock metrics: ${error.message}`);
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${isLight ? 'bg-white text-black' : 'bg-[#150a21]'}`}>
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-[#43bccd] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="text-blue-200 font-semibold text-sm animate-pulse">Launching coding environment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col relative overflow-hidden ${isLight ? 'bg-white text-slate-800' : 'bg-[#150a21]'}`}>
      {/* Finish Overlay Loading */}
      {finishing && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md ${isLight ? 'bg-slate-900/60' : 'bg-[#150a21]/80'}`}>
          <div
            className={`p-8 rounded-3xl max-w-md w-full text-center space-y-4 border shadow-2xl ${isLight ? 'bg-white border-slate-200 text-black' : 'border-[#552a82]/40 bg-[#2b1542] glass-panel'}`}
          >
            <div className="h-12 w-12 border-4 border-[#ffd60a] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h3 className={`text-base font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>Grading Mock Answers</h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-blue-200/80'}`}>
              The system is assessing your logic structures, code complexity (Big O), communication answers, and compiling strengths. Please wait.
            </p>
          </div>
        </div>
      )}

      {/* Top Header bar */}
      <div 
        className={`h-14 border-b px-6 flex items-center justify-between shrink-0 shadow-md ${isLight ? 'bg-slate-50 border-slate-200' : 'border-[#552a82]/30 bg-[#391c57]'}`}
      >
        <div className="flex items-center gap-4">
          <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>
            Mock Round: <span className={`font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{interview.role}</span>
          </span>
          <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase border ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-black'
              : (interview.difficulty === 'Easy' ? 'bg-[#2b1542] border-[#552a82]/40 text-[#ffd60a]' :
                 interview.difficulty === 'Medium' ? 'bg-[#2b1542] border-[#552a82]/40 text-[#ffd60a]' :
                 'bg-[#ffd60a]/10 border-[#ffd60a]/40 text-[#ffd60a]')
          }`}>
            {interview.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`transition-all p-2 rounded-xl cursor-pointer flex items-center justify-center border ${
              isLight 
                ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-100 border-slate-200' 
                : 'text-blue-200 hover:text-white hover:bg-[#552a82]/40 border-[#552a82]/30'
            }`}
            title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {isLight ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={finishInterview}
            className={`font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border ${isLight ? 'bg-black text-white border-black hover:bg-slate-800' : 'bg-[#43bccd] hover:bg-[#552a82] text-white border-[#552a82]/50'}`}
          >
            <Award className="h-3.5 w-3.5 text-[#ffd60a]" />
            End and Submit Interview
          </motion.button>
        </div>
      </div>

      {/* Main room grid */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Sidebar Question Picker */}
        <div className={`w-14 sm:w-16 border-r flex flex-col items-center py-4 gap-3 shrink-0 overflow-y-auto scrollbar-none ${isLight ? 'bg-slate-50 border-slate-200' : 'border-[#552a82]/30 bg-[#391c57]/50'}`}>
          {interview.questions.map((q, idx) => {
            const state = codeState[q.id];
            const isCompleted = state?.isSubmitted && state?.result === 'Accepted';
            const isFailed = state?.isSubmitted && state?.result !== 'Accepted';
            const isActive = activeQIdx === idx;
            
            return (
              <button
                key={q.id}
                onClick={() => {
                  setActiveQIdx(idx);
                  setTerminalOutput('Switched question. Output cleared.');
                  setTerminalStatus('idle');
                }}
                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer outline-btn ${
                  isActive
                    ? 'active bg-black text-white scale-105 shadow-md border border-black'
                    : (isLight ? 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100' : 'bg-[#2b1542]/80 border border-[#552a82]/30 text-blue-200 hover:text-white hover:bg-[#2b1542] hover:border-[#552a82]/60')
                }`}
              >
                Q{idx + 1}
                {isCompleted && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-[#ffd60a] border border-[#150a21] rounded-full"></span>
                )}
                {isFailed && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-red-500 border border-[#150a21] rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Question & AI assistant split pane */}
        <div style={{ width: `${leftWidth}px` }} className={`flex flex-col border-r min-w-[300px] shrink-0 ${isLight ? 'border-slate-200 bg-white' : 'border-[#552a82]/30 bg-[#2b1542]'}`}>
          {/* Tabs */}
          <div className={`flex border-b shrink-0 text-xs font-bold text-blue-200 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#552a82]/30 bg-[#391c57]/30'}`}>
            <button
              onClick={() => setActiveTab('problem')}
              className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ghost-btn ${
                activeTab === 'problem' 
                  ? (isLight ? 'border-black text-black bg-white' : 'border-[#ffd60a] text-white bg-[#2b1542]') 
                  : (isLight ? 'border-transparent text-slate-500 hover:text-black hover:bg-slate-100' : 'border-transparent hover:text-white hover:bg-[#391c57]/50')
              }`}
            >
              <span className="inline-flex items-center gap-1.5 justify-center">
                <BookOpen className="h-3.5 w-3.5" />
                Problem Statement
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ai-assist')}
              className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ghost-btn ${
                activeTab === 'ai-assist' 
                  ? (isLight ? 'border-black text-black bg-white' : 'border-[#ffd60a] text-white bg-[#2b1542]') 
                  : (isLight ? 'border-transparent text-slate-500 hover:text-black hover:bg-slate-100' : 'border-transparent hover:text-white hover:bg-[#391c57]/50')
              }`}
            >
              <span className="inline-flex items-center gap-1.5 justify-center">
                <Sparkles className="h-3.5 w-3.5 text-[#ffd60a]" />
                Interview Co-pilot
              </span>
            </button>
          </div>

          {/* Panel contents */}
          <div className={`flex-1 overflow-y-auto p-6 min-h-0 ${isLight ? 'bg-white' : 'bg-[#2b1542]'}`}>
            <AnimatePresence mode="wait">
              {activeTab === 'problem' ? (
                <motion.div
                  key="problem"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-6 text-sm text-blue-100"
                >
                  <div>
                    <span className={`text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-wider ${isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-[#391c57] border-[#552a82]/40 text-blue-200'}`}>
                      Category: {activeQuestion.type}
                    </span>
                    <h3 className={`text-base font-extrabold mt-2 ${isLight ? 'text-black' : 'text-white'}`}>{activeQuestion.title}</h3>
                  </div>

                  <div className={`prose max-w-none text-xs leading-relaxed space-y-4 ${isLight ? 'text-slate-650' : 'text-blue-200/90'}`}>
                    {activeQuestion.problemStatement.split('\n\n').map((para, pIdx) => (
                      <p key={pIdx} className="whitespace-pre-line">{para}</p>
                    ))}
                  </div>

                  {activeQuestion.constraints && activeQuestion.constraints.length > 0 && (
                    <div className={`space-y-2 border-t pt-4 ${isLight ? 'border-slate-150' : 'border-[#552a82]/30'}`}>
                      <h4 className={`font-bold text-xs ${isLight ? 'text-slate-800' : 'text-white'}`}>Constraints:</h4>
                      <ul className={`list-disc pl-5 text-xs space-y-1 font-mono ${isLight ? 'text-slate-500' : 'text-blue-300'}`}>
                        {activeQuestion.constraints.map((c, cIdx) => (
                          <li key={cIdx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeQuestion.examples && activeQuestion.examples.length > 0 && (
                    <div className={`space-y-4 border-t pt-4 ${isLight ? 'border-slate-150' : 'border-[#552a82]/30'}`}>
                      <h4 className="font-bold text-xs text-white">Examples:</h4>
                      {activeQuestion.examples.map((ex, exIdx) => (
                        <div key={exIdx} className={`p-4 rounded-xl border font-mono text-[11px] space-y-1 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#211033]/60 border-[#552a82]/30 text-white'}`}>
                          <div className={`font-bold ${isLight ? 'text-black' : 'text-[#ffd60a]'}`}>Example {exIdx + 1}</div>
                          <div><span className={`${isLight ? 'text-slate-500' : 'text-blue-300'}`}>Input:</span> <span className={`${isLight ? 'text-black' : 'text-white'}`}>{ex.input}</span></div>
                          <div><span className="text-blue-300">Output:</span> <span className="text-white">{ex.output}</span></div>
                          {ex.explanation && (
                            <div className={`text-[10px] italic mt-1.5 font-sans ${isLight ? 'text-slate-500/80' : 'text-blue-300/80'}`}>
                              Explanation: {ex.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="ai-assist"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="h-full flex flex-col justify-between text-xs"
                >
                  <div className={`flex-1 space-y-4 overflow-y-auto pr-1 pb-4 min-h-0 ${isLight ? 'bg-white' : 'bg-[#2b1542]'}`}>
                    {(chatHistory[activeQuestion.id] || []).map((msg, mIdx) => (
                      <div 
                        key={mIdx}
                        className={`p-3 rounded-xl max-w-[85%] leading-normal border shadow-sm ${
                          msg.sender === 'user'
                            ? (isLight ? 'bg-black border-black text-white ml-auto' : 'bg-[#43bccd] border-[#ffd60a]/30 ml-auto text-white')
                            : (isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#391c57]/40 border-[#552a82]/30 text-blue-100')
                        }`}
                      >
                        <span className={`block font-bold text-[9px] uppercase tracking-wider mb-1 ${
                          msg.sender === 'user' ? (isLight ? 'text-white/80' : 'text-blue-200') : (isLight ? 'text-slate-500' : 'text-[#ffd60a]')
                        }`}>
                          {msg.sender === 'user' ? 'You' : 'Co-pilot'}
                        </span>
                        <div className="whitespace-pre-line leading-relaxed">{msg.message}</div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className={`border p-3 rounded-xl max-w-[85%] animate-pulse ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#391c57]/40 border-[#552a82]/30'}`}>
                        <span className={`block font-bold text-[9px] uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-[#ffd60a]'}`}>Co-pilot</span>
                        <div className="flex gap-1 items-center py-1">
                          <span className={`h-1.5 w-1.5 rounded-full animate-bounce ${isLight ? 'bg-black' : 'bg-[#ffd60a]'}`} style={{ animationDelay: '0ms' }}></span>
                          <span className="h-1.5 w-1.5 bg-[#ffd60a] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="h-1.5 w-1.5 bg-[#ffd60a] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef}></div>
                  </div>

                  <form onSubmit={sendAiQuery} className={`border-t pt-3.5 flex gap-2 shrink-0 bg-transparent ${isLight ? 'border-slate-200' : 'border-[#552a82]/30'}`}>
                    <input
                      type="text"
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      placeholder="Ask for hints or complexity issues..."
                      disabled={aiLoading}
                      className={`flex-1 border rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all ${isLight ? 'bg-slate-50 border-slate-200 focus:border-black focus:bg-white text-black placeholder-slate-400' : 'bg-[#211033]/60 border-[#552a82]/30 focus:border-[#ffd60a] focus:bg-[#211033] text-white placeholder-blue-300/50'}`}
                    />
                    <button 
                      type="submit"
                      disabled={aiLoading || !aiMessage.trim()}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer border-transparent shrink-0 flex items-center justify-center ${isLight ? 'bg-black hover:bg-slate-800 text-white disabled:opacity-40' : 'bg-[#43bccd] hover:bg-[#552a82] text-white disabled:bg-[#391c57]/55 disabled:text-blue-300/30'}`}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>

      {/* Vertical Resize Handle */}
      <div 
        onMouseDown={startLeftResize}
        className={`w-1 hover:w-1.5 cursor-col-resize transition-all shrink-0 flex items-center justify-center relative group ${
          isLight ? 'bg-slate-100 hover:bg-slate-300' : 'bg-[#391c57]/30 hover:bg-[#552a82]/50'
        }`}
        style={{ userSelect: 'none' }}
      >
        <div className={`h-8 w-[2px] rounded opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'bg-slate-400' : 'bg-[#ffd60a]'}`}></div>
      </div>

      {/* Monaco Editor & Terminal split pane */}
      <div className="flex-1 flex flex-col min-w-[300px]">
          {/* Controls bar */}
          <div className={`h-12 border-b px-4 flex items-center justify-between shrink-0 text-xs ${isLight ? 'bg-slate-50 border-slate-200' : 'border-[#552a82]/30 bg-[#391c57]/30'}`}>
            <div className="flex items-center gap-3">
              <select 
                value={activeQState?.lang || 'javascript'} 
                onChange={handleLangChange}
                className={`py-1 px-2.5 rounded-lg font-bold border focus:outline-none cursor-pointer ${isLight ? 'bg-white border-slate-250 text-slate-800' : 'bg-[#2b1542] border-[#552a82]/40 text-white focus:border-[#ffd60a]'}`}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>

              <button 
                onClick={resetTemplate}
                className={`font-semibold flex items-center gap-1 transition-colors cursor-pointer ghost-btn ${isLight ? 'text-slate-600 hover:text-black' : 'text-blue-300 hover:text-white'}`}
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#ffd60a]" />
                Reset Starter
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={runCode}
                disabled={runLoading || submitLoading}
                className={`disabled:opacity-40 disabled:cursor-not-allowed border font-bold px-4.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm outline-btn ${isLight ? 'bg-white hover:bg-slate-100 text-black border-slate-250' : 'bg-[#2b1542] hover:bg-[#391c57]/55 text-white border-[#552a82]/40'}`}
              >
                {runLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#ffd60a]" /> : <Play className="h-3.5 w-3.5 text-[#ffd60a]" />}
                Run Code
              </button>
              <button 
                onClick={submitCode}
                disabled={runLoading || submitLoading}
                className={`disabled:opacity-40 disabled:cursor-not-allowed font-bold px-5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border ${isLight ? 'bg-black hover:bg-slate-800 text-white border-black' : 'bg-[#43bccd] hover:bg-[#552a82] text-white border-[#552a82]/50'}`}
              >
                {submitLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#ffd60a]" /> : <CheckCircle2 className="h-3.5 w-3.5 text-[#ffd60a]" />}
                Submit
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className={`flex-1 min-h-0 relative ${isLight ? 'bg-white' : 'bg-[#150a21]'}`}>
            {activeQState && (
              <Editor
                height="100%"
                language={activeQState.lang === 'cpp' ? 'cpp' : activeQState.lang === 'java' ? 'java' : activeQState.lang === 'python' ? 'python' : 'javascript'}
                theme={isLight ? "light" : "vs-dark"}
                value={activeQState.code}
                onChange={handleEditorChange}
                options={{
                  fontSize: 12,
                  fontFamily: 'Consolas, monospace',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12 }
                }}
              />
            )}
          </div>

          {/* Horizontal Resize Handle */}
          <div 
            onMouseDown={startTerminalResize}
            className={`h-1 hover:h-1.5 cursor-row-resize transition-all shrink-0 flex items-center justify-center relative group ${
              isLight ? 'bg-slate-100 hover:bg-slate-300' : 'bg-[#391c57]/30 hover:bg-[#552a82]/50'
            }`}
            style={{ userSelect: 'none' }}
          >
            <div className={`w-8 h-[2px] rounded opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'bg-slate-400' : 'bg-[#ffd60a]'}`}></div>
          </div>

          {/* Terminal Console */}
          <div style={{ height: `${terminalHeight}px` }} className={`border-t flex flex-col shrink-0 ${isLight ? 'border-slate-200 bg-white' : 'border-[#552a82]/30 bg-[#150a21] text-blue-200'}`}>
            <div className={`h-8 px-4 border-b flex items-center gap-2 shrink-0 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#391c57]/30 border-slate-200 border-b border-[#552a82]/30'}`}>
              <TermIcon className="h-4 w-4 text-[#ffd60a]" />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-300'}`}>Output Terminal</span>
              {terminalStatus === 'success' && (
                <span className={`text-[10px] font-bold ml-auto flex items-center gap-1 ${isLight ? 'text-black' : 'text-[#ffd60a]'}`}>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#ffd60a]" /> Checked Passed
                </span>
              )}
              {terminalStatus === 'error' && (
                <span className="text-[10px] text-red-400 font-bold ml-auto flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5 text-red-500" /> Assert Error
                </span>
              )}
            </div>
            
            <div className={`flex-1 p-4 overflow-y-auto font-mono text-[10px] leading-relaxed whitespace-pre-wrap select-text border-none focus:outline-none ${isLight ? 'bg-white text-slate-700' : 'bg-[#150a21] text-blue-100'}`}>
              {terminalOutput}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
