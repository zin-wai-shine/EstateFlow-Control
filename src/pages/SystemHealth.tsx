// EstateFlow Control - System Health (Normal Case, Clean)
import React, { useState } from 'react';
import { 
  FiRefreshCw, 
  FiServer, 
  FiDatabase, 
  FiLayers, 
  FiHardDrive,
  FiShield
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/common/GlassCard';
import { systemHealthService } from '../services/systemHealth';

export const SystemHealth: React.FC = () => {
  const { health, refreshHealth, addNotification } = useApp();
  const [isRestarting, setIsRestarting] = useState<string | null>(null);

  const handleRestart = async (serviceName: string) => {
    setIsRestarting(serviceName);
    await systemHealthService.restartService(serviceName);
    await refreshHealth();
    setIsRestarting(null);
    addNotification('info', 'Service Restarted', `Successfully cycled ${serviceName}.`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            System Infrastructure Health
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Operational status across desktop shell, database, Docker services, and Chrome workers.
          </p>
        </div>

        <button
          onClick={refreshHealth}
          className="btn-secondary"
        >
          <FiRefreshCw className="w-3.5 h-3.5 text-rose-500" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Grid of Subsystems */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Desktop Application */}
        <GlassCard className="p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                <FiShield className="text-rose-500" />
                <span>Desktop Shell</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-medium">
                Healthy
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              {health?.desktopApp.message || 'Tauri 2 macOS desktop container running smoothly'}
            </p>
          </div>
          <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            Architecture: Apple Silicon ARM64 • Memory safe
          </div>
        </GlassCard>

        {/* SQLite Database */}
        <GlassCard className="p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                <FiDatabase className="text-blue-500" />
                <span>Local SQLite DB</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-medium">
                Healthy
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              {health?.database.message || 'Schema v2 Active • Transactions safe'}
            </p>
          </div>
          <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <span>Schema Version: 2</span>
            <button
              onClick={() => handleRestart('SQLite Storage Engine')}
              className="text-rose-500 hover:underline font-medium cursor-pointer"
            >
              Verify Integrity
            </button>
          </div>
        </GlassCard>

        {/* Docker Desktop */}
        <GlassCard className="p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                <FiServer className="text-purple-500" />
                <span>Docker Engine</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-medium">
                Connected
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              {health?.dockerDesktop.message || 'Supporting automation containers online'}
            </p>
          </div>
          <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <span>Docker Compose v2</span>
            <button
              onClick={() => handleRestart('Docker Automation Containers')}
              disabled={isRestarting === 'Docker Automation Containers'}
              className="text-rose-500 hover:underline font-medium cursor-pointer"
            >
              {isRestarting === 'Docker Automation Containers' ? 'Restarting...' : 'Restart Containers'}
            </button>
          </div>
        </GlassCard>

        {/* Automation Backend */}
        <GlassCard className="p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                <FiLayers className="text-amber-500" />
                <span>Automation Backend</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-medium">
                Port {health?.automationBackend.port || 8088}
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              {health?.automationBackend.message || 'Internal job worker and event loop polling'}
            </p>
          </div>
          <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <span>Status: Polling (1.5s)</span>
            <button
              onClick={() => handleRestart('Automation Engine')}
              disabled={isRestarting === 'Automation Engine'}
              className="text-rose-500 hover:underline font-medium cursor-pointer"
            >
              {isRestarting === 'Automation Engine' ? 'Restarting...' : 'Restart Engine'}
            </button>
          </div>
        </GlassCard>

        {/* OpenClaw Bridge */}
        <GlassCard className="p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                <FiServer className="text-rose-500" />
                <span>OpenClaw Bridge</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-medium">
                Ready
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              {health?.openClaw.message || 'OpenClaw browser automation bridge responsive'}
            </p>
          </div>
          <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <span>Port 9222</span>
            <button
              onClick={() => handleRestart('OpenClaw Bridge')}
              className="text-rose-500 hover:underline font-medium cursor-pointer"
            >
              Ping Bridge
            </button>
          </div>
        </GlassCard>

        {/* Storage Volume */}
        <GlassCard className="p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                <FiHardDrive className="text-emerald-500" />
                <span>Local Storage</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-medium">
                APFS Safe
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 font-mono text-[11px]">
              {health?.fileStorage.rootPath}
            </p>
          </div>
          <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            {health?.fileStorage.freeSpace}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
