'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Cpu, Key } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const { login, signup, verifyOtp, resendOtp, loading: authLoading } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [verifyRequired, setVerifyRequired] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rememberMe: false
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('signup') === 'true') {
      setIsSignup(true);
    } else {
      setIsSignup(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errorMsg) setErrorMsg('');
  };

  const handleOtpChange = (index, value) => {
    const val = value.replace(/[^0-9]/g, '');
    if (!val) {
      setOtpDigits(prev => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    const digit = val.slice(-1);
    setOtpDigits(prev => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        setOtpDigits(prev => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
        otpRefs[index - 1].current?.focus();
      } else {
        setOtpDigits(prev => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (isSignup && !formData.name) {
      setErrorMsg('Please specify your name.');
      return;
    }

    setLocalLoading(true);
    setErrorMsg('');

    let result;
    if (isSignup) {
      result = await signup(formData.name, formData.email, formData.password);
    } else {
      result = await login(formData.email, formData.password);
    }

    if (result && result.verifyRequired) {
      setOtpEmail(result.email);
      setVerifyRequired(true);
      setLocalLoading(false);
      setErrorMsg('');
      setResendCooldown(60);
      return;
    }

    if (!result.success) {
      setErrorMsg(result.error || 'Authentication failed. Please verify credentials.');
      setLocalLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.');
      return;
    }

    setLocalLoading(true);
    setErrorMsg('');

    const result = await verifyOtp(otpEmail, fullOtp);
    if (!result.success) {
      setErrorMsg(result.error || 'Verification failed. Please check the code.');
      setLocalLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    const result = await resendOtp(otpEmail);
    if (result.success) {
      setResendCooldown(60);
    } else {
      setErrorMsg(result.error || 'Failed to resend verification code.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#150a21]">
      {/* Left Pane - Illustration and Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#150a21] relative overflow-hidden items-center justify-center text-white px-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#43bccd]/10 via-[#2b1542] to-[#150a21] opacity-90"></div>

        <div className="relative z-10 max-w-lg space-y-8">
          <div className="flex items-center">
            <img src="/logo-dark.png" alt="InterviewForge Logo" className="h-12 w-auto object-contain" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold leading-tight text-[#ffd60a]">
              Accelerate your engineering preparation today.
            </h2>
            <p className="text-blue-200/70 leading-relaxed text-sm">
              Create an account to upload technical PDF resumes, compile coding solutions against complete standard arrays/graphs test cases, and analyze technical OS, DBMS, and Network knowledge via mock evaluations.
            </p>
          </div>

          <div className="border-t border-[#552a82]/30 pt-8 space-y-4 text-xs text-blue-200/60">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Secure Sandboxed Sessions</h4>
                <p>Compile and run code locally and verify against hidden test inputs.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Cpu className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Automated Assistant Feedback</h4>
                <p>Interactive code reviews, prompt complexity recommendations, and direct 30-day study calendars.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Form Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#150a21]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#2b1542] border border-[#552a82]/30 p-8 rounded-2xl shadow-2xl"
        >
          {verifyRequired ? (
            // OTP Entry Panel
            <>
              <div className="text-center mb-8">
                <div className="mx-auto h-12 w-12 bg-[#43bccd]/10 rounded-full flex items-center justify-center text-[#43bccd] mb-4">
                  <Key className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">Verify Your Email</h3>
                <p className="text-blue-200/80 text-xs mt-2 leading-relaxed">
                  We've sent a 6-digit verification code to <br />
                  <strong className="text-white">{otpEmail}</strong>
                </p>
              </div>

              {errorMsg && (
                <div className="bg-red-950/40 text-red-300 border border-red-800/40 p-3 rounded-lg text-xs font-semibold mb-6">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-6">
                <div className="flex justify-between gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 bg-[#211033] border-2 border-[#552a82]/35 focus:border-[#ffd60a] text-center text-lg font-bold text-white rounded-lg focus:outline-none transition-all"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={localLoading || authLoading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#43bccd] hover:bg-[#f86624] disabled:bg-[#552a82]/30 disabled:cursor-not-allowed text-[#2b1542] font-semibold py-3 rounded-lg text-sm transition-all shadow-md hover:shadow-lg mt-2 cursor-pointer"
                >
                  {localLoading || authLoading ? (
                    <div className="h-4 w-4 border-2 border-[#2b1542] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Verify & Complete Signup
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-[#552a82]/30 text-sm">
                <span className="text-blue-300/60">Didn't receive the code?</span>{' '}
                {resendCooldown > 0 ? (
                  <span className="text-slate-400 font-medium text-xs">
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-[#ffd60a] font-bold hover:underline bg-transparent border-none cursor-pointer hover:text-white transition-colors"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="text-center mt-4 text-xs">
                <button
                  onClick={() => {
                    setVerifyRequired(false);
                    setErrorMsg('');
                  }}
                  className="text-blue-300/80 hover:text-white underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </>
          ) : (
            // Standard Sign In / Sign Up Panel
            <>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-extrabold text-white">
                  {isSignup ? 'Create account' : 'Welcome back'}
                </h3>
                <p className="text-blue-200/80 text-sm mt-2">
                  {isSignup
                    ? 'Join thousands of developers acing technical coding trials.'
                    : 'Sign in to access your interview dashboard and studies.'}
                </p>
              </div>

              {errorMsg && (
                <div className="bg-red-950/40 text-red-300 border border-red-800/40 p-3 rounded-lg text-xs font-semibold mb-6">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <div>
                    <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-300">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your name"
                        className="w-full bg-[#211033] border border-[#552a82]/35 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#ffd60a] focus:bg-[#211033] transition-all text-white placeholder-blue-300/30"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-300">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="name@domain.com"
                      className="w-full bg-[#211033] border border-[#552a82]/35 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#ffd60a] focus:bg-[#211033] transition-all text-white placeholder-blue-300/30"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider">
                      Password
                    </label>
                    {!isSignup && (
                      <span className="text-xs text-blue-300/80 cursor-not-allowed hover:text-white">
                        Forgot password?
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-300">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full bg-[#211033] border border-[#552a82]/35 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#ffd60a] focus:bg-[#211033] transition-all text-white placeholder-blue-300/30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="rounded border-[#552a82]/50 text-[#43bccd] focus:ring-[#43bccd] h-4 w-4 bg-[#211033]"
                    />
                    <span className="text-xs text-blue-200/80">Remember this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={localLoading || authLoading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#43bccd] hover:bg-[#f86624] disabled:bg-[#552a82]/30 disabled:cursor-not-allowed text-[#2b1542] font-semibold py-3 rounded-lg text-sm transition-all shadow-md hover:shadow-lg mt-4 cursor-pointer"
                >
                  {localLoading || authLoading ? (
                    <div className="h-4 w-4 border-2 border-[#2b1542] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {isSignup ? 'Register' : 'Login'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-[#552a82]/30 text-sm">
                <span className="text-blue-300/60">
                  {isSignup ? 'Already possess an account?' : 'New to InterviewForge?'}
                </span>{' '}
                <button
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setErrorMsg('');
                  }}
                  className="text-[#ffd60a] font-bold hover:underline bg-transparent border-none cursor-pointer hover:text-white transition-colors"
                >
                  {isSignup ? 'Login' : 'Create Free Account'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#150a21]">
        <div className="h-8 w-8 border-4 border-[#43bccd] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
