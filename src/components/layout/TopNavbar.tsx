// EstateFlow Control - Top Navigation Bar (Clean & Professional, Normal Casing)
import React from 'react';
import { 
  FiSearch, 
  FiSun, 
  FiMoon, 
  FiMonitor, 
  FiHelpCircle, 
  FiLogOut 
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
    <header className="glass-navbar h-14 px-5 flex items-center justify-between z-30 shrink-0 select-none app-drag-region">
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-5 app-no-drag">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
            EF
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
              Estate<span className="text-rose-600 dark:text-rose-500">Flow</span>
            </span>
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-neutral-200/80 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border border-neutral-300/40 dark:border-white/10">
              Control
            </span>
          </div>
        </div>

        {/* Live System Indicator */}
        <div 
          onClick={() => setActivePage('health')}
          className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20 transition-colors cursor-pointer text-xs"
        >
          <span className={`inline-flex rounded-full h-2 w-2 ${activeJobCount > 0 ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></span>
          <span className="text-neutral-700 dark:text-neutral-300 font-medium">
            {activeJobCount > 0 ? `${activeJobCount} active jobs` : 'System Idle'}
          </span>
          <span className="text-neutral-300 dark:text-neutral-600">|</span>
          <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
            {readyWorkerCount} workers ready
          </span>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-md mx-6 app-no-drag">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search properties, projects, transit..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 rounded-lg glass-input text-xs placeholder:text-neutral-400 text-neutral-800 dark:text-neutral-200"
          />
          {globalSearchQuery && (
            <button 
              onClick={() => setGlobalSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-200"
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
          className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
        >
          <FiHelpCircle className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
          <button
            onClick={() => setTheme('light')}
            title="Light Theme"
            className={`p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-white text-rose-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'}`}
          >
            <FiSun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            title="Dark Theme"
            className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'}`}
          >
            <FiMoon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            title="System Theme"
            className={`p-1.5 rounded-md transition-colors ${theme === 'system' ? 'bg-white dark:bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'}`}
          >
            <FiMonitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User / Logout */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-neutral-200 dark:border-white/10">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Admin
            </div>
            <div className="text-[11px] text-neutral-500">
              Administrator
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <FiLogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
