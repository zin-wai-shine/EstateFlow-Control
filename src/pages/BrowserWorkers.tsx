// EstateFlow Control - Browser Workers & Chrome Profiles (Section 28, 29, 30, 31)
import React, { useState } from 'react';
import { 
  FiLayers, 
  FiExternalLink, 
  FiRefreshCw, 
  FiPlay, 
  FiPause, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiPlus, 
  FiEye,
  FiActivity,
  FiCpu
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { GlassCard } from '../components/common/GlassCard';
import { ChromeProfile, AutomationWorker } from '../types';
import { openclawClient } from '../services/openclawClient';
import { db } from '../services/storage';

export const BrowserWorkers: React.FC = () => {
  const { profiles, workers, refreshProfiles, refreshWorkers, addNotification } = useApp();
  const [selectedWorker, setSelectedWorker] = useState<AutomationWorker | null>(workers[0] || null);

  const handleOpenBrowser = async (profile: ChromeProfile) => {
    const res = await openclawClient.openNativeChromeProfile(profile);
    addNotification('info', 'Chrome Profile Launched', res.message);
    refreshProfiles();
  };

  const handleTestConnection = async () => {
    const res = await openclawClient.testConnection();
    if (res.success) {
      addNotification('success', 'OpenClaw Connected', res.message);
    } else {
      addNotification('error', 'Connection Warning', res.message);
    }
  };

  const handleRestartWorker = (worker: AutomationWorker) => {
    worker.status = 'ready';
    worker.currentJobId = undefined;
    worker.currentTaskDescription = undefined;
    worker.lastAction = 'Worker restarted by operator';
    worker.nextExpectedAction = 'Awaiting new queue dispatch';
    db.saveWorker(worker);
    refreshWorkers();
    addNotification('info', 'Worker Restarted', `${worker.name} reset to ready state.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Chrome Profiles & Browser Workers
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Dedicated macOS native Chrome profile containers and parallel ChatGPT worker tabs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-xs font-semibold transition-colors"
          >
            <FiRefreshCw className="w-3.5 h-3.5 text-rose-500" />
            <span>Test OpenClaw Bridge</span>
          </button>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Configured Chrome Profiles ({profiles.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((prof) => (
            <GlassCard key={prof.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    {prof.friendlyName}
                  </h3>
                  <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Profile dir: {prof.profileDirName}
                  </div>
                </div>
                <StatusBadge status={prof.chatGptSessionStatus} size="sm" />
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                {prof.notes}
              </p>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-200/40 dark:border-white/5">
                <span className="text-neutral-500">
                  Workers: <strong className="text-neutral-300">{prof.assignedWorkerCount} tabs</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenBrowser(prof)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary-red text-xs font-semibold"
                  >
                    <FiExternalLink className="w-3.5 h-3.5" />
                    <span>Open Native Chrome</span>
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Workers & Live Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Workers List (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Active Automation Worker Tabs ({workers.length})
          </h2>

          <div className="space-y-2.5">
            {workers.map((w) => {
              const isSelected = selectedWorker?.id === w.id;
              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedWorker(w)}
                  className={`glass-card p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                    isSelected ? 'border-rose-500/50 bg-rose-500/[0.04]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-neutral-200 dark:bg-white/5 text-rose-500">
                      <FiCpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white">
                          {w.name}
                        </span>
                        <StatusBadge status={w.status} size="sm" />
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {w.currentTaskDescription || 'Awaiting job queue'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right hidden sm:block">
                      <div className="font-semibold text-neutral-300">
                        {w.totalJobsProcessed} jobs
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        {w.successRate}% success
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestartWorker(w);
                      }}
                      title="Reset Worker State"
                      className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                      <FiRefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Worker Preview (1 col) - Section 31 */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <FiEye className="text-rose-500" />
            <span>Worker Telemetry & Snapshot</span>
          </h2>

          {selectedWorker ? (
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/40 dark:border-white/5">
                <div>
                  <h3 className="font-bold text-xs text-neutral-900 dark:text-white">
                    {selectedWorker.name}
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    {selectedWorker.profileFriendlyName}
                  </span>
                </div>
                <StatusBadge status={selectedWorker.status} size="sm" />
              </div>

              {/* Snapshot Preview Box */}
              <div className="h-44 rounded-xl overflow-hidden bg-black/60 border border-white/10 relative">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"
                  alt="Worker DOM Preview"
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-black/80 backdrop-blur-md text-[10px] text-white">
                  <strong>Action:</strong> {selectedWorker.lastAction || 'Worker initialized'}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                    Next Expected Event
                  </span>
                  <p className="text-neutral-300 font-medium mt-0.5">
                    {selectedWorker.nextExpectedAction || 'Polling job queue'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const prof = profiles.find(p => p.id === selectedWorker.profileId);
                  if (prof) handleOpenBrowser(prof);
                }}
                className="w-full py-2.5 rounded-xl btn-primary-red text-xs font-bold flex items-center justify-center gap-2"
              >
                <FiExternalLink className="w-3.5 h-3.5" />
                <span>Open Associated Chrome Session</span>
              </button>
            </div>
          ) : (
            <div className="p-8 text-center glass-panel rounded-2xl text-xs text-neutral-400">
              Select a worker to inspect telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
