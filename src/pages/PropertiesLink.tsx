// EstateFlow Control - Properties Link Management (Grouped URL System)
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FiPlus, 
  FiSearch, 
  FiLink, 
  FiExternalLink, 
  FiCopy,
  FiEdit2, 
  FiTrash2, 
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiCheckCircle,
  FiFolder
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { PropertyLinkGroup } from '../types';
import { db } from '../services/storage';
import { GlassModal } from '../components/common/GlassModal';

// Helper to extract and normalize URLs from text
function parseAndNormalizeUrls(rawText: string): { validUrls: string[]; invalidLines: string[] } {
  if (!rawText.trim()) {
    return { validUrls: [], invalidLines: [] };
  }

  // Regex captures http/https URLs preserving query params, fragments, etc.
  const urlRegex = /(https?:\/\/[^\s,;"'<>]+)/gi;
  const matches = rawText.match(urlRegex) || [];

  const validUrls: string[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    let clean = match.trim();
    // Trim trailing punctuation if accidentally captured at the end of sentence
    clean = clean.replace(/[),.;]+$/, '');
    try {
      const parsed = new URL(clean);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        if (!seen.has(clean)) {
          seen.add(clean);
          validUrls.push(clean);
        }
      }
    } catch {
      // Ignore malformed URL
    }
  }

  // Identify lines that don't contain any valid URL
  const rawLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const invalidLines: string[] = [];
  for (const line of rawLines) {
    if (!line.match(urlRegex)) {
      invalidLines.push(line);
    }
  }

  return { validUrls, invalidLines };
}

export const PropertiesLink: React.FC = () => {
  const { propertyLinkGroups, refreshPropertyLinkGroups, addNotification } = useApp();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded groups state (set of group IDs that are expanded to view all links)
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'append'>('create');
  const [targetGroup, setTargetGroup] = useState<PropertyLinkGroup | null>(null);

  // Raw textarea input
  const [rawInput, setRawInput] = useState('');
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<string | null>(null);

  // Group Deletion Confirmation
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Open All Confirmation Modal (for groups > 10 links)
  const [openAllConfirmGroup, setOpenAllConfirmGroup] = useState<PropertyLinkGroup | null>(null);

  // Parse valid and invalid links live from rawInput
  const { validUrls, invalidLines } = useMemo(() => {
    return parseAndNormalizeUrls(rawInput);
  }, [rawInput]);

  // Check if any detected valid URL already exists in other groups
  const existingDuplicateCount = useMemo(() => {
    if (validUrls.length === 0) return 0;
    const otherUrls = new Set<string>();
    propertyLinkGroups.forEach(g => {
      if (!targetGroup || g.id !== targetGroup.id) {
        g.links.forEach(l => otherUrls.add(l));
      }
    });
    return validUrls.filter(u => otherUrls.has(u)).length;
  }, [validUrls, propertyLinkGroups, targetGroup]);

  // Handle paste: automatically normalize pasted text into one URL per line
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    // Check if pasted text contains URLs
    const { validUrls: pastedValid } = parseAndNormalizeUrls(pastedText);
    if (pastedValid.length > 0) {
      e.preventDefault();
      // Combine with existing text or replace if empty
      const existing = parseAndNormalizeUrls(rawInput).validUrls;
      const combined = Array.from(new Set([...existing, ...pastedValid]));
      setRawInput(combined.join('\n'));
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setTargetGroup(null);
    setRawInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (group: PropertyLinkGroup) => {
    setModalMode('edit');
    setTargetGroup(group);
    setRawInput(group.links.join('\n'));
    setIsModalOpen(true);
  };

  const openAppendModal = (group: PropertyLinkGroup) => {
    setModalMode('append');
    setTargetGroup(group);
    setRawInput('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTargetGroup(null);
    setRawInput('');
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (validUrls.length === 0) return;

    if (modalMode === 'create') {
      const nextNum = propertyLinkGroups.reduce((max, g) => Math.max(max, g.groupNumber || 0), 0) + 1;
      const newGroup: PropertyLinkGroup = {
        id: `GROUP-${String(nextNum).padStart(3, '0')}`,
        groupNumber: nextNum,
        links: validUrls,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.savePropertyLinkGroup(newGroup);
      addNotification('success', 'Link Group Created', `Saved ${validUrls.length} link${validUrls.length > 1 ? 's' : ''} in Link Group ${String(nextNum).padStart(3, '0')}.`);
    } else if (modalMode === 'edit' && targetGroup) {
      const updated: PropertyLinkGroup = {
        ...targetGroup,
        links: validUrls,
        updatedAt: new Date().toISOString()
      };
      db.savePropertyLinkGroup(updated);
      addNotification('success', 'Link Group Updated', `Updated Link Group ${String(targetGroup.groupNumber || 1).padStart(3, '0')} (${validUrls.length} links).`);
    } else if (modalMode === 'append' && targetGroup) {
      // Merge unique URLs into existing group
      const merged = Array.from(new Set([...targetGroup.links, ...validUrls]));
      const updated: PropertyLinkGroup = {
        ...targetGroup,
        links: merged,
        updatedAt: new Date().toISOString()
      };
      db.savePropertyLinkGroup(updated);
      addNotification('success', 'Links Added', `Added ${validUrls.length} new link${validUrls.length > 1 ? 's' : ''} to Link Group ${String(targetGroup.groupNumber || 1).padStart(3, '0')}.`);
    }

    refreshPropertyLinkGroups();
    closeModal();
  };

  const handleDeleteGroup = (groupId: string) => {
    db.deletePropertyLinkGroup(groupId);
    refreshPropertyLinkGroups();
    setDeletingGroupId(null);
    addNotification('info', 'Group Deleted', 'Property link group was removed.');
  };

  const handleRemoveSingleLink = (group: PropertyLinkGroup, linkIndex: number) => {
    const remaining = group.links.filter((_, idx) => idx !== linkIndex);
    if (remaining.length === 0) {
      if (window.confirm('This was the last link in this group. Delete the empty group?')) {
        db.deletePropertyLinkGroup(group.id);
        refreshPropertyLinkGroups();
        addNotification('info', 'Group Deleted', 'Empty link group removed.');
      } else {
        const updated = { ...group, links: [], updatedAt: new Date().toISOString() };
        db.savePropertyLinkGroup(updated);
        refreshPropertyLinkGroups();
      }
      return;
    }

    const updated = { ...group, links: remaining, updatedAt: new Date().toISOString() };
    db.savePropertyLinkGroup(updated);
    refreshPropertyLinkGroups();
    addNotification('info', 'Link Removed', 'Link removed from group.');
  };

  const toggleExpand = (groupId: string) => {
    setExpandedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleOpenSingleLink = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenAllLinks = (group: PropertyLinkGroup) => {
    if (!group.links.length) return;
    if (group.links.length > 10) {
      setOpenAllConfirmGroup(group);
      return;
    }
    group.links.forEach(url => {
      window.open(url, '_blank', 'noopener,noreferrer');
    });
    addNotification('info', 'Links Opened', `Opening ${group.links.length} links in browser tabs.`);
  };

  const confirmOpenAll = () => {
    if (!openAllConfirmGroup) return;
    openAllConfirmGroup.links.forEach(url => {
      window.open(url, '_blank', 'noopener,noreferrer');
    });
    addNotification('info', 'Links Opened', `Opening ${openAllConfirmGroup.links.length} links in browser tabs.`);
    setOpenAllConfirmGroup(null);
  };

  const handleCopySingleLink = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkIndex(key);
    setTimeout(() => setCopiedLinkIndex(null), 1500);
    addNotification('info', 'Copied', 'URL copied to clipboard.');
  };

  const handleCopyAllLinks = (group: PropertyLinkGroup) => {
    const text = group.links.join('\n');
    navigator.clipboard.writeText(text);
    addNotification('success', 'Copied All', `Copied ${group.links.length} URLs to clipboard (one per line).`);
  };

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return propertyLinkGroups;
    return propertyLinkGroups.filter(g => {
      const matchGroupName = `link group ${String(g.groupNumber || 1).padStart(3, '0')}`.includes(q);
      const matchUrl = g.links.some(l => l.toLowerCase().includes(q));
      return matchGroupName || matchUrl;
    });
  }, [propertyLinkGroups, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Properties Link
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Store and manage property source links from owners and agents.
          </p>
        </div>

        <div>
          <button
            onClick={openCreateModal}
            className="btn-primary-red"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Add Property Links</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search URLs across all groups..."
            className="glass-input pl-9 pr-3 py-1.5 text-xs w-full rounded-lg"
          />
        </div>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            Clear
          </button>
        )}

        <div className="text-xs text-neutral-400 ml-auto hidden sm:block">
          {propertyLinkGroups.length} Link Group{propertyLinkGroups.length === 1 ? '' : 's'} Total
        </div>
      </div>

      {/* Stored Groups List */}
      {filteredGroups.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col items-center justify-center gap-3 text-neutral-400">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
              <FiFolder className="w-6 h-6" />
            </div>
            <p className="text-xs">
              {searchQuery ? 'No property link groups match your search.' : 'No property links saved yet.'}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreateModal}
                className="btn-primary-red mt-2"
              >
                <FiPlus className="w-3.5 h-3.5" />
                <span>Add Property Links</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroupIds.has(group.id) || Boolean(searchQuery);
            const displayLinks = isExpanded ? group.links : group.links.slice(0, 3);
            const remainingCount = group.links.length - 3;
            const groupTitle = `Link Group ${String(group.groupNumber || 1).padStart(3, '0')}`;

            return (
              <div 
                key={group.id}
                className="glass-panel p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4"
              >
                {/* Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      <FiFolder className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                          {groupTitle}
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          {group.links.length} Link{group.links.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span>Created: {new Date(group.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {group.updatedAt && group.updatedAt !== group.createdAt && (
                          <>
                            <span>•</span>
                            <span>Updated: {new Date(group.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Group Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleOpenAllLinks(group)}
                      title="Open all links in browser"
                      className="btn-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1"
                    >
                      <FiExternalLink className="w-3 h-3 text-rose-500" />
                      <span>Open All</span>
                    </button>

                    <button
                      onClick={() => handleCopyAllLinks(group)}
                      title="Copy all links (one per line)"
                      className="btn-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1"
                    >
                      <FiCopy className="w-3 h-3" />
                      <span>Copy All</span>
                    </button>

                    <button
                      onClick={() => openAppendModal(group)}
                      title="Add more URLs to this group"
                      className="btn-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1"
                    >
                      <FiPlus className="w-3 h-3" />
                      <span>Add Links</span>
                    </button>

                    <button
                      onClick={() => openEditModal(group)}
                      title="Edit all URLs in multiline editor"
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>

                    {deletingGroupId === group.id ? (
                      <div className="flex items-center gap-1 bg-rose-500/10 p-0.5 rounded border border-rose-500/30">
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="px-2 py-0.5 text-[11px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-700"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeletingGroupId(null)}
                          className="px-1.5 py-0.5 text-[11px] text-neutral-400 hover:text-neutral-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingGroupId(group.id)}
                        title="Delete entire link group"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stored Links List */}
                <div className="space-y-1.5">
                  {displayLinks.map((url, idx) => {
                    const isCopied = copiedLinkIndex === `${group.id}-${idx}`;
                    const isMatchSearch = searchQuery && url.toLowerCase().includes(searchQuery.toLowerCase().trim());

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border text-xs transition-colors ${
                          isMatchSearch
                            ? 'bg-rose-500/10 border-rose-500/30 dark:bg-rose-950/20 dark:border-rose-900/40'
                            : 'bg-neutral-50/60 dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="font-mono text-[10px] text-neutral-400 w-5 shrink-0 text-right">
                            {idx + 1}.
                          </span>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-neutral-700 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:underline truncate"
                            title={url}
                          >
                            {url}
                          </a>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenSingleLink(url)}
                            title="Open Link"
                            className="p-1 rounded text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          >
                            <FiExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleCopySingleLink(url, `${group.id}-${idx}`)}
                            title="Copy Link"
                            className="p-1 rounded text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          >
                            {isCopied ? (
                              <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <FiCopy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleRemoveSingleLink(group, idx)}
                            title="Remove this link from group"
                            className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Collapsed / Expand Footer */}
                {!searchQuery && group.links.length > 3 && (
                  <div className="pt-1 flex items-center justify-between text-xs text-neutral-400">
                    <div>
                      {!isExpanded && (
                        <span>+{remainingCount} more link{remainingCount > 1 ? 's' : ''} in this group</span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleExpand(group.id)}
                      className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Collapse' : 'View All'}</span>
                      {isExpanded ? (
                        <FiChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <FiChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Links Group Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'edit'
            ? `Edit Link Group ${String(targetGroup?.groupNumber || 1).padStart(3, '0')}`
            : modalMode === 'append'
              ? `Add Links to Group ${String(targetGroup?.groupNumber || 1).padStart(3, '0')}`
              : 'Add Property Links'
        }
        subtitle="Paste one or multiple property links. Each link will be automatically separated into its own line and saved together as one group."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Property Links
              </label>
              <div className="text-[11px] text-neutral-400">
                One link per line
              </div>
            </div>

            <textarea
              rows={9}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              onPaste={handlePaste}
              placeholder={`https://www.facebook.com/...\nhttps://www.facebook.com/marketplace/item/...\nhttps://line.me/...\nhttps://example.com/property/...`}
              className="glass-input w-full p-3 font-mono text-xs rounded-xl resize-y"
              autoFocus
            />

            <p className="text-[11px] text-neutral-400 mt-1.5">
              Paste multiple links. Each link will be stored on a separate line inside the same group.
            </p>
          </div>

          {/* Live Link Count & Validation Status */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {validUrls.length > 0 ? (
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <FiAlertCircle className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {validUrls.length === 0
                    ? 'No links detected yet'
                    : `${validUrls.length} valid link${validUrls.length === 1 ? '' : 's'} detected`}
                </span>
              </div>

              {invalidLines.length > 0 && (
                <span className="text-[11px] text-amber-500 font-medium">
                  {invalidLines.length} invalid entr{invalidLines.length === 1 ? 'y' : 'ies'} ignored
                </span>
              )}
            </div>

            {/* Cross-Group Duplicate Subtle Warning */}
            {existingDuplicateCount > 0 && (
              <div className="text-[11px] text-amber-500 dark:text-amber-400 flex items-center gap-1 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                <FiAlertCircle className="w-3 h-3 shrink-0" />
                <span>
                  Notice: {existingDuplicateCount} link{existingDuplicateCount > 1 ? 's' : ''} already exist{existingDuplicateCount === 1 ? 's' : ''} in other saved groups.
                </span>
              </div>
            )}
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={closeModal}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={validUrls.length === 0}
              className="btn-primary-red disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheck className="w-3.5 h-3.5" />
              <span>
                {modalMode === 'edit'
                  ? 'Save Changes'
                  : modalMode === 'append'
                    ? 'Add to Group'
                    : 'Save Group'}
              </span>
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Confirmation Modal for Opening > 10 Links */}
      <GlassModal
        isOpen={Boolean(openAllConfirmGroup)}
        onClose={() => setOpenAllConfirmGroup(null)}
        title="Open Multiple Links?"
        subtitle="Confirm opening a large batch of browser tabs."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            This will open <span className="font-semibold text-rose-500">{openAllConfirmGroup?.links.length}</span> links simultaneously in your browser. Do you want to proceed?
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setOpenAllConfirmGroup(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={confirmOpenAll}
              className="btn-primary-red"
            >
              <FiExternalLink className="w-3.5 h-3.5" />
              <span>Open All</span>
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};
