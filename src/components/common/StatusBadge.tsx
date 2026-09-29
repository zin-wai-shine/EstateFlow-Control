// EstateFlow Control - StatusBadge Component (Normal Case, Calm Colors, Zero Emoji)
import React from 'react';
import { 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiAlertTriangle, 
  FiRefreshCw, 
  FiArchive, 
  FiTag, 
  FiLayers 
} from 'react-icons/fi';
import { PropertyStatus, ImageStatus, WorkerStatus, JobStatus, PublishingStatus } from '../../types';

interface StatusBadgeProps {
  status: PropertyStatus | ImageStatus | WorkerStatus | JobStatus | PublishingStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  let label = status.replace(/_/g, ' ');
  label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

  let icon = <FiClock className="shrink-0" />;
  let colorClasses = 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';

  switch (status) {
    // Green / Success
    case 'available':
    case 'completed':
    case 'ready':
    case 'published':
    case 'healthy':
      icon = <FiCheckCircle className="shrink-0 text-emerald-500" />;
      colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      break;

    // Blue / Active / Running / Queued
    case 'running':
    case 'generating':
    case 'uploading':
    case 'downloading':
    case 'verifying':
    case 'publishing':
    case 'busy':
      icon = <FiRefreshCw className="shrink-0 text-blue-400 animate-spin" />;
      colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      break;

    case 'queued':
    case 'waiting':
    case 'pending':
    case 'pending_approval':
    case 'waiting_for_login':
      icon = <FiClock className="shrink-0 text-amber-400" />;
      colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      break;

    case 'open':
      icon = <FiCheckCircle className="shrink-0 text-blue-400" />;
      colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      break;

    // Amber / Warning / Retrying
    case 'retrying':
    case 'reserved':
    case 'needs_review':
      icon = <FiAlertTriangle className="shrink-0 text-amber-400" />;
      colorClasses = 'bg-amber-500/10 text-amber-300 border-amber-500/25';
      break;

    // Red / Error / Failed
    case 'failed':
    case 'error':
    case 'down':
    case 'login_required':
      icon = <FiAlertCircle className="shrink-0 text-rose-500" />;
      colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      break;

    case 'offline':
    case 'not_setup':
    case 'not_configured':
      icon = <FiAlertCircle className="shrink-0 text-neutral-400" />;
      colorClasses = 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
      break;

    // Muted purple
    case 'rented':
      icon = <FiTag className="shrink-0 text-purple-400" />;
      colorClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      break;

    case 'archived':
    case 'cancelled':
    case 'paused':
      icon = <FiArchive className="shrink-0 text-neutral-400" />;
      colorClasses = 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
      break;

    case 'draft':
      icon = <FiLayers className="shrink-0 text-neutral-400" />;
      colorClasses = 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20';
      break;
  }

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1.5' 
    : size === 'lg' 
      ? 'text-sm px-3 py-1 gap-2 font-medium' 
      : 'text-xs px-2.5 py-0.5 gap-1.5 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${sizeClasses} ${colorClasses} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
