// EstateFlow Control - First-Run Setup Onboarding (Normal Case, Clean)
import React, { useState } from 'react';
import { 
  FiCheck, 
  FiArrowRight, 
  FiFolder, 
  FiServer, 
  FiCpu, 
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
      <div className="space-y-5">
        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div 
            className="h-full bg-rose-600 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="space-y-3 text-center py-4">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Welcome to Estate<span className="text-rose-600 dark:text-rose-500">Flow</span> Control
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Your desktop automation control center for luxury real-estate portfolios, automated image enhancement, and multi-channel publishing.
            </p>
          </div>
        )}

        {/* Step 2: Storage */}
        {currentStep === 2 && (
          <div className="space-y-2 py-2">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <FiFolder className="text-rose-500" />
              <span>Confirm Local Storage Location</span>
            </h3>
            <p className="text-xs text-neutral-400">
              All high-res originals, enhanced assets, and marketing outputs will be organized under this path.
            </p>
            <div className="p-2.5 rounded-lg glass-input font-mono text-xs">
              ~/Documents/EstateFlow Control
            </div>
          </div>
        )}

        {/* Step 3: Docker */}
        {currentStep === 3 && (
          <div className="space-y-2 py-2">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <FiServer className="text-rose-500" />
              <span>Verify Docker Desktop Engine</span>
            </h3>
            <p className="text-xs text-neutral-400">
              EstateFlow Control utilizes lightweight Docker containers for isolated job queues and background automation services.
            </p>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
              <FiCheck className="w-4 h-4 shrink-0" />
              <span>Docker Desktop Connected</span>
            </div>
          </div>
        )}

        {/* Step 4: OpenClaw */}
        {currentStep === 4 && (
          <div className="space-y-2 py-2">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <FiCpu className="text-rose-500" />
              <span>OpenClaw Automation Bridge</span>
            </h3>
            <p className="text-xs text-neutral-400">
              The OpenClaw bridge orchestrates native Chrome profiles and ChatGPT conversation sessions via Chrome DevTools Protocol.
            </p>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
              <FiCheck className="w-4 h-4 shrink-0" />
              <span>Bridge port 9222 active and listening</span>
            </div>
          </div>
        )}

        {/* Step 5: Chrome Profile */}
        {currentStep === 5 && (
          <div className="space-y-2 py-2">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Primary Chrome Profile
            </h3>
            <p className="text-xs text-neutral-400">
              Initial profile "Profile A - Primary Enhancement" configured. You can sign into ChatGPT once; sessions are saved securely within Chrome.
            </p>
            <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono">
              Profile_EstateFlow_A
            </div>
          </div>
        )}

        {/* Step 6: Ready */}
        {currentStep === 6 && (
          <div className="space-y-2 text-center py-4">
            <FiCheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Setup Finished & Ready
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              You can now create properties, drop in property photos, and trigger complete automation pipelines in 1 click.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="btn-secondary disabled:opacity-30"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            className="btn-primary-red"
          >
            <span>{currentStep === totalSteps ? 'Get Started' : 'Continue'}</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </GlassModal>
  );
};
