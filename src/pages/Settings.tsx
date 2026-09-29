// EstateFlow Control - Application Settings & Backup (Normal Case, Clean)
import React, { useState } from 'react';
import { 
  FiMoon, 
  FiSun, 
  FiDownloadCloud, 
  FiUploadCloud, 
  FiSliders
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
    addNotification('success', 'Backup Exported', 'Database snapshot downloaded to disk.');
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
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Application Preferences & Settings
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Configure runtime limits, local directories, themes, and prompt templates.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto text-xs font-medium">
        {[
          { id: 'general', label: 'General & Storage' },
          { id: 'appearance', label: 'Appearance & Themes' },
          { id: 'automation', label: 'Automation & Workers' },
          { id: 'prompts', label: 'Prompt Templates' },
          { id: 'backup', label: 'Backup & Recovery' },
          { id: 'about', label: 'About & System' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 font-semibold border border-rose-500/20'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: General & Storage */}
      {activeTab === 'general' && (
        <div className="glass-panel p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Root Storage Directory
            </label>
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={storagePath}
                onChange={(e) => setStoragePath(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-lg glass-input text-xs font-mono"
              />
              <button
                onClick={handleSaveAutomation}
                className="btn-primary-red"
              >
                Save
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Property photos, enhanced deliverables, and marketing outputs are organized here.
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
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
              <span>Confirm before deleting properties and photos</span>
            </label>
          </div>
        </div>
      )}

      {/* Tab: Appearance */}
      {activeTab === 'appearance' && (
        <div className="glass-panel p-5 space-y-4">
          <div>
            <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2.5">
              Color Theme
            </h3>
            <div className="grid grid-cols-3 gap-3 max-w-sm">
              <button
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                  theme === 'light' 
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-semibold' 
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-white'
                }`}
              >
                <FiSun className="w-5 h-5 mx-auto mb-1 text-rose-500" />
                <span className="text-xs">Light</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                  theme === 'dark' 
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-semibold' 
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-white'
                }`}
              >
                <FiMoon className="w-5 h-5 mx-auto mb-1 text-rose-500" />
                <span className="text-xs">Dark</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                  theme === 'system' 
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-semibold' 
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-white'
                }`}
              >
                <FiSliders className="w-5 h-5 mx-auto mb-1 text-rose-500" />
                <span className="text-xs">System</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Automation & Workers */}
      {activeTab === 'automation' && (
        <div className="glass-panel p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Parallel Enhancement Workers
              </label>
              <input
                type="number"
                value={activeEnhancementWorkers}
                onChange={(e) => setActiveEnhancementWorkers(Number(e.target.value))}
                min="1"
                max="8"
                className="w-full px-3.5 py-2 rounded-lg glass-input text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Max Retries Before Flagging
              </label>
              <input
                type="number"
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                min="1"
                max="5"
                className="w-full px-3.5 py-2 rounded-lg glass-input text-xs font-medium"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600"
              />
              <span className="text-neutral-700 dark:text-neutral-200">
                Require manual approval for publishing
              </span>
            </label>
          </div>

          <button
            onClick={handleSaveAutomation}
            className="px-4 py-2 rounded-lg btn-primary-red text-xs font-medium cursor-pointer"
          >
            Save Automation Settings
          </button>
        </div>
      )}

      {/* Tab: Prompts */}
      {activeTab === 'prompts' && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Prompt Templates ({prompts.length})
          </h2>

          <div className="space-y-2.5">
            {prompts.map((p) => (
              <div key={p.id} className="glass-card p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      {p.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
                      v{p.version}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {p.purpose}
                  </p>
                </div>

                <button
                  onClick={() => setEditingPrompt(p)}
                  className="btn-secondary self-start md:self-auto"
                >
                  Edit Template
                </button>
              </div>
            ))}
          </div>

          {editingPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="glass-panel p-5 rounded-2xl max-w-xl w-full space-y-3">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Edit Template: {editingPrompt.name}
                </h3>
                <textarea
                  rows={8}
                  value={editingPrompt.content}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                  className="w-full p-3 rounded-lg glass-input text-xs font-mono leading-relaxed"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingPrompt(null)}
                    className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePrompt}
                    className="btn-primary-red"
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
        <div className="glass-panel p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Database Snapshot & Recovery
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 max-w-md">
              Create a snapshot of properties, job queues, workers, and prompts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="btn-primary-red"
            >
              <FiDownloadCloud className="w-3.5 h-3.5" />
              <span>Export Backup (.json)</span>
            </button>

            <label className="btn-secondary">
              <FiUploadCloud className="w-3.5 h-3.5 text-rose-500" />
              <span>Restore Backup</span>
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
        <div className="glass-panel p-5 space-y-3">
          <div>
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              Estate<span className="text-rose-600 dark:text-rose-500">Flow</span> Control
            </h3>
            <span className="text-xs text-neutral-400">
              Version 1.0.0
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
            Sandboxed macOS desktop application using Tauri 2, React, TypeScript, and OpenClaw automation bridge.
          </p>
        </div>
      )}
    </div>
  );
};
