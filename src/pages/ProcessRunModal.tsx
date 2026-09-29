// EstateFlow Control - Process Run Monitor Modal
import React, { useMemo } from 'react';
import { 
  FiPlay, 
  FiPause, 
  FiX, 
  FiExternalLink, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiClock, 
  FiLayers, 
  FiCpu, 
  FiRefreshCw 
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { db } from '../services/storage';
import { processEngine } from '../services/processEngine';
import { openclawClient } from '../services/openclawClient';
import { StatusBadge } from '../components/common/StatusBadge';

export const ProcessRunModal: React.FC = () => {
  const { 
    activeProcessRunId, 
    closeProcessRun, 
    processRuns, 
    jobs, 
    workers, 
    profiles,
    addNotification 
  } = useApp();

  const run = useMemo(() => {
    return processRuns.find(r => r.id === activeProcessRunId) || db.getProcessRun(activeProcessRunId || '');
  }, [activeProcessRunId, processRuns]);

  if (!activeProcessRunId || !run) return null;

  const process = db.getProcess(run.processId);
  const property = db.getProperty(run.propertyId);

  // Jobs belonging to this run
  const runJobs = jobs.filter(j => j.processRunId === run.id);

  // Active workers assigned to these jobs
  const activeWorkerIds = Array.from(new Set(runJobs.map(j => j.assignedWorkerId).filter(Boolean)));
  const activeWorkers = workers.filter(w => activeWorkerIds.includes(w.id));

  const progressPercent = run.totalImageCount > 0 
    ? Math.round((run.completedImageCount / run.totalImageCount) * 100) 
    : (run.status === 'completed' ? 100 : 25);

  const handlePause = () => {
    processEngine.pauseProcessRun(run.id);
    addNotification('info', 'Process Paused', `${run.processName} has been paused.`);
  };

  const handleResume = () => {
    processEngine.resumeProcessRun(run.id);
    addNotification('info', 'Process Resumed', `${run.processName} resumed execution.`);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this process run?')) {
      processEngine.cancelProcessRun(run.id);
      addNotification('warning', 'Process Cancelled', `${run.processName} (${run.id}) was cancelled.`);
    }
  };

  const handleOpenWorkerProfile = async (profileId?: string) => {
    if (!profileId) return;
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    try {
      await openclawClient.openNativeChromeProfile(profile);
      addNotification('success', 'Chrome Launched', `Opened native session: ${profile.friendlyName}`);
    } catch (e: any) {
      addNotification('error', 'Launch Failed', e.message || 'Could not open Chrome profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl rounded-2xl glass-panel border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <FiLayers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {run.processName}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                  {run.id}
                </span>
                <StatusBadge status={run.status} />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Target Property: <span className="font-medium text-neutral-800 dark:text-neutral-200">{run.propertyName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {run.status === 'running' && (
              <button onClick={handlePause} className="btn-secondary">
                <FiPause className="w-3.5 h-3.5 text-amber-500" />
                <span>Pause</span>
              </button>
            )}
            {run.status === 'paused' && (
              <button onClick={handleResume} className="btn-primary-red">
                <FiPlay className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>
            )}
            {(run.status === 'running' || run.status === 'paused') && (
              <button onClick={handleCancel} className="btn-secondary hover:text-rose-500">
                <span>Cancel</span>
              </button>
            )}
            <button 
              onClick={closeProcessRun}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Progress Banner */}
          <div className="p-4 rounded-xl glass-card space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FiRefreshCw className={`w-3.5 h-3.5 ${run.status === 'running' ? 'animate-spin text-rose-500' : 'text-neutral-400'}`} />
                Step {run.currentStepOrder} of {run.totalSteps}
              </span>
              <span className="font-mono text-neutral-600 dark:text-neutral-300">
                {run.completedImageCount} / {run.totalImageCount} Assets Completed ({progressPercent}%)
              </span>
            </div>
            
            <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div 
                className="h-full bg-rose-600 dark:bg-rose-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
              <span>Jobs Created: {run.jobsCreated}</span>
              <span>Jobs Completed: {run.jobsCompleted}</span>
              <span>Jobs Failed: {run.jobsFailed}</span>
            </div>
          </div>

          {/* Active Workers Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FiCpu className="text-rose-500 w-3.5 h-3.5" />
                Active Browser Workers ({activeWorkers.length})
              </span>
            </h3>

            {activeWorkers.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 text-center text-xs text-neutral-500">
                No workers currently locked to this process run.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeWorkers.map(w => {
                  const job = runJobs.find(j => j.assignedWorkerId === w.id && j.status === 'running');
                  return (
                    <div key={w.id} className="p-3.5 rounded-xl glass-card space-y-2 border border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                            {w.name}
                          </span>
                        </div>
                        <StatusBadge status={w.status} />
                      </div>

                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Profile: <span className="text-neutral-800 dark:text-neutral-200">{w.profileFriendlyName}</span>
                      </div>

                      {job && (
                        <div className="text-[11px] p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 truncate">
                          {job.currentStepMessage || 'Processing task in ChatGPT tab...'}
                        </div>
                      )}

                      <button
                        onClick={() => handleOpenWorkerProfile(w.profileId)}
                        className="btn-secondary w-full !h-7 !text-[11px]"
                      >
                        <FiExternalLink className="w-3 h-3 text-rose-500" />
                        <span>Open Current Worker</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Queue & Job Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <FiClock className="text-neutral-400 w-3.5 h-3.5" />
              Process Jobs & Work Items ({runJobs.length})
            </h3>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
              <div className="max-h-48 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                {runJobs.length === 0 ? (
                  <div className="p-4 text-center text-neutral-400 text-xs">
                    Initializing queue...
                  </div>
                ) : (
                  runJobs.map(job => (
                    <div key={job.id} className="p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <StatusBadge status={job.status} />
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                            {job.stageName || job.workflowType}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate">
                            {job.currentStepMessage}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 text-[11px] text-neutral-400 font-mono">
                        {job.assignedWorkerName || 'Unassigned'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end bg-neutral-50/50 dark:bg-neutral-900/50">
          <button onClick={closeProcessRun} className="btn-secondary">
            Close Monitor
          </button>
        </div>
      </div>
    </div>
  );
};
