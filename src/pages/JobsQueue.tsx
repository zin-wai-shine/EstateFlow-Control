// EstateFlow Control - Job Queue System (Normal Case, Clean)
import React, { useState } from 'react';
import { StatusBadge } from '../components/common/StatusBadge';
import { AutomationJob } from '../types';
import { db } from '../services/storage';
import { useApp } from '../context/AppContext';

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Automation Job Queue
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Persistent SQLite queue tracking all enhancement, synthesis, and publishing tasks.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl glass-panel text-xs">
          {['all', 'active', 'completed', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-medium capitalize transition-colors cursor-pointer ${
                statusFilter === st 
                  ? 'bg-rose-600 text-white shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Jobs */}
      <div className="glass-panel rounded-xl overflow-hidden border border-neutral-200 dark:border-white/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-100 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400 font-medium">
            <tr>
              <th className="py-2.5 px-4">Job & Task</th>
              <th className="py-2.5 px-4">Property</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Assigned Worker</th>
              <th className="py-2.5 px-4">Progress / Output</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-400">
                  No jobs match the current filter.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {job.stageName || job.workflowType}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      {job.id}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-neutral-600 dark:text-neutral-300">
                    {job.propertyName}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={job.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-4 text-neutral-500 dark:text-neutral-400">
                    {job.assignedWorkerName || 'Pending'}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="text-neutral-700 dark:text-neutral-300 text-xs">
                      {job.currentStepMessage}
                    </div>
                    {job.outputPath && (
                      <div className="text-[10px] text-emerald-500 font-mono truncate max-w-xs mt-0.5">
                        {job.outputPath}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {(job.status === 'failed' || job.status === 'needs_review') && (
                      <button
                        onClick={() => handleRetryJob(job)}
                        className="px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xs font-medium cursor-pointer"
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
