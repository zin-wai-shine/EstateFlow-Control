// EstateFlow Control - Content Studio (Normal Case, Clean)
import React, { useState, useEffect } from 'react';
import { 
  FiEdit3, 
  FiCopy, 
  FiCheck, 
  FiRefreshCw, 
  FiSave, 
  FiShare2, 
  FiFileText 
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { GeneratedContent } from '../types';
import { db } from '../services/storage';
import { automationEngine } from '../services/automationEngine';

export const ContentStudio: React.FC = () => {
  const { properties, addNotification } = useApp();
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const [content, setContent] = useState<GeneratedContent | null>(null);

  const [facebookPost, setFacebookPost] = useState('');
  const [tiktokCaption, setTiktokCaption] = useState('');
  const [marketplaceTitle, setMarketplaceTitle] = useState('');
  const [marketplaceDescription, setMarketplaceDescription] = useState('');

  useEffect(() => {
    if (selectedPropertyId) {
      const c = db.getContent(selectedPropertyId);
      if (c) {
        setContent(c);
        setFacebookPost(c.facebookPost);
        setTiktokCaption(c.tiktokCaption);
        setMarketplaceTitle(c.marketplaceTitle);
        setMarketplaceDescription(c.marketplaceDescription);
      } else {
        setContent(null);
        setFacebookPost('');
        setTiktokCaption('');
        setMarketplaceTitle('');
        setMarketplaceDescription('');
      }
    }
  }, [selectedPropertyId]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addNotification('info', 'Copied to Clipboard', `Copied text.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = () => {
    if (!selectedProperty) return;
    const updatedContent: GeneratedContent = {
      id: content?.id || 'cnt-' + Date.now(),
      propertyId: selectedProperty.id,
      facebookPost,
      tiktokCaption,
      marketplaceTitle,
      marketplaceDescription,
      hashtags: content?.hashtags || ['#BangkokCondo', '#RealEstate'],
      propertySummary: content?.propertySummary || '',
      version: (content?.version || 0) + 1,
      createdAt: content?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.saveContent(updatedContent);
    setContent(updatedContent);
    addNotification('success', 'Content Saved', 'Listing copywriting changes saved.');
  };

  const handleRegenerate = () => {
    if (!selectedProperty) return;
    automationEngine.queueContentGeneration(selectedProperty);
    addNotification('info', 'Synthesis Queued', `Regenerating copy for ${selectedProperty.projectName}...`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Content Studio & Copywriting
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Format captions, Marketplace listings, and hashtags for social channels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="px-3 py-1.5 rounded-lg glass-input text-xs font-medium dark:bg-neutral-900 cursor-pointer"
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>

          <button
            onClick={handleRegenerate}
            className="btn-secondary"
          >
            <FiRefreshCw className="w-3.5 h-3.5 text-rose-500" />
            <span>Regenerate Copy</span>
          </button>

          <button
            onClick={handleSave}
            className="btn-primary-red"
          >
            <FiSave className="w-3.5 h-3.5" />
            <span>Save Edits</span>
          </button>
        </div>
      </div>

      {content ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Facebook Post Copy */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <FiFileText className="text-rose-500" />
                <span>Facebook Post Copy</span>
              </h2>
              <button
                onClick={() => handleCopy(facebookPost, 'facebook_post')}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
              >
                {copiedKey === 'facebook_post' ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'facebook_post' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              rows={12}
              value={facebookPost}
              onChange={(e) => setFacebookPost(e.target.value)}
              className="w-full p-3 rounded-lg glass-input text-xs font-mono leading-relaxed"
            />
          </div>

          {/* Facebook Marketplace Listing */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <FiShare2 className="text-rose-500" />
                <span>Facebook Marketplace Listing</span>
              </h2>
              <button
                onClick={() => handleCopy(`${marketplaceTitle}\n\n${marketplaceDescription}`, 'marketplace')}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
              >
                {copiedKey === 'marketplace' ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'marketplace' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Title (Max 65 characters)
              </label>
              <input
                type="text"
                value={marketplaceTitle}
                onChange={(e) => setMarketplaceTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg glass-input text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Listing Description
              </label>
              <textarea
                rows={6}
                value={marketplaceDescription}
                onChange={(e) => setMarketplaceDescription(e.target.value)}
                className="w-full p-2.5 rounded-lg glass-input text-xs font-mono leading-relaxed"
              />
            </div>

            {/* TikTok Caption */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-neutral-400">
                  TikTok Tour Caption & Tags
                </label>
                <button
                  onClick={() => handleCopy(tiktokCaption, 'tiktok')}
                  className="text-[11px] text-rose-500 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <FiCopy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <input
                type="text"
                value={tiktokCaption}
                onChange={(e) => setTiktokCaption(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg glass-input text-xs font-mono"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center glass-panel rounded-2xl space-y-3">
          <FiEdit3 className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            No copy generated yet for {selectedProperty?.projectName}
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Click synthesize to automatically compose Facebook, Marketplace, and TikTok text from listing parameters.
          </p>
          <button
            onClick={handleRegenerate}
            className="px-4 py-2 rounded-lg btn-primary-red text-xs font-medium cursor-pointer"
          >
            Synthesize Copywriting
          </button>
        </div>
      )}
    </div>
  );
};
