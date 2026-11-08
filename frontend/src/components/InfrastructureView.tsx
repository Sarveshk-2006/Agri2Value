// frontend/src/components/InfrastructureView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Warehouse,
  Factory,
  CheckCircle2,
  MapPin,
  Sparkles,
  X,
  Thermometer,
  ArrowRight,
  Calculator,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Info,
  Search,
  SlidersHorizontal,
  Layers,
  Scale,
  Zap,
  RotateCcw,
  FileText,
  Check,
  Droplets,
  Box,
  Clock,
  ArrowUpRight,
  Phone,
  Mail,
  Gauge,
  Activity,
  AlertCircle,
  ExternalLink,
  Navigation
} from 'lucide-react';
import type { LogisticsProvider, ColdStorageFacility, ProcessingFacility, CropLot } from '../types';
import { api } from '../api';

interface InfrastructureViewProps {
  cropLots: CropLot[];
  onNavigateToExecution?: () => void;
}

type InfraCategory = 'transport' | 'cold-storage' | 'processing';
type QuickFilterChip = 'ALL' | 'AVAILABLE_NOW' | 'VERIFIED' | 'LOWEST_TARIFF' | 'HIGH_CAPACITY' | 'TEMP_CONTROLLED';

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  cropLots,
  onNavigateToExecution,
}) => {
  // Category state
  const [activeCategory, setActiveCategory] = useState<InfraCategory>('transport');

  // Raw data from API
  const [logistics, setLogistics] = useState<LogisticsProvider[]>([]);
  const [coldStorage, setColdStorage] = useState<ColdStorageFacility[]>([]);
  const [processing, setProcessing] = useState<ProcessingFacility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [activeChip, setActiveChip] = useState<QuickFilterChip>('ALL');
  const [sortBy, setSortBy] = useState<string>('RECOMMENDED');

  // Slide-over Facility Details Drawer
  const [drawerEntity, setDrawerEntity] = useState<{
    category: InfraCategory;
    data: LogisticsProvider | ColdStorageFacility | ProcessingFacility;
  } | null>(null);

  // Dedicated Calculators
  const [transportCalcEntity, setTransportCalcEntity] = useState<LogisticsProvider | null>(null);
  const [storageCalcEntity, setStorageCalcEntity] = useState<ColdStorageFacility | null>(null);
  const [procCalcEntity, setProcCalcEntity] = useState<ProcessingFacility | null>(null);

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

  // Processing Estimator Form State
  const [procCalcForm, setProcCalcForm] = useState({
    batchQtyKg: 4000,
    crop: 'Tomato',
  });

  // Comparison Matrix State (Supports comparing items within active category)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

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
    } catch (err) {
      console.error('Failed to load infrastructure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfrastructure();
  }, []);

  // Reset comparison when category changes
  useEffect(() => {
    setSelectedForCompare([]);
  }, [activeCategory]);

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
      aggregateReadyCapacityTons: Math.round(availableColdStorageTons + availableProcessingIntakeTons),
    };
  }, [logistics, coldStorage, processing]);

  // Dynamic Filtering for Active Category
  const filteredLogistics = useMemo(() => {
    return logistics.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.provider_name.toLowerCase().includes(q) ||
        item.base_district.toLowerCase().includes(q) ||
        item.service_districts.toLowerCase().includes(q) ||
        item.vehicle_type.toLowerCase().includes(q);

      const matchesDistrict =
        selectedDistrict === 'ALL' ||
        item.base_district.toLowerCase() === selectedDistrict.toLowerCase() ||
        item.service_districts.toLowerCase().includes(selectedDistrict.toLowerCase());

      let matchesChip = true;
      if (activeChip === 'AVAILABLE_NOW') matchesChip = item.availability_status === 'AVAILABLE';
      if (activeChip === 'LOWEST_TARIFF') matchesChip = item.per_km_rate_per_kg <= 0.05;
      if (activeChip === 'HIGH_CAPACITY') matchesChip = item.capacity_kg >= 5000;
      if (activeChip === 'TEMP_CONTROLLED') matchesChip = item.is_temperature_controlled === true;

      return matchesSearch && matchesDistrict && matchesChip;
    }).sort((a, b) => {
      if (sortBy === 'LOWEST_COST') return a.per_km_rate_per_kg - b.per_km_rate_per_kg;
      if (sortBy === 'HIGHEST_CAPACITY') return b.capacity_kg - a.capacity_kg;
      if (sortBy === 'NEAREST_BASE') return a.base_district.localeCompare(b.base_district);
      return 0;
    });
  }, [logistics, searchQuery, selectedDistrict, activeChip, sortBy]);

  const filteredColdStorage = useMemo(() => {
    return coldStorage.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.facility_name.toLowerCase().includes(q) ||
        item.location_district.toLowerCase().includes(q) ||
        item.location_taluka.toLowerCase().includes(q) ||
        item.compatible_commodities.toLowerCase().includes(q);

      const matchesDistrict =
        selectedDistrict === 'ALL' || item.location_district.toLowerCase() === selectedDistrict.toLowerCase();

      let matchesChip = true;
      if (activeChip === 'AVAILABLE_NOW') matchesChip = item.available_capacity_kg > 0;
      if (activeChip === 'LOWEST_TARIFF') matchesChip = item.storage_rate_per_kg_per_month <= 0.8;
      if (activeChip === 'HIGH_CAPACITY') matchesChip = item.total_capacity_kg >= 150000;
      if (activeChip === 'TEMP_CONTROLLED') matchesChip = true;

      return matchesSearch && matchesDistrict && matchesChip;
    }).sort((a, b) => {
      if (sortBy === 'LOWEST_COST') return a.storage_rate_per_kg_per_month - b.storage_rate_per_kg_per_month;
      if (sortBy === 'HIGHEST_CAPACITY') return b.available_capacity_kg - a.available_capacity_kg;
      if (sortBy === 'NEAREST_BASE') return a.location_taluka.localeCompare(b.location_taluka);
      return 0;
    });
  }, [coldStorage, searchQuery, selectedDistrict, activeChip, sortBy]);

  const filteredProcessing = useMemo(() => {
    return processing.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.facility_name.toLowerCase().includes(q) ||
        item.location_district.toLowerCase().includes(q) ||
        item.location_taluka.toLowerCase().includes(q) ||
        item.accepted_commodities.toLowerCase().includes(q) ||
        item.output_product_name.toLowerCase().includes(q);

      const matchesDistrict =
        selectedDistrict === 'ALL' || item.location_district.toLowerCase() === selectedDistrict.toLowerCase();

      let matchesChip = true;
      if (activeChip === 'AVAILABLE_NOW') matchesChip = item.available_capacity_kg > 0;
      if (activeChip === 'LOWEST_TARIFF') matchesChip = item.processing_charge_per_kg <= 0.9;
      if (activeChip === 'HIGH_CAPACITY') matchesChip = item.daily_capacity_kg >= 30000;
      if (activeChip === 'TEMP_CONTROLLED') matchesChip = true;

      return matchesSearch && matchesDistrict && matchesChip;
    }).sort((a, b) => {
      if (sortBy === 'LOWEST_COST') return a.processing_charge_per_kg - b.processing_charge_per_kg;
      if (sortBy === 'HIGHEST_CAPACITY') return b.daily_capacity_kg - a.daily_capacity_kg;
      if (sortBy === 'NEAREST_BASE') return a.location_taluka.localeCompare(b.location_taluka);
      return 0;
    });
  }, [processing, searchQuery, selectedDistrict, activeChip, sortBy]);

  // Comparison toggle
  const toggleCompare = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

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

  // Calculation helpers
  const calculateTransportEstimate = (
    provider: LogisticsProvider,
    qtyKg: number,
    distKm: number
  ) => {
    const trips = Math.ceil(qtyKg / Math.max(1, provider.capacity_kg));
    const rawCost = trips * distKm * (qtyKg / trips) * provider.per_km_rate_per_kg;
    const totalCost = Math.max(provider.minimum_fare * trips, Math.round(rawCost));
    const costPerKg = (totalCost / qtyKg).toFixed(2);
    const estHours = (distKm / 35).toFixed(1); // avg 35 km/h rural transport
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

  const calculateProcessingEstimate = (
    plant: ProcessingFacility,
    rawQtyKg: number
  ) => {
    const totalCharge = Math.round(rawQtyKg * plant.processing_charge_per_kg);
    const expectedOutputKg = Math.round(rawQtyKg * plant.output_recovery_ratio);
    return { totalCharge, expectedOutputKg, chargePerKg: plant.processing_charge_per_kg };
  };

  // Scroll to discovery listings
  const handleScrollToExplore = () => {
    const el = document.getElementById('infra-discovery-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ──────────────────────────────────────────────────────────
         1. HERO HEADER SECTION
         ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 sm:p-8 md:p-10 border border-emerald-800/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Infrastructure Network Active
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-200 border border-white/15">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Nashik Regional Network
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-900/40 text-emerald-300 border border-emerald-700/40">
                Multi-Commodity Grid
              </span>
            </div>
          </div>

          {/* Title & Headline */}
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/50 flex-shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight text-white">
                Logistics, Cold Chain & Processing Units
              </h1>
            </div>
            <p className="text-sm sm:text-base md:text-lg font-semibold text-emerald-300">
              Move Smarter. Store Better. Deliver Fresher.
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Discover reliable agricultural transport fleets, temperature-controlled cold storage facilities, and verified agro-processing units with transparent service tariffs and dependable capacity.
            </p>
          </div>

          {/* Agricultural Supply-Chain Flow Visual */}
          <div className="pt-2">
            <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">1</div>
                <div>
                  <div className="font-bold text-white">Farm Harvest</div>
                  <div className="text-[10px] text-slate-400">Produce Lot Ready</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-500/60 hidden sm:block" />

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">2</div>
                <div>
                  <div className="font-bold text-white">Transport Fleet</div>
                  <div className="text-[10px] text-slate-400">Tempo & Reefer Vans</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-500/60 hidden sm:block" />

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">3</div>
                <div>
                  <div className="font-bold text-white">Cold Storage</div>
                  <div className="text-[10px] text-slate-400">Pre-cooling & CA Hubs</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-500/60 hidden sm:block" />

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">4</div>
                <div>
                  <div className="font-bold text-white">Processing Plants</div>
                  <div className="text-[10px] text-slate-400">Puree, Pulp & Flakes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleScrollToExplore}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-emerald-500/30 cursor-pointer"
            >
              <span>Explore Infrastructure</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400">
              Covering <strong>Nashik, Pune, Mumbai MMR & Ahmednagar</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
         2. LOGISTICS OVERVIEW STATISTICS (4 KPI CARDS)
         ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Transport Fleets */}
        <div className="card p-5 border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Transport Fleets</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              {stats.fleetsCount} <span className="text-sm font-semibold text-slate-500">Fleets</span>
            </div>
            <div className="text-xs text-emerald-700 font-bold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.fleetCapacityTons} MT Total Payload Capacity</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Tempo & Reefer Ready</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>

        {/* Stat 2: Cold Storage Hubs */}
        <div className="card p-5 border-slate-200 hover:border-blue-400 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cold Storage Hubs</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Warehouse className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              {stats.coldCount} <span className="text-sm font-semibold text-slate-500">Hubs</span>
            </div>
            <div className="text-xs text-blue-700 font-bold flex items-center gap-1 mt-1">
              <Droplets className="w-3.5 h-3.5" />
              <span>{stats.coldAvailableTons} MT / {stats.coldTotalTons} MT Available</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Pre-Cooling & CA Chambers</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
        </div>

        {/* Stat 3: Processing Plants */}
        <div className="card p-5 border-slate-200 hover:border-purple-400 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Processing Units</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Factory className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              {stats.procCount} <span className="text-sm font-semibold text-slate-500">Plants</span>
            </div>
            <div className="text-xs text-purple-700 font-bold flex items-center gap-1 mt-1">
              <Zap className="w-3.5 h-3.5" />
              <span>{stats.procAvailableTons} MT Daily Intake Ready</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Puree, Pulping & Drying</span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
          </div>
        </div>

        {/* Stat 4: Total Available Capacity */}
        <div className="card p-5 border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Capacity</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              {stats.aggregateReadyCapacityTons} <span className="text-sm font-semibold text-slate-500">MT</span>
            </div>
            <div className="text-xs text-teal-700 font-bold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Institutional Grid</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Instant Booking Guaranteed</span>
            <span className="w-2 h-2 rounded-full bg-teal-500" />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
         3. SERVICE CATEGORY SEGMENTED NAVIGATION CARDS
         ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="infra-discovery-section">
        {/* Category A: Transport Fleet */}
        <button
          onClick={() => setActiveCategory('transport')}
          className={`p-5 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden ${
            activeCategory === 'transport'
              ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          {activeCategory === 'transport' && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
          )}
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              activeCategory === 'transport' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Truck className="w-5 h-5" />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              activeCategory === 'transport' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
            }`}>
              {logistics.length} Available
            </span>
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">TRANSPORT FLEET</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Reliable agricultural transportation services with ambient and reefer temperature control.
          </p>
        </button>

        {/* Category B: Cold Storage Hubs */}
        <button
          onClick={() => setActiveCategory('cold-storage')}
          className={`p-5 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden ${
            activeCategory === 'cold-storage'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          {activeCategory === 'cold-storage' && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full pointer-events-none" />
          )}
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              activeCategory === 'cold-storage' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Warehouse className="w-5 h-5" />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              activeCategory === 'cold-storage' ? 'bg-blue-200 text-blue-900' : 'bg-slate-100 text-slate-600'
            }`}>
              {coldStorage.length} Active Hubs
            </span>
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">COLD STORAGE HUBS</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Temperature-controlled storage infrastructure, pre-cooling tunnels, and controlled atmosphere rooms.
          </p>
        </button>

        {/* Category C: Processing Plants */}
        <button
          onClick={() => setActiveCategory('processing')}
          className={`p-5 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden ${
            activeCategory === 'processing'
              ? 'bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          {activeCategory === 'processing' && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full pointer-events-none" />
          )}
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              activeCategory === 'processing' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Factory className="w-5 h-5" />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              activeCategory === 'processing' ? 'bg-purple-200 text-purple-900' : 'bg-slate-100 text-slate-600'
            }`}>
              {processing.length} Facilities
            </span>
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">PROCESSING PLANTS</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Verified agro-processing, pulp extraction, dehydration, and industrial value-addition lines.
          </p>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
         4. DISCOVERY TOOLBAR (SEARCH, QUICK CHIPS & FILTERS)
         ────────────────────────────────────────────────────────── */}
      <div className="card p-4 sm:p-5 border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by operator, facility, vehicle type, or commodity..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* District Selector & Sorting */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Districts</option>
                <option value="Nashik">Nashik</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai MMR</option>
                <option value="Ahmednagar">Ahmednagar</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer pr-1"
              >
                <option value="RECOMMENDED">Sort: Recommended</option>
                <option value="LOWEST_COST">Sort: Lowest Tariff</option>
                <option value="HIGHEST_CAPACITY">Sort: Highest Capacity</option>
                <option value="NEAREST_BASE">Sort: Nearest Base</option>
              </select>
            </div>

            {(searchQuery || selectedDistrict !== 'ALL' || activeChip !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDistrict('ALL');
                  setActiveChip('ALL');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer text-xs flex items-center gap-1 font-semibold"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 mr-1">
            Quick Filters:
          </span>

          {[
            { id: 'ALL', label: 'All Listings' },
            { id: 'AVAILABLE_NOW', label: 'Available Now' },
            { id: 'LOWEST_TARIFF', label: 'Lowest Tariff' },
            { id: 'HIGH_CAPACITY', label: 'Highest Capacity' },
            { id: 'TEMP_CONTROLLED', label: 'Temperature Controlled' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveChip(chip.id as QuickFilterChip)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                activeChip === chip.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
         5. LISTINGS DISPLAY (BASED ON ACTIVE CATEGORY)
         ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 card border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Retrieving regional logistics fleet, cold rooms, and processing units...</p>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════
             CATEGORY A: TRANSPORT FLEET
             ══════════════════════════════════════════════════════════ */}
          {activeCategory === 'transport' && (
            <div className="space-y-4">
              {filteredLogistics.length === 0 ? (
                <div className="card p-12 text-center border-slate-200 space-y-3">
                  <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No transport fleets match your search</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try clearing your district or quick filter selection to see all available fleets across Maharashtra.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredLogistics.map((log) => {
                    const isCompared = selectedForCompare.includes(log.id);
                    return (
                      <div
                        key={log.id}
                        className="card p-6 space-y-4 hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col justify-between border-slate-200"
                      >
                        {/* Header */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-slate-900 text-base">
                                  {log.provider_name}
                                </h3>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>VERIFIED</span>
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Base: {log.base_district}</span>
                                </span>
                                <span>•</span>
                                <span className="text-slate-600 truncate max-w-[180px]">
                                  Coverage: {log.service_districts}
                                </span>
                              </div>
                            </div>

                            {log.is_temperature_controlled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex-shrink-0">
                                <Thermometer className="w-3.5 h-3.5" />
                                <span>REEFER CHILLED</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex-shrink-0">
                                <Box className="w-3.5 h-3.5 text-slate-400" />
                                <span>VENTILATED</span>
                              </span>
                            )}
                          </div>

                          {/* Vehicle Information Grid */}
                          <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                            <div>
                              <span className="text-slate-500 block text-[11px]">Vehicle Type:</span>
                              <span className="font-bold text-slate-800">{log.vehicle_type.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Payload Capacity:</span>
                              <span className="font-extrabold text-slate-900">{log.capacity_kg.toLocaleString()} kg</span>
                            </div>
                            <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                              <span className="text-slate-500 text-[11px]">Transportation Tariff:</span>
                              <span className="font-mono font-black text-emerald-800 text-sm">
                                ₹{log.per_km_rate_per_kg} / km / kg <span className="text-xs text-slate-400 font-normal">(Min ₹{log.minimum_fare})</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer text-xs font-medium select-none">
                              <input
                                type="checkbox"
                                checked={isCompared}
                                onChange={() => toggleCompare(log.id)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                              />
                              <span>Compare Fleet</span>
                            </label>

                            <button
                              onClick={() => setDrawerEntity({ category: 'transport', data: log })}
                              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Specs</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setTransportCalcEntity(log);
                                setTransportCalcForm((prev) => ({
                                  ...prev,
                                  isTempControlled: log.is_temperature_controlled,
                                }));
                              }}
                              className="w-full py-2 px-3 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                              <span>Estimate Cost</span>
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
                                  `${log.vehicle_type.replace(/_/g, ' ')} (${log.capacity_kg} kg)`
                                )
                              }
                              className="w-full btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                            >
                              <span>Book Fleet</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
             CATEGORY B: COLD STORAGE HUBS
             ══════════════════════════════════════════════════════════ */}
          {activeCategory === 'cold-storage' && (
            <div className="space-y-4">
              {filteredColdStorage.length === 0 ? (
                <div className="card p-12 text-center border-slate-200 space-y-3">
                  <Warehouse className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No cold storage facilities match your search</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try clearing filters to see all available cold storage chambers in the network.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {filteredColdStorage.map((fac) => {
                    const isCompared = selectedForCompare.includes(fac.id);
                    const occupiedKg = fac.total_capacity_kg - fac.available_capacity_kg;
                    const utilizationPct = Math.round((occupiedKg / fac.total_capacity_kg) * 100);

                    return (
                      <div
                        key={fac.id}
                        className="card p-6 space-y-4 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between border-slate-200"
                      >
                        <div className="space-y-3">
                          {/* Title & Location */}
                          <div className="pb-3 border-b border-slate-100 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                                {fac.facility_name}
                              </h3>
                              <span className="badge-blue text-[10px] whitespace-nowrap">
                                {fac.temperature_range_celsius}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{fac.location_taluka}, {fac.location_district}</span>
                            </div>
                          </div>

                          {/* Visual Utilization Progress Bar */}
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">Capacity Utilization:</span>
                              <span className="font-bold text-slate-800">{utilizationPct}% Occupied</span>
                            </div>

                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  utilizationPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${utilizationPct}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <span className="text-emerald-700 font-bold">
                                Available: {Math.round(fac.available_capacity_kg / 1000)} MT
                              </span>
                              <span className="text-slate-400">
                                Total: {Math.round(fac.total_capacity_kg / 1000)} MT
                              </span>
                            </div>
                          </div>

                          {/* Chamber Specs & Pricing */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Storage Tariff:</span>
                              <span className="font-mono font-bold text-slate-900">
                                ₹{fac.storage_rate_per_kg_per_month} / kg / month
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Humidity SLA:</span>
                              <span className="font-medium text-slate-700">{fac.humidity_range_pct}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Min Duration:</span>
                              <span className="font-medium text-slate-700">{fac.min_holding_days} Days Holding</span>
                            </div>
                            <div className="pt-1.5 border-t border-slate-100">
                              <span className="text-slate-400 text-[10px] block mb-1">Suitable Crops:</span>
                              <div className="flex flex-wrap gap-1">
                                {fac.compatible_commodities.split(',').map((crop, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-semibold"
                                  >
                                    {crop.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer text-xs font-medium select-none">
                              <input
                                type="checkbox"
                                checked={isCompared}
                                onChange={() => toggleCompare(fac.id)}
                                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                              />
                              <span>Compare Facility</span>
                            </label>

                            <button
                              onClick={() => setDrawerEntity({ category: 'cold-storage', data: fac })}
                              className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Details</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setStorageCalcEntity(fac)}
                              className="w-full py-2 px-3 rounded-xl border border-blue-300 text-blue-800 bg-blue-50/50 hover:bg-blue-100/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                              <span>Estimate Cost</span>
                            </button>

                            <button
                              onClick={() =>
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
                              className="w-full btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700"
                            >
                              <span>Book Storage</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
             CATEGORY C: PROCESSING PLANTS
             ══════════════════════════════════════════════════════════ */}
          {activeCategory === 'processing' && (
            <div className="space-y-4">
              {filteredProcessing.length === 0 ? (
                <div className="card p-12 text-center border-slate-200 space-y-3">
                  <Factory className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No agro-processing units match your search</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try clearing filters to see all regional pulping, paste, and dehydration facilities.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {filteredProcessing.map((proc) => {
                    const isCompared = selectedForCompare.includes(proc.id);

                    return (
                      <div
                        key={proc.id}
                        className="card p-6 space-y-4 hover:border-purple-300 hover:shadow-lg transition-all flex flex-col justify-between border-slate-200"
                      >
                        <div className="space-y-3">
                          {/* Title & Tag */}
                          <div className="pb-3 border-b border-slate-100 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                                {proc.facility_name}
                              </h3>
                              <span className="badge-purple text-[10px] whitespace-nowrap">
                                {proc.facility_type.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{proc.location_taluka}, {proc.location_district}</span>
                            </div>
                          </div>

                          {/* Technical & Intake Metrics */}
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Daily Intake Capacity:</span>
                              <span className="font-bold text-slate-900">
                                {proc.daily_capacity_kg.toLocaleString()} kg / day
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Available Slots Today:</span>
                              <span className="font-extrabold text-emerald-700">
                                {proc.available_capacity_kg.toLocaleString()} kg ready
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                              <span className="text-slate-500">Processing Fee:</span>
                              <span className="font-mono font-black text-purple-800 text-sm">
                                ₹{proc.processing_charge_per_kg} / kg raw
                              </span>
                            </div>
                          </div>

                          {/* Output Specifications */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Target Output Product:</span>
                              <span className="font-bold text-slate-800 truncate max-w-[150px]">
                                {proc.output_product_name}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Recovery Ratio:</span>
                              <span className="font-semibold text-emerald-700">
                                {(proc.output_recovery_ratio * 100).toFixed(1)}% Yield
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Accepted Crop Grades:</span>
                              <span className="font-medium text-slate-700">Grade {proc.accepted_grades}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer text-xs font-medium select-none">
                              <input
                                type="checkbox"
                                checked={isCompared}
                                onChange={() => toggleCompare(proc.id)}
                                className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                              />
                              <span>Compare Plant</span>
                            </label>

                            <button
                              onClick={() => setDrawerEntity({ category: 'processing', data: proc })}
                              className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Specs</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setProcCalcEntity(proc)}
                              className="w-full py-2 px-3 rounded-xl border border-purple-300 text-purple-800 bg-purple-50/50 hover:bg-purple-100/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                              <span>Estimate Yield</span>
                            </button>

                            <button
                              onClick={() =>
                                handleOpenBooking(
                                  'PROCESSING',
                                  proc.id,
                                  proc.facility_name,
                                  proc.processing_charge_per_kg,
                                  proc.available_capacity_kg,
                                  `${proc.location_taluka}, ${proc.location_district}`,
                                  'INR/kg raw',
                                  `${proc.output_product_name} (${(proc.output_recovery_ratio * 100).toFixed(1)}% recovery)`
                                )
                              }
                              className="w-full btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700"
                            >
                              <span>Book Slot</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ──────────────────────────────────────────────────────────
         6. REGIONAL LOGISTICS COVERAGE MAP & CLUSTER VISUALIZATION
         ────────────────────────────────────────────────────────── */}
      <div className="card p-6 border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>Maharashtra Regional Logistics Grid & Hub Proximity</span>
            </h3>
            <p className="text-xs text-slate-500">
              Verified operating corridors with GPS-tracked farmgate collection and terminal delivery.
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit">
            ● 4 Core Hubs Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Niphad & Pimpalgaon Hub</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">18 km</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Primary pre-cooling cluster, APMC onion/tomato yards, and rural tempo fleets.
            </p>
            <div className="text-[10px] text-emerald-700 font-semibold">● 2 Cold Rooms • 2 Fleets</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Dindori Mega Food Corridor</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">42 km</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Aseptic puree plants, pulp extraction units, and high-capacity packhouses.
            </p>
            <div className="text-[10px] text-purple-700 font-semibold">● 2 Processing Plants</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Pune & Hadapsar Hub</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">190 km</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Institutional wholesale markets, retail distribution centers, and reefer transit.
            </p>
            <div className="text-[10px] text-blue-700 font-semibold">● Inter-District Reefer Transit</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Mumbai MMR & JNPT Port</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">210 km</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Vashi APMC terminal, metropolitan retail chain stores, and export container freight.
            </p>
            <div className="text-[10px] text-teal-700 font-semibold">● Multi-Temp 10T Fleets</div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
         7. FLOATING COMPARISON TRAY & COMPARISON MODAL
         ────────────────────────────────────────────────────────── */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">
              {selectedForCompare.length} {activeCategory.replace('-', ' ')} {selectedForCompare.length === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all cursor-pointer"
          >
            Compare Side-by-Side
          </button>

          <button
            onClick={() => setSelectedForCompare([])}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Multi-Provider Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  <span>Infrastructure Specification Comparison Matrix</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Side-by-side technical evaluation across selected service providers.
                </p>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {selectedForCompare.map((id) => {
                if (activeCategory === 'transport') {
                  const item = logistics.find((l) => l.id === id);
                  if (!item) return null;
                  return (
                    <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="font-black text-slate-900 text-sm">{item.provider_name}</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Vehicle Type:</span>
                          <span className="font-bold">{item.vehicle_type.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payload:</span>
                          <span className="font-bold">{item.capacity_kg} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tariff:</span>
                          <span className="font-bold text-emerald-700">₹{item.per_km_rate_per_kg}/km/kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Min Fare:</span>
                          <span className="font-bold">₹{item.minimum_fare}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Chilled:</span>
                          <span className="font-bold">{item.is_temperature_controlled ? 'Yes (Reefer)' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Base:</span>
                          <span className="font-bold">{item.base_district}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (activeCategory === 'cold-storage') {
                  const item = coldStorage.find((c) => c.id === id);
                  if (!item) return null;
                  return (
                    <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="font-black text-slate-900 text-sm">{item.facility_name}</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Available:</span>
                          <span className="font-bold text-emerald-700">{item.available_capacity_kg / 1000} MT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total:</span>
                          <span className="font-bold">{item.total_capacity_kg / 1000} MT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tariff:</span>
                          <span className="font-bold text-blue-700">₹{item.storage_rate_per_kg_per_month}/kg/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Temp Range:</span>
                          <span className="font-bold">{item.temperature_range_celsius}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Humidity:</span>
                          <span className="font-bold">{item.humidity_range_pct}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Location:</span>
                          <span className="font-bold">{item.location_taluka}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (activeCategory === 'processing') {
                  const item = processing.find((p) => p.id === id);
                  if (!item) return null;
                  return (
                    <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="font-black text-slate-900 text-sm">{item.facility_name}</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tech Type:</span>
                          <span className="font-bold">{item.facility_type.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Daily Intake:</span>
                          <span className="font-bold">{item.daily_capacity_kg} kg/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Processing Fee:</span>
                          <span className="font-bold text-purple-700">₹{item.processing_charge_per_kg}/kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Recovery Ratio:</span>
                          <span className="font-bold">{(item.output_recovery_ratio * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Output Product:</span>
                          <span className="font-bold">{item.output_product_name}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         8. DEDICATED CALCULATOR MODAL A: TRANSPORT COST CALCULATOR
         ────────────────────────────────────────────────────────── */}
      {transportCalcEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <span>Freight & Transportation Cost Calculator</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Fleet: <strong className="text-slate-800">{transportCalcEntity.provider_name}</strong> ({transportCalcEntity.vehicle_type.replace(/_/g, ' ')})
                </p>
              </div>
              <button
                onClick={() => setTransportCalcEntity(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Pickup Location:</label>
                  <input
                    type="text"
                    value={transportCalcForm.pickup}
                    onChange={(e) => setTransportCalcForm({ ...transportCalcForm, pickup: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="label">Destination Yard / Mandi:</label>
                  <select
                    value={transportCalcForm.destination}
                    onChange={(e) => {
                      const dest = e.target.value;
                      let km = 18;
                      if (dest.includes('18 km')) km = 18;
                      if (dest.includes('35 km')) km = 35;
                      if (dest.includes('42 km')) km = 42;
                      if (dest.includes('195 km')) km = 195;
                      setTransportCalcForm({ ...transportCalcForm, destination: dest, distanceKm: km });
                    }}
                    className="input-field text-xs font-semibold"
                  >
                    <option value="Pimpalgaon Baswant APMC (18 km)">Pimpalgaon Baswant APMC (18 km)</option>
                    <option value="Nashik Central Market Yard (35 km)">Nashik Central Market Yard (35 km)</option>
                    <option value="Sahyadri Mega Food Park Dindori (42 km)">Sahyadri Mega Food Park Dindori (42 km)</option>
                    <option value="Vashi APMC Terminal Navi Mumbai (195 km)">Vashi APMC Terminal Navi Mumbai (195 km)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Produce Quantity (kg):</label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    value={transportCalcForm.quantityKg}
                    onChange={(e) => setTransportCalcForm({ ...transportCalcForm, quantityKg: Math.max(100, Number(e.target.value)) })}
                    className="input-field font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="label">One-Way Distance (km):</label>
                  <input
                    type="number"
                    min={5}
                    value={transportCalcForm.distanceKm}
                    onChange={(e) => setTransportCalcForm({ ...transportCalcForm, distanceKm: Math.max(1, Number(e.target.value)) })}
                    className="input-field font-mono font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Calculation Breakdown */}
              {(() => {
                const est = calculateTransportEstimate(
                  transportCalcEntity,
                  transportCalcForm.quantityKg,
                  transportCalcForm.distanceKm
                );

                return (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                      <span className="font-bold text-emerald-950 text-sm">Estimated Total Freight</span>
                      <span className="font-mono font-black text-emerald-900 text-xl">₹{est.totalCost.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-emerald-800/80">Vehicle Capacity:</span>
                        <strong className="block text-emerald-950">{transportCalcEntity.capacity_kg.toLocaleString()} kg</strong>
                      </div>
                      <div>
                        <span className="text-emerald-800/80">Trips / Vehicles Required:</span>
                        <strong className="block text-emerald-950">{est.trips} {est.trips === 1 ? 'Trip' : 'Trips'}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-800/80">Effective Unit Freight:</span>
                        <strong className="block text-emerald-950">₹{est.costPerKg} / kg</strong>
                      </div>
                      <div>
                        <span className="text-emerald-800/80">Estimated Transit Time:</span>
                        <strong className="block text-emerald-950">~{est.estHours} Hours</strong>
                      </div>
                    </div>

                    {transportCalcForm.quantityKg > transportCalcEntity.capacity_kg && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        Notice: Requested quantity ({transportCalcForm.quantityKg} kg) exceeds single-vehicle payload ({transportCalcEntity.capacity_kg} kg). Total is computed across {est.trips} required trips.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransportCalcEntity(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const ent = transportCalcEntity;
                  setTransportCalcEntity(null);
                  handleOpenBooking(
                    'LOGISTICS',
                    ent.id,
                    ent.provider_name,
                    ent.per_km_rate_per_kg,
                    ent.capacity_kg,
                    ent.base_district,
                    'INR/km/kg',
                    `${ent.vehicle_type.replace(/_/g, ' ')} (${ent.capacity_kg} kg)`
                  );
                }}
                className="btn-primary text-xs"
              >
                Proceed to Book Fleet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         9. DEDICATED CALCULATOR MODAL B: STORAGE COST CALCULATOR
         ────────────────────────────────────────────────────────── */}
      {storageCalcEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <span>Cold Storage Holding Cost Calculator</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Facility: <strong className="text-slate-800">{storageCalcEntity.facility_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setStorageCalcEntity(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Storage Quantity (kg):</label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    value={storageCalcForm.quantityKg}
                    onChange={(e) => setStorageCalcForm({ ...storageCalcForm, quantityKg: Math.max(100, Number(e.target.value)) })}
                    className="input-field font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="label">Holding Duration (Days):</label>
                  <input
                    type="number"
                    min={storageCalcEntity.min_holding_days}
                    max={storageCalcEntity.max_holding_days}
                    value={storageCalcForm.durationDays}
                    onChange={(e) => setStorageCalcForm({ ...storageCalcForm, durationDays: Math.max(1, Number(e.target.value)) })}
                    className="input-field font-mono font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Calculation Breakdown */}
              {(() => {
                const est = calculateStorageEstimate(
                  storageCalcEntity,
                  storageCalcForm.quantityKg,
                  storageCalcForm.durationDays
                );

                return (
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                      <span className="font-bold text-blue-950 text-sm">Estimated Total Storage Fee</span>
                      <span className="font-mono font-black text-blue-900 text-xl">₹{est.totalCost.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-blue-800/80">Daily Holding Rate:</span>
                        <strong className="block text-blue-950">₹{est.dailyRate} / kg / day</strong>
                      </div>
                      <div>
                        <span className="text-blue-800/80">Monthly Base Tariff:</span>
                        <strong className="block text-blue-950">₹{storageCalcEntity.storage_rate_per_kg_per_month} / kg / month</strong>
                      </div>
                      <div>
                        <span className="text-blue-800/80">Total Per-kg Cost:</span>
                        <strong className="block text-blue-950">₹{est.costPerKg} / kg for {storageCalcForm.durationDays} days</strong>
                      </div>
                      <div>
                        <span className="text-blue-800/80">Facility Availability:</span>
                        <strong className={`block ${est.isCapacitySufficient ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {est.isCapacitySufficient ? 'Space Available' : 'Capacity Exceeded'}
                        </strong>
                      </div>
                    </div>

                    {!est.isCapacitySufficient && (
                      <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        Warning: Requested quantity exceeds currently available chamber capacity ({storageCalcEntity.available_capacity_kg.toLocaleString()} kg).
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStorageCalcEntity(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const ent = storageCalcEntity;
                  setStorageCalcEntity(null);
                  handleOpenBooking(
                    'COLD_STORAGE',
                    ent.id,
                    ent.facility_name,
                    ent.storage_rate_per_kg_per_month,
                    ent.available_capacity_kg,
                    `${ent.location_taluka}, ${ent.location_district}`,
                    'INR/kg/month',
                    `${ent.temperature_range_celsius} (${ent.compatible_commodities})`
                  );
                }}
                className="btn-primary text-xs bg-blue-600 hover:bg-blue-700"
              >
                Proceed to Reserve Space
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         10. DEDICATED ESTIMATOR MODAL C: PROCESSING ESTIMATOR
         ────────────────────────────────────────────────────────── */}
      {procCalcEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-purple-600" />
                  <span>Agro-Processing Fee & Yield Estimator</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Unit: <strong className="text-slate-800">{procCalcEntity.facility_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setProcCalcEntity(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="label">Raw Crop Intake Batch (kg):</label>
                <input
                  type="number"
                  min={500}
                  step={500}
                  value={procCalcForm.batchQtyKg}
                  onChange={(e) => setProcCalcForm({ ...procCalcForm, batchQtyKg: Math.max(100, Number(e.target.value)) })}
                  className="input-field font-mono font-bold"
                />
              </div>

              {/* Dynamic Yield Breakdown */}
              {(() => {
                const est = calculateProcessingEstimate(procCalcEntity, procCalcForm.batchQtyKg);

                return (
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
                      <span className="font-bold text-purple-950 text-sm">Estimated Total Processing Charge</span>
                      <span className="font-mono font-black text-purple-900 text-xl">₹{est.totalCharge.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-purple-800/80">Processing Tariff:</span>
                        <strong className="block text-purple-950">₹{procCalcEntity.processing_charge_per_kg} / kg raw</strong>
                      </div>
                      <div>
                        <span className="text-purple-800/80">Recovery Ratio:</span>
                        <strong className="block text-purple-950">{(procCalcEntity.output_recovery_ratio * 100).toFixed(1)}% Yield</strong>
                      </div>
                      <div>
                        <span className="text-purple-800/80">Expected Output Yield:</span>
                        <strong className="block text-emerald-800 font-black">{est.expectedOutputKg.toLocaleString()} kg</strong>
                      </div>
                      <div>
                        <span className="text-purple-800/80">Target Commodity:</span>
                        <strong className="block text-purple-950">{procCalcEntity.output_product_name}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProcCalcEntity(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const ent = procCalcEntity;
                  setProcCalcEntity(null);
                  handleOpenBooking(
                    'PROCESSING',
                    ent.id,
                    ent.facility_name,
                    ent.processing_charge_per_kg,
                    ent.available_capacity_kg,
                    `${ent.location_taluka}, ${ent.location_district}`,
                    'INR/kg raw',
                    `${ent.output_product_name} (${(ent.output_recovery_ratio * 100).toFixed(1)}% recovery)`
                  );
                }}
                className="btn-primary text-xs bg-purple-600 hover:bg-purple-700"
              >
                Proceed to Book Processing Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         11. SLIDE-OVER FACILITY DETAILS DRAWER
         ────────────────────────────────────────────────────────── */}
      {drawerEntity && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {drawerEntity.category.toUpperCase().replace('-', ' ')} PROFILE
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2 font-display">
                    {'provider_name' in drawerEntity.data ? drawerEntity.data.provider_name : drawerEntity.data.facility_name}
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerEntity(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contact & Verification Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="font-bold text-slate-800">Operational Yard & Fleet Verification</div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Official Dispatch: +91 {drawerEntity.data.contact_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>APEDA & FSSAI Registered Institutional Entity</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Real-time GPS Tracking & Digital Weightment Logs</span>
                </div>
              </div>

              {/* Service Standards */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Service Level Commitments (SLA)
                </h4>
                <div className="space-y-2 text-slate-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Gate weightment receipt generated within 15 minutes of intake.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Pre-agreed transparent tariffs with zero hidden detention surcharges.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Seamless integration with Agri2Value Execution Tracker order state.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={() => setDrawerEntity(null)}
                className="w-full btn-secondary text-xs py-2.5"
              >
                Close Profile Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         12. UNIFIED 5-STEP SMART BOOKING WORKFLOW MODAL
         ────────────────────────────────────────────────────────── */}
      {bookingEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {bookingEntity.type.replace(/_/g, ' ')} RESERVATION WORKFLOW
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 font-display">
                  {bookingEntity.name}
                </h3>
              </div>
              <button
                onClick={() => setBookingEntity(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="flex items-center justify-between text-xs pb-1">
              {[
                { num: 1, label: 'Service' },
                { num: 2, label: 'Produce' },
                { num: 3, label: 'Schedule' },
                { num: 4, label: 'Tariff' },
                { num: 5, label: 'Done' },
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      bookingStep === s.num
                        ? 'bg-emerald-600 text-white shadow-md'
                        : bookingStep > s.num
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {bookingStep > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className={`text-[10px] font-semibold ${
                    bookingStep === s.num ? 'text-emerald-800 font-bold' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: Service Selection Review */}
            {bookingStep === 1 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="font-bold text-slate-900 text-sm">Provider Credentials & Base</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service Category:</span>
                    <strong className="text-slate-800">{bookingEntity.type.replace(/_/g, ' ')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operating Base:</span>
                    <strong className="text-slate-800">{bookingEntity.baseLocation}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Tariff:</span>
                    <strong className="text-emerald-700 font-mono">₹{bookingEntity.unitPrice} / {bookingEntity.pricingUnit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Specifications:</span>
                    <strong className="text-slate-800">{bookingEntity.specs}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Instant booking capacity is pre-locked for your farmer account.</span>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setBookingStep(2)}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    <span>Continue to Crop Allocation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Agricultural Details & Lot Allocation */}
            {bookingStep === 2 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="label">Select Produce Lot to Allocate:</label>
                  <select
                    value={bookingCropLotId}
                    onChange={(e) => {
                      const lotId = e.target.value;
                      setBookingCropLotId(lotId);
                      const lot = cropLots.find((l) => l.id === lotId);
                      if (lot) {
                        setBookingQtyKg(Math.min(bookingEntity.capacityAvailable, lot.quantity_kg_normalized || 4000));
                      }
                    }}
                    className="input-field text-xs font-semibold"
                    required
                  >
                    {cropLots.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.crop_name} {l.variety ? `(${l.variety})` : ''} — {Number(l.quantity_kg_normalized).toLocaleString()} kg (Grade {l.quality_grade || 'Ungraded'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Allocated Quantity for this Booking (kg):</label>
                  <input
                    type="number"
                    min={100}
                    max={bookingEntity.capacityAvailable}
                    value={bookingQtyKg}
                    onChange={(e) => setBookingQtyKg(Number(e.target.value))}
                    className="input-field font-mono font-bold"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Available facility limit: {bookingEntity.capacityAvailable.toLocaleString()} kg
                  </span>
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setBookingStep(1)}
                    className="btn-secondary text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setBookingStep(3)}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    <span>Continue to Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Service Requirements & Scheduling */}
            {bookingStep === 3 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="label">Preferred Service Date:</label>
                  <input
                    type="date"
                    value={bookingScheduledDate}
                    onChange={(e) => setBookingScheduledDate(e.target.value)}
                    className="input-field font-medium"
                    required
                  />
                </div>

                {bookingEntity.type === 'LOGISTICS' && (
                  <div className="space-y-3">
                    <div>
                      <label className="label">Farm Pickup Location:</label>
                      <input
                        type="text"
                        value={bookingPickupLocation}
                        onChange={(e) => setBookingPickupLocation(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Destination Delivery Point:</label>
                      <input
                        type="text"
                        value={bookingDeliveryLocation}
                        onChange={(e) => setBookingDeliveryLocation(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                )}

                {bookingEntity.type === 'COLD_STORAGE' && (
                  <div>
                    <label className="label">Requested Holding Duration (Days):</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={bookingDurationDays}
                      onChange={(e) => setBookingDurationDays(Number(e.target.value))}
                      className="input-field font-mono font-bold"
                    />
                  </div>
                )}

                {bookingEntity.type === 'PROCESSING' && (
                  <div>
                    <label className="label">Target Output Product & Specification:</label>
                    <input
                      type="text"
                      value={bookingProcessingSpec}
                      onChange={(e) => setBookingProcessingSpec(e.target.value)}
                      className="input-field"
                    />
                  </div>
                )}

                <div>
                  <label className="label">Gate Instructions & Loading Notes:</label>
                  <textarea
                    rows={2}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Provide dock timing, crate type, or vehicle access details..."
                    className="input-field resize-none text-xs"
                  />
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setBookingStep(2)}
                    className="btn-secondary text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setBookingStep(4)}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    <span>Review Tariff Summary</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Cost Summary & Terms */}
            {bookingStep === 4 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 text-sm">Commercial Tariff Summary</div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Service Category:</span>
                      <strong className="text-slate-800">{bookingEntity.type.replace(/_/g, ' ')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Allocated Quantity:</span>
                      <strong className="text-slate-800">{bookingQtyKg.toLocaleString()} kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Agreed Unit Tariff:</span>
                      <strong className="text-emerald-700 font-mono">₹{bookingEntity.unitPrice} / {bookingEntity.pricingUnit}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Scheduled Date:</span>
                      <strong className="text-slate-800">{bookingScheduledDate}</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                      <span className="text-slate-800">Settlement SLA:</span>
                      <span className="text-emerald-700">Digital NEFT / RTGS Post-Weightment</span>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-2 text-slate-700 cursor-pointer text-xs select-none p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <input
                    type="checkbox"
                    checked={bookingAgreementChecked}
                    onChange={(e) => setBookingAgreementChecked(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                  />
                  <span>
                    I confirm this capacity reservation with <strong>{bookingEntity.name}</strong> under Agri2Value Institutional Escrow terms.
                  </span>
                </label>

                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setBookingStep(3)}
                    className="btn-secondary text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={!bookingAgreementChecked || bookingSubmitting}
                    className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {bookingSubmitting ? 'Submitting Reservation...' : 'Confirm & Dispatch Booking'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Confirmation Reference Screen */}
            {bookingStep === 5 && (
              <div className="space-y-5 text-center py-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {bookingConfirmedRef}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 font-display">
                    Reservation Dispatched Successfully!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your capacity request has been registered with <strong>{bookingEntity.name}</strong> and linked to the Execution Tracker.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Reference:</span>
                    <span className="font-mono font-bold">{bookingConfirmedRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allocated Volume:</span>
                    <span className="font-bold">{bookingQtyKg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Date:</span>
                    <span className="font-bold">{bookingScheduledDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service Status:</span>
                    <span className="font-bold text-emerald-700">CONFIRMED_PENDING_GATE</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    onClick={() => {
                      setBookingEntity(null);
                      if (onNavigateToExecution) onNavigateToExecution();
                    }}
                    className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
                  >
                    <span>Track in Execution Tracker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setBookingEntity(null)}
                    className="btn-secondary text-xs py-2.5 px-4"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
