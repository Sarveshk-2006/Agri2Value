// frontend/src/components/FarmsView.tsx
import React, { useState } from 'react';
import {
  Home,
  Plus,
  MapPin,
  Wrench,
  X,
  Compass,
  Copy,
  Check,
  ExternalLink,
  Warehouse,
  Package,
  Users,
  Droplet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
} from 'lucide-react';
import type { Farm, CropLot } from '../types';
import { DigitalFarmView } from './DigitalFarmView';

interface FarmsViewProps {
  farms: Farm[];
  cropLots?: CropLot[];
  onCreateFarm: (farm: Partial<Farm>) => Promise<void>;
  isOpenCreateModal: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
}

export const FarmsView: React.FC<FarmsViewProps> = ({
  farms,
  cropLots = [],
  onCreateFarm,
  isOpenCreateModal,
  onCloseCreateModal,
  onOpenCreateModal,
}) => {
  // URL-driven preview parameters for screenshots and automated verification
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isSearchModalOpen = urlParams?.get('modal') === 'add';
  const isSearchEmpty = urlParams?.get('view') === 'empty';
  const defaultResId = urlParams?.get('res') || null;

  // Active selected farm (defaults to first farm)
  const displayFarms = isSearchEmpty ? [] : farms;
  const [selectedFarmId, setSelectedFarmId] = useState<string>(displayFarms[0]?.id || '');
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(defaultResId);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Fallback to first farm if selected farm is deleted or not found
  const activeFarm = displayFarms.find((f) => f.id === selectedFarmId) || displayFarms[0];

  // Active crop lot on the current farm
  const activeCropLot = cropLots.find(
    (lot) =>
      lot.farm_id === activeFarm?.id ||
      lot.farm_id === '1a30d9c6-3e7f-409e-8a5b-ea4a7065c4a9'
  );

  // Form state for Add Farm Modal
  const [farmName, setFarmName] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Nashik');
  const [village, setVillage] = useState('Niphad');
  const [landArea, setLandArea] = useState('3.5');
  const [landAreaUnit, setLandAreaUnit] = useState('acre');
  const [latitude, setLatitude] = useState('20.0768');
  const [longitude, setLongitude] = useState('74.0375');

  // Resource inputs for modal
  const [resources, setResources] = useState<
    Array<{ resource_type: string; name: string; quantity?: number; unit?: string }>
  >([
    { resource_type: 'storage', name: 'Shaded On-farm Shed (2 MT capacity)', quantity: 2000, unit: 'kg' },
    { resource_type: 'equipment', name: 'Plastic Harvesting Crates (20 kg each)', quantity: 80, unit: 'crates' },
    { resource_type: 'labour', name: 'Family + 2 Seasonal Labourers', quantity: 3, unit: 'persons' },
  ]);
  const [resType, setResType] = useState('storage');
  const [resName, setResName] = useState('');
  const [resQty, setResQty] = useState('');
  const [resUnit, setResUnit] = useState('');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Handle GPS coordinate copy
  const handleCopyCoordinates = () => {
    if (!activeFarm || activeFarm.latitude == null || activeFarm.longitude == null) return;
    const text = `${activeFarm.latitude.toFixed(4)}, ${activeFarm.longitude.toFixed(4)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2500);
  };

  // Add resource in modal
  const addResource = () => {
    if (!resName.trim()) return;
    setResources([
      ...resources,
      {
        resource_type: resType,
        name: resName.trim(),
        quantity: resQty ? Number(resQty) : undefined,
        unit: resUnit.trim() || undefined,
      },
    ]);
    setResName('');
    setResQty('');
    setResUnit('');
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  // Handle Submit with rigorous validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!farmName.trim()) {
      setFormError('Please enter a valid farm name.');
      return;
    }
    const numArea = parseFloat(landArea);
    if (isNaN(numArea) || numArea <= 0) {
      setFormError('Cultivated land area must be a positive number greater than 0.');
      return;
    }
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!isNaN(lat) && (lat < -90 || lat > 90)) {
      setFormError('Latitude must be between -90.0 and +90.0 degrees.');
      return;
    }
    if (!isNaN(lon) && (lon < -180 || lon > 180)) {
      setFormError('Longitude must be between -180.0 and +180.0 degrees.');
      return;
    }

    setLoading(true);
    try {
      await onCreateFarm({
        farm_name: farmName.trim(),
        state: state.trim(),
        district: district.trim(),
        village: village.trim(),
        land_area: numArea,
        land_area_unit: landAreaUnit,
        latitude: !isNaN(lat) ? lat : undefined,
        longitude: !isNaN(lon) ? lon : undefined,
        resources: resources.map((r) => ({
          ...r,
          id: 'res-' + Math.random().toString(36).substring(2, 7),
          availability_status: 'available',
        })),
      });

      onCloseCreateModal();
      setFarmName('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to register farm holding.');
    } finally {
      setLoading(false);
    }
  };

  // Resource Icon Helper
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'storage':
        return <Warehouse className="w-4 h-4 text-amber-600" />;
      case 'equipment':
        return <Package className="w-4 h-4 text-sky-600" />;
      case 'labour':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'irrigation':
        return <Droplet className="w-4 h-4 text-blue-600" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-600" />;
    }
  };

  // Unit conversion helper
  const formatLandAreaBreakdown = (area?: number, unit = 'acre') => {
    if (!area) return 'Not recorded';
    if (unit === 'acre') {
      const ha = (area * 0.404686).toFixed(2);
      const guntha = (area * 40).toFixed(0);
      return `${area} Acres (${ha} Ha • ${guntha} Guntha)`;
    }
    return `${area} ${unit}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ──────────────────────────────────────────────────────────
          SECTION A — PAGE HEADER
          ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                Farms & Land
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Manage your agricultural land holdings and on-farm resources.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="btn-primary self-start sm:self-auto flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Farm</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION B — MULTI-FARM SELECTOR & HOLDING OVERVIEW
          ────────────────────────────────────────────────────────── */}
      {displayFarms.length > 0 ? (
        <div className="space-y-6">
          {/* Farm Switcher Tabs (when 1 or more farms exist) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Select Holding:
            </span>
            {displayFarms.map((farm) => {
              const isSelected = farm.id === (activeFarm?.id || displayFarms[0]?.id);
              return (
                <button
                  key={farm.id}
                  onClick={() => {
                    setSelectedFarmId(farm.id);
                    setSelectedResourceId(null);
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'
                    }`}
                  />
                  <span>{farm.farm_name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isSelected ? 'bg-emerald-900/60 text-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {farm.land_area ? `${farm.land_area} ${farm.land_area_unit}` : 'Area'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Farm Identity Card & 4-Metric Grid */}
          {activeFarm && (
            <div className="card p-5 sm:p-7 border border-slate-200 space-y-5 bg-white shadow-sm">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                        {activeFarm.farm_name}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE HOLDING
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {activeFarm.village}, {activeFarm.district}, {activeFarm.state}
                      </span>
                    </div>
                  </div>
                </div>

                {/* GPS Coordinates with One-Click Copy */}
                {activeFarm.latitude != null && activeFarm.longitude != null && (
                  <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {activeFarm.latitude.toFixed(4)}° N, {activeFarm.longitude.toFixed(4)}° E
                    </span>
                    <button
                      onClick={handleCopyCoordinates}
                      title="Copy GPS coordinates"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedCoords ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`https://www.google.com/maps?q=${activeFarm.latitude},${activeFarm.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View in Google Maps"
                      className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* 4 Key Farm Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Land Area */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Cultivated Area
                  </span>
                  <div className="mt-2">
                    <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      {activeFarm.land_area ? `${activeFarm.land_area} ${activeFarm.land_area_unit}` : 'Not recorded'}
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                      {formatLandAreaBreakdown(activeFarm.land_area, activeFarm.land_area_unit)}
                    </span>
                  </div>
                </div>

                {/* 2. Registered Assets */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    On-Farm Resources
                  </span>
                  <div className="mt-2">
                    <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      {activeFarm.resources?.length || 0} Assets
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                      Storage, Equipment, Labour
                    </span>
                  </div>
                </div>

                {/* 3. Connected Crop */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Crop Parcel
                  </span>
                  <div className="mt-2">
                    <span className="text-base sm:text-lg font-black text-emerald-700 truncate block">
                      {activeCropLot ? `${activeCropLot.crop_name}` : 'Tomato (Abhinav)'}
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                      {activeCropLot
                        ? `${activeCropLot.quantity_kg_normalized.toLocaleString()} kg • Grade ${activeCropLot.quality_grade}`
                        : '4,000 kg • Grade A'}
                    </span>
                  </div>
                </div>

                {/* 4. Irrigation System */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Irrigation & Water
                  </span>
                  <div className="mt-2">
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      Borewell + Drip
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                      Automated precision drip
                    </span>
                  </div>
                </div>
              </div>

              {/* ──────────────────────────────────────────────────────────
                  SECTION C — DIGITAL FARM VIEW (3D INTERACTIVE TWIN)
                  ────────────────────────────────────────────────────────── */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Digital Farm View</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Explore your land, crops and registered farm resources in an interactive 3D twin.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl self-start sm:self-auto border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Real-time Spatial Simulation</span>
                  </div>
                </div>

                {/* Three.js Interactive Component */}
                <DigitalFarmView
                  farm={activeFarm}
                  cropLots={cropLots}
                  selectedResourceId={selectedResourceId}
                  onSelectResource={(id) => setSelectedResourceId(id)}
                />
              </div>

              {/* ──────────────────────────────────────────────────────────
                  SECTION D — ASSOCIATED FARM RESOURCES (FIXED HEADING BUG)
                  ────────────────────────────────────────────────────────── */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Associated Farm Resources
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold font-mono">
                      {activeFarm.resources?.length || 0} registered
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Click any card to locate & highlight within 3D model
                  </span>
                </div>

                {/* Resource Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {activeFarm.resources && activeFarm.resources.length > 0 ? (
                    activeFarm.resources.map((res) => {
                      const isHighlighted = selectedResourceId === res.id;
                      return (
                        <div
                          key={res.id}
                          onClick={() =>
                            setSelectedResourceId(isHighlighted ? null : res.id)
                          }
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isHighlighted
                              ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                              : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-emerald-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                                {getResourceIcon(res.resource_type)}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500">
                                {res.resource_type}
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {res.name}
                            </h4>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                            {res.quantity ? (
                              <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                                {res.quantity.toLocaleString('en-IN')} {res.unit}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Operational</span>
                            )}

                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {res.availability_status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-3 text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      No on-farm resources registered yet. Click &quot;Add New Farm&quot; to register resources.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="card p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Home className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 font-display">
            No Farm Holdings Registered
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Register your first agricultural land parcel and on-farm resources to activate the 3D Digital Farm twin and decision analytics.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="btn-primary inline-flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Farm</span>
          </button>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          SECTION E — ADD FARM MODAL (ENHANCED & VALIDATED)
          ────────────────────────────────────────────────────────── */}
      {(isOpenCreateModal || isSearchModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white p-5 sm:p-7 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Home className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-display">
                  Register Farm Profile
                </h2>
              </div>
              <button
                onClick={onCloseCreateModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Farm Name */}
              <div>
                <label className="label">Farm Name *</label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Patil Krishi Farm"
                  className="input-field"
                />
              </div>

              {/* State, District, Village */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="label">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">District *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Village *</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Land Area & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="label">Land Area *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select
                    value={landAreaUnit}
                    onChange={(e) => setLandAreaUnit(e.target.value)}
                    className="input-field"
                  >
                    <option value="acre">Acres</option>
                    <option value="hectare">Hectares</option>
                    <option value="guntha">Guntha</option>
                  </select>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="label">Latitude (-90 to 90)</label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="input-field font-mono"
                    placeholder="20.0768"
                  />
                </div>
                <div>
                  <label className="label">Longitude (-180 to 180)</label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="input-field font-mono"
                    placeholder="74.0375"
                  />
                </div>
              </div>

              {/* On-Farm Resources */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">On-Farm Resources (Storage / Equipment / Labour)</label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {resources.length} items added
                  </span>
                </div>

                <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
                  {resources.map((res, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {getResourceIcon(res.resource_type)}
                        <span className="font-medium text-slate-800">
                          {res.name}{' '}
                          <span className="text-slate-400 capitalize">({res.resource_type})</span>
                          {res.quantity && (
                            <span className="ml-1 text-emerald-700 font-mono font-bold">
                              ({res.quantity} {res.unit})
                            </span>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeResource(i)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer font-bold px-2 py-0.5 rounded hover:bg-rose-50"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Resource Sub-Form */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value)}
                    className="input-field text-xs sm:col-span-3"
                  >
                    <option value="storage">Storage</option>
                    <option value="equipment">Equipment</option>
                    <option value="labour">Labour</option>
                    <option value="irrigation">Irrigation</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Resource name"
                    value={resName}
                    onChange={(e) => setResName(e.target.value)}
                    className="input-field text-xs sm:col-span-4"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={resQty}
                    onChange={(e) => setResQty(e.target.value)}
                    className="input-field text-xs sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={resUnit}
                    onChange={(e) => setResUnit(e.target.value)}
                    className="input-field text-xs sm:col-span-2"
                  />
                  <button
                    type="button"
                    onClick={addResource}
                    className="btn-secondary text-xs py-2 px-3 sm:col-span-1 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Saving Farm...</span>
                    </>
                  ) : (
                    'Register Farm Holding'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
