// EstateFlow Control - Visual Pipeline Builder Workspace
// 3-Panel Layout: Node Library, Interactive Visual Canvas, Selected Node Inspector & Live Runtime Drawer
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Pipeline, 
  PipelineNode, 
  PipelineEdge, 
  PipelineRun, 
  NodeRunResult,
  WorkerPool 
} from '../types/pipeline';
import { 
  pipelineEngine, 
  buildBlankPipeline, 
  DEFAULT_WORKER_POOLS 
} from '../services/pipelineEngine';
import { instantiateNode } from '../services/nodeRegistry';
import { useApp } from '../context/AppContext';
import { NodeLibrary } from '../components/pipeline/NodeLibrary';
import { PipelineCanvas } from '../components/pipeline/PipelineCanvas';
import { PipelineStepsFlow } from '../components/pipeline/PipelineStepsFlow';
import { NodeSettingsPanel } from '../components/pipeline/NodeSettingsPanel';
import { SmartBuildModal } from '../components/pipeline/SmartBuildModal';
import { RunPipelineModal } from '../components/pipeline/RunPipelineModal';
import { 
  FiArrowLeft, 
  FiSave, 
  FiPlay, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiZap, 
  FiRotateCcw, 
  FiRotateCw, 
  FiPause, 
  FiChevronUp, 
  FiChevronDown, 
  FiTerminal, 
  FiEye, 
  FiLayers,
  FiFileText,
  FiCheck,
  FiX,
  FiList,
  FiGitCommit
} from 'react-icons/fi';

export const PipelineBuilder: React.FC = () => {
  const { 
    selectedProcessId, 
    setActivePage, 
    addNotification 
  } = useApp() as any;

  // Active Pipeline State
  const [pipeline, setPipeline] = useState<Pipeline>(() => {
    if (selectedProcessId) {
      const found = pipelineEngine.getPipeline(selectedProcessId);
      if (found) return found;
    }
    const all = pipelineEngine.getPipelines();
    return all[0] || buildBlankPipeline();
  });

  // Selection & History State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flow' | 'canvas'>('flow');
  const [history, setHistory] = useState<Pipeline[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isRecordingHistory = useRef(true);

  // Validation State
  const [validationErrors, setValidationErrors] = useState<{ nodeId?: string; message: string }[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Active Execution State
  const [activeRun, setActiveRun] = useState<PipelineRun | null>(null);
  const [inspectingNodeRunId, setInspectingNodeRunId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'logs' | 'preview' | 'validation'>('logs');

  // Modals
  const [isSmartBuildOpen, setIsSmartBuildOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [previewDataModal, setPreviewDataModal] = useState<{ title: string; data: any } | null>(null);

  // Worker Pools
  const [workerPools, setWorkerPools] = useState<WorkerPool[]>(pipelineEngine.getWorkerPools());

  // Push history on pipeline changes
  const pushHistory = useCallback((newPipeline: Pipeline) => {
    if (!isRecordingHistory.current) return;
    setHistory(prev => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, JSON.parse(JSON.stringify(newPipeline))];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      isRecordingHistory.current = false;
      const prev = history[historyIndex - 1];
      setPipeline(JSON.parse(JSON.stringify(prev)));
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => { isRecordingHistory.current = true; }, 50);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isRecordingHistory.current = false;
      const next = history[historyIndex + 1];
      setPipeline(JSON.parse(JSON.stringify(next)));
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => { isRecordingHistory.current = true; }, 50);
    }
  };

  // Node additions
  const handleAddNode = (nodeType: string) => {
    // Position staggered based on current nodes
    const offset = pipeline.nodes.length * 30;
    const x = 300 + (offset % 300);
    const y = 150 + (offset % 250);
    const newNode = instantiateNode(nodeType, { x, y });

    const updatedNodes = [...pipeline.nodes, newNode];
    const updatedPipeline: Pipeline = {
      ...pipeline,
      nodes: updatedNodes,
      updatedAt: new Date().toISOString()
    };
    setPipeline(updatedPipeline);
    setSelectedNodeId(newNode.id);
    pushHistory(updatedPipeline);
  };

  const handleUpdateNode = (updatedNode: PipelineNode) => {
    const updatedNodes = pipeline.nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
    const updatedPipeline = { ...pipeline, nodes: updatedNodes, updatedAt: new Date().toISOString() };
    setPipeline(updatedPipeline);
    pushHistory(updatedPipeline);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = pipeline.nodes.filter(n => n.id !== nodeId);
    const updatedEdges = pipeline.edges.filter(e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId);
    const updatedPipeline = { ...pipeline, nodes: updatedNodes, edges: updatedEdges, updatedAt: new Date().toISOString() };
    setPipeline(updatedPipeline);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    pushHistory(updatedPipeline);
  };

  const handleDuplicateNode = (nodeId: string) => {
    const target = pipeline.nodes.find(n => n.id === nodeId);
    if (!target) return;
    const copy: PipelineNode = {
      ...JSON.parse(JSON.stringify(target)),
      id: `node-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${target.name} (Copy)`,
      position: { x: target.position.x + 40, y: target.position.y + 40 }
    };
    const updatedPipeline = { ...pipeline, nodes: [...pipeline.nodes, copy], updatedAt: new Date().toISOString() };
    setPipeline(updatedPipeline);
    setSelectedNodeId(copy.id);
    pushHistory(updatedPipeline);
  };

  const handleUpdateNodes = (newNodes: PipelineNode[]) => {
    const updated = { ...pipeline, nodes: newNodes, updatedAt: new Date().toISOString() };
    setPipeline(updated);
  };

  const handleUpdateEdges = (newEdges: PipelineEdge[]) => {
    const updated = { ...pipeline, edges: newEdges, updatedAt: new Date().toISOString() };
    setPipeline(updated);
    pushHistory(updated);
  };

  // Validate pipeline
  const handleValidate = () => {
    setIsValidating(true);
    const result = pipelineEngine.validatePipeline(pipeline);
    setValidationErrors(result.errors);
    if (!result.isValid) {
      setIsDrawerOpen(true);
      setDrawerTab('validation');
    } else {
      addNotification?.('success', 'Pipeline Valid', 'All node connections and requirements are valid.');
    }
    setIsValidating(false);
  };

  // Save Pipeline
  const handleSave = () => {
    pipelineEngine.savePipeline(pipeline);
    addNotification?.('success', 'Pipeline Saved', `"${pipeline.name}" saved successfully.`);
  };

  // Run execution listener
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeRun && activeRun.status === 'running') {
        const freshRun = pipelineEngine.getRun(activeRun.id);
        if (freshRun) {
          setActiveRun({ ...freshRun });
        }
      }
    }, 400);
    return () => clearInterval(interval);
  }, [activeRun]);

  const handleLaunchRun = (runId: string) => {
    const run = pipelineEngine.getRun(runId);
    if (run) {
      setActiveRun(run);
      setIsDrawerOpen(true);
      setDrawerTab('logs');
    }
  };

  const handleApproveNode = (nodeId: string) => {
    if (activeRun) {
      pipelineEngine.approveNode(activeRun.id, nodeId);
      const updated = pipelineEngine.getRun(activeRun.id);
      if (updated) setActiveRun({ ...updated });
    }
  };

  const handlePauseResume = () => {
    if (!activeRun) return;
    if (activeRun.status === 'running') {
      pipelineEngine.pausePipeline(activeRun.id);
    } else if (activeRun.status === 'paused') {
      pipelineEngine.resumePipeline(activeRun.id);
    }
    const updated = pipelineEngine.getRun(activeRun.id);
    if (updated) setActiveRun({ ...updated });
  };

  const handleCancelRun = () => {
    if (!activeRun) return;
    pipelineEngine.cancelPipeline(activeRun.id);
    const updated = pipelineEngine.getRun(activeRun.id);
    if (updated) setActiveRun({ ...updated });
  };

  const selectedNode = pipeline.nodes.find(n => n.id === selectedNodeId) || null;
  const inspectedNodeRun: NodeRunResult | undefined = inspectingNodeRunId && activeRun 
    ? (activeRun.nodeRuns?.[inspectingNodeRunId] || activeRun.nodeStates?.[inspectingNodeRunId]) 
    : undefined;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-900 select-none">
      {/* Top Navbar */}
      <div className="h-14 px-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between z-30 shrink-0">
        {/* Left: Back & Pipeline Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('pipelines')}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Back to Pipelines"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={pipeline.name}
              onChange={(e) => setPipeline({ ...pipeline, name: e.target.value })}
              className="text-sm font-bold text-neutral-900 dark:text-white bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/60 focus:bg-neutral-100 dark:focus:bg-neutral-800 px-2 py-1 rounded-lg border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 outline-none transition-all w-56 md:w-72"
            />
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium">
              {pipeline.version}
            </span>
            <select
              value={pipeline.status}
              onChange={(e) => setPipeline({ ...pipeline, status: e.target.value as any })}
              className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Center: Live Run Banner (if running or completed) */}
        {activeRun && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                activeRun.status === 'running' ? 'bg-blue-500 animate-pulse' :
                activeRun.status === 'completed' ? 'bg-emerald-500' :
                activeRun.status === 'failed' ? 'bg-rose-500' :
                activeRun.status === 'paused' ? 'bg-amber-500' : 'bg-neutral-400'
              }`} />
              <span className="font-semibold capitalize text-neutral-800 dark:text-neutral-200">
                Run: {activeRun.status}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              {activeRun.status === 'running' && (
                <button
                  onClick={handlePauseResume}
                  className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-500/20"
                >
                  Pause
                </button>
              )}
              {activeRun.status === 'paused' && (
                <button
                  onClick={handlePauseResume}
                  className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-500/20"
                >
                  Resume
                </button>
              )}
              {(activeRun.status === 'running' || activeRun.status === 'paused') && (
                <button
                  onClick={handleCancelRun}
                  className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-500/20"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  setIsDrawerOpen(true);
                  setDrawerTab('logs');
                }}
                className="px-2 py-0.5 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                Logs
              </button>
            </div>
          </div>
        )}

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Steps Flow vs Canvas */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60 mr-1">
            <button
              onClick={() => setViewMode('flow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'flow'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Clean Step-by-Step Flow (Zero Wire Dragging)"
            >
              <FiList className="w-3.5 h-3.5 text-red-500" />
              <span>Steps Flow</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">Easy</span>
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'canvas'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Freeform Node Canvas"
            >
              <FiGitCommit className="w-3.5 h-3.5 text-purple-500" />
              <span>Canvas</span>
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo"
              className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 transition-colors"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
              className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 transition-colors"
            >
              <FiRotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Validate */}
          <button
            onClick={handleValidate}
            title="Validate Pipeline Connections"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Validate</span>
          </button>

          {/* Smart Build */}
          <button
            onClick={() => setIsSmartBuildOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-500/20 transition-all"
          >
            <FiZap className="w-3.5 h-3.5 text-purple-500" />
            <span>Smart Build</span>
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm transition-all"
          >
            <FiSave className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          {/* Run Pipeline */}
          <button
            onClick={() => setIsRunModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all"
          >
            <FiPlay className="w-3.5 h-3.5 ml-0.5" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* 3-Panel Visual Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANEL: Node Library */}
        <NodeLibrary onAddNode={handleAddNode} />

        {/* CENTER PANEL: Flow View or Canvas */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {viewMode === 'flow' ? (
            <PipelineStepsFlow
              nodes={pipeline.nodes}
              edges={pipeline.edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={(nodeId) => {
                setSelectedNodeId(nodeId);
                if (nodeId && (activeRun?.nodeRuns?.[nodeId] || activeRun?.nodeStates?.[nodeId])) {
                  setInspectingNodeRunId(nodeId);
                }
              }}
              onUpdateNodes={handleUpdateNodes}
              onUpdateEdges={handleUpdateEdges}
              onDeleteNode={handleDeleteNode}
              onDuplicateNode={handleDuplicateNode}
              activeRun={activeRun}
              onApproveNode={handleApproveNode}
              onRetryNode={(nodeId) => {
                if (activeRun) {
                  handleLaunchRun(activeRun.id);
                }
              }}
              onInspectNodeRun={(nodeId) => {
                setInspectingNodeRunId(nodeId);
                setIsDrawerOpen(true);
                setDrawerTab('preview');
              }}
            />
          ) : (
            <PipelineCanvas
              nodes={pipeline.nodes}
              edges={pipeline.edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={(nodeId) => {
                setSelectedNodeId(nodeId);
                if (nodeId && (activeRun?.nodeRuns?.[nodeId] || activeRun?.nodeStates?.[nodeId])) {
                  setInspectingNodeRunId(nodeId);
                }
              }}
              onUpdateNodes={handleUpdateNodes}
              onUpdateEdges={handleUpdateEdges}
              onDeleteNode={handleDeleteNode}
              onDuplicateNode={handleDuplicateNode}
              activeRun={activeRun}
              onApproveNode={handleApproveNode}
              onRetryNode={(nodeId) => {
                if (activeRun) {
                  handleLaunchRun(activeRun.id);
                }
              }}
              onInspectNodeRun={(nodeId) => {
                setInspectingNodeRunId(nodeId);
                setIsDrawerOpen(true);
                setDrawerTab('preview');
              }}
            />
          )}

          {/* Bottom Runtime / Validation Drawer */}
          <div className={`transition-all duration-200 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 z-20 flex flex-col ${
            isDrawerOpen ? 'h-64' : 'h-8'
          }`}>
            {/* Drawer Header Toggle Bar */}
            <div 
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="h-8 px-4 flex items-center justify-between cursor-pointer border-b border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDrawerOpen(true);
                    setDrawerTab('logs');
                  }}
                  className={`font-semibold flex items-center gap-1.5 ${
                    drawerTab === 'logs' ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'
                  }`}
                >
                  <FiTerminal className="w-3.5 h-3.5" />
                  <span>Execution Logs ({activeRun?.logs?.length || 0})</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDrawerOpen(true);
                    setDrawerTab('preview');
                  }}
                  className={`font-semibold flex items-center gap-1.5 ${
                    drawerTab === 'preview' ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'
                  }`}
                >
                  <FiEye className="w-3.5 h-3.5" />
                  <span>Live Data Inspector</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDrawerOpen(true);
                    setDrawerTab('validation');
                  }}
                  className={`font-semibold flex items-center gap-1.5 ${
                    drawerTab === 'validation' ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'
                  }`}
                >
                  <FiAlertCircle className={`w-3.5 h-3.5 ${validationErrors.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
                  <span>Validation ({validationErrors.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                <span>{isDrawerOpen ? 'Collapse' : 'Expand'}</span>
                {isDrawerOpen ? <FiChevronDown className="w-3.5 h-3.5" /> : <FiChevronUp className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* Drawer Body Content */}
            {isDrawerOpen && (
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                {drawerTab === 'logs' && (
                  <div className="space-y-1 text-neutral-600 dark:text-neutral-300">
                    {activeRun?.logs && activeRun.logs.length > 0 ? (
                      activeRun.logs.map((log: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 py-0.5 border-b border-neutral-100 dark:border-neutral-800/40">
                          <span className="text-neutral-400 text-[10px] shrink-0 font-sans">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`text-[10px] uppercase font-bold shrink-0 ${
                            log.level === 'error' ? 'text-rose-500' :
                            log.level === 'warn' ? 'text-amber-500' : 'text-blue-500'
                          }`}>
                            [{log.level}]
                          </span>
                          <span className="break-all">{log.message}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-neutral-400 italic py-4 text-center">
                        No active logs. Click "Run" to trigger dynamic pipeline graph execution.
                      </div>
                    )}
                  </div>
                )}

                {drawerTab === 'preview' && (
                  <div className="space-y-3 font-sans">
                    {inspectedNodeRun ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                            Node: {inspectedNodeRun.nodeId}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            (inspectedNodeRun.state || inspectedNodeRun.status) === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                            (inspectedNodeRun.state || inspectedNodeRun.status) === 'running' ? 'bg-blue-500/10 text-blue-500' :
                            (inspectedNodeRun.state || inspectedNodeRun.status) === 'failed' ? 'bg-rose-500/10 text-rose-500' : 'bg-neutral-100'
                          }`}>
                            {inspectedNodeRun.state || inspectedNodeRun.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <span className="font-semibold text-xs text-neutral-500 block mb-1">Inputs:</span>
                            <pre className="text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-32 text-neutral-700 dark:text-neutral-300">
                              {JSON.stringify(inspectedNodeRun.inputData || inspectedNodeRun.inputs, null, 2)}
                            </pre>
                          </div>
                          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-xs text-neutral-500">Outputs:</span>
                              {(inspectedNodeRun.outputData || inspectedNodeRun.outputs) && (
                                <button
                                  onClick={() => setPreviewDataModal({ title: `Output: ${inspectedNodeRun.nodeId}`, data: inspectedNodeRun.outputData || inspectedNodeRun.outputs })}
                                  className="text-[10px] text-red-500 font-semibold hover:underline"
                                >
                                  View Full Output
                                </button>
                              )}
                            </div>
                            <pre className="text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-32 text-neutral-700 dark:text-neutral-300">
                              {JSON.stringify(inspectedNodeRun.outputData || inspectedNodeRun.outputs, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-neutral-400 italic py-4 text-center">
                        Select a running node from the canvas to preview inputs, outputs, and live variables.
                      </div>
                    )}
                  </div>
                )}

                {drawerTab === 'validation' && (
                  <div className="space-y-2 font-sans">
                    {validationErrors.length > 0 ? (
                      validationErrors.map((err, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                          <FiAlertCircle className="w-4 h-4 shrink-0" />
                          <span>{err.message}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-emerald-500 flex items-center gap-2 py-4 justify-center font-medium">
                        <FiCheckCircle className="w-4 h-4" />
                        <span>All pipeline connections and node schemas are valid.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Selected Node Settings Inspector */}
        <NodeSettingsPanel
          selectedNode={selectedNode}
          node={selectedNode}
          edges={pipeline.edges}
          workerPools={workerPools}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={(n) => handleDuplicateNode(n.id)}
          onClose={() => setSelectedNodeId(null)}
          onTestNode={(node: PipelineNode) => {
            addNotification?.('info', 'Node Test', `Executing isolated test on node "${node.name}"...`);
          }}
        />
      </div>

      {/* Smart Build Modal */}
      <SmartBuildModal
        isOpen={isSmartBuildOpen}
        onClose={() => setIsSmartBuildOpen(false)}
        onPipelineGenerated={(generated) => {
          setPipeline(generated);
          pushHistory(generated);
          setSelectedNodeId(null);
        }}
      />

      {/* Run Pipeline Modal */}
      <RunPipelineModal
        pipeline={pipeline}
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onLaunched={handleLaunchRun}
      />

      {/* Output Data Full Viewer Modal */}
      {previewDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {previewDataModal.title}
              </h3>
              <button
                onClick={() => setPreviewDataModal(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-950 font-mono text-xs text-neutral-800 dark:text-neutral-200 max-h-96 overflow-y-auto whitespace-pre-wrap">
              {JSON.stringify(previewDataModal.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
