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
      <div className="glass-panel rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
            <tr>
              <th className="py-2.5 px-3.5">Job</th>
              <th className="py-2.5 px-3.5">Process</th>
              <th className="py-2.5 px-3.5">Step</th>
              <th className="py-2.5 px-3.5">Property</th>
              <th className="py-2.5 px-3.5">Image</th>
              <th className="py-2.5 px-3.5">Worker</th>
              <th className="py-2.5 px-3.5">Status</th>
              <th className="py-2.5 px-3.5">Started</th>
              <th className="py-2.5 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-neutral-400">
                  No jobs match the current filter.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {job.stageName || job.workflowType}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {job.id.substring(0, 16)}...
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 text-neutral-700 dark:text-neutral-300">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-medium">
                      {job.processName || 'Direct Execution'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-neutral-600 dark:text-neutral-400 text-[11px]">
                    {job.stageName || 'Pipeline'}
                  </td>
                  <td className="py-2.5 px-3.5 text-neutral-800 dark:text-neutral-200 font-medium">
                    {job.propertyName}
                  </td>
                  <td className="py-2.5 px-3.5 text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                    {job.imageId ? job.imageId.substring(0, 10) : '—'}
                  </td>
                  <td className="py-2.5 px-3.5 text-neutral-600 dark:text-neutral-300">
                    {job.assignedWorkerName || 'Pending'}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <StatusBadge status={job.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-3.5 text-neutral-400 text-[11px]">
                    {job.startedAt ? new Date(job.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    {(job.status === 'failed' || job.status === 'needs_review') && (
                      <button
                        onClick={() => handleRetryJob(job)}
                        className="btn-sm bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
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
