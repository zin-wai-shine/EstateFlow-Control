// EstateFlow Control - Operational Dashboard (Section 16 & 77)
import React from 'react';
import { 
  FiPlus, 
  FiPlay, 
  FiHome, 
  FiCheckCircle, 
  FiClock, 
  FiAlertTriangle, 
  FiLayers, 
  FiCpu, 
  FiSend, 
  FiImage, 
  FiChevronRight,
  FiActivity,
  FiShield
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

  return (
    <div className="space-y-6">
      {/* Top Banner: Direct One-Click Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-rose-500/20 shadow-xl bg-gradient-to-r from-rose-500/10 via-transparent to-transparent">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Automation Operations Center
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-estate listing synthesis, multi-worker enhancement, and publishing gateway.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateProperty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary-red text-xs font-bold tracking-wide uppercase shadow-lg shadow-rose-600/30"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Property</span>
          </button>

          <button
            onClick={() => setActivePage('automation')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-200/80 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/15 text-neutral-800 dark:text-white border border-neutral-300/60 dark:border-white/10 text-xs font-bold tracking-wide uppercase transition-all"
          >
            <FiPlay className="w-4 h-4 text-rose-500" />
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
            <span className="text-xs font-semibold uppercase tracking-wider">Properties</span>
            <FiHome className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white">
              {properties.length}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
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
            <span className="text-xs font-semibold uppercase tracking-wider">Image Pipeline</span>
            <FiImage className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white">
              {allImages.length}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
              <span className="text-emerald-500">{imagesCompleted} Verified</span>
              <span>•</span>
              <span className={imagesProcessing > 0 ? 'text-blue-400 font-bold' : ''}>
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
            <span className="text-xs font-semibold uppercase tracking-wider">Browser Workers</span>
            <FiLayers className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white">
              {workers.length}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
              <span className="text-emerald-500">{readyWorkers} Ready</span>
              <span>•</span>
              <span className={busyWorkers > 0 ? 'text-blue-400 font-bold' : ''}>
                {busyWorkers} Busy
              </span>
              <span>•</span>
              <span>0 Offline</span>
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
            <span className="text-xs font-semibold uppercase tracking-wider">Queue & Approvals</span>
            <FiSend className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white">
              {activeJobs} Active
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
              {failedJobs > 0 ? (
                <span className="text-rose-500 font-bold">{failedJobs} Needs Review</span>
              ) : (
                <span className="text-emerald-500">0 Errors</span>
              )}
              <span>•</span>
              <span className={pendingApprovals > 0 ? 'text-amber-400 font-bold' : ''}>
                {pendingApprovals} Pending Approval
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Operational Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Properties Workspaces */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <FiHome className="text-rose-500" />
              <span>Active Property Workspaces</span>
            </h2>
            <button
              onClick={() => setActivePage('properties')}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
            >
              <span>View All Properties ({properties.length})</span>
              <FiChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {properties.map((prop) => {
              const propImages = allImages.filter(i => i.propertyId === prop.id);
              const primaryImg = propImages.find(i => i.isFavorite) || propImages[0];
              const completedCount = propImages.filter(i => i.status === 'completed').length;

              return (
                <div
                  key={prop.id}
                  onClick={() => openPropertyDetail(prop.id)}
                  className="glass-card glass-card-hover p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-800 shrink-0 border border-white/10 relative">
                      {primaryImg?.previewUrl ? (
                        <img
                          src={primaryImg.previewUrl}
                          alt={prop.projectName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                          <FiImage className="w-6 h-6" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1 rounded bg-black/70 text-white">
                        {propImages.length}
                      </span>
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                          {prop.projectName}
                        </h3>
                        <StatusBadge status={prop.status} size="sm" />
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {prop.bedrooms} Bed • {prop.bathrooms} Bath • {prop.sizeSqm} m² • {prop.location}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-400 font-medium">
                        <span className="text-rose-500 font-bold">
                          ฿{prop.rentalPrice?.toLocaleString()}/mo
                        </span>
                        {prop.nearestTransit && (
                          <span className="text-neutral-400">
                            🚇 {prop.nearestTransit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Status */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-200/50 dark:border-white/5">
                    <span className="text-xs font-semibold text-emerald-500">
                      {completedCount}/{propImages.length} Enhanced
                    </span>
                    <span className="text-[11px] text-neutral-400 mt-1">
                      Click to open workspace →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (1 col): Recent Activity & System Health */}
        <div className="space-y-6">
          {/* System Health Summary */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FiShield className="text-rose-500" />
                <span>System Health</span>
              </h3>
              <button
                onClick={() => setActivePage('health')}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
              >
                Inspect Details
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-200/40 dark:border-white/5">
                <span className="text-neutral-500 dark:text-neutral-400">Desktop Shell</span>
                <span className="font-semibold text-emerald-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  macOS Native
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-200/40 dark:border-white/5">
                <span className="text-neutral-500 dark:text-neutral-400">SQLite Database</span>
                <span className="font-semibold text-emerald-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  v2 Active
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-200/40 dark:border-white/5">
                <span className="text-neutral-500 dark:text-neutral-400">Docker Services</span>
                <span className="font-semibold text-emerald-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-neutral-500 dark:text-neutral-400">OpenClaw Bridge</span>
                <span className="font-semibold text-emerald-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ready
                </span>
              </div>
            </div>
          </div>

          {/* Activity Stream */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FiActivity className="text-rose-500" />
                <span>Recent Activity</span>
              </h3>
              <button
                onClick={() => setActivePage('activity')}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
              >
                Full History
              </button>
            </div>

            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className={`mt-0.5 p-1 rounded-md shrink-0 ${
                    act.severity === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : act.severity === 'error' 
                        ? 'bg-rose-500/10 text-rose-400' 
                        : 'bg-neutral-500/10 text-neutral-400'
                  }`}>
                    {act.severity === 'success' ? (
                      <FiCheckCircle className="w-3.5 h-3.5" />
                    ) : act.severity === 'error' ? (
                      <FiAlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <FiClock className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
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
