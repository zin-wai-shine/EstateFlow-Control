// EstateFlow Control - Extensible Node Registry System
import { 
  NodeDefinition, 
  NodeCategory, 
  PortDataType, 
  PipelineNode 
} from '../types/pipeline';

export const NODE_CATEGORY_METADATA: Record<NodeCategory, { label: string; description: string; badgeColor: string }> = {
  input: {
    label: 'Input',
    description: 'Entry points, source files, property context and pipeline triggers',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  },
  browser: {
    label: 'Browser',
    description: 'Native Chrome session control, tab navigation and page interactions',
    badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-400'
  },
  chat_ai: {
    label: 'Chat / AI Browser',
    description: 'Prompt generation, AI image synthesis, chat uploads and response capture',
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400'
  },
  file: {
    label: 'File Operations',
    description: 'File reading, directory creation, asset verification and storage moves',
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  },
  data: {
    label: 'Data & Variables',
    description: 'Dynamic text substitution, field extraction, variables and merging',
    badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
  },
  flow: {
    label: 'Flow & Logic',
    description: 'Parallel execution, for-each iteration, joins, conditions and manual approval',
    badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-400'
  },
  media: {
    label: 'Media Processing',
    description: 'Image batching, external web processors, hero graphics and watermarking',
    badgeColor: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
  },
  output: {
    label: 'Output & Publish',
    description: 'Asset catalog saving, property updates, social publishing and completion',
    badgeColor: 'border-teal-500/30 bg-teal-500/10 text-teal-400'
  }
};

export const NODE_DEFINITIONS: NodeDefinition[] = [
  // ==========================================
  // INPUT NODES
  // ==========================================
  {
    type: 'input_property',
    category: 'input',
    name: 'Property',
    description: 'Loads active property record with price, location, details, and metadata',
    iconName: 'FiHome',
    inputs: [],
    outputs: [
      { id: 'prop_out', name: 'property', type: 'property', label: 'Property' },
      { id: 'details_out', name: 'details', type: 'text', label: 'Details' }
    ],
    defaultConfig: {
      propertySelectMode: 'active_or_runtime',
      fallbackPropertyId: ''
    },
    configFields: [
      {
        name: 'propertySelectMode',
        label: 'Selection Mode',
        type: 'select',
        options: [
          { value: 'active_or_runtime', label: 'Runtime Target (Pass on Run)' },
          { value: 'fixed_property', label: 'Fixed Property' }
        ],
        defaultValue: 'active_or_runtime'
      },
      {
        name: 'fallbackPropertyId',
        label: 'Fixed Property ID',
        type: 'text',
        placeholder: 'prop-1',
        advanced: true
      }
    ]
  },
  {
    type: 'input_property_images',
    category: 'input',
    name: 'Property Images',
    description: 'Feeds all original or selected photo assets from the target property',
    iconName: 'FiImage',
    inputs: [
      { id: 'prop_in', name: 'property', type: 'property', label: 'Property', required: false }
    ],
    outputs: [
      { id: 'images_out', name: 'images', type: 'image_collection', label: 'Images Collection' },
      { id: 'count_out', name: 'count', type: 'number', label: 'Count' }
    ],
    defaultConfig: {
      imageCategoryFilter: 'all',
      maxImagesLimit: 0,
      sortOrder: 'original_index'
    },
    configFields: [
      {
        name: 'imageCategoryFilter',
        label: 'Category Filter',
        type: 'select',
        options: [
          { value: 'all', label: 'All Property Photos' },
          { value: 'original_only', label: 'Original Photos Only' },
          { value: 'facility_only', label: 'Facility / Amenity Photos' },
          { value: 'hero_candidates', label: 'Hero Candidates' }
        ],
        defaultValue: 'all'
      },
      {
        name: 'maxImagesLimit',
        label: 'Max Images (0 for Unlimited)',
        type: 'number',
        defaultValue: 0
      }
    ]
  },
  {
    type: 'input_selected_images',
    category: 'input',
    name: 'Selected Images',
    description: 'Specific images chosen manually or filtered by tags',
    iconName: 'FiCheckSquare',
    inputs: [
      { id: 'images_in', name: 'images', type: 'image_collection', label: 'Images', required: false }
    ],
    outputs: [
      { id: 'selected_out', name: 'selected', type: 'image_collection', label: 'Selected Images' }
    ],
    defaultConfig: {
      selectionRule: 'first_n',
      countN: 3
    },
    configFields: [
      {
        name: 'selectionRule',
        label: 'Selection Criteria',
        type: 'select',
        options: [
          { value: 'first_n', label: 'First N Images' },
          { value: 'last_n', label: 'Last N Images' },
          { value: 'tagged_facility', label: 'Tagged as Facility' }
        ],
        defaultValue: 'first_n'
      },
      {
        name: 'countN',
        label: 'Quantity (N)',
        type: 'number',
        defaultValue: 3
      }
    ]
  },
  {
    type: 'input_folder',
    category: 'input',
    name: 'Folder',
    description: 'Direct filesystem folder path to ingest assets from local disk',
    iconName: 'FiFolder',
    inputs: [],
    outputs: [
      { id: 'folder_out', name: 'folderPath', type: 'text', label: 'Folder Path' },
      { id: 'files_out', name: 'files', type: 'file_collection', label: 'Files' }
    ],
    defaultConfig: {
      folderPath: '~/Desktop/PropertyAssets',
      recursive: false
    },
    configFields: [
      {
        name: 'folderPath',
        label: 'Folder Path',
        type: 'text',
        placeholder: '/Users/name/Pictures/Properties'
      },
      {
        name: 'recursive',
        label: 'Include Subdirectories',
        type: 'boolean',
        defaultValue: false,
        advanced: true
      }
    ]
  },
  {
    type: 'input_text',
    category: 'input',
    name: 'Text Input',
    description: 'Static or templated text payload (e.g. system instructions, seed prompt)',
    iconName: 'FiFileText',
    inputs: [],
    outputs: [
      { id: 'text_out', name: 'text', type: 'text', label: 'Text' }
    ],
    defaultConfig: {
      textContent: 'High-end architectural lighting with natural daylight balance.'
    },
    configFields: [
      {
        name: 'textContent',
        label: 'Text Content',
        type: 'textarea',
        placeholder: 'Enter custom text or prompt instructions...'
      }
    ]
  },
  {
    type: 'input_property_links',
    category: 'input',
    name: 'Saved Property Link Group',
    description: 'Reads stored property listing URLs from Properties Link database',
    iconName: 'FiLink',
    inputs: [],
    outputs: [
      { id: 'links_out', name: 'urls', type: 'file_collection', label: 'URLs' }
    ],
    defaultConfig: {
      groupId: 'first_available'
    },
    configFields: [
      {
        name: 'groupId',
        label: 'Link Group',
        type: 'select',
        options: [
          { value: 'first_available', label: 'Latest Saved Group' },
          { value: 'all', label: 'All Saved Links' }
        ],
        defaultValue: 'first_available'
      }
    ]
  },

  // ==========================================
  // BROWSER NODES
  // ==========================================
  {
    type: 'browser_use_saved',
    category: 'browser',
    name: 'Use Saved Browser',
    description: 'Selects a persistent authenticated Chrome browser profile from EstateFlow',
    iconName: 'FiGlobe',
    inputs: [],
    outputs: [
      { id: 'browser_out', name: 'browser', type: 'browser_session', label: 'Browser Session' }
    ],
    defaultConfig: {
      browserProfileId: '',
      autoFocus: true
    },
    configFields: [
      {
        name: 'browserProfileId',
        label: 'Saved Browser Profile',
        type: 'browser_select'
      },
      {
        name: 'autoFocus',
        label: 'Focus Window on Start',
        type: 'boolean',
        defaultValue: true,
        advanced: true
      }
    ]
  },
  {
    type: 'browser_use_tab',
    category: 'browser',
    name: 'Browser Tab',
    description: 'Targets an existing or dynamic tab inside the browser (by role or label)',
    iconName: 'FiLayers',
    inputs: [
      { id: 'browser_in', name: 'browser', type: 'browser_session', label: 'Browser', required: true }
    ],
    outputs: [
      { id: 'tab_out', name: 'tab', type: 'browser_tab', label: 'Browser Tab' }
    ],
    defaultConfig: {
      tabMode: 'automatic',
      tabRole: 'Image Enhancement',
      urlFilter: 'chatgpt.com'
    },
    configFields: [
      {
        name: 'tabMode',
        label: 'Tab Discovery Mode',
        type: 'select',
        options: [
          { value: 'automatic', label: 'Automatic (Recommended)' },
          { value: 'existing_tab', label: 'Specific Existing Tab' },
          { value: 'create_tab', label: 'Always Open New Tab' }
        ],
        defaultValue: 'automatic'
      },
      {
        name: 'tabRole',
        label: 'Designated Role / Label',
        type: 'text',
        placeholder: 'Enhance Worker 1',
        defaultValue: 'Image Enhancement'
      },
      {
        name: 'urlFilter',
        label: 'Expected URL Substring',
        type: 'text',
        placeholder: 'chatgpt.com',
        advanced: true
      }
    ]
  },
  {
    type: 'browser_open_url',
    category: 'browser',
    name: 'Open URL',
    description: 'Navigates the selected tab to an external web tool or automation endpoint',
    iconName: 'FiCompass',
    inputs: [
      { id: 'tab_in', name: 'tab', type: 'browser_tab', label: 'Browser Tab', required: true },
      { id: 'url_in', name: 'customUrl', type: 'url', label: 'URL', required: false }
    ],
    outputs: [
      { id: 'tab_out', name: 'tab', type: 'browser_tab', label: 'Browser Tab' }
    ],
    defaultConfig: {
      url: 'https://chatgpt.com',
      waitForNetworkIdle: true,
      timeoutSeconds: 30
    },
    configFields: [
      {
        name: 'url',
        label: 'Destination URL',
        type: 'text',
        placeholder: 'https://chatgpt.com'
      },
      {
        name: 'waitForNetworkIdle',
        label: 'Wait for Network Idle',
        type: 'boolean',
        defaultValue: true,
        advanced: true
      },
      {
        name: 'timeoutSeconds',
        label: 'Timeout (Seconds)',
        type: 'number',
        defaultValue: 30,
        advanced: true
      }
    ]
  },
  {
    type: 'browser_custom_action',
    category: 'browser',
    name: 'Browser Action',
    description: 'Executes a custom DOM interaction (click, type, evaluate script) on page',
    iconName: 'FiCpu',
    inputs: [
      { id: 'tab_in', name: 'tab', type: 'browser_tab', label: 'Browser Tab', required: true }
    ],
    outputs: [
      { id: 'tab_out', name: 'tab', type: 'browser_tab', label: 'Browser Tab' },
      { id: 'result_out', name: 'result', type: 'text', label: 'Result Text' }
    ],
    defaultConfig: {
      actionType: 'click',
      selector: 'button[type="submit"]',
      inputText: ''
    },
    configFields: [
      {
        name: 'actionType',
        label: 'Action Type',
        type: 'select',
        options: [
          { value: 'click', label: 'Click Element' },
          { value: 'type', label: 'Type Text' },
          { value: 'scroll', label: 'Scroll Page' },
          { value: 'wait_selector', label: 'Wait for Element' }
        ],
        defaultValue: 'click'
      },
      {
        name: 'selector',
        label: 'CSS Selector / Text',
        type: 'text',
        placeholder: 'button[type="submit"]'
      },
      {
        name: 'inputText',
        label: 'Input Text (if typing)',
        type: 'text',
        advanced: true
      }
    ]
  },

  // ==========================================
  // CHAT / AI BROWSER NODES
  // ==========================================
  {
    type: 'chat_send_prompt',
    category: 'chat_ai',
    name: 'Send Prompt',
    description: 'Submits prompt instructions into the active ChatGPT or AI chat tab',
    iconName: 'FiSend',
    inputs: [
      { id: 'tab_in', name: 'tab', type: 'browser_tab', label: 'Browser Tab', required: true },
      { id: 'prompt_in', name: 'prompt', type: 'prompt', label: 'Prompt', required: false },
      { id: 'property_in', name: 'property', type: 'property', label: 'Property', required: false }
    ],
    outputs: [
      { id: 'tab_out', name: 'tab', type: 'browser_tab', label: 'Browser Tab' }
    ],
    defaultConfig: {
      promptSource: 'template',
      promptTemplateId: 'pt-1',
      customPromptText: '',
      submitMethod: 'enter_key'
    },
    configFields: [
      {
        name: 'promptSource',
        label: 'Prompt Source',
        type: 'select',
        options: [
          { value: 'template', label: 'EstateFlow Prompt Template' },
          { value: 'connected_input', label: 'From Previous Node Output' },
          { value: 'custom_inline', label: 'Custom Inline Text' }
        ],
        defaultValue: 'template'
      },
      {
        name: 'promptTemplateId',
        label: 'Select Template',
        type: 'prompt_template_select'
      },
      {
        name: 'customPromptText',
        label: 'Custom Prompt (Supports {{var}})',
        type: 'textarea',
        placeholder: 'Enhance this architectural photo for {{property.title}}...',
        advanced: true
      }
    ]
  },
  {
    type: 'chat_upload_images',
    category: 'chat_ai',
    name: 'Upload Images',
    description: 'Attaches property photos into the chat input box via native file picker',
    iconName: 'FiUploadCloud',
    inputs: [
      { id: 'tab_in', name: 'tab', type: 'browser_tab', label: 'Browser Tab', required: true },
      { id: 'images_in', name: 'images', type: 'image_collection', label: 'Images', required: true }
    ],
    outputs: [
      { id: 'tab_out', name: 'tab', type: 'browser_tab', label: 'Browser Tab' }
    ],
    defaultConfig: {
      batchMode: 'all_at_once',
      maxUploads: 5
    },
    configFields: [
      {
        name: 'batchMode',
        label: 'Upload Mode',
        type: 'select',
        options: [
          { value: 'all_at_once', label: 'All Images in 1 Message' },
          { value: 'one_by_one', label: 'Single Image per Loop' }
        ],
        defaultValue: 'all_at_once'
      }
    ]
  },
  {
    type: 'chat_wait_response',
    category: 'chat_ai',
    name: 'Wait For Response',
    description: 'Monitors DOM until ChatGPT finishes generating text or image output',
    iconName: 'FiClock',
    inputs: [
      { id: 'tab_in', name: 'tab', type: 'browser_tab', label: 'Browser Tab', required: true }
    ],
    outputs: [
      { id: 'tab_out', name: 'tab', type: 'browser_tab', label: 'Browser Tab' },
      { id: 'status_out', name: 'completed', type: 'boolean', label: 'Completed' }
    ],
    defaultConfig: {
      detectionMethod: 'stop_generating_button',
      timeoutSeconds: 120,
      pollIntervalMs: 1500
    },
    configFields: [
      {
        name: 'detectionMethod',
        label: 'Completion Trigger',
        type: 'select',
        options: [
          { value: 'stop_generating_button', label: 'Stop Generating Button Disappears' },
          { value: 'new_image_appeared', label: 'New Generated Image Appears' },
          { value: 'copy_button_visible', label: 'Copy Button Becomes Active' }
        ],
        defaultValue: 'stop_generating_button'
      },
      {
        name: 'timeoutSeconds',
        label: 'Timeout Limit (Seconds)',
        type: 'number',
        defaultValue: 120
      }
    ]
  },
  {
    type: 'chat_capture_response',
    category: 'chat_ai',
    name: 'Capture Response Text',
    description: 'Extracts generated markdown, description or prompt text into pipeline data',
    iconName: 'FiFileText',
    inputs: [
      { id: 'tab_in', name: 'tab', type: 'browser_tab', label: 'Browser Tab', required: true }
    ],
    outputs: [
      { id: 'text_out', name: 'responseText', type: 'text', label: 'Response Text' },
      { id: 'prompt_out', name: 'generatedPrompt', type: 'prompt', label: 'Prompt Output' }
    ],
    defaultConfig: {
      stripCodeBlocks: false,
      cleanWhitespace: true
    },
    configFields: [
      {
        name: 'stripCodeBlocks',
        label: 'Strip Code Block Fences (```)',
        type: 'boolean',
        defaultValue: false
      }
    ]
  },
  {
    type: 'chat_download_file',
    category: 'chat_ai',
    name: 'Download Generated File',
    description: 'Triggers download of the latest generated image or file asset from chat',
    iconName: 'FiDownloadCloud',
    inputs: [
      { id: 'tab_in', name: 'tab', type: 'browser_tab', label: 'Browser Tab', required: true }
    ],
    outputs: [
      { id: 'file_out', name: 'downloadedFile', type: 'file', label: 'Downloaded File' }
    ],
    defaultConfig: {
      destinationFolder: 'property_enhanced',
      namingPattern: '{{property.id}}_enhanced_{{index}}.jpg',
      verifySizeNonZero: true
    },
    configFields: [
      {
        name: 'destinationFolder',
        label: 'Destination Storage',
        type: 'select',
        options: [
          { value: 'property_enhanced', label: 'Property Enhanced Assets' },
          { value: 'property_hero', label: 'Property Hero Directory' },
          { value: 'downloads', label: 'System Downloads Folder' }
        ],
        defaultValue: 'property_enhanced'
      },
      {
        name: 'namingPattern',
        label: 'File Naming Pattern',
        type: 'text',
        defaultValue: '{{property.id}}_enhanced_{{index}}.jpg',
        advanced: true
      }
    ]
  },

  // ==========================================
  // FILE NODES
  // ==========================================
  {
    type: 'file_verify',
    category: 'file',
    name: 'Verify File',
    description: 'Validates file existence, non-zero byte size, and timestamp integrity',
    iconName: 'FiCheckCircle',
    inputs: [
      { id: 'file_in', name: 'file', type: 'file', label: 'File', required: true }
    ],
    outputs: [
      { id: 'file_out', name: 'verifiedFile', type: 'file', label: 'Verified File' },
      { id: 'valid_out', name: 'isValid', type: 'boolean', label: 'Valid Status' }
    ],
    defaultConfig: {
      minSizeBytes: 51200, // 50KB
      requireCurrentRunTimestamp: true
    },
    configFields: [
      {
        name: 'minSizeBytes',
        label: 'Minimum File Size (Bytes)',
        type: 'number',
        defaultValue: 51200
      }
    ]
  },
  {
    type: 'file_save',
    category: 'file',
    name: 'Save File',
    description: 'Commits downloaded or processed assets into property catalog storage',
    iconName: 'FiSave',
    inputs: [
      { id: 'file_in', name: 'file', type: 'file', label: 'File', required: true },
      { id: 'prop_in', name: 'property', type: 'property', label: 'Property', required: false }
    ],
    outputs: [
      { id: 'saved_out', name: 'savedPath', type: 'text', label: 'Saved Path' }
    ],
    defaultConfig: {
      targetCategory: 'enhanced',
      autoRegisterInDatabase: true
    },
    configFields: [
      {
        name: 'targetCategory',
        label: 'Asset Category',
        type: 'select',
        options: [
          { value: 'enhanced', label: 'Enhanced Photo' },
          { value: 'hero', label: 'Hero Image' },
          { value: 'document', label: 'Property Document' }
        ],
        defaultValue: 'enhanced'
      }
    ]
  },

  // ==========================================
  // DATA NODES
  // ==========================================
  {
    type: 'data_build_prompt',
    category: 'data',
    name: 'Build Prompt',
    description: 'Merges property variables into a structured prompt for social or AI copy',
    iconName: 'FiEdit2',
    inputs: [
      { id: 'prop_in', name: 'property', type: 'property', label: 'Property', required: false },
      { id: 'text_in', name: 'additionalContext', type: 'text', label: 'Context', required: false }
    ],
    outputs: [
      { id: 'prompt_out', name: 'prompt', type: 'prompt', label: 'Compiled Prompt' }
    ],
    defaultConfig: {
      targetPlatform: 'facebook',
      includePriceAndSpecs: true,
      toneOfVoice: 'luxury_professional'
    },
    configFields: [
      {
        name: 'targetPlatform',
        label: 'Target Platform',
        type: 'select',
        options: [
          { value: 'facebook', label: 'Facebook Listing Post' },
          { value: 'tiktok', label: 'TikTok Dynamic Video Script' },
          { value: 'marketplace', label: 'Marketplace Clean Specs' }
        ],
        defaultValue: 'facebook'
      },
      {
        name: 'includePriceAndSpecs',
        label: 'Include Price & Dimensions',
        type: 'boolean',
        defaultValue: true
      }
    ]
  },
  {
    type: 'data_set_var',
    category: 'data',
    name: 'Set Variable',
    description: 'Stores key-value data accessible across all subsequent nodes with {{key}}',
    iconName: 'FiSliders',
    inputs: [
      { id: 'val_in', name: 'value', type: 'any', label: 'Value', required: true }
    ],
    outputs: [
      { id: 'val_out', name: 'passedValue', type: 'any', label: 'Value' }
    ],
    defaultConfig: {
      variableKey: 'customVar'
    },
    configFields: [
      {
        name: 'variableKey',
        label: 'Variable Name',
        type: 'text',
        placeholder: 'heroHeadline',
        defaultValue: 'customVar'
      }
    ]
  },

  // ==========================================
  // FLOW CONTROL NODES
  // ==========================================
  {
    type: 'flow_start',
    category: 'flow',
    name: 'Start',
    description: 'Pipeline entry point that receives launch parameters and triggers graph',
    iconName: 'FiPlay',
    inputs: [],
    outputs: [
      { id: 'start_out', name: 'trigger', type: 'any', label: 'Trigger' }
    ],
    defaultConfig: {},
    configFields: []
  },
  {
    type: 'flow_for_each',
    category: 'flow',
    name: 'For Each',
    description: 'Iterates through an asset collection with worker pool concurrency',
    iconName: 'FiRepeat',
    inputs: [
      { id: 'items_in', name: 'items', type: 'image_collection', label: 'Items Collection', required: true }
    ],
    outputs: [
      { id: 'item_out', name: 'currentItem', type: 'image', label: 'Current Item' },
      { id: 'index_out', name: 'index', type: 'number', label: 'Index' },
      { id: 'all_done_out', name: 'allCompleted', type: 'image_collection', label: 'Completed Collection' }
    ],
    defaultConfig: {
      concurrencyLimit: 4,
      workerPoolId: 'enhancement_pool',
      batchDelayMs: 500
    },
    configFields: [
      {
        name: 'workerPoolId',
        label: 'Assigned Worker Pool',
        type: 'worker_pool_select'
      },
      {
        name: 'concurrencyLimit',
        label: 'Concurrency Limit (Parallel Workers)',
        type: 'number',
        defaultValue: 4
      }
    ]
  },
  {
    type: 'flow_parallel',
    category: 'flow',
    name: 'Parallel',
    description: 'Splits workflow into multiple simultaneous branches that execute concurrently',
    iconName: 'FiGitBranch',
    inputs: [
      { id: 'trigger_in', name: 'trigger', type: 'any', label: 'Trigger', required: true }
    ],
    outputs: [
      { id: 'branch1_out', name: 'branchA', type: 'any', label: 'Branch A' },
      { id: 'branch2_out', name: 'branchB', type: 'any', label: 'Branch B' },
      { id: 'branch3_out', name: 'branchC', type: 'any', label: 'Branch C' }
    ],
    defaultConfig: {
      activeBranchesCount: 2
    },
    configFields: [
      {
        name: 'activeBranchesCount',
        label: 'Parallel Branches',
        type: 'number',
        defaultValue: 2
      }
    ]
  },
  {
    type: 'flow_join',
    category: 'flow',
    name: 'Join',
    description: 'Synchronizes parallel branches (Wait for All, Wait for Any, or Wait for N)',
    iconName: 'FiGitMerge',
    inputs: [
      { id: 'branch1_in', name: 'branchA', type: 'any', label: 'Branch A', required: true },
      { id: 'branch2_in', name: 'branchB', type: 'any', label: 'Branch B', required: false },
      { id: 'branch3_in', name: 'branchC', type: 'any', label: 'Branch C', required: false }
    ],
    outputs: [
      { id: 'join_out', name: 'completed', type: 'any', label: 'Synchronized Output' }
    ],
    defaultConfig: {
      joinStrategy: 'wait_for_all'
    },
    configFields: [
      {
        name: 'joinStrategy',
        label: 'Synchronization Rule',
        type: 'select',
        options: [
          { value: 'wait_for_all', label: 'Wait For All Branches' },
          { value: 'wait_for_any', label: 'Wait For Any (First Finishes)' }
        ],
        defaultValue: 'wait_for_all'
      }
    ]
  },
  {
    type: 'flow_condition',
    category: 'flow',
    name: 'Condition',
    description: 'Evaluates logical rules (e.g. file count, approval flag, platform)',
    iconName: 'FiHelpCircle',
    inputs: [
      { id: 'val_in', name: 'inputVal', type: 'any', label: 'Value', required: true }
    ],
    outputs: [
      { id: 'true_out', name: 'trueBranch', type: 'any', label: 'True Branch' },
      { id: 'false_out', name: 'falseBranch', type: 'any', label: 'False Branch' }
    ],
    defaultConfig: {
      operator: 'not_empty',
      compareValue: ''
    },
    configFields: [
      {
        name: 'operator',
        label: 'Condition Operator',
        type: 'select',
        options: [
          { value: 'not_empty', label: 'Is Not Empty' },
          { value: 'greater_than', label: 'Count Greater Than' },
          { value: 'equals', label: 'Equals' }
        ],
        defaultValue: 'not_empty'
      },
      {
        name: 'compareValue',
        label: 'Comparison Target',
        type: 'text',
        placeholder: 'Value to compare...'
      }
    ]
  },
  {
    type: 'flow_approval',
    category: 'flow',
    name: 'Manual Approval',
    description: 'Pauses pipeline execution and notifies user for visual sign-off before proceeding',
    iconName: 'FiCheckSquare',
    inputs: [
      { id: 'items_in', name: 'assets', type: 'any', label: 'Assets to Review', required: true }
    ],
    outputs: [
      { id: 'approved_out', name: 'approved', type: 'any', label: 'Approved' }
    ],
    defaultConfig: {
      approvalTitle: 'Review Enhanced Photos & Hero Graphics',
      allowInlineEdits: true
    },
    configFields: [
      {
        name: 'approvalTitle',
        label: 'Approval Prompt Text',
        type: 'text',
        defaultValue: 'Review Enhanced Photos & Hero Graphics'
      }
    ]
  },

  // ==========================================
  // MEDIA NODES
  // ==========================================
  {
    type: 'media_hero_image',
    category: 'media',
    name: 'Hero Image',
    description: 'Synthesizes master social hero cover (1:1 Facebook or 9:16 TikTok format)',
    iconName: 'FiAward',
    inputs: [
      { id: 'main_img_in', name: 'mainImage', type: 'image', label: 'Main Photo', required: true },
      { id: 'fac_img_in', name: 'facilityImages', type: 'image_collection', label: 'Facility Photos', required: false },
      { id: 'prompt_in', name: 'prompt', type: 'prompt', label: 'Hero Prompt', required: false }
    ],
    outputs: [
      { id: 'hero_out', name: 'heroImage', type: 'image', label: 'Hero Graphic' }
    ],
    defaultConfig: {
      aspectRatio: '1:1',
      layoutTemplate: 'modern_luxury_split'
    },
    configFields: [
      {
        name: 'aspectRatio',
        label: 'Canvas Aspect Ratio',
        type: 'select',
        options: [
          { value: '1:1', label: '1:1 Square (Facebook Feed)' },
          { value: '9:16', label: '9:16 Vertical (TikTok / Reels / Stories)' },
          { value: '16:9', label: '16:9 Landscape (Banner)' }
        ],
        defaultValue: '1:1'
      }
    ]
  },
  {
    type: 'media_external_processor',
    category: 'media',
    name: 'External Image Processor',
    description: 'Routes photos to an arbitrary web tool (watermark, upscale, HDR enhancer)',
    iconName: 'FiExternalLink',
    inputs: [
      { id: 'images_in', name: 'images', type: 'image_collection', label: 'Images', required: true },
      { id: 'browser_in', name: 'browser', type: 'browser_session', label: 'Browser', required: false }
    ],
    outputs: [
      { id: 'processed_out', name: 'processedImages', type: 'image_collection', label: 'Processed Images' }
    ],
    defaultConfig: {
      websiteUrl: 'https://photoprocessor.local',
      uploadSelector: 'input[type="file"]',
      downloadSelector: 'a.download-btn'
    },
    configFields: [
      {
        name: 'websiteUrl',
        label: 'External Web Tool URL',
        type: 'text',
        placeholder: 'https://photoprocessor.local'
      },
      {
        name: 'uploadSelector',
        label: 'Upload Input Selector',
        type: 'text',
        defaultValue: 'input[type="file"]',
        advanced: true
      },
      {
        name: 'downloadSelector',
        label: 'Download Button Selector',
        type: 'text',
        defaultValue: 'a.download-btn',
        advanced: true
      }
    ]
  },

  // ==========================================
  // OUTPUT NODES
  // ==========================================
  {
    type: 'output_publish',
    category: 'output',
    name: 'Publishing',
    description: 'Dispatches finalized assets, captions, and pricing to Facebook or Marketplace',
    iconName: 'FiSend',
    inputs: [
      { id: 'hero_in', name: 'heroImage', type: 'image', label: 'Hero Image', required: false },
      { id: 'images_in', name: 'images', type: 'image_collection', label: 'Photos', required: false },
      { id: 'caption_in', name: 'caption', type: 'text', label: 'Caption', required: false }
    ],
    outputs: [
      { id: 'post_url_out', name: 'postUrl', type: 'url', label: 'Published URL' },
      { id: 'success_out', name: 'isPublished', type: 'boolean', label: 'Success Flag' }
    ],
    defaultConfig: {
      platform: 'facebook_page',
      requireManualConfirmation: false
    },
    configFields: [
      {
        name: 'platform',
        label: 'Publishing Destination',
        type: 'select',
        options: [
          { value: 'facebook_page', label: 'Facebook Business Page' },
          { value: 'facebook_marketplace', label: 'Facebook Marketplace' },
          { value: 'tiktok_channel', label: 'TikTok Creative Center' }
        ],
        defaultValue: 'facebook_page'
      }
    ]
  },
  {
    type: 'output_mark_complete',
    category: 'output',
    name: 'Mark Complete',
    description: 'Finalizes pipeline run, updates property status, and records run metrics',
    iconName: 'FiCheckCircle',
    inputs: [
      { id: 'final_in', name: 'results', type: 'any', label: 'Final Results', required: true }
    ],
    outputs: [],
    defaultConfig: {
      notifyDesktopToast: true
    },
    configFields: [
      {
        name: 'notifyDesktopToast',
        label: 'Show Completion Notification',
        type: 'boolean',
        defaultValue: true
      }
    ]
  }
];

// Helper functions for node discovery and port compatibility
export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return NODE_DEFINITIONS.find(n => n.type === type);
}

export function getAllNodeDefinitions(): NodeDefinition[] {
  return NODE_DEFINITIONS;
}

export function getNodesByCategory(category: NodeCategory): NodeDefinition[] {
  return NODE_DEFINITIONS.filter(n => n.category === category);
}

export function searchNodeDefinitions(query: string): NodeDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return NODE_DEFINITIONS;
  return NODE_DEFINITIONS.filter(n => 
    n.name.toLowerCase().includes(q) ||
    n.description.toLowerCase().includes(q) ||
    n.type.toLowerCase().includes(q) ||
    n.category.toLowerCase().includes(q)
  );
}

export function instantiateNode(type: string, position: { x: number; y: number }): PipelineNode {
  const def = getNodeDefinition(type);
  if (!def) {
    throw new Error(`Unknown node type: ${type}`);
  }

  const uniqueId = `node-${type}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  return {
    id: uniqueId,
    type: def.type,
    name: def.name,
    category: def.category,
    position,
    config: { ...def.defaultConfig },
    inputs: JSON.parse(JSON.stringify(def.inputs)),
    outputs: JSON.parse(JSON.stringify(def.outputs)),
    isEnabled: true
  };
}

export function arePortsCompatible(sourceType: PortDataType, targetType: PortDataType): boolean {
  if (sourceType === 'any' || targetType === 'any') return true;
  if (sourceType === targetType) return true;

  // Single item to collection compatibility
  if (sourceType === 'image' && targetType === 'image_collection') return true;
  if (sourceType === 'file' && targetType === 'file_collection') return true;
  if (sourceType === 'prompt' && targetType === 'text') return true;
  if (sourceType === 'text' && targetType === 'prompt') return true;
  if (sourceType === 'url' && targetType === 'text') return true;

  return false;
}
