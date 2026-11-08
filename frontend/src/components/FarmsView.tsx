// frontend/src/components/FarmsView.tsx
import React, { useState, useMemo, useEffect } from 'react';
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
  Search,
  Filter,
  ArrowUpDown,
  Pencil,
  Eye,
  Layers,
  Sprout,
  Navigation,
  Globe,
  ShieldCheck,
  Activity,
  Maximize2,
  Info,
} from 'lucide-react';
import type { Farm, CropLot } from '../types';
import { DigitalFarmView } from './DigitalFarmView';
import { searchPlace, reverseGeocode, type GeocodingResult } from '../services/geocoding';
import { DEFAULT_DEMO_FARMS } from '../api';

interface FarmsViewProps {
  farms: Farm[];
  cropLots?: CropLot[];
  onCreateFarm: (farm: Partial<Farm>) => Promise<void>;
  onUpdateFarm?: (farmId: string, farm: Partial<Farm>) => Promise<Farm>;
  isOpenCreateModal: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
}

export const FarmsView: React.FC<FarmsViewProps> = ({
  farms,
  cropLots = [],
  onCreateFarm,
  onUpdateFarm,
  isOpenCreateModal,
  onCloseCreateModal,
  onOpenCreateModal,
}) => {
  // URL-driven query parameters
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isSearchEmpty = urlParams?.get('view') === 'empty';

  // Active Farms list
  const displayFarms = useMemo(() => {
    if (isSearchEmpty) return [];
    return farms.length > 0 ? farms : DEFAULT_DEMO_FARMS;
  }, [isSearchEmpty, farms]);

  // Selected farm for 3D exploration
  const [selectedFarmId, setSelectedFarmId] = useState<string>(displayFarms[0]?.id || '');
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [copiedCoordsId, setCopiedCoordsId] = useState<string | null>(null);

  // Active selected farm object (with fallback)
  const activeFarm = useMemo(() => {
    return displayFarms.find((f) => f.id === selectedFarmId) || displayFarms[0] || null;
  }, [displayFarms, selectedFarmId]);

  // If active farm changed or deleted, reset
  useEffect(() => {
    if (displayFarms.length > 0 && !displayFarms.some((f) => f.id === selectedFarmId)) {
      setSelectedFarmId(displayFarms[0].id);
    }
  }, [displayFarms, selectedFarmId]);

  // Active crop lot on the selected farm
  const activeCropLot = useMemo(() => {
    if (!activeFarm) return null;
    return (
      cropLots.find((lot) => lot.farm_id === activeFarm.id) ||
      cropLots.find((lot) => lot.farm_id === '1a30d9c6-3e7f-409e-8a5b-ea4a7065c4a9') ||
      cropLots[0] ||
      null
    );
  }, [cropLots, activeFarm]);

  // ─── SEARCH, FILTER & SORT STATE ───
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'area_desc' | 'area_asc' | 'name'>('recent');
  const [viewLayout, setViewLayout] = useState<'split' | 'cards'>('split');

  // Districts list for filter dropdown
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    farms.forEach((f) => {
      if (f.district) set.add(f.district);
    });
    return Array.from(set).sort();
  }, [farms]);

  // Filtered & Sorted Farms
  const filteredFarms = useMemo(() => {
    let result = [...displayFarms];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.farm_name.toLowerCase().includes(q) ||
          f.village.toLowerCase().includes(q) ||
          f.district.toLowerCase().includes(q) ||
          f.state.toLowerCase().includes(q)
      );
    }

    if (districtFilter !== 'ALL') {
      result = result.filter((f) => f.district.toLowerCase() === districtFilter.toLowerCase());
    }

    result.sort((a, b) => {
      if (sortBy === 'name') return a.farm_name.localeCompare(b.farm_name);
      if (sortBy === 'area_desc') return (b.land_area || 0) - (a.land_area || 0);
      if (sortBy === 'area_asc') return (a.land_area || 0) - (b.land_area || 0);
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });

    return result;
  }, [displayFarms, searchQuery, districtFilter, sortBy]);

  // ─── OVERVIEW KPI CALCULATIONS ───
  const kpiMetrics = useMemo(() => {
    const totalFarms = displayFarms.length;
    let totalAcres = 0;
    let totalStorageKg = 0;
    let totalResourcesCount = 0;
    let geotaggedCount = 0;

    displayFarms.forEach((f) => {
      if (f.land_area) {
        if (f.land_area_unit === 'hectare') totalAcres += f.land_area * 2.47105;
        else if (f.land_area_unit === 'guntha') totalAcres += f.land_area / 40;
        else totalAcres += f.land_area;
      }

      if (f.latitude != null && f.longitude != null) {
        geotaggedCount += 1;
      }

      if (f.resources) {
        totalResourcesCount += f.resources.length;
        f.resources.forEach((r) => {
          if (r.resource_type === 'storage' && r.quantity) {
            if (r.unit === 'MT' || r.unit === 'tonne') totalStorageKg += r.quantity * 1000;
            else if (r.unit === 'quintal') totalStorageKg += r.quantity * 100;
            else totalStorageKg += r.quantity;
          }
        });
      }
    });

    const totalHectares = (totalAcres * 0.404686).toFixed(2);
    const geotaggedPct = totalFarms > 0 ? Math.round((geotaggedCount / totalFarms) * 100) : 100;

    return {
      totalFarms,
      totalAcres: totalAcres.toFixed(1),
      totalHectares,
      totalStorageKg: totalStorageKg.toLocaleString('en-IN'),
      totalStorageMT: (totalStorageKg / 1000).toFixed(1),
      totalResourcesCount,
      geotaggedCount,
      geotaggedPct,
    };
  }, [displayFarms]);

  // ─── EDIT FARM MODAL STATE ───
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form fields
  const [editName, setEditName] = useState('');
  const [editState, setEditState] = useState('Maharashtra');
  const [editDistrict, setEditDistrict] = useState('Nashik');
  const [editVillage, setEditVillage] = useState('Niphad');
  const [editLandArea, setEditLandArea] = useState('3.5');
  const [editLandAreaUnit, setEditLandAreaUnit] = useState('acre');
  const [editLatitude, setEditLatitude] = useState('20.0768');
  const [editLongitude, setEditLongitude] = useState('74.0375');
  const [editResources, setEditResources] = useState<
    Array<{ id?: string; resource_type: string; name: string; quantity?: number; unit?: string }>
  >([]);

  // Resource input state for Edit Modal
  const [editResType, setEditResType] = useState('storage');
  const [editResName, setEditResName] = useState('');
  const [editResQty, setEditResQty] = useState('');
  const [editResUnit, setEditResUnit] = useState('');

  // Location Autocomplete state for Edit Modal
  const [editLocationQuery, setEditLocationQuery] = useState('');
  const [editLocationSuggestions, setEditLocationSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // ─── CREATE FARM MODAL STATE ───
  const [createName, setCreateName] = useState('');
  const [createState, setCreateState] = useState('Maharashtra');
  const [createDistrict, setCreateDistrict] = useState('Nashik');
  const [createVillage, setCreateVillage] = useState('Niphad');
  const [createLandArea, setCreateLandArea] = useState('3.5');
  const [createLandAreaUnit, setCreateLandAreaUnit] = useState('acre');
  const [createLatitude, setCreateLatitude] = useState('20.0768');
  const [createLongitude, setCreateLongitude] = useState('74.0375');
  const [createResources, setCreateResources] = useState<
    Array<{ resource_type: string; name: string; quantity?: number; unit?: string }>
  >([
    { resource_type: 'storage', name: 'Shaded On-farm Shed (2 MT capacity)', quantity: 2000, unit: 'kg' },
    { resource_type: 'equipment', name: 'Plastic Harvesting Crates (20 kg each)', quantity: 80, unit: 'crates' },
    { resource_type: 'labour', name: 'Family + 2 Seasonal Labourers', quantity: 3, unit: 'persons' },
  ]);
  const [createResType, setCreateResType] = useState('storage');
  const [createResName, setCreateResName] = useState('');
  const [createResQty, setCreateResQty] = useState('');
  const [createResUnit, setCreateResUnit] = useState('');
  const [createLocationQuery, setCreateLocationQuery] = useState('');
  const [createLocationSuggestions, setCreateLocationSuggestions] = useState<GeocodingResult[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  // Open Edit Modal with Prepopulated Values
  const handleOpenEditModal = (farm: Farm) => {
    setEditingFarm(farm);
    setEditName(farm.farm_name);
    setEditState(farm.state);
    setEditDistrict(farm.district);
    setEditVillage(farm.village);
    setEditLandArea(farm.land_area ? String(farm.land_area) : '3.5');
    setEditLandAreaUnit(farm.land_area_unit || 'acre');
    setEditLatitude(farm.latitude != null ? String(farm.latitude) : '20.0768');
    setEditLongitude(farm.longitude != null ? String(farm.longitude) : '74.0375');
    setEditResources(
      farm.resources?.map((r) => ({
        id: r.id,
        resource_type: r.resource_type,
        name: r.name,
        quantity: r.quantity,
        unit: r.unit,
      })) || []
    );
    setEditLocationQuery(`${farm.village}, ${farm.district}`);
    setEditLocationSuggestions([]);
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  // Handle Location Autocomplete Debounced Search
  useEffect(() => {
    if (!editLocationQuery || editLocationQuery.trim().length < 2) {
      setEditLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      const results = await searchPlace(editLocationQuery);
      setEditLocationSuggestions(results);
      setIsSearchingLocation(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [editLocationQuery]);

  useEffect(() => {
    if (!createLocationQuery || createLocationQuery.trim().length < 2) {
      setCreateLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await searchPlace(createLocationQuery);
      setCreateLocationSuggestions(results);
    }, 300);

    return () => clearTimeout(timer);
  }, [createLocationQuery]);

  // Location Suggestion Selected for Edit Form
  const handleSelectEditLocation = (loc: GeocodingResult) => {
    setEditVillage(loc.village || loc.name);
    if (loc.district) setEditDistrict(loc.district);
    if (loc.state) setEditState(loc.state);
    setEditLatitude(String(loc.lat));
    setEditLongitude(String(loc.lon));
    setEditLocationQuery(loc.display_name);
    setEditLocationSuggestions([]);
  };

  // Location Suggestion Selected for Create Form
  const handleSelectCreateLocation = (loc: GeocodingResult) => {
    setCreateVillage(loc.village || loc.name);
    if (loc.district) setCreateDistrict(loc.district);
    if (loc.state) setCreateState(loc.state);
    setCreateLatitude(String(loc.lat));
    setCreateLongitude(String(loc.lon));
    setCreateLocationQuery(loc.display_name);
    setCreateLocationSuggestions([]);
  };

  // HTML5 Device Geolocation Detection
  const handleDetectDeviceLocation = (mode: 'edit' | 'create') => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const resolved = await reverseGeocode(lat, lon);

        if (mode === 'edit') {
          setEditLatitude(lat.toFixed(6));
          setEditLongitude(lon.toFixed(6));
          setEditVillage(resolved.village);
          setEditDistrict(resolved.district);
          setEditState(resolved.state);
          setEditLocationQuery(resolved.display_name);
        } else {
          setCreateLatitude(lat.toFixed(6));
          setCreateLongitude(lon.toFixed(6));
          setCreateVillage(resolved.village);
          setCreateDistrict(resolved.district);
          setCreateState(resolved.state);
          setCreateLocationQuery(resolved.display_name);
        }
      },
      () => {
        alert('Could not determine current location. Please verify GPS permissions.');
      },
      { timeout: 8000 }
    );
  };

  // Copy GPS Coordinates with Feedback
  const handleCopyCoords = (f: Farm) => {
    if (f.latitude == null || f.longitude == null) return;
    const txt = `${f.latitude.toFixed(5)}, ${f.longitude.toFixed(5)}`;
    navigator.clipboard.writeText(txt);
    setCopiedCoordsId(f.id);
    setTimeout(() => setCopiedCoordsId(null), 2500);
  };

  // Add Resource to Edit Modal
  const handleAddEditResource = () => {
    if (!editResName.trim()) return;
    setEditResources([
      ...editResources,
      {
        id: 'res-' + Math.random().toString(36).substring(2, 8),
        resource_type: editResType,
        name: editResName.trim(),
        quantity: editResQty ? Number(editResQty) : undefined,
        unit: editResUnit.trim() || undefined,
      },
    ]);
    setEditResName('');
    setEditResQty('');
    setEditResUnit('');
  };

  const handleRemoveEditResource = (index: number) => {
    setEditResources(editResources.filter((_, i) => i !== index));
  };

  // Add Resource to Create Modal
  const handleAddCreateResource = () => {
    if (!createResName.trim()) return;
    setCreateResources([
      ...createResources,
      {
        resource_type: createResType,
        name: createResName.trim(),
        quantity: createResQty ? Number(createResQty) : undefined,
        unit: createResUnit.trim() || undefined,
      },
    ]);
    setCreateResName('');
    setCreateResQty('');
    setCreateResUnit('');
  };

  const handleRemoveCreateResource = (index: number) => {
    setCreateResources(createResources.filter((_, i) => i !== index));
  };

  // Submit Edit Form
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarm) return;
    setEditFormError(null);

    if (!editName.trim()) {
      setEditFormError('Please enter a valid farm name.');
      return;
    }
    const numArea = parseFloat(editLandArea);
    if (isNaN(numArea) || numArea <= 0) {
      setEditFormError('Land area must be a positive number.');
      return;
    }
    const lat = parseFloat(editLatitude);
    const lon = parseFloat(editLongitude);
    if (!isNaN(lat) && (lat < -90 || lat > 90)) {
      setEditFormError('Latitude must be between -90 and +90.');
      return;
    }
    if (!isNaN(lon) && (lon < -180 || lon > 180)) {
      setEditFormError('Longitude must be between -180 and +180.');
      return;
    }

    setEditLoading(true);
    try {
      if (onUpdateFarm) {
        await onUpdateFarm(editingFarm.id, {
          farm_name: editName.trim(),
          state: editState.trim(),
          district: editDistrict.trim(),
          village: editVillage.trim(),
          land_area: numArea,
          land_area_unit: editLandAreaUnit,
          latitude: !isNaN(lat) ? lat : undefined,
          longitude: !isNaN(lon) ? lon : undefined,
          resources: editResources.map((r) => ({
            resource_type: r.resource_type,
            name: r.name,
            quantity: r.quantity,
            unit: r.unit,
            availability_status: 'available',
          })),
        });
      }
      setIsEditModalOpen(false);
      setEditingFarm(null);
    } catch (err: any) {
      setEditFormError(err.message || 'Failed to update farm holding.');
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Create Form
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);

    if (!createName.trim()) {
      setCreateFormError('Please enter a valid farm name.');
      return;
    }
    const numArea = parseFloat(createLandArea);
    if (isNaN(numArea) || numArea <= 0) {
      setCreateFormError('Cultivated land area must be a positive number greater than 0.');
      return;
    }
    const lat = parseFloat(createLatitude);
    const lon = parseFloat(createLongitude);

    setCreateLoading(true);
    try {
      await onCreateFarm({
        farm_name: createName.trim(),
        state: createState.trim(),
        district: createDistrict.trim(),
        village: createVillage.trim(),
        land_area: numArea,
        land_area_unit: createLandAreaUnit,
        latitude: !isNaN(lat) ? lat : undefined,
        longitude: !isNaN(lon) ? lon : undefined,
        resources: createResources.map((r) => ({
          ...r,
          id: 'res-' + Math.random().toString(36).substring(2, 7),
          availability_status: 'available',
        })),
      });

      onCloseCreateModal();
      setCreateName('');
    } catch (err: any) {
      setCreateFormError(err.message || 'Failed to register farm holding.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Save 3D boundary directly from DigitalFarmView
  const handleSaveBoundaryFromTwin = async (geojsonStr: string) => {
    if (!activeFarm || !onUpdateFarm) return;
    await onUpdateFarm(activeFarm.id, {
      boundary_geojson: geojsonStr,
    });
  };

  // Resource Icon Resolver
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

  // Land Area Breakdown Formatter
  const formatAreaBreakdown = (area?: number, unit = 'acre') => {
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
          SECTION 1 — HEADER & PRIMARY ACTION
          ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
              <Home className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                  Farms & Land Holdings 2.0
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Location-Aware 3D Twin
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Intelligent farm management, location-specific 3D geospatial exploration, and boundary mapping.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenCreateModal}
            className="btn-primary flex items-center gap-2 shadow-xs cursor-pointer text-xs sm:text-sm py-2 sm:py-2.5 px-3.5 sm:px-4"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Farm</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION 2 — OVERVIEW METRICS RIBBON (5 KEY PERFORMANCE METRICS)
          ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Total Holdings */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Total Holdings</span>
            <Home className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-display">
            {kpiMetrics.totalFarms}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active agricultural parcels</span>
          </div>
        </div>

        {/* Metric 2: Cultivated Land Area */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Total Land Holdings</span>
            <Compass className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-display font-mono">
            {kpiMetrics.totalAcres} <span className="text-sm font-bold text-slate-500">Acres</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Equivalent to {kpiMetrics.totalHectares} Hectares
          </div>
        </div>

        {/* Metric 3: On-Farm Resources */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>On-Farm Resources</span>
            <Wrench className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-display">
            {kpiMetrics.totalResourcesCount} <span className="text-sm font-bold text-slate-500">Assets</span>
          </div>
          <div className="text-[11px] text-sky-600 font-medium mt-1">
            Storage, equipment & workforce
          </div>
        </div>

        {/* Metric 4: Verified Storage Capacity */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Storage Capacity</span>
            <Warehouse className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-display font-mono">
            {kpiMetrics.totalStorageKg} <span className="text-sm font-bold text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            {kpiMetrics.totalStorageMT} MT on-farm buffer sheds
          </div>
        </div>

        {/* Metric 5: GPS Coordinates Verification */}
        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>GPS Geotagging</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-display">
            {kpiMetrics.geotaggedPct}%
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{kpiMetrics.geotaggedCount}/{kpiMetrics.totalFarms} Holdings geotagged</span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION 3 — THE MAIN USP: INTERACTIVE 3D FARM EXPLORER & TWIN
          ────────────────────────────────────────────────────────── */}
      {activeFarm && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Active 3D Farm:
              </span>
              {displayFarms.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFarmId(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    f.id === activeFarm.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{f.farm_name}</span>
                  <span className="text-[10px] opacity-80">({f.land_area} {f.land_area_unit})</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleOpenEditModal(activeFarm)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                <span>Edit Farm Details</span>
              </button>
            </div>
          </div>

          {/* 3D Farm Twin + Contextual Intelligence Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 3D Canvas Column */}
            <div className="lg:col-span-8">
              <DigitalFarmView
                farm={activeFarm}
                cropLots={cropLots}
                selectedResourceId={selectedResourceId}
                onSelectResource={setSelectedResourceId}
                onSaveBoundary={handleSaveBoundaryFromTwin}
                onOpenEditModal={() => handleOpenEditModal(activeFarm)}
              />
            </div>

            {/* Farm Land Analytics Side Panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                {/* Identity & Verification */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                      Geospatial Holding Profile
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {activeFarm.farm_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeFarm.village}, {activeFarm.district}, {activeFarm.state}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ACTIVE</span>
                  </span>
                </div>

                {/* Land Area Comparison */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Land Survey Breakdown</span>
                    <span className="text-emerald-700 font-mono">
                      {activeFarm.land_area} {activeFarm.land_area_unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full w-full" />
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {formatAreaBreakdown(activeFarm.land_area, activeFarm.land_area_unit)}
                  </div>
                </div>

                {/* Geolocation & Coordinates */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>GPS Coordinates</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCoords(activeFarm)}
                      className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCoordsId === activeFarm.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono font-bold text-slate-800 text-xs">
                    {activeFarm.latitude != null && activeFarm.longitude != null
                      ? `${activeFarm.latitude.toFixed(5)}°N, ${activeFarm.longitude.toFixed(5)}°E`
                      : 'Coordinates pending verification'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Terrain Elevation: ~568m ASL • Maharashtra Deccan Plateau
                  </div>
                </div>

                {/* Associated Resources Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Associated On-Farm Resources</span>
                    <span className="text-slate-400 font-mono">
                      {activeFarm.resources?.length || 0} Registered
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {activeFarm.resources && activeFarm.resources.length > 0 ? (
                      activeFarm.resources.map((res) => (
                        <div
                          key={res.id}
                          onClick={() => setSelectedResourceId(res.id)}
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                            selectedResourceId === res.id
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {getResourceIcon(res.resource_type)}
                            <span className="font-semibold truncate">{res.name}</span>
                          </div>
                          {res.quantity && (
                            <span className="font-mono font-bold text-emerald-700 shrink-0 text-[11px]">
                              {res.quantity.toLocaleString('en-IN')} {res.unit}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic p-2 text-center">
                        No resources added yet. Click Edit Details to register sheds or crates.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(activeFarm)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Farm Coordinates & Resources</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          SECTION 4 — SEARCH, FILTERS & FARM HOLDINGS DIRECTORY
          ────────────────────────────────────────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight font-display">
              Registered Agricultural Land Holdings
            </h2>
            <p className="text-xs text-slate-500">
              Listing all verified land parcels, soil units, and equipment profiles.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search farm, village, district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 shadow-xs w-48 sm:w-56"
              />
            </div>

            {/* District Filter Dropdown */}
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500 shadow-xs cursor-pointer"
            >
              <option value="ALL">All Districts</option>
              {districtOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500 shadow-xs cursor-pointer"
            >
              <option value="recent">Recent</option>
              <option value="area_desc">Area: High to Low</option>
              <option value="area_asc">Area: Low to High</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Farm Cards Grid */}
        {filteredFarms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFarms.map((farm) => {
              const isSelected = farm.id === activeFarm?.id;
              const hasBoundary = !!farm.boundary_geojson;

              return (
                <div
                  key={farm.id}
                  className={`rounded-3xl p-5 bg-white border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                            {farm.farm_name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {farm.village}, {farm.district}, {farm.state}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0">
                        ACTIVE HOLDING
                      </span>
                    </div>

                    {/* Area & GPS Chips */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Land Area
                        </span>
                        <span className="font-extrabold text-slate-900 font-mono text-sm">
                          {farm.land_area} {farm.land_area_unit}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          GPS Coordinates
                        </span>
                        <div className="flex items-center justify-between gap-1 font-mono text-xs text-slate-800 font-bold mt-0.5">
                          <span className="truncate">
                            {farm.latitude != null && farm.longitude != null
                              ? `${farm.latitude.toFixed(3)}, ${farm.longitude.toFixed(3)}`
                              : 'Pending GPS'}
                          </span>
                          {farm.latitude != null && (
                            <button
                              type="button"
                              onClick={() => handleCopyCoords(farm)}
                              className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                              title="Copy Coordinates"
                            >
                              {copiedCoordsId === farm.id ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Associated Farm Resources Chips */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                        <span className="uppercase tracking-wider text-[10px] font-bold">
                          Associated Farm Resources
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {farm.resources?.length || 0} Registered
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {farm.resources && farm.resources.length > 0 ? (
                          farm.resources.slice(0, 3).map((res) => (
                            <div
                              key={res.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                {getResourceIcon(res.resource_type)}
                                <span className="font-medium text-slate-800 truncate">
                                  {res.name}
                                </span>
                              </div>
                              {res.quantity && (
                                <span className="text-emerald-700 font-mono font-bold text-[11px] shrink-0">
                                  {res.quantity.toLocaleString('en-IN')} {res.unit}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-400 italic p-1.5">
                            No storage or equipment recorded yet.
                          </div>
                        )}
                        {farm.resources && farm.resources.length > 3 && (
                          <div className="text-[11px] text-emerald-700 font-bold text-right pt-0.5">
                            +{farm.resources.length - 3} more resources...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Boundary Status Indicator */}
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                      <span className="text-slate-500 font-medium">3D Boundary Geometry</span>
                      {hasBoundary ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Survey Boundary Mapped</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Boundary Unmapped</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFarmId(farm.id);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Explore 3D Farm</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(farm)}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit Farm Details"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No matching farm holdings found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or district filter, or register a new farm profile.
            </p>
            <button onClick={onOpenCreateModal} className="btn-primary text-xs mx-auto">
              Register New Farm Holding
            </button>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION 5 — MANDATORY EDIT AND UPDATE FARM DETAILS MODAL
          ────────────────────────────────────────────────────────── */}
      {isEditModalOpen && editingFarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
                    Edit Farm Profile & Land Holdings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update farm information, geolocation pin, and registered resources.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              {/* Farm Name */}
              <div>
                <label className="label">Farm Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Patil Krishi Farm"
                />
              </div>

              {/* Intelligent Location Autocomplete */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Search Place / Village (Auto-Fills GPS)</label>
                  <button
                    type="button"
                    onClick={() => handleDetectDeviceLocation('edit')}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Use My Location</span>
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={editLocationQuery}
                    onChange={(e) => setEditLocationQuery(e.target.value)}
                    placeholder="Search village, taluka, APMC center..."
                    className="input-field pl-9 pr-3"
                  />
                  {isSearchingLocation && (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {editLocationSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 max-h-48 overflow-y-auto">
                    {editLocationSuggestions.map((loc, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectEditLocation(loc)}
                        className="p-2.5 hover:bg-emerald-50 border-b border-slate-100 last:border-b-0 cursor-pointer text-xs"
                      >
                        <div className="font-bold text-slate-900">{loc.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{loc.display_name}</div>
                        <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                          {loc.lat.toFixed(4)}°N, {loc.lon.toFixed(4)}°E
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* State / District / Village Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">State *</label>
                  <input
                    type="text"
                    required
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">District *</label>
                  <input
                    type="text"
                    required
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Village *</label>
                  <input
                    type="text"
                    required
                    value={editVillage}
                    onChange={(e) => setEditVillage(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Land Area and Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Land Area *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={editLandArea}
                    onChange={(e) => setEditLandArea(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select
                    value={editLandAreaUnit}
                    onChange={(e) => setEditLandAreaUnit(e.target.value)}
                    className="input-field cursor-pointer"
                  >
                    <option value="acre">Acres</option>
                    <option value="hectare">Hectares</option>
                    <option value="guntha">Guntha</option>
                    <option value="bigha">Bigha</option>
                    <option value="sq_meter">Sq. Meters</option>
                  </select>
                </div>
              </div>

              {/* Exact Geolocation Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Latitude (-90 to +90)</label>
                  <input
                    type="text"
                    value={editLatitude}
                    onChange={(e) => setEditLatitude(e.target.value)}
                    className="input-field font-mono"
                    placeholder="20.0768"
                  />
                </div>
                <div>
                  <label className="label">Longitude (-180 to +180)</label>
                  <input
                    type="text"
                    value={editLongitude}
                    onChange={(e) => setEditLongitude(e.target.value)}
                    className="input-field font-mono"
                    placeholder="74.0375"
                  />
                </div>
              </div>

              {/* Resource Manager */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">On-Farm Resources (Storage / Equipment / Labour)</label>
                  <span className="text-[11px] text-slate-400 font-mono font-bold">
                    {editResources.length} Assets
                  </span>
                </div>

                <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                  {editResources.map((res, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {getResourceIcon(res.resource_type)}
                        <span className="font-semibold text-slate-800 truncate">{res.name}</span>
                        <span className="text-slate-400 capitalize">({res.resource_type})</span>
                        {res.quantity && (
                          <span className="text-emerald-700 font-mono font-bold">
                            ({res.quantity} {res.unit})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEditResource(i)}
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
                    value={editResType}
                    onChange={(e) => setEditResType(e.target.value)}
                    className="input-field text-xs sm:col-span-3 cursor-pointer"
                  >
                    <option value="storage">Storage</option>
                    <option value="equipment">Equipment</option>
                    <option value="labour">Labour</option>
                    <option value="irrigation">Irrigation</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Resource name"
                    value={editResName}
                    onChange={(e) => setEditResName(e.target.value)}
                    className="input-field text-xs sm:col-span-4"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={editResQty}
                    onChange={(e) => setEditResQty(e.target.value)}
                    className="input-field text-xs sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={editResUnit}
                    onChange={(e) => setEditResUnit(e.target.value)}
                    className="input-field text-xs sm:col-span-2"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditResource}
                    className="btn-secondary text-xs py-2 px-3 sm:col-span-1 flex items-center justify-center font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {editFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editFormError}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="btn-primary text-xs flex items-center gap-2 cursor-pointer"
                >
                  {editLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Farm Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          SECTION 6 — CREATE NEW FARM HOLDING MODAL
          ────────────────────────────────────────────────────────── */}
      {isOpenCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Home className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
                    Register New Farm Holding
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add a new agricultural plot to your verified profile.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseCreateModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div>
                <label className="label">Farm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahyadri Organic Block 2"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Location Autocomplete */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Search Place / Village (Auto-Fills GPS)</label>
                  <button
                    type="button"
                    onClick={() => handleDetectDeviceLocation('create')}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Use My Location</span>
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={createLocationQuery}
                    onChange={(e) => setCreateLocationQuery(e.target.value)}
                    placeholder="Search village, taluka, APMC center..."
                    className="input-field pl-9 pr-3"
                  />
                </div>

                {createLocationSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 max-h-48 overflow-y-auto">
                    {createLocationSuggestions.map((loc, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectCreateLocation(loc)}
                        className="p-2.5 hover:bg-emerald-50 border-b border-slate-100 last:border-b-0 cursor-pointer text-xs"
                      >
                        <div className="font-bold text-slate-900">{loc.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{loc.display_name}</div>
                        <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                          {loc.lat.toFixed(4)}°N, {loc.lon.toFixed(4)}°E
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* State, District, Village */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">State *</label>
                  <input
                    type="text"
                    required
                    value={createState}
                    onChange={(e) => setCreateState(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">District *</label>
                  <input
                    type="text"
                    required
                    value={createDistrict}
                    onChange={(e) => setCreateDistrict(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Village *</label>
                  <input
                    type="text"
                    required
                    value={createVillage}
                    onChange={(e) => setCreateVillage(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Area & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Land Area *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={createLandArea}
                    onChange={(e) => setCreateLandArea(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select
                    value={createLandAreaUnit}
                    onChange={(e) => setCreateLandAreaUnit(e.target.value)}
                    className="input-field cursor-pointer"
                  >
                    <option value="acre">Acres</option>
                    <option value="hectare">Hectares</option>
                    <option value="guntha">Guntha</option>
                    <option value="bigha">Bigha</option>
                    <option value="sq_meter">Sq. Meters</option>
                  </select>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Latitude (-90 to +90)</label>
                  <input
                    type="text"
                    value={createLatitude}
                    onChange={(e) => setCreateLatitude(e.target.value)}
                    className="input-field font-mono"
                    placeholder="20.0768"
                  />
                </div>
                <div>
                  <label className="label">Longitude (-180 to +180)</label>
                  <input
                    type="text"
                    value={createLongitude}
                    onChange={(e) => setCreateLongitude(e.target.value)}
                    className="input-field font-mono"
                    placeholder="74.0375"
                  />
                </div>
              </div>

              {/* Resources */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">On-Farm Resources</label>
                  <span className="text-[11px] text-slate-400 font-mono font-bold">
                    {createResources.length} items
                  </span>
                </div>

                <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                  {createResources.map((res, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {getResourceIcon(res.resource_type)}
                        <span className="font-semibold text-slate-800 truncate">{res.name}</span>
                        {res.quantity && (
                          <span className="text-emerald-700 font-mono font-bold">
                            ({res.quantity} {res.unit})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCreateResource(i)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer font-bold px-2 py-0.5 rounded hover:bg-rose-50"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <select
                    value={createResType}
                    onChange={(e) => setCreateResType(e.target.value)}
                    className="input-field text-xs sm:col-span-3 cursor-pointer"
                  >
                    <option value="storage">Storage</option>
                    <option value="equipment">Equipment</option>
                    <option value="labour">Labour</option>
                    <option value="irrigation">Irrigation</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Resource name"
                    value={createResName}
                    onChange={(e) => setCreateResName(e.target.value)}
                    className="input-field text-xs sm:col-span-4"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={createResQty}
                    onChange={(e) => setCreateResQty(e.target.value)}
                    className="input-field text-xs sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={createResUnit}
                    onChange={(e) => setCreateResUnit(e.target.value)}
                    className="input-field text-xs sm:col-span-2"
                  />
                  <button
                    type="button"
                    onClick={handleAddCreateResource}
                    className="btn-secondary text-xs py-2 px-3 sm:col-span-1 flex items-center justify-center font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {createFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createFormError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary text-xs flex items-center gap-2 cursor-pointer"
                >
                  {createLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register Farm Holding</span>
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
