// EstateFlow Control - Application Settings & Backup (Section 53, 54, 55, 56, 91, 92)
import React, { useState } from 'react';
import { 
  FiSettings, 
  FiMoon, 
  FiSun, 
  FiHardDrive, 
  FiCpu, 
  FiEdit, 
  FiDownloadCloud, 
  FiUploadCloud, 
  FiCheck, 
  FiInfo, 
  FiSliders,
  FiShield
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { AppSettings, PromptTemplate } from '../types';
import { db } from '../services/storage';

export const Settings: React.FC = () => {
  const { settings, updateSettings, theme, setTheme, addNotification, refreshProperties } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'automation' | 'prompts' | 'backup' | 'about'>('general');

  const [activeEnhancementWorkers, setActiveEnhancementWorkers] = useState(settings.automation.activeEnhancementWorkers);
  const [maxRetries, setMaxRetries] = useState(settings.automation.maxRetries);
  const [requireApproval, setRequireApproval] = useState(settings.automation.requireManualPublishApproval);
  const [storagePath, setStoragePath] = useState(settings.general.storageRootPath);

  // Prompt templates
  const [prompts, setPrompts] = useState<PromptTemplate[]>(db.getPrompts());
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);

  const handleSaveAutomation = () => {
    const updated: AppSettings = {
      ...settings,
      general: {
        ...settings.general,
        storageRootPath: storagePath
      },
      automation: {
        ...settings.automation,
        activeEnhancementWorkers,
        maxRetries,
        requireManualPublishApproval: requireApproval
      }
    };
    updateSettings(updated);
  };

  const handleSavePrompt = () => {
    if (!editingPrompt) return;
    db.savePrompt(editingPrompt);
    setPrompts([...db.getPrompts()]);
    setEditingPrompt(null);
    addNotification('success', 'Prompt Template Updated', `Updated ${editingPrompt.name}`);
  };

  const handleExportBackup = () => {
    const json = db.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estateflow_control_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    addNotification('success', 'Backup Exported', 'Full database snapshot downloaded to disk.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = db.importBackup(content);
      if (success) {
        refreshProperties();
        setPrompts([...db.getPrompts()]);
        addNotification('success', 'Backup Restored', 'Database safely restored from backup file.');
      } else {
        addNotification('error', 'Restore Failed', 'Invalid or corrupt backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Application Preferences & Settings
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Configure runtime limits, local directories, themes, and prompt templates.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200/50 dark:border-white/10 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'general', label: 'General & Storage' },
          { id: 'appearance', label: 'Appearance & Themes' },
          { id: 'automation', label: 'Automation & Workers' },
          { id: 'prompts', label: 'Prompt Templates' },
          { id: 'backup', label: 'Backup & Recovery' },
          { id: 'about', label: 'About & Security' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: General & Storage */}
      {activeTab === 'general' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5 animate-in fade-in duration-150">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
              Root Storage Directory (APFS / macOS)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={storagePath}
                onChange={(e) => setStoragePath(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs font-mono"
              />
              <button
                onClick={handleSaveAutomation}
                className="px-4 py-2.5 rounded-xl btn-primary-red text-xs font-bold uppercase"
              >
                Save
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">
              Property photos, enhanced deliverables, and marketing copies are automatically indexed in subdirectories here.
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-200/40 dark:border-white/5 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={settings.general.confirmOnDestructiveActions}
                onChange={(e) => {
                  const updated = {
                    ...settings,
                    general: { ...settings.general, confirmOnDestructiveActions: e.target.checked }
                  };
                  updateSettings(updated);
                }}
                className="w-4 h-4 rounded text-rose-600"
              />
              <span>Require confirmation before deleting properties and photos</span>
            </label>
          </div>
        </div>
      )}

      {/* Tab: Appearance */}
      {activeTab === 'appearance' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 animate-in fade-in duration-150">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Interface Color Theme
            </h3>
            <div className="grid grid-cols-3 gap-4 max-w-md">
              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  theme === 'light' 
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-bold' 
                    : 'border-white/10 hover:border-white/20 text-neutral-300'
                }`}
              >
                <FiSun className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                <span className="text-xs">Light Mode</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  theme === 'dark' 
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-bold' 
                    : 'border-white/10 hover:border-white/20 text-neutral-300'
                }`}
              >
                <FiMoon className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                <span className="text-xs">Dark Mode</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  theme === 'system' 
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-bold' 
                    : 'border-white/10 hover:border-white/20 text-neutral-300'
                }`}
              >
                <FiSliders className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                <span className="text-xs">Follow System</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Automation & Workers */}
      {activeTab === 'automation' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                Active Parallel Enhancement Workers
              </label>
              <input
                type="number"
                value={activeEnhancementWorkers}
                onChange={(e) => setActiveEnhancementWorkers(Number(e.target.value))}
                min="1"
                max="8"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                Maximum Retry Attempts Before Flagging
              </label>
              <input
                type="number"
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                min="1"
                max="5"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-200/40 dark:border-white/5">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600"
              />
              <span className="font-semibold text-neutral-200">
                Enforce Manual Approval for all Social & Marketplace Publishing (Recommended)
              </span>
            </label>
          </div>

          <button
            onClick={handleSaveAutomation}
            className="px-5 py-2.5 rounded-xl btn-primary-red text-xs font-bold uppercase"
          >
            Save Automation Settings
          </button>
        </div>
      )}

      {/* Tab: Prompts */}
      {activeTab === 'prompts' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Configured Prompt Templates ({prompts.length})
            </h2>
          </div>

          <div className="space-y-3">
            {prompts.map((p) => (
              <div key={p.id} className="glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-neutral-900 dark:text-white">
                      {p.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">
                      v{p.version}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {p.purpose}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.tokens.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                        {`{${t}}`}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setEditingPrompt(p)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-xs font-semibold self-start md:self-auto"
                >
                  Edit Template
                </button>
              </div>
            ))}
          </div>

          {/* Prompt Editor Modal */}
          {editingPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="glass-panel p-6 rounded-3xl max-w-2xl w-full space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Edit Template: {editingPrompt.name}
                </h3>
                <textarea
                  rows={8}
                  value={editingPrompt.content}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                  className="w-full p-3 rounded-xl glass-input text-xs font-mono leading-relaxed"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingPrompt(null)}
                    className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePrompt}
                    className="px-5 py-2 rounded-xl btn-primary-red text-xs font-bold uppercase"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Backup & Recovery */}
      {activeTab === 'backup' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              SQLite Database Snapshot & Recovery (Section 91 & 92)
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md">
              Create an immutable snapshot of all properties, job queues, workers, and prompts without copying media files.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary-red text-xs font-bold uppercase shadow-lg shadow-rose-600/30"
            >
              <FiDownloadCloud className="w-4 h-4" />
              <span>Export Full Backup (.json)</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-xs font-bold cursor-pointer transition-colors">
              <FiUploadCloud className="w-4 h-4 text-rose-500" />
              <span>Restore from Backup File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Tab: About */}
      {activeTab === 'about' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white font-black text-sm">
              EF
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                EstateFlow Control
              </h3>
              <span className="text-xs text-neutral-400">
                Version 1.0.0 Production Release
              </span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
            Built as a sandboxed macOS desktop application using Tauri 2, React, TypeScript, and OpenClaw automation bridge. Zero external CDNs. Offline first.
          </p>
        </div>
      )}
    </div>
  );
};
