'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if token exists in localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Fetch latest profile in background to keep sync
      fetchProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Protect route check
  useEffect(() => {
    if (!loading) {
      const isProtectedRoute = pathname.startsWith('/dashboard');
      const isAuthRoute = pathname === '/login' || pathname === '/signup';

      if (isProtectedRoute && !user) {
        router.push('/login');
      } else if (isAuthRoute && user) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const fetchProfile = async (authToken) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (res.ok) {
        const profileData = await res.json();
        setUser(profileData);
        localStorage.setItem('user', JSON.stringify(profileData));
      } else {
        // Token might have expired
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 && data.verifyRequired) {
          setLoading(false);
          return { success: false, verifyRequired: true, email: data.email, error: data.msg };
        }
        throw new Error(data.msg || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setLoading(false);
      router.push('/dashboard');
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || 'Registration failed');
      }

      if (data.verifyRequired) {
        setLoading(false);
        return { success: true, verifyRequired: true, email: data.email };
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setLoading(false);
      router.push('/dashboard');
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const verifyOtp = async (email, otp) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || 'OTP Verification failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setLoading(false);
      router.push('/dashboard');
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const resendOtp = async (email) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || 'Failed to resend OTP');
      }

      return { success: true, msg: data.msg };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/');
  };

  const apiRequest = async (endpoint, options = {}) => {
    const activeToken = token || localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const headers = {
      ...options.headers
    };

    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    const res = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, verifyOtp, resendOtp, logout, apiRequest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
