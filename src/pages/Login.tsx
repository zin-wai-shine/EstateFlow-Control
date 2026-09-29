// EstateFlow Control - Login Page (Normal Casing, Clean & Professional)
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
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-neutral-900 text-neutral-100 select-none">
      <div className="w-full max-w-sm rounded-2xl p-7 bg-neutral-950 border border-neutral-800 shadow-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Estate<span className="text-rose-500">Flow</span> Control
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-estate automation control center
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Account / Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@estateflow.pro"
                className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs text-white placeholder:text-neutral-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-9 py-2 rounded-lg glass-input text-xs text-white placeholder:text-neutral-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-800 text-rose-600 focus:ring-rose-500/40"
              />
              <span>Remember session</span>
            </label>
            <span className="text-neutral-500 text-[11px]">
              Local Access
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg btn-primary-red text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Sign In to Control Center</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
            <FiCheck className="text-emerald-500 w-3 h-3" />
            <span>macOS Sandboxed Architecture • SQLite Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
