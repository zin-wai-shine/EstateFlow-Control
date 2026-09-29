// EstateFlow Control - Properties Link Management (Clean Table Layout)
import React, { useState, useMemo } from 'react';
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
  FiX
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

  const urlRegex = /(https?:\/\/[^\s,;"'<>]+)/gi;
  const matches = rawText.match(urlRegex) || [];

  const validUrls: string[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    let clean = match.trim().replace(/[),.;]+$/, '');
    try {
      const parsed = new URL(clean);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        if (!seen.has(clean)) {
          seen.add(clean);
          validUrls.push(clean);
        }
      }
    } catch {
      // Ignore invalid URL
    }
  }

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

  // Expanded groups state for groups with > 2 links
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [targetGroup, setTargetGroup] = useState<PropertyLinkGroup | null>(null);

  // Raw textarea input in modal
  const [rawInput, setRawInput] = useState('');
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);

  // Group Deletion Confirmation
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Open All Confirmation Modal (for groups > 10 links)
  const [openAllConfirmGroup, setOpenAllConfirmGroup] = useState<PropertyLinkGroup | null>(null);

  // Live parsed counts from modal input
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

  // Handle paste: automatically format URLs one per line
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const { validUrls: pastedValid } = parseAndNormalizeUrls(pastedText);
    if (pastedValid.length > 0) {
      e.preventDefault();
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
      addNotification('success', 'Group Created', `Saved ${validUrls.length} link${validUrls.length > 1 ? 's' : ''} in Link Group ${String(nextNum).padStart(3, '0')}.`);
    } else if (modalMode === 'edit' && targetGroup) {
      const updated: PropertyLinkGroup = {
        ...targetGroup,
        links: validUrls,
        updatedAt: new Date().toISOString()
      };
      db.savePropertyLinkGroup(updated);
      addNotification('success', 'Group Updated', `Updated Link Group ${String(targetGroup.groupNumber || 1).padStart(3, '0')}.`);
    }

    refreshPropertyLinkGroups();
    closeModal();
  };

  const handleDeleteGroup = (groupId: string) => {
    db.deletePropertyLinkGroup(groupId);
    refreshPropertyLinkGroups();
    setDeletingGroupId(null);
    addNotification('info', 'Group Deleted', 'Property link group removed.');
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
    setCopiedLinkKey(key);
    setTimeout(() => setCopiedLinkKey(null), 1500);
    addNotification('info', 'Copied', 'URL copied to clipboard.');
  };

  const handleCopyAllLinks = (group: PropertyLinkGroup) => {
    const text = group.links.join('\n');
    navigator.clipboard.writeText(text);
    addNotification('success', 'Copied All', `Copied ${group.links.length} URLs to clipboard.`);
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
    <div className="space-y-4">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>Properties Link</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Store and manage property source links from owners and agents.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Field */}
          <div className="relative w-64 sm:w-72">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search links..."
              className="glass-input pl-8 pr-7 py-1 text-xs w-full rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                <FiX className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={openCreateModal}
            className="btn-primary-red py-1 px-3 text-xs shrink-0 flex items-center gap-1.5"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Add Property Links</span>
          </button>
        </div>
      </div>

      {/* Main Table Layout */}
      <div className="glass-panel rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
              <tr>
                <th className="py-2.5 px-4 w-44">Group</th>
                <th className="py-2.5 px-4">Property Links</th>
                <th className="py-2.5 px-4 w-32">Date</th>
                <th className="py-2.5 px-4 w-44 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                        <FiLink className="w-4 h-4" />
                      </div>
                      <p className="text-xs">
                        {searchQuery ? 'No links match your search.' : 'No property links saved yet.'}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={openCreateModal}
                          className="btn-primary-red mt-1 text-xs py-1 px-3"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                          <span>Add Property Links</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const isExpanded = expandedGroupIds.has(group.id) || Boolean(searchQuery);
                  const displayLinks = isExpanded ? group.links : group.links.slice(0, 2);
                  const remainingCount = group.links.length - 2;
                  const groupTitle = `Link Group ${String(group.groupNumber || 1).padStart(3, '0')}`;

                  return (
                    <tr 
                      key={group.id} 
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors align-top"
                    >
                      {/* Column 1: Group Name & Badge */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                            {groupTitle}
                          </span>
                          <span className="inline-block w-fit px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                            {group.links.length} {group.links.length === 1 ? 'link' : 'links'}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Clean Links List */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {displayLinks.map((url, idx) => {
                            const isCopied = copiedLinkKey === `${group.id}-${idx}`;
                            const isMatchSearch = searchQuery && url.toLowerCase().includes(searchQuery.toLowerCase().trim());

                            return (
                              <div
                                key={idx}
                                className={`group/item flex items-center justify-between gap-2 p-1.5 rounded-lg transition-colors ${
                                  isMatchSearch
                                    ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                                    : 'hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="text-[10px] text-neutral-400 w-4 shrink-0 text-right">
                                    {idx + 1}.
                                  </span>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 hover:text-rose-500 dark:hover:text-rose-400 hover:underline truncate"
                                    title={url}
                                  >
                                    {url}
                                  </a>
                                </div>

                                <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover/item:opacity-100">
                                  <button
                                    onClick={() => handleOpenSingleLink(url)}
                                    title="Open link"
                                    className="p-1 rounded text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors"
                                  >
                                    <FiExternalLink className="w-3 h-3" />
                                  </button>

                                  <button
                                    onClick={() => handleCopySingleLink(url, `${group.id}-${idx}`)}
                                    title="Copy link"
                                    className="p-1 rounded text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors"
                                  >
                                    {isCopied ? (
                                      <FiCheck className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <FiCopy className="w-3 h-3" />
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleRemoveSingleLink(group, idx)}
                                    title="Remove link"
                                    className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  >
                                    <FiX className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Expand / Collapse Toggle if > 2 links */}
                          {!searchQuery && group.links.length > 2 && (
                            <button
                              onClick={() => toggleExpand(group.id)}
                              className="text-[11px] text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 mt-1 pl-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Collapse' : `+ ${remainingCount} more link${remainingCount > 1 ? 's' : ''}`}</span>
                              {isExpanded ? (
                                <FiChevronUp className="w-3 h-3" />
                              ) : (
                                <FiChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Added Date */}
                      <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400 text-xs whitespace-nowrap">
                        {new Date(group.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Column 4: Group Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {group.links.length > 1 && (
                            <button
                              onClick={() => handleOpenAllLinks(group)}
                              title="Open all links in browser"
                              className="px-2 py-1 rounded text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1"
                            >
                              <FiExternalLink className="w-3 h-3 text-rose-500" />
                              <span>Open all</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleCopyAllLinks(group)}
                            title="Copy all links"
                            className="px-2 py-1 rounded text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1"
                          >
                            <FiCopy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>

                          <button
                            onClick={() => openEditModal(group)}
                            title="Edit group"
                            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>

                          {deletingGroupId === group.id ? (
                            <div className="flex items-center gap-1 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/30">
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-700"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeletingGroupId(null)}
                                className="px-1 text-[10px] text-neutral-400 hover:text-neutral-200"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingGroupId(group.id)}
                              title="Delete group"
                              className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Links Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === 'edit' ? `Edit ${targetGroup ? `Link Group ${String(targetGroup.groupNumber || 1).padStart(3, '0')}` : 'Group'}` : 'Add Property Links'}
        subtitle="Paste one or multiple property links. Each link will be separated onto its own line and saved as one group."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveModal} className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Property Links
              </label>
              <span className="text-[11px] text-neutral-400">
                One link per line
              </span>
            </div>

            <textarea
              rows={9}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              onPaste={handlePaste}
              placeholder={`https://www.facebook.com/...\nhttps://www.facebook.com/marketplace/item/...\nhttps://line.me/...`}
              className="glass-input w-full p-2.5 font-mono text-xs rounded-xl resize-y"
              autoFocus
            />

            <p className="text-[11px] text-neutral-400 mt-1">
              Paste multiple links separated by spaces or newlines.
            </p>
          </div>

          {/* Live Link Count & Validation Status */}
          <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-xs flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {validUrls.length > 0 ? (
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <FiAlertCircle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                )}
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {validUrls.length === 0
                    ? 'No links detected'
                    : `${validUrls.length} valid link${validUrls.length === 1 ? '' : 's'} detected`}
                </span>
              </div>

              {invalidLines.length > 0 && (
                <span className="text-[11px] text-amber-500 font-medium">
                  {invalidLines.length} invalid line{invalidLines.length === 1 ? '' : 's'} ignored
                </span>
              )}
            </div>

            {/* Subtle Duplicate Warning */}
            {existingDuplicateCount > 0 && (
              <div className="text-[11px] text-amber-500 dark:text-amber-400 flex items-center gap-1 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                <FiAlertCircle className="w-3 h-3 shrink-0" />
                <span>
                  Notice: {existingDuplicateCount} link{existingDuplicateCount > 1 ? 's' : ''} already exist in other saved groups.
                </span>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={closeModal}
              className="btn-secondary py-1 px-3 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={validUrls.length === 0}
              className="btn-primary-red py-1 px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FiCheck className="w-3.5 h-3.5" />
              <span>{modalMode === 'edit' ? 'Save Changes' : 'Save Group'}</span>
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Confirmation Modal for Opening > 10 Links */}
      <GlassModal
        isOpen={Boolean(openAllConfirmGroup)}
        onClose={() => setOpenAllConfirmGroup(null)}
        title="Open Multiple Links?"
        subtitle="Confirm opening browser tabs."
        maxWidth="sm"
      >
        <div className="space-y-3">
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            This will open <span className="font-semibold text-rose-500">{openAllConfirmGroup?.links.length}</span> tabs in your browser. Proceed?
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setOpenAllConfirmGroup(null)}
              className="btn-secondary text-xs py-1 px-2.5"
            >
              Cancel
            </button>
            <button
              onClick={confirmOpenAll}
              className="btn-primary-red text-xs py-1 px-2.5 flex items-center gap-1"
            >
              <FiExternalLink className="w-3 h-3" />
              <span>Open All</span>
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};
