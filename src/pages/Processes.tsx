// EstateFlow Control - Processes Management System
import React, { useState, useMemo } from 'react';
import { 
  FiPlus, 
  FiSearch, 
  FiGrid, 
  FiList, 
  FiPlay, 
  FiEdit3, 
  FiCopy, 
  FiLayers, 
  FiClock, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiArchive, 
  FiTrash2, 
  FiExternalLink, 
  FiSliders,
  FiRepeat,
  FiBox,
  FiCpu,
  FiArrowRight,
  FiX
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { db } from '../services/storage';
import { processEngine } from '../services/processEngine';
import { Process, ProcessStatus, ProcessCategory, Property } from '../types';
import { AppDropdown } from '../components/common/AppDropdown';
import { StatusBadge } from '../components/common/StatusBadge';

export const Processes: React.FC = () => {
  const { 
    processes, 
    refreshProcesses, 
    openProcessBuilder, 
    openProcessRun,
    properties, 
    profiles,
    workers,
    addNotification 
  } = useApp();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('most_used');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Run Process Modal
  const [runTargetProcess, setRunTargetProcess] = useState<Process | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [isStartingRun, setIsStartingRun] = useState(false);

  // Filtered & Sorted Processes
  const filteredProcesses = useMemo(() => {
    return processes.filter(p => {
      if (p.isArchived) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'most_used') return b.runCount - a.runCount;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [processes, searchQuery, selectedStatus, selectedCategory, sortBy]);

  // Handle Duplicate
  const handleDuplicate = (processId: string) => {
    const dup = db.duplicateProcess(processId);
    if (dup) {
      refreshProcesses();
      addNotification('success', 'Process Duplicated', `Created "${dup.name}"`);
    }
  };

  // Handle Archive / Delete
  const handleArchive = (processId: string) => {
    db.archiveProcess(processId);
    refreshProcesses();
    addNotification('info', 'Process Archived', 'Process moved to archive.');
  };

  const handleDelete = (processId: string) => {
    if (confirm('Are you sure you want to permanently delete this process?')) {
      const ok = db.deleteProcess(processId);
      if (ok) {
        refreshProcesses();
        addNotification('info', 'Process Deleted', 'Process permanently removed.');
      } else {
        alert('Cannot delete process while runs are active.');
      }
    }
  };

  // Pre-flight check for Run Modal
  const runValidation = useMemo(() => {
    if (!runTargetProcess || !selectedPropertyId) return null;
    return processEngine.validateProcess(runTargetProcess.id, selectedPropertyId);
  }, [runTargetProcess, selectedPropertyId]);

  const handleStartProcessRun = async () => {
    if (!runTargetProcess || !selectedPropertyId) return;
    setIsStartingRun(true);
    try {
      const run = await processEngine.startProcess(runTargetProcess.id, selectedPropertyId);
      addNotification('success', 'Process Run Started', `${runTargetProcess.name} (${run.id}) is now running.`);
      setRunTargetProcess(null);
      openProcessRun(run.id);
    } catch (e: any) {
      alert(e.message || 'Failed to start process run.');
    } finally {
      setIsStartingRun(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Processes
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Create and manage reusable automation workflows connected to existing browser workers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowTemplatesModal(true)}
            className="btn-secondary"
          >
            <FiBox className="w-3.5 h-3.5 text-rose-500" />
            <span>Process Templates</span>
          </button>
          <button 
            onClick={() => openProcessBuilder()}
            className="btn-primary-red"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Add Process</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl glass-panel text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search processes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg glass-input text-xs"
            />
          </div>

          {/* Status Dropdown */}
          <AppDropdown
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'ready', label: 'Ready' },
              { value: 'draft', label: 'Draft' },
              { value: 'running', label: 'Running' },
              { value: 'disabled', label: 'Disabled' },
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
            className="w-36"
          />

          {/* Category Dropdown */}
          <AppDropdown
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'image_enhancement', label: 'Image Enhancement' },
              { value: 'hero_generation', label: 'Hero Generation' },
              { value: 'content_generation', label: 'Content Generation' },
              { value: 'property_workflow', label: 'Property Workflow' },
            ]}
            value={selectedCategory}
            onChange={setSelectedCategory}
            className="w-40"
          />

          {/* Sort Dropdown */}
          <AppDropdown
            options={[
              { value: 'most_used', label: 'Most Used First' },
              { value: 'newest', label: 'Newest First' },
              { value: 'name', label: 'Name A-Z' },
            ]}
            value={sortBy}
            onChange={setSortBy}
            prefix={<span className="text-[11px] font-medium text-neutral-400">Sort:</span>}
            className="w-44"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setViewMode('cards')}
            title="Card View"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'cards' 
                ? 'bg-white dark:bg-neutral-700 text-rose-500 shadow-sm' 
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'
            }`}
          >
            <FiGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List View"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-neutral-700 text-rose-500 shadow-sm' 
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'
            }`}
          >
            <FiList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Processes Display */}
      {filteredProcesses.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel space-y-3">
          <FiLayers className="w-10 h-10 mx-auto text-neutral-400" />
          <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
            No processes found
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Create a custom process or pick from pre-configured workflow templates to get started.
          </p>
          <button onClick={() => openProcessBuilder()} className="btn-primary-red">
            <FiPlus className="w-3.5 h-3.5" />
            <span>Create First Process</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProcesses.map(proc => {
            const assignedProfileIds = Array.from(new Set(proc.steps.map(s => s.profileId)));
            const assignedProfiles = profiles.filter(p => assignedProfileIds.includes(p.id));

            return (
              <div 
                key={proc.id} 
                className="p-5 rounded-2xl glass-card flex flex-col justify-between border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all space-y-4"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {proc.category.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge status={proc.status} />
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">
                    {proc.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    {proc.description}
                  </p>

                  {/* Flow Summary */}
                  <div className="mt-3.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>Workflow Flow:</span>
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">{proc.steps.length} Steps</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 truncate">
                      <span className="truncate">{proc.inputType.replace(/_/g, ' ')}</span>
                      <FiArrowRight className="w-3 h-3 shrink-0 text-rose-500" />
                      <span className="truncate">{proc.outputType.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  {/* Connected Profiles Tags */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {assignedProfiles.map(p => (
                      <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                        {p.friendlyName.split('-')[0].trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Stats & Actions */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span>Runs: <strong className="text-neutral-800 dark:text-neutral-200">{proc.runCount}</strong></span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{proc.successCount} Success</span>
                    {proc.failureCount > 0 && (
                      <span className="text-rose-500 font-medium">{proc.failureCount} Failed</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button 
                      onClick={() => setRunTargetProcess(proc)}
                      disabled={proc.status === 'disabled'}
                      className="btn-primary-red flex-1 disabled:opacity-50"
                    >
                      <FiPlay className="w-3.5 h-3.5" />
                      <span>Run</span>
                    </button>

                    <button 
                      onClick={() => openProcessBuilder(proc.id)}
                      className="btn-secondary"
                      title="Edit Process"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button 
                      onClick={() => handleDuplicate(proc.id)}
                      className="btn-secondary"
                      title="Duplicate"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={() => handleArchive(proc.id)}
                      className="btn-secondary text-neutral-400 hover:text-rose-500"
                      title="Archive Process"
                    >
                      <FiArchive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl glass-panel border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
              <tr>
                <th className="py-3 px-4">Process Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Steps</th>
                <th className="py-3 px-4">Profiles & Workers</th>
                <th className="py-3 px-4">Runs</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredProcesses.map(proc => (
                <tr key={proc.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                    <div>{proc.name}</div>
                    <div className="text-[11px] text-neutral-400 font-normal truncate max-w-xs">{proc.description}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      {proc.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{proc.steps.length}</td>
                  <td className="py-3 px-4 text-neutral-500">
                    {proc.steps[0]?.workerAssignmentMode === 'any_available' ? 'Any Available' : 'Specific Worker'}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {proc.runCount} (<span className="text-emerald-500">{proc.successCount}</span>)
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={proc.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setRunTargetProcess(proc)} 
                        className="btn-primary-red !h-7 !px-2.5 !text-[11px]"
                      >
                        <FiPlay className="w-3 h-3" />
                        <span>Run</span>
                      </button>
                      <button 
                        onClick={() => openProcessBuilder(proc.id)} 
                        className="btn-secondary !h-7 !px-2"
                      >
                        <FiEdit3 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RUN PROCESS MODAL */}
      {runTargetProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <FiPlay className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    Run Process: {runTargetProcess.name}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Select target property and review requirements.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setRunTargetProcess(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Target Property Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Target Property
              </label>
              <AppDropdown
                options={properties.map(p => ({
                  value: p.id,
                  label: `${p.projectName} (${p.bedrooms} Bed, ${p.location})`
                }))}
                value={selectedPropertyId}
                onChange={setSelectedPropertyId}
                className="w-full"
              />
            </div>

            {/* Pre-Flight Readiness Validation */}
            {runValidation && (
              <div className={`p-3 rounded-xl text-xs space-y-1 ${
                runValidation.isValid 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                <div className="flex items-center gap-2 font-semibold">
                  {runValidation.isValid ? (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      <span>Ready to Execute</span>
                    </>
                  ) : (
                    <>
                      <FiAlertTriangle className="w-4 h-4" />
                      <span>Prerequisites Not Met</span>
                    </>
                  )}
                </div>
                {runValidation.isValid ? (
                  <p className="text-[11px] opacity-90">
                    Chrome workers online and input assets detected ({db.getImages(selectedPropertyId).length} photos available).
                  </p>
                ) : (
                  <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                    {runValidation.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800">
              <button 
                onClick={() => setRunTargetProcess(null)} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleStartProcessRun}
                disabled={!runValidation?.isValid || isStartingRun}
                className="btn-primary-red disabled:opacity-50"
              >
                <FiPlay className="w-3.5 h-3.5" />
                <span>{isStartingRun ? 'Starting...' : 'Start Process'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATES DRAWER / MODAL */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl glass-panel border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <FiBox className="w-4 h-4 text-rose-500" />
                  Default Process Templates
                </h3>
                <p className="text-xs text-neutral-400">
                  Pick a pre-configured template and customize it for your portfolio.
                </p>
              </div>
              <button 
                onClick={() => setShowTemplatesModal(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1">
              {processes.map(tmpl => (
                <div key={tmpl.id} className="p-3.5 rounded-xl glass-card border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">{tmpl.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        {tmpl.steps.length} Steps
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{tmpl.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowTemplatesModal(false);
                      openProcessBuilder(tmpl.id);
                    }}
                    className="btn-secondary !h-7 !text-[11px] shrink-0"
                  >
                    <span>Use Template</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
