// EstateFlow Control - Automation Center (Normal Case, Clean)
import React, { useState } from 'react';
import { 
  FiPlay, 
  FiRefreshCw, 
  FiZap
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { automationEngine } from '../services/automationEngine';
import { db } from '../services/storage';

export const AutomationCenter: React.FC = () => {
  const { properties, jobs, addNotification } = useApp();
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');
  const [enableEnhance, setEnableEnhance] = useState(true);
  const [enableFbHero, setEnableFbHero] = useState(true);
  const [enableTtHero, setEnableTtHero] = useState(true);
  const [enableContent, setEnableContent] = useState(true);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued');

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

    addNotification('success', 'Workflow Triggered', `Orchestrated pipeline for ${selectedProperty.projectName}`);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Automation Orchestration Center
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Monitor browser worker pools, queue execution, and multi-stage workflow templates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>OpenClaw Engine Active</span>
          </span>
        </div>
      </div>

      {/* Main Runner Configurator */}
      <div className="glass-panel p-5 rounded-2xl border border-neutral-200 dark:border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-100 dark:border-white/5">
          <div>
            <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <FiZap className="text-rose-500" />
              <span>One-Click Workflow Launcher</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select property and configured stages to run sequentially across Chrome workers.
            </p>
          </div>

          <button
            onClick={handleStartWorkflow}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary-red text-xs font-medium cursor-pointer"
          >
            <FiPlay className="w-3.5 h-3.5 fill-white" />
            <span>Launch Pipeline</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Property Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
              Target Property
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg glass-input text-xs cursor-pointer dark:bg-neutral-900"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.projectName} ({p.bedrooms} Bed, {p.location})
                </option>
              ))}
            </select>
            {selectedProperty && (
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Images available: {db.getImages(selectedProperty.id).length} photos ready for enhancement.
              </p>
            )}
          </div>

          {/* Workflow Stage Toggles */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
              Workflow Stages
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg glass-input cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableEnhance}
                  onChange={(e) => setEnableEnhance(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-rose-600"
                />
                <span className="text-neutral-700 dark:text-neutral-200">1. Image Enhancement</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg glass-input cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFbHero}
                  onChange={(e) => setEnableFbHero(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-rose-600"
                />
                <span className="text-neutral-700 dark:text-neutral-200">2. Facebook Hero (1:1)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg glass-input cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTtHero}
                  onChange={(e) => setEnableTtHero(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-rose-600"
                />
                <span className="text-neutral-700 dark:text-neutral-200">3. TikTok Hero (9:16)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg glass-input cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableContent}
                  onChange={(e) => setEnableContent(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-rose-600"
                />
                <span className="text-neutral-700 dark:text-neutral-200">4. Content Studio</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Live Active Execution Queue */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FiRefreshCw className={`text-rose-500 ${activeJobs.length > 0 ? 'animate-spin' : ''}`} />
            <span>Active Job Pipeline ({activeJobs.length} Running / Queued)</span>
          </span>
          <span className="text-[11px] text-neutral-400 font-normal">
            State-based event verification
          </span>
        </h2>

        {activeJobs.length === 0 ? (
          <div className="p-6 text-center rounded-xl glass-panel text-xs text-neutral-400">
            No active jobs in queue. Select a property and launch a pipeline above.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeJobs.map((job) => (
              <div key={job.id} className="glass-card p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      {job.propertyName}
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-rose-500">
                      {job.stageName || job.workflowType}
                    </span>
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                  <p className="text-xs text-neutral-400">
                    {job.currentStepMessage}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-28 text-right">
                    <span className="text-xs font-medium text-neutral-300">
                      {job.progressPercent}%
                    </span>
                    <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden mt-1">
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
