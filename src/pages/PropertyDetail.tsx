// EstateFlow Control - Property Detail Workspace (Section 19 & 20)
import React, { useState } from 'react';
import { 
  FiArrowLeft, 
  FiPlay, 
  FiUploadCloud, 
  FiImage, 
  FiStar, 
  FiCheck, 
  FiCpu, 
  FiShare2, 
  FiFileText, 
  FiFolder, 
  FiActivity, 
  FiTrash2, 
  FiMaximize2,
  FiDownload,
  FiExternalLink,
  FiLayers
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PropertyImage, JobWorkflowType } from '../types';
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
  const [selectedImageModal, setSelectedImageModal] = useState<PropertyImage | null>(null);

  const property = db.getProperty(selectedPropertyId || '');
  const images = db.getImages(selectedPropertyId || '');
  const content = db.getContent(selectedPropertyId || '');
  const activities = db.getActivities().filter(a => a.propertyId === selectedPropertyId);
  const publishingRecords = db.getPublishingRecords(selectedPropertyId || '');

  if (!property) {
    return (
      <div className="p-8 text-center glass-panel rounded-3xl">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
          Property not found
        </h2>
        <button
          onClick={() => setActivePage('properties')}
          className="mt-4 px-4 py-2 rounded-xl btn-primary-red text-xs font-semibold"
        >
          Return to Portfolio
        </button>
      </div>
    );
  }

  // Batch Image Upload Handler
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
    addNotification('info', 'Enhancement Queued', `Queued ${img.originalFileName} for enhancement worker.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActivePage('properties')}
            className="p-2.5 rounded-xl bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 transition-colors text-neutral-600 dark:text-neutral-300"
            title="Back to Listings"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                {property.projectName}
              </h1>
              <StatusBadge status={property.status} size="sm" />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {property.bedrooms} Bed • {property.bathrooms} Bath • {property.sizeSqm} m² • {property.location}
            </p>
          </div>
        </div>

        {/* 1-Click Main Action (Section 25) */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunCompleteWorkflow}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary-red text-xs font-bold uppercase tracking-wider shadow-xl shadow-rose-600/30"
          >
            <FiPlay className="w-4 h-4 fill-white" />
            <span>Start Complete Workflow</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Section 19) */}
      <div className="flex items-center gap-2 border-b border-neutral-200/50 dark:border-white/10 pb-2 overflow-x-auto text-xs font-bold">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Images Gallery & Uploader */}
      {activeTab === 'images' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Drag & Drop Upload Zone */}
          <div className="p-6 rounded-3xl border-2 border-dashed border-rose-500/30 bg-rose-500/[0.02] hover:bg-rose-500/[0.05] transition-all flex flex-col items-center justify-center text-center relative cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-500 mb-3 shadow-inner">
              <FiUploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Drop photos here to import into {property.projectName}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              Supports high-resolution JPG, PNG, WEBP. Automatically sorted into the property's local original storage.
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                onClick={() => setSelectedImageModal(img)}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-neutral-900 relative overflow-hidden">
                    <img
                      src={img.previewUrl}
                      alt={img.originalFileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Overlay Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/75 text-white backdrop-blur-sm">
                        #{index + 1}
                      </span>
                      {img.isFavorite && (
                        <span className="p-1 rounded-md bg-amber-500 text-white shadow-sm" title="Primary Hero Photo">
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
                        className={`p-2 rounded-xl backdrop-blur-md transition-colors ${
                          img.isFavorite ? 'bg-amber-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <FiStar className="w-4 h-4" />
                      </button>

                      {img.status !== 'completed' && img.status !== 'generating' && (
                        <button
                          onClick={(e) => handleEnhanceSingle(img, e)}
                          title="Enhance Photo"
                          className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                        >
                          <FiCpu className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDeleteImage(img.id, e)}
                        title="Delete Photo"
                        className="p-2 rounded-xl bg-black/60 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
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

                <div className="px-3 py-2 border-t border-neutral-200/50 dark:border-white/5 flex items-center justify-between text-[11px]">
                  <label 
                    onClick={(e) => e.stopPropagation()} 
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-150">
          <div className="md:col-span-2 glass-panel p-6 rounded-3xl space-y-5">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Property Characteristics
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {property.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-neutral-200/40 dark:border-white/5">
              <div>
                <span className="text-[11px] text-neutral-400 block">Layout</span>
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  {property.bedrooms} Bed, {property.bathrooms} Bath
                </span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block">Usable Area</span>
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  {property.sizeSqm} Sq.m.
                </span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block">Floor / Building</span>
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  Fl. {property.floor || '-'} / {property.building || '-'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block">Furnishing</span>
                <span className="text-xs font-bold text-neutral-900 dark:text-white capitalize">
                  {property.furnishedStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200/40 dark:border-white/5">
              <span className="text-[11px] text-neutral-400 block mb-2">Equipment & Appliances</span>
              <div className="flex flex-wrap gap-1.5">
                {property.equipment.map((eq, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-neutral-200/60 dark:bg-white/5 border border-neutral-300/40 dark:border-white/10 text-neutral-700 dark:text-neutral-300">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Financial Terms
            </h3>
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider block">Rental Price</span>
              <span className="text-2xl font-black">
                ฿{property.rentalPrice?.toLocaleString() || 'Inquire'}/mo
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-200/40 dark:border-white/5">
                <span className="text-neutral-400">Security Deposit</span>
                <span className="font-semibold text-neutral-200">{property.depositMonths} Months</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/40 dark:border-white/5">
                <span className="text-neutral-400">Advance Rent</span>
                <span className="font-semibold text-neutral-200">{property.advancePaymentMonths} Month</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/40 dark:border-white/5">
                <span className="text-neutral-400">Contract Length</span>
                <span className="font-semibold text-neutral-200">{property.contractDurationMonths} Months</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/40 dark:border-white/5">
                <span className="text-neutral-400">Pets</span>
                <span className={`font-semibold ${property.petsAllowed ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {property.petsAllowed ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Automation Pipeline */}
      {activeTab === 'automation' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Live Automation Tasks for {property.projectName}
              </h3>
              <p className="text-xs text-neutral-400">
                Jobs dispatched to Chrome profile workers via OpenClaw
              </p>
            </div>
            <button
              onClick={handleRunCompleteWorkflow}
              className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary-red text-xs font-bold"
            >
              <FiPlay className="w-3.5 h-3.5" />
              <span>Rerun Full Pipeline</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {jobs.filter(j => j.propertyId === property.id).map((job) => (
              <div key={job.id} className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-neutral-900 dark:text-white">
                      {job.stageName || job.workflowType}
                    </span>
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                  <p className="text-xs text-neutral-400">
                    {job.currentStepMessage}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-500">
                    {job.progressPercent}%
                  </span>
                  <div className="w-24 h-1.5 rounded-full bg-neutral-800 overflow-hidden mt-1">
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
        <div className="space-y-4 animate-in fade-in duration-150">
          {content ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-panel p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Facebook Post Copy
                </h4>
                <div className="p-3 rounded-xl bg-neutral-900/60 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {content.facebookPost}
                </div>
              </div>
              <div className="glass-panel p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Facebook Marketplace Listing
                </h4>
                <div className="p-3 rounded-xl bg-neutral-900/60 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  <strong className="text-rose-400 block mb-2">{content.marketplaceTitle}</strong>
                  {content.marketplaceDescription}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center glass-panel rounded-2xl">
              <p className="text-xs text-neutral-400 mb-3">No content generated yet for this listing.</p>
              <button
                onClick={() => {
                  automationEngine.queueContentGeneration(property);
                  addNotification('info', 'Generation Started', 'Synthesizing marketing copy...');
                }}
                className="px-4 py-2 rounded-xl btn-primary-red text-xs font-semibold"
              >
                Synthesize Content Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Local Files Representation (Section 21 & 49) */}
      {activeTab === 'files' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/40 dark:border-white/10">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Property Storage Tree: ~/Documents/EstateFlow Control/{property.projectName}
              </h3>
              <p className="text-xs text-neutral-400">
                Local directory organized according to Section 21 specification.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {['Original', 'Enhanced', 'Hero', 'Content', 'Exports', 'Logs'].map((folder) => (
              <div key={folder} className="p-3 rounded-xl bg-neutral-200/50 dark:bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 font-bold">
                  <FiFolder className="text-rose-500 w-4 h-4" />
                  <span>/{folder}</span>
                </div>
                <span className="text-[11px] text-neutral-400">
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
