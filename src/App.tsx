// EstateFlow Control - Main Application Component
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { PropertyDetail } from './pages/PropertyDetail';
import { AutomationCenter } from './pages/AutomationCenter';
import { Processes } from './pages/Processes';
import { ProcessBuilder } from './pages/ProcessBuilder';
import { ProcessRunModal } from './pages/ProcessRunModal';
import { BrowserWorkers } from './pages/BrowserWorkers';
import { PropertiesLink } from './pages/PropertiesLink';
import { ContentStudio } from './pages/ContentStudio';
import { Publishing } from './pages/Publishing';
import { JobsQueue } from './pages/JobsQueue';
import { ActivityHistory } from './pages/ActivityHistory';
import { SystemHealth } from './pages/SystemHealth';
import { Settings } from './pages/Settings';
import { PropertyFormModal } from './pages/PropertyFormModal';
import { OnboardingModal } from './pages/OnboardingModal';

const AppContent: React.FC = () => {
  const { 
    user, 
    activePage, 
    isCreatePropertyOpen, 
    closeCreateProperty 
  } = useApp();

  if (!user) {
    return <Login />;
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'properties':
        return <Properties />;
      case 'property_detail':
        return <PropertyDetail />;
      case 'automation':
        return <AutomationCenter />;
      case 'processes':
        return <Processes />;
      case 'process_builder':
        return <ProcessBuilder />;
      case 'browser_workers':
        return <BrowserWorkers />;
      case 'properties_link':
        return <PropertiesLink />;
      case 'content_studio':
        return <ContentStudio />;
      case 'publishing':
        return <Publishing />;
      case 'jobs':
        return <JobsQueue />;
      case 'activity':
        return <ActivityHistory />;
      case 'health':
        return <SystemHealth />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderActivePage()}
      <PropertyFormModal 
        isOpen={isCreatePropertyOpen} 
        onClose={closeCreateProperty} 
      />
      <ProcessRunModal />
      <OnboardingModal />
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
