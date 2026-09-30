// EstateFlow Control - Browser Tab Manager Modal
// Manage persistent logical tabs for each saved browser profile & "Attach Current Tab"
import React, { useState, useEffect } from 'react';
import { 
  FiExternalLink, 
  FiRefreshCw, 
  FiEdit2, 
  FiTrash2, 
  FiPlus, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiX, 
  FiCompass, 
  FiLink, 
  FiLayers,
  FiClock,
  FiActivity
} from 'react-icons/fi';
import { ChromeProfile } from '../../types';
import { SavedTab, TabRuntimeStatus } from '../../types/pipeline';
import { db } from '../../services/storage';
import { openclawClient, DetectedBrowserTab } from '../../services/openclawClient';

interface TabManagerModalProps {
  isOpen: boolean;
  profile: ChromeProfile | null;
  onClose: () => void;
  onUpdate?: () => void;
}

export const TabManagerModal: React.FC<TabManagerModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdate
}) => {
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);
  const [detectedTabs, setDetectedTabs] = useState<DetectedBrowserTab[]>([]);
  const [isLoadingDetected, setIsLoadingDetected] = useState(false);
  const [selectedDetectedTab, setSelectedDetectedTab] = useState<DetectedBrowserTab | null>(null);
  
  // New tab form
  const [newTabName, setNewTabName] = useState('');
  const [newTabRole, setNewTabRole] = useState<'enhancement' | 'prompt' | 'hero' | 'tools' | 'publishing' | 'general'>('enhancement');
  
  // Editing tab state
  const [editingTab, setEditingTab] = useState<SavedTab | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  // Status message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const loadTabs = () => {
    if (!profile) return;
    const list = db.getSavedTabs(profile.id);
    setTabs(list);
  };

  useEffect(() => {
    if (isOpen && profile) {
      loadTabs();
      setFeedback(null);
      setIsAttaching(false);
      setSelectedDetectedTab(null);
    }
  }, [isOpen, profile]);

  if (!isOpen || !profile) return null;

  // Open/Focus tab in Chrome
  const handleFocusTab = async (tab: SavedTab) => {
    setFeedback({ type: 'info', message: `Focusing "${tab.friendlyName}" in Chrome...` });
    
    // First try rediscovering
    const check = await openclawClient.findTabForSavedTab(tab);
    if (check.found && check.tab) {
      tab.runtimeTargetId = check.tab.id;
      tab.status = 'idle';
      tab.lastSeen = new Date().toISOString();
      db.saveSavedTab(tab);
      await openclawClient.activateTab(check.tab.id, check.tab.port);
      setFeedback({ type: 'success', message: `Focused "${tab.friendlyName}" in Chrome` });
    } else {
      tab.status = 'missing';
      db.saveSavedTab(tab);
      setFeedback({ 
        type: 'error', 
        message: `Tab "${tab.friendlyName}" not found in Chrome. Please open Chrome or navigate to ${tab.expectedUrl}` 
      });
    }
    loadTabs();
    onUpdate?.();
  };

  // Reconnect tab
  const handleReconnectTab = async (tab: SavedTab) => {
    setFeedback({ type: 'info', message: `Scanning Chrome for "${tab.friendlyName}"...` });
    const check = await openclawClient.findTabForSavedTab(tab);
    if (check.found && check.tab) {
      tab.runtimeTargetId = check.tab.id;
      tab.pageTitle = check.tab.title;
      tab.expectedUrl = check.tab.url;
      tab.status = 'idle';
      tab.lastSeen = new Date().toISOString();
      db.saveSavedTab(tab);
      setFeedback({ type: 'success', message: `Reconnected "${tab.friendlyName}" to active tab: "${check.tab.title}"` });
    } else {
      tab.status = 'missing';
      db.saveSavedTab(tab);
      setFeedback({ type: 'error', message: `Could not find matching tab for "${tab.friendlyName}". Ensure the tab is open in Chrome.` });
    }
    loadTabs();
    onUpdate?.();
  };

  // Delete tab
  const handleDeleteTab = (tabId: string) => {
    db.deleteSavedTab(tabId);
    loadTabs();
    onUpdate?.();
  };

  // Start "Attach Current Tab" flow
  const handleStartAttach = async () => {
    setIsAttaching(true);
    setIsLoadingDetected(true);
    setFeedback(null);
    try {
      const openTabs = await openclawClient.listOpenTabs(9222);
      // Filter out EstateFlow Control itself so user doesn't attach the control center by accident
      const filtered = openTabs.filter(t => !t.url.includes('localhost:1420'));
      setDetectedTabs(filtered);
      if (filtered.length > 0) {
        setSelectedDetectedTab(filtered[0]);
        // Suggest a friendly name based on title or URL
        if (filtered[0].url.includes('chatgpt.com')) {
          setNewTabName(`Enhance 0${tabs.filter(t => t.role === 'enhancement').length + 1}`);
        } else if (filtered[0].url.includes('crop') || filtered[0].url.includes('5173')) {
          setNewTabName('Post Studio');
          setNewTabRole('tools');
        } else {
          setNewTabName(filtered[0].title.slice(0, 24));
        }
      } else {
        setSelectedDetectedTab(null);
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: 'Failed to inspect Chrome tabs: ' + e?.message });
    } finally {
      setIsLoadingDetected(false);
    }
  };

  // Save attached tab
  const handleSaveAttachedTab = () => {
    if (!selectedDetectedTab || !newTabName.trim()) return;

    const newTab: SavedTab = {
      id: `tab-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      browserId: profile.id,
      friendlyName: newTabName.trim(),
      expectedUrl: selectedDetectedTab.url,
      conversationUrl: selectedDetectedTab.url.includes('/c/') ? selectedDetectedTab.url : undefined,
      pageTitle: selectedDetectedTab.title,
      role: newTabRole,
      runtimeTargetId: selectedDetectedTab.id,
      status: 'idle',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveSavedTab(newTab);
    setIsAttaching(false);
    setSelectedDetectedTab(null);
    setNewTabName('');
    setFeedback({ type: 'success', message: `Saved tab "${newTab.friendlyName}" attached to ${profile.friendlyName}` });
    loadTabs();
    onUpdate?.();
  };

  // Save edit tab
  const handleSaveEdit = () => {
    if (!editingTab || !editName.trim()) return;
    editingTab.friendlyName = editName.trim();
    if (editUrl.trim()) editingTab.expectedUrl = editUrl.trim();
    editingTab.updatedAt = new Date().toISOString();
    db.saveSavedTab(editingTab);
    setEditingTab(null);
    loadTabs();
    onUpdate?.();
  };

  const getStatusBadge = (status: TabRuntimeStatus) => {
    switch (status) {
      case 'idle':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Idle / Ready</span>;
      case 'busy':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse">Busy</span>;
      case 'reserved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">Reserved</span>;
      case 'waiting':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">Waiting</span>;
      case 'missing':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">Missing</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-500/10 text-neutral-400">Offline</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                Browser Profile
              </span>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {profile.friendlyName}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Manage saved persistent browser tabs. Each tab represents an independent worker target.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className={`px-6 py-2.5 text-xs flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
            feedback.type === 'error' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
            'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          }`}>
            {feedback.type === 'success' ? <FiCheckCircle className="w-4 h-4 shrink-0" /> : <FiAlertCircle className="w-4 h-4 shrink-0" />}
            <span className="flex-1">{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-neutral-400 hover:text-neutral-600">
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Configured Tabs ({tabs.length})
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openclawClient.openNativeChromeProfile(profile)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                title="Launch Google Chrome with this profile container"
              >
                <FiExternalLink className="w-3.5 h-3.5" />
                <span>Open Browser</span>
              </button>

              <button
                onClick={handleStartAttach}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all"
              >
                <FiPlus className="w-3.5 h-3.5" />
                <span>Attach Current Tab</span>
              </button>
            </div>
          </div>

          {/* "Attach Current Tab" Form Drawer */}
          {isAttaching && (
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                  <FiCompass className="w-4 h-4 text-red-500" />
                  <span>Attach Open Chrome Tab</span>
                </div>
                <button
                  onClick={() => setIsAttaching(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              {isLoadingDetected ? (
                <div className="py-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                  <FiRefreshCw className="w-4 h-4 animate-spin text-red-500" />
                  <span>Inspecting open tabs via Chrome DevTools Protocol...</span>
                </div>
              ) : detectedTabs.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-2">
                  <p className="font-semibold">No open tabs detected in Chrome.</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-300">
                    1. Click "Open Browser" above to launch Chrome.
                    2. In Chrome, navigate to ChatGPT (or your target website).
                    3. Return here and click "Attach Current Tab" again.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1 block">
                      Select Open Tab from Chrome:
                    </label>
                    <select
                      value={selectedDetectedTab?.id || ''}
                      onChange={(e) => {
                        const found = detectedTabs.find(t => t.id === e.target.value);
                        if (found) {
                          setSelectedDetectedTab(found);
                          if (!newTabName || newTabName.startsWith('Enhance')) {
                            setNewTabName(found.title.slice(0, 24));
                          }
                        }
                      }}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none"
                    >
                      {detectedTabs.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} — {t.url}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1 block">
                        Logical Tab Name:
                      </label>
                      <input
                        type="text"
                        value={newTabName}
                        onChange={(e) => setNewTabName(e.target.value)}
                        placeholder="e.g. Enhance 01, Facebook Prompt"
                        className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1 block">
                        Assigned Role / Purpose:
                      </label>
                      <select
                        value={newTabRole}
                        onChange={(e) => setNewTabRole(e.target.value as any)}
                        className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none"
                      >
                        <option value="enhancement">Enhancement Worker</option>
                        <option value="prompt">Prompt & Copywriting</option>
                        <option value="hero">Hero Synthesis</option>
                        <option value="tools">Tools (Post Studio)</option>
                        <option value="publishing">Publishing</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsAttaching(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAttachedTab}
                      disabled={!selectedDetectedTab || !newTabName.trim()}
                      className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-all"
                    >
                      Save Tab Target
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit Tab Form Drawer */}
          {editingTab && (
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  Rename Tab: {editingTab.friendlyName}
                </span>
                <button onClick={() => setEditingTab(null)} className="text-neutral-400 text-xs">
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 mb-1 block">Friendly Name:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 mb-1 block">Expected URL:</label>
                  <input
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingTab(null)}
                  className="px-3 py-1.5 text-xs text-neutral-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Tabs List */}
          {tabs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 text-neutral-400 text-xs space-y-2">
              <p>No tabs attached to this browser yet.</p>
              <p className="text-[11px]">
                Click <strong className="text-red-500 font-semibold">Attach Current Tab</strong> to link a ChatGPT conversation or website tab.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tabs.map((tab) => {
                const isActive = tab.status === 'busy';
                return (
                  <div
                    key={tab.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isActive 
                        ? 'bg-blue-500/5 border-blue-500/30' 
                        : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                            {tab.friendlyName}
                          </h4>
                          {getStatusBadge(tab.status)}
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono capitalize">
                            {tab.role || 'worker'}
                          </span>
                        </div>

                        {/* URL and Title */}
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          <FiLink className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate font-mono text-[10.5px]" title={tab.expectedUrl}>
                            {tab.expectedUrl}
                          </span>
                        </div>

                        {/* Active Job / Action indicator */}
                        {tab.currentAction && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-500 font-semibold">
                            <FiActivity className="w-3 h-3 animate-spin shrink-0" />
                            <span>Action: {tab.currentAction}</span>
                            {tab.activeImageName && (
                              <span className="text-neutral-400 font-normal">({tab.activeImageName})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Open / Focus */}
                        <button
                          onClick={() => handleFocusTab(tab)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-all"
                          title="Focus this tab in Google Chrome"
                        >
                          <FiExternalLink className="w-3 h-3" />
                          <span>Focus</span>
                        </button>

                        {/* Reconnect */}
                        <button
                          onClick={() => handleReconnectTab(tab)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Rediscover / Reconnect Tab"
                        >
                          <FiRefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Rename */}
                        <button
                          onClick={() => {
                            setEditingTab(tab);
                            setEditName(tab.friendlyName);
                            setEditUrl(tab.expectedUrl);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Rename Tab"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => handleDeleteTab(tab.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Remove Tab Target"
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

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs">
          <span className="text-neutral-400">
            OpenClaw CDP Target Tracking Active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
