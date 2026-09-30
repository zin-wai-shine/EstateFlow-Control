// EstateFlow Control - Clean Pipeline Step Library
// Offers high-level Smart Steps by default, with optional advanced low-level nodes
import React, { useState, useMemo } from 'react';
import { 
  FiSearch, 
  FiPlus, 
  FiChevronDown, 
  FiChevronRight,
  FiHome,
  FiImage,
  FiFolder,
  FiFileText,
  FiLink,
  FiGlobe,
  FiLayers,
  FiCompass,
  FiCpu,
  FiSend,
  FiUploadCloud,
  FiClock,
  FiDownloadCloud,
  FiCheckCircle,
  FiSave,
  FiEdit2,
  FiSliders,
  FiPlay,
  FiRepeat,
  FiGitBranch,
  FiGitMerge,
  FiHelpCircle,
  FiCheckSquare,
  FiAward,
  FiExternalLink,
  FiZap,
  FiEdit3,
  FiStar
} from 'react-icons/fi';
import { 
  NODE_DEFINITIONS, 
  NODE_CATEGORY_METADATA, 
  SMART_STEP_TEMPLATES,
  SmartStepTemplate,
  searchNodeDefinitions 
} from '../../services/nodeRegistry';
import { NodeCategory, NodeDefinition } from '../../types/pipeline';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FiHome,
  FiImage,
  FiFolder,
  FiFileText,
  FiLink,
  FiGlobe,
  FiLayers,
  FiCompass,
  FiCpu,
  FiSend,
  FiUploadCloud,
  FiClock,
  FiDownloadCloud,
  FiCheckCircle,
  FiSave,
  FiEdit2,
  FiSliders,
  FiPlay,
  FiRepeat,
  FiGitBranch,
  FiGitMerge,
  FiHelpCircle,
  FiCheckSquare,
  FiAward,
  FiExternalLink,
  FiZap,
  FiEdit3,
  FiStar
};

interface NodeLibraryProps {
  onAddNode: (type: string) => void;
  onDragStartNode?: (e: React.DragEvent, type: string) => void;
}

export const NodeLibrary: React.FC<NodeLibraryProps> = ({ 
  onAddNode,
  onDragStartNode 
}) => {
  const [activeTab, setActiveTab] = useState<'smart' | 'raw'>('smart');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    input: false,
    browser: false,
    chat_ai: false,
    flow: false,
    media: false,
    output: false
  });

  const filteredNodes = useMemo(() => {
    return searchNodeDefinitions(searchQuery);
  }, [searchQuery]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const categories = Object.keys(NODE_CATEGORY_METADATA) as NodeCategory[];

  return (
    <div className="w-72 h-full flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md select-none shrink-0">
      {/* Header & Mode Switch */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
            Step Library
          </span>
          <span className="text-[10px] text-neutral-400">
            {activeTab === 'smart' ? `${SMART_STEP_TEMPLATES.length} Smart Steps` : `${filteredNodes.length} Raw Nodes`}
          </span>
        </div>

        {/* Tab Switch: Smart Steps vs Raw Nodes */}
        <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80">
          <button
            onClick={() => setActiveTab('smart')}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'smart'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Smart Steps
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'raw'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Raw Nodes
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'smart' ? "Search steps..." : "Search low-level nodes..."}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 outline-none"
          />
        </div>
      </div>

      {/* Body List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {/* SMART STEPS TAB (Default, Clean, Easy) */}
        {activeTab === 'smart' && (
          <div className="space-y-2">
            {SMART_STEP_TEMPLATES
              .filter(s => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(step => {
                const IconComp = ICON_MAP[step.iconName] || FiZap;
                return (
                  <div
                    key={step.id}
                    onClick={() => onAddNode(step.type)}
                    draggable
                    onDragStart={(e) => onDragStartNode && onDragStartNode(e, step.type)}
                    className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:border-red-500/50 dark:hover:border-red-500/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <div className="p-1.5 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors shrink-0">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate">
                          {step.title}
                        </h4>
                      </div>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                        {step.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {step.description}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400 group-hover:text-red-500 transition-colors">
                      <span>Click to add step</span>
                      <FiPlus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* RAW LOW-LEVEL NODES TAB (For Power Users) */}
        {activeTab === 'raw' && (
          <div className="space-y-1.5">
            {categories.map(cat => {
              const catMeta = NODE_CATEGORY_METADATA[cat];
              const catNodes = filteredNodes.filter(n => n.category === cat);
              const isExpanded = expandedCategories[cat] || Boolean(searchQuery);

              if (catNodes.length === 0) return null;

              return (
                <div key={cat} className="rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <span className="capitalize">{catMeta.label}</span>
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <span className="text-[10px]">{catNodes.length}</span>
                      {isExpanded ? <FiChevronDown className="w-3.5 h-3.5" /> : <FiChevronRight className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-1.5 space-y-1 bg-neutral-50/50 dark:bg-neutral-900/50">
                      {catNodes.map(nodeDef => {
                        const IconComp = ICON_MAP[nodeDef.iconName] || FiSliders;
                        return (
                          <div
                            key={nodeDef.type}
                            onClick={() => onAddNode(nodeDef.type)}
                            className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 hover:border-red-500/40 text-xs cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <IconComp className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-500" />
                              <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                                {nodeDef.name}
                              </span>
                            </div>
                            <FiPlus className="w-3 h-3 text-neutral-400 group-hover:text-red-500" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
