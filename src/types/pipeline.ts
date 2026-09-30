// EstateFlow Control - Dynamic Smart Pipeline Data Model
// Extensible Node-Graph Architecture for Autonomous Real-Estate Automations

export type NodeCategory = 
  | 'input'
  | 'browser'
  | 'chat_ai'
  | 'file'
  | 'data'
  | 'flow'
  | 'media'
  | 'output';

export type PortDataType = 
  | 'any'
  | 'property'
  | 'image'
  | 'image_collection'
  | 'file'
  | 'file_collection'
  | 'text'
  | 'prompt'
  | 'url'
  | 'boolean'
  | 'number'
  | 'browser_session'
  | 'browser_tab'
  | 'job_result';

export interface NodePort {
  id: string;
  name: string;
  type: PortDataType;
  label: string;
  description?: string;
  required?: boolean;
}

export interface PipelineNodePosition {
  x: number;
  y: number;
}

export interface PipelineNode {
  id: string;
  type: string;
  name: string;
  category: NodeCategory;
  position: PipelineNodePosition;
  config: Record<string, any>;
  inputs: NodePort[];
  outputs: NodePort[];
  isEnabled?: boolean;
  subPipelineId?: string;
}

export interface PipelineEdge {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  dataType?: PortDataType;
}

export interface PipelineVariable {
  key: string;
  value: string;
  description?: string;
}

export type TabRuntimeStatus = 
  | 'idle' 
  | 'reserved' 
  | 'busy' 
  | 'waiting' 
  | 'missing' 
  | 'error' 
  | 'offline';

export interface SavedTab {
  id: string; // e.g. "tab-chatgpt-enh-1"
  browserId: string; // references ChromeProfile.id
  friendlyName: string; // e.g. "Enhance 01", "Facebook Prompt"
  expectedUrl: string; // e.g. "https://chatgpt.com"
  conversationUrl?: string; // Optional pinned ChatGPT conversation URL
  pageTitle?: string;
  role?: string; // e.g. 'enhancement' | 'prompt' | 'hero' | 'tools' | 'publishing'
  runtimeTargetId?: string; // Real Chrome CDP target ID
  status: TabRuntimeStatus;
  currentJobId?: string;
  currentAction?: string;
  activeImageName?: string;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerPoolMember {
  browserId: string;
  savedTabId: string;
  enabled: boolean;
  priority: number;
  status: 'idle' | 'busy' | 'offline' | 'error';
}

export interface WorkerPool {
  id: string;
  name: string;
  description?: string;
  members: WorkerPoolMember[];
  memberProfileIds?: string[]; // backwards-compat
  concurrencyLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export type JobActionState = 
  | 'Waiting for Browser'
  | 'Finding Tab'
  | 'Opening Tab'
  | 'Uploading Image'
  | 'Submitting Prompt'
  | 'Waiting for ChatGPT'
  | 'Generation In Progress'
  | 'Result Detected'
  | 'Downloading'
  | 'Verifying Download'
  | 'Saving File'
  | 'Completed'
  | 'Retrying'
  | 'Failed';

export interface PipelineJob {
  jobId: string;
  pipelineRunId: string;
  stepId: string;
  propertyId: string;
  propertyName?: string;
  inputId: string;
  inputName?: string;
  inputUrl?: string;
  browserId?: string;
  savedTabId?: string;
  tabFriendlyName?: string;
  workerPoolId?: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'retrying' | 'paused';
  startedAt?: string;
  completedAt?: string;
  attempt: number;
  maxAttempts: number;
  currentAction: JobActionState;
  output?: any;
  error?: string;
}

export interface BrowserTabTarget {
  id: string;
  name: string;
  profileId: string;
  role: string;
  urlMatch?: string;
  conversationUrl?: string;
  titleMatch?: string;
  lastKnownTabId?: string;
  status: 'connected' | 'not_found' | 'ready';
}

export interface PipelineInputSchema {
  type: 'property' | 'images' | 'folder' | 'urls' | 'text' | 'none';
  label?: string;
  required?: boolean;
}

export interface PipelineOutputSchema {
  fields: string[];
}

export interface PipelineSettings {
  maxParallelJobs?: number;
  defaultTimeoutSeconds?: number;
  errorStrategy?: 'stop' | 'continue' | 'retry';
  retryMaxAttempts?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  version: string; // e.g. "v1.0"
  status: 'draft' | 'active' | 'archived';
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  variables: PipelineVariable[];
  inputSchema?: PipelineInputSchema;
  outputSchema?: PipelineOutputSchema;
  settings: PipelineSettings;
  isTemplate?: boolean;
  templateCategory?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NodeRuntimeState = 
  | 'idle'
  | 'waiting'
  | 'ready'
  | 'queued'
  | 'running'
  | 'waiting_browser'
  | 'waiting_result'
  | 'downloading'
  | 'completed'
  | 'skipped'
  | 'retrying'
  | 'paused'
  | 'failed'
  | 'cancelled';

export interface NodeRunProgress {
  current: number;
  total: number;
  label?: string;
}

export interface PipelineLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface NodeRunResult {
  nodeId: string;
  status: NodeRuntimeState;
  state?: NodeRuntimeState;
  progress?: NodeRunProgress;
  currentAction?: string;
  startedAt?: string;
  completedAt?: string;
  inputs?: Record<string, any>;
  inputData?: Record<string, any>;
  outputs?: Record<string, any>;
  outputData?: Record<string, any>;
  error?: string;
  errorMessage?: string;
  attempts?: number;
  logs?: string[];
  browserInfo?: {
    profileId?: string;
    profileName?: string;
    tabName?: string;
    url?: string;
  };
}

export type PipelineRunStatus = 
  | 'queued' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'completed_with_errors' 
  | 'failed' 
  | 'cancelled';

export interface PipelineRun {
  id: string; // e.g. "RUN-PL-001"
  pipelineId: string;
  pipelineName: string;
  pipelineVersion: string;
  propertyId?: string;
  propertyName?: string;
  status: PipelineRunStatus;
  currentNodeId?: string;
  nodeStates: Record<string, NodeRunResult>;
  nodeRuns: Record<string, NodeRunResult>;
  variables: Record<string, any>;
  activeWorkers: string[];
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  pendingApprovalNodeId?: string;
  logs?: PipelineLogEntry[];
}

export interface ConfigFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea' | 'browser_select' | 'tab_select' | 'worker_pool_select' | 'prompt_template_select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: any;
  helpText?: string;
  advanced?: boolean;
}

export interface NodeDefinition {
  type: string;
  category: NodeCategory;
  name: string;
  description: string;
  iconName: string; // react-icons/fi icon identifier
  inputs: NodePort[];
  outputs: NodePort[];
  defaultConfig: Record<string, any>;
  configFields: ConfigFieldDefinition[];
}
