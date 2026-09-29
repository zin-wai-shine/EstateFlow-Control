// EstateFlow Control - Process Builder (Ordered Visual Workflow Designer)
import React, { useState, useMemo } from 'react';
import { 
  FiArrowLeft, 
  FiPlus, 
  FiTrash2, 
  FiCopy, 
  FiArrowUp, 
  FiArrowDown, 
  FiCheck, 
  FiSave, 
  FiPlay, 
  FiSliders, 
  FiChevronDown, 
  FiChevronUp,
  FiCpu,
  FiLayers,
  FiFileText,
  FiDownloadCloud,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { db } from '../services/storage';
import { processEngine } from '../services/processEngine';
import { 
  Process, 
  ProcessStep, 
  ProcessCategory, 
  ProcessStatus, 
  ProcessInputType, 
  ProcessOutputType, 
  StepActionType, 
  WorkerAssignmentMode 
} from '../types';
import { AppDropdown } from '../components/common/AppDropdown';

export const ProcessBuilder: React.FC = () => {
  const { 
    selectedProcessId, 
    setActivePage, 
    refreshProcesses, 
    profiles, 
    workers, 
    addNotification,
    openProcessRun
  } = useApp();

  const prompts = db.getPrompts();

  // Load existing or prepare blank process
  const initialProcess: Process = useMemo(() => {
    if (selectedProcessId) {
      const existing = db.getProcess(selectedProcessId);
      if (existing) {
        return JSON.parse(JSON.stringify(existing)); // Deep copy
      }
    }
    return {
      id: 'proc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      name: 'New Custom Process',
      description: 'Automated workflow orchestrated across dedicated Chrome profiles and browser workers.',
      category: 'image_enhancement',
      status: 'ready',
      inputType: 'original_images',
      outputType: 'enhanced_image',
      processingMode: 'each_image',
      steps: [
        {
          id: 'step-' + Date.now() + '-1',
          order: 1,
          name: 'Enhance Image',
          type: 'image_enhancement',
          input: 'original_images',
          profileId: profiles[0]?.id || 'prof-a',
          workerAssignmentMode: 'any_available',
          promptTemplateId: prompts[0]?.id || 'pt-1',
          expectedResult: 'Balanced architectural lighting enhancement',
          downloadRequirement: true,
          retryPolicy: { maxRetries: 3 },
          timeoutSeconds: 120,
          isEnabled: true
        }
      ],
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [selectedProcessId, profiles, prompts]);

  // Form State
  const [name, setName] = useState(initialProcess.name);
  const [description, setDescription] = useState(initialProcess.description);
  const [category, setCategory] = useState<ProcessCategory>(initialProcess.category);
  const [status, setStatus] = useState<ProcessStatus>(initialProcess.status);
  const [inputType, setInputType] = useState<ProcessInputType>(initialProcess.inputType);
  const [outputType, setOutputType] = useState<ProcessOutputType>(initialProcess.outputType);
  const [processingMode, setProcessingMode] = useState<'each_image' | 'batch' | 'single'>(initialProcess.processingMode);
  const [steps, setSteps] = useState<ProcessStep[]>(initialProcess.steps);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const selectedStep = steps[selectedStepIndex] || steps[0];

  // Dynamically filter workers belonging to selected step's Chrome Profile
  const eligibleWorkers = useMemo(() => {
    if (!selectedStep) return [];
    return workers.filter(w => w.profileId === selectedStep.profileId);
  }, [workers, selectedStep?.profileId]);

  // --- STEP OPERATIONS ---
  const handleAddStep = () => {
    const newStep: ProcessStep = {
      id: 'step-' + Date.now() + '-' + (steps.length + 1),
      order: steps.length + 1,
      name: `Step ${steps.length + 1} - Action`,
      type: 'ai_generation',
      input: inputType,
      profileId: profiles[0]?.id || 'prof-a',
      workerAssignmentMode: 'any_available',
      promptTemplateId: prompts[0]?.id,
      expectedResult: 'Generated asset output',
      downloadRequirement: true,
      retryPolicy: { maxRetries: 2 },
      timeoutSeconds: 90,
      isEnabled: true
    };
    setSteps([...steps, newStep]);
    setSelectedStepIndex(steps.length);
  };

  const handleUpdateStep = (updatedFields: Partial<ProcessStep>) => {
    setSteps(prev => prev.map((s, idx) => idx === selectedStepIndex ? { ...s, ...updatedFields } : s));
  };

  const handleRemoveStep = (indexToRemove: number) => {
    if (steps.length <= 1) {
      alert('A process must have at least one step.');
      return;
    }
    const updated = steps.filter((_, idx) => idx !== indexToRemove).map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(updated);
    setSelectedStepIndex(Math.max(0, indexToRemove - 1));
  };

  const handleDuplicateStep = (indexToDuplicate: number) => {
    const source = steps[indexToDuplicate];
    const duplicated: ProcessStep = {
      ...source,
      id: 'step-' + Date.now() + '-' + (steps.length + 1),
      order: indexToDuplicate + 2,
      name: `${source.name} (Copy)`
    };
    const updated = [...steps];
    updated.splice(indexToDuplicate + 1, 0, duplicated);
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(reordered);
    setSelectedStepIndex(indexToDuplicate + 1);
  };

  const handleMoveStep = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= steps.length) return;

    const reordered = [...steps];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const finalized = reordered.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(finalized);
    setSelectedStepIndex(toIndex);
  };

  const handleToggleStepEnabled = (index: number) => {
    setSteps(prev => prev.map((s, idx) => idx === index ? { ...s, isEnabled: !s.isEnabled } : s));
  };

  // --- SAVE PROCESS ---
  const handleSave = (asNew = false) => {
    if (!name.trim()) {
      alert('Please enter a process name.');
      return;
    }

    const processToSave: Process = {
      ...initialProcess,
      id: asNew ? ('proc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6)) : initialProcess.id,
      name: asNew ? `${name} (New)` : name,
      description,
      category,
      status,
      inputType,
      outputType,
      processingMode,
      steps,
      updatedAt: new Date().toISOString()
    };

    db.saveProcess(processToSave);
    refreshProcesses();
    addNotification('success', 'Process Saved', `"${processToSave.name}" has been configured.`);
    setActivePage('processes');
  };

  // --- TEST WORKER ---
  const handleTestWorker = async () => {
    if (!selectedStep) return;
    const workerId = selectedStep.workerId || eligibleWorkers[0]?.id;
    if (!workerId) {
      alert('Please select or assign a worker first.');
      return;
    }
    const res = await processEngine.testWorker(workerId, selectedStep.profileId);
    setTestResult(res.message);
  };

  // --- TEST PROCESS ---
  const handleTestProcess = async () => {
    try {
      const run = await processEngine.testProcess(initialProcess.id);
      addNotification('info', 'Test Run Started', `Testing process with sample asset (${run.id})`);
      openProcessRun(run.id);
    } catch (e: any) {
      alert(e.message || 'Could not start test process.');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('processes')}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {selectedProcessId ? `Edit Process: ${name}` : 'Create Process'}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Connect property assets to Chrome profiles, AI prompts, and automated browser worker tabs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleTestProcess} className="btn-secondary">
            <FiPlay className="w-3.5 h-3.5 text-rose-500" />
            <span>Test Process</span>
          </button>
          {selectedProcessId && (
            <button onClick={() => handleSave(true)} className="btn-secondary">
              <FiCopy className="w-3.5 h-3.5" />
              <span>Save As New</span>
            </button>
          )}
          <button onClick={() => handleSave(false)} className="btn-primary-red">
            <FiSave className="w-3.5 h-3.5" />
            <span>Save Process</span>
          </button>
        </div>
      </div>

      {/* Process Meta Configuration Card */}
      <div className="glass-panel p-5 space-y-4">
        <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <FiSliders className="w-3.5 h-3.5 text-rose-500" />
          Process Information & Input / Output Definitions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Process Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Property Image Enhancement"
              className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Category
            </label>
            <AppDropdown
              options={[
                { value: 'image_enhancement', label: 'Image Enhancement' },
                { value: 'prompt_generation', label: 'Prompt Generation' },
                { value: 'hero_generation', label: 'Hero Generation' },
                { value: 'content_generation', label: 'Content Generation' },
                { value: 'publishing', label: 'Publishing' },
                { value: 'property_workflow', label: 'Property Workflow' },
                { value: 'custom', label: 'Custom' },
              ]}
              value={category}
              onChange={(val) => setCategory(val as ProcessCategory)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Status
            </label>
            <AppDropdown
              options={[
                { value: 'ready', label: 'Ready' },
                { value: 'draft', label: 'Draft' },
                { value: 'disabled', label: 'Disabled' },
              ]}
              value={status}
              onChange={(val) => setStatus(val as ProcessStatus)}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Expected Input Type
            </label>
            <AppDropdown
              options={[
                { value: 'original_images', label: 'Original Property Images' },
                { value: 'enhanced_images', label: 'Enhanced Images' },
                { value: 'multiple_images', label: 'Multiple Selected Images' },
                { value: 'property_details', label: 'Property Specifications' },
                { value: 'prompt', label: 'Generated Prompt' },
                { value: 'property', label: 'Full Property Record' },
              ]}
              value={inputType}
              onChange={(val) => setInputType(val as ProcessInputType)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Expected Output Type
            </label>
            <AppDropdown
              options={[
                { value: 'enhanced_image', label: 'Enhanced Image' },
                { value: 'generated_prompt', label: 'Generated Prompt' },
                { value: 'facebook_hero', label: 'Facebook Hero (1:1)' },
                { value: 'tiktok_hero', label: 'TikTok Hero (9:16)' },
                { value: 'marketplace_content', label: 'Marketplace Content' },
                { value: 'published_listing', label: 'Published Listing' },
              ]}
              value={outputType}
              onChange={(val) => setOutputType(val as ProcessOutputType)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Processing Mode
            </label>
            <AppDropdown
              options={[
                { value: 'each_image', label: 'Process Every Image Independently' },
                { value: 'batch', label: 'Batch Process' },
                { value: 'single', label: 'Single Execution' },
              ]}
              value={processingMode}
              onChange={(val) => setProcessingMode(val as any)}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what this automation accomplishes..."
            className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
          />
        </div>
      </div>

      {/* Split Builder: Left Steps Stack / Right Selected Step Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Visual Ordered Step List (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <FiLayers className="w-3.5 h-3.5 text-rose-500" />
              Process Steps ({steps.length})
            </h2>
            <button onClick={handleAddStep} className="btn-secondary !h-7 !text-[11px]">
              <FiPlus className="w-3.5 h-3.5 text-rose-500" />
              <span>Add Step</span>
            </button>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => {
              const isSelected = idx === selectedStepIndex;
              const profile = profiles.find(p => p.id === step.profileId);
              const worker = workers.find(w => w.id === step.workerId);

              return (
                <React.Fragment key={step.id}>
                  {/* Step Card */}
                  <div 
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-rose-500/50 bg-rose-500/[0.04] dark:bg-rose-500/[0.06] shadow-sm ring-1 ring-rose-500/20'
                        : 'border-neutral-200 dark:border-neutral-800 glass-card hover:border-neutral-300 dark:hover:border-neutral-700'
                    } ${!step.isEnabled ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'bg-rose-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <h3 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                          {step.name}
                        </h3>
                        {!step.isEnabled && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                            Disabled
                          </span>
                        )}
                      </div>

                      {/* Step Actions */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleMoveStep(idx, 'up')}
                          disabled={idx === 0}
                          title="Move up"
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white disabled:opacity-30"
                        >
                          <FiArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveStep(idx, 'down')}
                          disabled={idx === steps.length - 1}
                          title="Move down"
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white disabled:opacity-30"
                        >
                          <FiArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateStep(idx)}
                          title="Duplicate step"
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                        >
                          <FiCopy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveStep(idx)}
                          title="Delete step"
                          className="p-1 text-neutral-400 hover:text-rose-500"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Step Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono">
                        {profile?.friendlyName.split('-')[0].trim() || 'Profile A'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                        {step.workerAssignmentMode === 'any_available' ? 'Any Available Worker' : (worker?.name || 'Assigned Worker')}
                      </span>
                      {step.downloadRequirement && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px]">
                          Download Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Down Arrow between steps */}
                  {idx < steps.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-400">
                        <FiArrowDown className="w-3 h-3" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Step Configuration (6 cols) */}
        {selectedStep && (
          <div className="lg:col-span-6 glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {selectedStepIndex + 1}
                </span>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Step Configuration: {selectedStep.name}
                </h3>
              </div>
              <button
                onClick={() => handleToggleStepEnabled(selectedStepIndex)}
                className={`text-[11px] font-medium px-2 py-1 rounded transition-colors ${
                  selectedStep.isEnabled 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                {selectedStep.isEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Step Name & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Step Name
                </label>
                <input
                  type="text"
                  value={selectedStep.name}
                  onChange={(e) => handleUpdateStep({ name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Action Type
                </label>
                <AppDropdown
                  options={[
                    { value: 'image_enhancement', label: 'Image Enhancement' },
                    { value: 'ai_generation', label: 'AI Generation' },
                    { value: 'prompt_generation', label: 'Prompt Generation' },
                    { value: 'hero_generation', label: 'Hero Generation' },
                    { value: 'content_generation', label: 'Content Generation' },
                    { value: 'publishing', label: 'Publishing' },
                    { value: 'file_operation', label: 'File Operation' },
                    { value: 'download_result', label: 'Download Result' },
                    { value: 'custom_task', label: 'Custom Browser Task' },
                  ]}
                  value={selectedStep.type}
                  onChange={(val) => handleUpdateStep({ type: val as StepActionType })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Connected Chrome Profile (FEEDS FROM EXISTING DB!) */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1 flex items-center justify-between">
                <span>Assigned Chrome Profile</span>
                <span className="text-[10px] text-neutral-400">Loads from Browser Workers database</span>
              </label>
              <AppDropdown
                options={profiles.map(p => ({
                  value: p.id,
                  label: `${p.friendlyName} (${p.assignedWorkerCount} workers)`
                }))}
                value={selectedStep.profileId}
                onChange={(val) => handleUpdateStep({ profileId: val, workerId: undefined })}
                className="w-full"
              />
            </div>

            {/* Worker Assignment Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Worker Assignment Mode
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleUpdateStep({ workerAssignmentMode: 'any_available' })}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    selectedStep.workerAssignmentMode === 'any_available'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <p className="font-medium text-[11px]">Any Available</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Recommended</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStep({ workerAssignmentMode: 'specific' })}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    selectedStep.workerAssignmentMode === 'specific'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <p className="font-medium text-[11px]">Specific Worker</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Lock 1 worker</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStep({ workerAssignmentMode: 'worker_group' })}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    selectedStep.workerAssignmentMode === 'worker_group'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <p className="font-medium text-[11px]">Worker Group</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Dedicated pool</p>
                </button>
              </div>
            </div>

            {/* If Specific Worker Mode: Worker Selector filtered by chosen profile */}
            {selectedStep.workerAssignmentMode === 'specific' && (
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Select Specific Worker from {profiles.find(p => p.id === selectedStep.profileId)?.friendlyName}
                </label>
                {eligibleWorkers.length === 0 ? (
                  <p className="text-xs text-amber-500 p-2 rounded bg-amber-500/10">
                    No workers assigned to this Chrome profile. Please add or assign workers in Browser Workers.
                  </p>
                ) : (
                  <AppDropdown
                    options={eligibleWorkers.map(w => ({
                      value: w.id,
                      label: `${w.name} (${w.status})`
                    }))}
                    value={selectedStep.workerId || eligibleWorkers[0]?.id || ''}
                    onChange={(val) => handleUpdateStep({ workerId: val })}
                    className="w-full"
                  />
                )}
              </div>
            )}

            {/* Prompt Template Selector */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Prompt Template
              </label>
              <AppDropdown
                options={prompts.map(pr => ({
                  value: pr.id,
                  label: `${pr.name} (${pr.category})`
                }))}
                value={selectedStep.promptTemplateId || prompts[0]?.id || ''}
                onChange={(val) => handleUpdateStep({ promptTemplateId: val })}
                className="w-full"
              />
            </div>

            {/* Expected Result & Download Requirement */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Expected Result Description
              </label>
              <input
                type="text"
                value={selectedStep.expectedResult || ''}
                onChange={(e) => handleUpdateStep({ expectedResult: e.target.value })}
                placeholder="What output does this step produce?"
                className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={selectedStep.downloadRequirement || false}
                onChange={(e) => handleUpdateStep({ downloadRequirement: e.target.checked })}
                className="rounded accent-rose-600 cursor-pointer"
              />
              <span>Require verified automatic download to property asset directory</span>
            </label>

            {/* Advanced Toggle */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <span>Advanced Step Settings</span>
                {showAdvanced ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAdvanced && (
                <div className="mt-3 p-3.5 rounded-xl bg-neutral-100/50 dark:bg-neutral-800/40 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Max Retries
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={selectedStep.retryPolicy?.maxRetries || 3}
                        onChange={(e) => handleUpdateStep({ 
                          retryPolicy: { maxRetries: parseInt(e.target.value) || 0 } 
                        })}
                        className="w-full px-3 py-1 rounded glass-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Timeout (seconds)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="600"
                        value={selectedStep.timeoutSeconds || 120}
                        onChange={(e) => handleUpdateStep({ 
                          timeoutSeconds: parseInt(e.target.value) || 120 
                        })}
                        className="w-full px-3 py-1 rounded glass-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleTestWorker}
                      className="btn-secondary !h-7 !text-[11px]"
                    >
                      <FiCpu className="w-3 h-3 text-rose-500" />
                      <span>Test Worker Connection</span>
                    </button>
                    {testResult && (
                      <span className="text-[11px] text-emerald-500 dark:text-emerald-400 truncate max-w-xs">
                        {testResult}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
