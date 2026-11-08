// frontend/src/components/HarvestLotsView.tsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wheat,
  Plus,
  Search,
  Calendar,
  MapPin,
  Sparkles,
  Flame,
  ArrowRight,
  CheckCircle2,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sprout,
  AlertTriangle,
  Award
} from 'lucide-react';
import type { CropLot, Farm } from '../types';

interface HarvestLotsViewProps {
  cropLots: CropLot[];
  farms: Farm[];
  onCreateLot: (farmId: string, lot: Partial<CropLot>) => Promise<void>;
  isOpenCreateModal: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
  onNavigateToDecision?: (lotId?: string) => void;
  onNavigateToRescue?: (lotId?: string) => void;
}

export const HarvestLotsView: React.FC<HarvestLotsViewProps> = ({
  cropLots,
  farms,
  onCreateLot,
  isOpenCreateModal,
  onCloseCreateModal,
  onOpenCreateModal,
  onNavigateToDecision,
  onNavigateToRescue,
}) => {
  const { t, i18n } = useTranslation();
  // Search, filter, and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmFilter, setSelectedFarmFilter] = useState('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'qty_desc' | 'qty_asc'>('date_desc');

  // URL-driven preview parameter for test automation
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isSearchModalOpen = urlParams?.get('modal') === 'add';
  const isSearchEmpty = urlParams?.get('view') === 'empty';
  const activeCropLots = isSearchEmpty ? [] : cropLots;

  // Expanded audit trails state map
  const [expandedTimelineMap, setExpandedTimelineMap] = useState<Record<string, boolean>>({});

  const toggleTimeline = (lotId: string) => {
    setExpandedTimelineMap((prev) => ({
      ...prev,
      [lotId]: !prev[lotId],
    }));
  };

  // Form state for Register Harvest Modal
  const [selectedFarmId, setSelectedFarmId] = useState(farms[0]?.id || '');
  const [cropName, setCropName] = useState('Tomato');
  const [variety, setVariety] = useState('Abhinav');
  const [quantity, setQuantity] = useState('4000');
  const [quantityUnit, setQuantityUnit] = useState('kg');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Unit conversion factors
  const unitMultipliers: Record<string, number> = {
    kg: 1,
    quintal: 100,
    tonne: 1000,
    bag: 50,
    maund: 37.3242,
  };

  const calculatedKg = (parseFloat(quantity) || 0) * (unitMultipliers[quantityUnit] || 1);

  // Clean raw provenance string (strips internal [DEMO_SEED] markers)
  const cleanDescription = (text?: string) => {
    if (!text) return '';
    return text.replace(/\[DEMO_SEED\]\s*/gi, '').trim();
  };

  // Map backend status enums to human-friendly labels & styling
  const formatStatus = (status: string) => {
    switch (status) {
      case 'READY_FOR_ANALYSIS':
        return {
          label: 'Ready for Analysis',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dotClass: 'bg-emerald-500 animate-pulse',
        };
      case 'DRAFT':
        return {
          label: 'Draft Lot',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          dotClass: 'bg-slate-400',
        };
      case 'ANALYZED':
        return {
          label: 'Profit Analysis Ready',
          badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
          dotClass: 'bg-sky-500',
        };
      case 'OPTION_SELECTED':
      case 'READY_TO_EXECUTE':
        return {
          label: 'Execution Selected',
          badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dotClass: 'bg-indigo-500',
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Transit / Logistics',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-500 animate-pulse',
        };
      case 'DELIVERED':
      case 'COMPLETED':
        return {
          label: 'Completed & Delivered',
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dotClass: 'bg-emerald-600',
        };
      case 'RESCUE_REQUIRED':
        return {
          label: 'Rescue Mode Active',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
          dotClass: 'bg-rose-500 animate-pulse',
        };
      default:
        return {
          label: status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
          dotClass: 'bg-slate-400',
        };
    }
  };

  // Human-friendly date formatting (e.g. 7 November 2026)
  const formatHarvestDate = (dateString?: string) => {
    if (!dateString) return 'Date unspecified';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date unspecified';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Format event title & timestamp
  const formatEventItem = (eventType: string, desc?: string, createdAt?: string) => {
    let title = 'Status Updated';
    switch (eventType) {
      case 'CREATED':
        title = 'Harvest Lot Registered';
        break;
      case 'ANALYSIS_RUN':
        title = 'Profit Evaluation Completed';
        break;
      case 'OPTION_CONFIRMED':
        title = 'Route Dispatch Confirmed';
        break;
      case 'RESCUE_TRIGGERED':
        title = 'Crop Rescue Watchdog Activated';
        break;
    }
    const timeFormatted = createdAt
      ? new Date(createdAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
    return { title, description: cleanDescription(desc), time: timeFormatted };
  };

  // Filter & Sort Logic
  const filteredAndSortedLots = useMemo(() => {
    return activeCropLots
      .filter((lot) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const farm = farms.find((f) => f.id === lot.farm_id);
          const matchCrop = lot.crop_name.toLowerCase().includes(q);
          const matchVariety = lot.variety?.toLowerCase().includes(q);
          const matchFarm = farm?.farm_name.toLowerCase().includes(q);
          if (!matchCrop && !matchVariety && !matchFarm) return false;
        }

        // Farm filter
        if (selectedFarmFilter !== 'ALL' && lot.farm_id !== selectedFarmFilter) {
          return false;
        }

        // Quality grade filter
        if (selectedGradeFilter !== 'ALL' && lot.quality_grade !== selectedGradeFilter) {
          return false;
        }

        // Status filter
        if (selectedStatusFilter !== 'ALL' && lot.status !== selectedStatusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'qty_desc') {
          return (b.quantity_kg_normalized || 0) - (a.quantity_kg_normalized || 0);
        }
        if (sortBy === 'qty_asc') {
          return (a.quantity_kg_normalized || 0) - (b.quantity_kg_normalized || 0);
        }
        if (sortBy === 'date_asc') {
          return new Date(a.harvest_date || 0).getTime() - new Date(b.harvest_date || 0).getTime();
        }
        // date_desc default
        return new Date(b.harvest_date || 0).getTime() - new Date(a.harvest_date || 0).getTime();
      });
  }, [activeCropLots, searchQuery, selectedFarmFilter, selectedGradeFilter, selectedStatusFilter, sortBy, farms]);

  // Consolidated Overview Metrics (Strictly from authenticated user's records)
  const overviewMetrics = useMemo(() => {
    const totalLots = activeCropLots.length;
    const totalKg = activeCropLots.reduce((acc, lot) => acc + (lot.quantity_kg_normalized || 0), 0);
    const readyForAnalysis = activeCropLots.filter(
      (lot) => lot.status === 'READY_FOR_ANALYSIS' || lot.status === 'DRAFT'
    ).length;
    const inAnalysisOrExecution = activeCropLots.filter(
      (lot) =>
        lot.status === 'ANALYZED' ||
        lot.status === 'OPTION_SELECTED' ||
        lot.status === 'IN_PROGRESS' ||
        lot.status === 'RESCUE_REQUIRED'
    ).length;

    return {
      totalLots,
      totalKg,
      totalTonnes: (totalKg / 1000).toFixed(2),
      readyForAnalysis,
      inAnalysisOrExecution,
    };
  }, [activeCropLots]);

  // Handle Submit with validation
  const handleSubmit = async (e: React.FormEvent) => {
    if (e.cancelable) e.preventDefault();
    setFormError(null);

    if (!selectedFarmId) {
      setFormError('Please select a registered farm holding.');
      return;
    }
    if (!cropName.trim()) {
      setFormError('Please enter a valid crop name.');
      return;
    }
    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setFormError('Quantity must be a positive number greater than 0.');
      return;
    }

    setLoading(true);
    try {
      await onCreateLot(selectedFarmId, {
        crop_name: cropName.trim(),
        variety: variety.trim() || undefined,
        quantity: numQty,
        quantity_unit: quantityUnit,
        quality_grade: qualityGrade,
        harvest_date: new Date(harvestDate).toISOString(),
        data_mode: 'real',
        notes: notes.trim() || undefined,
      });
      onCloseCreateModal();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register harvest lot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ──────────────────────────────────────────────────────────
          SECTION A — PAGE HEADER
          ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                {t('harvest.title')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {t('harvest.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="btn-primary self-start sm:self-auto flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('harvest.registerHarvest')}</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION B — COMPACT HARVEST OVERVIEW METRICS BAR
          ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Lots */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('harvest.totalLots')}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {overviewMetrics.totalLots}
            </span>
            <span className="text-xs text-slate-500 font-medium">{t('harvest.lotsRegistered', 'Lots Registered')}</span>
          </div>
        </div>

        {/* Metric 2: Total Registered Quantity */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('harvest.totalVolume')}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-800 font-mono">
              {overviewMetrics.totalKg.toLocaleString(i18n.language === 'en' ? 'en-IN' : `${i18n.language}-IN`)}
            </span>
            <span className="text-xs text-emerald-700 font-bold font-mono">
              {t('common.kg', 'kg')} ({overviewMetrics.totalTonnes} {t('common.tonnes', 'MT')})
            </span>
          </div>
        </div>

        {/* Metric 3: Ready for Analysis */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('harvest.readyAnalysis', 'Ready for Analysis')}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
              {overviewMetrics.readyForAnalysis}
            </span>
            <span className="text-xs text-slate-500 font-medium">{t('harvest.pendingDecision', 'Pending Decision')}</span>
          </div>
        </div>

        {/* Metric 4: Active Decisions / Attention */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('harvest.inProgress', 'In Analysis / Active')}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
              {overviewMetrics.inAnalysisOrExecution}
            </span>
            <span className="text-xs text-slate-500 font-medium">{t('harvest.activeDecisions', 'Active Decisions')}</span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION C — SEARCH, FILTERS & SORTING TOOLBAR
          ────────────────────────────────────────────────────────── */}
      {activeCropLots.length > 0 && (
        <div className="card p-3 sm:p-4 bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('harvest.searchPlaceholder', 'Search by crop, variety, or farm name...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Farm Filter */}
              {farms.length > 1 && (
                <select
                  value={selectedFarmFilter}
                  onChange={(e) => setSelectedFarmFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium cursor-pointer"
                >
                  <option value="ALL">{t('harvest.allFarms', 'All Farms')}</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name}
                    </option>
                  ))}
                </select>
              )}

              {/* Quality Grade Filter */}
              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium cursor-pointer"
              >
                <option value="ALL">{t('harvest.allGrades', 'All Grades')}</option>
                <option value="A">{t('common.grade', 'Grade')} A</option>
                <option value="B">{t('common.grade', 'Grade')} B</option>
                <option value="C">{t('common.grade', 'Grade')} C</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium cursor-pointer"
              >
                <option value="ALL">{t('harvest.allStatuses', 'All Statuses')}</option>
                <option value="READY_FOR_ANALYSIS">{t('harvest.readyAnalysis', 'Ready for Analysis')}</option>
                <option value="DRAFT">Draft</option>
                <option value="ANALYZED">Analysis Ready</option>
                <option value="IN_PROGRESS">In Transit</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium cursor-pointer"
              >
                <option value="date_desc">{t('harvest.latestHarvest', 'Latest Harvest')}</option>
                <option value="date_asc">{t('harvest.oldestHarvest', 'Oldest Harvest')}</option>
                <option value="qty_desc">{t('harvest.qtyHighToLow', 'Quantity (High to Low)')}</option>
                <option value="qty_asc">{t('harvest.qtyLowToHigh', 'Quantity (Low to High)')}</option>
              </select>

              {/* Reset Filters */}
              {(searchQuery || selectedFarmFilter !== 'ALL' || selectedGradeFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFarmFilter('ALL');
                    setSelectedGradeFilter('ALL');
                    setSelectedStatusFilter('ALL');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('harvest.reset', 'Reset')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          SECTION D — HARVEST LOT CARDS GRID
          ────────────────────────────────────────────────────────── */}
      {filteredAndSortedLots.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAndSortedLots.map((lot) => {
            const farm = farms.find((f) => f.id === lot.farm_id);
            const statusMeta = formatStatus(lot.status);
            const isKgUnit = lot.quantity_unit.toLowerCase() === 'kg';
            const isTimelineExpanded = !!expandedTimelineMap[lot.id];

            return (
              <div
                key={lot.id}
                className="card p-5 sm:p-7 border border-slate-200/90 hover:border-emerald-300 transition-all space-y-5 bg-white shadow-sm flex flex-col justify-between"
              >
                {/* 1. Lot Identity Header */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-xs">
                      <Sprout className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                          {lot.crop_name}
                        </h3>
                        {lot.variety && (
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                            {lot.variety}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-700">
                          {farm?.farm_name || 'Patil Krishi Farm'}
                        </span>
                        {farm && (
                          <span className="text-slate-400">
                            • {farm.village}, {farm.district}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Provenance Badge */}
                  <div className="shrink-0">
                    {lot.data_mode === 'demo' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{t('harvest.demoSeedRecord', 'Demo Seed Record')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{t('harvest.liveFarmRecord', 'Live Farm Record')}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Quantity & Conversion Section */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {t('harvest.registeredQty', 'Registered Harvest Quantity')}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                        {Number(lot.quantity).toLocaleString(i18n.language === 'en' ? 'en-IN' : `${i18n.language}-IN`)}
                      </span>
                      <span className="text-sm font-bold text-slate-600 font-mono">
                        {lot.quantity_unit}
                      </span>
                    </div>
                    {isKgUnit && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {t('harvest.standardKg', 'Standard base unit (kg)')}
                      </span>
                    )}
                  </div>

                  {/* Only show explicit normalized conversion if unit is not kg */}
                  {!isKgUnit ? (
                    <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        Normalized Base for Engine
                      </span>
                      <div className="text-lg font-black font-mono text-emerald-700 bg-white px-3 py-1 rounded-xl border border-emerald-200 inline-block">
                        = {Number(lot.quantity_kg_normalized).toLocaleString('en-IN')} kg
                      </div>
                    </div>
                  ) : (
                    <div className="sm:text-right">
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('harvest.decisionReady', 'Decision Ready')}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Attributes Grid: Quality, Status, Harvest Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Quality Grade */}
                  <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('harvest.qualityGrade', 'Quality Grade')}
                    </span>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span className="font-extrabold text-slate-900 text-sm">
                        {t('common.grade', 'Grade')} {lot.quality_grade || 'Ungraded'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {lot.quality_grade === 'A'
                        ? 'Export / Retail Fresh'
                        : lot.quality_grade === 'B'
                        ? 'Standard Mandi'
                        : 'Processing Grade'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('harvest.lifecycleStatus', 'Lifecycle Status')}
                    </span>
                    <div className="mt-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                        <span>{statusMeta.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Harvest Date */}
                  <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('harvest.harvestDate', 'Harvest Date')}
                    </span>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-slate-800 text-xs">
                        {formatHarvestDate(lot.harvest_date)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">{t('harvest.localTime', 'Local Harvest Time')}</span>
                  </div>
                </div>

                {/* 4. Notes / Condition (Cleaned from raw demo tags) */}
                {lot.notes && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 leading-relaxed">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Agronomic Notes & Storage Condition
                    </span>
                    <p>{cleanDescription(lot.notes)}</p>
                  </div>
                )}

                {/* 5. Polished Audit Trail Timeline */}
                {lot.events && lot.events.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Activity & Audit Trail ({lot.events.length})</span>
                      </span>

                      {lot.events.length > 1 && (
                        <button
                          type="button"
                          onClick={() => toggleTimeline(lot.id)}
                          className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isTimelineExpanded ? 'Show Recent Only' : 'View Full History'}</span>
                          {isTimelineExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {(isTimelineExpanded ? lot.events : lot.events.slice(0, 1)).map(
                        (evt, idx) => {
                          const eventMeta = formatEventItem(
                            evt.event_type,
                            evt.description,
                            evt.created_at
                          );
                          return (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5 text-xs"
                            >
                              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold text-slate-800 text-xs">
                                    {eventMeta.title}
                                  </span>
                                  {eventMeta.time && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {eventMeta.time}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  {eventMeta.description || 'Harvest lot recorded in system.'}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Action Buttons Bar (Critical Workflow Integrations) */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                  {/* Secondary Action: Crop Rescue Workflow */}
                  {onNavigateToRescue && (
                    <button
                      type="button"
                      onClick={() => onNavigateToRescue(lot.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
                    >
                      <Flame className="w-4 h-4 text-rose-600" />
                      <span>{t('harvest.rescueCrop', 'Crop Rescue')}</span>
                    </button>
                  )}

                  {/* Primary Action: Profit Decision Engine Workflow */}
                  <button
                    type="button"
                    onClick={() => onNavigateToDecision && onNavigateToDecision(lot.id)}
                    className="btn-primary text-xs py-2.5 px-4.5 shadow-sm justify-center flex items-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>{t('harvest.evaluateProfit', 'Analyze Profit Options')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeCropLots.length > 0 ? (
        /* No Filter Results State */
        <div className="card p-10 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-display">
            No Matching Harvest Lots Found
          </h3>
          <p className="text-xs text-slate-500">
            No crop lots matched your active search or filter selection.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedFarmFilter('ALL');
              setSelectedGradeFilter('ALL');
              setSelectedStatusFilter('ALL');
            }}
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      ) : (
        /* Zero Lots Empty State */
        <div className="card p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Wheat className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 font-display">
            No Harvest Lots Registered
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Register your first harvested produce lot with quantity and quality parameters to activate the 4-channel Profit Engine and distress watchdog.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="btn-primary inline-flex items-center gap-2 mx-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Your First Harvest</span>
          </button>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          SECTION E — REGISTER NEW HARVEST MODAL (ENHANCED & VALIDATED)
          ────────────────────────────────────────────────────────── */}
      {(isOpenCreateModal || isSearchModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-7 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Wheat className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-display">
                  Register Harvest Lot
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
              {/* Associated Farm Selection */}
              <div>
                <label className="label">Associated Farm Holding *</label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="input-field"
                  required
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name} ({f.village}, {f.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Name & Variety */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="label">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    placeholder="e.g. Tomato"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Crop Variety</label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="e.g. Abhinav Hybrid"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Quantity & Unit Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="label">Harvest Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select
                    value={quantityUnit}
                    onChange={(e) => setQuantityUnit(e.target.value)}
                    className="input-field"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="quintal">Quintal (100 kg)</option>
                    <option value="tonne">Metric Tonne (1,000 kg)</option>
                    <option value="bag">Crates / Bags (50 kg)</option>
                    <option value="maund">Maund (37.32 kg)</option>
                  </select>
                </div>
              </div>

              {/* Live Normalized Base Preview */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <span className="text-emerald-800 font-semibold">
                  Normalized Base for Engine:
                </span>
                <span className="font-mono font-extrabold text-emerald-900 text-sm">
                  {calculatedKg.toLocaleString('en-IN')} kg
                </span>
              </div>

              {/* Quality Grade & Harvest Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="label">Quality Grade</label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="input-field font-semibold"
                  >
                    <option value="A">Grade A (Export / Retail Fresh)</option>
                    <option value="B">Grade B (Standard Market)</option>
                    <option value="C">Grade C (Processing / Saucing)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Harvest Date</label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Storage Condition / Agronomic Notes */}
              <div>
                <label className="label">Storage Condition & Agronomic Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Harvested at morning cool hours, packed in crates, shaded shed storage."
                  className="input-field resize-none text-xs"
                />
              </div>

              {/* Error Alert */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
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
                      <span>Registering Lot...</span>
                    </>
                  ) : (
                    'Register Harvest Lot'
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
