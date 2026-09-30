// EstateFlow Control - Pipelines Dashboard Page
// Replaces fixed processes with dynamic automation workflow management
import React, { useState, useEffect } from 'react';
import { Pipeline, WorkerPool } from '../types/pipeline';
import { pipelineEngine, buildBlankPipeline, DEFAULT_WORKER_POOLS } from '../services/pipelineEngine';
import { useApp } from '../context/AppContext';
import { SmartBuildModal } from '../components/pipeline/SmartBuildModal';
import { RunPipelineModal } from '../components/pipeline/RunPipelineModal';
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiZap, 
  FiDownload, 
  FiUpload, 
  FiPlay, 
  FiEdit3, 
  FiCopy, 
  FiTrash2, 
  FiLayers, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiClock, 
  FiSliders,
  FiFileText,
  FiFolder,
  FiUsers,
  FiCornerDownRight,
  FiRefreshCw
} from 'react-icons/fi';

export const Pipelines: React.FC = () => {
  const { openProcessBuilder, openPipelineBuilder } = useApp() as any;
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [workerPools, setWorkerPools] = useState<WorkerPool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [activeTab, setActiveTab] = useState<'pipelines' | 'worker_pools' | 'templates'>('pipelines');

  // Modals state
  const [isSmartBuildOpen, setIsSmartBuildOpen] = useState(false);
  const [pipelineToRun, setPipelineToRun] = useState<Pipeline | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [missingResourcesAlert, setMissingResourcesAlert] = useState<string[]>([]);

  // Worker Pool modal state
  const [isNewPoolModalOpen, setIsNewPoolModalOpen] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDesc, setNewPoolDesc] = useState('');
  const [newPoolConcurrency, setNewPoolConcurrency] = useState(4);

  const loadData = () => {
    setPipelines(pipelineEngine.getPipelines(true));
    setWorkerPools(pipelineEngine.getWorkerPools());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenBuilder = (pipelineId?: string) => {
    if (openPipelineBuilder) {
      openPipelineBuilder(pipelineId);
    } else if (openProcessBuilder) {
      openProcessBuilder(pipelineId);
    }
  };

  const handleCreateBlankPipeline = () => {
    const blank = buildBlankPipeline();
    pipelineEngine.savePipeline(blank);
    loadData();
    handleOpenBuilder(blank.id);
  };

  const handleDuplicatePipeline = (pipeline: Pipeline) => {
    const copy: Pipeline = {
      ...JSON.parse(JSON.stringify(pipeline)),
      id: `pipe-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${pipeline.name} (Copy)`,
      status: 'draft',
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    pipelineEngine.savePipeline(copy);
    loadData();
  };

  const handleDeletePipeline = (id: string) => {
    if (confirm('Are you sure you want to delete this pipeline?')) {
      pipelineEngine.deletePipeline(id);
      loadData();
    }
  };

  const handleExportJson = (pipeline: Pipeline) => {
    const jsonStr = pipelineEngine.exportPipelineJson(pipeline);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pipeline.name.toLowerCase().replace(/\s+/g, '_')}_v${pipeline.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    setImportError(null);
    setMissingResourcesAlert([]);
    try {
      const { pipeline, missingResources } = pipelineEngine.importPipelineJson(importJsonText);
      pipelineEngine.savePipeline(pipeline);
      loadData();
      if (missingResources.length > 0) {
        setMissingResourcesAlert(missingResources);
      } else {
        setIsImportModalOpen(false);
        setImportJsonText('');
        handleOpenBuilder(pipeline.id);
      }
    } catch (err: any) {
      setImportError(err.message || 'Invalid Pipeline JSON specification.');
    }
  };

  const handleCreatePool = () => {
    if (!newPoolName.trim()) return;
    const pool: WorkerPool = {
      id: `pool-${Date.now().toString(36)}`,
      name: newPoolName.trim(),
      description: newPoolDesc.trim(),
      memberProfileIds: [],
      concurrencyLimit: newPoolConcurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    pipelineEngine.saveWorkerPool(pool);
    loadData();
    setIsNewPoolModalOpen(false);
    setNewPoolName('');
    setNewPoolDesc('');
    setNewPoolConcurrency(4);
  };

  const handleDeletePool = (poolId: string) => {
    if (confirm('Delete this worker pool?')) {
      pipelineEngine.deleteWorkerPool(poolId);
      loadData();
    }
  };

  // Filtered pipelines
  const filteredPipelines = pipelines.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    if (activeTab === 'templates') return matchesSearch && p.isTemplate;
    if (activeTab === 'pipelines') return matchesSearch && matchesStatus && !p.isTemplate;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/50">
      {/* Top Page Header */}
      <div className="p-8 pb-4 shrink-0 flex flex-col gap-4 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
              <span>Pipelines</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-mono font-medium">
                Dynamic Engine
              </span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Build reusable automation workflows by connecting browsers, files, prompts, actions, and outputs.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <FiUpload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>

            <button
              onClick={() => setIsSmartBuildOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-500/20 transition-all shadow-sm"
            >
              <FiZap className="w-3.5 h-3.5 text-purple-500" />
              <span>Smart Build</span>
            </button>

            <button
              onClick={handleCreateBlankPipeline}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all"
            >
              <FiPlus className="w-4 h-4" />
              <span>New Pipeline</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Search Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 w-fit">
            <button
              onClick={() => setActiveTab('pipelines')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pipelines'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              All Workflows ({pipelines.filter(p => !p.isTemplate).length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'templates'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Templates ({pipelines.filter(p => p.isTemplate).length})
            </button>
            <button
              onClick={() => setActiveTab('worker_pools')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'worker_pools'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Worker Pools ({workerPools.length})
            </button>
          </div>

          {/* Search & Filter */}
          {activeTab !== 'worker_pools' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pipelines..."
                  className="pl-9 pr-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none w-48 focus:w-64 transition-all"
                />
              </div>

              {activeTab === 'pipelines' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-transparent text-xs font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* WORKER POOLS TAB */}
        {activeTab === 'worker_pools' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Reusable Worker Pools
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Pool browser tabs and accounts across Chrome profiles to run loop iterations concurrently.
                </p>
              </div>
              <button
                onClick={() => setIsNewPoolModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all"
              >
                <FiPlus className="w-3.5 h-3.5" />
                <span>New Worker Pool</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {workerPools.map(pool => (
                <div 
                  key={pool.id}
                  className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                        {pool.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[11px]">
                        {pool.concurrencyLimit || 1}x Concurrency
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {pool.name}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                      {pool.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <span className="text-neutral-400 text-[11px]">
                      {pool.memberProfileIds?.length || 0} Target Browsers
                    </span>
                    <button
                      onClick={() => handleDeletePool(pool.id)}
                      className="p-1 text-neutral-400 hover:text-rose-500 transition-colors"
                      title="Delete Pool"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PIPELINES & TEMPLATES GRID */}
        {activeTab !== 'worker_pools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPipelines.map(pipeline => {
              const poolCount = Array.from(new Set(pipeline.nodes.map(n => n.config.workerPoolId).filter(Boolean))).length;

              return (
                <div
                  key={pipeline.id}
                  className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Top Header Card */}
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          pipeline.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          pipeline.status === 'draft' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                          'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                        }`}>
                          {pipeline.status}
                        </span>
                        <span className="font-mono text-[11px] text-neutral-400">
                          {pipeline.version}
                        </span>
                      </div>

                      {/* Action Menu Buttons */}
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleExportJson(pipeline)}
                          title="Export JSON"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicatePipeline(pipeline)}
                          title="Duplicate"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <FiCopy className="w-3.5 h-3.5" />
                        </button>
                        {!pipeline.isTemplate && (
                          <button
                            onClick={() => handleDeletePipeline(pipeline.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                      {pipeline.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {pipeline.description || 'Flexible pipeline graph.'}
                    </p>

                    {/* Node and Graph Topology Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/70 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1 font-medium">
                        <FiSliders className="w-3 h-3 text-red-500" />
                        {pipeline.nodes.length} Nodes
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <FiCornerDownRight className="w-3 h-3 text-blue-500" />
                        {pipeline.edges.length} Connections
                      </span>
                      {poolCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
                            <FiLayers className="w-3 h-3" />
                            {poolCount} Worker Pool{poolCount > 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Footer with Run and Edit Canvas */}
                  <div className="p-4 px-6 bg-neutral-50/60 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div className="text-[11px] text-neutral-400">
                      {pipeline.runCount > 0 ? (
                        <span>{pipeline.successCount}/{pipeline.runCount} successful runs</span>
                      ) : (
                        <span>Never run</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenBuilder(pipeline.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <FiEdit3 className="w-3.5 h-3.5" />
                        <span>Canvas</span>
                      </button>

                      <button
                        onClick={() => setPipelineToRun(pipeline)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <FiPlay className="w-3.5 h-3.5 ml-0.5" />
                        <span>Run</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Smart Build Modal */}
      <SmartBuildModal
        isOpen={isSmartBuildOpen}
        onClose={() => setIsSmartBuildOpen(false)}
        onPipelineGenerated={(pipeline) => {
          pipelineEngine.savePipeline(pipeline);
          loadData();
          handleOpenBuilder(pipeline.id);
        }}
      />

      {/* Run Pipeline Modal */}
      <RunPipelineModal
        pipeline={pipelineToRun}
        isOpen={Boolean(pipelineToRun)}
        onClose={() => setPipelineToRun(null)}
        onLaunched={(runId) => {
          handleOpenBuilder(pipelineToRun?.id);
        }}
      />

      {/* Import Pipeline JSON Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Import Pipeline Specification
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Paste the exported JSON specification. Existing nodes and typed connections will be imported.
            </p>

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{ "name": "Imported Pipeline", "nodes": [...], "edges": [...] }'
              rows={8}
              className="w-full p-3 font-mono text-xs rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
            />

            {importError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {importError}
              </div>
            )}

            {missingResourcesAlert.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs space-y-1">
                <span className="font-semibold block">Missing Resources in this environment:</span>
                {missingResourcesAlert.map((res, i) => (
                  <div key={i}>• {res}</div>
                ))}
                <span className="block mt-1 text-[11px] text-neutral-500">
                  You can edit the nodes on the canvas to point to your local Chrome accounts or pools.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportJsonText('');
                  setMissingResourcesAlert([]);
                  setImportError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={!importJsonText.trim()}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/20"
              >
                Import to Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Worker Pool Modal */}
      {isNewPoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Create Worker Pool
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Groups multiple browser instances or tabs to handle parallel loops.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Pool Name:
                </label>
                <input
                  type="text"
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  placeholder="e.g. Enhancement Cluster"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Description:
                </label>
                <input
                  type="text"
                  value={newPoolDesc}
                  onChange={(e) => setNewPoolDesc(e.target.value)}
                  placeholder="High throughput photo enhancement tabs"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Concurrency Limit:
                </label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={newPoolConcurrency}
                  onChange={(e) => setNewPoolConcurrency(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewPoolModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePool}
                disabled={!newPoolName.trim()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20"
              >
                Create Pool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
