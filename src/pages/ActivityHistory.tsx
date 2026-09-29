// EstateFlow Control - Activity Timeline & Technical Logs (Section 50 & 51)
import React, { useState } from 'react';
import { 
  FiActivity, 
  FiTerminal, 
  FiClock, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiInfo, 
  FiFilter 
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { db } from '../services/storage';

export const ActivityHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'human' | 'technical'>('human');
  const activities = db.getActivities();
  const techLogs = db.getTechnicalLogs();

  return (
    <div className="space-y-6">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Activity History & Operational Audit
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Chronological audit trail of business events and technical diagnostic records.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-panel text-xs">
          <button
            onClick={() => setActiveTab('human')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'human' ? 'bg-rose-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FiActivity className="w-3.5 h-3.5" />
            <span>Business Events</span>
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'technical' ? 'bg-rose-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FiTerminal className="w-3.5 h-3.5" />
            <span>Technical Logs</span>
          </button>
        </div>
      </div>

      {activeTab === 'human' ? (
        /* Human Readable Activity Timeline (Section 50) */
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">
                No activity events recorded yet.
              </p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-start gap-4 p-3.5 rounded-2xl bg-neutral-200/50 dark:bg-white/5 border border-neutral-300/40 dark:border-white/5">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    act.severity === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : act.severity === 'error' 
                        ? 'bg-rose-500/10 text-rose-400' 
                        : 'bg-neutral-500/10 text-neutral-400'
                  }`}>
                    {act.severity === 'success' ? (
                      <FiCheckCircle className="w-4 h-4" />
                    ) : act.severity === 'error' ? (
                      <FiAlertTriangle className="w-4 h-4" />
                    ) : (
                      <FiInfo className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-neutral-900 dark:text-white">
                        {act.title}
                      </h4>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                      {act.description}
                    </p>

                    {act.propertyName && (
                      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold">
                        {act.propertyName}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Technical Logs (Section 51) */
        <div className="glass-panel p-6 rounded-3xl border border-white/10 font-mono text-xs space-y-3">
          <div className="text-[11px] text-neutral-400 pb-2 border-b border-white/5">
            Log Rotation Active • Rotating at 1,000 records • Zero sensitive credentials logged
          </div>

          <div className="space-y-2">
            {techLogs.map((log) => (
              <div key={log.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] leading-relaxed">
                <span className="text-neutral-500">{new Date(log.timestamp).toISOString()}</span>
                {' '}<span className="text-rose-400 font-bold">[{log.serviceName}]</span>
                {' '}<span className="text-emerald-400">{log.action}</span>: {log.details}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
