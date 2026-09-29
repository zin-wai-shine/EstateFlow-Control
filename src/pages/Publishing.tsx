// EstateFlow Control - Multi-Channel Publishing & Approvals (Normal Case, Clean)
import React, { useState } from 'react';
import { 
  FiSend, 
  FiExternalLink, 
  FiCheck, 
  FiShield,
  FiPlus
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PublishingChannel, PublishingRecord } from '../types';
import { publishingService } from '../services/publishingService';
import { db } from '../services/storage';

export const Publishing: React.FC = () => {
  const { properties, addNotification } = useApp();
  const [publishingRecords, setPublishingRecords] = useState<PublishingRecord[]>(db.getPublishingRecords());
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');

  const handleApprove = async (record: PublishingRecord) => {
    await publishingService.approvePublishing(record.id);
    setPublishingRecords([...db.getPublishingRecords()]);
    addNotification('success', 'Listing Approved', `Approved for ${record.channel.replace('_', ' ')}`);
  };

  const handlePublish = async (record: PublishingRecord) => {
    try {
      await publishingService.executePublish(record.id);
      setPublishingRecords([...db.getPublishingRecords()]);
      addNotification('success', 'Listing Published', `Published to ${record.channel}`);
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

  const formatChannelName = (ch: string) => {
    if (ch === 'facebook_marketplace') return 'Facebook Marketplace';
    if (ch === 'facebook_page') return 'Facebook Page';
    if (ch === 'tiktok') return 'TikTok';
    return ch.replace('_', ' ');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Publishing Gateway & Approvals
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Stage, verify, and authorize listings for Facebook Marketplace, Business Pages, and TikTok.
          </p>
        </div>

        {/* Security Approval Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-medium">
          <FiShield className="w-3.5 h-3.5 shrink-0" />
          <span>Manual Approval Mode Active</span>
        </div>
      </div>

      {/* Quick Add Channel Section */}
      <div className="glass-panel p-4 rounded-xl border border-neutral-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Target Property:
          </span>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="px-3 py-1 rounded-lg glass-input text-xs font-medium dark:bg-neutral-900 cursor-pointer"
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQueueChannel('facebook_marketplace')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-xs font-medium transition-colors cursor-pointer"
          >
            <FiPlus className="w-3.5 h-3.5 text-rose-500" />
            <span>Facebook Marketplace</span>
          </button>
          <button
            onClick={() => handleQueueChannel('facebook_page')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-xs font-medium transition-colors cursor-pointer"
          >
            <FiPlus className="w-3.5 h-3.5 text-rose-500" />
            <span>Facebook Page</span>
          </button>
          <button
            onClick={() => handleQueueChannel('tiktok')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-xs font-medium transition-colors cursor-pointer"
          >
            <FiPlus className="w-3.5 h-3.5 text-rose-500" />
            <span>TikTok</span>
          </button>
        </div>
      </div>

      {/* Publishing Records List */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          Staged Listings Queue ({publishingRecords.length})
        </h2>

        {publishingRecords.length === 0 ? (
          <div className="p-6 text-center glass-panel rounded-xl text-xs text-neutral-400">
            No listings currently queued for publishing.
          </div>
        ) : (
          <div className="space-y-2.5">
            {publishingRecords.map((record) => {
              const property = properties.find(p => p.id === record.propertyId);
              return (
                <div
                  key={record.id}
                  className="glass-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                        {property?.projectName || 'Property'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                        {formatChannelName(record.channel)}
                      </span>
                      <StatusBadge status={record.status} size="sm" />
                    </div>

                    <div className="text-xs text-neutral-400">
                      {record.status === 'published' ? (
                        <span className="text-emerald-500 font-medium">
                          Published on {new Date(record.publishedAt || '').toLocaleString()}
                        </span>
                      ) : record.requiresManualApproval && !record.isApproved ? (
                        <span className="text-amber-500 font-medium">
                          Awaiting confirmation before browser dispatch
                        </span>
                      ) : (
                        <span>Ready to transmit to browser session</span>
                      )}
                    </div>

                    {record.publishedUrl && (
                      <div className="text-xs pt-0.5">
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
                  <div className="flex items-center gap-2">
                    {record.status === 'pending_approval' && !record.isApproved && (
                      <button
                        onClick={() => handleApprove(record)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {(record.status === 'ready' || record.isApproved) && record.status !== 'published' && (
                      <button
                        onClick={() => handlePublish(record)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg btn-primary-red text-xs font-medium cursor-pointer"
                      >
                        <FiSend className="w-3.5 h-3.5" />
                        <span>Publish</span>
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
