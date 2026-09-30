// EstateFlow Control - Simplified Browser Accounts & Workers Management
import React, { useState } from 'react';
import { 
  FiPlus, 
  FiExternalLink, 
  FiRefreshCw, 
  FiEdit2, 
  FiTrash2, 
  FiCheckCircle, 
  FiCpu, 
  FiEye, 
  FiChevronDown, 
  FiChevronUp,
  FiTag,
  FiSliders,
  FiCheck,
  FiGlobe,
  FiLayers
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { GlassModal } from '../components/common/GlassModal';
import { AppDropdown } from '../components/common/AppDropdown';
import { AddBrowserModal } from '../components/browser/AddBrowserModal';
import { TabManagerModal } from '../components/browser/TabManagerModal';
import { ChromeProfile, AutomationWorker } from '../types';
import { openclawClient } from '../services/openclawClient';
import { db } from '../services/storage';

const PURPOSE_OPTIONS = [
  { value: 'general', label: 'General / Multi-purpose' },
  { value: 'enhancement', label: 'Image Enhancement' },
  { value: 'hero', label: 'Hero Generation' },
  { value: 'content', label: 'Prompt & Content Generation' },
  { value: 'publishing', label: 'Social & Marketplace Publishing' },
];

export const BrowserWorkers: React.FC = () => {
  const { profiles, workers, refreshProfiles, refreshWorkers, processes, addNotification } = useApp();

  // Modals state
  const [isAddBrowserOpen, setIsAddBrowserOpen] = useState(false);
  const [tabManagingProfile, setTabManagingProfile] = useState<ChromeProfile | null>(null);
  const [renamingProfile, setRenamingProfile] = useState<ChromeProfile | null>(null);
  const [newFriendlyName, setNewFriendlyName] = useState('');
  const [newLoginUrl, setNewLoginUrl] = useState('');
  
  const [purposeProfile, setPurposeProfile] = useState<ChromeProfile | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<string>('general');

  const [deletingProfile, setDeletingProfile] = useState<ChromeProfile | null>(null);
  const [deleteDataToo, setDeleteDataToo] = useState(false);

  const [advancedProfile, setAdvancedProfile] = useState<ChromeProfile | null>(null);

  // Collapsible Workers section
  const [showWorkersSection, setShowWorkersSection] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<AutomationWorker | null>(workers[0] || null);
  const [checkingProfileId, setCheckingProfileId] = useState<string | null>(null);

  // Find processes that use a browser profile
  const getProcessesForProfile = (profileId: string) => {
    return processes.filter(p => {
      return p.steps.some(s => s.profileId === profileId);
    });
  };

  const handleOpenBrowser = async (profile: ChromeProfile) => {
    try {
      const res = await openclawClient.openNativeChromeProfile(profile);
      addNotification('info', 'Chrome Profile Launched', res.message);
      refreshProfiles();
    } catch (e: any) {
      addNotification('error', 'Launch Failed', e?.message || 'Could not launch Chrome.');
    }
  };

  const handleCheckSession = async (profile: ChromeProfile) => {
    setCheckingProfileId(profile.id);
    await new Promise(r => setTimeout(r, 400));
    try {
      const status = await openclawClient.checkSessionHealth(profile.id);
      refreshProfiles();
      addNotification('success', 'Session Checked', `"${profile.friendlyName}" status: ${status === 'ready' ? 'Ready' : 'Login Required'}`);
    } catch (e: any) {
      addNotification('error', 'Check Failed', e?.message || 'Could not verify session.');
    } finally {
      setCheckingProfileId(null);
    }
  };

  const handleTestConnection = async () => {
    const res = await openclawClient.testConnection();
    if (res.success) {
      addNotification('success', 'OpenClaw Connected', res.message);
    } else {
      addNotification('error', 'Connection Warning', res.message);
    }
  };

  // Rename Profile
  const openRenameModal = (profile: ChromeProfile) => {
    setRenamingProfile(profile);
    setNewFriendlyName(profile.friendlyName);
    setNewLoginUrl(profile.loginUrl || 'https://chatgpt.com');
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingProfile || !newFriendlyName.trim()) return;

    const updated = {
      ...renamingProfile,
      friendlyName: newFriendlyName.trim(),
      loginUrl: newLoginUrl.trim() || renamingProfile.loginUrl || 'https://chatgpt.com',
      lastActiveAt: new Date().toISOString()
    };
    db.saveProfile(updated);

    // Also update profileFriendlyName on associated workers
    workers.forEach(w => {
      if (w.profileId === renamingProfile.id) {
        w.profileFriendlyName = updated.friendlyName;
        db.saveWorker(w);
      }
    });

    refreshProfiles();
    refreshWorkers();
    addNotification('success', 'Browser Renamed', `Renamed to "${updated.friendlyName}". Login sessions preserved.`);
    setRenamingProfile(null);
  };

  // Assign Purpose
  const openPurposeModal = (profile: ChromeProfile) => {
    setPurposeProfile(profile);
    setSelectedPurpose(profile.purpose || 'general');
  };

  const handleSavePurpose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purposeProfile) return;

    const updated: ChromeProfile = {
      ...purposeProfile,
      purpose: selectedPurpose as any,
      lastActiveAt: new Date().toISOString()
    };
    db.saveProfile(updated);
    refreshProfiles();
    addNotification('success', 'Purpose Assigned', `Assigned purpose for "${updated.friendlyName}".`);
    setPurposeProfile(null);
  };

  // Remove Profile
  const openDeleteModal = (profile: ChromeProfile) => {
    setDeletingProfile(profile);
    setDeleteDataToo(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingProfile) return;

    // Delete workers associated with this profile
    const associatedWorkers = workers.filter(w => w.profileId === deletingProfile.id);
    associatedWorkers.forEach(w => db.deleteWorker(w.id));

    // Delete profile record
    db.deleteProfile(deletingProfile.id);

    refreshProfiles();
    refreshWorkers();

    addNotification(
      'info', 
      'Browser Removed', 
      `Removed "${deletingProfile.friendlyName}" from EstateFlow Control${deleteDataToo ? ' and purged local profile data.' : '.'}`
    );
    setDeletingProfile(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Browsers
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Dedicated Chrome sessions with persistent logins for AI enhancement and social publishing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTestConnection}
            className="btn-secondary"
          >
            <FiRefreshCw className="w-3.5 h-3.5 text-rose-500" />
            <span>Test OpenClaw Bridge</span>
          </button>

          <button
            onClick={() => setIsAddBrowserOpen(true)}
            className="btn-primary-red"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Add Browser</span>
          </button>
        </div>
      </div>

      {/* Main Browsers Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            Active Browsers ({profiles.length})
          </h2>
          <span className="text-[11px] text-neutral-400">
            Each browser operates in an independent macOS Chrome profile
          </span>
        </div>

        {profiles.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-panel border border-neutral-200 dark:border-neutral-800 text-neutral-400 space-y-3">
            <p className="text-xs">No browsers configured yet.</p>
            <button
              onClick={() => setIsAddBrowserOpen(true)}
              className="btn-primary-red text-xs py-1 px-3"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>Add Your First Browser</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((prof) => {
              const usedProcesses = getProcessesForProfile(prof.id);
              const isCheckingThis = checkingProfileId === prof.id;

              return (
                <div
                  key={prof.id}
                  className="glass-panel p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between gap-4 transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                >
                  {/* Top: Name, Status & Purpose */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate" title={prof.friendlyName}>
                          {prof.friendlyName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 capitalize font-medium">
                            {prof.purpose ? prof.purpose.replace(/_/g, ' ') : 'General'}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            • {prof.assignedWorkerCount} worker
                          </span>
                        </div>
                      </div>

                      <StatusBadge status={prof.chatGptSessionStatus || 'ready'} size="sm" />
                    </div>

                    {/* Login Website Indicator */}
                    {prof.loginUrl && (
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
                        <FiGlobe className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 shrink-0">
                          {prof.loginService || 'Target'}:
                        </span>
                        <span className="truncate text-neutral-500 dark:text-neutral-400 font-mono text-[10.5px]" title={prof.loginUrl}>
                          {prof.loginUrl}
                        </span>
                      </div>
                    )}

                    {/* Process assignment indicator */}
                    {usedProcesses.length > 0 && (
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 flex items-center gap-1">
                        <span className="text-neutral-400">Used in:</span>
                        <span className="font-medium text-rose-500 truncate">
                          {usedProcesses.map(p => p.name).join(', ')}
                        </span>
                      </div>
                    )}
                    {/* Saved & Active Tabs Status */}
                    {(() => {
                      const profileTabs = db.getSavedTabs(prof.id);
                      const busyTabs = profileTabs.filter(t => t.status === 'busy');
                      return (
                        <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                              {busyTabs.length > 0 ? (
                                <span className="text-blue-500 font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  Active Tabs ({busyTabs.length} Busy)
                                </span>
                              ) : (
                                <span>Saved Tabs ({profileTabs.length})</span>
                              )}
                            </span>
                            <button
                              onClick={() => setTabManagingProfile(prof)}
                              className="text-[10px] text-red-500 font-semibold hover:underline"
                            >
                              Configure
                            </button>
                          </div>

                          <div className="space-y-1">
                            {profileTabs.length === 0 ? (
                              <div className="text-[10.5px] text-neutral-400 italic">
                                No tabs attached yet. Click "Manage Tabs" to link ChatGPT tabs.
                              </div>
                            ) : (
                              profileTabs.slice(0, 3).map(tab => (
                                <div 
                                  key={tab.id} 
                                  className={`flex items-center justify-between text-[11px] px-2 py-1 rounded-lg ${
                                    tab.status === 'busy' 
                                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400' 
                                      : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                                  }`}
                                >
                                  <span className="font-medium truncate max-w-[140px]">{tab.friendlyName}</span>
                                  {tab.status === 'busy' ? (
                                    <span className="text-[10px] font-semibold truncate max-w-[130px]">
                                      {tab.currentAction || 'Generating'} {tab.activeImageName ? `• ${tab.activeImageName}` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-neutral-400 capitalize">{tab.status}</span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions & Toolbar */}
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenBrowser(prof)}
                        className="btn-primary-red text-xs py-1 px-2.5 flex items-center gap-1.5"
                      >
                        <FiExternalLink className="w-3 h-3" />
                        <span>Open Browser</span>
                      </button>

                      <button
                        onClick={() => setTabManagingProfile(prof)}
                        className="px-2.5 py-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <FiLayers className="w-3 h-3 text-red-500" />
                        <span>Manage Tabs</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCheckSession(prof)}
                        title="Check Session Health"
                        disabled={isCheckingThis}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <FiCheckCircle className={`w-3.5 h-3.5 ${isCheckingThis ? 'animate-spin text-rose-500' : ''}`} />
                      </button>

                      <button
                        onClick={() => openRenameModal(prof)}
                        title="Rename Browser"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => openDeleteModal(prof)}
                        title="Remove Browser"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Secondary Toggle: Technical Workers & DOM Telemetry */}
      <div className="pt-2">
        <button
          onClick={() => setShowWorkersSection(prev => !prev)}
          className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 font-medium flex items-center gap-1.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <FiCpu className="w-3.5 h-3.5 text-neutral-400" />
          <span>{showWorkersSection ? 'Hide Technical Workers & Telemetry' : 'Show Advanced Workers & Telemetry'}</span>
          {showWorkersSection ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
        </button>

        {showWorkersSection && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-3 animate-in fade-in duration-200">
            {/* Workers List (2 cols) */}
            <div className="lg:col-span-2 space-y-2.5">
              <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Active Automation Worker Tabs ({workers.length})
              </h3>

              <div className="space-y-2">
                {workers.map((w) => {
                  const isSelected = selectedWorker?.id === w.id;
                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWorker(w)}
                      className={`glass-card p-3 rounded-xl cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
                        isSelected 
                          ? 'border-rose-500/50 bg-rose-500/5 dark:bg-rose-500/10' 
                          : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                          <FiCpu className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                              {w.name}
                            </span>
                            <StatusBadge status={w.status} size="sm" />
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                              {w.profileFriendlyName}
                            </span>
                          </div>

                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {w.status === 'busy' ? (
                              <span className="text-amber-500 font-medium">
                                Task: {w.currentTaskDescription || 'Executing'}
                              </span>
                            ) : (
                              'Awaiting job dispatch'
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="text-right">
                          <div className="font-medium text-neutral-700 dark:text-neutral-300">
                            {w.totalJobsProcessed} jobs
                          </div>
                          <div className="text-[10px] text-emerald-500">
                            {w.successRate}% rate
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Telemetry Preview (1 col) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <FiEye className="text-rose-500" />
                <span>Worker Snapshot Preview</span>
              </h3>

              {selectedWorker ? (
                <div className="glass-panel p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                      <h4 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                        {selectedWorker.name}
                      </h4>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {selectedWorker.id}
                      </span>
                    </div>
                    <StatusBadge status={selectedWorker.status} size="sm" />
                  </div>

                  <div className="h-36 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-200 dark:border-neutral-800 relative">
                    <img
                      src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"
                      alt="Worker DOM Preview"
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded bg-black/80 text-[10px] text-neutral-200 truncate">
                      {selectedWorker.lastAction || 'Worker ready'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center glass-panel rounded-xl text-xs text-neutral-400">
                  Select a worker above to inspect snapshot.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* ADD BROWSER MODAL (SIMPLIFIED)                           */}
      {/* ======================================================== */}
      <AddBrowserModal
        isOpen={isAddBrowserOpen}
        onClose={() => setIsAddBrowserOpen(false)}
        onSuccess={() => {
          refreshProfiles();
          refreshWorkers();
        }}
      />

      {/* ======================================================== */}
      {/* RENAME BROWSER MODAL                                     */}
      {/* ======================================================== */}
      {renamingProfile && (
        <GlassModal
          isOpen={Boolean(renamingProfile)}
          onClose={() => setRenamingProfile(null)}
          title="Rename Browser"
          subtitle="Change the display name without affecting login session."
          maxWidth="sm"
        >
          <form onSubmit={handleSaveRename} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Browser Name
              </label>
              <input
                type="text"
                value={newFriendlyName}
                onChange={(e) => setNewFriendlyName(e.target.value)}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Login Website URL
              </label>
              <input
                type="url"
                value={newLoginUrl}
                onChange={(e) => setNewLoginUrl(e.target.value)}
                placeholder="https://chatgpt.com"
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg font-mono"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setRenamingProfile(null)}
                className="btn-secondary text-xs py-1 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary-red text-xs py-1 px-3 flex items-center gap-1"
              >
                <FiCheck className="w-3.5 h-3.5" />
                <span>Save Name</span>
              </button>
            </div>
          </form>
        </GlassModal>
      )}

      {/* ======================================================== */}
      {/* ASSIGN PURPOSE MODAL                                     */}
      {/* ======================================================== */}
      {purposeProfile && (
        <GlassModal
          isOpen={Boolean(purposeProfile)}
          onClose={() => setPurposeProfile(null)}
          title="Assign Purpose"
          subtitle={`Set designated workflow category for "${purposeProfile.friendlyName}".`}
          maxWidth="sm"
        >
          <form onSubmit={handleSavePurpose} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Workflow Purpose
              </label>
              <AppDropdown
                options={PURPOSE_OPTIONS}
                value={selectedPurpose}
                onChange={setSelectedPurpose}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setPurposeProfile(null)}
                className="btn-secondary text-xs py-1 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary-red text-xs py-1 px-3 flex items-center gap-1"
              >
                <FiCheck className="w-3.5 h-3.5" />
                <span>Save Purpose</span>
              </button>
            </div>
          </form>
        </GlassModal>
      )}

      {/* ======================================================== */}
      {/* ADVANCED DETAILS MODAL                                   */}
      {/* ======================================================== */}
      {advancedProfile && (
        <GlassModal
          isOpen={Boolean(advancedProfile)}
          onClose={() => setAdvancedProfile(null)}
          title={`Advanced: ${advancedProfile.friendlyName}`}
          subtitle="Internal identifiers and Chrome directory details."
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Internal ID:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">{advancedProfile.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Profile Directory:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">{advancedProfile.profileDirName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Assigned Workers:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">{advancedProfile.assignedWorkerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Session Status:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">{advancedProfile.chatGptSessionStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Login Website:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200 truncate max-w-xs">{advancedProfile.loginUrl || 'Default'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Last Active:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">{advancedProfile.lastActiveAt || 'Never'}</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAdvancedProfile(null)}
                className="btn-secondary text-xs py-1 px-3"
              >
                Close
              </button>
            </div>
          </div>
        </GlassModal>
      )}

      {/* ======================================================== */}
      {/* REMOVE BROWSER MODAL                                     */}
      {/* ======================================================== */}
      {deletingProfile && (
        <GlassModal
          isOpen={Boolean(deletingProfile)}
          onClose={() => setDeletingProfile(null)}
          title="Remove Browser"
          subtitle={`Are you sure you want to remove "${deletingProfile.friendlyName}"?`}
          maxWidth="sm"
        >
          <div className="space-y-3.5">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Removing this browser will detach its workers and associated process connections.
            </p>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={deleteDataToo}
                onChange={(e) => setDeleteDataToo(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-rose-600"
              />
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                Remove browser profile data too (clears logins)
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setDeletingProfile(null)}
                className="btn-secondary text-xs py-1 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn-primary-red text-xs py-1 px-3"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </GlassModal>
      )}

      {/* Tab Manager Modal */}
      <TabManagerModal
        isOpen={Boolean(tabManagingProfile)}
        profile={tabManagingProfile}
        onClose={() => setTabManagingProfile(null)}
        onUpdate={refreshProfiles}
      />
    </div>
  );
};
