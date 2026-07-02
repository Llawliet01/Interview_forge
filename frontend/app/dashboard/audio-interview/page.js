'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Layers, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  Volume2, 
  HelpCircle,
  ChevronRight,
  Smile,
  Send,
  Loader2,
  Database,
  Smartphone,
  Cloud,
  Terminal
} from 'lucide-react';

const topics = [
  {
    id: 'system-design',
    title: 'System Design',
    desc: 'Scalability, microservices, databases, load balancing, and high-availability architecture.',
    icon: Layers,
  },
  {
    id: 'dsa',
    title: 'DSA Concepts',
    desc: 'Arrays, graphs, trees, search optimization, dynamic programming, and complexity logic.',
    icon: BookOpen,
  },
  {
    id: 'web-fundamentals',
    title: 'Web Fundamentals',
    desc: 'Browser rendering, event loops, security (CORS, CSRF), React performance, and networking.',
    icon: Sparkles,
  },
  {
    id: 'behavioral',
    title: 'Behavioral Prep',
    desc: 'HR round preparation, leadership principles, conflict resolution, and the STAR method.',
    icon: Smile,
  },
  {
    id: 'frontend',
    title: 'Frontend Developer',
    desc: 'JavaScript logic, React patterns, HTML/DOM structures, and client-side performance optimization.',
    icon: Terminal,
  },
  {
    id: 'backend',
    title: 'Backend Developer',
    desc: 'Databases, REST/GraphQL API design, SQL queries, caching systems, and server scalability.',
    icon: Database,
  },
  {
    id: 'mobile',
    title: 'Mobile Developer',
    desc: 'Native mobile environments (iOS/Android), cross-platform React Native, and mobile architectures.',
    icon: Smartphone,
  },
  {
    id: 'devops',
    title: 'DevOps & Infrastructure',
    desc: 'CI/CD pipelines, container orchestration (Docker/K8s), infrastructure-as-code, and cloud scaling.',
    icon: Cloud,
  }
];

export default function AudioInterviewPage() {
  const { theme } = useTheme();
  const { apiRequest } = useAuth();
  const isLight = theme === 'light';
  
  const [callState, setCallState] = useState('setup');
  const [selectedTopics, setSelectedTopics] = useState(['system-design']);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [aiState, setAiState] = useState('idle');
  const [liveCaption, setLiveCaption] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [evalReport, setEvalReport] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [speechMetrics, setSpeechMetrics] = useState(null);

  const getCombinedTopic = () => {
    if (selectedTopics.length === 0) return 'General Software Engineering';
    if (selectedTopics.length === topics.length) return 'All Topics (Full Tech Gauntlet)';
    return selectedTopics.map(id => topics.find(t => t.id === id)?.title).filter(Boolean).join(', ');
  };

  // ─── ALL REFS ─────────────────────────────────────────────────────────────
  const mediaRecorderRef   = useRef(null);
  const audioChunksRef     = useRef([]);
  const audioStreamRef     = useRef(null);
  const activeUtteranceRef = useRef(null);
  const chatEndRef         = useRef(null);
  const chatHistoryRef     = useRef([]);       // mirror of chatHistory for use inside callbacks

  // These refs shadow their state counterparts so callbacks always read fresh values
  const isMutedRef         = useRef(false);
  const callStateRef       = useRef('setup');

  // KEY FIX: flag distinguishing a "Done Speaking" stop from a "Mute" stop
  // Only when true should onstop trigger transcription
  const isSubmitStopRef    = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);

  // Auto-scroll chat transcript to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isRecording, liveCaption]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { hardStop(); };
  }, []);

  // ─── CORE HELPERS ─────────────────────────────────────────────────────────

  /** Fully tears down the recorder and TTS without triggering transcription */
  const hardStop = () => {
    isSubmitStopRef.current = false;                    // ← NOT a submit stop
    if (mediaRecorderRef.current?.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    }
    setIsRecording(false);
    audioStreamRef.current?.getTracks().forEach(t => t.stop());
    audioStreamRef.current = null;
    window.speechSynthesis?.cancel();
  };

  /** Starts the MediaRecorder to capture a new answer */
  const startRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === 'recording') return; // already going
    audioChunksRef.current = [];
    isSubmitStopRef.current = false;                    // default: not a submit stop
    try {
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAiState('listening');
    } catch (e) {
      console.warn('startRecording failed:', e.message);
    }
  };

  /** Stops recording AND flags it as a manual submit so onstop uploads */
  const doneSpeaking = () => {
    if (mediaRecorderRef.current?.state !== 'recording') return;
    isSubmitStopRef.current = true;                     // ← THIS is a submit stop
    try {
      mediaRecorderRef.current.stop();
    } catch (e) {
      console.warn('doneSpeaking stop failed:', e.message);
    }
    setIsRecording(false);
    setAiState('thinking');
  };

  // ─── SPEECH SYNTHESIS ─────────────────────────────────────────────────────

  const speakText = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtteranceRef.current = utterance;
    window.activeUtterance  = utterance; // prevent GC mid-speech

    const voices = window.speechSynthesis.getVoices();
    const voice  = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google'))
                || voices.find(v => v.lang.includes('en-US'))
                || voices[0];
    if (voice) utterance.voice = voice;
    let storedRate = 1.05;
    try {
      const saved = localStorage.getItem('voiceSpeed');
      if (saved) storedRate = parseFloat(saved);
    } catch (_) {}
    utterance.rate = storedRate;

    utterance.onstart = () => {
      // Stop any ongoing recording while AI speaks (no submit)
      if (mediaRecorderRef.current?.state === 'recording') {
        isSubmitStopRef.current = false;
        try { mediaRecorderRef.current.stop(); } catch (_) {}
      }
      setIsRecording(false);
      setAiState('speaking');
    };

    utterance.onend = () => {
      // After AI finishes speaking, auto-start recording if not muted
      // Read isMuted from REF (never stale)
      if (!isMutedRef.current && callStateRef.current === 'calling') {
        startRecording();
      } else {
        setAiState('idle');
      }
    };

    utterance.onerror = () => {
      if (!isMutedRef.current && callStateRef.current === 'calling') {
        startRecording();
      } else {
        setAiState('idle');
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // ─── TRANSCRIPTION ────────────────────────────────────────────────────────

  const uploadAndTranscribe = async (blob) => {
    setAiState('thinking');
    setLiveCaption('Transcribing your response...');
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'recording.webm');
      const res  = await apiRequest('/audio-interview/transcribe', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      setLiveCaption('');

      // Extract speech metrics if available in response
      if (data.pacing || data.acoustic_analysis) {
        setSpeechMetrics({
          pacing: data.pacing,
          acoustic: data.acoustic_analysis
        });
      }

      const rawText = data.text?.trim() || '';
      // Strip punctuation and casing to detect common Whisper silence/noise hallucinations
      const cleanText = rawText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();

      const isHallucination = 
        cleanText === 'thank you' || 
        cleanText === 'thank you.' ||
        cleanText === 'thank you for watching' || 
        cleanText === 'thank you for watching this video' ||
        cleanText === 'you' || 
        cleanText === 'yo' ||
        cleanText === 'subtitles by' ||
        cleanText.includes('subtitles by amara') ||
        // Capture the weird recipe/chicken/rice cake hallucinations
        cleanText.includes('chicken and rice') ||
        cleanText.includes('rice cake') ||
        cleanText.includes('cup of water') ||
        cleanText.includes('delicious and easy') ||
        // Capture loops (e.g. repeating a short phrase or word over and over)
        /(\b\w+\b)( \1){3,}/.test(cleanText); // matches any word repeated 4+ times in a row

      if (rawText && !isHallucination) {
        await sendVoiceMessage(rawText);
      } else {
        // If silence or hallucination, submit "I don't know" to move the conversation forward
        await sendVoiceMessage("I don't know");
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setLiveCaption('Transcription failed. Please try again.');
      setAiState('listening');
      startRecording();
    }
  };

  // ─── CHAT ─────────────────────────────────────────────────────────────────

  const sendVoiceMessage = async (text) => {
    setAiState('thinking');
    // Read chatHistory from ref to avoid stale closure
    const current = chatHistoryRef.current;
    const updated = [...current, { role: 'user', text }];
    setChatHistory(updated);
    chatHistoryRef.current = updated;

    try {
      const res  = await apiRequest('/audio-interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: current, text, topic: getCombinedTopic() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      setChatHistory(data.history || []);
      chatHistoryRef.current = data.history || [];
      speakText(data.message);
    } catch (err) {
      console.error('Chat error:', err);
      const fallback = "I hit a network hiccup. Could you repeat that?";
      setChatHistory(prev => [...prev, { role: 'model', text: fallback }]);
      speakText(fallback);
    }
  };

  // ─── CALL LIFECYCLE ───────────────────────────────────────────────────────

  const startCall = async () => {
    setCallState('calling');
    callStateRef.current = 'calling';
    setChatHistory([]);
    chatHistoryRef.current = [];
    setEvalReport(null);
    setSpeechMetrics(null);
    setAiState('thinking');
    setLiveCaption('');
    setIsMuted(false);
    isMutedRef.current = false;

    // Request mic access on user gesture
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      alert('Microphone access denied. Please allow mic access and try again.');
      setCallState('setup');
      callStateRef.current = 'setup';
      return;
    }
    audioStreamRef.current = stream;

    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    recorder.ondataavailable = (e) => {
      if (e.data?.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      // Only transcribe if this stop was triggered by doneSpeaking()
      if (!isSubmitStopRef.current) {
        audioChunksRef.current = [];
        return;
      }
      isSubmitStopRef.current = false;
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];
      if (blob.size > 100) {
        await uploadAndTranscribe(blob);
      }
    };

    mediaRecorderRef.current = recorder;

    // Kick off the opening question
    try {
      const topicTitle = getCombinedTopic();
      const res  = await apiRequest('/audio-interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: [],
          text: `Start the voice interview for the topic: ${topicTitle}. Greet me and ask your first question.`,
          topic: topicTitle
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      setChatHistory(data.history || []);
      chatHistoryRef.current = data.history || [];
      speakText(data.message);
    } catch (err) {
      console.error(err);
      setCallState('setup');
      callStateRef.current = 'setup';
      alert('Could not start the voice call. Make sure the backend is running and try again.');
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    isMutedRef.current = next;

    if (next) {
      // Muting: stop recording WITHOUT submitting
      if (mediaRecorderRef.current?.state === 'recording') {
        isSubmitStopRef.current = false;               // ← NOT a submit, discard audio
        try { mediaRecorderRef.current.stop(); } catch (_) {}
      }
      setIsRecording(false);
      setAiState('idle');
    } else {
      // Unmuting: start fresh recording
      startRecording();
    }
  };

  const endCall = async () => {
    hardStop();
    setEvalLoading(true);
    setCallState('report');
    callStateRef.current = 'report';
    const history = chatHistoryRef.current;
    try {
      const res  = await apiRequest('/audio-interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, topic: getCombinedTopic() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      setEvalReport(data);
    } catch (err) {
      console.error(err);
      setEvalReport({
        score: 0,
        summary: 'Could not generate evaluation. Please try again.',
        strengths: [],
        improvements: ['Check your internet connection and restart the session.']
      });
    } finally {
      setEvalLoading(false);
    }
  };

  // ─── SHARED STYLES ────────────────────────────────────────────────────────
  const card = isLight
    ? 'bg-white border-slate-200 text-slate-800'
    : 'bg-[#2b1542]/80 border-[#552a82]/30 text-white';

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className={`flex-1 p-4 ${
      callState === 'calling' 
        ? 'h-full max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col space-y-4' 
        : 'overflow-y-auto space-y-6'
    }`}>

      {/* HEADER */}
      <div className={`flex items-center justify-between pb-4 border-b shrink-0 ${isLight ? 'border-slate-200' : 'border-[#552a82]/30'}`}>
        <div>
          <h1 className={`text-xl font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Mic className="h-5 w-5 text-[#ffd60a]" />
            Audio Interview Prep
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-blue-300/80'}`}>
            Practice mock interviews entirely via voice and receive an automated scorecard evaluation.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── SETUP ── */}
        {callState === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-4xl">
              <div>
                <h2 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-blue-200'}`}>Select Interview Categories</h2>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-blue-300/60'}`}>
                  Select one or more topics. The system will customize questions across all selected domains.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedTopics.length === topics.length) {
                    setSelectedTopics([]);
                  } else {
                    setSelectedTopics(topics.map(t => t.id));
                  }
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none shrink-0 ${
                  selectedTopics.length === topics.length
                    ? (isLight ? 'bg-slate-200 border-slate-350 text-slate-800' : 'bg-[#43bccd]/30 border-[#43bccd]/50 text-[#ffd60a]')
                    : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-400' : 'bg-[#2b1542]/80 border-[#552a82]/30 text-blue-200 hover:border-[#552a82]/60')
                }`}
              >
                {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
              {topics.map((topic, i) => {
                const Icon = topic.icon;
                const sel  = selectedTopics.includes(topic.id);
                return (
                  <motion.div
                    key={topic.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: i * 0.08 }}
                    onClick={() => {
                      setSelectedTopics(prev => {
                        if (prev.includes(topic.id)) {
                          return prev.filter(t => t !== topic.id);
                        } else {
                          return [...prev, topic.id];
                        }
                      });
                    }}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex gap-4 items-start ${
                      isLight
                        ? (sel ? 'bg-slate-50 border-black shadow-md' : 'bg-white border-slate-200 hover:border-slate-400')
                        : (sel ? 'bg-[#391c57]/50 border-[#ffd60a] shadow-lg' : 'bg-[#2b1542]/80 border-[#552a82]/30 hover:border-[#552a82]/60')
                    }`}
                  >
                    <div className={`p-3 rounded-xl border ${
                      isLight
                        ? (sel ? 'bg-slate-100 border-slate-350 text-black' : 'bg-slate-50 border-slate-200 text-slate-600')
                        : (sel ? 'bg-white/10 border-white/20 text-[#ffd60a]' : 'bg-[#211033] border-[#552a82]/30 text-blue-300')
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className={`font-bold text-sm ${isLight ? (sel ? 'text-black' : 'text-slate-900') : 'text-white'}`}>
                        {topic.title}
                      </h3>
                      <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-500' : (sel ? 'text-blue-100/90' : 'text-blue-300/70')}`}>
                        {topic.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <button
              onClick={startCall}
              disabled={selectedTopics.length === 0}
              className={`font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all border-transparent ${
                selectedTopics.length === 0 
                  ? 'opacity-40 cursor-not-allowed bg-slate-400 text-slate-200'
                  : isLight ? 'bg-black text-white hover:bg-slate-800 cursor-pointer' : 'bg-[#43bccd] text-[#150a21] hover:bg-[#349eac] cursor-pointer'
              }`}
            >
              <Play className="h-4 w-4 fill-current text-[#ffd60a]" />
              Start Voice Call
            </button>
          </motion.div>
        )}

        {/* STATE B: ACTIVE CALL — fixed full-screen overlay, escapes all parent layouts */}
        {callState === 'calling' && (
          <motion.div
            key="calling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99,
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '1.25rem',
              padding: '1.25rem',
              backgroundColor: isLight ? '#f1f5f9' : '#150a21',
            }}
          >
            {/* Visual Call Center Panel (Left) */}
            <div
              style={{
                borderRadius: '1rem',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.3)',
                backgroundColor: isLight ? '#ffffff' : 'rgba(43,21,66,0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                padding: '1.5rem',
              }}
            >
              {/* Status pill */}
              <div style={{
                position: 'absolute', top: '1.25rem', left: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 0.75rem', borderRadius: '9999px',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.3)',
                backgroundColor: isLight ? '#f8fafc' : '#211033',
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: isLight ? '#64748b' : '#ffd60a',
              }}>
                <span style={{
                  height: '8px', width: '8px', borderRadius: '9999px',
                  backgroundColor: isRecording ? '#ef4444' : aiState === 'speaking' ? '#3b82f6' : aiState === 'thinking' ? '#ffd60a' : '#94a3b8',
                  animation: isRecording ? 'ping 1s cubic-bezier(0,0,0.2,1) infinite' : aiState === 'speaking' ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
                }} />
                {isRecording && 'Recording — speak your answer'}
                {!isRecording && aiState === 'listening' && 'Ready to record...'}
                {aiState === 'speaking' && !isRecording && 'Interviewer speaking...'}
                {aiState === 'thinking' && !isRecording && 'Processing...'}
                {aiState === 'idle' && !isRecording && 'Microphone muted'}
              </div>

              {/* Pulsing orb */}
              <div style={{ 
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '3.5rem 0 2.5rem 0',
                height: '13rem',
                width: '100%'
              }}>
                <div style={{
                  position: 'absolute', height: '10rem', width: '10rem', borderRadius: '9999px',
                  border: `1px solid ${isRecording ? 'rgba(239,68,68,0.2)' : aiState === 'speaking' ? 'rgba(255,214,10,0.2)' : 'rgba(100,116,139,0.1)'}`,
                  backgroundColor: isRecording ? 'rgba(239,68,68,0.05)' : aiState === 'speaking' ? 'rgba(255,214,10,0.05)' : 'transparent',
                  transform: (isRecording || aiState === 'speaking') ? 'scale(1.25)' : 'scale(1)',
                  transition: 'all 0.7s',
                }} />
                <div style={{
                  position: 'absolute', height: '7rem', width: '7rem', borderRadius: '9999px',
                  border: `1px solid ${isRecording ? 'rgba(239,68,68,0.4)' : aiState === 'speaking' ? 'rgba(255,214,10,0.4)' : 'rgba(100,116,139,0.2)'}`,
                  transform: (isRecording || aiState === 'speaking') ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.7s',
                }} />
                <div style={{
                  height: '5rem', width: '5rem', borderRadius: '9999px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid',
                  backgroundColor: isRecording ? '#dc2626' : aiState === 'speaking' ? '#ffd60a' : aiState === 'thinking' ? '#7c3aed' : '#374151',
                  borderColor: isRecording ? '#ef4444' : aiState === 'speaking' ? '#ffd60a' : aiState === 'thinking' ? '#8b5cf6' : '#4b5563',
                  transition: 'all 0.5s',
                }}>
                  {aiState === 'speaking' && !isRecording
                    ? <Volume2 style={{ height: '2rem', width: '2rem', color: '#000' }} />
                    : isMuted
                      ? <MicOff style={{ height: '2rem', width: '2rem', color: '#f87171' }} />
                      : <Mic style={{ height: '2rem', width: '2rem', color: '#fff' }} />
                  }
                </div>
              </div>

              {/* Caption box */}
              <div style={{
                width: '100%', maxWidth: '28rem', textAlign: 'center',
                padding: '1rem 1.5rem', borderRadius: '0.75rem', minHeight: '60px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.2)',
                backgroundColor: isLight ? '#f8fafc' : 'rgba(33,16,51,0.6)',
                color: isLight ? '#1e293b' : '#fff',
              }}>
                {liveCaption ? (
                  <p style={{ fontSize: '12px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {aiState === 'thinking' && <Loader2 style={{ height: '14px', width: '14px', color: '#ffd60a', animation: 'spin 1s linear infinite' }} />}
                    {liveCaption}
                  </p>
                ) : isRecording ? (
                  <p style={{ fontSize: '12px', color: isLight ? '#374151' : '#bfdbfe' }}>
                    🎙️ Speak your answer — click <strong>Done Speaking</strong> when finished.
                  </p>
                ) : aiState === 'speaking' && chatHistory.length > 0 ? (
                  <p style={{ fontSize: '12px', fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    "{chatHistory[chatHistory.length - 1]?.text}"
                  </p>
                ) : (
                  <p style={{ fontSize: '12px', color: isLight ? '#94a3b8' : 'rgba(147,197,253,0.5)' }}>
                    {aiState === 'idle' ? 'Microphone is muted.' : 'Waiting for response...'}
                  </p>
                )}
              </div>

              {/* Done Speaking button */}
              <div style={{ height: '3rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isRecording && (
                  <button
                    onClick={doneSpeaking}
                    style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.35)' }}
                  >
                    <Send style={{ height: '14px', width: '14px' }} />
                    Done Speaking — Send Answer
                  </button>
                )}
              </div>

              {/* Controls bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.2)', width: '100%', justifyContent: 'center' }}>
                {/* Mute */}
                <button
                  onClick={toggleMute}
                  style={isMuted
                    ? { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', padding: '0.875rem', borderRadius: '9999px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
                    : isLight
                      ? { backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', padding: '0.875rem', borderRadius: '9999px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
                      : { backgroundColor: '#211033', border: '1px solid #552a82', color: '#bfdbfe', padding: '0.875rem', borderRadius: '9999px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isMuted ? <MicOff style={{ height: '20px', width: '20px' }} /> : <Mic style={{ height: '20px', width: '20px' }} />}
                </button>
                {/* Hang up */}
                <button
                  onClick={endCall}
                  style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0.875rem', borderRadius: '9999px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(220,38,38,0.4)' }}
                >
                  <PhoneOff style={{ height: '20px', width: '20px' }} />
                </button>
                {/* Transcript toggle */}
                <button
                  onClick={() => setShowTranscript(v => !v)}
                  style={showTranscript
                    ? isLight
                      ? { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '0.625rem 1rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }
                      : { backgroundColor: '#43bccd', color: '#150a21', border: 'none', padding: '0.625rem 1rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }
                    : isLight
                      ? { backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', padding: '0.625rem 1rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }
                      : { backgroundColor: '#211033', border: '1px solid #552a82', color: '#bfdbfe', padding: '0.625rem 1rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
                >
                  {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                </button>
              </div>
            </div>

            {/* Right: Dual panel containing Live Speech Analysis and Transcript */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden'
            }}>
              
              {/* Top: Speech Performance Card */}
              <div style={{
                borderRadius: '1rem',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.3)',
                backgroundColor: isLight ? '#ffffff' : 'rgba(43,21,66,0.85)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.2)' }}>
                  <span style={{ fontSize: '14px' }}>📊</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: isLight ? '#64748b' : '#bfdbfe' }}>Speech Performance Analysis</span>
                </div>

                {speechMetrics ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    
                    {/* Ensemble Confidence Ring/State */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', backgroundColor: isLight ? '#f8fafc' : 'rgba(33,16,51,0.5)', padding: '0.75rem', borderRadius: '0.75rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.1)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: isLight ? '#94a3b8' : '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Confidence</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffd60a' }}>
                          {speechMetrics.acoustic?.ensemble_average?.speaking_state || 'Analyzing'}
                        </span>
                      </div>
                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: isLight ? '#0f172a' : '#fff' }}>
                          {speechMetrics.acoustic?.ensemble_average?.confidence_score?.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Dual Model Confidence Breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {/* Model A */}
                      <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', borderRadius: '0.5rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.1)', backgroundColor: isLight ? '#f8fafc' : 'rgba(33,16,51,0.3)' }}>
                        <span style={{ fontSize: '8px', fontWeight: 700, color: isLight ? '#64748b' : '#93c5fd', textTransform: 'uppercase' }}>RF Noisy</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                          {speechMetrics.acoustic?.prediction_rav_noisy?.confidence_score?.toFixed(1)}%
                        </span>
                        <span style={{ fontSize: '8px', color: isLight ? '#94a3b8' : 'rgba(147,197,253,0.6)' }}>
                          {speechMetrics.acoustic?.prediction_rav_noisy?.speaking_state}
                        </span>
                      </div>
                      {/* Model B */}
                      <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', borderRadius: '0.5rem', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.1)', backgroundColor: isLight ? '#f8fafc' : 'rgba(33,16,51,0.3)' }}>
                        <span style={{ fontSize: '8px', fontWeight: 700, color: isLight ? '#64748b' : '#93c5fd', textTransform: 'uppercase' }}>RF Set 4</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                          {speechMetrics.acoustic?.prediction_comb_set4?.confidence_score?.toFixed(1)}%
                        </span>
                        <span style={{ fontSize: '8px', color: isLight ? '#94a3b8' : 'rgba(147,197,253,0.6)' }}>
                          {speechMetrics.acoustic?.prediction_comb_set4?.speaking_state}
                        </span>
                      </div>
                    </div>

                    {/* Secondary Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '10px' }}>
                      {/* Pacing */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>⏱️</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: isLight ? '#475569' : '#fff' }}>
                            {speechMetrics.pacing?.wpm} WPM
                          </span>
                          <span style={{ fontSize: '8px', color: isLight ? '#64748b' : '#93c5fd' }}>
                            {speechMetrics.pacing?.label}
                          </span>
                        </div>
                      </div>
                      {/* Silence Ratio */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>⏸️</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: isLight ? '#475569' : '#fff' }}>
                            {speechMetrics.acoustic?.custom_metrics?.hesitation_index_pct?.toFixed(1)}%
                          </span>
                          <span style={{ fontSize: '8px', color: isLight ? '#64748b' : '#93c5fd' }}>
                            Hesitation Rate
                          </span>
                        </div>
                      </div>
                      {/* Voice Stability */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', gridColumn: 'span 2', marginTop: '0.25rem', paddingTop: '0.35rem', borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(85,42,130,0.15)' }}>
                        <span>🎙️</span>
                        <span style={{ color: isLight ? '#64748b' : '#93c5fd' }}>Voice Stability:</span>
                        <span style={{ fontWeight: 800, color: speechMetrics.acoustic?.custom_metrics?.pitch_stability === 'Stable' ? '#16a34a' : '#ffd60a' }}>
                          {speechMetrics.acoustic?.custom_metrics?.pitch_stability}
                        </span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <p style={{ fontSize: '11px', color: isLight ? '#64748b' : 'rgba(147,197,253,0.5)', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                    Speak your answer to see live voice performance analysis.
                  </p>
                )}
              </div>

              {/* Bottom: Live transcript panel */}
              <div style={{
                borderRadius: '1rem',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.3)',
                backgroundColor: isLight ? '#ffffff' : 'rgba(43,21,66,0.85)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                opacity: showTranscript ? 1 : 0.3,
                pointerEvents: showTranscript ? 'auto' : 'none',
                padding: '1rem',
                transition: 'opacity 0.2s',
                flex: 1,
                minHeight: 0
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.2)', flexShrink: 0 }}>
                  <FileText style={{ height: '16px', width: '16px', color: '#ffd60a' }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: isLight ? '#64748b' : '#bfdbfe' }}>Live Transcript</span>
                </div>
                {/* Scrollable messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.25rem 0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>
                  {chatHistory.length === 0 ? (
                    <p style={{ textAlign: 'center', paddingTop: '1.5rem', fontSize: '11px', color: isLight ? '#94a3b8' : 'rgba(147,197,253,0.3)' }}>Conversation will appear here.</p>
                  ) : chatHistory.map((msg, idx) => (
                    <div key={idx} style={{
                      padding: '0.625rem', borderRadius: '0.75rem', fontSize: '11px', lineHeight: '1.5',
                      border: msg.role === 'user'
                        ? isLight ? '1px solid #e2e8f0' : '1px solid rgba(85,42,130,0.2)'
                        : isLight ? '1px solid #bfdbfe' : '1px solid rgba(255,214,10,0.2)',
                      backgroundColor: msg.role === 'user'
                        ? isLight ? '#f8fafc' : 'rgba(33,16,51,0.6)'
                        : isLight ? 'rgba(239,246,255,0.5)' : 'rgba(57,28,87,0.45)',
                      color: msg.role === 'user'
                        ? isLight ? '#1e293b' : '#bfdbfe'
                        : isLight ? '#374151' : '#fff',
                      marginLeft: msg.role === 'user' ? '1rem' : 0,
                      marginRight: msg.role === 'user' ? 0 : '1rem',
                    }}>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem', color: msg.role === 'user' ? (isLight ? '#94a3b8' : '#93c5fd') : '#ffd60a' }}>
                        {msg.role === 'user' ? 'You' : 'Interviewer'}
                      </span>
                      {msg.text}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ── REPORT ── */}
        {callState === 'report' && (
          <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-5xl space-y-6">
            {evalLoading ? (
              <div className={`rounded-2xl border p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-md ${card}`}>
                <RefreshCw className="h-8 w-8 text-[#ffd60a] animate-spin" />
                <h3 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>Generating Scorecard…</h3>
                <p className={`text-xs max-w-sm leading-relaxed ${isLight ? 'text-slate-500' : 'text-blue-300/60'}`}>
                  Evaluating your answers and structuring detailed feedback.
                </p>
              </div>
            ) : evalReport ? (
              <div className="space-y-6">
                <div className={`rounded-2xl border p-6 shadow-md grid grid-cols-1 md:grid-cols-4 gap-6 items-center ${card}`}>
                  <div className={`flex flex-col items-center justify-center py-2 ${isLight ? 'md:border-r border-slate-200' : 'md:border-r border-[#552a82]/20'}`}>
                    <div className={`h-24 w-24 rounded-full border-4 flex flex-col items-center justify-center ${isLight ? 'border-[#ffd60a] bg-slate-50' : 'border-[#ffd60a] bg-[#211033]'}`}>
                      <span className={`text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>{evalReport.score}</span>
                      <span className={`text-[9px] uppercase tracking-wider font-bold ${isLight ? 'text-slate-400' : 'text-blue-300/60'}`}>Score</span>
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <h3 className="text-xs uppercase tracking-wider font-extrabold text-[#ffd60a]">Performance Summary</h3>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>{evalReport.summary}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className={`rounded-2xl border p-5 shadow-md space-y-3 ${card}`}>
                    <h4 className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> Key Strengths
                    </h4>
                    <ul className="space-y-2">
                      {evalReport.strengths?.map((s, i) => (
                        <li key={i} className={`text-xs flex gap-2 items-start ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
                          <ChevronRight className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`rounded-2xl border p-5 shadow-md space-y-3 ${card}`}>
                    <h4 className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      <HelpCircle className="h-4 w-4 text-[#ffd60a]" /> Constructive Gaps
                    </h4>
                    <ul className="space-y-2">
                      {evalReport.improvements?.map((s, i) => (
                        <li key={i} className={`text-xs flex gap-2 items-start ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
                          <ChevronRight className="h-3.5 w-3.5 text-[#ffd60a] shrink-0 mt-0.5" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`rounded-2xl border p-5 shadow-md space-y-3 ${card}`}>
                    <h4 className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      <Sparkles className="h-4 w-4 text-blue-450" /> Easily Fixable Gaps
                    </h4>
                    <ul className="space-y-2">
                      {evalReport.minor_weaknesses?.map((s, i) => (
                        <li key={i} className={`text-xs flex gap-2 items-start ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
                          <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />{s}
                        </li>
                      ))}
                      {(!evalReport.minor_weaknesses || evalReport.minor_weaknesses.length === 0) && (
                        <li className={`text-xs italic ${isLight ? 'text-slate-400' : 'text-blue-300/40'}`}>
                          No minor weaknesses identified.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => { setCallState('setup'); callStateRef.current = 'setup'; }}
                  className={`font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer border-transparent ${
                    isLight ? 'bg-black text-white hover:bg-slate-800' : 'bg-[#43bccd] text-[#150a21] hover:bg-[#349eac]'
                  }`}
                >
                  Start New Mock Session
                </button>
              </div>
            ) : (
              <p className="text-center py-10 text-slate-400">Failed to load evaluation.</p>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
