// EstateFlow Control - Automation Center (Section 23, 24, 25)
import React, { useState } from 'react';
import { 
  FiPlay, 
  FiCpu, 
  FiLayers, 
  FiClock, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiSettings, 
  FiRefreshCw, 
  FiSliders,
  FiZap
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { GlassCard } from '../components/common/GlassCard';
import { automationEngine } from '../services/automationEngine';
import { db } from '../services/storage';

export const AutomationCenter: React.FC = () => {
  const { properties, workers, jobs, addNotification } = useApp();
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');
  const [enableEnhance, setEnableEnhance] = useState(true);
  const [enableFbHero, setEnableFbHero] = useState(true);
  const [enableTtHero, setEnableTtHero] = useState(true);
  const [enableContent, setEnableContent] = useState(true);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued');
  const recentJobs = jobs.slice(0, 10);

  const handleStartWorkflow = () => {
    if (!selectedProperty) {
      alert('Please select a property first.');
      return;
    }

    const images = db.getImages(selectedProperty.id);

    if (enableEnhance) {
      images.forEach(img => {
        if (img.status !== 'completed') {
          automationEngine.queueImageEnhancement(selectedProperty, img);
        }
      });
    }

    if (enableFbHero) {
      automationEngine.queueFacebookHero(selectedProperty, images.map(i => i.id));
    }

    if (enableTtHero) {
      automationEngine.queueTikTokHero(selectedProperty, images.map(i => i.id));
    }

    if (enableContent) {
      automationEngine.queueContentGeneration(selectedProperty);
    }

    addNotification('success', 'Workflow Triggered', `Orchestrated automation pipeline for ${selectedProperty.projectName}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Automation Orchestration Center
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Monitor browser worker pools, queue execution, and multi-stage workflow templates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OpenClaw Engine Active</span>
          </span>
        </div>
      </div>

      {/* Main Runner Configurator */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/40 dark:border-white/10">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FiZap className="text-rose-500" />
              <span>One-Click Workflow Launcher</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Select property and configured stages to run sequentially across Chrome workers.
            </p>
          </div>

          <button
            onClick={handleStartWorkflow}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-primary-red text-xs font-bold uppercase tracking-wider shadow-xl shadow-rose-600/30"
          >
            <FiPlay className="w-4 h-4 fill-white" />
            <span>Launch Pipeline</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
              Target Property Workspace
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-xs font-semibold cursor-pointer dark:bg-neutral-900"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.projectName} ({p.bedrooms}BR, {p.location}) - ฿{p.rentalPrice?.toLocaleString()}/mo
                </option>
              ))}
            </select>
            {selectedProperty && (
              <p className="text-[11px] text-neutral-400 mt-2">
                Images available: {db.getImages(selectedProperty.id).length} photos ready for enhancement.
              </p>
            )}
          </div>

          {/* Workflow Stage Toggles */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
              Workflow Stages (Enable / Disable)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl glass-input cursor-pointer hover:border-rose-500/40">
                <input
                  type="checkbox"
                  checked={enableEnhance}
                  onChange={(e) => setEnableEnhance(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600"
                />
                <span className="font-semibold text-neutral-200">1. Image Enhancement</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl glass-input cursor-pointer hover:border-rose-500/40">
                <input
                  type="checkbox"
                  checked={enableFbHero}
                  onChange={(e) => setEnableFbHero(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600"
                />
                <span className="font-semibold text-neutral-200">2. Facebook Hero (1:1)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl glass-input cursor-pointer hover:border-rose-500/40">
                <input
                  type="checkbox"
                  checked={enableTtHero}
                  onChange={(e) => setEnableTtHero(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600"
                />
                <span className="font-semibold text-neutral-200">3. TikTok Hero (9:16)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl glass-input cursor-pointer hover:border-rose-500/40">
                <input
                  type="checkbox"
                  checked={enableContent}
                  onChange={(e) => setEnableContent(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600"
                />
                <span className="font-semibold text-neutral-200">4. Content Studio Copy</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Live Active Execution Queue */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FiRefreshCw className={`text-rose-500 ${activeJobs.length > 0 ? 'animate-spin' : ''}`} />
            <span>Active Job Pipeline ({activeJobs.length} Running / Queued)</span>
          </span>
          <span className="text-xs text-neutral-400 font-normal">
            Event-driven verification • Zero hardcoded sleeps
          </span>
        </h2>

        {activeJobs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass-panel text-xs text-neutral-400">
            No active jobs in queue. Select a property and launch a pipeline above.
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <div key={job.id} className="glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">
                      {job.propertyName}
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs font-semibold text-rose-400">
                      {job.stageName || job.workflowType}
                    </span>
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                  <p className="text-xs text-neutral-400">
                    {job.currentStepMessage}
                  </p>
                  {job.assignedWorkerName && (
                    <div className="text-[11px] text-neutral-500">
                      Assigned to: <strong className="text-neutral-300">{job.assignedWorkerName}</strong>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-36 text-right">
                    <span className="text-xs font-bold text-neutral-200">
                      {job.progressPercent}%
                    </span>
                    <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden mt-1">
                      <div 
                        className="h-full bg-rose-600 transition-all duration-300"
                        style={{ width: `${job.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
