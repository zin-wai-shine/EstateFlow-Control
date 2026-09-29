// EstateFlow Control - Properties Link Management Page
import React, { useState, useMemo } from 'react';
import { 
  FiPlus, 
  FiSearch, 
  FiLink, 
  FiExternalLink, 
  FiEdit2, 
  FiTrash2, 
  FiCheck
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { PropertyLink, PropertyLinkSource } from '../types';
import { db } from '../services/storage';
import { GlassModal } from '../components/common/GlassModal';
import { AppDropdown } from '../components/common/AppDropdown';

export const PropertiesLink: React.FC = () => {
  const { propertyLinks, refreshPropertyLinks, addNotification } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<PropertyLink | null>(null);
  
  // Form State
  const [sourceType, setSourceType] = useState<PropertyLinkSource>('owner');
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingLink(null);
    setSourceType('owner');
    setUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (link: PropertyLink) => {
    setEditingLink(link);
    setSourceType(link.sourceType);
    setUrl(link.url);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
    setUrl('');
    setFormError(null);
  };

  const validateUrl = (testUrl: string): boolean => {
    try {
      const parsed = new URL(testUrl);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setFormError('Property link is required.');
      return;
    }

    if (!validateUrl(trimmedUrl)) {
      setFormError('Please enter a valid URL (e.g. https://www.facebook.com/...)');
      return;
    }

    if (editingLink) {
      db.savePropertyLink({
        ...editingLink,
        sourceType,
        url: trimmedUrl,
        updatedAt: new Date().toISOString()
      });
      addNotification('success', 'Link Updated', 'Property source link has been updated.');
    } else {
      const newLink: PropertyLink = {
        id: `link-${Date.now()}`,
        sourceType,
        url: trimmedUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.savePropertyLink(newLink);
      addNotification('success', 'Link Saved', 'New property source link added successfully.');
    }

    refreshPropertyLinks();
    closeModal();
  };

  const handleDelete = (id: string) => {
    db.deletePropertyLink(id);
    refreshPropertyLinks();
    setDeletingId(null);
    addNotification('info', 'Link Removed', 'Property source link deleted.');
  };

  const handleOpenLink = (linkUrl: string) => {
    if (!linkUrl) return;
    window.open(linkUrl, '_blank', 'noopener,noreferrer');
  };

  const filteredLinks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return propertyLinks;
    return propertyLinks.filter((link) => {
      const matchUrl = link.url.toLowerCase().includes(q);
      const matchSource = link.sourceType.toLowerCase().includes(q);
      return matchUrl || matchSource;
    });
  }, [propertyLinks, searchQuery]);

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
            onClick={openAddModal}
            className="btn-primary-red"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Add Property Link</span>
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
            placeholder="Search by link or source (Owner, Agent)..."
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
      </div>

      {/* Stored Links Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
              <tr>
                <th className="py-2.5 px-4 w-32">Source</th>
                <th className="py-2.5 px-4">Property Link</th>
                <th className="py-2.5 px-4 w-40">Added Date</th>
                <th className="py-2.5 px-4 w-48 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-neutral-400">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                        <FiLink className="w-5 h-5" />
                      </div>
                      <p className="text-xs">
                        {searchQuery ? 'No links match your search.' : 'No property links saved yet.'}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={openAddModal}
                          className="btn-sm btn-primary-red mt-1"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                          <span>Add Property Link</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => (
                  <tr 
                    key={link.id} 
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    {/* Source Badge */}
                    <td className="py-3 px-4">
                      {link.sourceType === 'owner' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                          Owner
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                          Agent
                        </span>
                      )}
                    </td>

                    {/* Property Link */}
                    <td className="py-3 px-4">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-neutral-700 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:underline max-w-md truncate block"
                        title={link.url}
                      >
                        {link.url}
                      </a>
                    </td>

                    {/* Added Date */}
                    <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400 text-xs">
                      {new Date(link.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenLink(link.url)}
                          title="Open Link"
                          className="btn-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1 cursor-pointer"
                        >
                          <FiExternalLink className="w-3 h-3" />
                          <span>Open Link</span>
                        </button>

                        <button
                          onClick={() => openEditModal(link)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>

                        {deletingId === link.id ? (
                          <div className="flex items-center gap-1 bg-rose-500/10 p-0.5 rounded border border-rose-500/30">
                            <button
                              onClick={() => handleDelete(link.id)}
                              className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-1 py-0.5 text-[10px] text-neutral-400 hover:text-neutral-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(link.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Link Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingLink ? 'Edit Property Link' : 'Add Property Link'}
        subtitle={editingLink ? 'Update source type and URL.' : 'Store source listing link from owner or agent.'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Source Type Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Source Type
            </label>
            <AppDropdown
              options={[
                { value: 'owner', label: 'Owner' },
                { value: 'agent', label: 'Agent' }
              ]}
              value={sourceType}
              onChange={(val) => setSourceType(val as PropertyLinkSource)}
              className="w-full"
            />
          </div>

          {/* Property Link URL Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Property Link
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="https://www.facebook.com/..."
              className={`glass-input w-full px-3 py-2 text-xs rounded-lg ${
                formError ? 'border-rose-500 focus:border-rose-500' : ''
              }`}
              autoFocus
            />
            {formError ? (
              <p className="text-[11px] text-rose-500 mt-1.5">{formError}</p>
            ) : (
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Paste the full URL from Facebook, LINE, website, or marketplace.
              </p>
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
              className="btn-primary-red"
            >
              <FiCheck className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
