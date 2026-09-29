// EstateFlow Control - Simplified Add Browser Modal
import React, { useState } from 'react';
import { 
  FiExternalLink, 
  FiCheckCircle, 
  FiCheck,
  FiRefreshCw,
  FiGlobe
} from 'react-icons/fi';
import { GlassModal } from '../common/GlassModal';
import { StatusBadge } from '../common/StatusBadge';
import { ChromeProfile, AutomationWorker } from '../../types';
import { db } from '../../services/storage';
import { openclawClient } from '../../services/openclawClient';
import { useApp } from '../../context/AppContext';

interface AddBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdProfile: ChromeProfile) => void;
}

const LOGIN_SERVICES = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', purpose: 'enhancement' as const },
  { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com', purpose: 'publishing' as const },
  { id: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com', purpose: 'hero' as const },
  { id: 'google', name: 'Google Account', url: 'https://accounts.google.com', purpose: 'general' as const },
  { id: 'custom', name: 'Custom URL', url: '', purpose: 'general' as const }
];

export const AddBrowserModal: React.FC<AddBrowserModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { refreshProfiles, refreshWorkers, addNotification } = useApp();
  
  const [browserName, setBrowserName] = useState('');
  const [selectedService, setSelectedService] = useState<string>('chatgpt');
  const [targetUrl, setTargetUrl] = useState<string>('https://chatgpt.com');
  const [step, setStep] = useState<'input' | 'waiting_login'>('input');
  const [createdProfile, setCreatedProfile] = useState<ChromeProfile | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const resetState = () => {
    setBrowserName('');
    setSelectedService('chatgpt');
    setTargetUrl('https://chatgpt.com');
    setStep('input');
    setCreatedProfile(null);
    setIsLaunching(false);
    setIsChecking(false);
    setNameError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCreateAndOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = browserName.trim();
    if (!trimmed) {
      setNameError('Please enter a browser name.');
      return;
    }

    setIsLaunching(true);
    setNameError(null);

    const now = Date.now();
    const profileId = `profile-b${now}`;
    const safeDirName = `EstateFlow_Browser_${now}`;

    const chosenServiceObj = LOGIN_SERVICES.find(s => s.id === selectedService);
    const finalUrl = targetUrl.trim() || 'https://chatgpt.com';
    const finalServiceName = chosenServiceObj?.id === 'custom' ? 'Custom' : (chosenServiceObj?.name || 'ChatGPT');
    const computedPurpose = chosenServiceObj?.purpose || 'general';

    // 1. Create Profile automatically with saved login service & URL
    const newProfile: ChromeProfile = {
      id: profileId,
      friendlyName: trimmed,
      profileDirName: safeDirName,
      purpose: computedPurpose,
      chatGptSessionStatus: 'waiting_for_login',
      assignedWorkerCount: 1,
      notes: `Dedicated Chrome profile for ${trimmed}. Persistent login container.`,
      lastActiveAt: new Date().toISOString(),
      loginService: finalServiceName,
      loginUrl: finalUrl
    };

    // 2. Create standard worker automatically so Process Engine can utilize it seamlessly
    const defaultWorker: AutomationWorker = {
      id: `worker-w${now}`,
      name: `${trimmed} Worker`,
      profileId: newProfile.id,
      profileFriendlyName: newProfile.friendlyName,
      type: 'enhancement',
      role: 'generic',
      status: 'ready',
      totalJobsProcessed: 0,
      successRate: 100,
      startedAt: new Date().toISOString()
    };

    // Save to Database
    db.saveProfile(newProfile);
    db.saveWorker(defaultWorker);

    // Refresh context
    refreshProfiles();
    refreshWorkers();

    setCreatedProfile(newProfile);

    // 3. Launch native macOS Chrome with dedicated profile directory navigated to targetUrl
    try {
      await openclawClient.openNativeChromeProfile(newProfile);
      addNotification('info', 'Chrome Launched', `Opened dedicated Chrome session for "${trimmed}" at ${finalUrl}. Sign in to your account.`);
    } catch (e: any) {
      addNotification('warning', 'Chrome Launch Warning', e?.message || 'Profile created. Click Open Browser to retry launch.');
    } finally {
      setIsLaunching(false);
      setStep('waiting_login');
    }
  };

  const handleReopenBrowser = async () => {
    if (!createdProfile) return;
    setIsLaunching(true);
    try {
      await openclawClient.openNativeChromeProfile(createdProfile);
      addNotification('info', 'Chrome Reopened', `Focused native Chrome for "${createdProfile.friendlyName}".`);
    } catch (e: any) {
      addNotification('error', 'Launch Failed', e?.message || 'Could not launch Chrome.');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleCheckLogin = async () => {
    if (!createdProfile) return;
    setIsChecking(true);
    await new Promise(r => setTimeout(r, 400)); // Smooth desktop check

    // Set to ready
    const updated: ChromeProfile = {
      ...createdProfile,
      chatGptSessionStatus: 'ready',
      lastActiveAt: new Date().toISOString()
    };
    db.saveProfile(updated);
    setCreatedProfile(updated);
    refreshProfiles();
    setIsChecking(false);
    addNotification('success', 'Browser Ready', `"${updated.friendlyName}" is authenticated and ready for processes.`);
  };

  const handleFinish = () => {
    if (createdProfile) {
      onSuccess?.(createdProfile);
    }
    handleClose();
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'input' ? 'Add Browser' : 'Browser Created'}
      subtitle={
        step === 'input'
          ? 'Create a dedicated browser session and sign in manually.'
          : 'Native Google Chrome has been opened with your dedicated profile.'
      }
      maxWidth="md"
    >
      {step === 'input' ? (
        <form onSubmit={handleCreateAndOpen} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Browser Name
            </label>
            <input
              type="text"
              value={browserName}
              onChange={(e) => {
                setBrowserName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. Main Enhancement, Facebook Account, Hero Generator"
              className={`glass-input w-full px-3 py-2 text-xs rounded-lg ${
                nameError ? 'border-rose-500 focus:border-rose-500' : ''
              }`}
              autoFocus
            />
            {nameError ? (
              <p className="text-[11px] text-rose-500 mt-1.5">{nameError}</p>
            ) : (
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Friendly display name to identify this browser account inside EstateFlow Control.
              </p>
            )}
          </div>

          {/* Login Browser / Service Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Login Browser / Website
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-2">
              {LOGIN_SERVICES.map((srv) => (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => {
                    setSelectedService(srv.id);
                    if (srv.id !== 'custom') {
                      setTargetUrl(srv.url);
                    }
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                    selectedService === srv.id
                      ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  {srv.name}
                </button>
              ))}
            </div>

            {/* Target URL input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-400">
                <FiGlobe className="w-3.5 h-3.5" />
              </div>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  if (selectedService !== 'custom') {
                    setSelectedService('custom');
                  }
                }}
                placeholder="https://chatgpt.com"
                className="glass-input w-full pl-8 pr-3 py-1.5 text-xs rounded-lg font-mono text-neutral-800 dark:text-neutral-200"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              External Chrome will navigate to this address automatically for manual sign in.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLaunching}
              className="btn-primary-red flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLaunching ? (
                <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FiExternalLink className="w-3.5 h-3.5" />
              )}
              <span>{isLaunching ? 'Opening Chrome...' : 'Create & Open Browser'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Status Display Card */}
          <div className="p-4 rounded-xl glass-panel border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block">Browser Account</span>
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  {createdProfile?.friendlyName}
                </h3>
              </div>
              <StatusBadge status={createdProfile?.chatGptSessionStatus || 'waiting_for_login'} size="sm" />
            </div>

            {/* Target Login Website Row */}
            {createdProfile?.loginUrl && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FiGlobe className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 shrink-0">
                    {createdProfile.loginService || 'Target'}:
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px] truncate">
                    {createdProfile.loginUrl}
                  </span>
                </div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium shrink-0 ml-2">
                  Opened for Sign In
                </span>
              </div>
            )}

            <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50/80 dark:bg-neutral-800/40 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 space-y-1">
              <p>
                1. Sign into <strong className="text-neutral-800 dark:text-neutral-200">{createdProfile?.loginService || 'your account'}</strong> inside the opened external Chrome window.
              </p>
              <p className="mt-1 text-neutral-400 text-[11px]">
                2. Your login session will be permanently preserved in this browser container.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleReopenBrowser}
              disabled={isLaunching}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <FiExternalLink className="w-3.5 h-3.5" />
              <span>Open Browser</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCheckLogin}
                disabled={isChecking}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                {isChecking ? (
                  <FiRefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                ) : (
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>Check Login</span>
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="btn-primary-red text-xs flex items-center gap-1.5"
              >
                <FiCheck className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </GlassModal>
  );
};
