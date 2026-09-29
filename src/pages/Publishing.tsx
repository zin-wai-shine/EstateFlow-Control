// EstateFlow Control - Multi-Channel Publishing & Approvals (Section 41, 42, 43)
import React, { useState } from 'react';
import { 
  FiSend, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiExternalLink, 
  FiCheck, 
  FiClock, 
  FiShield,
  FiPlus
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { GlassCard } from '../components/common/GlassCard';
import { PublishingChannel, PublishingRecord } from '../types';
import { publishingService } from '../services/publishingService';
import { db } from '../services/storage';

export const Publishing: React.FC = () => {
  const { properties, addNotification, refreshProperties } = useApp();
  const [publishingRecords, setPublishingRecords] = useState<PublishingRecord[]>(db.getPublishingRecords());
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');

  const handleApprove = async (record: PublishingRecord) => {
    await publishingService.approvePublishing(record.id);
    setPublishingRecords([...db.getPublishingRecords()]);
    addNotification('success', 'Listing Approved', `Approved for ${record.channel.replace('_', ' ').toUpperCase()}`);
  };

  const handlePublish = async (record: PublishingRecord) => {
    try {
      await publishingService.executePublish(record.id);
      setPublishingRecords([...db.getPublishingRecords()]);
      addNotification('success', 'Listing Published', `Published successfully to ${record.channel}`);
    } catch (e: any) {
      addNotification('error', 'Publish Failed', e?.message || 'Error executing publishing workflow');
    }
  };

  const handleQueueChannel = async (channel: PublishingChannel) => {
    if (!selectedPropertyId) return;
    await publishingService.createChannelRecord(selectedPropertyId, channel);
    setPublishingRecords([...db.getPublishingRecords()]);
    addNotification('info', 'Channel Queued', `Prepared ${channel.replace('_', ' ')} draft.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Publishing Gateway & Approvals
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Stage, verify, and authorize listings for Facebook Marketplace, Business Pages, and TikTok.
          </p>
        </div>

        {/* Security Approval Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <FiShield className="w-4 h-4 shrink-0" />
          <span>Manual Approval Mode Active (Zero Unauthorized Posts)</span>
        </div>
      </div>

      {/* Quick Add Channel Section */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Target Property:
          </span>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-xs font-bold dark:bg-neutral-900"
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQueueChannel('facebook_marketplace')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-xs font-bold transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5 text-rose-500" />
            <span>+ Facebook Marketplace</span>
          </button>
          <button
            onClick={() => handleQueueChannel('facebook_page')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-xs font-bold transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5 text-rose-500" />
            <span>+ Facebook Page</span>
          </button>
          <button
            onClick={() => handleQueueChannel('tiktok')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-xs font-bold transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5 text-rose-500" />
            <span>+ TikTok</span>
          </button>
        </div>
      </div>

      {/* Publishing Records List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Staged Listings Queue ({publishingRecords.length})
        </h2>

        {publishingRecords.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl text-xs text-neutral-400">
            No listings currently queued for publishing.
          </div>
        ) : (
          <div className="space-y-3">
            {publishingRecords.map((record) => {
              const property = properties.find(p => p.id === record.propertyId);
              return (
                <div
                  key={record.id}
                  className="glass-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                        {property?.projectName || 'Property'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 uppercase font-mono font-bold">
                        {record.channel.replace('_', ' ')}
                      </span>
                      <StatusBadge status={record.status} size="sm" />
                    </div>

                    <div className="text-xs text-neutral-400">
                      {record.status === 'published' ? (
                        <span className="text-emerald-400 font-medium">
                          Published on {new Date(record.publishedAt || '').toLocaleString()}
                        </span>
                      ) : record.requiresManualApproval && !record.isApproved ? (
                        <span className="text-amber-400 font-medium">
                          Awaiting Operator Confirmation before browser dispatch
                        </span>
                      ) : (
                        <span>Ready to transmit to browser session</span>
                      )}
                    </div>

                    {record.publishedUrl && (
                      <div className="text-xs pt-1">
                        <a
                          href={record.publishedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rose-500 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span>{record.publishedUrl}</span>
                          <FiExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {record.status === 'pending_approval' && !record.isApproved && (
                      <button
                        onClick={() => handleApprove(record)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase transition-all shadow-md shadow-emerald-900/20"
                      >
                        <FiCheck className="w-4 h-4" />
                        <span>Approve Listing</span>
                      </button>
                    )}

                    {(record.status === 'ready' || record.isApproved) && record.status !== 'published' && (
                      <button
                        onClick={() => handlePublish(record)}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl btn-primary-red text-xs font-bold uppercase transition-all shadow-lg shadow-rose-600/30"
                      >
                        <FiSend className="w-3.5 h-3.5" />
                        <span>Execute Publish</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
