// EstateFlow Control - Pipeline Node Library Panel
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
  FiExternalLink
} from 'react-icons/fi';
import { 
  NODE_DEFINITIONS, 
  NODE_CATEGORY_METADATA, 
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
  FiExternalLink
};

interface NodeLibraryProps {
  onAddNode: (type: string) => void;
  onDragStartNode?: (e: React.DragEvent, type: string) => void;
}

export const NodeLibrary: React.FC<NodeLibraryProps> = ({ 
  onAddNode,
  onDragStartNode 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    input: true,
    browser: true,
    chat_ai: true,
    flow: true,
    media: true,
    output: true,
    file: false,
    data: false
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
    <div className="w-72 h-full flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md select-none shrink-0">
      {/* Header & Search */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
            Node Library
          </span>
          <span className="text-[10px] text-neutral-400">
            {filteredNodes.length} nodes
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes (e.g. browser, loop, prompt)..."
            className="glass-input w-full pl-8 pr-3 py-1.5 text-xs rounded-lg placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {searchQuery.trim() ? (
          // Search Flat View
          <div className="space-y-1.5">
            {filteredNodes.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                No matching nodes found.
              </div>
            ) : (
              filteredNodes.map(def => renderNodeCard(def, onAddNode, onDragStartNode))
            )}
          </div>
        ) : (
          // Categorized Accordion View
          categories.map(cat => {
            const catMeta = NODE_CATEGORY_METADATA[cat];
            const catNodes = filteredNodes.filter(n => n.category === cat);
            const isExpanded = expandedCategories[cat];

            if (catNodes.length === 0) return null;

            return (
              <div key={cat} className="rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden bg-neutral-50/40 dark:bg-neutral-900/20">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <FiChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                    ) : (
                      <FiChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                    <span>{catMeta.label}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${catMeta.badgeColor}`}>
                    {catNodes.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="p-1.5 space-y-1 border-t border-neutral-200/50 dark:border-neutral-800/50">
                    {catNodes.map(def => renderNodeCard(def, onAddNode, onDragStartNode))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

function renderNodeCard(
  def: NodeDefinition, 
  onAdd: (type: string) => void,
  onDragStart?: (e: React.DragEvent, type: string) => void
) {
  const IconComponent = ICON_MAP[def.iconName] || FiCpu;

  return (
    <div
      key={def.type}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/estateflow-node-type', def.type);
        onDragStart?.(e, def.type);
      }}
      onClick={() => onAdd(def.type)}
      title="Click or drag onto canvas to add"
      className="group p-2 rounded-lg border border-neutral-200/80 dark:border-neutral-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 bg-white/70 dark:bg-neutral-900/60 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 transition-all cursor-grab active:cursor-grabbing flex items-start justify-between gap-2"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 group-hover:text-rose-500 group-hover:bg-rose-500/10 transition-colors shrink-0">
          <IconComponent className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
            {def.name}
          </p>
          <p className="text-[10px] text-neutral-400 line-clamp-1">
            {def.description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAdd(def.type);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-opacity shrink-0"
        title="Add to Canvas"
      >
        <FiPlus className="w-3 h-3" />
      </button>
    </div>
  );
}
