// EstateFlow Control - Job Queue System (Section 26)
import React, { useState } from 'react';
import { 
  FiList, 
  FiRefreshCw, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiFolder, 
  FiClock, 
  FiCpu,
  FiFilter
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { AutomationJob } from '../types';
import { db } from '../services/storage';

export const JobsQueue: React.FC = () => {
  const { jobs, refreshJobs, addNotification } = useApp();
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredJobs = jobs.filter(j => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return j.status === 'running' || j.status === 'queued';
    if (statusFilter === 'completed') return j.status === 'completed';
    if (statusFilter === 'failed') return j.status === 'failed' || j.status === 'needs_review';
    return true;
  });

  const handleRetryJob = (job: AutomationJob) => {
    job.status = 'queued';
    job.retryCount = 0;
    job.currentStepMessage = 'Operator triggered manual retry';
    db.saveJob(job);
    refreshJobs();
    addNotification('info', 'Job Requeued', `Requeued ${job.stageName || job.workflowType}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Automation Job Queue
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Persistent SQLite queue tracking all enhancement, synthesis, and publishing tasks.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-panel text-xs">
          {['all', 'active', 'completed', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all ${
                statusFilter === st 
                  ? 'bg-rose-600 text-white shadow-sm' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Jobs */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-200/50 dark:bg-white/5 border-b border-neutral-200/60 dark:border-white/10 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Job ID & Task</th>
              <th className="py-3 px-4">Property</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assigned Worker</th>
              <th className="py-3 px-4">Progress / Output</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/40 dark:divide-white/5 font-mono">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400 font-sans">
                  No jobs match the current filter.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-neutral-100/50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-neutral-900 dark:text-white font-sans">
                      {job.stageName || job.workflowType}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      {job.id}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-sans text-neutral-300">
                    {job.propertyName}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <StatusBadge status={job.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-neutral-400 font-sans">
                    {job.assignedWorkerName || 'Pending worker'}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="text-neutral-300 text-xs">
                      {job.currentStepMessage}
                    </div>
                    {job.outputPath && (
                      <div className="text-[10px] text-emerald-400 font-mono truncate max-w-xs mt-0.5">
                        {job.outputPath}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    {(job.status === 'failed' || job.status === 'needs_review') && (
                      <button
                        onClick={() => handleRetryJob(job)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold"
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
