// EstateFlow Control - Property Creation & Editing Form (Section 18)
import React, { useState } from 'react';
import { FiSave, FiCheck, FiX, FiLayers, FiDollarSign, FiMapPin, FiInfo } from 'react-icons/fi';
import { GlassModal } from '../components/common/GlassModal';
import { useApp } from '../context/AppContext';
import { Property, PropertyType, ListingType, PropertyStatus } from '../types';
import { db } from '../services/storage';

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyToEdit?: Property;
}

export const PropertyFormModal: React.FC<PropertyFormModalProps> = ({
  isOpen,
  onClose,
  propertyToEdit
}) => {
  const { refreshProperties, openPropertyDetail, addNotification } = useApp();

  const [activeTab, setActiveTab] = useState<'basics' | 'specs' | 'pricing' | 'terms'>('basics');

  // Form Fields
  const [projectName, setProjectName] = useState(propertyToEdit?.projectName || '');
  const [propertyType, setPropertyType] = useState<PropertyType>(propertyToEdit?.propertyType || 'condo');
  const [listingType, setListingType] = useState<ListingType>(propertyToEdit?.listingType || 'rent');
  const [rentalPrice, setRentalPrice] = useState(propertyToEdit?.rentalPrice?.toString() || '65000');
  const [salePrice, setSalePrice] = useState(propertyToEdit?.salePrice?.toString() || '');
  
  const [bedrooms, setBedrooms] = useState(propertyToEdit?.bedrooms?.toString() || '1');
  const [bathrooms, setBathrooms] = useState(propertyToEdit?.bathrooms?.toString() || '1');
  const [sizeSqm, setSizeSqm] = useState(propertyToEdit?.sizeSqm?.toString() || '45');
  const [floor, setFloor] = useState(propertyToEdit?.floor?.toString() || '14');
  const [building, setBuilding] = useState(propertyToEdit?.building || 'Tower A');
  const [unitNumber, setUnitNumber] = useState(propertyToEdit?.unitNumber || '');

  const [location, setLocation] = useState(propertyToEdit?.location || 'Sukhumvit, Bangkok');
  const [nearestTransit, setNearestTransit] = useState(propertyToEdit?.nearestTransit || 'BTS Asok 400m');
  const [distanceToTransit, setDistanceToTransit] = useState(propertyToEdit?.distanceToTransit || '5 mins walk');
  const [furnishedStatus, setFurnishedStatus] = useState(propertyToEdit?.furnishedStatus || 'fully_furnished');
  const [equipmentInput, setEquipmentInput] = useState(propertyToEdit?.equipment?.join(', ') || 'Air Conditioner, Washing Machine, Smart TV, Refrigerator, Microwave');

  const [description, setDescription] = useState(propertyToEdit?.description || 'Stunning modern luxury residence featuring premium furnishings, high floor open views, and top-tier amenities.');
  const [ownerNotes, setOwnerNotes] = useState(propertyToEdit?.ownerNotes || 'Owner requires 1-year lease minimum.');
  const [internalNotes, setInternalNotes] = useState(propertyToEdit?.internalNotes || 'Keycard available in agency lockbox.');

  const [availabilityDate, setAvailabilityDate] = useState(propertyToEdit?.availabilityDate || 'Immediate');
  const [smokingAllowed, setSmokingAllowed] = useState(propertyToEdit?.smokingAllowed || false);
  const [petsAllowed, setPetsAllowed] = useState(propertyToEdit?.petsAllowed || false);
  const [contractDurationMonths, setContractDurationMonths] = useState(propertyToEdit?.contractDurationMonths?.toString() || '12');
  const [depositMonths, setDepositMonths] = useState(propertyToEdit?.depositMonths?.toString() || '2');
  const [advancePaymentMonths, setAdvancePaymentMonths] = useState(propertyToEdit?.advancePaymentMonths?.toString() || '1');
  const [ownerContactName, setOwnerContactName] = useState(propertyToEdit?.ownerContactName || '');
  const [ownerContactPhone, setOwnerContactPhone] = useState(propertyToEdit?.ownerContactPhone || '');

  const handleSave = (status: PropertyStatus) => {
    if (!projectName.trim()) {
      alert('Please provide a Project Name.');
      return;
    }

    const equipmentList = equipmentInput
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    const newProperty: Property = {
      id: propertyToEdit?.id || 'prop-' + Date.now(),
      projectName: projectName.trim(),
      propertyType,
      listingType,
      rentalPrice: rentalPrice ? Number(rentalPrice) : undefined,
      salePrice: salePrice ? Number(salePrice) : undefined,
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      sizeSqm: Number(sizeSqm) || 30,
      floor: floor || undefined,
      building: building || undefined,
      unitNumber: unitNumber || undefined,
      location: location.trim(),
      nearestTransit: nearestTransit.trim(),
      distanceToTransit: distanceToTransit.trim(),
      furnishedStatus,
      equipment: equipmentList,
      description: description.trim(),
      ownerNotes: ownerNotes.trim(),
      internalNotes: internalNotes.trim(),
      availabilityDate: availabilityDate.trim(),
      smokingAllowed,
      petsAllowed,
      contractDurationMonths: Number(contractDurationMonths) || 12,
      depositMonths: Number(depositMonths) || 2,
      advancePaymentMonths: Number(advancePaymentMonths) || 1,
      ownerContactName: ownerContactName.trim() || undefined,
      ownerContactPhone: ownerContactPhone.trim() || undefined,
      status,
      createdAt: propertyToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveProperty(newProperty);
    refreshProperties();

    db.addActivity({
      propertyId: newProperty.id,
      propertyName: newProperty.projectName,
      eventType: 'property',
      title: propertyToEdit ? 'Property Updated' : 'Property Registered',
      description: `${newProperty.projectName} (${newProperty.propertyType}) saved as ${status}.`,
      severity: 'success'
    });

    addNotification('success', 'Property Saved', `${newProperty.projectName} saved successfully.`);
    onClose();
    openPropertyDetail(newProperty.id);
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={propertyToEdit ? `Edit ${propertyToEdit.projectName}` : 'Create New Property Workspace'}
      subtitle="Enter property specifications, location, and leasing terms."
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Navigation Tabs inside Form */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-200/50 dark:bg-white/5 border border-neutral-300/40 dark:border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${activeTab === 'basics' ? 'bg-white dark:bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            1. Basics & Location
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${activeTab === 'specs' ? 'bg-white dark:bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            2. Specs & Equipment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${activeTab === 'pricing' ? 'bg-white dark:bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            3. Pricing & Terms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${activeTab === 'terms' ? 'bg-white dark:bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            4. Description & Notes
          </button>
        </div>

        {/* Tab 1: Basics & Location */}
        {activeTab === 'basics' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Ashton Asoke, The Crest Sukhumvit..."
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e: any) => setPropertyType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold cursor-pointer dark:bg-neutral-900"
                >
                  <option value="condo">Condominium</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">Detached House</option>
                  <option value="townhome">Townhome</option>
                  <option value="villa">Luxury Villa</option>
                  <option value="commercial">Commercial / Office</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Listing Deal Type
                </label>
                <select
                  value={listingType}
                  onChange={(e: any) => setListingType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold cursor-pointer dark:bg-neutral-900"
                >
                  <option value="rent">For Rent Only</option>
                  <option value="sale">For Sale Only</option>
                  <option value="both">Both Rent & Sale</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  General Location / Neighborhood
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Thong Lo, Bangkok"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Nearest Transit Station
                </label>
                <input
                  type="text"
                  value={nearestTransit}
                  onChange={(e) => setNearestTransit(e.target.value)}
                  placeholder="e.g. BTS Thong Lo 300m"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Specs & Equipment */}
        {activeTab === 'specs' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Bedrooms
                </label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-bold"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Bathrooms
                </label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-bold"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Size (Sq.m.)
                </label>
                <input
                  type="number"
                  value={sizeSqm}
                  onChange={(e) => setSizeSqm(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-bold"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Floor
                </label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. 18"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Building
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="e.g. Tower A"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Unit Number
                </label>
                <input
                  type="text"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="e.g. 1804"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                Furnished Status
              </label>
              <select
                value={furnishedStatus}
                onChange={(e: any) => setFurnishedStatus(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold cursor-pointer dark:bg-neutral-900"
              >
                <option value="fully_furnished">Fully Furnished</option>
                <option value="partially_furnished">Partially Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                Equipment & Appliances (comma separated)
              </label>
              <input
                type="text"
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                placeholder="Air Conditioner, Washing Machine, Smart TV, Refrigerator..."
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Pricing & Terms */}
        {activeTab === 'pricing' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Monthly Rental Price (฿)
                </label>
                <input
                  type="number"
                  value={rentalPrice}
                  onChange={(e) => setRentalPrice(e.target.value)}
                  placeholder="e.g. 85000"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-bold text-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Sale Price (฿) Optional
                </label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="e.g. 18500000"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Contract (Months)
                </label>
                <input
                  type="number"
                  value={contractDurationMonths}
                  onChange={(e) => setContractDurationMonths(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Security Deposit (Mo)
                </label>
                <input
                  type="number"
                  value={depositMonths}
                  onChange={(e) => setDepositMonths(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Advance Payment (Mo)
                </label>
                <input
                  type="number"
                  value={advancePaymentMonths}
                  onChange={(e) => setAdvancePaymentMonths(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Pets Allowed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={smokingAllowed}
                  onChange={(e) => setSmokingAllowed(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Smoking Allowed</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 4: Description & Notes */}
        {activeTab === 'terms' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                Property Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-end marketing description..."
                className="w-full p-3 rounded-xl glass-input text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Owner Notes / Preferences
                </label>
                <textarea
                  rows={2}
                  value={ownerNotes}
                  onChange={(e) => setOwnerNotes(e.target.value)}
                  placeholder="Notes from property owner..."
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Internal Agency Notes
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Lockbox code, viewing availability..."
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200/50 dark:border-white/10 text-xs">
          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="px-4 py-2.5 rounded-xl bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 font-bold transition-colors"
          >
            Save as Draft
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave('available')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary-red font-bold uppercase tracking-wide shadow-lg shadow-rose-600/30"
            >
              <FiCheck className="w-4 h-4" />
              <span>Save & Open Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </GlassModal>
  );
};
