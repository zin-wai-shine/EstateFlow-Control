// EstateFlow Control - Main App Layout
import React from 'react';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';
import { NotificationToastStack } from '../common/NotificationToast';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
      <TopNavbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative p-6 bg-gradient-to-b from-transparent to-black/[0.02] dark:to-black/30">
          <div className="max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-150">
            {children}
          </div>
        </main>
      </div>
      <NotificationToastStack />
    </div>
  );
};
