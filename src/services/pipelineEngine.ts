// EstateFlow Control - Dynamic Smart Pipeline Engine
// Graph Runtime Interpreter, Topological Scheduler, Node Handlers, Smart Build, and Storage
import { 
  Pipeline, 
  PipelineRun, 
  PipelineNode, 
  PipelineEdge, 
  WorkerPool, 
  BrowserTabTarget,
  NodeRunResult,
  NodeRuntimeState 
} from '../types/pipeline';
import { db } from './storage';
import { openclawClient } from './openclawClient';
import { instantiateNode, arePortsCompatible, getNodeDefinition } from './nodeRegistry';

// ==========================================
// DEFAULT WORKER POOLS
// ==========================================
export const DEFAULT_WORKER_POOLS: WorkerPool[] = [
  {
    id: 'pool-enhancement',
    name: 'Enhancement Pool',
    description: 'High-throughput image enhancement cluster across Profile A and B',
    memberProfileIds: ['prof-a', 'prof-b'],
    concurrencyLimit: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pool-hero-creative',
    name: 'Creative & Hero Pool',
    description: 'Dedicated tabs for 1:1 and 9:16 social hero graphic synthesis',
    memberProfileIds: ['prof-c'],
    concurrencyLimit: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pool-publishing',
    name: 'Social Publishing Pool',
    description: 'Direct Facebook Page and Marketplace publishing agents',
    memberProfileIds: ['prof-d'],
    concurrencyLimit: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ==========================================
// DEFAULT PIPELINES & TEMPLATES
// ==========================================
function buildImageEnhancementPipeline(): Pipeline {
  const n1 = instantiateNode('input_property_images', { x: 100, y: 180 });
  n1.name = 'Property Photos';

  const n2 = instantiateNode('flow_for_each', { x: 420, y: 180 });
  n2.name = 'AI Photo Enhancement';
  n2.config = { concurrencyLimit: 4, workerPoolId: 'pool-enhancement', resolution: '4K' };

  const n3 = instantiateNode('media_external_processor', { x: 740, y: 180 });
  n3.name = 'Watermark & Resize Tool';
  n3.config = { targetToolName: 'Post Studio / Watermark Website' };

  const n4 = instantiateNode('output_mark_complete', { x: 1060, y: 180 });
  n4.name = 'Save Assets & Finish';

  const edges: PipelineEdge[] = [
    { id: 'e1', sourceNodeId: n1.id, sourcePortId: n1.outputs[0].id, targetNodeId: n2.id, targetPortId: n2.inputs[0].id },
    { id: 'e2', sourceNodeId: n2.id, sourcePortId: n2.outputs[0].id, targetNodeId: n3.id, targetPortId: n3.inputs[0].id },
    { id: 'e3', sourceNodeId: n3.id, sourcePortId: n3.outputs[0].id, targetNodeId: n4.id, targetPortId: n4.inputs[0].id }
  ];

  return {
    id: 'pipe-img-enh-loop',
    name: 'Photo Enhancement & Watermark',
    description: 'Loops all property photos through 4 parallel ChatGPT enhancement workers, then applies watermark and saves assets',
    version: 'v1.0',
    status: 'active',
    nodes: [n1, n2, n3, n4],
    edges,
    variables: [{ key: 'targetResolution', value: '4K', description: 'Target upscaled output size' }],
    inputSchema: { type: 'images', label: 'Property Photos Collection' },
    outputSchema: { fields: ['enhancedImages', 'watermarkedImages'] },
    settings: { maxParallelJobs: 4, defaultTimeoutSeconds: 180, errorStrategy: 'retry' },
    isTemplate: false,
    runCount: 14,
    successCount: 14,
    failureCount: 0,
    lastRunAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  };
}

function buildParallelSocialPipeline(): Pipeline {
  const nStart = instantiateNode('input_property', { x: 80, y: 220 });
  nStart.name = 'Property Details';

  const nEnhance = instantiateNode('flow_for_each', { x: 380, y: 120 });
  nEnhance.name = 'AI Photo Enhancement (4x)';
  nEnhance.config = { concurrencyLimit: 4, workerPoolId: 'pool-enhancement' };

  const nCopy = instantiateNode('data_build_prompt', { x: 380, y: 320 });
  nCopy.name = 'Generate Social Copy';
  nCopy.config = { targetPlatform: 'facebook' };

  const nHero = instantiateNode('media_hero_image', { x: 700, y: 220 });
  nHero.name = 'Social Hero Graphic';
  nHero.config = { heroAspectRatio: '1:1' };

  const nApproval = instantiateNode('flow_approval', { x: 980, y: 220 });
  nApproval.name = 'Review & Approval';

  const nPublish = instantiateNode('output_publish', { x: 1260, y: 220 });
  nPublish.name = 'Publish to Facebook';

  const edges: PipelineEdge[] = [
    { id: 'ep1', sourceNodeId: nStart.id, sourcePortId: nStart.outputs[0].id, targetNodeId: nEnhance.id, targetPortId: nEnhance.inputs[0].id },
    { id: 'ep2', sourceNodeId: nStart.id, sourcePortId: nStart.outputs[0].id, targetNodeId: nCopy.id, targetPortId: nCopy.inputs[0].id },
    { id: 'ep3', sourceNodeId: nEnhance.id, sourcePortId: nEnhance.outputs[0].id, targetNodeId: nHero.id, targetPortId: nHero.inputs[0].id },
    { id: 'ep4', sourceNodeId: nCopy.id, sourcePortId: nCopy.outputs[0].id, targetNodeId: nHero.id, targetPortId: nHero.inputs[1]?.id || nHero.inputs[0].id },
    { id: 'ep5', sourceNodeId: nHero.id, sourcePortId: nHero.outputs[0].id, targetNodeId: nApproval.id, targetPortId: nApproval.inputs[0].id },
    { id: 'ep6', sourceNodeId: nApproval.id, sourcePortId: nApproval.outputs[0].id, targetNodeId: nPublish.id, targetPortId: nPublish.inputs[0].id }
  ];

  return {
    id: 'pipe-parallel-social',
    name: 'Complete Social Posting (Parallel)',
    description: 'Concurrently runs photo enhancement and social copywriting, creates hero graphic, pauses for approval, and publishes',
    version: 'v1.0',
    status: 'active',
    nodes: [nStart, nEnhance, nCopy, nHero, nApproval, nPublish],
    edges,
    variables: [{ key: 'campaignTag', value: 'Q3_Luxury_Promotion' }],
    inputSchema: { type: 'property', label: 'Listing Property' },
    outputSchema: { fields: ['heroGraphic', 'facebookPost', 'tiktokScript'] },
    settings: { maxParallelJobs: 4, defaultTimeoutSeconds: 300, errorStrategy: 'stop' },
    isTemplate: false,
    runCount: 8,
    successCount: 7,
    failureCount: 1,
    lastRunAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString()
  };
}

function buildCopywritingPipeline(): Pipeline {
  const n1 = instantiateNode('input_property', { x: 100, y: 180 });
  n1.name = 'Property Details';

  const n2 = instantiateNode('data_build_prompt', { x: 420, y: 180 });
  n2.name = 'Generate Social Copy';
  n2.config = { targetPlatform: 'facebook' };

  const n3 = instantiateNode('flow_approval', { x: 740, y: 180 });
  n3.name = 'Review & Save Copy';

  const edges: PipelineEdge[] = [
    { id: 'ec1', sourceNodeId: n1.id, sourcePortId: n1.outputs[0].id, targetNodeId: n2.id, targetPortId: n2.inputs[0].id },
    { id: 'ec2', sourceNodeId: n2.id, sourcePortId: n2.outputs[0].id, targetNodeId: n3.id, targetPortId: n3.inputs[0].id }
  ];

  return {
    id: 'pipe-copywriting-fast',
    name: 'Social Copywriting Fast-Track',
    description: 'Instant AI listing copywriting for Facebook & TikTok with hashtags and pricing highlights',
    version: 'v1.0',
    status: 'active',
    nodes: [n1, n2, n3],
    edges,
    variables: [],
    inputSchema: { type: 'property', label: 'Listing Property' },
    outputSchema: { fields: ['facebookPost', 'tiktokScript'] },
    settings: { maxParallelJobs: 2, defaultTimeoutSeconds: 60, errorStrategy: 'retry' },
    isTemplate: false,
    runCount: 5,
    successCount: 5,
    failureCount: 0,
    lastRunAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  };
}

export function buildBlankPipeline(name = 'New Custom Pipeline'): Pipeline {
  const startNode = instantiateNode('flow_start', { x: 120, y: 220 });

  return {
    id: `pipe-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    description: 'Dynamic graph connecting browsers, files, prompts, and actions.',
    version: 'v1.0',
    status: 'draft',
    nodes: [startNode],
    edges: [],
    variables: [],
    inputSchema: { type: 'property', label: 'Target Context' },
    outputSchema: { fields: ['output'] },
    settings: { maxParallelJobs: 4, defaultTimeoutSeconds: 120, errorStrategy: 'retry' },
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export const DEFAULT_PIPELINES: Pipeline[] = [
  buildImageEnhancementPipeline(),
  buildParallelSocialPipeline(),
  buildCopywritingPipeline()
];

// ==========================================
// STORAGE & RUNTIME PIPELINE ENGINE
// ==========================================
class PipelineEngine {
  private STORAGE_KEY_PIPELINES = 'estateflow_pipelines_v3';
  private STORAGE_KEY_RUNS = 'estateflow_pipeline_runs_v2';
  private STORAGE_KEY_POOLS = 'estateflow_worker_pools_v2';

  // --- PIPELINES CRUD ---
  public getPipelines(includeArchived = false): Pipeline[] {
    const raw = localStorage.getItem(this.STORAGE_KEY_PIPELINES);
    if (!raw) {
      this.saveAllPipelines(DEFAULT_PIPELINES);
      return DEFAULT_PIPELINES;
    }
    try {
      const list: Pipeline[] = JSON.parse(raw);
      return includeArchived ? list : list.filter(p => p.status !== 'archived');
    } catch {
      return DEFAULT_PIPELINES;
    }
  }

  public getPipeline(id: string): Pipeline | undefined {
    return this.getPipelines(true).find(p => p.id === id);
  }

  public savePipeline(pipeline: Pipeline): void {
    const list = this.getPipelines(true);
    const idx = list.findIndex(p => p.id === pipeline.id);
    const updated = {
      ...pipeline,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) list[idx] = updated;
    else list.unshift(updated);
    this.saveAllPipelines(list);
  }

  public deletePipeline(id: string): void {
    const list = this.getPipelines(true).filter(p => p.id !== id);
    this.saveAllPipelines(list);
  }

  private saveAllPipelines(pipelines: Pipeline[]): void {
    localStorage.setItem(this.STORAGE_KEY_PIPELINES, JSON.stringify(pipelines));
  }

  // --- WORKER POOLS ---
  public getWorkerPools(): WorkerPool[] {
    const raw = localStorage.getItem(this.STORAGE_KEY_POOLS);
    if (!raw) {
      this.saveAllWorkerPools(DEFAULT_WORKER_POOLS);
      return DEFAULT_WORKER_POOLS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_WORKER_POOLS;
    }
  }

  public saveWorkerPool(pool: WorkerPool): void {
    const list = this.getWorkerPools();
    const idx = list.findIndex(p => p.id === pool.id);
    if (idx >= 0) list[idx] = pool;
    else list.push(pool);
    this.saveAllWorkerPools(list);
  }

  public deleteWorkerPool(id: string): void {
    const list = this.getWorkerPools().filter(p => p.id !== id);
    this.saveAllWorkerPools(list);
  }

  private saveAllWorkerPools(pools: WorkerPool[]): void {
    localStorage.setItem(this.STORAGE_KEY_POOLS, JSON.stringify(pools));
  }

  // --- PIPELINE RUNS ---
  public getPipelineRuns(): PipelineRun[] {
    const raw = localStorage.getItem(this.STORAGE_KEY_RUNS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public getPipelineRun(id: string): PipelineRun | undefined {
    return this.getPipelineRuns().find(r => r.id === id);
  }

  public savePipelineRun(run: PipelineRun): void {
    const list = this.getPipelineRuns();
    const idx = list.findIndex(r => r.id === run.id);
    if (idx >= 0) list[idx] = run;
    else list.unshift(run);
    localStorage.setItem(this.STORAGE_KEY_RUNS, JSON.stringify(list));
  }

  // ==========================================
  // RUNTIME EXECUTION INTERPRETER
  // ==========================================
  public getRun(id: string): PipelineRun | undefined {
    return this.getPipelineRun(id);
  }

  public executePipeline(pipelineId: string, inputs?: Record<string, any>): PipelineRun {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found.`);

    const properties = db.getProperties();
    const propertyId = inputs?.propertyId || inputs?.property?.id;
    const property = propertyId ? properties.find(p => p.id === propertyId) : properties[0];

    const runId = `RUN-PL-${Date.now().toString(36).toUpperCase()}`;

    // Initialize all node states
    const initialNodeStates: Record<string, NodeRunResult> = {};
    pipeline.nodes.forEach(node => {
      const isStart = node.type === 'flow_start' || node.inputs.length === 0;
      initialNodeStates[node.id] = {
        nodeId: node.id,
        status: isStart ? 'ready' : 'waiting',
        state: isStart ? 'ready' : 'waiting',
        inputs: inputs || {},
        inputData: inputs || {},
        outputs: {},
        outputData: {},
        logs: [`Node registered in pipeline execution graph.`]
      };
    });

    const run: PipelineRun = {
      id: runId,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      pipelineVersion: pipeline.version,
      propertyId: property?.id,
      propertyName: property?.projectName || (property as any)?.title || 'Standalone Pipeline Run',
      status: 'running',
      nodeStates: initialNodeStates,
      nodeRuns: initialNodeStates,
      variables: {
        propertyId: property?.id,
        propertyTitle: property?.projectName || (property as any)?.title,
        propertyPrice: property?.rentalPrice || property?.salePrice || (property as any)?.price,
        propertyLocation: typeof property?.location === 'string' ? property.location : (property?.location as any)?.district,
        ...inputs
      },
      activeWorkers: [],
      startedAt: new Date().toISOString(),
      logs: [
        { timestamp: new Date().toISOString(), level: 'info', message: `Pipeline "${pipeline.name}" execution started.` }
      ]
    };

    this.savePipelineRun(run);

    pipeline.runCount += 1;
    pipeline.lastRunAt = new Date().toISOString();
    this.savePipeline(pipeline);

    setTimeout(() => this.processGraphStep(run.id), 100);

    return run;
  }

  public pausePipeline(runId: string): void {
    const run = this.getPipelineRun(runId);
    if (run && run.status === 'running') {
      run.status = 'paused';
      run.logs = run.logs || [];
      run.logs.push({ timestamp: new Date().toISOString(), level: 'warn', message: 'Pipeline paused by operator.' });
      this.savePipelineRun(run);
    }
  }

  public resumePipeline(runId: string): void {
    const run = this.getPipelineRun(runId);
    if (run && run.status === 'paused') {
      run.status = 'running';
      run.logs = run.logs || [];
      run.logs.push({ timestamp: new Date().toISOString(), level: 'info', message: 'Pipeline resumed.' });
      this.savePipelineRun(run);
      setTimeout(() => this.processGraphStep(run.id), 100);
    }
  }

  public cancelPipeline(runId: string): void {
    this.cancelPipelineRun(runId);
  }

  public async startPipelineRun(pipelineId: string, propertyId?: string): Promise<PipelineRun> {
    return this.executePipeline(pipelineId, { propertyId });
  }

  // Core graph progression cycle
  public async processGraphStep(runId: string): Promise<void> {
    const run = this.getPipelineRun(runId);
    if (!run || run.status !== 'running') return;

    const pipeline = this.getPipeline(run.pipelineId);
    if (!pipeline) return;

    // Find ready nodes
    const readyNodes = pipeline.nodes.filter(node => {
      const state = run.nodeStates[node.id];
      if (!state || state.status !== 'ready') return false;
      return true;
    });

    if (readyNodes.length === 0) {
      // Check if all are completed or if paused for approval
      const allStates = Object.values(run.nodeStates);
      const isPaused = allStates.some(s => s.status === 'paused');
      const hasFailed = allStates.some(s => s.status === 'failed');
      const allDone = allStates.every(s => s.status === 'completed' || s.status === 'skipped');

      if (isPaused) {
        run.status = 'paused';
        this.savePipelineRun(run);
        return;
      }

      if (allDone) {
        run.status = hasFailed ? 'completed_with_errors' : 'completed';
        run.completedAt = new Date().toISOString();
        this.savePipelineRun(run);

        // Update pipeline success stats
        if (!hasFailed) pipeline.successCount += 1;
        else pipeline.failureCount += 1;
        this.savePipeline(pipeline);
        return;
      }
      return;
    }

    // Execute ready nodes concurrently
    for (const node of readyNodes) {
      await this.executeNode(run, pipeline, node);
    }

    // Save run progress
    this.savePipelineRun(run);

    // Evaluate outgoing edges to unlock successor nodes
    this.evaluateSuccessorNodes(run, pipeline);
    this.savePipelineRun(run);

    // Continue next graph step if still running
    if (run.status === 'running') {
      setTimeout(() => this.processGraphStep(runId), 400);
    }
  }

  private async executeNode(run: PipelineRun, pipeline: Pipeline, node: PipelineNode): Promise<void> {
    const nodeState = run.nodeStates[node.id];
    nodeState.status = 'running';
    nodeState.startedAt = new Date().toISOString();
    nodeState.logs = nodeState.logs || [];
    nodeState.logs.push(`Started execution of ${node.name} (${node.type})`);

    try {
      // Node execution simulation / integration
      if (node.type === 'flow_approval') {
        nodeState.status = 'paused';
        nodeState.currentAction = 'Waiting for user approval';
        nodeState.logs.push(`Execution paused. Requires manual approval in UI.`);
        run.pendingApprovalNodeId = node.id;
        run.status = 'paused';
        return;
      }

      if (node.type === 'flow_for_each') {
        const pool = this.getWorkerPools().find(p => p.id === node.config.workerPoolId) || DEFAULT_WORKER_POOLS[0];
        const concurrency = node.config.concurrencyLimit || 4;
        nodeState.progress = { current: concurrency, total: 12, label: `Concurrency: ${concurrency} parallel workers` };
        nodeState.currentAction = `Dispatched 12 items across ${pool.name}`;
        nodeState.logs.push(`Assigned ${concurrency} parallel browser workers from ${pool.name}`);
      } else if (node.category === 'chat_ai') {
        nodeState.currentAction = 'Communicating with active ChatGPT session...';
        nodeState.logs.push(`Submitted prompt and waiting for DOM generation completion.`);
      } else if (node.type === 'browser_use_saved') {
        const profiles = db.getProfiles();
        const profile = profiles.find(p => p.id === node.config.browserProfileId) || profiles[0];
        nodeState.currentAction = `Connected to Chrome Profile: ${profile?.friendlyName}`;
        nodeState.logs.push(`Attached dedicated persistent Chrome profile.`);
      } else {
        nodeState.currentAction = `Processed ${node.name}`;
      }

      // Mark completed
      nodeState.status = 'completed';
      nodeState.completedAt = new Date().toISOString();
      nodeState.outputs = {
        result: `Processed by ${node.name}`,
        timestamp: new Date().toISOString()
      };
      nodeState.logs.push(`Successfully completed.`);
    } catch (err: any) {
      nodeState.status = 'failed';
      nodeState.error = err?.message || 'Execution failed';
      nodeState.logs.push(`Error: ${nodeState.error}`);
    }
  }

  private evaluateSuccessorNodes(run: PipelineRun, pipeline: Pipeline): void {
    pipeline.nodes.forEach(targetNode => {
      const targetState = run.nodeStates[targetNode.id];
      if (!targetState || targetState.status !== 'waiting') return;

      // Find incoming edges to this node
      const incomingEdges = pipeline.edges.filter(e => e.targetNodeId === targetNode.id);
      if (incomingEdges.length === 0) return;

      // Special handling for Join nodes (wait for all vs wait for any)
      if (targetNode.type === 'flow_join') {
        const joinStrategy = targetNode.config.joinStrategy || 'wait_for_all';
        if (joinStrategy === 'wait_for_any') {
          const anyDone = incomingEdges.some(e => run.nodeStates[e.sourceNodeId]?.status === 'completed');
          if (anyDone) targetState.status = 'ready';
        } else {
          const allDone = incomingEdges.every(e => run.nodeStates[e.sourceNodeId]?.status === 'completed');
          if (allDone) targetState.status = 'ready';
        }
        return;
      }

      // Standard dependency check: all incoming edges must originate from completed nodes
      const allSourcesCompleted = incomingEdges.every(e => {
        const srcState = run.nodeStates[e.sourceNodeId];
        return srcState && srcState.status === 'completed';
      });

      if (allSourcesCompleted) {
        targetState.status = 'ready';
        targetState.logs = targetState.logs || [];
        targetState.logs.push(`All incoming dependency branches resolved. Node ready.`);
      }
    });
  }

  public async approveNode(runId: string, nodeId: string): Promise<void> {
    const run = this.getPipelineRun(runId);
    if (!run) return;

    const nodeState = run.nodeStates[nodeId];
    if (nodeState) {
      nodeState.status = 'completed';
      nodeState.completedAt = new Date().toISOString();
      nodeState.logs = nodeState.logs || [];
      nodeState.logs.push(`Approved manually by user.`);
    }

    run.status = 'running';
    run.pendingApprovalNodeId = undefined;
    this.savePipelineRun(run);

    const pipeline = this.getPipeline(run.pipelineId);
    if (pipeline) {
      this.evaluateSuccessorNodes(run, pipeline);
      this.savePipelineRun(run);
      setTimeout(() => this.processGraphStep(runId), 200);
    }
  }

  public cancelPipelineRun(runId: string): void {
    const run = this.getPipelineRun(runId);
    if (!run) return;
    run.status = 'cancelled';
    run.completedAt = new Date().toISOString();
    this.savePipelineRun(run);
  }

  // ==========================================
  // SMART BUILD PIPELINE SYNTHESIZER
  // ==========================================
  public smartBuildPipeline(naturalLanguagePrompt: string, contextResources?: any): Pipeline {
    const lower = naturalLanguagePrompt.toLowerCase();
    const pipelineName = 'Smart Built: ' + naturalLanguagePrompt.slice(0, 45).trim() + (naturalLanguagePrompt.length > 45 ? '...' : '');

    const nodes: PipelineNode[] = [];
    const edges: PipelineEdge[] = [];

    let currentX = 80;
    const startNode = instantiateNode('input_property', { x: currentX, y: 240 });
    nodes.push(startNode);

    let lastNode = startNode;

    const wantsParallel = lower.includes('parallel') || lower.includes('at the same time') || (lower.includes('facebook') && lower.includes('tiktok') && lower.includes('enhance'));
    const wantsEnhance = lower.includes('enhance') || lower.includes('photo') || lower.includes('image');
    const wantsWatermark = lower.includes('watermark') || lower.includes('processor') || lower.includes('website');
    const wantsHero = lower.includes('hero');
    const wantsApproval = lower.includes('approval') || lower.includes('stop') || lower.includes('review');
    const wantsPublish = lower.includes('publish') || lower.includes('facebook') || lower.includes('post');

    if (wantsParallel) {
      currentX += 280;
      const parallelNode = instantiateNode('flow_parallel', { x: currentX, y: 240 });
      nodes.push(parallelNode);
      edges.push({ id: `e-${Date.now()}-1`, sourceNodeId: lastNode.id, sourcePortId: lastNode.outputs[0].id, targetNodeId: parallelNode.id, targetPortId: parallelNode.inputs[0].id });

      // Branch 1: Images Loop
      const imgIn = instantiateNode('input_property_images', { x: currentX + 280, y: 80 });
      const forEach = instantiateNode('flow_for_each', { x: currentX + 560, y: 80 });
      forEach.config = { concurrencyLimit: 4, workerPoolId: 'pool-enhancement' };
      const chatPrompt = instantiateNode('chat_send_prompt', { x: currentX + 840, y: 80 });
      nodes.push(imgIn, forEach, chatPrompt);

      edges.push({ id: `e-br1-1`, sourceNodeId: parallelNode.id, sourcePortId: 'branch1_out', targetNodeId: imgIn.id, targetPortId: 'prop_in' });
      edges.push({ id: `e-br1-2`, sourceNodeId: imgIn.id, sourcePortId: 'images_out', targetNodeId: forEach.id, targetPortId: 'items_in' });
      edges.push({ id: `e-br1-3`, sourceNodeId: forEach.id, sourcePortId: 'item_out', targetNodeId: chatPrompt.id, targetPortId: 'prompt_in' });

      // Branch 2: Facebook Prompt
      const fbPrompt = instantiateNode('data_build_prompt', { x: currentX + 280, y: 300 });
      fbPrompt.config = { targetPlatform: 'facebook' };
      const fbSend = instantiateNode('chat_send_prompt', { x: currentX + 560, y: 300 });
      nodes.push(fbPrompt, fbSend);

      edges.push({ id: `e-br2-1`, sourceNodeId: parallelNode.id, sourcePortId: 'branch2_out', targetNodeId: fbPrompt.id, targetPortId: 'prop_in' });
      edges.push({ id: `e-br2-2`, sourceNodeId: fbPrompt.id, sourcePortId: 'prompt_out', targetNodeId: fbSend.id, targetPortId: 'prompt_in' });

      // Branch 3: TikTok Prompt
      const ttPrompt = instantiateNode('data_build_prompt', { x: currentX + 280, y: 500 });
      ttPrompt.config = { targetPlatform: 'tiktok' };
      const ttSend = instantiateNode('chat_send_prompt', { x: currentX + 560, y: 500 });
      nodes.push(ttPrompt, ttSend);

      edges.push({ id: `e-br3-1`, sourceNodeId: parallelNode.id, sourcePortId: 'branch3_out', targetNodeId: ttPrompt.id, targetPortId: 'prop_in' });
      edges.push({ id: `e-br3-2`, sourceNodeId: ttPrompt.id, sourcePortId: 'prompt_out', targetNodeId: ttSend.id, targetPortId: 'prompt_in' });

      // Join
      currentX += 1120;
      const joinNode = instantiateNode('flow_join', { x: currentX, y: 240 });
      nodes.push(joinNode);

      edges.push({ id: `e-jn-1`, sourceNodeId: chatPrompt.id, sourcePortId: 'tab_out', targetNodeId: joinNode.id, targetPortId: 'branch1_in' });
      edges.push({ id: `e-jn-2`, sourceNodeId: fbSend.id, sourcePortId: 'tab_out', targetNodeId: joinNode.id, targetPortId: 'branch2_in' });
      edges.push({ id: `e-jn-3`, sourceNodeId: ttSend.id, sourcePortId: 'tab_out', targetNodeId: joinNode.id, targetPortId: 'branch3_in' });

      lastNode = joinNode;
    } else if (wantsEnhance) {
      currentX += 280;
      const forEach = instantiateNode('flow_for_each', { x: currentX, y: 240 });
      forEach.config = { concurrencyLimit: 4, workerPoolId: 'pool-enhancement' };
      nodes.push(forEach);
      edges.push({ id: `e-${Date.now()}-2`, sourceNodeId: lastNode.id, sourcePortId: lastNode.outputs[0].id, targetNodeId: forEach.id, targetPortId: forEach.inputs[0].id });

      currentX += 280;
      const chatPrompt = instantiateNode('chat_send_prompt', { x: currentX, y: 240 });
      nodes.push(chatPrompt);
      edges.push({ id: `e-${Date.now()}-3`, sourceNodeId: forEach.id, sourcePortId: 'item_out', targetNodeId: chatPrompt.id, targetPortId: 'prompt_in' });
      lastNode = chatPrompt;
    }

    if (wantsWatermark) {
      currentX += 280;
      const extProc = instantiateNode('media_external_processor', { x: currentX, y: 240 });
      nodes.push(extProc);
      edges.push({ id: `e-wm-${Date.now()}`, sourceNodeId: lastNode.id, sourcePortId: lastNode.outputs[0].id, targetNodeId: extProc.id, targetPortId: extProc.inputs[0].id });
      lastNode = extProc;
    }

    if (wantsHero) {
      currentX += 280;
      const hero = instantiateNode('media_hero_image', { x: currentX, y: 240 });
      nodes.push(hero);
      edges.push({ id: `e-hero-${Date.now()}`, sourceNodeId: lastNode.id, sourcePortId: lastNode.outputs[0].id, targetNodeId: hero.id, targetPortId: hero.inputs[0].id });
      lastNode = hero;
    }

    if (wantsApproval) {
      currentX += 280;
      const apprv = instantiateNode('flow_approval', { x: currentX, y: 240 });
      nodes.push(apprv);
      edges.push({ id: `e-app-${Date.now()}`, sourceNodeId: lastNode.id, sourcePortId: lastNode.outputs[0].id, targetNodeId: apprv.id, targetPortId: apprv.inputs[0].id });
      lastNode = apprv;
    }

    if (wantsPublish) {
      currentX += 280;
      const pub = instantiateNode('output_publish', { x: currentX, y: 240 });
      nodes.push(pub);
      edges.push({ id: `e-pub-${Date.now()}`, sourceNodeId: lastNode.id, sourcePortId: lastNode.outputs[0].id, targetNodeId: pub.id, targetPortId: pub.inputs[0].id });
      lastNode = pub;
    }

    currentX += 280;
    const complete = instantiateNode('output_mark_complete', { x: currentX, y: 240 });
    nodes.push(complete);
    edges.push({ id: `e-cmp-${Date.now()}`, sourceNodeId: lastNode.id, sourcePortId: lastNode.outputs[0].id, targetNodeId: complete.id, targetPortId: complete.inputs[0].id });

    return {
      id: `pipe-smart-${Date.now().toString(36)}`,
      name: pipelineName,
      description: `Synthesized with Smart Build from prompt: "${naturalLanguagePrompt}"`,
      version: 'v1.0',
      status: 'draft',
      nodes,
      edges,
      variables: [],
      inputSchema: { type: 'property', label: 'Property Data Context' },
      outputSchema: { fields: ['output'] },
      settings: { maxParallelJobs: 4, defaultTimeoutSeconds: 180, errorStrategy: 'retry' },
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // --- VALIDATION ---
  public validatePipeline(pipeline: Pipeline): { isValid: boolean; errors: { nodeId?: string; message: string }[] } {
    const errors: { nodeId?: string; message: string }[] = [];

    if (!pipeline.nodes || pipeline.nodes.length === 0) {
      errors.push({ message: 'Pipeline contains no nodes.' });
      return { isValid: false, errors };
    }

    // Check for duplicate node IDs
    const ids = new Set<string>();
    pipeline.nodes.forEach(n => {
      if (ids.has(n.id)) errors.push({ nodeId: n.id, message: `Duplicate node ID: ${n.id}` });
      ids.add(n.id);
    });

    // Check required inputs
    pipeline.nodes.forEach(node => {
      const requiredInputs = node.inputs.filter(p => p.required);
      requiredInputs.forEach(reqPort => {
        const hasEdge = pipeline.edges.some(e => e.targetNodeId === node.id && e.targetPortId === reqPort.id);
        if (!hasEdge) {
          errors.push({ nodeId: node.id, message: `${node.name}: Required input port "${reqPort.label}" is not connected.` });
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // --- IMPORT / EXPORT ---
  public exportPipelineJson(pipeline: Pipeline): string {
    const clone = JSON.parse(JSON.stringify(pipeline));
    delete clone.id; // Allow new import ID
    return JSON.stringify(clone, null, 2);
  }

  public importPipelineJson(jsonString: string): { pipeline: Pipeline; missingResources: string[] } {
    const data = JSON.parse(jsonString);
    const newId = `pipe-imp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const pipeline: Pipeline = {
      ...data,
      id: newId,
      name: `${data.name || 'Imported Pipeline'} (Imported)`,
      status: 'draft',
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const missingResources: string[] = [];
    const profiles = db.getProfiles();
    const pools = this.getWorkerPools();

    pipeline.nodes.forEach(node => {
      if (node.config.browserProfileId && !profiles.some(p => p.id === node.config.browserProfileId)) {
        missingResources.push(`Browser Profile: ${node.config.browserProfileId}`);
      }
      if (node.config.workerPoolId && !pools.some(p => p.id === node.config.workerPoolId)) {
        missingResources.push(`Worker Pool: ${node.config.workerPoolId}`);
      }
    });

    return { pipeline, missingResources };
  }
}

export const pipelineEngine = new PipelineEngine();
