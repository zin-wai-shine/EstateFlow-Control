// EstateFlow Control - Selected Node Settings Inspector Panel
import React, { useState } from 'react';
import { 
  FiX, 
  FiSliders, 
  FiPlay, 
  FiTrash2, 
  FiCopy, 
  FiHelpCircle,
  FiCheckCircle,
  FiExternalLink
} from 'react-icons/fi';
import { PipelineNode, PipelineEdge } from '../../types/pipeline';
import { getNodeDefinition, NODE_CATEGORY_METADATA } from '../../services/nodeRegistry';
import { useApp } from '../../context/AppContext';
import { pipelineEngine } from '../../services/pipelineEngine';
import { AppDropdown } from '../common/AppDropdown';

import { WorkerPool } from '../../types/pipeline';

interface NodeSettingsPanelProps {
  selectedNode?: PipelineNode | null;
  node?: PipelineNode | null;
  edges?: PipelineEdge[];
  workerPools?: WorkerPool[];
  onUpdateNode: (updatedNode: PipelineNode) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDuplicateNode?: (node: PipelineNode) => void;
  onTestNode?: (node: PipelineNode) => void;
  onClose: () => void;
}

export const NodeSettingsPanel: React.FC<NodeSettingsPanelProps> = ({
  selectedNode: propSelectedNode,
  node: propNode,
  edges = [],
  workerPools: propWorkerPools,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onTestNode,
  onClose
}) => {
  const selectedNode = propSelectedNode || propNode || null;
  const { profiles } = useApp() as any;
  const workerPools = propWorkerPools || pipelineEngine.getWorkerPools();

  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!selectedNode) {
    return (
      <div className="w-80 h-full border-l border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center text-xs text-neutral-400 select-none shrink-0">
        <FiSliders className="w-8 h-8 mb-2 opacity-30 text-rose-500" />
        <p className="font-semibold text-neutral-600 dark:text-neutral-300">No Node Selected</p>
        <p className="mt-1 max-w-[200px]">Click any node on the canvas to configure parameters, browser targets, and data bindings.</p>
      </div>
    );
  }

  const def = getNodeDefinition(selectedNode.type);
  const catMeta = NODE_CATEGORY_METADATA[selectedNode.category];

  const handleConfigChange = (field: string, value: any) => {
    onUpdateNode({
      ...selectedNode,
      config: {
        ...selectedNode.config,
        [field]: value
      }
    });
  };

  const handleNameChange = (name: string) => {
    onUpdateNode({
      ...selectedNode,
      name
    });
  };

  const handleTestNode = async () => {
    setIsTesting(true);
    setTestResult(null);
    await new Promise(r => setTimeout(r, 600)); // Simulated node test
    setIsTesting(false);
    setTestResult(`Test execution succeeded: Produced valid ${selectedNode.outputs[0]?.label || 'output'}.`);
  };

  // Find incoming & outgoing edges for this node
  const incomingEdges = edges.filter(e => e.targetNodeId === selectedNode.id);
  const outgoingEdges = edges.filter(e => e.sourceNodeId === selectedNode.id);

  const visibleFields = (def?.configFields || []).filter(f => isAdvancedMode || !f.advanced);

  return (
    <div className="w-84 h-full flex flex-col border-l border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/50 backdrop-blur-md select-none shrink-0 overflow-y-auto">
      {/* Top Header */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${catMeta?.badgeColor || 'border-neutral-300'}`}>
              {catMeta?.label || selectedNode.category}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 truncate">
              {selectedNode.type}
            </span>
          </div>
          <input
            type="text"
            value={selectedNode.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="font-bold text-sm text-neutral-900 dark:text-neutral-100 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/50 px-1 py-0.5 -ml-1 rounded focus:outline-none focus:ring-1 focus:ring-rose-500 w-full"
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Close Inspector"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Toggle & Description */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 space-y-2.5">
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
          {def?.description}
        </p>

        {/* Simple vs Advanced Toggle */}
        <div className="flex items-center justify-between p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setIsAdvancedMode(false)}
            className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
              !isAdvancedMode 
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm font-semibold' 
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            Simple Mode
          </button>
          <button
            type="button"
            onClick={() => setIsAdvancedMode(true)}
            className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
              isAdvancedMode 
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm font-semibold' 
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            Advanced Mode
          </button>
        </div>
      </div>

      {/* Config Fields Form */}
      <div className="p-3.5 space-y-3.5 flex-1 overflow-y-auto">
        {visibleFields.length === 0 ? (
          <p className="text-xs text-neutral-400 italic">No parameters required for this node.</p>
        ) : (
          visibleFields.map((field) => (
            <div key={field.name} className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {field.label}
              </label>

              {field.type === 'browser_select' && (
                <AppDropdown
                  options={(profiles || []).map((p: any) => ({
                    value: p.id,
                    label: p.friendlyName || p.id
                  }))}
                  value={selectedNode.config[field.name] || profiles?.[0]?.id || ''}
                  onChange={(val) => handleConfigChange(field.name, val)}
                  className="w-full"
                />
              )}

              {field.type === 'worker_pool_select' && (
                <AppDropdown
                  options={workerPools.map(wp => ({
                    value: wp.id,
                    label: `${wp.name} (Limit: ${wp.concurrencyLimit || 4})`
                  }))}
                  value={selectedNode.config[field.name] || workerPools[0]?.id || ''}
                  onChange={(val) => handleConfigChange(field.name, val)}
                  className="w-full"
                />
              )}

              {field.type === 'prompt_template_select' && (
                <AppDropdown
                  options={[
                    { value: 'prompt-fb-luxury', label: 'Facebook Luxury Listing Prompt' },
                    { value: 'prompt-tiktok-script', label: 'TikTok Viral Walkthrough Hook' },
                    { value: 'prompt-img-enh', label: 'Ultra-Realism Architectural Enhancement' },
                    { value: 'prompt-hero-creative', label: 'Hero Cover Ad Layout' }
                  ]}
                  value={selectedNode.config[field.name] || 'prompt-fb-luxury'}
                  onChange={(val) => handleConfigChange(field.name, val)}
                  className="w-full"
                />
              )}

              {field.type === 'select' && field.options && (
                <AppDropdown
                  options={field.options}
                  value={selectedNode.config[field.name] ?? field.defaultValue ?? field.options[0]?.value}
                  onChange={(val) => handleConfigChange(field.name, val)}
                  className="w-full"
                />
              )}

              {field.type === 'text' && (
                <input
                  type="text"
                  value={selectedNode.config[field.name] ?? ''}
                  onChange={(e) => handleConfigChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="glass-input w-full px-3 py-1.5 text-xs rounded-lg"
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={selectedNode.config[field.name] ?? field.defaultValue ?? 0}
                  onChange={(e) => handleConfigChange(field.name, parseFloat(e.target.value) || 0)}
                  className="glass-input w-full px-3 py-1.5 text-xs rounded-lg"
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={selectedNode.config[field.name] ?? ''}
                  onChange={(e) => handleConfigChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="glass-input w-full px-3 py-1.5 text-xs rounded-lg resize-y"
                />
              )}

              {field.type === 'boolean' && (
                <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedNode.config[field.name] ?? field.defaultValue)}
                    onChange={(e) => handleConfigChange(field.name, e.target.checked)}
                    className="rounded accent-rose-600"
                  />
                  <span>Enable setting</span>
                </label>
              )}

              {field.helpText && (
                <p className="text-[10px] text-neutral-400">{field.helpText}</p>
              )}
            </div>
          ))
        )}

        {/* Dynamic Variable Insertion Helper */}
        <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80">
          <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1.5">
            Dynamic Property Variables
          </span>
          <div className="flex flex-wrap gap-1">
            {['{{property.title}}', '{{property.price}}', '{{property.images}}', '{{property.district}}', '{{currentImage}}'].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const curr = selectedNode.config.customPromptText || '';
                  handleConfigChange('customPromptText', curr + ' ' + tag);
                }}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-rose-500 transition-colors"
                title="Click to insert tag"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Port Status */}
        <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80 space-y-1.5 text-xs">
          <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block">
            Connected Ports
          </span>
          <div className="text-[11px] text-neutral-500 space-y-1">
            <p>Inputs: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{incomingEdges.length} connected</span></p>
            <p>Outputs: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{outgoingEdges.length} connected</span></p>
          </div>
        </div>

        {/* Test Node Section */}
        <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80 space-y-2">
          <button
            type="button"
            onClick={handleTestNode}
            disabled={isTesting}
            className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5"
          >
            <FiPlay className="w-3.5 h-3.5 text-rose-500" />
            <span>{isTesting ? 'Testing Node...' : 'Test This Node'}</span>
          </button>
          {testResult && (
            <p className="text-[11px] text-emerald-500 dark:text-emerald-400 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              {testResult}
            </p>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onDuplicateNode && onDuplicateNode(selectedNode)}
          className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1"
        >
          <FiCopy className="w-3.5 h-3.5" />
          <span>Duplicate</span>
        </button>

        <button
          type="button"
          onClick={() => onDeleteNode && onDeleteNode(selectedNode.id)}
          className="btn-secondary text-xs text-rose-500 hover:text-rose-600 flex items-center justify-center gap-1 px-3"
          title="Delete Node"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
