// EstateFlow Control - Top Navigation Bar
import React from 'react';
import { 
  FiSearch, 
  FiSun, 
  FiMoon, 
  FiMonitor, 
  FiActivity, 
  FiHelpCircle, 
  FiLogOut, 
  FiSliders,
  FiCpu
} from 'react-icons/fi';
import { useApp } from '../../context/AppContext';

export const TopNavbar: React.FC = () => {
  const { 
    user, 
    logout, 
    theme, 
    setTheme, 
    globalSearchQuery, 
    setGlobalSearchQuery, 
    jobs, 
    workers,
    openOnboarding,
    setActivePage 
  } = useApp();

  const activeJobCount = jobs.filter(j => j.status === 'running' || j.status === 'queued').length;
  const readyWorkerCount = workers.filter(w => w.status === 'ready').length;

  return (
    <header className="glass-navbar h-16 px-5 flex items-center justify-between z-30 shrink-0 select-none app-drag-region">
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-6 app-no-drag">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-600/30 text-white font-black text-sm tracking-wider">
            EF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-neutral-900 dark:text-white">
                ESTATE<span className="text-rose-600">FLOW</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase tracking-widest">
                CONTROL
              </span>
            </div>
          </div>
        </div>

        {/* Live System Indicator */}
        <div 
          onClick={() => setActivePage('health')}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-200/50 dark:bg-white/5 border border-neutral-300/40 dark:border-white/10 hover:border-rose-500/30 transition-all cursor-pointer text-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeJobCount > 0 ? 'bg-blue-400' : 'bg-emerald-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${activeJobCount > 0 ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
          </span>
          <span className="text-neutral-600 dark:text-neutral-300 font-medium">
            {activeJobCount > 0 ? `${activeJobCount} active jobs` : 'System Idle'}
          </span>
          <span className="text-neutral-400 dark:text-neutral-500">|</span>
          <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
            {readyWorkerCount} workers ready
          </span>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-md mx-6 app-no-drag">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search properties, projects, transit..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl glass-input text-xs placeholder:text-neutral-400 focus:ring-1 focus:ring-rose-500"
          />
          {globalSearchQuery && (
            <button 
              onClick={() => setGlobalSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions, Theme, User */}
      <div className="flex items-center gap-2 app-no-drag">
        {/* Onboarding Guide */}
        <button
          onClick={openOnboarding}
          title="First-Run Setup Guide"
          className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors"
        >
          <FiHelpCircle className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-neutral-200/60 dark:bg-white/5 border border-neutral-300/40 dark:border-white/10">
          <button
            onClick={() => setTheme('light')}
            title="Light Theme"
            className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-white text-rose-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'}`}
          >
            <FiSun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            title="Dark Theme"
            className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'}`}
          >
            <FiMoon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            title="System Theme"
            className={`p-1.5 rounded-lg transition-all ${theme === 'system' ? 'bg-white dark:bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'}`}
          >
            <FiMonitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User / Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-neutral-200/60 dark:border-white/10">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              {user?.name || 'Administrator'}
            </div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
              {user?.role || 'OPS DIRECTOR'}
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <FiLogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
