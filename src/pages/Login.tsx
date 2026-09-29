// EstateFlow Control - Professional Login Page (Section 14 & 15)
import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiLock, FiMail, FiCheck, FiArrowRight } from 'react-icons/fi';
import { useApp } from '../context/AppContext';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('admin@estateflow.local');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both credentials to sign in.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      const ok = await login(email, password);
      if (!ok) {
        setErrorMessage('Invalid authentication credentials.');
      }
    } catch {
      setErrorMessage('Authentication service unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-gradient-to-tr from-[#080a0f] via-[#0d1017] to-[#121622] relative overflow-hidden select-none">
      {/* Subtle background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-rose-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-neutral-700/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl p-8 bg-neutral-900/70 border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center shadow-xl shadow-rose-600/30 text-white font-black text-xl tracking-tight mb-4">
            EF
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            ESTATE<span className="text-rose-500">FLOW</span> CONTROL
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs">
            Real-Estate Desktop Automation Control Center
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Operator Account / Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@estateflow.pro"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder:text-neutral-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm text-white placeholder:text-neutral-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-rose-600 focus:ring-rose-500/40"
              />
              <span>Remember session locally</span>
            </label>
            <span className="text-neutral-500 hover:text-neutral-400 cursor-pointer">
              Admin Access Only
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl btn-primary-red text-sm font-semibold tracking-wide shadow-xl shadow-rose-900/30 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Authenticating Local Shell...</span>
              </span>
            ) : (
              <>
                <span>Sign In to Control Center</span>
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400">
            <FiCheck className="text-emerald-500 w-3.5 h-3.5" />
            <span>macOS Sandboxed Architecture • SQLite Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
