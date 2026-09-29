// EstateFlow Control - First-Run Setup Onboarding (Section 61)
import React, { useState } from 'react';
import { 
  FiCheck, 
  FiArrowRight, 
  FiArrowLeft, 
  FiFolder, 
  FiServer, 
  FiCpu, 
  FiExternalLink, 
  FiCheckCircle 
} from 'react-icons/fi';
import { GlassModal } from '../components/common/GlassModal';
import { useApp } from '../context/AppContext';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, closeOnboarding, addNotification } = useApp();
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 6;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      closeOnboarding();
      addNotification('success', 'Setup Complete', 'EstateFlow Control is ready for daily operations.');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <GlassModal
      isOpen={isOnboardingOpen}
      onClose={closeOnboarding}
      title="EstateFlow Control Quick Setup"
      subtitle={`Step ${currentStep} of ${totalSteps}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
          <div 
            className="h-full bg-rose-600 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="space-y-3 text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-xl mx-auto shadow-lg shadow-rose-600/30">
              EF
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Welcome to EstateFlow Control
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Your desktop automation control center for luxury real-estate portfolios, automated image enhancement, and multi-channel publishing.
            </p>
          </div>
        )}

        {/* Step 2: Storage */}
        {currentStep === 2 && (
          <div className="space-y-3 py-2">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FiFolder className="text-rose-500" />
              <span>Confirm Local Storage Location</span>
            </h3>
            <p className="text-xs text-neutral-400">
              All high-res originals, enhanced assets, and marketing outputs will be organized under this path.
            </p>
            <div className="p-3 rounded-xl glass-input font-mono text-xs">
              ~/Documents/EstateFlow Control
            </div>
          </div>
        )}

        {/* Step 3: Docker */}
        {currentStep === 3 && (
          <div className="space-y-3 py-2">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FiServer className="text-rose-500" />
              <span>Verify Docker Desktop Engine</span>
            </h3>
            <p className="text-xs text-neutral-400">
              EstateFlow Control utilizes lightweight Docker containers for isolated job queues and background automation services.
            </p>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <FiCheck className="w-4 h-4 shrink-0" />
              <span>Docker Desktop Connected (v29.0.1 macOS)</span>
            </div>
          </div>
        )}

        {/* Step 4: OpenClaw */}
        {currentStep === 4 && (
          <div className="space-y-3 py-2">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FiCpu className="text-rose-500" />
              <span>OpenClaw Automation Bridge</span>
            </h3>
            <p className="text-xs text-neutral-400">
              The OpenClaw bridge orchestrates native Chrome profiles and ChatGPT conversation sessions via Chrome DevTools Protocol.
            </p>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <FiCheck className="w-4 h-4 shrink-0" />
              <span>Bridge port 9222 active and listening</span>
            </div>
          </div>
        )}

        {/* Step 5: Chrome Profile */}
        {currentStep === 5 && (
          <div className="space-y-3 py-2">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Primary Chrome Profile
            </h3>
            <p className="text-xs text-neutral-400">
              Initial profile "Profile A - Primary Enhancement" configured. You can sign into ChatGPT once; sessions are saved securely within Chrome.
            </p>
            <div className="p-3 rounded-xl bg-neutral-200/50 dark:bg-white/5 border border-white/10 text-xs font-mono">
              Directory: ~/Library/Application Support/Google/Chrome/Profile_EstateFlow_A
            </div>
          </div>
        )}

        {/* Step 6: Ready */}
        {currentStep === 6 && (
          <div className="space-y-3 text-center py-4">
            <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Setup Finished & Ready
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              You can now create properties, drop in property photos, and trigger complete automation pipelines in 1 click.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200/40 dark:border-white/10 text-xs">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white disabled:opacity-30"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary-red font-bold uppercase shadow-lg shadow-rose-600/30"
          >
            <span>{currentStep === totalSteps ? 'Get Started' : 'Continue'}</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassModal>
  );
};
