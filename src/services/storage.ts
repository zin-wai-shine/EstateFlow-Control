// EstateFlow Control - Local Persistence & Database Layer
import { 
  Property, 
  PropertyImage, 
  AutomationWorker, 
  ChromeProfile, 
  AutomationJob, 
  PromptTemplate, 
  GeneratedContent, 
  PublishingRecord, 
  ActivityEvent, 
  TechnicalLog, 
  AppSettings, 
  User,
  Process,
  ProcessStep,
  ProcessRun,
  PropertyLinkGroup
} from '../types';

const DB_KEY_PREFIX = 'estateflow_db_';
const DB_VERSION = 2;

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'pt-1',
    name: 'Architectural Real-Estate Enhancement',
    category: 'image_enhancement',
    version: '1.2.0',
    purpose: 'Enhance lighting, vertical perspective balance, and window pull clarity for condo and villa interiors',
    isEnabled: true,
    content: `You are an expert luxury architectural real-estate photographer. 
Enhance this property interior photo for "{projectName}". 
Requirements:
1. Perfectly balance high-dynamic-range lighting: soften dark shadows, pull exterior view through windows without blowout.
2. Straighten all vertical lines precisely (90 degree vertical alignment).
3. Enhance warmth and richness of interior materials (wood, stone, textiles) while keeping neutral whites crisp.
4. Maintain photorealistic authenticity: do NOT add imaginary furniture, distort physical proportions, or introduce fantasy elements.
5. Deliver ultra-sharp, high-resolution clarity suitable for luxury real-estate portfolios.`,
    tokens: ['projectName', 'propertyType', 'bedrooms'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pt-2',
    name: 'Facebook High-CTR Hero Composition',
    category: 'facebook_hero',
    version: '1.1.0',
    purpose: 'Create a high-impact 1:1 or 4:5 hero visual combining hero room views with key highlights',
    isEnabled: true,
    content: `Create a captivating, high-conversion Facebook Hero image for "{projectName}" located in {location}.
Property Highlights:
- Type: {propertyType} | {bedrooms} Bed, {bathrooms} Bath | {sizeSqm} Sqm
- Rental Price: ฿{rentalPrice}/month | Transit: {nearestTransit}
Design directive:
- Feature the primary master living space or iconic skyline view as the focal centerpiece.
- Warm, inviting luxury ambiance with pristine lighting.
- Elegant, minimal composition with plenty of negative space suitable for social feed scrolling.`,
    tokens: ['projectName', 'location', 'propertyType', 'bedrooms', 'bathrooms', 'sizeSqm', 'rentalPrice', 'nearestTransit'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pt-3',
    name: 'TikTok / Reels 9:16 Vertical Showcase',
    category: 'tiktok_hero',
    version: '1.0.0',
    purpose: 'Generate vibrant 9:16 vertical cover frame optimized for mobile video feeds',
    isEnabled: true,
    content: `Generate a dynamic 9:16 vertical hero visual for a TikTok tour of "{projectName}".
Location: {location} ({nearestTransit}).
Style: Cinematic modern luxury apartment tour cover frame.
Composition: Tall vertical perspective emphasizing high ceilings, floor-to-ceiling windows, and panoramic skyline views.
Vibe: High aesthetic, clean urban lifestyle, aspirational living.`,
    tokens: ['projectName', 'location', 'nearestTransit', 'bedrooms'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pt-4',
    name: 'High-Converting Facebook Post Copy',
    category: 'facebook_caption',
    version: '2.0.0',
    purpose: 'Engaging real estate listing copy structured for maximum lead inquiries',
    isEnabled: true,
    content: `Write an engaging, professional Facebook listing post for:
Project: {projectName}
Location: {location} ({nearestTransit})
Layout: {bedrooms} Bedroom(s), {bathrooms} Bathroom(s), {sizeSqm} Sq.m., Floor {floor}
Rental: ฿{rentalPrice}/month (Deposit: {depositMonths} months, Advance: {advancePaymentMonths} month)
Furnishings: {furnishedStatus} with complete luxury appliances: {equipment}

Structure:
1. Hook headline highlighting location and luxury vibe.
2. Bullet points with key specifications, transit distance, and amenities.
3. Transparent rental conditions and deposit terms.
4. Direct Call To Action inviting private viewing appointments.
5. Curated real-estate tags.`,
    tokens: ['projectName', 'location', 'nearestTransit', 'bedrooms', 'bathrooms', 'sizeSqm', 'floor', 'rentalPrice', 'depositMonths', 'advancePaymentMonths', 'furnishedStatus', 'equipment'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pt-5',
    name: 'Facebook Marketplace Optimized Listing',
    category: 'marketplace_listing',
    version: '1.3.0',
    purpose: 'Concise, search-optimized title and description tailored for Facebook Marketplace algorithm',
    isEnabled: true,
    content: `Generate Facebook Marketplace listing content for {projectName}.
Rental: ฿{rentalPrice} | Transit: {nearestTransit} | Size: {sizeSqm} Sqm | Beds: {bedrooms}

Generate:
1. Title: Under 65 characters, high keyword density (e.g. "{projectName} | {bedrooms}BR Luxury Condo near {nearestTransit}").
2. Description: Clean, organized overview covering layout, floor, view, appliances, move-in readiness, and owner terms.`,
    tokens: ['projectName', 'rentalPrice', 'nearestTransit', 'sizeSqm', 'bedrooms'],
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_PROFILES: ChromeProfile[] = [
  {
    id: 'prof-a',
    friendlyName: 'Profile A - Primary Enhancement',
    profileDirName: 'Profile_EstateFlow_A',
    purpose: 'enhancement',
    chatGptSessionStatus: 'ready',
    assignedWorkerCount: 2,
    lastActiveAt: new Date().toISOString(),
    accountEmail: 'agent.team@estateflow.pro',
    notes: 'Dedicated for high-volume interior & exterior photo enhancements'
  },
  {
    id: 'prof-b',
    friendlyName: 'Profile B - Secondary Enhancement',
    profileDirName: 'Profile_EstateFlow_B',
    purpose: 'enhancement',
    chatGptSessionStatus: 'ready',
    assignedWorkerCount: 2,
    lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
    accountEmail: 'studio.ops@estateflow.pro',
    notes: 'Secondary parallel worker queue'
  },
  {
    id: 'prof-c',
    friendlyName: 'Profile C - Creative & Hero',
    profileDirName: 'Profile_EstateFlow_C',
    purpose: 'hero',
    chatGptSessionStatus: 'ready',
    assignedWorkerCount: 1,
    lastActiveAt: new Date(Date.now() - 7200000).toISOString(),
    accountEmail: 'creative@estateflow.pro',
    notes: 'Optimized for Facebook 1:1 and TikTok 9:16 hero asset synthesis'
  },
  {
    id: 'prof-d',
    friendlyName: 'Profile D - Social Publishing',
    profileDirName: 'Profile_EstateFlow_Publishing',
    purpose: 'publishing',
    chatGptSessionStatus: 'ready',
    assignedWorkerCount: 1,
    lastActiveAt: new Date(Date.now() - 1800000).toISOString(),
    accountEmail: 'social@estateflow.pro',
    notes: 'Authenticated for Facebook Marketplace and business page automation'
  }
];

export const DEFAULT_WORKERS: AutomationWorker[] = [
  {
    id: 'w-1',
    name: 'Enhance Worker 01',
    profileId: 'prof-a',
    profileFriendlyName: 'Profile A - Primary Enhancement',
    type: 'enhancement',
    role: 'image_enhancement',
    status: 'ready',
    totalJobsProcessed: 142,
    successRate: 98.6,
    startedAt: new Date().toISOString()
  },
  {
    id: 'w-2',
    name: 'Enhance Worker 02',
    profileId: 'prof-a',
    profileFriendlyName: 'Profile A - Primary Enhancement',
    type: 'enhancement',
    role: 'image_enhancement',
    status: 'ready',
    totalJobsProcessed: 128,
    successRate: 97.8,
    startedAt: new Date().toISOString()
  },
  {
    id: 'w-3',
    name: 'Enhance Worker 03',
    profileId: 'prof-b',
    profileFriendlyName: 'Profile B - Secondary Enhancement',
    type: 'enhancement',
    role: 'image_enhancement',
    status: 'ready',
    totalJobsProcessed: 95,
    successRate: 98.9,
    startedAt: new Date().toISOString()
  },
  {
    id: 'w-4',
    name: 'Hero Specialist Worker',
    profileId: 'prof-c',
    profileFriendlyName: 'Profile C - Creative & Hero',
    type: 'hero_facebook',
    role: 'facebook_hero',
    status: 'ready',
    totalJobsProcessed: 64,
    successRate: 96.5,
    startedAt: new Date().toISOString()
  },
  {
    id: 'w-5',
    name: 'Social Publishing Worker',
    profileId: 'prof-d',
    profileFriendlyName: 'Profile D - Social Publishing',
    type: 'publishing',
    role: 'facebook_publishing',
    status: 'ready',
    totalJobsProcessed: 52,
    successRate: 100.0,
    startedAt: new Date().toISOString()
  }
];

export const DEFAULT_PROCESSES: Process[] = [
  {
    id: 'proc-img-enh',
    name: 'Property Image Enhancement',
    description: 'Enhance high-resolution interior and exterior property photos sequentially or in parallel using ChatGPT worker tabs.',
    category: 'image_enhancement',
    status: 'ready',
    inputType: 'original_images',
    outputType: 'enhanced_image',
    processingMode: 'each_image',
    steps: [
      {
        id: 'step-enh-1',
        order: 1,
        name: 'Enhance Image',
        type: 'image_enhancement',
        input: 'original_images',
        profileId: 'prof-a',
        workerAssignmentMode: 'any_available',
        promptTemplateId: 'pt-1',
        expectedResult: 'High dynamic range, well-lit architectural photo with balanced daylight',
        downloadRequirement: true,
        retryPolicy: { maxRetries: 3 },
        timeoutSeconds: 120,
        isEnabled: true
      },
      {
        id: 'step-enh-2',
        order: 2,
        name: 'Verify Download',
        type: 'download_result',
        input: 'enhanced_images',
        profileId: 'prof-a',
        workerAssignmentMode: 'any_available',
        downloadRequirement: true,
        retryPolicy: { maxRetries: 2 },
        timeoutSeconds: 30,
        isEnabled: true
      },
      {
        id: 'step-enh-3',
        order: 3,
        name: 'Save Enhanced Asset',
        type: 'file_operation',
        input: 'enhanced_images',
        profileId: 'prof-a',
        workerAssignmentMode: 'any_available',
        downloadRequirement: false,
        retryPolicy: { maxRetries: 1 },
        timeoutSeconds: 15,
        isEnabled: true
      }
    ],
    runCount: 24,
    successCount: 23,
    failureCount: 1,
    lastRunAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'proc-fb-hero',
    name: 'Facebook Hero Creation',
    description: 'Synthesize attention-grabbing 1:1 and 4:5 social hero covers with typography from enhanced property photos.',
    category: 'hero_generation',
    status: 'ready',
    inputType: 'enhanced_images',
    outputType: 'facebook_hero',
    processingMode: 'batch',
    steps: [
      {
        id: 'step-fb-1',
        order: 1,
        name: 'Generate Hero Prompt',
        type: 'prompt_generation',
        input: 'enhanced_images',
        profileId: 'prof-c',
        workerAssignmentMode: 'specific',
        workerId: 'w-4',
        promptTemplateId: 'pt-2',
        expectedResult: 'Composition-optimized hero banner prompt matching luxury tone',
        downloadRequirement: false,
        retryPolicy: { maxRetries: 2 },
        timeoutSeconds: 45,
        isEnabled: true
      },
      {
        id: 'step-fb-2',
        order: 2,
        name: 'Generate Hero Image',
        type: 'hero_generation',
        input: 'prompt',
        profileId: 'prof-c',
        workerAssignmentMode: 'specific',
        workerId: 'w-4',
        expectedResult: 'Rendered 1:1 high resolution cover asset ready for Facebook Ad and feed placement',
        downloadRequirement: true,
        retryPolicy: { maxRetries: 2 },
        timeoutSeconds: 90,
        isEnabled: true
      }
    ],
    runCount: 12,
    successCount: 12,
    failureCount: 0,
    lastRunAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'proc-tt-hero',
    name: 'TikTok 9:16 Vertical Hero',
    description: 'Transform horizontal photos into high-converting 9:16 vertical full-bleed cover frames for TikTok and Reels.',
    category: 'hero_generation',
    status: 'ready',
    inputType: 'enhanced_images',
    outputType: 'tiktok_hero',
    processingMode: 'batch',
    steps: [
      {
        id: 'step-tt-1',
        order: 1,
        name: 'Generate TikTok Hero Prompt',
        type: 'prompt_generation',
        input: 'enhanced_images',
        profileId: 'prof-c',
        workerAssignmentMode: 'specific',
        workerId: 'w-4',
        promptTemplateId: 'pt-3',
        expectedResult: '9:16 framed prompt with vertical focal points',
        downloadRequirement: false,
        retryPolicy: { maxRetries: 2 },
        timeoutSeconds: 45,
        isEnabled: true
      },
      {
        id: 'step-tt-2',
        order: 2,
        name: 'Generate 9:16 Vertical Cover',
        type: 'hero_generation',
        input: 'prompt',
        profileId: 'prof-c',
        workerAssignmentMode: 'specific',
        workerId: 'w-4',
        expectedResult: '9:16 vertical resolution cover image',
        downloadRequirement: true,
        retryPolicy: { maxRetries: 2 },
        timeoutSeconds: 90,
        isEnabled: true
      }
    ],
    runCount: 8,
    successCount: 7,
    failureCount: 1,
    lastRunAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'proc-content-syn',
    name: 'Social Content & Copywriting Synthesis',
    description: 'Draft multi-channel copywriting including Facebook posts, TikTok captions, hashtags, and Marketplace listings.',
    category: 'content_generation',
    status: 'ready',
    inputType: 'property_details',
    outputType: 'marketplace_content',
    processingMode: 'single',
    steps: [
      {
        id: 'step-cnt-1',
        order: 1,
        name: 'Generate Social & Marketplace Copy',
        type: 'content_generation',
        input: 'property_details',
        profileId: 'prof-d',
        workerAssignmentMode: 'specific',
        workerId: 'w-5',
        promptTemplateId: 'pt-6',
        expectedResult: 'Formatted text package ready for Content Studio review',
        downloadRequirement: false,
        retryPolicy: { maxRetries: 2 },
        timeoutSeconds: 60,
        isEnabled: true
      }
    ],
    runCount: 15,
    successCount: 15,
    failureCount: 0,
    lastRunAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'proc-complete-prep',
    name: 'Complete Property Preparation',
    description: 'End-to-end automated pipeline executing image enhancement, hero banner generation, content drafting, and publishing staging.',
    category: 'property_workflow',
    status: 'ready',
    inputType: 'property',
    outputType: 'published_listing',
    processingMode: 'batch',
    steps: [
      {
        id: 'step-comp-1',
        order: 1,
        name: 'Enhance Original Photos',
        type: 'image_enhancement',
        input: 'original_images',
        profileId: 'prof-a',
        workerAssignmentMode: 'any_available',
        promptTemplateId: 'pt-1',
        expectedResult: 'All uploaded photos enhanced and saved',
        downloadRequirement: true,
        retryPolicy: { maxRetries: 3 },
        timeoutSeconds: 180,
        isEnabled: true
      },
      {
        id: 'step-comp-2',
        order: 2,
        name: 'Generate Facebook Hero',
        type: 'hero_generation',
        input: 'enhanced_images',
        profileId: 'prof-c',
        workerAssignmentMode: 'specific',
        workerId: 'w-4',
        promptTemplateId: 'pt-2',
        expectedResult: '1:1 Hero Cover Asset',
        downloadRequirement: true,
        retryPolicy: { maxRetries: 2 },
        timeoutSeconds: 90,
        isEnabled: true
      },
      {
        id: 'step-comp-3',
        order: 3,
        name: 'Generate TikTok 9:16 Hero',
        type: 'hero_generation',
        input: 'enhanced_images',
        profileId: 'prof-c',
        workerAssignmentMode: 'specific',
        workerId: 'w-4',
        promptTemplateId: 'pt-3',
        expectedResult: '9:16 Vertical Hero Asset',
        downloadRequirement: true,
        retryPolicy: { maxRetries: 2 },
        timeoutSeconds: 90,
        isEnabled: true
      },
      {
        id: 'step-comp-4',
        order: 4,
        name: 'Generate Copywriting & Captions',
        type: 'content_generation',
        input: 'property_details',
        profileId: 'prof-d',
        workerAssignmentMode: 'specific',
        workerId: 'w-5',
        promptTemplateId: 'pt-6',
        expectedResult: 'Multi-channel copy draft',
        downloadRequirement: false,
        retryPolicy: { maxRetries: 2 },
        timeoutSeconds: 60,
        isEnabled: true
      }
    ],
    runCount: 6,
    successCount: 6,
    failureCount: 0,
    lastRunAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export const DEFAULT_PROCESS_RUNS: ProcessRun[] = [
  {
    id: 'RUN-000142',
    processId: 'proc-img-enh',
    processName: 'Property Image Enhancement',
    propertyId: 'prop-1',
    propertyName: 'The Monument Thong Lo',
    status: 'completed',
    currentStepOrder: 3,
    totalSteps: 3,
    jobsCreated: 3,
    jobsCompleted: 3,
    jobsFailed: 0,
    sourceImageIds: ['img-1', 'img-2', 'img-3'],
    activeWorkerIds: [],
    queueImageCount: 0,
    completedImageCount: 3,
    totalImageCount: 3,
    startedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 5 + 184000).toISOString()
  },
  {
    id: 'RUN-000141',
    processId: 'proc-fb-hero',
    processName: 'Facebook Hero Creation',
    propertyId: 'prop-2',
    propertyName: 'Scope Langsuan',
    status: 'completed',
    currentStepOrder: 2,
    totalSteps: 2,
    jobsCreated: 2,
    jobsCompleted: 2,
    jobsFailed: 0,
    sourceImageIds: ['img-4', 'img-5'],
    activeWorkerIds: [],
    queueImageCount: 0,
    completedImageCount: 2,
    totalImageCount: 2,
    startedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 12 + 115000).toISOString()
  }
];

export const DEFAULT_PROPERTY_LINK_GROUPS: PropertyLinkGroup[] = [
  {
    id: 'GROUP-001',
    groupNumber: 1,
    links: [
      'https://www.facebook.com/marketplace/item/1089283749281729',
      'https://www.facebook.com/groups/bangkokcondos/posts/882736192837192',
      'https://line.me/ti/g2/condo-direct-owner-asoke-sukhumvit',
      'https://facebook.com/groups/bangkokrentals/permalink/99182374'
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'GROUP-002',
    groupNumber: 2,
    links: [
      'https://www.facebook.com/marketplace/item/92837461928374',
      'https://example.com/property/sukhumvit-luxury-penthouse',
      'https://line.me/ti/g2/bangkok-prime-properties-deals'
    ],
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    startupMode: 'dashboard',
    defaultPropertyView: 'grid',
    storageRootPath: '~/Documents/EstateFlow Control',
    confirmOnDestructiveActions: true,
    autoCheckUpdates: true
  },
  appearance: {
    theme: 'dark',
    sidebarCollapsed: false,
    compactDensity: false
  },
  automation: {
    activeEnhancementWorkers: 4,
    maxRetries: 3,
    jobTimeoutSeconds: 300,
    autoStartOnPropertyCreate: false,
    parallelEnhancementJobs: 3,
    requireManualPublishApproval: true,
    verifyFileBeforeRelease: true
  },
  openclaw: {
    endpointUrl: 'http://localhost:9222',
    connected: true,
    timeoutSeconds: 45
  },
  docker: {
    autoStartContainers: true,
    servicePort: 8088
  }
};

export const INITIAL_USER: User = {
  id: 'usr-admin-1',
  email: 'admin@estateflow.local',
  name: 'Operations Director',
  role: 'administrator',
  createdAt: new Date().toISOString()
};

// Initial Seed Properties demonstrating realistic luxury real estate data
export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    projectName: 'The Monument Thong Lo',
    propertyType: 'condo',
    listingType: 'rent',
    rentalPrice: 125000,
    bedrooms: 2,
    bathrooms: 3,
    sizeSqm: 124,
    floor: 28,
    building: 'Tower A',
    unitNumber: '2804',
    location: 'Sukhumvit 55, Thonglor, Bangkok',
    nearestTransit: 'BTS Thong Lo 1.2km',
    distanceToTransit: '5 mins shuttle service',
    furnishedStatus: 'fully_furnished',
    equipment: ['Private Elevator', 'Italian Marble Countertops', 'Gaggenau Appliances', 'Smart Home Lighting', 'Wine Cellar'],
    description: 'Iconic trophy residence in the heart of Thong Lo. Features private lift access directly into residence, soaring 3.4m ceiling heights, floor-to-ceiling glass wrapping the living room with sweeping sunrise skyline views.',
    ownerNotes: 'Owner prefers 1-year minimum lease. Professional expats only.',
    internalNotes: 'Exclusive listing agreement signed until December 2027.',
    availabilityDate: 'Immediate',
    moveInDate: 'Available Now',
    smokingAllowed: false,
    petsAllowed: true,
    contractDurationMonths: 12,
    depositMonths: 2,
    advancePaymentMonths: 1,
    ownerContactName: 'Khun Somchai V.',
    ownerContactPhone: '+66 81 555 0192',
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'prop-2',
    projectName: 'Scope Langsuan',
    propertyType: 'condo',
    listingType: 'both',
    rentalPrice: 195000,
    salePrice: 58000000,
    bedrooms: 1,
    bathrooms: 2,
    sizeSqm: 84,
    floor: 16,
    building: 'Residence Main',
    unitNumber: '1602',
    location: 'Langsuan Road, Lumpini, Pathum Wan',
    nearestTransit: 'BTS Chit Lom 180m',
    distanceToTransit: '2 mins walk',
    furnishedStatus: 'fully_furnished',
    equipment: ['Bulthaup Kitchen', 'Sub-Zero Refrigerator', 'Poliform Wardrobes', 'Toto Neorest Toilet', 'Acoustic Glass'],
    description: 'Ultra-exclusive design masterpiece crafted by Thomas Juul-Hansen. Exceptional natural light, bespoke imported European finishes, 24/7 concierge, private screening room, and valet parking.',
    ownerNotes: 'Can furnish extra study desk upon request.',
    internalNotes: 'High inquiry demand for diplomatic tenants.',
    availabilityDate: '2026-10-15',
    moveInDate: 'Mid October',
    smokingAllowed: false,
    petsAllowed: false,
    contractDurationMonths: 12,
    depositMonths: 2,
    advancePaymentMonths: 1,
    ownerContactName: 'Khun Patricia C.',
    ownerContactPhone: '+66 89 444 8831',
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'prop-3',
    projectName: 'Sindhorn Residence',
    propertyType: 'condo',
    listingType: 'rent',
    rentalPrice: 85000,
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 110,
    floor: 12,
    building: 'Tower B',
    unitNumber: '1205',
    location: 'Sindhorn Village, Wireless Road',
    nearestTransit: 'BTS Ratchadamri 600m',
    distanceToTransit: '7 mins walk',
    furnishedStatus: 'fully_furnished',
    equipment: ['Central Air-con', 'Miele Kitchen Suite', 'Washer & Dryer Combo', 'King Size Master Bed'],
    description: 'Peaceful garden sanctuary nestled within the Sindhorn Village green enclave. Overlooks lush canopy trees with world-class wellness facilities and pedestrian-only lifestyle parks at your doorstep.',
    ownerNotes: 'Tenant moving out end of month. Cleaning and touch-up scheduled.',
    internalNotes: 'Already tenant viewing lined up.',
    availabilityDate: '2026-10-01',
    moveInDate: 'Early October',
    smokingAllowed: false,
    petsAllowed: false,
    contractDurationMonths: 12,
    depositMonths: 2,
    advancePaymentMonths: 1,
    status: 'reserved',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

class LocalDatabase {
  private isInitialized = false;

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(DB_KEY_PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(DB_KEY_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`[EstateFlow Database] Failed to write key: ${key}`, e);
    }
  }

  public init(): void {
    if (this.isInitialized) return;

    const storedVersion = this.getItem<number>('schema_version', 0);
    if (storedVersion < DB_VERSION) {
      console.log(`[EstateFlow Database] Migrating schema from v${storedVersion} to v${DB_VERSION}`);
      this.migrate(storedVersion);
      this.setItem('schema_version', DB_VERSION);
    }

    // Ensure defaults exist
    if (!this.getItem<AppSettings | null>('settings', null)) {
      this.setItem('settings', DEFAULT_SETTINGS);
    }

    if (!this.getItem<PromptTemplate[] | null>('prompts', null)) {
      this.setItem('prompts', DEFAULT_PROMPT_TEMPLATES);
    }

    if (!this.getItem<ChromeProfile[] | null>('profiles', null)) {
      this.setItem('profiles', DEFAULT_PROFILES);
    }

    if (!this.getItem<AutomationWorker[] | null>('workers', null)) {
      this.setItem('workers', DEFAULT_WORKERS);
    }

    if (!this.getItem<Process[] | null>('processes', null)) {
      this.setItem('processes', DEFAULT_PROCESSES);
    }

    if (!this.getItem<ProcessRun[] | null>('process_runs', null)) {
      this.setItem('process_runs', DEFAULT_PROCESS_RUNS);
    }

    if (!this.getItem<PropertyLinkGroup[] | null>('property_link_groups', null)) {
      const oldLinks = this.getItem<any[]>('property_links', []);
      if (oldLinks && oldLinks.length > 0) {
        const migrated: PropertyLinkGroup[] = oldLinks.map((item, idx) => ({
          id: `GROUP-${String(idx + 1).padStart(3, '0')}`,
          groupNumber: idx + 1,
          links: [item.url || item.link].filter(Boolean),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString()
        }));
        this.setItem('property_link_groups', migrated);
      } else {
        this.setItem('property_link_groups', DEFAULT_PROPERTY_LINK_GROUPS);
      }
    }

    if (!this.getItem<Property[] | null>('properties', null)) {
      this.setItem('properties', INITIAL_PROPERTIES);
      this.seedInitialImages();
    }

    this.isInitialized = true;
  }

  private seedInitialImages(): void {
    const images: PropertyImage[] = [
      {
        id: 'img-1',
        propertyId: 'prop-1',
        originalFileName: 'Monument_LivingRoom_Wide.jpg',
        filePathOriginal: 'Documents/EstateFlow Control/The Monument Thong Lo/Original/Monument_LivingRoom_Wide.jpg',
        filePathEnhanced: 'Documents/EstateFlow Control/The Monument Thong Lo/Enhanced/Monument_LivingRoom_Wide_enhanced.jpg',
        previewUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        fileSizeBytes: 4892010,
        width: 3840,
        height: 2560,
        orderIndex: 0,
        isFavorite: true,
        isHeroCandidate: true,
        status: 'completed',
        statusMessage: 'Architectural lighting enhanced and downloaded',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'img-2',
        propertyId: 'prop-1',
        originalFileName: 'Monument_MasterBedroom.jpg',
        filePathOriginal: 'Documents/EstateFlow Control/The Monument Thong Lo/Original/Monument_MasterBedroom.jpg',
        filePathEnhanced: 'Documents/EstateFlow Control/The Monument Thong Lo/Enhanced/Monument_MasterBedroom_enhanced.jpg',
        previewUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
        fileSizeBytes: 3940120,
        width: 3840,
        height: 2560,
        orderIndex: 1,
        isFavorite: false,
        isHeroCandidate: true,
        status: 'completed',
        statusMessage: 'Vertical balance applied',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'img-3',
        propertyId: 'prop-1',
        originalFileName: 'Monument_KitchenDining.jpg',
        filePathOriginal: 'Documents/EstateFlow Control/The Monument Thong Lo/Original/Monument_KitchenDining.jpg',
        filePathEnhanced: 'Documents/EstateFlow Control/The Monument Thong Lo/Enhanced/Monument_KitchenDining_enhanced.jpg',
        previewUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        fileSizeBytes: 4210080,
        width: 3840,
        height: 2560,
        orderIndex: 2,
        isFavorite: true,
        isHeroCandidate: false,
        status: 'completed',
        statusMessage: 'Processed successfully',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'img-4',
        propertyId: 'prop-2',
        originalFileName: 'Scope_Living_LumpiniParkView.jpg',
        filePathOriginal: 'Documents/EstateFlow Control/Scope Langsuan/Original/Scope_Living_LumpiniParkView.jpg',
        filePathEnhanced: 'Documents/EstateFlow Control/Scope Langsuan/Enhanced/Scope_Living_LumpiniParkView_enhanced.jpg',
        previewUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        fileSizeBytes: 5120300,
        width: 4000,
        height: 2667,
        orderIndex: 0,
        isFavorite: true,
        isHeroCandidate: true,
        status: 'completed',
        statusMessage: 'Window exposure balanced with exterior park foliage',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    this.setItem('images', images);

    // Initial activity
    const activities: ActivityEvent[] = [
      {
        id: 'act-1',
        propertyId: 'prop-1',
        propertyName: 'The Monument Thong Lo',
        eventType: 'property',
        title: 'Property Registered',
        description: 'New luxury listing added to database with 3 verified images.',
        severity: 'info',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'act-2',
        propertyId: 'prop-1',
        propertyName: 'The Monument Thong Lo',
        eventType: 'automation',
        title: 'Batch Image Enhancement Succeeded',
        description: '3/3 high-res photos enhanced, verified, and saved to property storage.',
        severity: 'success',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString()
      },
      {
        id: 'act-3',
        propertyId: 'prop-2',
        propertyName: 'Scope Langsuan',
        eventType: 'publishing',
        title: 'Facebook Marketplace Draft Ready',
        description: 'Generated listing ready for manual approval review.',
        severity: 'info',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ];
    this.setItem('activities', activities);
  }

  private migrate(fromVersion: number): void {
    if (fromVersion < 1) {
      // initial bootstrap
    }
    if (fromVersion < 2) {
      // update prompt templates to version 2
      const existing = this.getItem<PromptTemplate[]>('prompts', []);
      if (existing.length === 0) {
        this.setItem('prompts', DEFAULT_PROMPT_TEMPLATES);
      }
    }
  }

  // --- PROPERTIES ---
  public getProperties(): Property[] {
    return this.getItem<Property[]>('properties', []);
  }

  public getProperty(id: string): Property | undefined {
    return this.getProperties().find(p => p.id === id);
  }

  public saveProperty(property: Property): void {
    const list = this.getProperties();
    const index = list.findIndex(p => p.id === property.id);
    if (index >= 0) {
      list[index] = { ...property, updatedAt: new Date().toISOString() };
    } else {
      list.unshift(property);
    }
    this.setItem('properties', list);
  }

  public deleteProperty(id: string): void {
    const list = this.getProperties().filter(p => p.id !== id);
    this.setItem('properties', list);
    // clean up associated images
    const images = this.getImages().filter(img => img.propertyId !== id);
    this.setItem('images', images);
  }

  // --- IMAGES ---
  public getImages(propertyId?: string): PropertyImage[] {
    const all = this.getItem<PropertyImage[]>('images', []);
    return propertyId ? all.filter(img => img.propertyId === propertyId) : all;
  }

  public saveImage(image: PropertyImage): void {
    const list = this.getItem<PropertyImage[]>('images', []);
    const index = list.findIndex(img => img.id === image.id);
    if (index >= 0) {
      list[index] = { ...image, updatedAt: new Date().toISOString() };
    } else {
      list.push(image);
    }
    this.setItem('images', list);
  }

  public saveImages(newImages: PropertyImage[]): void {
    const list = this.getItem<PropertyImage[]>('images', []);
    const map = new Map(list.map(i => [i.id, i]));
    newImages.forEach(img => map.set(img.id, img));
    this.setItem('images', Array.from(map.values()));
  }

  public deleteImage(id: string): void {
    const list = this.getItem<PropertyImage[]>('images', []).filter(img => img.id !== id);
    this.setItem('images', list);
  }

  // --- WORKERS & PROFILES ---
  public getProfiles(): ChromeProfile[] {
    return this.getItem<ChromeProfile[]>('profiles', DEFAULT_PROFILES);
  }

  public saveProfile(profile: ChromeProfile): void {
    const list = this.getProfiles();
    const index = list.findIndex(p => p.id === profile.id);
    if (index >= 0) list[index] = profile;
    else list.push(profile);
    this.setItem('profiles', list);
  }

  public deleteProfile(id: string): void {
    const list = this.getProfiles().filter(p => p.id !== id);
    this.setItem('profiles', list);
  }

  public getWorkers(): AutomationWorker[] {
    return this.getItem<AutomationWorker[]>('workers', DEFAULT_WORKERS);
  }

  public saveWorker(worker: AutomationWorker): void {
    const list = this.getWorkers();
    const index = list.findIndex(w => w.id === worker.id);
    if (index >= 0) list[index] = worker;
    else list.push(worker);
    this.setItem('workers', list);
  }

  // --- JOBS & QUEUE ---
  public getJobs(): AutomationJob[] {
    return this.getItem<AutomationJob[]>('jobs', []);
  }

  public saveJob(job: AutomationJob): void {
    const list = this.getJobs();
    const index = list.findIndex(j => j.id === job.id);
    if (index >= 0) list[index] = job;
    else list.unshift(job);
    this.setItem('jobs', list);
  }

  // --- PROMPTS ---
  public getPrompts(): PromptTemplate[] {
    return this.getItem<PromptTemplate[]>('prompts', DEFAULT_PROMPT_TEMPLATES);
  }

  public savePrompt(prompt: PromptTemplate): void {
    const list = this.getPrompts();
    const index = list.findIndex(p => p.id === prompt.id);
    if (index >= 0) list[index] = { ...prompt, updatedAt: new Date().toISOString() };
    else list.push(prompt);
    this.setItem('prompts', list);
  }

  // --- GENERATED CONTENT ---
  public getContent(propertyId: string): GeneratedContent | undefined {
    const list = this.getItem<GeneratedContent[]>('contents', []);
    return list.find(c => c.propertyId === propertyId);
  }

  public saveContent(content: GeneratedContent): void {
    const list = this.getItem<GeneratedContent[]>('contents', []);
    const index = list.findIndex(c => c.propertyId === content.propertyId);
    if (index >= 0) list[index] = { ...content, updatedAt: new Date().toISOString() };
    else list.push(content);
    this.setItem('contents', list);
  }

  // --- PUBLISHING RECORDS ---
  public getPublishingRecords(propertyId?: string): PublishingRecord[] {
    const all = this.getItem<PublishingRecord[]>('publishing_records', []);
    return propertyId ? all.filter(r => r.propertyId === propertyId) : all;
  }

  public savePublishingRecord(record: PublishingRecord): void {
    const list = this.getItem<PublishingRecord[]>('publishing_records', []);
    const index = list.findIndex(r => r.id === record.id);
    if (index >= 0) list[index] = record;
    else list.unshift(record);
    this.setItem('publishing_records', list);
  }

  // --- ACTIVITY & LOGS ---
  public getActivities(): ActivityEvent[] {
    return this.getItem<ActivityEvent[]>('activities', []);
  }

  public addActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): void {
    const list = this.getActivities();
    const newEvent: ActivityEvent = {
      ...event,
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString()
    };
    list.unshift(newEvent);
    // keep maximum 500 events
    if (list.length > 500) list.length = 500;
    this.setItem('activities', list);
  }

  public getTechnicalLogs(): TechnicalLog[] {
    return this.getItem<TechnicalLog[]>('technical_logs', []);
  }

  public addTechnicalLog(log: Omit<TechnicalLog, 'id' | 'timestamp'>): void {
    const list = this.getTechnicalLogs();
    const newLog: TechnicalLog = {
      ...log,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString()
    };
    list.unshift(newLog);
    // keep maximum 1000 technical logs (log rotation)
    if (list.length > 1000) list.length = 1000;
    this.setItem('technical_logs', list);
  }

  // --- SETTINGS ---
  public getSettings(): AppSettings {
    return this.getItem<AppSettings>('settings', DEFAULT_SETTINGS);
  }

  public saveSettings(settings: AppSettings): void {
    this.setItem('settings', settings);
  }

  // --- PROCESSES ---
  public getProcesses(includeArchived = false): Process[] {
    const list = this.getItem<Process[]>('processes', DEFAULT_PROCESSES);
    return includeArchived ? list : list.filter(p => !p.isArchived);
  }

  public getProcess(id: string): Process | undefined {
    return this.getItem<Process[]>('processes', DEFAULT_PROCESSES).find(p => p.id === id);
  }

  public saveProcess(process: Process): void {
    const list = this.getItem<Process[]>('processes', DEFAULT_PROCESSES);
    const index = list.findIndex(p => p.id === process.id);
    if (index >= 0) {
      list[index] = { ...process, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...process, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.setItem('processes', list);
  }

  public duplicateProcess(id: string, newName?: string): Process | undefined {
    const original = this.getProcess(id);
    if (!original) return undefined;
    const duplicated: Process = {
      ...original,
      id: 'proc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      name: newName || `${original.name} (Copy)`,
      status: 'ready',
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      lastRunAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.saveProcess(duplicated);
    return duplicated;
  }

  public archiveProcess(id: string): void {
    const process = this.getProcess(id);
    if (process) {
      this.saveProcess({ ...process, isArchived: true, status: 'archived' });
    }
  }

  public unarchiveProcess(id: string): void {
    const process = this.getProcess(id);
    if (process) {
      this.saveProcess({ ...process, isArchived: false, status: 'ready' });
    }
  }

  public deleteProcess(id: string): boolean {
    const activeRuns = this.getProcessRuns(id).filter(r => r.status === 'running' || r.status === 'queued');
    if (activeRuns.length > 0) {
      return false;
    }
    const list = this.getItem<Process[]>('processes', DEFAULT_PROCESSES).filter(p => p.id !== id);
    this.setItem('processes', list);
    return true;
  }

  // --- PROCESS RUNS ---
  public getProcessRuns(processId?: string, propertyId?: string): ProcessRun[] {
    const all = this.getItem<ProcessRun[]>('process_runs', DEFAULT_PROCESS_RUNS);
    return all.filter(r => {
      if (processId && r.processId !== processId) return false;
      if (propertyId && r.propertyId !== propertyId) return false;
      return true;
    });
  }

  public getProcessRun(id: string): ProcessRun | undefined {
    return this.getItem<ProcessRun[]>('process_runs', DEFAULT_PROCESS_RUNS).find(r => r.id === id);
  }

  public saveProcessRun(run: ProcessRun): void {
    const list = this.getItem<ProcessRun[]>('process_runs', DEFAULT_PROCESS_RUNS);
    const index = list.findIndex(r => r.id === run.id);
    if (index >= 0) {
      list[index] = run;
    } else {
      list.unshift(run);
    }
    this.setItem('process_runs', list);
  }

  // --- PROPERTY LINK GROUPS ---
  public getPropertyLinkGroups(): PropertyLinkGroup[] {
    const list = this.getItem<PropertyLinkGroup[] | null>('property_link_groups', null);
    if (list !== null) return list;
    return DEFAULT_PROPERTY_LINK_GROUPS;
  }

  public getPropertyLinkGroup(id: string): PropertyLinkGroup | undefined {
    return this.getPropertyLinkGroups().find(g => g.id === id);
  }

  public savePropertyLinkGroup(group: PropertyLinkGroup): PropertyLinkGroup {
    const list = [...this.getPropertyLinkGroups()];
    const index = list.findIndex(g => g.id === group.id);
    if (index >= 0) {
      list[index] = { ...group, updatedAt: new Date().toISOString() };
    } else {
      const nextNum = list.reduce((max, g) => Math.max(max, g.groupNumber || 0), 0) + 1;
      const newGroup: PropertyLinkGroup = {
        ...group,
        groupNumber: group.groupNumber || nextNum,
        createdAt: group.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.unshift(newGroup);
    }
    this.setItem('property_link_groups', list);
    return group;
  }

  public deletePropertyLinkGroup(id: string): boolean {
    const list = this.getPropertyLinkGroups();
    const filtered = list.filter(g => g.id !== id);
    if (filtered.length !== list.length) {
      this.setItem('property_link_groups', filtered);
      return true;
    }
    return false;
  }

  // --- BACKUP & RESTORE ---
  public exportBackup(): string {
    const fullBackup = {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      properties: this.getProperties(),
      images: this.getImages(),
      profiles: this.getProfiles(),
      workers: this.getWorkers(),
      jobs: this.getJobs(),
      processes: this.getProcesses(true),
      process_runs: this.getProcessRuns(),
      property_link_groups: this.getPropertyLinkGroups(),
      prompts: this.getPrompts(),
      contents: this.getItem<GeneratedContent[]>('contents', []),
      publishing_records: this.getPublishingRecords(),
      settings: this.getSettings()
    };
    return JSON.stringify(fullBackup, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.properties) this.setItem('properties', data.properties);
      if (data.images) this.setItem('images', data.images);
      if (data.profiles) this.setItem('profiles', data.profiles);
      if (data.workers) this.setItem('workers', data.workers);
      if (data.processes) this.setItem('processes', data.processes);
      if (data.process_runs) this.setItem('process_runs', data.process_runs);
      if (data.property_link_groups) this.setItem('property_link_groups', data.property_link_groups);
      if (data.prompts) this.setItem('prompts', data.prompts);
      if (data.contents) this.setItem('contents', data.contents);
      if (data.publishing_records) this.setItem('publishing_records', data.publishing_records);
      if (data.settings) this.setItem('settings', data.settings);
      return true;
    } catch (e) {
      console.error('[EstateFlow Database] Failed to import backup', e);
      return false;
    }
  }
}

export const db = new LocalDatabase();
db.init();
