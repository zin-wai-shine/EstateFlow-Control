// EstateFlow Control - Clean Visual Steps Flow View
// Easy, Non-Confusing Sequential Workflow Editor with One-Click "+ Add Step"
import React, { useState } from 'react';
import { 
  PipelineNode, 
  PipelineEdge, 
  PipelineRun, 
  NodeRuntimeState 
} from '../../types/pipeline';
import { 
  SMART_STEP_TEMPLATES, 
  SmartStepTemplate, 
  instantiateNode 
} from '../../services/nodeRegistry';
import { pipelineEngine } from '../../services/pipelineEngine';
import { 
  FiPlus, 
  FiArrowDown, 
  FiTrash2, 
  FiCopy, 
  FiEdit2, 
  FiPlay, 
  FiPause, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiClock, 
  FiRefreshCw, 
  FiSliders, 
  FiZap, 
  FiImage, 
  FiEdit3, 
  FiLayers, 
  FiStar, 
  FiSend, 
  FiGlobe,
  FiChevronUp,
  FiChevronDown,
  FiEye,
  FiExternalLink
} from 'react-icons/fi';

interface PipelineStepsFlowProps {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodes: (nodes: PipelineNode[]) => void;
  onUpdateEdges: (edges: PipelineEdge[]) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  activeRun?: PipelineRun | null;
  onApproveNode?: (nodeId: string) => void;
  onRetryNode?: (nodeId: string) => void;
  onInspectNodeRun?: (nodeId: string) => void;
}

const STEP_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FiImage,
  FiZap,
  FiEdit3,
  FiLayers,
  FiStar,
  FiCheckCircle,
  FiSend,
  FiGlobe
};

export const PipelineStepsFlow: React.FC<PipelineStepsFlowProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNodes,
  onUpdateEdges,
  onDeleteNode,
  onDuplicateNode,
  activeRun,
  onApproveNode,
  onRetryNode,
  onInspectNodeRun
}) => {
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Helper to get step run state
  const getStepRunState = (nodeId: string): { state: NodeRuntimeState; progress?: string; currentAction?: string; error?: string } => {
    const nr = activeRun?.nodeRuns?.[nodeId] || activeRun?.nodeStates?.[nodeId];
    if (!activeRun || !nr) return { state: 'idle' };
    return {
      state: nr.state || nr.status || 'idle',
      progress: nr.progress ? `${nr.progress.current} / ${nr.progress.total}` : undefined,
      currentAction: nr.currentAction,
      error: nr.errorMessage || nr.error
    };
  };

  // Re-link sequential edges
  const relinkEdges = (newNodes: PipelineNode[]) => {
    const newEdges: PipelineEdge[] = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      const source = newNodes[i];
      const target = newNodes[i + 1];
      newEdges.push({
        id: `e-${source.id}-${target.id}`,
        sourceNodeId: source.id,
        sourcePortId: source.outputs[0]?.id || 'out',
        targetNodeId: target.id,
        targetPortId: target.inputs[0]?.id || 'in',
        dataType: source.outputs[0]?.type || 'any'
      });
    }
    return newEdges;
  };

  // Insert a new smart step
  const handleAddStepFromTemplate = (template: SmartStepTemplate) => {
    const newNode = instantiateNode(template.type, {
      x: 100 + nodes.length * 280,
      y: 200
    });
    newNode.name = template.title;
    newNode.config = { ...newNode.config, ...template.defaultConfig };

    let updatedNodes: PipelineNode[];
    if (insertIndex !== null && insertIndex >= 0 && insertIndex < nodes.length) {
      updatedNodes = [...nodes];
      updatedNodes.splice(insertIndex + 1, 0, newNode);
    } else {
      updatedNodes = [...nodes, newNode];
    }

    onUpdateNodes(updatedNodes);
    onUpdateEdges(relinkEdges(updatedNodes));
    onSelectNode(newNode.id);
    setIsAddModalOpen(false);
    setInsertIndex(null);
  };

  // Move step up / down
  const handleMoveStep = (idx: number, delta: number) => {
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= nodes.length) return;
    const reordered = [...nodes];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(newIdx, 0, moved);

    onUpdateNodes(reordered);
    onUpdateEdges(relinkEdges(reordered));
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-neutral-100/70 dark:bg-neutral-950/80 p-6 md:p-10 flex flex-col items-center">
      {/* Workflow Steps Header Card */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between p-4 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
        <div>
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
            Sequential Step Flow
          </span>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            {nodes.length} Simple Automation Steps
          </h3>
        </div>

        <button
          onClick={() => {
            setInsertIndex(nodes.length - 1);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Step</span>
        </button>
      </div>

      {/* Vertical Steps Chain */}
      <div className="w-full max-w-2xl space-y-4">
        {nodes.map((node, index) => {
          const isSelected = selectedNodeId === node.id;
          const runInfo = getStepRunState(node.id);
          const tmpl = SMART_STEP_TEMPLATES.find(t => t.type === node.type);
          const IconComp = tmpl ? STEP_ICON_MAP[tmpl.iconName] || FiZap : FiZap;

          // Compute status badge & border
          let borderStyle = 'border-neutral-200/80 dark:border-neutral-800';
          let glowStyle = '';
          if (isSelected) {
            borderStyle = 'border-red-500 shadow-lg shadow-red-500/10 ring-2 ring-red-500/20';
          }
          if (runInfo.state === 'running') {
            borderStyle = 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20';
            glowStyle = 'animate-pulse';
          } else if (runInfo.state === 'completed') {
            borderStyle = 'border-emerald-500 shadow-sm';
          } else if (runInfo.state === 'failed') {
            borderStyle = 'border-rose-500 shadow-sm';
          } else if (runInfo.state === 'paused') {
            borderStyle = 'border-amber-500 ring-2 ring-amber-500/30';
          }

          return (
            <React.Fragment key={node.id}>
              {/* Step Card */}
              <div
                onClick={() => onSelectNode(node.id)}
                className={`p-5 rounded-3xl bg-white dark:bg-neutral-900 border transition-all cursor-pointer shadow-sm hover:shadow-md ${borderStyle} ${glowStyle}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Step Left Details */}
                  <div className="flex items-center gap-3.5">
                    {/* Step Number Badge */}
                    <div className="flex flex-col items-center justify-center w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 shrink-0 font-bold text-xs">
                      <span className="text-[9px] uppercase tracking-tighter text-neutral-400 font-semibold leading-tight">
                        STEP
                      </span>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                    </div>

                    {/* Step Icon */}
                    <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500 shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>

                    {/* Titles */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {node.name}
                        </h4>
                        {tmpl?.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium text-[10px]">
                            {tmpl.badge}
                          </span>
                        )}
                      </div>

                      {/* Config summary */}
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {node.config.workerPoolId && (
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            {node.config.workerPoolId} ({node.config.concurrencyLimit || 4}x workers) •{' '}
                          </span>
                        )}
                        {node.config.targetPlatform && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium capitalize">
                            Platform: {node.config.targetPlatform} •{' '}
                          </span>
                        )}
                        {node.config.targetToolName || tmpl?.subtitle || 'Configured automation task.'}
                      </p>

                      {/* Live Runtime Action Banner (Section 19: Real Job Tracking) */}
                      {runInfo.currentAction && runInfo.state === 'running' && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                          <FiRefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-500" />
                          <span>Action: {runInfo.currentAction}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Open Active Tab Button (Section 46) */}
                    {activeRun && runInfo.state === 'running' && (
                      <button
                        onClick={() => {
                          const tabId = node.config.savedTabId || 'tab-enh-1';
                          pipelineEngine.openActiveTab(tabId);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all mr-1"
                        title="Focus active Chrome tab"
                      >
                        <FiExternalLink className="w-3.5 h-3.5" />
                        <span>Open Active Tab</span>
                      </button>
                    )}

                    {/* Live Run Status Pill */}
                    {activeRun && runInfo.state !== 'idle' && (
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                        runInfo.state === 'running' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        runInfo.state === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        runInfo.state === 'failed' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                        runInfo.state === 'paused' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                      }`}>
                        {runInfo.state === 'running' && <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        {runInfo.state === 'completed' && <FiCheckCircle className="w-3.5 h-3.5" />}
                        {runInfo.state === 'failed' && <FiAlertCircle className="w-3.5 h-3.5" />}
                        {runInfo.state === 'paused' && <FiClock className="w-3.5 h-3.5" />}
                        <span className="capitalize">{runInfo.state}</span>
                        {runInfo.progress && (
                          <span className="font-mono text-[10px] ml-1 bg-white/50 dark:bg-neutral-800 px-1 py-0.5 rounded">
                            {runInfo.progress}
                          </span>
                        )}
                      </span>
                    )}

                    {/* Approval Action Button */}
                    {runInfo.state === 'paused' && onApproveNode && (
                      <button
                        onClick={() => onApproveNode(node.id)}
                        className="px-3 py-1 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 shadow-sm transition-colors"
                      >
                        Approve
                      </button>
                    )}

                    {/* Move Step Buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        disabled={index === 0}
                        onClick={() => handleMoveStep(index, -1)}
                        title="Move Up"
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20"
                      >
                        <FiChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={index === nodes.length - 1}
                        onClick={() => handleMoveStep(index, 1)}
                        title="Move Down"
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20"
                      >
                        <FiChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Duplicate */}
                    <button
                      onClick={() => onDuplicateNode(node.id)}
                      title="Duplicate Step"
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteNode(node.id)}
                      title="Delete Step"
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Connecting Flow Arrow + In-between "+ Add Step" */}
              {index < nodes.length - 1 && (
                <div className="flex flex-col items-center justify-center py-1 relative group">
                  <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700" />
                  
                  {/* Subtle Insert Step Button on Hover */}
                  <button
                    onClick={() => {
                      setInsertIndex(index);
                      setIsAddModalOpen(true);
                    }}
                    title="Insert step here"
                    className="absolute z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 shadow-md text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 hover:border-red-500 hover:text-red-500"
                  >
                    <FiPlus className="w-3 h-3" />
                    <span>Insert Step</span>
                  </button>
                  
                  <FiArrowDown className="w-3.5 h-3.5 text-neutral-400 mt-0.5" />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Bottom "+ Add Next Step" Card */}
        <button
          onClick={() => {
            setInsertIndex(nodes.length - 1);
            setIsAddModalOpen(true);
          }}
          className="w-full py-4 rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-500 text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-all flex items-center justify-center gap-2 text-xs font-semibold group bg-white/40 dark:bg-neutral-900/40"
        >
          <div className="p-1 rounded-full bg-neutral-200 dark:bg-neutral-800 group-hover:bg-red-500 group-hover:text-white transition-colors">
            <FiPlus className="w-4 h-4" />
          </div>
          <span>Add Next Automation Step</span>
        </button>
      </div>

      {/* ADD STEP POPUP MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Add Automation Step
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Select a ready-to-run step to add to your workflow.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setInsertIndex(null);
                }}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            {/* List of Smart Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
              {SMART_STEP_TEMPLATES.map(tmpl => {
                const IconComp = STEP_ICON_MAP[tmpl.iconName] || FiZap;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => handleAddStepFromTemplate(tmpl)}
                    className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-red-500/5 hover:border-red-500/40 border border-neutral-200/80 dark:border-neutral-800 text-left transition-all group flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors shrink-0">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {tmpl.title}
                        </h4>
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {tmpl.badge}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
