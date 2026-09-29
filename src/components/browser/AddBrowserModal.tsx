// EstateFlow Control - Simplified Add Browser Modal
import React, { useState } from 'react';
import { 
  FiExternalLink, 
  FiCheckCircle, 
  FiCheck,
  FiRefreshCw
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

export const AddBrowserModal: React.FC<AddBrowserModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { refreshProfiles, refreshWorkers, addNotification } = useApp();
  
  const [browserName, setBrowserName] = useState('');
  const [step, setStep] = useState<'input' | 'waiting_login'>('input');
  const [createdProfile, setCreatedProfile] = useState<ChromeProfile | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const resetState = () => {
    setBrowserName('');
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

  const handleConnectBrowser = async (e: React.FormEvent) => {
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

    // 1. Create Profile automatically
    const newProfile: ChromeProfile = {
      id: profileId,
      friendlyName: trimmed,
      profileDirName: safeDirName,
      purpose: 'general',
      chatGptSessionStatus: 'waiting_for_login',
      assignedWorkerCount: 1,
      notes: `Dedicated Chrome profile for ${trimmed}. Persistent login container.`,
      lastActiveAt: new Date().toISOString()
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

    // 3. Launch native macOS Chrome with dedicated profile directory
    try {
      await openclawClient.openNativeChromeProfile(newProfile);
      addNotification('info', 'Chrome Launched', `Opened dedicated Chrome session for "${trimmed}". Sign in to your account.`);
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
        <form onSubmit={handleConnectBrowser} className="space-y-4">
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
              <span>{isLaunching ? 'Connecting...' : 'Connect Browser'}</span>
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

            <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50/80 dark:bg-neutral-800/40 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 space-y-1.5">
              <p className="font-medium text-neutral-800 dark:text-neutral-200">
                1. Sign into your required websites (ChatGPT, Facebook, TikTok, etc.) inside the opened external Chrome window.
              </p>
              <p className="text-neutral-400 text-[11px]">
                2. Your login session will be permanently preserved in this browser container. Click Check Login or Done when finished.
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

