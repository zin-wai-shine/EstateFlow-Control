// EstateFlow Control - Operational Dashboard (Normal Case, Calm & Clean)
import React from 'react';
import { 
  FiPlus, 
  FiPlay, 
  FiHome, 
  FiCheckCircle, 
  FiClock, 
  FiAlertTriangle, 
  FiLayers, 
  FiSend, 
  FiImage, 
  FiChevronRight,
  FiActivity,
  FiShield,
  FiGitBranch
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { GlassCard } from '../components/common/GlassCard';
import { db } from '../services/storage';

export const Dashboard: React.FC = () => {
  const { 
    properties, 
    workers, 
    jobs, 
    health, 
    processRuns,
    openProcessRun,
    openCreateProperty, 
    openPropertyDetail, 
    setActivePage 
  } = useApp();

  const allImages = db.getImages();
  const activities = db.getActivities().slice(0, 6);
  const publishingRecords = db.getPublishingRecords();

  // Metrics
  const availableProperties = properties.filter(p => p.status === 'available').length;
  const reservedProperties = properties.filter(p => p.status === 'reserved').length;
  const rentedProperties = properties.filter(p => p.status === 'rented').length;

  const imagesProcessing = allImages.filter(i => i.status === 'generating' || i.status === 'uploading' || i.status === 'downloading').length;
  const imagesWaiting = allImages.filter(i => i.status === 'waiting' || i.status === 'queued').length;
  const imagesCompleted = allImages.filter(i => i.status === 'completed').length;

  const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued').length;
  const failedJobs = jobs.filter(j => j.status === 'failed' || j.status === 'needs_review').length;

  const readyWorkers = workers.filter(w => w.status === 'ready').length;
  const busyWorkers = workers.filter(w => w.status === 'busy').length;
  const pendingApprovals = publishingRecords.filter(r => r.status === 'pending_approval').length;

  const runningProcesses = processRuns.filter(r => r.status === 'running').length;
  const queuedProcesses = processRuns.filter(r => r.status === 'queued').length;
  const failedProcesses = processRuns.filter(r => r.status === 'failed' || r.status === 'needs_review').length;
  const recentRuns = processRuns.slice(0, 3);

  return (
    <div className="space-y-5">
      {/* Top Banner: Direct One-Click Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Operations Center
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-estate listing synthesis, multi-worker enhancement, and publishing gateway.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateProperty}
            className="btn-primary-red"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>New Property</span>
          </button>

          <button
            onClick={() => setActivePage('automation')}
            className="btn-secondary"
          >
            <FiPlay className="w-3.5 h-3.5 text-rose-500" />
            <span>Start Workflow</span>
          </button>
        </div>
      </div>

      {/* Critical Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active & Available Properties */}
        <GlassCard 
          onClick={() => setActivePage('properties')} 
          hoverable
          className="flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Properties</span>
            <FiHome className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {properties.length}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="text-emerald-500">{availableProperties} Available</span>
              <span>•</span>
              <span className="text-amber-500">{reservedProperties} Reserved</span>
              <span>•</span>
              <span>{rentedProperties} Rented</span>
            </div>
          </div>
        </GlassCard>

        {/* Image Queue Status */}
        <GlassCard 
          onClick={() => setActivePage('properties')} 
          hoverable
          className="flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Image Pipeline</span>
            <FiImage className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {allImages.length}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="text-emerald-500">{imagesCompleted} Verified</span>
              <span>•</span>
              <span className={imagesProcessing > 0 ? 'text-blue-400 font-medium' : ''}>
                {imagesProcessing} Processing
              </span>
              <span>•</span>
              <span>{imagesWaiting} Waiting</span>
            </div>
          </div>
        </GlassCard>

        {/* Automation Workers */}
        <GlassCard 
          onClick={() => setActivePage('browser_workers')} 
          hoverable
          className="flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Browser Workers</span>
            <FiLayers className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {workers.length}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="text-emerald-500">{readyWorkers} Ready</span>
              <span>•</span>
              <span className={busyWorkers > 0 ? 'text-blue-400 font-medium' : ''}>
                {busyWorkers} Busy
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Jobs & Publishing */}
        <GlassCard 
          onClick={() => setActivePage(failedJobs > 0 ? 'jobs' : 'publishing')} 
          hoverable
          className="flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Queue & Approvals</span>
            <FiSend className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {activeJobs} Active
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              {failedJobs > 0 ? (
                <span className="text-rose-500 font-medium">{failedJobs} Needs Review</span>
              ) : (
                <span className="text-emerald-500">0 Errors</span>
              )}
              <span>•</span>
              <span className={pendingApprovals > 0 ? 'text-amber-400 font-medium' : ''}>
                {pendingApprovals} Pending
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Operational Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Properties Workspaces */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <FiHome className="text-rose-500" />
              <span>Active Property Workspaces</span>
            </h2>
            <button
              onClick={() => setActivePage('properties')}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View all ({properties.length})</span>
              <FiChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {properties.map((prop) => {
              const propImages = allImages.filter(i => i.propertyId === prop.id);
              const primaryImg = propImages.find(i => i.isFavorite) || propImages[0];
              const completedCount = propImages.filter(i => i.status === 'completed').length;

              return (
                <div
                  key={prop.id}
                  onClick={() => openPropertyDetail(prop.id)}
                  className="glass-card glass-card-hover p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-800 relative">
                      {primaryImg?.previewUrl ? (
                        <img
                          src={primaryImg.previewUrl}
                          alt={prop.projectName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                          <FiImage className="w-5 h-5" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 text-[9px] font-medium px-1 rounded bg-black/60 text-white">
                        {propImages.length}
                      </span>
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                          {prop.projectName}
                        </h3>
                        <StatusBadge status={prop.status} size="sm" />
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {prop.bedrooms} Bed • {prop.bathrooms} Bath • {prop.sizeSqm} m² • {prop.location}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400 font-medium">
                        <span className="text-rose-500 font-semibold">
                          ฿{prop.rentalPrice?.toLocaleString()}/mo
                        </span>
                        {prop.nearestTransit && (
                          <span className="text-neutral-400">
                            • {prop.nearestTransit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Status */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-200 dark:border-neutral-800">
                    <span className="text-xs font-medium text-emerald-500">
                      {completedCount}/{propImages.length} Enhanced
                    </span>
                    <span className="text-[11px] text-neutral-400 mt-0.5">
                      Open workspace →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (1 col): Recent Activity & System Health */}
        <div className="space-y-4">
          {/* System Health Summary */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <FiShield className="text-rose-500" />
                <span>System Health</span>
              </h3>
              <button
                onClick={() => setActivePage('health')}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
              >
                Details
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">Desktop Shell</span>
                <span className="font-medium text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  macOS Native
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">SQLite Database</span>
                <span className="font-medium text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">Docker Services</span>
                <span className="font-medium text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-neutral-500 dark:text-neutral-400">OpenClaw Bridge</span>
                <span className="font-medium text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ready
                </span>
              </div>
            </div>
          </div>

          {/* Processes Overview (Section 51) */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <FiGitBranch className="text-rose-500" />
                <span>Processes Overview</span>
              </h3>
              <button
                onClick={() => setActivePage('processes')}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
              >
                All Processes
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 text-center">
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Running</div>
                <div className="text-sm font-bold text-blue-500 mt-0.5">
                  {runningProcesses}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 text-center">
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Queued</div>
                <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-0.5">
                  {queuedProcesses}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 text-center">
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Review</div>
                <div className={`text-sm font-bold mt-0.5 ${failedProcesses > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {failedProcesses}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-medium text-neutral-400 flex items-center justify-between">
                <span>Recent Runs</span>
                <span className="text-[10px]">{recentRuns.length} total</span>
              </div>
              {recentRuns.length === 0 ? (
                <div className="text-[11px] text-neutral-400 text-center py-2">
                  No process runs recorded.
                </div>
              ) : (
                recentRuns.map((run) => (
                  <div
                    key={run.id}
                    onClick={() => openProcessRun(run.id)}
                    className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-xs text-neutral-800 dark:text-neutral-200 truncate">
                        {run.processName}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        {run.propertyName}
                      </div>
                    </div>
                    <StatusBadge status={run.status} size="sm" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Stream */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <FiActivity className="text-rose-500" />
                <span>Recent Activity</span>
              </h3>
              <button
                onClick={() => setActivePage('activity')}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
              >
                All
              </button>
            </div>

            <div className="space-y-2.5">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className={`mt-0.5 p-1 rounded shrink-0 ${
                    act.severity === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : act.severity === 'error' 
                        ? 'bg-rose-500/10 text-rose-400' 
                        : 'bg-neutral-500/10 text-neutral-400'
                  }`}>
                    {act.severity === 'success' ? (
                      <FiCheckCircle className="w-3 h-3" />
                    ) : act.severity === 'error' ? (
                      <FiAlertTriangle className="w-3 h-3" />
                    ) : (
                      <FiClock className="w-3 h-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {act.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
