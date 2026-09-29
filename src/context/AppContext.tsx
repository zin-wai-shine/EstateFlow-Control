// EstateFlow Control - Global Application Context
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, 
  ThemeMode, 
  Property, 
  PropertyImage, 
  AutomationWorker, 
  ChromeProfile, 
  AutomationJob, 
  AppSettings, 
  NotificationToastItem,
  SystemHealthStatus
} from '../types';
import { db, INITIAL_USER } from '../services/storage';
import { automationEngine } from '../services/automationEngine';
import { systemHealthService } from '../services/systemHealth';

export type NavigationPage = 
  | 'dashboard'
  | 'properties'
  | 'property_detail'
  | 'automation'
  | 'browser_workers'
  | 'content_studio'
  | 'publishing'
  | 'jobs'
  | 'activity'
  | 'health'
  | 'settings';

interface AppContextType {
  // Auth
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;

  // Navigation
  activePage: NavigationPage;
  setActivePage: (page: NavigationPage) => void;
  selectedPropertyId: string | null;
  openPropertyDetail: (propertyId: string) => void;

  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Data
  properties: Property[];
  refreshProperties: () => void;
  workers: AutomationWorker[];
  refreshWorkers: () => void;
  profiles: ChromeProfile[];
  refreshProfiles: () => void;
  jobs: AutomationJob[];
  refreshJobs: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  health: SystemHealthStatus | null;
  refreshHealth: () => void;

  // Search & Global filter
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;

  // Modals
  isCreatePropertyOpen: boolean;
  openCreateProperty: () => void;
  closeCreateProperty: () => void;
  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;

  // Notifications
  notifications: NotificationToastItem[];
  addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  dismissNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('estateflow_auth_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  // Navigation state
  const [activePage, setActivePage] = useState<NavigationPage>('dashboard');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Theme state
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('estateflow_theme') as ThemeMode) || 'dark';
  });

  // Data states
  const [properties, setProperties] = useState<Property[]>([]);
  const [workers, setWorkers] = useState<AutomationWorker[]>([]);
  const [profiles, setProfiles] = useState<ChromeProfile[]>([]);
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);

  // Search
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Modals
  const [isCreatePropertyOpen, setIsCreatePropertyOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationToastItem[]>([]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System mode
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    localStorage.setItem('estateflow_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    const updatedSettings = { ...settings, appearance: { ...settings.appearance, theme: newTheme } };
    setSettings(updatedSettings);
    db.saveSettings(updatedSettings);
  };

  const refreshProperties = useCallback(() => {
    setProperties([...db.getProperties()]);
  }, []);

  const refreshWorkers = useCallback(() => {
    setWorkers([...db.getWorkers()]);
  }, []);

  const refreshProfiles = useCallback(() => {
    setProfiles([...db.getProfiles()]);
  }, []);

  const refreshJobs = useCallback(() => {
    setJobs([...db.getJobs()]);
  }, []);

  const refreshHealth = useCallback(async () => {
    const data = await systemHealthService.getHealth();
    setHealth(data);
  }, []);

  // Initial load
  useEffect(() => {
    refreshProperties();
    refreshWorkers();
    refreshProfiles();
    refreshJobs();
    refreshHealth();

    // Subscribe to automation events
    const unsubJob = automationEngine.onJobUpdate(() => {
      refreshJobs();
      refreshProperties();
      refreshHealth();
    });

    const unsubWorker = automationEngine.onWorkerUpdate(newWorkers => {
      setWorkers([...newWorkers]);
      refreshHealth();
    });

    return () => {
      unsubJob();
      unsubWorker();
    };
  }, [refreshProperties, refreshWorkers, refreshProfiles, refreshJobs, refreshHealth]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    // In desktop local mode, accept configured local login
    if (email && pass) {
      const loggedInUser: User = {
        id: 'usr-admin-1',
        email,
        name: email.split('@')[0].toUpperCase(),
        role: 'administrator',
        createdAt: new Date().toISOString()
      };
      setUser(loggedInUser);
      localStorage.setItem('estateflow_auth_user', JSON.stringify(loggedInUser));
      addNotification('success', 'Authentication Successful', `Welcome back to EstateFlow Control, ${loggedInUser.name}`);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('estateflow_auth_user');
    addNotification('info', 'Session Ended', 'You have been signed out safely.');
  };

  const openPropertyDetail = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setActivePage('property_detail');
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    db.saveSettings(newSettings);
    addNotification('success', 'Settings Saved', 'System configurations updated.');
  };

  const addNotification = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    const item: NotificationToastItem = { id, type, title, message, timestamp: Date.now() };
    setNotifications(prev => [item, ...prev.slice(0, 4)]);

    setTimeout(() => {
      dismissNotification(id);
    }, 4500);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const openCreateProperty = () => setIsCreatePropertyOpen(true);
  const closeCreateProperty = () => setIsCreatePropertyOpen(false);

  const openOnboarding = () => setIsOnboardingOpen(true);
  const closeOnboarding = () => setIsOnboardingOpen(false);

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        activePage,
        setActivePage,
        selectedPropertyId,
        openPropertyDetail,
        theme,
        setTheme,
        properties,
        refreshProperties,
        workers,
        refreshWorkers,
        profiles,
        refreshProfiles,
        jobs,
        refreshJobs,
        settings,
        updateSettings,
        health,
        refreshHealth,
        globalSearchQuery,
        setGlobalSearchQuery,
        isCreatePropertyOpen,
        openCreateProperty,
        closeCreateProperty,
        isOnboardingOpen,
        openOnboarding,
        closeOnboarding,
        notifications,
        addNotification,
        dismissNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
