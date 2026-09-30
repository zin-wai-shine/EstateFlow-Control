// EstateFlow Control - Visual Dynamic Pipeline Canvas
// Clean Glassmorphic Node Graph with SVG Cubic Beziers, Port Typing, and Live Execution States
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  PipelineNode, 
  PipelineEdge, 
  NodePort, 
  NodeRuntimeState, 
  PipelineRun,
  PortDataType 
} from '../../types/pipeline';
import { arePortsCompatible, getNodeDefinition } from '../../services/nodeRegistry';
import { 
  FiTrash2, 
  FiCopy, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiClock, 
  FiPlay, 
  FiPause, 
  FiRefreshCw, 
  FiMaximize, 
  FiPlus, 
  FiMinus,
  FiSliders,
  FiEye,
  FiCornerDownRight,
  FiActivity
} from 'react-icons/fi';

interface PipelineCanvasProps {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodes: (nodes: PipelineNode[]) => void;
  onUpdateEdges: (edges: PipelineEdge[]) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  // Live run state (optional, passed when inspecting or executing a run)
  activeRun?: PipelineRun | null;
  onApproveNode?: (nodeId: string) => void;
  onRetryNode?: (nodeId: string) => void;
  onInspectNodeRun?: (nodeId: string) => void;
  isReadOnly?: boolean;
}

interface DragState {
  type: 'node' | 'pan' | 'port_connect';
  nodeId?: string;
  sourcePort?: { nodeId: string; port: NodePort };
  startX: number;
  startY: number;
  initialNodePos?: { x: number; y: number };
  currentX: number;
  currentY: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  input: { bg: 'bg-emerald-500/10', text: 'text-emerald-500 dark:text-emerald-400', border: 'border-emerald-500/30', accent: '#10b981' },
  browser: { bg: 'bg-blue-500/10', text: 'text-blue-500 dark:text-blue-400', border: 'border-blue-500/30', accent: '#3b82f6' },
  chat_ai: { bg: 'bg-purple-500/10', text: 'text-purple-500 dark:text-purple-400', border: 'border-purple-500/30', accent: '#a855f7' },
  file: { bg: 'bg-amber-500/10', text: 'text-amber-500 dark:text-amber-400', border: 'border-amber-500/30', accent: '#f59e0b' },
  data: { bg: 'bg-cyan-500/10', text: 'text-cyan-500 dark:text-cyan-400', border: 'border-cyan-500/30', accent: '#06b6d4' },
  flow: { bg: 'bg-orange-500/10', text: 'text-orange-500 dark:text-orange-400', border: 'border-orange-500/30', accent: '#f97316' },
  media: { bg: 'bg-rose-500/10', text: 'text-rose-500 dark:text-rose-400', border: 'border-rose-500/30', accent: '#f43f5e' },
  output: { bg: 'bg-red-500/10', text: 'text-red-500 dark:text-red-400', border: 'border-red-500/30', accent: '#ef4444' }
};

const PORT_TYPE_COLORS: Record<PortDataType, string> = {
  any: '#94a3b8',
  property: '#10b981',
  image: '#f43f5e',
  image_collection: '#ec4899',
  file: '#f59e0b',
  file_collection: '#d97706',
  text: '#06b6d4',
  prompt: '#8b5cf6',
  url: '#3b82f6',
  boolean: '#14b8a6',
  number: '#6366f1',
  browser_session: '#2563eb',
  browser_tab: '#0284c7',
  job_result: '#84cc16'
};

const NODE_WIDTH = 260;

export const PipelineCanvas: React.FC<PipelineCanvasProps> = ({
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
  onInspectNodeRun,
  isReadOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Pan and Zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 80 });
  const [zoom, setZoom] = useState<number>(1);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredPort, setHoveredPort] = useState<{ nodeId: string; portId: string; isInput: boolean } | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Calculate Port Absolute Coordinates on Canvas
  const getPortPosition = useCallback((node: PipelineNode, portId: string, isInput: boolean) => {
    const portList = isInput ? node.inputs : node.outputs;
    const portIndex = portList.findIndex(p => p.id === portId);
    const safeIndex = portIndex >= 0 ? portIndex : 0;
    
    // Header height is roughly 48px, ports start after header with 28px spacing
    const yOffset = 56 + (safeIndex * 26);
    const x = isInput ? node.position.x : node.position.x + NODE_WIDTH;
    const y = node.position.y + yOffset;
    return { x, y };
  }, []);

  // Center or Fit Canvas
  const fitView = useCallback(() => {
    if (nodes.length === 0) {
      setPan({ x: 80, y: 80 });
      setZoom(1);
      return;
    }
    const minX = Math.min(...nodes.map(n => n.position.x));
    const maxX = Math.max(...nodes.map(n => n.position.x + NODE_WIDTH));
    const minY = Math.min(...nodes.map(n => n.position.y));
    const maxY = Math.max(...nodes.map(n => n.position.y + 200));

    const containerWidth = containerRef.current?.clientWidth || 1000;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const graphWidth = maxX - minX + 160;
    const graphHeight = maxY - minY + 160;

    const scaleX = containerWidth / graphWidth;
    const scaleY = containerHeight / graphHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.2);

    setZoom(newZoom);
    setPan({
      x: (containerWidth - (maxX + minX) * newZoom) / 2,
      y: (containerHeight - (maxY + minY) * newZoom) / 2
    });
  }, [nodes]);

  // Handle Zoom In/Out
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.4), 2.0));
  };

  // Dragging Handlers
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains('canvas-background')) {
      return;
    }
    // Deselect if clicking canvas background
    onSelectNode(null);
    setDragState({
      type: 'pan',
      startX: e.clientX - pan.x,
      startY: e.clientY - pan.y,
      currentX: e.clientX,
      currentY: e.clientY
    });
  };

  const handleMouseDownNode = (e: React.MouseEvent, node: PipelineNode) => {
    e.stopPropagation();
    if (isReadOnly) return;
    onSelectNode(node.id);
    setDragState({
      type: 'node',
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      initialNodePos: { ...node.position },
      currentX: e.clientX,
      currentY: e.clientY
    });
  };

  const handleMouseDownPort = (e: React.MouseEvent, node: PipelineNode, port: NodePort, isInput: boolean) => {
    e.stopPropagation();
    if (isReadOnly || isInput) return; // Only drag outwards from output ports
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      type: 'port_connect',
      sourcePort: { nodeId: node.id, port },
      startX: e.clientX,
      startY: e.clientY,
      currentX: (e.clientX - rect.left - pan.x) / zoom,
      currentY: (e.clientY - rect.top - pan.y) / zoom
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;

    if (dragState.type === 'pan') {
      setPan({
        x: e.clientX - dragState.startX,
        y: e.clientY - dragState.startY
      });
    } else if (dragState.type === 'node' && dragState.nodeId && dragState.initialNodePos) {
      const dx = (e.clientX - dragState.startX) / zoom;
      const dy = (e.clientY - dragState.startY) / zoom;

      const updated = nodes.map(n => {
        if (n.id === dragState.nodeId) {
          return {
            ...n,
            position: {
              x: Math.round((dragState.initialNodePos!.x + dx) / 10) * 10,
              y: Math.round((dragState.initialNodePos!.y + dy) / 10) * 10
            }
          };
        }
        return n;
      });
      onUpdateNodes(updated);
    } else if (dragState.type === 'port_connect') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDragState(prev => prev ? ({
        ...prev,
        currentX: (e.clientX - rect.left - pan.x) / zoom,
        currentY: (e.clientY - rect.top - pan.y) / zoom
      }) : null);
    }
  }, [dragState, pan, zoom, nodes, onUpdateNodes]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState) return;

    if (dragState.type === 'port_connect' && dragState.sourcePort) {
      // Check if dropped onto a valid input port
      if (hoveredPort && hoveredPort.isInput && hoveredPort.nodeId !== dragState.sourcePort.nodeId) {
        const targetNode = nodes.find(n => n.id === hoveredPort.nodeId);
        const targetPort = targetNode?.inputs.find(p => p.id === hoveredPort.portId);
        const sourcePort = dragState.sourcePort.port;

        if (targetPort && arePortsCompatible(sourcePort.type, targetPort.type)) {
          // Check if edge already exists
          const exists = edges.some(
            ed => ed.sourceNodeId === dragState.sourcePort!.nodeId &&
                  ed.sourcePortId === sourcePort.id &&
                  ed.targetNodeId === targetNode!.id &&
                  ed.targetPortId === targetPort.id
          );
          if (!exists) {
            const newEdge: PipelineEdge = {
              id: `edge-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
              sourceNodeId: dragState.sourcePort.nodeId,
              sourcePortId: sourcePort.id,
              targetNodeId: targetNode!.id,
              targetPortId: targetPort.id,
              dataType: sourcePort.type
            };
            onUpdateEdges([...edges, newEdge]);
          }
        }
      }
    }

    setDragState(null);
  }, [dragState, hoveredPort, nodes, edges, onUpdateEdges]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Remove Edge
  const handleRemoveEdge = (edgeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    onUpdateEdges(edges.filter(ed => ed.id !== edgeId));
  };

  // Node Runtime State helpers
  const getNodeRunState = (nodeId: string): { state: NodeRuntimeState; message?: string; progress?: string; error?: string } => {
    const nr = activeRun?.nodeRuns?.[nodeId] || activeRun?.nodeStates?.[nodeId];
    if (!activeRun || !nr) {
      return { state: 'idle' };
    }
    return {
      state: nr.state || nr.status || 'idle',
      message: nr.outputData?.message || nr.outputs?.message || (nr.attempts && nr.attempts > 1 ? `Attempt ${nr.attempts}` : undefined),
      progress: nr.progress ? `${nr.progress.current} / ${nr.progress.total}` : undefined,
      error: nr.errorMessage || nr.error
    };
  };

  // Render Bezier Curve between two points
  const renderCubicBezier = (
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number, 
    color = '#ef4444', 
    isAnimated = false, 
    edgeId?: string
  ) => {
    const dx = Math.abs(x2 - x1) * 0.55;
    const curvature = Math.max(dx, 40);
    const pathData = `M ${x1} ${y1} C ${x1 + curvature} ${y1}, ${x2 - curvature} ${y2}, ${x2} ${y2}`;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const isHovered = edgeId && hoveredEdgeId === edgeId;

    return (
      <g key={edgeId || `${x1}-${y1}-${x2}-${y2}`} className="transition-all duration-150">
        {/* Wider transparent hit-area for easier hover / clicking */}
        {edgeId && !isReadOnly && (
          <path
            d={pathData}
            fill="none"
            stroke="transparent"
            strokeWidth={14}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredEdgeId(edgeId)}
            onMouseLeave={() => setHoveredEdgeId(null)}
            onClick={(e) => handleRemoveEdge(edgeId, e)}
          />
        )}
        <path
          d={pathData}
          fill="none"
          stroke={isHovered ? '#f43f5e' : color}
          strokeWidth={isHovered ? 3 : 2}
          strokeDasharray={isAnimated ? '5,5' : undefined}
          className={`${isAnimated ? 'animate-pulse' : ''} transition-colors`}
          style={{
            filter: isHovered ? 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.6))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
          }}
        />
        {/* Interactive edge delete pill on hover */}
        {isHovered && edgeId && !isReadOnly && (
          <g 
            transform={`translate(${midX}, ${midY})`} 
            className="cursor-pointer"
            onClick={(e) => handleRemoveEdge(edgeId, e)}
          >
            <circle r={10} fill="#f43f5e" className="shadow-md hover:fill-red-600 transition-colors" />
            <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDownCanvas}
      className="relative w-full h-full overflow-hidden bg-neutral-100/70 dark:bg-neutral-950/80 canvas-background cursor-grab active:cursor-grabbing select-none"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(160, 160, 160, 0.15) 1px, transparent 1px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`
      }}
    >
      {/* Zoom & Canvas Controls Floating Toolbar */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/70 dark:border-neutral-800 shadow-lg">
        <button
          onClick={() => handleZoom(0.1)}
          title="Zoom In"
          className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
        </button>
        <span className="px-2 text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => handleZoom(-0.1)}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
        >
          <FiMinus className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5" />
        <button
          onClick={fitView}
          title="Fit Canvas to Content"
          className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
        >
          <FiMaximize className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Connections Layer */}
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {/* Render Established Edges */}
        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.sourceNodeId);
          const targetNode = nodes.find(n => n.id === edge.targetNodeId);
          if (!sourceNode || !targetNode) return null;

          const p1 = getPortPosition(sourceNode, edge.sourcePortId, false);
          const p2 = getPortPosition(targetNode, edge.targetPortId, true);
          
          const sourceRun = activeRun?.nodeRuns?.[sourceNode.id] || activeRun?.nodeStates?.[sourceNode.id];
          const isEdgeRunning = sourceRun?.state === 'running' || sourceRun?.status === 'running';
          const edgeColor = edge.dataType ? PORT_TYPE_COLORS[edge.dataType] : '#ef4444';

          return renderCubicBezier(p1.x, p1.y, p2.x, p2.y, edgeColor, isEdgeRunning, edge.id);
        })}

        {/* Render Active Connection Line while Dragging from Output Port */}
        {dragState?.type === 'port_connect' && dragState.sourcePort && (
          (() => {
            const node = nodes.find(n => n.id === dragState.sourcePort!.nodeId);
            if (!node) return null;
            const p1 = getPortPosition(node, dragState.sourcePort.port.id, false);
            const portColor = PORT_TYPE_COLORS[dragState.sourcePort.port.type] || '#ef4444';
            return renderCubicBezier(p1.x, p1.y, dragState.currentX, dragState.currentY, portColor, true);
          })()
        )}
      </svg>

      {/* Transform Container for Nodes */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-auto"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {nodes.map(node => {
          const isSelected = selectedNodeId === node.id;
          const runInfo = getNodeRunState(node.id);
          const def = getNodeDefinition(node.type);
          const catColor = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.flow;

          // Compute status border/ring styles
          let statusStyle = 'border-neutral-200/80 dark:border-neutral-800';
          let statusGlow = '';
          if (isSelected) {
            statusStyle = 'border-red-500 shadow-lg shadow-red-500/10 ring-2 ring-red-500/20';
          }
          if (runInfo.state === 'running') {
            statusStyle = 'border-blue-500 animate-pulse ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20';
          } else if (runInfo.state === 'completed') {
            statusStyle = 'border-emerald-500 shadow-md shadow-emerald-500/10';
          } else if (runInfo.state === 'failed') {
            statusStyle = 'border-rose-500 shadow-md shadow-rose-500/20';
          } else if (runInfo.state === 'paused') {
            statusStyle = 'border-amber-500 animate-pulse ring-2 ring-amber-500/30';
          }

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleMouseDownNode(e, node)}
              className={`absolute rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border transition-shadow cursor-default ${statusStyle}`}
              style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                width: `${NODE_WIDTH}px`,
                opacity: node.isEnabled === false ? 0.55 : 1
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-neutral-100 dark:border-neutral-800/80">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={`p-1.5 rounded-lg ${catColor.bg} ${catColor.text}`}>
                    <FiSliders className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                      {node.name}
                    </h4>
                    <span className="text-[10px] text-neutral-400 capitalize block leading-tight">
                      {node.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Node Quick Actions when selected */}
                {isSelected && !isReadOnly && (
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateNode(node.id);
                      }}
                      title="Duplicate"
                      className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNode(node.id);
                      }}
                      title="Delete Node"
                      className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Node Summary / Config Pill Preview */}
              <div className="px-3 py-2 text-[11px] text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/40">
                {node.config.workerPoolId && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-neutral-400">Pool:</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-medium">
                      {node.config.workerPoolId}
                    </span>
                  </div>
                )}
                {node.config.browserProfileId && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-neutral-400">Browser:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 truncate max-w-[130px]">
                      {node.config.browserProfileId}
                    </span>
                  </div>
                )}
                {node.config.concurrencyLimit && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-neutral-400">Parallel Limit:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {node.config.concurrencyLimit} workers
                    </span>
                  </div>
                )}
                {node.config.targetPlatform && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-neutral-400">Platform:</span>
                    <span className="font-medium uppercase text-neutral-700 dark:text-neutral-300">
                      {node.config.targetPlatform}
                    </span>
                  </div>
                )}
                {/* Fallback description */}
                {!node.config.workerPoolId && !node.config.browserProfileId && !node.config.concurrencyLimit && !node.config.targetPlatform && (
                  <p className="line-clamp-1 italic text-[10px] text-neutral-400">
                    {def?.description || 'Connect inputs and configure options.'}
                  </p>
                )}
              </div>

              {/* Ports Section: Left (Inputs) and Right (Outputs) */}
              <div className="p-3 flex justify-between gap-2 relative">
                {/* Inputs Column */}
                <div className="flex flex-col gap-2">
                  {node.inputs.map(port => {
                    const portColor = PORT_TYPE_COLORS[port.type] || '#94a3b8';
                    const isHovered = hoveredPort?.nodeId === node.id && hoveredPort?.portId === port.id;
                    const isCompatible = dragState?.type === 'port_connect' && dragState.sourcePort 
                      ? arePortsCompatible(dragState.sourcePort.port.type, port.type)
                      : null;

                    return (
                      <div 
                        key={port.id} 
                        className="flex items-center gap-1.5 relative group"
                        onMouseEnter={() => setHoveredPort({ nodeId: node.id, portId: port.id, isInput: true })}
                        onMouseLeave={() => setHoveredPort(null)}
                      >
                        <div
                          className={`w-3 h-3 rounded-full border-2 transition-transform duration-150 cursor-pointer ${
                            isCompatible === true ? 'ring-4 ring-emerald-500/30 scale-125' : 
                            isCompatible === false ? 'opacity-30' : ''
                          }`}
                          style={{
                            backgroundColor: isHovered ? portColor : '#ffffff',
                            borderColor: portColor
                          }}
                        />
                        <span className="text-[10px] text-neutral-600 dark:text-neutral-300 truncate max-w-[90px]">
                          {port.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Outputs Column */}
                <div className="flex flex-col gap-2 items-end ml-auto">
                  {node.outputs.map(port => {
                    const portColor = PORT_TYPE_COLORS[port.type] || '#94a3b8';
                    const isHovered = hoveredPort?.nodeId === node.id && hoveredPort?.portId === port.id;

                    return (
                      <div 
                        key={port.id} 
                        className="flex items-center gap-1.5 relative group cursor-pointer"
                        onMouseDown={(e) => handleMouseDownPort(e, node, port, false)}
                        onMouseEnter={() => setHoveredPort({ nodeId: node.id, portId: port.id, isInput: false })}
                        onMouseLeave={() => setHoveredPort(null)}
                      >
                        <span className="text-[10px] text-neutral-600 dark:text-neutral-300 truncate max-w-[90px] text-right">
                          {port.label}
                        </span>
                        <div
                          className="w-3 h-3 rounded-full border-2 transition-transform duration-150 hover:scale-125"
                          style={{
                            backgroundColor: isHovered ? portColor : '#ffffff',
                            borderColor: portColor
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Run Status Footer (When pipeline is running) */}
              {activeRun && runInfo.state !== 'idle' && (
                <div className={`px-3 py-2 rounded-b-2xl border-t text-[11px] flex items-center justify-between ${
                  runInfo.state === 'running' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' :
                  runInfo.state === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                  runInfo.state === 'failed' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
                  runInfo.state === 'paused' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
                  'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}>
                  <div className="flex items-center gap-1.5 truncate">
                    {runInfo.state === 'running' && <FiRefreshCw className="w-3 h-3 animate-spin shrink-0" />}
                    {runInfo.state === 'completed' && <FiCheckCircle className="w-3 h-3 shrink-0" />}
                    {runInfo.state === 'failed' && <FiAlertCircle className="w-3 h-3 shrink-0" />}
                    {runInfo.state === 'paused' && <FiClock className="w-3 h-3 shrink-0" />}
                    <span className="font-medium capitalize text-[10px]">
                      {runInfo.state}
                    </span>
                    {runInfo.progress && (
                      <span className="font-mono text-[9px] bg-blue-500/20 px-1 py-0.5 rounded">
                        {runInfo.progress}
                      </span>
                    )}
                  </div>

                  {/* Manual Approval Action */}
                  {runInfo.state === 'paused' && onApproveNode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApproveNode(node.id);
                      }}
                      className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                    >
                      Approve
                    </button>
                  )}

                  {/* Retry Action */}
                  {runInfo.state === 'failed' && onRetryNode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetryNode(node.id);
                      }}
                      className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-semibold hover:bg-rose-600 transition-colors shadow-sm"
                    >
                      Retry
                    </button>
                  )}

                  {/* Inspect Details button */}
                  {onInspectNodeRun && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectNodeRun(node.id);
                      }}
                      title="Inspect Node Run Data"
                      className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <FiEye className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
