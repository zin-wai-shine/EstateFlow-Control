// EstateFlow Control - Simple Clean Launch Screen for Pipelines
import React, { useState } from 'react';
import { Pipeline, PipelineRun } from '../../types/pipeline';
import { useApp } from '../../context/AppContext';
import { pipelineEngine } from '../../services/pipelineEngine';
import { 
  FiPlay, 
  FiX, 
  FiHome, 
  FiImage, 
  FiLayers, 
  FiClock, 
  FiCheckCircle, 
  FiSliders,
  FiFolder
} from 'react-icons/fi';

import { db } from '../../services/storage';

interface RunPipelineModalProps {
  pipeline: Pipeline | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunched: (runId: string) => void;
}

export const RunPipelineModal: React.FC<RunPipelineModalProps> = ({
  pipeline,
  isOpen,
  onClose,
  onLaunched
}) => {
  const { properties } = useApp();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [folderPath, setFolderPath] = useState<string>('~/Desktop/RealEstate/Bangna_HighRise');
  const [customTextInput, setCustomTextInput] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState(false);

  if (!isOpen || !pipeline) return null;

  const selectedProperty = properties.find(p => p.id === selectedPropertyId) || properties[0];
  const propertyImages = selectedProperty ? db.getImages(selectedProperty.id) : [];
  const inputType = pipeline.inputSchema?.type || 'property';

  // Identify pools used
  const poolIds = Array.from(new Set(pipeline.nodes.map(n => n.config.workerPoolId).filter(Boolean)));
  const allPools = pipelineEngine.getWorkerPools();
  const usedPools = allPools.filter(p => poolIds.includes(p.id));

  const handleLaunch = () => {
    setIsLaunching(true);

    try {
      const inputs: Record<string, any> = {};
      if (inputType === 'property' || inputType === 'images') {
        inputs.property = selectedProperty;
        inputs.propertyId = selectedProperty?.id;
        inputs.images = propertyImages;
        inputs.title = selectedProperty?.projectName;
      } else if (inputType === 'folder') {
        inputs.folderPath = folderPath;
      } else if (inputType === 'text') {
        inputs.text = customTextInput;
      }

      // Execute pipeline graph
      const run = pipelineEngine.executePipeline(pipeline.id, inputs);
      onLaunched(run.id);
      onClose();
    } catch (err) {
      console.error('Failed to launch pipeline:', err);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <FiPlay className="w-5 h-5 ml-0.5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white truncate max-w-[340px]">
                Run Pipeline
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[340px]">
                {pipeline.name} • {pipeline.version}
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

        {/* Modal Body - Simple Launch Screen */}
        <div className="p-6 space-y-5">
          {/* Target Context Input based on Pipeline Input Schema */}
          {(inputType === 'property' || inputType === 'images') && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <FiHome className="w-4 h-4 text-neutral-400" />
                <span>Select Target Property:</span>
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                {properties.map(p => {
                  const imgCount = db.getImages(p.id).length;
                  const price = p.rentalPrice || p.salePrice || 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.projectName} ({imgCount} images) — ฿{price.toLocaleString()}
                    </option>
                  );
                })}
              </select>

              {/* Property Snapshot Card */}
              {selectedProperty && (
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {propertyImages[0] ? (
                      <img 
                        src={propertyImages[0].previewUrl} 
                        alt="Property preview" 
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-400">
                        <FiImage className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-[240px]">
                        {selectedProperty.projectName}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {selectedProperty.location} • {selectedProperty.bedrooms} Bed • {selectedProperty.sizeSqm} sqm
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                      <FiImage className="w-3.5 h-3.5" />
                      {propertyImages.length} Photos
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {inputType === 'folder' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <FiFolder className="w-4 h-4 text-neutral-400" />
                <span>Source Directory Path:</span>
              </label>
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="/path/to/property/assets"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white"
              />
            </div>
          )}

          {inputType === 'text' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Input Text / Prompt:
              </label>
              <textarea
                value={customTextInput}
                onChange={(e) => setCustomTextInput(e.target.value)}
                placeholder="Enter prompt or payload text..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white"
              />
            </div>
          )}

          {/* Connected Worker Pools Summary */}
          {usedPools.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <FiLayers className="w-3.5 h-3.5 text-purple-500" />
                <span>Active Worker Pools Required:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {usedPools.map(pool => (
                  <div key={pool.id} className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{pool.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[10px]">
                      {pool.concurrencyLimit || 1}x concurrency
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800">
              <span className="text-[10px] text-neutral-400 block">Total Nodes</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">{pipeline.nodes.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800">
              <span className="text-[10px] text-neutral-400 block">Connections</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">{pipeline.edges.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800">
              <span className="text-[10px] text-neutral-400 block">Max Concurrency</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{pipeline.settings.maxParallelJobs} workers</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            {isLaunching ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Starting Graph...</span>
              </>
            ) : (
              <>
                <FiPlay className="w-4 h-4 ml-0.5" />
                <span>Launch Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
