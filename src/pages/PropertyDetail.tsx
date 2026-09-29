// EstateFlow Control - Property Detail Workspace (Normal Case, Clean)
import React, { useState } from 'react';
import { 
  FiArrowLeft, 
  FiPlay, 
  FiUploadCloud, 
  FiImage, 
  FiStar, 
  FiCpu, 
  FiShare2, 
  FiFileText, 
  FiFolder, 
  FiActivity, 
  FiTrash2,
  FiLayers
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PropertyImage } from '../types';
import { db } from '../services/storage';
import { automationEngine } from '../services/automationEngine';

export const PropertyDetail: React.FC = () => {
  const { 
    selectedPropertyId, 
    setActivePage, 
    addNotification, 
    refreshProperties,
    jobs 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'images' | 'automation' | 'content' | 'publishing' | 'activity' | 'files'>('images');

  const property = db.getProperty(selectedPropertyId || '');
  const images = db.getImages(selectedPropertyId || '');
  const content = db.getContent(selectedPropertyId || '');
  const publishingRecords = db.getPublishingRecords(selectedPropertyId || '');

  if (!property) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl">
        <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
          Property not found
        </h2>
        <button
          onClick={() => setActivePage('properties')}
          className="mt-3 px-3.5 py-2 rounded-lg btn-primary-red text-xs font-medium cursor-pointer"
        >
          Return to Portfolio
        </button>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    const newImages: PropertyImage[] = files.map((file, idx) => {
      const imgId = 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      return {
        id: imgId,
        propertyId: property.id,
        originalFileName: file.name,
        filePathOriginal: `Documents/EstateFlow Control/${property.projectName}/Original/${file.name}`,
        previewUrl: URL.createObjectURL(file),
        fileSizeBytes: file.size,
        orderIndex: images.length + idx,
        isFavorite: images.length === 0 && idx === 0,
        isHeroCandidate: true,
        status: 'waiting',
        statusMessage: 'Ready for batch AI enhancement',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    db.saveImages(newImages);
    refreshProperties();
    addNotification('success', 'Photos Added', `Imported ${newImages.length} photos into property gallery.`);
  };

  const handleToggleFavorite = (img: PropertyImage, e: React.MouseEvent) => {
    e.stopPropagation();
    img.isFavorite = !img.isFavorite;
    db.saveImage(img);
    refreshProperties();
  };

  const handleToggleHero = (img: PropertyImage, e: React.MouseEvent) => {
    e.stopPropagation();
    img.isHeroCandidate = !img.isHeroCandidate;
    db.saveImage(img);
    refreshProperties();
  };

  const handleDeleteImage = (imgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    db.deleteImage(imgId);
    refreshProperties();
    addNotification('info', 'Photo Removed', 'Image removed from workspace.');
  };

  const handleRunCompleteWorkflow = () => {
    automationEngine.startCompletePropertyWorkflow(property.id);
    addNotification('success', 'Workflow Triggered', `Complete workflow started for ${property.projectName}.`);
    setActiveTab('automation');
  };

  const handleEnhanceSingle = (img: PropertyImage, e: React.MouseEvent) => {
    e.stopPropagation();
    automationEngine.queueImageEnhancement(property, img);
    addNotification('info', 'Enhancement Queued', `Queued ${img.originalFileName} for enhancement.`);
  };

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-neutral-200 dark:border-white/10">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setActivePage('properties')}
            className="p-2 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors text-neutral-600 dark:text-neutral-300 cursor-pointer"
            title="Back to Listings"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {property.projectName}
              </h1>
              <StatusBadge status={property.status} size="sm" />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {property.bedrooms} Bed • {property.bathrooms} Bath • {property.sizeSqm} m² • {property.location}
            </p>
          </div>
        </div>

        {/* 1-Click Main Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunCompleteWorkflow}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary-red text-xs font-medium cursor-pointer"
          >
            <FiPlay className="w-3.5 h-3.5 fill-white" />
            <span>Start Complete Workflow</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-neutral-200 dark:border-white/10 pb-2 overflow-x-auto text-xs font-medium">
        {[
          { id: 'images', label: `Images (${images.length})`, icon: FiImage },
          { id: 'overview', label: 'Overview Specs', icon: FiFileText },
          { id: 'automation', label: 'AI Automation', icon: FiCpu },
          { id: 'content', label: 'Content Studio', icon: FiLayers },
          { id: 'publishing', label: `Publishing (${publishingRecords.length})`, icon: FiShare2 },
          { id: 'files', label: 'Local Files', icon: FiFolder },
          { id: 'activity', label: 'Activity', icon: FiActivity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 font-semibold border border-rose-500/20'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Images Gallery & Uploader */}
      {activeTab === 'images' && (
        <div className="space-y-5">
          {/* Drag & Drop Upload Zone */}
          <div className="p-6 rounded-2xl border border-dashed border-neutral-300 dark:border-white/15 bg-neutral-50/50 dark:bg-white/[0.02] hover:bg-neutral-100/50 dark:hover:bg-white/[0.04] transition-colors flex flex-col items-center justify-center text-center relative cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="p-2.5 rounded-xl bg-neutral-200/60 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 mb-2">
              <FiUploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Drop photos here to import into {property.projectName}
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 max-w-sm">
              Supports high-resolution JPG, PNG, WEBP.
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                className="glass-card glass-card-hover rounded-xl overflow-hidden group flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 bg-neutral-900 relative overflow-hidden">
                    <img
                      src={img.previewUrl}
                      alt={img.originalFileName}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white">
                        #{index + 1}
                      </span>
                      {img.isFavorite && (
                        <span className="p-1 rounded bg-amber-500 text-white" title="Primary Photo">
                          <FiStar className="w-3 h-3 fill-white" />
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2 right-2">
                      <StatusBadge status={img.status} size="sm" />
                    </div>

                    {/* Quick Action Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => handleToggleFavorite(img, e)}
                        title={img.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          img.isFavorite ? 'bg-amber-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <FiStar className="w-3.5 h-3.5" />
                      </button>

                      {img.status !== 'completed' && img.status !== 'generating' && (
                        <button
                          onClick={(e) => handleEnhanceSingle(img, e)}
                          title="Enhance Photo"
                          className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          <FiCpu className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDeleteImage(img.id, e)}
                        title="Delete Photo"
                        className="p-2 rounded-lg bg-black/60 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {img.originalFileName}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center justify-between">
                      <span>{(img.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                      <span className="truncate max-w-[120px] text-right">
                        {img.statusMessage || img.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                  <label 
                    className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={img.isHeroCandidate}
                      onChange={(e) => handleToggleHero(img, e as any)}
                      className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Hero set</span>
                  </label>
                  <span className="text-neutral-500 text-[10px]">
                    {img.status === 'completed' ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Property Characteristics
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {property.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-neutral-100 dark:border-white/5">
              <div>
                <span className="text-[11px] text-neutral-400 block">Layout</span>
                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                  {property.bedrooms} Bed, {property.bathrooms} Bath
                </span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block">Usable Area</span>
                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                  {property.sizeSqm} Sq.m.
                </span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block">Floor / Building</span>
                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                  Fl. {property.floor || '-'} / {property.building || '-'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block">Furnishing</span>
                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                  {property.furnishedStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-white/5">
              <span className="text-[11px] text-neutral-400 block mb-1.5">Equipment & Appliances</span>
              <div className="flex flex-wrap gap-1.5">
                {property.equipment.map((eq, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Financial Terms
            </h3>
            <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-rose-500">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block">Monthly Rental</span>
              <span className="text-xl font-bold">
                ฿{property.rentalPrice?.toLocaleString() || 'Inquire'}/mo
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                <span className="text-neutral-400">Security Deposit</span>
                <span className="font-medium text-neutral-200">{property.depositMonths} Months</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                <span className="text-neutral-400">Advance Rent</span>
                <span className="font-medium text-neutral-200">{property.advancePaymentMonths} Month</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                <span className="text-neutral-400">Contract Length</span>
                <span className="font-medium text-neutral-200">{property.contractDurationMonths} Months</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                <span className="text-neutral-400">Pets</span>
                <span className={`font-medium ${property.petsAllowed ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {property.petsAllowed ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Automation Pipeline */}
      {activeTab === 'automation' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Live Automation Tasks for {property.projectName}
              </h3>
              <p className="text-xs text-neutral-400">
                Jobs dispatched to Chrome profile workers via OpenClaw
              </p>
            </div>
            <button
              onClick={handleRunCompleteWorkflow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary-red text-xs font-medium cursor-pointer"
            >
              <FiPlay className="w-3 h-3" />
              <span>Rerun Full Pipeline</span>
            </button>
          </div>

          <div className="space-y-2">
            {jobs.filter(j => j.propertyId === property.id).map((job) => (
              <div key={job.id} className="glass-card p-3.5 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-neutral-900 dark:text-neutral-100">
                      {job.stageName || job.workflowType}
                    </span>
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                  <p className="text-xs text-neutral-400">
                    {job.currentStepMessage}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-rose-500">
                    {job.progressPercent}%
                  </span>
                  <div className="w-24 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden mt-1">
                    <div 
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${job.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Content Studio */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {content ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-medium text-neutral-400">
                  Facebook Post Copy
                </h4>
                <div className="p-3 rounded-lg bg-neutral-100 dark:bg-black/30 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {content.facebookPost}
                </div>
              </div>
              <div className="glass-panel p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-medium text-neutral-400">
                  Facebook Marketplace Listing
                </h4>
                <div className="p-3 rounded-lg bg-neutral-100 dark:bg-black/30 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  <strong className="text-rose-500 block mb-1">{content.marketplaceTitle}</strong>
                  {content.marketplaceDescription}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center glass-panel rounded-xl">
              <p className="text-xs text-neutral-400 mb-3">No content generated yet for this listing.</p>
              <button
                onClick={() => {
                  automationEngine.queueContentGeneration(property);
                  addNotification('info', 'Generation Started', 'Synthesizing marketing copy...');
                }}
                className="px-3.5 py-1.5 rounded-lg btn-primary-red text-xs font-medium cursor-pointer"
              >
                Synthesize Content Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Local Files Representation */}
      {activeTab === 'files' && (
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="pb-2 border-b border-neutral-100 dark:border-white/5">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Storage: ~/Documents/EstateFlow Control/{property.projectName}
            </h3>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            {['Original', 'Enhanced', 'Hero', 'Content', 'Exports', 'Logs'].map((folder) => (
              <div key={folder} className="p-2.5 rounded-lg bg-neutral-100 dark:bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                  <FiFolder className="text-rose-500 w-3.5 h-3.5" />
                  <span>/{folder}</span>
                </div>
                <span className="text-[11px] text-neutral-400 font-sans">
                  {folder === 'Original' ? `${images.length} files` : folder === 'Enhanced' ? `${images.filter(i => i.status === 'completed').length} files` : 'Auto-managed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
