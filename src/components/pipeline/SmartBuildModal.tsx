// EstateFlow Control - Smart Build Modal
// Natural Language to Connected Pipeline Graph Generator
import React, { useState } from 'react';
import { Pipeline, WorkerPool } from '../../types/pipeline';
import { pipelineEngine } from '../../services/pipelineEngine';
import { db } from '../../services/storage';
import { 
  FiZap, 
  FiX, 
  FiCheck, 
  FiLayers, 
  FiCpu, 
  FiCompass, 
  FiArrowRight, 
  FiMessageSquare,
  FiHelpCircle
} from 'react-icons/fi';

interface SmartBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPipelineGenerated: (pipeline: Pipeline) => void;
}

const SAMPLE_PROMPTS = [
  "Enhance all property photos using my Enhance worker pool. In parallel generate Facebook and TikTok prompts. When enhanced photos finish, build a Facebook hero with the prompt and stop for approval.",
  "Concurrently process all listing photos through external watermark website at 4x parallel speed, then verify file sizes and save to property assets.",
  "Generate Facebook social copy, then open Chrome to publish automatically to Marketplace using Social Publishing Pool."
];

export const SmartBuildModal: React.FC<SmartBuildModalProps> = ({
  isOpen,
  onClose,
  onPipelineGenerated
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Retrieve current resources so user sees what EstateFlow will tap into
  const workerPools: WorkerPool[] = pipelineEngine.getWorkerPools();
  const profiles = db.getProfiles();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      try {
        const proposedPipeline = pipelineEngine.smartBuildPipeline(prompt.trim(), {
          workerPools,
          browserProfiles: profiles
        });
        onPipelineGenerated(proposedPipeline);
        onClose();
      } catch (err) {
        console.error('Smart Build error:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500">
              <FiZap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Smart Build Workflow
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Describe your desired automation workflow. EstateFlow maps nodes, workers, and parallel branches into an editable canvas graph.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Active Context Banner */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 text-xs">
            <div className="flex items-center gap-2 font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              <FiCompass className="w-4 h-4 text-red-500" />
              <span>Available Connected Resources:</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                {profiles.length} Chrome Profile{profiles.length !== 1 ? 's' : ''}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                {workerPools.length} Worker Pool{workerPools.length !== 1 ? 's' : ''}
              </span>
              {workerPools.map(wp => (
                <span key={wp.id} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                  {wp.name} ({wp.concurrencyLimit || 1}x)
                </span>
              ))}
            </div>
          </div>

          {/* Prompt Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
              <span>Natural Language Prompt:</span>
              <span className="text-[11px] font-normal text-neutral-400">
                Source of truth will remain fully visual & editable
              </span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Enhance all property photos using Enhancement worker pool. In parallel generate Facebook & TikTok prompts. Merge at Hero generator and stop for manual approval..."
              rows={4}
              className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
            />
          </div>

          {/* Quick Preset Prompts */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-neutral-400">
              Or pick an example workflow pattern:
            </span>
            <div className="flex flex-col gap-2">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sample)}
                  className="text-left p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/40 hover:bg-red-500/5 hover:border-red-500/30 border border-transparent text-xs text-neutral-600 dark:text-neutral-300 transition-colors flex items-start gap-2.5"
                >
                  <FiArrowRight className="w-3.5 h-3.5 mt-0.5 text-neutral-400 shrink-0" />
                  <span>{sample}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <FiHelpCircle className="w-4 h-4" />
            <span>Generates an editable node graph. Nothing runs automatically.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Graph...</span>
                </>
              ) : (
                <>
                  <FiZap className="w-4 h-4" />
                  <span>Generate Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
