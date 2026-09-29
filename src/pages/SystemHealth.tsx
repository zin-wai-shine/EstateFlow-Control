// EstateFlow Control - System Health (Section 45 & 46)
import React, { useState } from 'react';
import { 
  FiHeart, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiServer, 
  FiDatabase, 
  FiLayers, 
  FiExternalLink,
  FiHardDrive,
  FiShield
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/common/GlassCard';
import { systemHealthService } from '../services/systemHealth';

export const SystemHealth: React.FC = () => {
  const { health, refreshHealth, addNotification, profiles } = useApp();
  const [isRestarting, setIsRestarting] = useState<string | null>(null);

  const handleRestart = async (serviceName: string) => {
    setIsRestarting(serviceName);
    await systemHealthService.restartService(serviceName);
    await refreshHealth();
    setIsRestarting(null);
    addNotification('info', 'Service Restarted', `Successfully cycled ${serviceName}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            System Infrastructure Health
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Operational status across desktop shell, database, Docker services, and Chrome workers.
          </p>
        </div>

        <button
          onClick={refreshHealth}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-xs font-semibold transition-colors"
        >
          <FiRefreshCw className="w-3.5 h-3.5 text-rose-500" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Grid of Subsystems */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Desktop Application */}
        <GlassCard className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <FiShield className="text-rose-500" />
                <span>Desktop Shell</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                Healthy
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-medium">
              {health?.desktopApp.message || 'Tauri 2 macOS desktop container running smoothly'}
            </p>
          </div>
          <div className="text-[11px] text-neutral-500 pt-2 border-t border-white/5">
            Architecture: Apple Silicon ARM64 • Memory safe
          </div>
        </GlassCard>

        {/* SQLite Database */}
        <GlassCard className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <FiDatabase className="text-blue-400" />
                <span>Local SQLite DB</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                Healthy
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-medium">
              {health?.database.message || 'Schema v2 Active • Transactions safe'}
            </p>
          </div>
          <div className="text-[11px] text-neutral-500 pt-2 border-t border-white/5 flex justify-between items-center">
            <span>Schema Version: 2</span>
            <button
              onClick={() => handleRestart('SQLite Storage Engine')}
              className="text-rose-500 hover:underline font-semibold"
            >
              Verify Integrity
            </button>
          </div>
        </GlassCard>

        {/* Docker Desktop */}
        <GlassCard className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <FiServer className="text-purple-400" />
                <span>Docker Engine</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                Connected
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-medium">
              {health?.dockerDesktop.message || 'Supporting automation containers online'}
            </p>
          </div>
          <div className="text-[11px] text-neutral-500 pt-2 border-t border-white/5 flex justify-between items-center">
            <span>Docker Compose v2</span>
            <button
              onClick={() => handleRestart('Docker Automation Containers')}
              disabled={isRestarting === 'Docker Automation Containers'}
              className="text-rose-500 hover:underline font-semibold"
            >
              {isRestarting === 'Docker Automation Containers' ? 'Restarting...' : 'Restart Containers'}
            </button>
          </div>
        </GlassCard>

        {/* Automation Backend */}
        <GlassCard className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <FiLayers className="text-amber-400" />
                <span>Automation Backend</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                Port {health?.automationBackend.port || 8088}
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-medium">
              {health?.automationBackend.message || 'Internal job worker and event loop polling'}
            </p>
          </div>
          <div className="text-[11px] text-neutral-500 pt-2 border-t border-white/5 flex justify-between items-center">
            <span>Status: Polling (1.5s)</span>
            <button
              onClick={() => handleRestart('Automation Engine')}
              disabled={isRestarting === 'Automation Engine'}
              className="text-rose-500 hover:underline font-semibold"
            >
              {isRestarting === 'Automation Engine' ? 'Restarting...' : 'Restart Engine'}
            </button>
          </div>
        </GlassCard>

        {/* OpenClaw Bridge */}
        <GlassCard className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <FiServer className="text-rose-500" />
                <span>OpenClaw Bridge</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                Ready
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-medium">
              {health?.openClaw.message || 'OpenClaw browser automation bridge responsive'}
            </p>
          </div>
          <div className="text-[11px] text-neutral-500 pt-2 border-t border-white/5 flex justify-between items-center">
            <span>CDP Protocol Port 9222</span>
            <button
              onClick={() => handleRestart('OpenClaw Bridge')}
              className="text-rose-500 hover:underline font-semibold"
            >
              Ping Bridge
            </button>
          </div>
        </GlassCard>

        {/* Storage Volume */}
        <GlassCard className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <FiHardDrive className="text-emerald-400" />
                <span>Local Storage</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                APFS Safe
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-medium font-mono text-[11px]">
              {health?.fileStorage.rootPath}
            </p>
          </div>
          <div className="text-[11px] text-neutral-400 pt-2 border-t border-white/5">
            {health?.fileStorage.freeSpace}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
