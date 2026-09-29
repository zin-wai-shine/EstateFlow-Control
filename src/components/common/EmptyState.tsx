// EstateFlow Control - EmptyState Component
import React from 'react';
import { IconType } from 'react-icons';
import { FiPlus, FiInbox } from 'react-icons/fi';

interface EmptyStateProps {
  icon?: IconType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: IconType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FiInbox,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = FiPlus
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-3xl border border-dashed border-neutral-300/70 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
      <div className="p-4 rounded-2xl bg-neutral-200/60 dark:bg-white/5 border border-neutral-300/40 dark:border-white/10 text-neutral-400 dark:text-neutral-500 mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200 mb-1">
        {title}
      </h3>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl btn-primary-red text-sm font-semibold shadow-lg shadow-rose-900/20 active:scale-95 transition-all"
        >
          <ActionIcon className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
