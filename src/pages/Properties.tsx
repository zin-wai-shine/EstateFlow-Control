// EstateFlow Control - Properties Management (Normal Case, Calm & Modern)
import React, { useState, useMemo } from 'react';
import { 
  FiPlus, 
  FiGrid, 
  FiList, 
  FiFilter, 
  FiHome, 
  FiImage, 
  FiEye, 
  FiTrash2, 
  FiMapPin 
} from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { db } from '../services/storage';

export const Properties: React.FC = () => {
  const { 
    properties, 
    openCreateProperty, 
    openPropertyDetail, 
    refreshProperties, 
    globalSearchQuery,
    addNotification 
  } = useApp();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedListingType, setSelectedListingType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_high' | 'price_low' | 'name'>('newest');

  const allImages = db.getImages();

  // Filter & Search logic
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (globalSearchQuery) {
        const query = globalSearchQuery.toLowerCase();
        const matchesName = p.projectName.toLowerCase().includes(query);
        const matchesLocation = p.location.toLowerCase().includes(query);
        const matchesTransit = p.nearestTransit?.toLowerCase().includes(query);
        if (!matchesName && !matchesLocation && !matchesTransit) return false;
      }

      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }

      if (selectedListingType !== 'all') {
        if (p.listingType !== selectedListingType && p.listingType !== 'both') {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_high') return (b.rentalPrice || 0) - (a.rentalPrice || 0);
      if (sortBy === 'price_low') return (a.rentalPrice || 0) - (b.rentalPrice || 0);
      if (sortBy === 'name') return a.projectName.localeCompare(b.projectName);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [properties, globalSearchQuery, selectedStatus, selectedListingType, sortBy]);

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${name}"? This removes all associated photos and jobs.`)) {
      db.deleteProperty(id);
      refreshProperties();
      addNotification('info', 'Property Removed', `Property "${name}" deleted.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Property Listings Portfolio
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage listings, floor plans, high-resolution photos, and media workflows.
          </p>
        </div>

        <button
          onClick={openCreateProperty}
          className="btn-primary-red shrink-0 self-start sm:self-auto"
        >
          <FiPlus className="w-3.5 h-3.5" />
          <span>New Property</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl glass-panel text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Select */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <FiFilter className="text-neutral-400 w-3.5 h-3.5" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-neutral-800 dark:text-neutral-200 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all" className="dark:bg-neutral-900">All Statuses</option>
              <option value="available" className="dark:bg-neutral-900">Available</option>
              <option value="reserved" className="dark:bg-neutral-900">Reserved</option>
              <option value="rented" className="dark:bg-neutral-900">Rented</option>
              <option value="draft" className="dark:bg-neutral-900">Draft</option>
              <option value="archived" className="dark:bg-neutral-900">Archived</option>
            </select>
          </div>

          {/* Type Select */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <select
              value={selectedListingType}
              onChange={(e) => setSelectedListingType(e.target.value)}
              className="bg-transparent text-neutral-800 dark:text-neutral-200 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all" className="dark:bg-neutral-900">All Deal Types</option>
              <option value="rent" className="dark:bg-neutral-900">Rent Only</option>
              <option value="sale" className="dark:bg-neutral-900">Sale Only</option>
              <option value="both" className="dark:bg-neutral-900">Rent & Sale</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-neutral-800 dark:text-neutral-200 focus:outline-none font-medium cursor-pointer"
            >
              <option value="newest" className="dark:bg-neutral-900">Newest First</option>
              <option value="price_high" className="dark:bg-neutral-900">Price: High to Low</option>
              <option value="price_low" className="dark:bg-neutral-900">Price: Low to High</option>
              <option value="name" className="dark:bg-neutral-900">Project Name</option>
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid View"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-700 text-rose-500 shadow-sm' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'}`}
          >
            <FiGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Table View"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-neutral-700 text-rose-500 shadow-sm' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'}`}
          >
            <FiList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Properties Display */}
      {filteredProperties.length === 0 ? (
        <EmptyState
          icon={FiHome}
          title="No properties found"
          description="No listings match your active filters or search criteria. Create a new property to begin."
          actionLabel="Create Property"
          onAction={openCreateProperty}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((prop) => {
            const propImages = allImages.filter(i => i.propertyId === prop.id);
            const primaryImg = propImages.find(i => i.isFavorite) || propImages[0];
            const completedImages = propImages.filter(i => i.status === 'completed').length;

            return (
              <div
                key={prop.id}
                onClick={() => openPropertyDetail(prop.id)}
                className="glass-card glass-card-hover rounded-xl overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Photo Banner */}
                  <div className="h-44 w-full bg-neutral-800 relative overflow-hidden">
                    {primaryImg?.previewUrl ? (
                      <img
                        src={primaryImg.previewUrl}
                        alt={prop.projectName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
                        <FiImage className="w-8 h-8 mb-1" />
                        <span className="text-xs">No photos uploaded</span>
                      </div>
                    )}
                    
                    <div className="absolute top-2.5 left-2.5">
                      <StatusBadge status={prop.status} size="sm" />
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 text-white text-[11px] font-medium flex items-center gap-1.5">
                      <FiImage className="w-3 h-3 text-neutral-300" />
                      <span>{completedImages}/{propImages.length} Enhanced</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                        {prop.projectName}
                      </h3>
                      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                        ฿{prop.rentalPrice ? prop.rentalPrice.toLocaleString() + '/mo' : (prop.salePrice ? '฿' + prop.salePrice.toLocaleString() : 'Inquire')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>{prop.bedrooms} Bed</span>
                      <span>•</span>
                      <span>{prop.bathrooms} Bath</span>
                      <span>•</span>
                      <span>{prop.sizeSqm} m²</span>
                      {prop.floor && (
                        <>
                          <span>•</span>
                          <span>Fl. {prop.floor}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-neutral-400 truncate">
                      <FiMapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                      <span className="truncate">{prop.location}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-neutral-400 text-[11px] truncate max-w-[160px]">
                    {prop.nearestTransit || 'Transit nearby'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(prop.id, prop.projectName, e)}
                      title="Delete Property"
                      className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                      <span>Open Workspace</span>
                      <FiEye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
              <tr>
                <th className="py-2.5 px-4">Property</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Specs</th>
                <th className="py-2.5 px-4">Pricing</th>
                <th className="py-2.5 px-4">Images</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredProperties.map((prop) => {
                const propImages = allImages.filter(i => i.propertyId === prop.id);
                const primaryImg = propImages.find(i => i.isFavorite) || propImages[0];
                const completedCount = propImages.filter(i => i.status === 'completed').length;

                return (
                  <tr
                    key={prop.id}
                    onClick={() => openPropertyDetail(prop.id)}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-800">
                          {primaryImg?.previewUrl ? (
                            <img src={primaryImg.previewUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-500">
                              <FiHome className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {prop.projectName}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {prop.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={prop.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-4 text-neutral-600 dark:text-neutral-300">
                      {prop.bedrooms} Bed • {prop.bathrooms} Bath • {prop.sizeSqm} m²
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-rose-600 dark:text-rose-400">
                      ฿{prop.rentalPrice ? prop.rentalPrice.toLocaleString() + '/mo' : (prop.salePrice ? '฿' + prop.salePrice.toLocaleString() : 'Inquire')}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-emerald-500 font-medium">
                        {completedCount}/{propImages.length} Ready
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={(e) => handleDelete(prop.id, prop.projectName, e)}
                        title="Delete Property"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
