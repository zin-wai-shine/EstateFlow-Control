// EstateFlow Control - Domain Types & Schemas

export type ThemeMode = 'light' | 'dark' | 'system';

export type UserRole = 'administrator' | 'agent' | 'content_manager' | 'publisher';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export type PropertyStatus = 'draft' | 'available' | 'reserved' | 'rented' | 'archived';

export type PropertyType = 'condo' | 'apartment' | 'house' | 'townhome' | 'villa' | 'commercial';

export type ListingType = 'rent' | 'sale' | 'both';

export interface Property {
  id: string;
  projectName: string;
  propertyType: PropertyType;
  listingType: ListingType;
  rentalPrice?: number;
  salePrice?: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  floor?: number | string;
  building?: string;
  unitNumber?: string;
  location: string;
  nearestTransit?: string; // e.g. "BTS Asok 350m"
  distanceToTransit?: string;
  furnishedStatus: 'unfurnished' | 'partially_furnished' | 'fully_furnished';
  equipment: string[]; // e.g. ["Air Conditioner", "Washing Machine", "Smart TV", "Refrigerator"]
  description: string;
  ownerNotes?: string;
  internalNotes?: string;
  availabilityDate: string;
  moveInDate?: string;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  contractDurationMonths?: number;
  depositMonths?: number;
  advancePaymentMonths?: number;
  ownerContactName?: string;
  ownerContactPhone?: string;
  status: PropertyStatus;
  primaryImageId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ImageStatus = 
  | 'waiting'
  | 'queued'
  | 'uploading'
  | 'generating'
  | 'result_detected'
  | 'downloading'
  | 'verifying'
  | 'completed'
  | 'retrying'
  | 'failed'
  | 'needs_review'
  | 'cancelled';

export interface PropertyImage {
  id: string;
  propertyId: string;
  originalFileName: string;
  filePathOriginal: string;
  filePathEnhanced?: string;
  filePathHero?: string;
  previewUrl: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  orderIndex: number;
  isFavorite: boolean;
  isHeroCandidate: boolean;
  status: ImageStatus;
  statusMessage?: string;
  assignedWorkerId?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export type WorkerStatus = 'ready' | 'busy' | 'offline' | 'error' | 'paused';

export type ChromeSessionStatus = 
  | 'not_setup' 
  | 'waiting_for_login' 
  | 'login_required' 
  | 'ready' 
  | 'open' 
  | 'busy' 
  | 'offline' 
  | 'error' 
  | 'not_configured';

export interface ChromeProfile {
  id: string;
  friendlyName: string;
  profileDirName: string;
  purpose: 'enhancement' | 'hero' | 'content' | 'publishing' | 'general';
  chatGptSessionStatus: ChromeSessionStatus;
  assignedWorkerCount: number;
  lastActiveAt?: string;
  accountEmail?: string;
  notes?: string;
}

export interface AutomationWorker {
  id: string;
  name: string; // e.g. "Enhance Worker 01"
  profileId: string;
  profileFriendlyName: string;
  type: 'enhancement' | 'prompt' | 'hero_facebook' | 'hero_tiktok' | 'publishing';
  role?: WorkerRole;
  status: WorkerStatus;
  currentProcessName?: string;
  currentJobId?: string;
  currentPropertyId?: string;
  currentImageId?: string;
  currentTaskDescription?: string;
  lastAction?: string;
  nextExpectedAction?: string;
  totalJobsProcessed: number;
  successRate: number;
  lastSnapshotUrl?: string;
  startedAt?: string;
}

export type JobWorkflowType = 
  | 'image_enhancement'
  | 'facebook_hero'
  | 'tiktok_hero'
  | 'generate_prompts'
  | 'generate_captions'
  | 'marketplace_content'
  | 'complete_property_workflow';

export type JobStatus = 
  | 'pending'
  | 'queued'
  | 'running'
  | 'verifying'
  | 'completed'
  | 'retrying'
  | 'failed'
  | 'cancelled'
  | 'needs_review';

export interface AutomationJob {
  id: string;
  propertyId: string;
  propertyName: string;
  imageId?: string;
  workflowType: JobWorkflowType;
  stageName?: string;
  processId?: string;
  processName?: string;
  processRunId?: string;
  processStepId?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  profileId?: string;
  status: JobStatus;
  progressPercent: number;
  currentStepMessage: string;
  retryCount: number;
  maxRetries: number;
  outputPath?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: 
    | 'image_enhancement'
    | 'facebook_hero'
    | 'tiktok_hero'
    | 'facebook_caption'
    | 'tiktok_caption'
    | 'marketplace_listing'
    | 'property_description';
  version: string;
  purpose: string;
  isEnabled: boolean;
  content: string; // contains tokens like {projectName}, {rentalPrice}, {bedrooms}
  tokens: string[];
  updatedAt: string;
}

export interface GeneratedContent {
  id: string;
  propertyId: string;
  facebookPost: string;
  tiktokCaption: string;
  marketplaceTitle: string;
  marketplaceDescription: string;
  hashtags: string[];
  propertySummary: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type PublishingChannel = 'facebook_page' | 'facebook_marketplace' | 'tiktok';

export type PublishingStatus = 'not_configured' | 'ready' | 'pending_approval' | 'publishing' | 'published' | 'failed' | 'needs_review';

export interface PublishingRecord {
  id: string;
  propertyId: string;
  channel: PublishingChannel;
  status: PublishingStatus;
  requiresManualApproval: boolean;
  isApproved: boolean;
  targetProfileId?: string;
  publishedUrl?: string;
  lastErrorMessage?: string;
  scheduledFor?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  propertyId?: string;
  propertyName?: string;
  eventType: 'property' | 'image' | 'automation' | 'worker' | 'publishing' | 'system';
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export interface TechnicalLog {
  id: string;
  serviceName: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  jobId?: string;
  workerId?: string;
  profileId?: string;
  action: string;
  result: string;
  details?: string;
}

export interface SystemHealthStatus {
  desktopApp: { status: 'healthy' | 'degraded' | 'down'; message: string };
  database: { status: 'healthy' | 'degraded' | 'down'; message: string; version: number };
  dockerDesktop: { status: 'healthy' | 'degraded' | 'down'; message: string };
  automationBackend: { status: 'healthy' | 'degraded' | 'down'; message: string; port: number };
  openClaw: { status: 'healthy' | 'degraded' | 'down'; message: string };
  fileStorage: { status: 'healthy' | 'degraded' | 'down'; rootPath: string; freeSpace: string };
  chromeProfiles: { total: number; ready: number; error: number };
  workers: { total: number; ready: number; busy: number; error: number };
}

export interface AppSettings {
  general: {
    startupMode: 'dashboard' | 'properties' | 'automation';
    defaultPropertyView: 'grid' | 'table';
    storageRootPath: string;
    confirmOnDestructiveActions: boolean;
    autoCheckUpdates: boolean;
  };
  appearance: {
    theme: ThemeMode;
    sidebarCollapsed: boolean;
    compactDensity: boolean;
  };
  automation: {
    activeEnhancementWorkers: number;
    maxRetries: number;
    jobTimeoutSeconds: number;
    autoStartOnPropertyCreate: boolean;
    parallelEnhancementJobs: number;
    requireManualPublishApproval: boolean;
    verifyFileBeforeRelease: boolean;
  };
  openclaw: {
    endpointUrl: string;
    connected: boolean;
    timeoutSeconds: number;
  };
  docker: {
    autoStartContainers: boolean;
    servicePort: number;
  };
}

export interface NotificationToastItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  autoClose?: boolean;
}

// ==========================================
// PROCESS MANAGEMENT SYSTEM DOMAIN SCHEMAS
// ==========================================

export type WorkerRole = 
  | 'image_enhancement'
  | 'prompt_generation'
  | 'facebook_hero'
  | 'tiktok_hero'
  | 'facebook_publishing'
  | 'marketplace_publishing'
  | 'generic';

export type ProcessCategory = 
  | 'image_enhancement'
  | 'prompt_generation'
  | 'hero_generation'
  | 'content_generation'
  | 'publishing'
  | 'property_workflow'
  | 'custom';

export type ProcessStatus = 
  | 'draft'
  | 'ready'
  | 'running'
  | 'paused'
  | 'disabled'
  | 'needs_attention'
  | 'archived';

export type ProcessInputType = 
  | 'property'
  | 'single_image'
  | 'multiple_images'
  | 'original_images'
  | 'enhanced_images'
  | 'selected_images'
  | 'property_details'
  | 'prompt'
  | 'generated_text'
  | 'hero_images'
  | 'custom_files';

export type ProcessOutputType = 
  | 'enhanced_image'
  | 'generated_prompt'
  | 'facebook_hero'
  | 'tiktok_hero'
  | 'facebook_caption'
  | 'tiktok_caption'
  | 'marketplace_content'
  | 'published_listing'
  | 'downloaded_file'
  | 'custom_output';

export type StepActionType = 
  | 'image_enhancement'
  | 'ai_generation'
  | 'prompt_generation'
  | 'hero_generation'
  | 'content_generation'
  | 'publishing'
  | 'browser_action'
  | 'file_operation'
  | 'wait_for_result'
  | 'download_result'
  | 'custom_task';

export type WorkerAssignmentMode = 
  | 'specific'
  | 'any_available'
  | 'worker_group';

export interface ProcessStep {
  id: string;
  order: number;
  name: string;
  type: StepActionType;
  input: ProcessInputType;
  profileId: string; // Connected to existing ChromeProfile.id
  workerAssignmentMode: WorkerAssignmentMode;
  workerId?: string; // If specific
  workerGroupIds?: string[]; // If worker_group
  promptTemplateId?: string; // Connected to existing PromptTemplate.id
  expectedResult?: string;
  downloadRequirement?: boolean;
  retryPolicy: {
    maxRetries: number;
  };
  timeoutSeconds: number;
  isEnabled: boolean;
}

export interface Process {
  id: string;
  name: string;
  description: string;
  category: ProcessCategory;
  status: ProcessStatus;
  icon?: string;
  colorLabel?: string;
  inputType: ProcessInputType;
  outputType: ProcessOutputType;
  processingMode: 'each_image' | 'batch' | 'single';
  steps: ProcessStep[];
  isTemplate?: boolean;
  isArchived?: boolean;
  runCount: number;
  successCount: number;
  failureCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProcessRunStatus = 
  | 'draft'
  | 'ready'
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled'
  | 'needs_review';

export interface ProcessRun {
  id: string; // e.g. RUN-000142
  processId: string;
  processName: string;
  propertyId: string;
  propertyName: string;
  status: ProcessRunStatus;
  currentStepOrder: number;
  totalSteps: number;
  jobsCreated: number;
  jobsCompleted: number;
  jobsFailed: number;
  sourceImageIds?: string[];
  activeWorkerIds: string[];
  queueImageCount: number;
  completedImageCount: number;
  totalImageCount: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface PropertyLinkGroup {
  id: string;
  groupNumber?: number;
  title?: string;
  links: string[];
  createdAt: string;
  updatedAt: string;
}

