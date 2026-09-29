// EstateFlow Control - Properties Link Management (Clean Table with Detail View Modal)
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
  FiEye,
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

// Helper to extract domain from URL for quick table preview
function getDomainPreview(links: string[]): string {
  if (!links.length) return '—';
  const domains = links.map(url => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'link';
    }
  });
  const uniqueDomains = Array.from(new Set(domains));
  if (uniqueDomains.length === 1) {
    return uniqueDomains[0];
  }
  return `${uniqueDomains[0]} +${uniqueDomains.length - 1} more`;
}

export const PropertiesLink: React.FC = () => {
  const { propertyLinkGroups, refreshPropertyLinkGroups, addNotification } = useApp();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // View Detail Modal State
  const [viewingGroupId, setViewingGroupId] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [targetGroup, setTargetGroup] = useState<PropertyLinkGroup | null>(null);

  // Raw textarea input in modal
  const [rawInput, setRawInput] = useState('');
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);

  // Group Deletion Confirmation
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Open All Confirmation Modal (for groups > 10 links)
  const [openAllConfirmGroup, setOpenAllConfirmGroup] = useState<PropertyLinkGroup | null>(null);

  // Current viewing group object
  const currentViewingGroup = useMemo(() => {
    if (!viewingGroupId) return null;
    return propertyLinkGroups.find(g => g.id === viewingGroupId) || null;
  }, [viewingGroupId, propertyLinkGroups]);

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

  // Handle paste in multiline editor: format URLs one per line
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
    setFormMode('create');
    setTargetGroup(null);
    setRawInput('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (group: PropertyLinkGroup) => {
    setFormMode('edit');
    setTargetGroup(group);
    setRawInput(group.links.join('\n'));
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setTargetGroup(null);
    setRawInput('');
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (validUrls.length === 0) return;

    if (formMode === 'create') {
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
    } else if (formMode === 'edit' && targetGroup) {
      const updated: PropertyLinkGroup = {
        ...targetGroup,
        links: validUrls,
        updatedAt: new Date().toISOString()
      };
      db.savePropertyLinkGroup(updated);
      addNotification('success', 'Group Updated', `Updated Link Group ${String(targetGroup.groupNumber || 1).padStart(3, '0')}.`);
    }

    refreshPropertyLinkGroups();
    closeFormModal();
  };

  const handleDeleteGroup = (groupId: string) => {
    db.deletePropertyLinkGroup(groupId);
    refreshPropertyLinkGroups();
    if (viewingGroupId === groupId) {
      setViewingGroupId(null);
    }
    setDeletingGroupId(null);
    addNotification('info', 'Group Deleted', 'Property link group removed.');
  };

  const handleRemoveSingleLink = (group: PropertyLinkGroup, linkIndex: number) => {
    const remaining = group.links.filter((_, idx) => idx !== linkIndex);
    if (remaining.length === 0) {
      if (window.confirm('This was the last link in this group. Delete the empty group?')) {
        db.deletePropertyLinkGroup(group.id);
        refreshPropertyLinkGroups();
        if (viewingGroupId === group.id) {
          setViewingGroupId(null);
        }
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

      {/* Clean Table: Group Summary Row without messy raw links */}
      <div className="glass-panel rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
              <tr>
                <th className="py-2.5 px-4 w-48">Group</th>
                <th className="py-2.5 px-4 w-32">Links Count</th>
                <th className="py-2.5 px-4">Sources Preview</th>
                <th className="py-2.5 px-4 w-36">Date Added</th>
                <th className="py-2.5 px-4 w-52 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
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
                  const groupTitle = `Link Group ${String(group.groupNumber || 1).padStart(3, '0')}`;
                  const domainPreview = getDomainPreview(group.links);

                  return (
                    <tr 
                      key={group.id} 
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
                      onClick={() => setViewingGroupId(group.id)}
                    >
                      {/* Column 1: Group Name */}
                      <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                        <div className="flex items-center gap-2">
                          <FiLink className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{groupTitle}</span>
                        </div>
                      </td>

                      {/* Column 2: Links Count Badge */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          {group.links.length} {group.links.length === 1 ? 'link' : 'links'}
                        </span>
                      </td>

                      {/* Column 3: Sources / Domain Preview */}
                      <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400 font-mono text-[11px] truncate max-w-xs">
                        {domainPreview}
                      </td>

                      {/* Column 4: Date Added */}
                      <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400 text-xs whitespace-nowrap">
                        {new Date(group.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Column 5: Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingGroupId(group.id)}
                            title="View links in detail"
                            className="px-2 py-1 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <FiEye className="w-3 h-3 text-rose-500" />
                            <span>View</span>
                          </button>

                          {group.links.length > 1 && (
                            <button
                              onClick={() => handleOpenAllLinks(group)}
                              title="Open all links in browser"
                              className="px-2 py-1 rounded text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <FiExternalLink className="w-3 h-3" />
                              <span>Open all</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleCopyAllLinks(group)}
                            title="Copy all links"
                            className="p-1.5 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <FiCopy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEditModal(group)}
                            title="Edit group"
                            className="p-1.5 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>

                          {deletingGroupId === group.id ? (
                            <div className="flex items-center gap-1 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/30">
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeletingGroupId(null)}
                                className="px-1 text-[10px] text-neutral-400 hover:text-neutral-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingGroupId(group.id)}
                              title="Delete group"
                              className="p-1.5 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

      {/* ======================================================== */}
      {/* DETAIL MODAL: VIEW ALL LINKS IN DETAIL                   */}
      {/* ======================================================== */}
      {currentViewingGroup && (
        <GlassModal
          isOpen={Boolean(currentViewingGroup)}
          onClose={() => setViewingGroupId(null)}
          title={`Link Group ${String(currentViewingGroup.groupNumber || 1).padStart(3, '0')}`}
          subtitle={`${currentViewingGroup.links.length} property link${currentViewingGroup.links.length === 1 ? '' : 's'} • Added on ${new Date(currentViewingGroup.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Detail Modal Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 flex-wrap gap-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Click any link to open in browser
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenAllLinks(currentViewingGroup)}
                  className="btn-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1"
                >
                  <FiExternalLink className="w-3 h-3 text-rose-500" />
                  <span>Open All ({currentViewingGroup.links.length})</span>
                </button>

                <button
                  onClick={() => handleCopyAllLinks(currentViewingGroup)}
                  className="btn-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1"
                >
                  <FiCopy className="w-3 h-3" />
                  <span>Copy All</span>
                </button>

                <button
                  onClick={() => {
                    openEditModal(currentViewingGroup);
                    setViewingGroupId(null);
                  }}
                  className="btn-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1"
                >
                  <FiEdit2 className="w-3 h-3" />
                  <span>Edit Links</span>
                </button>
              </div>
            </div>

            {/* List of Detailed Links */}
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
              {currentViewingGroup.links.map((url, idx) => {
                const isCopied = copiedLinkKey === `${currentViewingGroup.id}-${idx}`;

                return (
                  <div
                    key={idx}
                    className="group flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 border border-neutral-100 dark:border-neutral-800 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-neutral-400 w-5 shrink-0 text-right">
                        {idx + 1}.
                      </span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-neutral-800 dark:text-neutral-200 hover:text-rose-600 dark:hover:text-rose-400 hover:underline truncate block"
                        title={url}
                      >
                        {url}
                      </a>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenSingleLink(url)}
                        title="Open in browser"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors"
                      >
                        <FiExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleCopySingleLink(url, `${currentViewingGroup.id}-${idx}`)}
                        title="Copy link"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors"
                      >
                        {isCopied ? (
                          <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <FiCopy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleRemoveSingleLink(currentViewingGroup, idx)}
                        title="Remove link from group"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setViewingGroupId(null)}
                className="btn-secondary text-xs py-1.5 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </GlassModal>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT LINKS MODAL (MULTILINE INPUT)                 */}
      {/* ======================================================== */}
      <GlassModal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={formMode === 'edit' ? `Edit ${targetGroup ? `Link Group ${String(targetGroup.groupNumber || 1).padStart(3, '0')}` : 'Group'}` : 'Add Property Links'}
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
              onClick={closeFormModal}
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
              <span>{formMode === 'edit' ? 'Save Changes' : 'Save Group'}</span>
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
