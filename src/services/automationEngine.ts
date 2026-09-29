// EstateFlow Control - Automation Engine & Orchestrator
import { db } from './storage';
import { 
  AutomationJob, 
  AutomationWorker, 
  PropertyImage, 
  JobWorkflowType, 
  JobStatus,
  Property,
  GeneratedContent
} from '../types';

export type JobEventListener = (job: AutomationJob) => void;
export type WorkerEventListener = (workers: AutomationWorker[]) => void;

class AutomationEngine {
  private isRunning = false;
  private jobListeners: Set<JobEventListener> = new Set();
  private workerListeners: Set<WorkerEventListener> = new Set();
  private activeInterval: any = null;

  public onJobUpdate(listener: JobEventListener): () => void {
    this.jobListeners.add(listener);
    return () => this.jobListeners.delete(listener);
  }

  public onWorkerUpdate(listener: WorkerEventListener): () => void {
    this.workerListeners.add(listener);
    return () => this.workerListeners.delete(listener);
  }

  private notifyJob(job: AutomationJob): void {
    this.jobListeners.forEach(listener => listener(job));
  }

  private notifyWorkers(): void {
    const workers = db.getWorkers();
    this.workerListeners.forEach(listener => listener(workers));
  }

  public startQueueProcessor(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[AutomationEngine] Started queue monitor loop');
    this.activeInterval = setInterval(() => {
      this.processNextQueuedJob();
    }, 1500);
  }

  public stopQueueProcessor(): void {
    if (this.activeInterval) {
      clearInterval(this.activeInterval);
      this.activeInterval = null;
    }
    this.isRunning = false;
  }

  // --- WORKFLOW INITIATION ---
  public queueImageEnhancement(property: Property, image: PropertyImage): AutomationJob {
    const settings = db.getSettings();
    const job: AutomationJob = {
      id: 'job-enh-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      propertyId: property.id,
      propertyName: property.projectName,
      imageId: image.id,
      workflowType: 'image_enhancement',
      stageName: 'Image Enhancement',
      status: 'queued',
      progressPercent: 5,
      currentStepMessage: 'Queued in enhancement pool',
      retryCount: 0,
      maxRetries: settings.automation.maxRetries || 3,
      createdAt: new Date().toISOString()
    };

    db.saveJob(job);
    image.status = 'queued';
    image.statusMessage = 'Queued for architectural enhancement';
    db.saveImage(image);

    db.addActivity({
      propertyId: property.id,
      propertyName: property.projectName,
      eventType: 'automation',
      title: 'Image Enhancement Queued',
      description: `Queued image ${image.originalFileName} for AI processing`,
      severity: 'info'
    });

    this.notifyJob(job);
    this.processNextQueuedJob();
    return job;
  }

  public queueFacebookHero(property: Property, sourceImageIds: string[]): AutomationJob {
    const settings = db.getSettings();
    const job: AutomationJob = {
      id: 'job-fb-hero-' + Date.now(),
      propertyId: property.id,
      propertyName: property.projectName,
      workflowType: 'facebook_hero',
      stageName: 'Facebook Hero (1:1 / 4:5)',
      status: 'queued',
      progressPercent: 5,
      currentStepMessage: `Waiting on ${sourceImageIds.length} source enhancement outputs`,
      retryCount: 0,
      maxRetries: settings.automation.maxRetries || 3,
      createdAt: new Date().toISOString()
    };

    db.saveJob(job);
    this.notifyJob(job);
    this.processNextQueuedJob();
    return job;
  }

  public queueTikTokHero(property: Property, sourceImageIds: string[]): AutomationJob {
    const settings = db.getSettings();
    const job: AutomationJob = {
      id: 'job-tt-hero-' + Date.now(),
      propertyId: property.id,
      propertyName: property.projectName,
      workflowType: 'tiktok_hero',
      stageName: 'TikTok Hero (9:16 Vertical)',
      status: 'queued',
      progressPercent: 5,
      currentStepMessage: `Synthesizing 9:16 vertical tour cover from ${sourceImageIds.length} views`,
      retryCount: 0,
      maxRetries: settings.automation.maxRetries || 3,
      createdAt: new Date().toISOString()
    };

    db.saveJob(job);
    this.notifyJob(job);
    this.processNextQueuedJob();
    return job;
  }

  public queueContentGeneration(property: Property): AutomationJob {
    const job: AutomationJob = {
      id: 'job-content-' + Date.now(),
      propertyId: property.id,
      propertyName: property.projectName,
      workflowType: 'complete_property_workflow',
      stageName: 'Content & Copywriting Synthesis',
      status: 'queued',
      progressPercent: 10,
      currentStepMessage: 'Synthesizing multi-channel copy and marketplace listings',
      retryCount: 0,
      maxRetries: 2,
      createdAt: new Date().toISOString()
    };

    db.saveJob(job);
    this.notifyJob(job);
    this.processNextQueuedJob();
    return job;
  }

  // --- 1-CLICK COMPLETE WORKFLOW ---
  public async startCompletePropertyWorkflow(propertyId: string): Promise<void> {
    const property = db.getProperty(propertyId);
    if (!property) return;

    const images = db.getImages(propertyId);
    db.addActivity({
      propertyId: property.id,
      propertyName: property.projectName,
      eventType: 'automation',
      title: 'Complete Property Workflow Initiated',
      description: `Orchestrating end-to-end pipeline: ${images.length} photos, hero assets, content studio, and marketplace staging.`,
      severity: 'info'
    });

    // 1. Queue all images that aren't already completed
    images.forEach(img => {
      if (img.status !== 'completed') {
        this.queueImageEnhancement(property, img);
      }
    });

    // 2. Queue Facebook Hero
    const heroImageIds = images.filter(i => i.isHeroCandidate || i.isFavorite).map(i => i.id);
    this.queueFacebookHero(property, heroImageIds.length ? heroImageIds : images.map(i => i.id));

    // 3. Queue TikTok Hero
    this.queueTikTokHero(property, heroImageIds.length ? heroImageIds : images.map(i => i.id));

    // 4. Queue Content Generation
    this.queueContentGeneration(property);
  }

  // --- JOB QUEUE PROCESSING ---
  private async processNextQueuedJob(): Promise<void> {
    const jobs = db.getJobs();
    const queuedJob = jobs.find(j => j.status === 'queued');
    if (!queuedJob) return;

    // Find compatible available worker
    const workers = db.getWorkers();
    let compatibleWorker: AutomationWorker | undefined;

    if (queuedJob.workflowType === 'image_enhancement') {
      compatibleWorker = workers.find(w => w.status === 'ready' && w.type === 'enhancement');
    } else if (queuedJob.workflowType === 'facebook_hero' || queuedJob.workflowType === 'tiktok_hero') {
      compatibleWorker = workers.find(w => w.status === 'ready' && (w.type === 'hero_facebook' || w.type === 'hero_tiktok' || w.type === 'enhancement'));
    } else {
      compatibleWorker = workers.find(w => w.status === 'ready');
    }

    if (!compatibleWorker) {
      // All compatible workers are currently busy, will process on next cycle
      return;
    }

    // Assign worker to job
    this.executeJobWithWorker(queuedJob, compatibleWorker);
  }

  private async executeJobWithWorker(job: AutomationJob, worker: AutomationWorker): Promise<void> {
    // Lock worker & job
    worker.status = 'busy';
    worker.currentJobId = job.id;
    worker.currentPropertyId = job.propertyId;
    worker.currentImageId = job.imageId;
    worker.currentTaskDescription = `Running ${job.stageName || job.workflowType}`;
    worker.lastAction = 'Worker assigned to job';
    worker.nextExpectedAction = 'Connecting to Chrome profile session';
    db.saveWorker(worker);
    this.notifyWorkers();

    job.status = 'running';
    job.assignedWorkerId = worker.id;
    job.assignedWorkerName = worker.name;
    job.profileId = worker.profileId;
    job.startedAt = new Date().toISOString();
    job.progressPercent = 15;
    job.currentStepMessage = `Assigned to ${worker.name}. Initializing ChatGPT tab...`;
    db.saveJob(job);
    this.notifyJob(job);

    db.addTechnicalLog({
      serviceName: 'AutomationEngine',
      level: 'info',
      jobId: job.id,
      workerId: worker.id,
      profileId: worker.profileId,
      action: 'JOB_START',
      result: 'IN_PROGRESS',
      details: `Starting ${job.workflowType} for property ${job.propertyName}`
    });

    try {
      if (job.workflowType === 'image_enhancement') {
        await this.runImageEnhancementPipeline(job, worker);
      } else if (job.workflowType === 'facebook_hero') {
        await this.runHeroPipeline(job, worker, 'facebook');
      } else if (job.workflowType === 'tiktok_hero') {
        await this.runHeroPipeline(job, worker, 'tiktok');
      } else if (job.workflowType === 'complete_property_workflow') {
        await this.runContentPipeline(job, worker);
      }
    } catch (err: any) {
      console.error(`[AutomationEngine] Job ${job.id} encountered error:`, err);
      this.handleJobFailure(job, worker, err?.message || 'Unexpected automation error');
    }
  }

  // --- STATE-BASED DETECTION PIPELINES ---
  private async runImageEnhancementPipeline(job: AutomationJob, worker: AutomationWorker): Promise<void> {
    const image = job.imageId ? db.getImages().find(i => i.id === job.imageId) : null;
    const property = db.getProperty(job.propertyId);

    // Step 1: Uploading
    job.progressPercent = 25;
    job.currentStepMessage = 'Uploading asset to ChatGPT session...';
    worker.lastAction = 'Navigated to chatgpt.com via Chrome Profile';
    worker.nextExpectedAction = 'Attach image file to prompt field';
    if (image) {
      image.status = 'uploading';
      image.statusMessage = 'Uploading to enhancement worker';
      db.saveImage(image);
    }
    db.saveJob(job);
    db.saveWorker(worker);
    this.notifyJob(job);
    this.notifyWorkers();
    await this.simulateRealisticStep(1200);

    // Step 2: Prompt Injection & Generating
    job.progressPercent = 50;
    job.currentStepMessage = 'Prompt injected: Architectural perspective & light balance. Generating...';
    worker.lastAction = 'Submitted prompt to active ChatGPT conversation';
    worker.nextExpectedAction = 'Detect generation completion DOM event';
    if (image) {
      image.status = 'generating';
      image.statusMessage = 'AI generating enhanced render';
      db.saveImage(image);
    }
    db.saveJob(job);
    db.saveWorker(worker);
    this.notifyJob(job);
    this.notifyWorkers();
    await this.simulateRealisticStep(2200);

    // Step 3: Result Detection (State-based event)
    job.progressPercent = 75;
    job.currentStepMessage = 'Render detected in DOM. Triggering secure download...';
    worker.lastAction = 'Detected image render completion';
    worker.nextExpectedAction = 'Click download button and poll filesystem';
    if (image) {
      image.status = 'result_detected';
      image.statusMessage = 'Result detected in worker browser';
      db.saveImage(image);
    }
    db.saveJob(job);
    db.saveWorker(worker);
    this.notifyJob(job);
    this.notifyWorkers();
    await this.simulateRealisticStep(1500);

    // Step 4: Download Verification
    job.progressPercent = 90;
    job.currentStepMessage = 'Verifying downloaded file size & integrity...';
    worker.lastAction = 'Downloaded file from browser';
    worker.nextExpectedAction = 'Verify file checksum & move to property directory';
    if (image) {
      image.status = 'verifying';
      image.statusMessage = 'Verifying local file bytes';
      db.saveImage(image);
    }
    db.saveJob(job);
    db.saveWorker(worker);
    this.notifyJob(job);
    this.notifyWorkers();
    await this.simulateRealisticStep(1000);

    // Step 5: Finalized & Released
    const destinationPath = `Documents/EstateFlow Control/${property?.projectName || 'Property'}/Enhanced/${image?.originalFileName || 'image'}_enhanced.jpg`;
    job.status = 'completed';
    job.progressPercent = 100;
    job.currentStepMessage = 'Completed and verified. Saved to property Enhanced directory.';
    job.outputPath = destinationPath;
    job.completedAt = new Date().toISOString();
    db.saveJob(job);

    if (image) {
      image.status = 'completed';
      image.statusMessage = 'Enhanced and verified';
      image.filePathEnhanced = destinationPath;
      db.saveImage(image);
    }

    db.addActivity({
      propertyId: job.propertyId,
      propertyName: job.propertyName,
      eventType: 'image',
      title: 'Image Enhanced & Verified',
      description: `Photo ${image?.originalFileName || ''} successfully enhanced and verified.`,
      severity: 'success'
    });

    this.releaseWorker(worker, true);
    this.notifyJob(job);
  }

  private async runHeroPipeline(job: AutomationJob, worker: AutomationWorker, type: 'facebook' | 'tiktok'): Promise<void> {
    const property = db.getProperty(job.propertyId);

    job.progressPercent = 30;
    job.currentStepMessage = `Preparing high-res composite assets for ${type === 'facebook' ? '1:1' : '9:16'} canvas...`;
    db.saveJob(job);
    this.notifyJob(job);
    await this.simulateRealisticStep(1400);

    job.progressPercent = 65;
    job.currentStepMessage = 'AI composing luxury marketing banner with typography highlights...';
    db.saveJob(job);
    this.notifyJob(job);
    await this.simulateRealisticStep(2400);

    job.progressPercent = 90;
    job.currentStepMessage = 'Validating render aspect ratio and contrast readability...';
    db.saveJob(job);
    this.notifyJob(job);
    await this.simulateRealisticStep(1200);

    const filename = `${property?.projectName.replace(/\s+/g, '_')}_${type.toUpperCase()}_HERO.jpg`;
    const outputPath = `Documents/EstateFlow Control/${property?.projectName}/Hero/${filename}`;

    job.status = 'completed';
    job.progressPercent = 100;
    job.currentStepMessage = `Hero banner successfully generated: ${filename}`;
    job.outputPath = outputPath;
    job.completedAt = new Date().toISOString();
    db.saveJob(job);

    db.addActivity({
      propertyId: job.propertyId,
      propertyName: job.propertyName,
      eventType: 'automation',
      title: `${type === 'facebook' ? 'Facebook' : 'TikTok'} Hero Banner Generated`,
      description: `Synthesized marketing hero saved to Hero assets folder.`,
      severity: 'success'
    });

    this.releaseWorker(worker, true);
    this.notifyJob(job);
  }

  private async runContentPipeline(job: AutomationJob, worker: AutomationWorker): Promise<void> {
    const property = db.getProperty(job.propertyId);
    if (!property) throw new Error('Property not found');

    job.progressPercent = 35;
    job.currentStepMessage = 'Parsing property parameters and generating multi-platform copy...';
    db.saveJob(job);
    this.notifyJob(job);
    await this.simulateRealisticStep(1500);

    // Generate smart copy tailored to property
    const content: GeneratedContent = {
      id: 'cnt-' + Date.now(),
      propertyId: property.id,
      facebookPost: `✨ LUXURY RESIDENCE IN FOCUS: ${property.projectName.toUpperCase()} ✨\n\n` +
        `Discover exceptional urban living at ${property.projectName}, ideally situated in ${property.location} (${property.nearestTransit || 'prime location'}).\n\n` +
        `🔑 Residence Highlights:\n` +
        `• Layout: ${property.bedrooms} Bed | ${property.bathrooms} Bath | ${property.sizeSqm} Sq.m.\n` +
        (property.floor ? `• High Floor Level ${property.floor} with panoramic skyline views\n` : '') +
        `• Status: ${property.furnishedStatus.replace('_', ' ')} with premier appliances (${property.equipment.slice(0, 3).join(', ')})\n` +
        `• Rental: ฿${property.rentalPrice?.toLocaleString() || 'Inquire'}/month\n` +
        `• Terms: ${property.depositMonths || 2} Months Security Deposit + ${property.advancePaymentMonths || 1} Month Advance\n\n` +
        `📲 Contact our Private Client Advisory team now for scheduled private appointments and viewing itinerary.`,
      
      tiktokCaption: `Tour this stunning ${property.bedrooms}BR at ${property.projectName}! 🔥 High floor, prime ${property.location} living. ฿${property.rentalPrice?.toLocaleString()}/mo. Link in bio for private viewings! #BangkokCondo #LuxuryRealEstate #BangkokApartment`,
      
      marketplaceTitle: `${property.projectName} | ${property.bedrooms} Bed Luxury Condo near ${property.nearestTransit || property.location}`,
      
      marketplaceDescription: `Spacious and beautifully appointed ${property.sizeSqm} sqm unit at ${property.projectName}.\n` +
        `- Bedrooms: ${property.bedrooms}\n` +
        `- Bathrooms: ${property.bathrooms}\n` +
        `- Rental: ฿${property.rentalPrice?.toLocaleString()}/month\n` +
        `- Pets: ${property.petsAllowed ? 'Allowed' : 'Not Allowed'}\n` +
        `- Smoking: ${property.smokingAllowed ? 'Allowed' : 'Strictly Non-Smoking'}\n` +
        `- Transit: ${property.nearestTransit || 'Convenient transit access'}\n\n` +
        `Ready for immediate occupancy. Contact to arrange viewing.`,
      
      hashtags: ['#BangkokProperty', '#LuxuryLiving', '#CondoForRent', '#ThailandRealEstate', '#ExpatLiving'],
      propertySummary: `${property.bedrooms}BR / ${property.bathrooms}BA residence at ${property.projectName} offering ${property.sizeSqm} sqm of refined living space.`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveContent(content);

    // Queue publishing record in pending_approval state
    db.savePublishingRecord({
      id: 'pub-' + Date.now(),
      propertyId: property.id,
      channel: 'facebook_marketplace',
      status: 'pending_approval',
      requiresManualApproval: true,
      isApproved: false,
      createdAt: new Date().toISOString()
    });

    job.status = 'completed';
    job.progressPercent = 100;
    job.currentStepMessage = 'Multi-channel copywriting ready in Content Studio. Marketplace listing queued for approval.';
    job.completedAt = new Date().toISOString();
    db.saveJob(job);

    db.addActivity({
      propertyId: property.id,
      propertyName: property.projectName,
      eventType: 'automation',
      title: 'Content Studio Assets Synthesized',
      description: 'Facebook copy, TikTok captions, and Marketplace listing generated.',
      severity: 'success'
    });

    this.releaseWorker(worker, true);
    this.notifyJob(job);
  }

  private handleJobFailure(job: AutomationJob, worker: AutomationWorker, errorMessage: string): void {
    job.retryCount = (job.retryCount || 0) + 1;
    if (job.retryCount < job.maxRetries) {
      job.status = 'retrying';
      job.currentStepMessage = `Attempt failed (${errorMessage}). Retrying ${job.retryCount}/${job.maxRetries}...`;
      db.saveJob(job);
      this.notifyJob(job);
      setTimeout(() => {
        job.status = 'queued';
        db.saveJob(job);
        this.processNextQueuedJob();
      }, 3000);
    } else {
      job.status = 'needs_review';
      job.currentStepMessage = `Max retries exceeded: ${errorMessage}. Requires manual review.`;
      job.errorMessage = errorMessage;
      db.saveJob(job);
      this.notifyJob(job);

      if (job.imageId) {
        const image = db.getImages().find(i => i.id === job.imageId);
        if (image) {
          image.status = 'needs_review';
          image.statusMessage = errorMessage;
          db.saveImage(image);
        }
      }

      db.addActivity({
        propertyId: job.propertyId,
        propertyName: job.propertyName,
        eventType: 'automation',
        title: 'Job Failed - Needs Review',
        description: `${job.stageName || job.workflowType} failed after ${job.retryCount} attempts: ${errorMessage}`,
        severity: 'error'
      });
    }

    this.releaseWorker(worker, false);
  }

  private releaseWorker(worker: AutomationWorker, success: boolean): void {
    worker.status = 'ready';
    worker.currentJobId = undefined;
    worker.currentPropertyId = undefined;
    worker.currentImageId = undefined;
    worker.currentTaskDescription = undefined;
    worker.lastAction = success ? 'Job completed successfully' : 'Job exited with failure state';
    worker.nextExpectedAction = 'Awaiting next queue assignment';
    worker.totalJobsProcessed = (worker.totalJobsProcessed || 0) + 1;
    if (!success) {
      worker.successRate = Math.max(70, Number(((worker.successRate * 9 + 50) / 10).toFixed(1)));
    }
    db.saveWorker(worker);
    this.notifyWorkers();

    // Trigger next queued job immediately for parallel processing efficiency
    setTimeout(() => this.processNextQueuedJob(), 100);
  }

  private simulateRealisticStep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const automationEngine = new AutomationEngine();
automationEngine.startQueueProcessor();
