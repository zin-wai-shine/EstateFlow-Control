// EstateFlow Control - Sidebar Component
import React from 'react';
import { 
  FiGrid, 
  FiHome, 
  FiCpu, 
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
    workers 
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

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
    { id: 'properties', label: 'Properties', icon: FiHome, badge: properties.length },
    { id: 'automation', label: 'Automation Center', icon: FiCpu },
    { id: 'browser_workers', label: 'Browser Workers', icon: FiLayers, badge: busyWorkersCount > 0 ? busyWorkersCount : undefined },
    { id: 'content_studio', label: 'Content Studio', icon: FiEdit3 },
    { id: 'publishing', label: 'Publishing', icon: FiSend },
    { id: 'jobs', label: 'Jobs Queue', icon: FiList, badge: activeJobsCount > 0 ? activeJobsCount : undefined },
    { id: 'activity', label: 'Activity Log', icon: FiActivity },
    { id: 'health', label: 'System Health', icon: FiHeart },
    { id: 'settings', label: 'Settings', icon: FiSettings }
  ];

  return (
    <aside 
      className={`glass-sidebar flex flex-col justify-between transition-all duration-300 select-none z-20 shrink-0 ${isCollapsed ? 'w-18' : 'w-64'}`}
    >
      {/* Top Nav Items */}
      <div className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id || (item.id === 'properties' && activePage === 'property_detail');

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              
              {!isCollapsed && (
                <span className="flex-1 text-left tracking-tight truncate">
                  {item.label}
                </span>
              )}

              {!isCollapsed && item.badge !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-300'
                }`}>
                  {item.badge}
                </span>
              )}

              {isCollapsed && item.badge !== undefined && (
                <span className="absolute right-2 top-2 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: Collapse Button */}
      <div className="p-3 border-t border-neutral-200/50 dark:border-white/10">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/5 transition-all text-xs font-semibold"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <FiChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center justify-between w-full px-2">
              <span className="text-neutral-500 text-[11px] font-medium">Collapse Menu</span>
              <FiChevronLeft className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
