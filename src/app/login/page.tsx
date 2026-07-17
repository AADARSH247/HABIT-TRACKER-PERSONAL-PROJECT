'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { isFirebaseAvailable } from '../../lib/firebase';
import { Sparkles, Mail, Lock, User, KeyRound, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup, resetPassword, user, error: authError } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If user is already authenticated, send them to dashboard
    if (user) {
      router.push('/dashboard');
    }

    // Auto-trigger guest demo if requested
    if (searchParams.get('demo') === 'true') {
      setIsLoading(true);
      login('guest@momentum.app', 'guestpass')
        .then(() => router.push('/dashboard'))
        .catch(() => setIsLoading(false));
    }
  }, [user, router, searchParams, login]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        router.push('/dashboard');
      } else if (mode === 'register') {
        if (!name.trim()) {
          throw new Error('Please enter your name.');
        }
        await signup(email, password, name);
        router.push('/dashboard');
      } else {
        await resetPassword(email);
        setMessage('Password reset email sent! Please check your inbox.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setMessage(null);
    if (mode === 'login') setMode('register');
    else if (mode === 'register') setMode('login');
    else setMode('login');
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/60 dark:bg-slate-950/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* LOGO */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent to-accent-hover shadow-lg shadow-accent/20 mb-3 text-white">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Enter your details to access your dashboard'}
            {mode === 'register' && 'Start tracking your habits in seconds'}
            {mode === 'forgot' && 'Enter your email to receive a reset link'}
          </p>
        </div>

        {/* MOCK MODE WARNING BANNER */}
        {!isFirebaseAvailable && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex gap-2.5 items-start">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Offline / Local Storage Mode</p>
              <p className="text-[11px] text-amber-400/80 mt-0.5">
                Firebase keys are not configured. You can use any dummy credentials to log in, and all data will be saved locally.
              </p>
            </div>
          </div>
        )}

        {/* FEEDBACK MESSAGES */}
        <AnimatePresence mode="wait">
          {(error || authError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold"
            >
              {error || authError}
            </motion.div>
          )}
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] font-bold text-accent hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover hover:scale-[1.01] active:scale-95 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent/25 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>Sign In</>
            ) : mode === 'register' ? (
              <>Create Account</>
            ) : (
              <>Send Reset Link</>
            )}
          </button>
        </form>

        {/* TOGGLE LINKS */}
        <div className="mt-6 text-center text-xs">
          {mode === 'forgot' ? (
            <button
              onClick={() => setMode('login')}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white font-bold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
            </button>
          ) : (
            <p className="text-slate-400">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-extrabold text-accent hover:underline cursor-pointer"
              >
                {mode === 'login' ? 'Register Now' : 'Sign In'}
              </button>
            </p>
          )}
        </div>

        {/* QUICK GUEST SIGN-IN */}
        {mode === 'login' && (
          <div className="mt-5 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                await login('guest@momentum.app', 'guestpass');
                router.push('/dashboard');
              }}
              className="text-xs font-extrabold text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto hover:bg-slate-800/40 px-4 py-2 rounded-xl border border-slate-800/50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Quick Guest Sign In
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-450">Loading auth portal...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </React.Suspense>
  );
}
