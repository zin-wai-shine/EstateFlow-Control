// EstateFlow Control - Property Creation & Editing Form (Normal Case, Clean)
import React, { useState } from 'react';
import { FiCheck } from 'react-icons/fi';
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
  const [distanceToTransit] = useState(propertyToEdit?.distanceToTransit || '5 mins walk');
  const [furnishedStatus, setFurnishedStatus] = useState(propertyToEdit?.furnishedStatus || 'fully_furnished');
  const [equipmentInput, setEquipmentInput] = useState(propertyToEdit?.equipment?.join(', ') || 'Air Conditioner, Washing Machine, Smart TV, Refrigerator, Microwave');

  const [description, setDescription] = useState(propertyToEdit?.description || 'Stunning modern luxury residence featuring premium furnishings, high floor open views, and top-tier amenities.');
  const [ownerNotes, setOwnerNotes] = useState(propertyToEdit?.ownerNotes || 'Owner requires 1-year lease minimum.');
  const [internalNotes, setInternalNotes] = useState(propertyToEdit?.internalNotes || 'Keycard available in agency lockbox.');

  const [availabilityDate] = useState(propertyToEdit?.availabilityDate || 'Immediate');
  const [smokingAllowed, setSmokingAllowed] = useState(propertyToEdit?.smokingAllowed || false);
  const [petsAllowed, setPetsAllowed] = useState(propertyToEdit?.petsAllowed || false);
  const [contractDurationMonths, setContractDurationMonths] = useState(propertyToEdit?.contractDurationMonths?.toString() || '12');
  const [depositMonths, setDepositMonths] = useState(propertyToEdit?.depositMonths?.toString() || '2');
  const [advancePaymentMonths, setAdvancePaymentMonths] = useState(propertyToEdit?.advancePaymentMonths?.toString() || '1');
  const [ownerContactName] = useState(propertyToEdit?.ownerContactName || '');
  const [ownerContactPhone] = useState(propertyToEdit?.ownerContactPhone || '');

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
      title={propertyToEdit ? `Edit ${propertyToEdit.projectName}` : 'Create Property'}
      subtitle="Enter property specifications, location, and leasing terms."
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Navigation Tabs inside Form */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'basics' ? 'bg-white dark:bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            1. Basics & Location
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'specs' ? 'bg-white dark:bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            2. Specs & Equipment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'pricing' ? 'bg-white dark:bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            3. Pricing & Terms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'terms' ? 'bg-white dark:bg-neutral-800 text-rose-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            4. Description & Notes
          </button>
        </div>

        {/* Tab 1: Basics & Location */}
        {activeTab === 'basics' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Ashton Asoke, The Crest Sukhumvit..."
                className="w-full px-3.5 py-2 rounded-lg glass-input text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e: any) => setPropertyType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg glass-input text-xs cursor-pointer dark:bg-neutral-900"
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
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Listing Deal Type
                </label>
                <select
                  value={listingType}
                  onChange={(e: any) => setListingType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg glass-input text-xs cursor-pointer dark:bg-neutral-900"
                >
                  <option value="rent">Rent Only</option>
                  <option value="sale">Sale Only</option>
                  <option value="both">Both Rent & Sale</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Location / Neighborhood
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Thong Lo, Bangkok"
                  className="w-full px-3.5 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Nearest Transit Station
                </label>
                <input
                  type="text"
                  value={nearestTransit}
                  onChange={(e) => setNearestTransit(e.target.value)}
                  placeholder="e.g. BTS Thong Lo 300m"
                  className="w-full px-3.5 py-2 rounded-lg glass-input text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Specs & Equipment */}
        {activeTab === 'specs' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs font-semibold"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs font-semibold"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Size (Sq.m.)
                </label>
                <input
                  type="number"
                  value={sizeSqm}
                  onChange={(e) => setSizeSqm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs font-semibold"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Floor
                </label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. 18"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Building
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="e.g. Tower A"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Unit Number
                </label>
                <input
                  type="text"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="e.g. 1804"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Furnished Status
              </label>
              <select
                value={furnishedStatus}
                onChange={(e: any) => setFurnishedStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg glass-input text-xs cursor-pointer dark:bg-neutral-900"
              >
                <option value="fully_furnished">Fully Furnished</option>
                <option value="partially_furnished">Partially Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Equipment & Appliances
              </label>
              <input
                type="text"
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                placeholder="Air Conditioner, Washing Machine, Smart TV, Refrigerator..."
                className="w-full px-3.5 py-2 rounded-lg glass-input text-xs"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Pricing & Terms */}
        {activeTab === 'pricing' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Monthly Rental Price (฿)
                </label>
                <input
                  type="number"
                  value={rentalPrice}
                  onChange={(e) => setRentalPrice(e.target.value)}
                  placeholder="e.g. 85000"
                  className="w-full px-3.5 py-2 rounded-lg glass-input text-xs font-semibold text-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Sale Price (฿) Optional
                </label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="e.g. 18500000"
                  className="w-full px-3.5 py-2 rounded-lg glass-input text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Contract (Months)
                </label>
                <input
                  type="number"
                  value={contractDurationMonths}
                  onChange={(e) => setContractDurationMonths(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Deposit (Months)
                </label>
                <input
                  type="number"
                  value={depositMonths}
                  onChange={(e) => setDepositMonths(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Advance (Months)
                </label>
                <input
                  type="number"
                  value={advancePaymentMonths}
                  onChange={(e) => setAdvancePaymentMonths(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600"
                />
                <span>Pets allowed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={smokingAllowed}
                  onChange={(e) => setSmokingAllowed(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600"
                />
                <span>Smoking allowed</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 4: Description & Notes */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                Property Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Marketing description..."
                className="w-full p-3 rounded-lg glass-input text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Owner Notes
                </label>
                <textarea
                  rows={2}
                  value={ownerNotes}
                  onChange={(e) => setOwnerNotes(e.target.value)}
                  placeholder="Notes from owner..."
                  className="w-full p-2.5 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Lockbox code, viewing keys..."
                  className="w-full p-2.5 rounded-lg glass-input text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-white/10 text-xs">
          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="px-3.5 py-2 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 font-medium transition-colors cursor-pointer"
          >
            Save Draft
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave('available')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary-red font-medium cursor-pointer"
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
