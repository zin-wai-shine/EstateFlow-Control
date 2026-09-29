// EstateFlow Control - GlassCard Component
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl p-5 ${hoverable ? 'glass-card-hover cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
