// frontend/src/components/InfrastructureView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Truck,
  Warehouse,
  Factory,
  CheckCircle2,
  MapPin,
  X,
  ArrowRight,
  Calculator,
  Search,
  Phone,
  Snowflake
} from 'lucide-react';
import type { LogisticsProvider, ColdStorageFacility, ProcessingFacility, CropLot } from '../types';
import { api } from '../api';
import { ColdStorageMap } from './ColdStorageMap';

interface InfrastructureViewProps {
  cropLots: CropLot[];
  onNavigateToExecution?: () => void;
}

type InfraCategory = 'cold-storage' | 'transport' | 'processing' | 'calculators';
type ColdCommodityFilter = 'ALL' | 'FRUITS' | 'VEGETABLES' | 'DAIRY';

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  cropLots,
  onNavigateToExecution,
}) => {
  const { t, i18n } = useTranslation();

  // Active Section Category: Defaults to Cold Storage as prioritized by farmer
  const [activeCategory, setActiveCategory] = useState<InfraCategory>('cold-storage');

  // Raw data from API
  const [logistics, setLogistics] = useState<LogisticsProvider[]>([]);
  const [coldStorage, setColdStorage] = useState<ColdStorageFacility[]>([]);
  const [processing, setProcessing] = useState<ProcessingFacility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Cold Storage Split View Search & Commodity Filter
  const [coldSearchQuery, setColdSearchQuery] = useState<string>('');
  const [coldCommodityFilter, setColdCommodityFilter] = useState<ColdCommodityFilter>('ALL');
  const [selectedColdFacility, setSelectedColdFacility] = useState<ColdStorageFacility | null>(null);

  // Transport & Processing Search / Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('RECOMMENDED');

  // Slide-over Facility Details Drawer
  const [drawerEntity, setDrawerEntity] = useState<{
    category: 'transport' | 'cold-storage' | 'processing';
    data: LogisticsProvider | ColdStorageFacility | ProcessingFacility;
  } | null>(null);

  // Dedicated Calculators State
  const [transportCalcEntity, setTransportCalcEntity] = useState<LogisticsProvider | null>(null);
  const [storageCalcEntity, setStorageCalcEntity] = useState<ColdStorageFacility | null>(null);

  // Transport Calculator Form State
  const [transportCalcForm, setTransportCalcForm] = useState({
    pickup: 'Patil Krishi Farm, Niphad',
    destination: 'Pimpalgaon Baswant APMC (18 km)',
    crop: 'Tomato',
    quantityKg: 4000,
    distanceKm: 18,
    isTempControlled: false,
  });

  // Storage Calculator Form State
  const [storageCalcForm, setStorageCalcForm] = useState({
    crop: 'Tomato',
    quantityKg: 4000,
    durationDays: 14,
  });

  // 5-Step Unified Booking Modal State
  const [bookingEntity, setBookingEntity] = useState<{
    type: 'LOGISTICS' | 'COLD_STORAGE' | 'PROCESSING';
    id: string;
    name: string;
    unitPrice: number;
    capacityAvailable: number;
    baseLocation: string;
    pricingUnit: string;
    specs: string;
  } | null>(null);

  const [bookingStep, setBookingStep] = useState<number>(1);
  const [bookingCropLotId, setBookingCropLotId] = useState<string>(cropLots[0]?.id || '');
  const [bookingQtyKg, setBookingQtyKg] = useState<number>(4000);
  const [bookingScheduledDate, setBookingScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [bookingPickupLocation, setBookingPickupLocation] = useState<string>('Patil Krishi Farm, Gate 2, Niphad');
  const [bookingDeliveryLocation, setBookingDeliveryLocation] = useState<string>('Pimpalgaon APMC Yard / Offtake Terminal');
  const [bookingDurationDays, setBookingDurationDays] = useState<number>(14);
  const [bookingProcessingSpec, setBookingProcessingSpec] = useState<string>('Standard Puree Pulping (28 Brix)');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingAgreementChecked, setBookingAgreementChecked] = useState<boolean>(false);
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false);
  const [bookingConfirmedRef, setBookingConfirmedRef] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Comparison Matrix State
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Load infrastructure data
  const loadInfrastructure = async () => {
    setLoading(true);
    try {
      const [fetchedLog, fetchedCold, fetchedProc] = await Promise.all([
        api.getLogisticsProviders(),
        api.getColdStorageFacilities(),
        api.getProcessingFacilities(),
      ]);
      setLogistics(fetchedLog);
      setColdStorage(fetchedCold);
      setProcessing(fetchedProc);
      if (fetchedCold.length > 0 && !selectedColdFacility) {
        setSelectedColdFacility(fetchedCold[0]);
      }
    } catch (err) {
      console.error('Failed to load infrastructure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfrastructure();
  }, []);

  // Set default selected facility once cold storage loads
  useEffect(() => {
    if (coldStorage.length > 0 && !selectedColdFacility) {
      setSelectedColdFacility(coldStorage[0]);
    }
  }, [coldStorage, selectedColdFacility]);

  // Aggregate KPI Calculations
  const stats = useMemo(() => {
    const totalFleetCapacityTons = logistics.reduce((acc, curr) => acc + curr.capacity_kg, 0) / 1000;
    const totalColdStorageTons = coldStorage.reduce((acc, curr) => acc + curr.total_capacity_kg, 0) / 1000;
    const availableColdStorageTons = coldStorage.reduce((acc, curr) => acc + curr.available_capacity_kg, 0) / 1000;
    const totalProcessingIntakeTons = processing.reduce((acc, curr) => acc + curr.daily_capacity_kg, 0) / 1000;
    const availableProcessingIntakeTons = processing.reduce((acc, curr) => acc + curr.available_capacity_kg, 0) / 1000;

    return {
      fleetsCount: logistics.length,
      fleetCapacityTons: Math.round(totalFleetCapacityTons),
      coldCount: coldStorage.length,
      coldTotalTons: Math.round(totalColdStorageTons),
      coldAvailableTons: Math.round(availableColdStorageTons),
      procCount: processing.length,
      procDailyTons: Math.round(totalProcessingIntakeTons),
      procAvailableTons: Math.round(availableProcessingIntakeTons),
    };
  }, [logistics, coldStorage, processing]);

  // Dynamic Filtering for Cold Storage (Matches User's Reference Layout)
  const filteredColdStorage = useMemo(() => {
    return coldStorage.filter((item) => {
      const q = (coldSearchQuery || '').toLowerCase();
      const facilityName = (item.facility_name || (item as any).name || '').toLowerCase();
      const district = (item.location_district || '').toLowerCase();
      const taluka = (item.location_taluka || '').toLowerCase();
      const commodities = (item.compatible_commodities || '').toLowerCase();

      const matchesSearch =
        facilityName.includes(q) ||
        district.includes(q) ||
        taluka.includes(q) ||
        commodities.includes(q);

      let matchesCommodity = true;
      if (coldCommodityFilter === 'FRUITS') {
        matchesCommodity = commodities.includes('fruit') || commodities.includes('grape') || commodities.includes('pomegranate') || commodities.includes('tomato');
      } else if (coldCommodityFilter === 'VEGETABLES') {
        matchesCommodity = commodities.includes('vegetable') || commodities.includes('tomato') || commodities.includes('onion');
      } else if (coldCommodityFilter === 'DAIRY') {
        matchesCommodity = commodities.includes('dairy') || commodities.includes('milk');
      }

      return matchesSearch && matchesCommodity;
    });
  }, [coldStorage, coldSearchQuery, coldCommodityFilter]);

  // Dynamic Filtering for Transport Fleet
  const filteredLogistics = useMemo(() => {
    return logistics.filter((item) => {
      const q = (searchQuery || '').toLowerCase();
      const providerName = (item.provider_name || (item as any).name || '').toLowerCase();
      const baseDistrict = (item.base_district || '').toLowerCase();
      const serviceDistricts = (item.service_districts || '').toLowerCase();
      const vehicleType = (item.vehicle_type || '').toLowerCase();
      const selDistrict = (selectedDistrict || 'ALL').toLowerCase();

      const matchesSearch =
        providerName.includes(q) ||
        baseDistrict.includes(q) ||
        serviceDistricts.includes(q) ||
        vehicleType.includes(q);

      const matchesDistrict =
        selectedDistrict === 'ALL' ||
        baseDistrict === selDistrict ||
        serviceDistricts.includes(selDistrict);

      return matchesSearch && matchesDistrict;
    }).sort((a, b) => {
      if (sortBy === 'LOWEST_COST') return (a.per_km_rate_per_kg || (a as any).rate_per_km_inr || 0) - (b.per_km_rate_per_kg || (b as any).rate_per_km_inr || 0);
      if (sortBy === 'HIGHEST_CAPACITY') return (b.capacity_kg || (b as any).max_capacity_kg || 0) - (a.capacity_kg || (a as any).max_capacity_kg || 0);
      return 0;
    });
  }, [logistics, searchQuery, selectedDistrict, sortBy]);

  // Dynamic Filtering for Processing Facilities
  const filteredProcessing = useMemo(() => {
    return processing.filter((item) => {
      const q = (searchQuery || '').toLowerCase();
      const facilityName = (item.facility_name || (item as any).name || '').toLowerCase();
      const district = (item.location_district || '').toLowerCase();
      const taluka = (item.location_taluka || '').toLowerCase();
      const accepted = (item.accepted_commodities || '').toLowerCase();
      const outputProd = (item.output_product_name || '').toLowerCase();
      const selDistrict = (selectedDistrict || 'ALL').toLowerCase();

      const matchesSearch =
        facilityName.includes(q) ||
        district.includes(q) ||
        taluka.includes(q) ||
        accepted.includes(q) ||
        outputProd.includes(q);

      const matchesDistrict =
        selectedDistrict === 'ALL' || district === selDistrict;

      return matchesSearch && matchesDistrict;
    });
  }, [processing, searchQuery, selectedDistrict]);

  // Open 5-Step Unified Booking Workflow
  const handleOpenBooking = (
    type: 'LOGISTICS' | 'COLD_STORAGE' | 'PROCESSING',
    id: string,
    name: string,
    unitPrice: number,
    capacityAvailable: number,
    baseLocation: string,
    pricingUnit: string,
    specs: string
  ) => {
    setBookingEntity({
      type,
      id,
      name,
      unitPrice,
      capacityAvailable,
      baseLocation,
      pricingUnit,
      specs,
    });
    setBookingStep(1);
    const initialLot = cropLots[0];
    if (initialLot) {
      setBookingCropLotId(initialLot.id);
      setBookingQtyKg(Math.min(capacityAvailable, initialLot.quantity_kg_normalized || 4000));
    } else {
      setBookingQtyKg(4000);
    }
    setBookingAgreementChecked(false);
    setBookingConfirmedRef(null);
    setBookingError(null);
  };

  // Submit Booking Workflow
  const handleConfirmBooking = async () => {
    if (!bookingEntity || !bookingCropLotId) return;

    setBookingSubmitting(true);
    setBookingError(null);
    try {
      let routeType = 'LOGISTICS_ONLY';
      const payload: any = {
        crop_lot_id: bookingCropLotId,
        requested_quantity_kg: bookingQtyKg,
        scheduled_date: bookingScheduledDate,
        notes: bookingNotes || undefined,
      };

      if (bookingEntity.type === 'LOGISTICS') {
        routeType = 'LOGISTICS_ONLY';
        payload.route_type = routeType;
        payload.logistics_provider_id = bookingEntity.id;
        payload.pickup_location = bookingPickupLocation;
        payload.delivery_location = bookingDeliveryLocation;
      } else if (bookingEntity.type === 'COLD_STORAGE') {
        routeType = 'COLD_STORAGE';
        payload.route_type = routeType;
        payload.cold_storage_facility_id = bookingEntity.id;
        payload.pickup_location = bookingPickupLocation;
        payload.notes = `Cold holding period: ${bookingDurationDays} days. ${bookingNotes}`.trim();
      } else if (bookingEntity.type === 'PROCESSING') {
        routeType = 'PROCESSING';
        payload.route_type = routeType;
        payload.processing_facility_id = bookingEntity.id;
        payload.pickup_location = bookingPickupLocation;
        payload.notes = `Target spec: ${bookingProcessingSpec}. ${bookingNotes}`.trim();
      }

      await api.createExecutionRequest(payload);
      const generatedRef = `LOG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setBookingConfirmedRef(generatedRef);
      setBookingStep(5);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to submit infrastructure reservation');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Direct calculation helpers
  const calculateTransportEstimate = (
    provider: LogisticsProvider,
    qtyKg: number,
    distKm: number
  ) => {
    const trips = Math.ceil(qtyKg / Math.max(1, provider.capacity_kg));
    const rawCost = trips * distKm * (qtyKg / trips) * provider.per_km_rate_per_kg;
    const totalCost = Math.max(provider.minimum_fare * trips, Math.round(rawCost));
    const costPerKg = (totalCost / qtyKg).toFixed(2);
    const estHours = (distKm / 35).toFixed(1);
    return { trips, totalCost, costPerKg, estHours };
  };

  const calculateStorageEstimate = (
    facility: ColdStorageFacility,
    qtyKg: number,
    days: number
  ) => {
    const dailyRate = facility.storage_rate_per_kg_per_month / 30;
    const totalCost = Math.round(qtyKg * dailyRate * days);
    const costPerKg = (totalCost / qtyKg).toFixed(2);
    const isCapacitySufficient = qtyKg <= facility.available_capacity_kg;
    return { totalCost, costPerKg, dailyRate: dailyRate.toFixed(4), isCapacitySufficient };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      
      {/* ──────────────────────────────────────────────────────────
         SECTION 1: EXECUTIVE HEADER & 4 SERVICE CATEGORY NAVIGATION TABS
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-md shrink-0 text-2xl">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-gray-900">
                Logistics &amp; Cold Storage Hubs
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-50 text-green-700 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Active Network
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Regional cold chain chambers, reefer transport fleets, and agro-processing intake terminals across Maharashtra.
            </p>
          </div>
        </div>

        {/* 4 Mode Selector Tabs (Pills) */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory('cold-storage')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeCategory === 'cold-storage'
                ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Snowflake className="w-4 h-4" />
            <span>Cold Storage Map &amp; Hubs</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
              activeCategory === 'cold-storage' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {coldStorage.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('transport')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeCategory === 'transport'
                ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Transport Fleets</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
              activeCategory === 'transport' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {logistics.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('processing')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeCategory === 'processing'
                ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>Processing Units</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
              activeCategory === 'processing' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {processing.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('calculators')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeCategory === 'calculators'
                ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Trip &amp; Holding Cost Estimators</span>
          </button>
        </div>

        {/* Quick Regional Stats Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Cold Storage Hubs</span>
              <strong className="text-base font-black text-gray-900 font-mono">{coldStorage.length} Active</strong>
            </div>
            <Snowflake className="w-5 h-5 text-blue-500" />
          </div>
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Reefer Fleets</span>
              <strong className="text-base font-black text-gray-900 font-mono">{logistics.length} Synced</strong>
            </div>
            <Truck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Processing Hubs</span>
              <strong className="text-base font-black text-gray-900 font-mono">{processing.length} Facilities</strong>
            </div>
            <Factory className="w-5 h-5 text-amber-600" />
          </div>
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Transit Protection</span>
              <strong className="text-base font-black text-emerald-700 font-mono">100% Insured</strong>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
         SECTION 2: COLD STORAGE & PRE-COOLING (SPLIT MAP + LIST VIEW)
         EXACTLY MATCHING THE USER'S REFERENCE DESIGN
         ────────────────────────────────────────────────────────── */}
      {activeCategory === 'cold-storage' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Top Search & Filter Bar Floating over the Map Workspace */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={coldSearchQuery}
                onChange={(e) => setColdSearchQuery(e.target.value)}
                placeholder="Search nearby cold storage..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all placeholder:text-gray-400"
              />
              {coldSearchQuery && (
                <button
                  onClick={() => setColdSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Pills (All, Fruits, Vegetables, Dairy) Matching Reference */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {(['ALL', 'FRUITS', 'VEGETABLES', 'DAIRY'] as ColdCommodityFilter[]).map((pill) => (
                <button
                  key={pill}
                  onClick={() => setColdCommodityFilter(pill)}
                  className={`px-5 py-2 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    coldCommodityFilter === pill
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600/20'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Split Screen Workspace: List on Left (40%), Map on Right (60%) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Column: Facility Cards List (5 Cols) with Reference Green Vertical Divider */}
            <div className="lg:col-span-5 space-y-3.5 max-h-[640px] overflow-y-auto pr-3 lg:border-r-4 lg:border-emerald-500">
              {filteredColdStorage.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 space-y-2">
                  <Snowflake className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="font-bold text-sm text-gray-700">No cold storages found</p>
                  <p className="text-xs">Try searching for other talukas or resetting commodity filters.</p>
                </div>
              ) : (
                filteredColdStorage.map((facility) => {
                  const isSelected = selectedColdFacility?.id === facility.id;
                  const isAvailable = facility.availability_status === 'AVAILABLE';

                  return (
                    <div
                      key={facility.id}
                      onClick={() => setSelectedColdFacility(facility)}
                      className={`relative bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/15'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {/* Active green edge indicator */}
                      {isSelected && (
                        <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-emerald-500 rounded-r-full" />
                      )}

                      {/* Header: Title + Verified Checkmark + Distance */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-black text-gray-900 text-sm sm:text-base font-display">
                              {facility.facility_name}
                            </h3>
                            {facility.verified !== false && (
                              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 text-white shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>
                              {facility.distance_km ? `${facility.distance_km} km away` : '2.4 km away'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="my-3 border-t border-gray-100" />

                      {/* Status & Price Strip (Exact Reference Format) */}
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-0.5">
                            STATUS
                          </span>
                          <span className={`inline-flex items-center gap-1.5 font-black uppercase text-[11px] ${
                            isAvailable ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            {facility.availability_status}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-0.5">
                            PRICE
                          </span>
                          <span className="font-black text-gray-900 text-sm sm:text-base font-display font-mono">
                            ₹{facility.storage_rate_per_kg_per_month}/kg
                          </span>
                        </div>
                      </div>

                      {/* If Selected: Reveal Capacity & Booking Action */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-[11px] text-gray-500">
                            <span>Available: <strong className="text-emerald-700 font-bold">{Math.round((facility.available_capacity_kg || 0) / 1000).toLocaleString()} MT</strong></span>
                            <span>Chamber Temp: <strong className="text-blue-600 font-bold">{facility.temperature_range_celsius}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${facility.contact_phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="py-1.5 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                            >
                              <Phone className="w-3.5 h-3.5 text-gray-500" />
                              <span>Call</span>
                            </a>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenBooking(
                                  'COLD_STORAGE',
                                  facility.id,
                                  facility.facility_name,
                                  facility.storage_rate_per_kg_per_month,
                                  facility.available_capacity_kg,
                                  `${facility.location_taluka}, ${facility.location_district}`,
                                  'INR/kg/month',
                                  `${facility.temperature_range_celsius} (${facility.compatible_commodities})`
                                );
                              }}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                            >
                              <span>Reserve Cold Bay</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Interactive Leaflet Map (7 Cols) */}
            <div className="lg:col-span-7 h-[620px] sticky top-20">
              <ColdStorageMap
                facilities={filteredColdStorage}
                selectedFacility={selectedColdFacility}
                onSelectFacility={(fac) => setSelectedColdFacility(fac)}
                onBookFacility={(fac) =>
                  handleOpenBooking(
                    'COLD_STORAGE',
                    fac.id,
                    fac.facility_name,
                    fac.storage_rate_per_kg_per_month,
                    fac.available_capacity_kg,
                    `${fac.location_taluka}, ${fac.location_district}`,
                    'INR/kg/month',
                    `${fac.temperature_range_celsius} (${fac.compatible_commodities})`
                  )
                }
              />
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         SECTION 3: REEFER & FARMGATE FREIGHT TRANSPORT FLEET
         ────────────────────────────────────────────────────────── */}
      {activeCategory === 'transport' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Search & District Selector */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transport fleets by vehicle type, operator, or corridor..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Districts</option>
                <option value="Nashik">Nashik</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai MMR</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value="RECOMMENDED">Sort: Recommended</option>
                <option value="LOWEST_COST">Lowest Tariff</option>
                <option value="HIGHEST_CAPACITY">Highest Capacity</option>
              </select>
            </div>
          </div>

          {/* Fleets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLogistics.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-green-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base font-display">
                          {log.provider_name}
                        </h3>
                        <span className="badge-green text-[10px]">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Base: {log.base_district} · Routes: {log.service_districts}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-green-700 font-display">
                        ₹{log.per_km_rate_per_kg}
                      </span>
                      <span className="text-[10px] text-gray-400 block font-mono">/ km / kg</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Vehicle Type</span>
                      <strong className="text-gray-900 block mt-0.5">{log.vehicle_type}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Payload Capacity</span>
                      <strong className="text-gray-900 block mt-0.5">{(log.capacity_kg / 1000).toFixed(1)} MT ({log.capacity_kg.toLocaleString()} kg)</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>Min Tariff: <strong className="text-gray-800">₹{log.minimum_fare}</strong></span>
                    <span className="text-blue-700 font-semibold">
                      {log.is_temperature_controlled ? '❄️ Reefer Controlled' : '📦 Ambient Freight'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => {
                      setTransportCalcEntity(log);
                      setActiveCategory('calculators');
                    }}
                    className="btn-secondary text-xs py-2 px-3"
                  >
                    Calculate Trip Cost
                  </button>

                  <button
                    onClick={() =>
                      handleOpenBooking(
                        'LOGISTICS',
                        log.id,
                        log.provider_name,
                        log.per_km_rate_per_kg,
                        log.capacity_kg,
                        log.base_district,
                        'INR/km/kg',
                        `${log.vehicle_type} (${(log.capacity_kg / 1000).toFixed(1)} MT)`
                      )
                    }
                    className="btn-primary text-xs py-2 px-4"
                  >
                    Book Vehicle →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         SECTION 4: AGRO-PROCESSING & PUREE PLANTS
         ────────────────────────────────────────────────────────── */}
      {activeCategory === 'processing' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProcessing.map((proc) => (
              <div
                key={proc.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base font-display">
                        {proc.facility_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {proc.location_taluka}, {proc.location_district}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {proc.facility_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Output Product</span>
                      <strong className="text-gray-900 block mt-0.5">{proc.output_product_name}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Processing Tariff</span>
                      <strong className="text-purple-700 block mt-0.5">₹{proc.processing_charge_per_kg} / kg raw</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>Recovery Ratio: <strong className="text-gray-800">{(proc.output_recovery_ratio * 100).toFixed(1)}%</strong></span>
                    <span>Daily Intake: <strong className="text-gray-800">{(proc.daily_capacity_kg / 1000)} MT</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() =>
                      handleOpenBooking(
                        'PROCESSING',
                        proc.id,
                        proc.facility_name,
                        proc.processing_charge_per_kg,
                        proc.available_capacity_kg,
                        `${proc.location_taluka}, ${proc.location_district}`,
                        'INR/kg',
                        `${proc.facility_type} (${proc.output_product_name})`
                      )
                    }
                    className="btn-primary text-xs py-2 px-4"
                  >
                    Reserve Processing Intake →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         SECTION 5: INTERACTIVE COST ESTIMATORS
         ────────────────────────────────────────────────────────── */}
      {activeCategory === 'calculators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
          
          {/* Calculator 1: Transport Tariff Estimator */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Truck className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-bold text-gray-900 text-base font-display">Road Freight Tariff Calculator</h3>
                <p className="text-xs text-gray-400">Estimate mileage and round-trip transport fees</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-700 font-bold block mb-1">Quantity to Transport (kg):</label>
                <input
                  type="number"
                  value={transportCalcForm.quantityKg}
                  onChange={(e) => setTransportCalcForm({ ...transportCalcForm, quantityKg: Math.max(100, Number(e.target.value)) })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">One-Way Distance (km):</label>
                <input
                  type="number"
                  value={transportCalcForm.distanceKm}
                  onChange={(e) => setTransportCalcForm({ ...transportCalcForm, distanceKm: Math.max(1, Number(e.target.value)) })}
                  className="input-field"
                />
              </div>

              {/* Result Preview */}
              {(() => {
                const activeProv = transportCalcEntity || logistics[0];
                if (!activeProv) return null;
                const est = calculateTransportEstimate(activeProv, transportCalcForm.quantityKg, transportCalcForm.distanceKm);

                return (
                  <div className="p-4 rounded-2xl bg-green-50 border border-green-200 space-y-2 mt-4">
                    <div className="flex justify-between items-center text-sm font-bold text-green-900">
                      <span>Estimated Freight Cost:</span>
                      <span className="text-lg font-black font-display">₹{est.totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-green-700">
                      <span>Effective Cost per kg:</span>
                      <strong>₹{est.costPerKg} / kg</strong>
                    </div>
                    <div className="flex justify-between text-xs text-green-700">
                      <span>Number of Trips:</span>
                      <strong>{est.trips} Trips ({activeProv.vehicle_type})</strong>
                    </div>
                    <div className="flex justify-between text-xs text-green-700">
                      <span>Transit Duration:</span>
                      <strong>~{est.estHours} Hours</strong>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Calculator 2: Cold Storage Holding Calculator */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Snowflake className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-gray-900 text-base font-display">Cold Storage Holding Calculator</h3>
                <p className="text-xs text-gray-400">Calculate chamber fees over holding periods</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-700 font-bold block mb-1">Produce Batch Weight (kg):</label>
                <input
                  type="number"
                  value={storageCalcForm.quantityKg}
                  onChange={(e) => setStorageCalcForm({ ...storageCalcForm, quantityKg: Math.max(100, Number(e.target.value)) })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">Holding Duration (Days):</label>
                <input
                  type="number"
                  value={storageCalcForm.durationDays}
                  onChange={(e) => setStorageCalcForm({ ...storageCalcForm, durationDays: Math.max(1, Number(e.target.value)) })}
                  className="input-field"
                />
              </div>

              {/* Result Preview */}
              {(() => {
                const activeFac = selectedColdFacility || coldStorage[0];
                if (!activeFac) return null;
                const est = calculateStorageEstimate(activeFac, storageCalcForm.quantityKg, storageCalcForm.durationDays);

                return (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 mt-4">
                    <div className="flex justify-between items-center text-sm font-bold text-blue-900">
                      <span>Total Holding Fee:</span>
                      <span className="text-lg font-black font-display">₹{est.totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-blue-700">
                      <span>Per-kg Storage Impact:</span>
                      <strong>₹{est.costPerKg} / kg for {storageCalcForm.durationDays} days</strong>
                    </div>
                    <div className="flex justify-between text-xs text-blue-700">
                      <span>Daily Rate:</span>
                      <strong>₹{est.dailyRate} / kg / day</strong>
                    </div>
                    <div className="flex justify-between text-xs text-blue-700">
                      <span>Facility:</span>
                      <strong>{activeFac.facility_name}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         SECTION 6: 5-STEP UNIFIED BOOKING MODAL
         ────────────────────────────────────────────────────────── */}
      {bookingEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 border border-gray-100 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-green-100 text-green-800 uppercase">
                    STEP {bookingStep} OF 5
                  </span>
                  <h3 className="text-base font-bold text-gray-900 font-display">
                    Reserve {bookingEntity.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setBookingEntity(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Batch & Quantity */}
            {bookingStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">Select Registered Harvest Lot:</label>
                  <select
                    value={bookingCropLotId}
                    onChange={(e) => setBookingCropLotId(e.target.value)}
                    className="input-field"
                  >
                    {cropLots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.crop_name} (Grade {lot.quality_grade || 'A'}) · {lot.quantity_kg_normalized} kg
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">Quantity to Allocate (kg):</label>
                  <input
                    type="number"
                    value={bookingQtyKg}
                    onChange={(e) => setBookingQtyKg(Math.max(100, Number(e.target.value)))}
                    className="input-field"
                  />
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                  <span className="text-gray-500">Max Capacity Available:</span>
                  <strong className="text-gray-900">{bookingEntity.capacityAvailable.toLocaleString()} kg</strong>
                </div>
              </div>
            )}

            {/* Step 2: Route & Schedule */}
            {bookingStep === 2 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">Scheduled Dispatch Date:</label>
                  <input
                    type="date"
                    value={bookingScheduledDate}
                    onChange={(e) => setBookingScheduledDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">Farmgate Pickup Point:</label>
                  <input
                    type="text"
                    value={bookingPickupLocation}
                    onChange={(e) => setBookingPickupLocation(e.target.value)}
                    className="input-field"
                  />
                </div>

                {bookingEntity.type === 'LOGISTICS' && (
                  <div>
                    <label className="text-gray-700 font-bold block mb-1">Drop-off / Offtake Yard Destination:</label>
                    <input
                      type="text"
                      value={bookingDeliveryLocation}
                      onChange={(e) => setBookingDeliveryLocation(e.target.value)}
                      className="input-field"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Specific Requirements */}
            {bookingStep === 3 && (
              <div className="space-y-4 text-xs">
                {bookingEntity.type === 'COLD_STORAGE' && (
                  <div>
                    <label className="text-gray-700 font-bold block mb-1">Expected Holding Duration (Days):</label>
                    <input
                      type="number"
                      value={bookingDurationDays}
                      onChange={(e) => setBookingDurationDays(Math.max(1, Number(e.target.value)))}
                      className="input-field"
                    />
                  </div>
                )}

                <div>
                  <label className="text-gray-700 font-bold block mb-1">Operational Handling Instructions:</label>
                  <textarea
                    rows={3}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Specific crate stacking, precooling needs, or driver timing..."
                    className="input-field"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Summary & Escrow Terms */}
            {bookingStep === 4 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service:</span>
                    <strong className="text-gray-900">{bookingEntity.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Scheduled Date:</span>
                    <strong className="text-gray-900">{bookingScheduledDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Volume:</span>
                    <strong className="text-gray-900">{bookingQtyKg.toLocaleString()} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tariff Unit:</span>
                    <strong className="text-green-700">₹{bookingEntity.unitPrice} {bookingEntity.pricingUnit}</strong>
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    checked={bookingAgreementChecked}
                    onChange={(e) => setBookingAgreementChecked(e.target.checked)}
                    className="mt-0.5 rounded text-green-600"
                  />
                  <span className="text-gray-600 text-[11px]">
                    I confirm this reservation request under standard Agri2Value platform guidelines with weighbridge verification.
                  </span>
                </label>
              </div>
            )}

            {/* Step 5: Confirmation Success */}
            {bookingStep === 5 && (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h4 className="text-lg font-black text-gray-900 font-display">Reservation Confirmed!</h4>
                <p className="text-xs text-gray-500">
                  Tracking Reference: <strong className="font-mono text-gray-900">{bookingConfirmedRef}</strong>
                </p>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  Operator has been notified. You can track transit and weighbridge status directly in the Execution Tracker.
                </p>
              </div>
            )}

            {/* Navigation / Action Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
              {bookingStep > 1 && bookingStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setBookingStep(bookingStep - 1)}
                  className="btn-ghost text-xs"
                >
                  ← Back
                </button>
              ) : <div />}

              {bookingStep < 4 && (
                <button
                  type="button"
                  onClick={() => setBookingStep(bookingStep + 1)}
                  className="btn-primary text-xs"
                >
                  Continue →
                </button>
              )}

              {bookingStep === 4 && (
                <button
                  type="button"
                  disabled={!bookingAgreementChecked || bookingSubmitting}
                  onClick={handleConfirmBooking}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  {bookingSubmitting ? 'Confirming...' : 'Lock Reservation ✓'}
                </button>
              )}

              {bookingStep === 5 && (
                <button
                  type="button"
                  onClick={() => {
                    setBookingEntity(null);
                    if (onNavigateToExecution) onNavigateToExecution();
                  }}
                  className="btn-primary text-xs w-full"
                >
                  View in Execution Tracker →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
