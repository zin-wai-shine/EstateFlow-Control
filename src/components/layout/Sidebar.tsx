// EstateFlow Control - Sidebar Component (Spaced Gaps, Normal Casing)
import React from 'react';
import { 
  FiGrid, 
  FiHome, 
  FiCpu, 
  FiGitBranch,
  FiLayers, 
  FiEdit3, 
  FiSend, 
  FiList, 
  FiActivity, 
  FiHeart, 
  FiSettings,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { useApp, NavigationPage } from '../../context/AppContext';

interface NavItem {
  id: NavigationPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { 
    activePage, 
    setActivePage, 
    settings, 
    updateSettings, 
    properties, 
    jobs,
    workers,
    processRuns
  } = useApp();

  const isCollapsed = settings.appearance.sidebarCollapsed;

  const toggleCollapsed = () => {
    updateSettings({
      ...settings,
      appearance: {
        ...settings.appearance,
        sidebarCollapsed: !isCollapsed
      }
    });
  };

  const activeJobsCount = jobs.filter(j => j.status === 'running' || j.status === 'queued').length;
  const busyWorkersCount = workers.filter(w => w.status === 'busy').length;
  const activeRunsCount = processRuns.filter(r => r.status === 'running' || r.status === 'queued').length;

  const sections: { title?: string; items: NavItem[] }[] = [
    {
      title: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
        { id: 'properties', label: 'Properties', icon: FiHome, badge: properties.length }
      ]
    },
    {
      title: 'Automation',
      items: [
        { id: 'automation', label: 'Automation Center', icon: FiCpu },
        { id: 'processes', label: 'Processes', icon: FiGitBranch, badge: activeRunsCount > 0 ? activeRunsCount : undefined },
        { id: 'browser_workers', label: 'Browser Workers', icon: FiLayers, badge: busyWorkersCount > 0 ? busyWorkersCount : undefined }
      ]
    },
    {
      title: 'Content & Publishing',
      items: [
        { id: 'content_studio', label: 'Content Studio', icon: FiEdit3 },
        { id: 'publishing', label: 'Publishing', icon: FiSend },
        { id: 'jobs', label: 'Jobs Queue', icon: FiList, badge: activeJobsCount > 0 ? activeJobsCount : undefined }
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'activity', label: 'Activity Log', icon: FiActivity },
        { id: 'health', label: 'System Health', icon: FiHeart },
        { id: 'settings', label: 'Settings', icon: FiSettings }
      ]
    }
  ];

  return (
    <aside 
      className={`glass-sidebar flex flex-col justify-between transition-all duration-200 select-none z-20 shrink-0 ${isCollapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Top Nav Sections with comfortable gaps */}
      <div className="p-3 flex flex-col gap-4 overflow-y-auto">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="flex flex-col gap-1">
            {!isCollapsed && section.title && (
              <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                {section.title}
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id || 
                (item.id === 'properties' && activePage === 'property_detail') ||
                (item.id === 'processes' && activePage === 'process_builder');

              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full h-8.5 flex items-center gap-3 px-3 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/25'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-400'}`} />
                  
                  {!isCollapsed && (
                    <span className="flex-1 text-left truncate">
                      {item.label}
                    </span>
                  )}

                  {!isCollapsed && item.badge !== undefined && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                      isActive 
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' 
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {isCollapsed && item.badge !== undefined && (
                    <span className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom: Collapse Button */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={toggleCollapsed}
          className="w-full h-8 flex items-center justify-center p-2 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-xs font-medium cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <FiChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-neutral-500 text-xs">Collapse</span>
              <FiChevronLeft className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
