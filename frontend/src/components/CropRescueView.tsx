// frontend/src/components/CropRescueView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Clock,
  Warehouse,
  CheckCircle2,
  Info,
  RefreshCw,
  Sparkles,
  CloudRain,
  Sliders,
  Settings,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Factory,
  Truck,
  Building2,
  ShieldCheck,
  TrendingUp,
  X,
  Scale,
  MapPin,
  Calendar,
  AlertCircle,
  Activity,
  Layers,
  Thermometer,
  Zap,
  Check
} from 'lucide-react';
import type {
  CropLot,
  CropRescueAssessment,
  RescuePathwayOption,
  CropRescueCustomAssumptions,
  AssumptionItem,
} from '../types';
import { api } from '../api';

interface CropRescueViewProps {
  cropLots: CropLot[];
  selectedLotId?: string;
  onLotSelect?: (lotId: string) => void;
  onNavigateToExecution?: () => void;
}

export const CropRescueView: React.FC<CropRescueViewProps> = ({
  cropLots,
  selectedLotId,
  onLotSelect,
  onNavigateToExecution,
}) => {
  const [activeLotId, setActiveLotId] = useState<string>(
    selectedLotId || cropLots[0]?.id || ''
  );
  const [assessment, setAssessment] = useState<CropRescueAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected Lot Object
  const currentLot = useMemo(() => {
    return cropLots.find(l => l.id === activeLotId) || cropLots[0];
  }, [cropLots, activeLotId]);

  // Phase 6 Configurable Assumptions Drawer
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [customAssumptions, setCustomAssumptions] = useState<CropRescueCustomAssumptions>({
    ambient_shelf_life_days: 4,
    rainfall_alert_threshold_mm: 25,
    mandi_price_slump_threshold_pct: 22,
    cold_storage_monthly_rate_per_kg: 0.85,
    processing_recovery_pct: 92.5,
  });

  // What-If Scenario Simulator State
  const [scenarioPriceSlumpPct, setScenarioPriceSlumpPct] = useState<number>(22);
  const [scenarioRainIntensity, setScenarioRainIntensity] = useState<'MILD' | 'MODERATE' | 'SEVERE'>('MODERATE');
  const [scenarioShelfLifeDays, setScenarioShelfLifeDays] = useState<number>(3);

  // Expanded deductions per pathway
  const [expandedPathwayIndex, setExpandedPathwayIndex] = useState<number | null>(null);

  // Emergency Dispatch Workflow Modal State
  const [dispatchModalPathway, setDispatchModalPathway] = useState<RescuePathwayOption | null>(null);
  const [dispatchScheduledWindow, setDispatchScheduledWindow] = useState<string>('IMMEDIATE_6H');
  const [dispatchNotes, setDispatchNotes] = useState<string>('Urgent rescue dispatch requested under Phase 6 protocol.');
  const [dispatchSubmitting, setDispatchSubmitting] = useState<boolean>(false);
  const [dispatchedRefCode, setDispatchedRefCode] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLotId && selectedLotId !== activeLotId) {
      setActiveLotId(selectedLotId);
    }
  }, [selectedLotId]);

  const loadAssessment = async (lotId: string, custom?: CropRescueCustomAssumptions) => {
    if (!lotId) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      let data: CropRescueAssessment;
      if (custom) {
        data = await api.assessCropRescueCustom(lotId, custom);
      } else {
        data = await api.getCropRescueAssessment(lotId);
      }
      setAssessment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate crop rescue urgency');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeLotId) {
      loadAssessment(activeLotId, customAssumptions);
    }
  }, [activeLotId]);

  const handleSelectLot = (id: string) => {
    setActiveLotId(id);
    if (onLotSelect) onLotSelect(id);
  };

  const handleApplyCustomAssumptions = () => {
    setShowConfigDrawer(false);
    if (activeLotId) {
      loadAssessment(activeLotId, customAssumptions);
    }
  };

  const handleResetAssumptions = () => {
    const defaults: CropRescueCustomAssumptions = {
      ambient_shelf_life_days: 4,
      rainfall_alert_threshold_mm: 25,
      mandi_price_slump_threshold_pct: 22,
      cold_storage_monthly_rate_per_kg: 0.85,
      processing_recovery_pct: 92.5,
    };
    setCustomAssumptions(defaults);
    if (activeLotId) {
      loadAssessment(activeLotId, defaults);
    }
  };

  // Submit Emergency Dispatch
  const handleConfirmDispatch = async () => {
    if (!dispatchModalPathway || !assessment) return;
    setDispatchSubmitting(true);
    try {
      const payload: any = {
        crop_lot_id: assessment.crop_lot_id,
        route_type: dispatchModalPathway.route_type,
        requested_quantity_kg: assessment.quantity_kg,
        notes: `Urgent Crop Rescue Plan: Initiated under ${dispatchModalPathway.title} [Window: ${dispatchScheduledWindow}]. ${dispatchNotes}`,
      };

      if (dispatchModalPathway.route_type === 'DIRECT_BUYER_FAST' && dispatchModalPathway.target_entity_id) {
        payload.buyer_id = dispatchModalPathway.target_entity_id;
      } else if (dispatchModalPathway.route_type === 'COLD_STORAGE_BUFFER' && dispatchModalPathway.target_entity_id) {
        payload.cold_storage_facility_id = dispatchModalPathway.target_entity_id;
      } else if (dispatchModalPathway.route_type === 'PROCESSING' && dispatchModalPathway.target_entity_id) {
        payload.processing_facility_id = dispatchModalPathway.target_entity_id;
      }

      await api.createExecutionRequest(payload);
      const generatedRef = `RSC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setDispatchedRefCode(generatedRef);
      setSuccessMessage(`Rescue order #${generatedRef} for ${dispatchModalPathway.title} successfully lodged in Execution Network!`);
    } catch (err: any) {
      alert(`Rescue order failed: ${err.message}`);
    } finally {
      setDispatchSubmitting(false);
    }
  };

  // What-If Scenario Recalculations
  const scenarioCalculations = useMemo(() => {
    if (!assessment) return null;
    const baseQuantity = assessment.quantity_kg || 4000;
    const baseRate = 18.00;
    const grossBaseline = baseQuantity * baseRate;

    // Projected Mandi Liquidation
    const mandiProjectedRate = Math.max(10, baseRate * (1 - scenarioPriceSlumpPct / 100));
    const mandiProjectedGross = baseQuantity * mandiProjectedRate;
    const mandiProjectedNet = mandiProjectedGross - 3200; // transport & hamali

    // Projected Processing Salvage
    const procRate = 18.00; // fixed factory contract
    const procNet = Math.round(grossBaseline - 5200); // freight & pulping

    // Urgency score dynamic projection
    let simulatedUrgency = 70;
    if (scenarioRainIntensity === 'SEVERE') simulatedUrgency += 18;
    if (scenarioRainIntensity === 'MODERATE') simulatedUrgency += 10;
    if (scenarioShelfLifeDays <= 2) simulatedUrgency += 12;
    if (scenarioPriceSlumpPct >= 25) simulatedUrgency += 8;
    simulatedUrgency = Math.min(100, Math.max(20, simulatedUrgency));

    const valueProtected = procNet - mandiProjectedNet;

    return {
      grossBaseline,
      mandiProjectedNet,
      procNet,
      simulatedUrgency,
      valueProtected,
      mandiProjectedRate: mandiProjectedRate.toFixed(2),
    };
  }, [assessment, scenarioPriceSlumpPct, scenarioRainIntensity, scenarioShelfLifeDays]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ──────────────────────────────────────────────────────────
         1. EMERGENCY HERO COMMAND BANNER
         ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 md:p-10 border border-rose-800/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                Emergency Salvage Response Active
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-amber-200 border border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Phase 6 Grounded Rules Protocol
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800">
                CRITICAL URGENCY • 85/100
              </span>
            </div>
          </div>

          {/* Title & Headline */}
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-rose-950/50 flex-shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight text-white">
                Crop Rescue Intelligence
              </h1>
            </div>
            <p className="text-sm sm:text-base md:text-lg font-semibold text-rose-300">
              Protect Your Harvest. Recover Your Value. (फसल बचाव मोड)
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Detect emerging agricultural risks, evaluate emergency salvage opportunities, and take timely action to protect your harvest and minimize financial losses.
            </p>
          </div>

          {/* Quick Context Strip */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span className="text-slate-200 font-medium">Assessing Lot: <strong>{currentLot?.crop_name} ({currentLot?.variety || 'Red'})</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span className="text-slate-200 font-medium">Quantity: <strong>{currentLot?.quantity_kg_normalized.toLocaleString()} kg</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200 font-medium">Safe Window: <strong>24 Hours</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
         2. AGRICULTURAL EMERGENCY OVERVIEW (4 COMPACT CARDS)
         ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Harvest At Risk */}
        <div className="card p-5 border-slate-200 hover:border-rose-400 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Harvest At Risk</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              {assessment ? assessment.quantity_kg.toLocaleString() : '4,000'} <span className="text-sm font-semibold text-slate-500">kg</span>
            </div>
            <div className="text-xs text-rose-700 font-bold flex items-center gap-1 mt-1">
              <span>{assessment?.crop_name || 'Tomato'} (Grade {assessment?.quality_grade || 'A'})</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>100% Crop Exposed</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
        </div>

        {/* Card 2: Urgency Index */}
        <div className="card p-5 border-slate-200 hover:border-amber-400 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Urgency Index</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 font-display font-mono">
              {assessment?.urgency_score || 85} <span className="text-sm font-semibold text-slate-400">/ 100</span>
            </div>
            <div className="text-xs text-rose-700 font-bold flex items-center gap-1 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                {assessment?.urgency_level || 'CRITICAL'}
              </span>
              <span>Action in &lt; 24h</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Rapid Shelf-Life Decay</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
        </div>

        {/* Card 3: Time to Safety */}
        <div className="card p-5 border-slate-200 hover:border-blue-400 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Time To Safety</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              24 <span className="text-sm font-semibold text-slate-500">Hours</span>
            </div>
            <div className="text-xs text-blue-700 font-bold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Prior to Fungal Rot Spike</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>High Confidence Forecast</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
        </div>

        {/* Card 4: Potential Value At Risk */}
        <div className="card p-5 border-slate-200 hover:border-purple-400 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Value At Risk</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display font-mono">
              ₹72,000
            </div>
            <div className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
              <span>Potential Loss: ₹24,000</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Salvage Plan Avoids Loss</span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
         3. HARVEST LOT SELECTION & CUSTOM ASSUMPTIONS TOOLBAR
         ────────────────────────────────────────────────────────── */}
      <div className="card p-4 sm:p-5 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Selected Harvest Lot:
          </label>
          <select
            value={activeLotId}
            onChange={(e) => handleSelectLot(e.target.value)}
            className="input-field text-xs font-semibold py-2 max-w-sm"
          >
            {cropLots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.crop_name} {lot.variety ? `(${lot.variety})` : ''} — {lot.quantity_kg_normalized.toLocaleString()} kg [Grade {lot.quality_grade || 'A'}]
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfigDrawer(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Customize Assumptions</span>
          </button>

          <button
            onClick={() => activeLotId && loadAssessment(activeLotId, customAssumptions)}
            disabled={loading || !activeLotId}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-evaluate</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          {onNavigateToExecution && (
            <button
              onClick={onNavigateToExecution}
              className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all cursor-pointer"
            >
              Track in Execution Tracker →
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center card border-slate-200 space-y-3">
          <div className="w-10 h-10 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-800">
            Evaluating spoilage timeline, precipitation threat, and APMC Mandi price slumps...
          </p>
        </div>
      ) : assessment ? (
        <div className="space-y-6">

          {/* ──────────────────────────────────────────────────────────
             4. INTELLIGENT URGENCY INDEX & ROOT CAUSES COCKPIT
             ────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Urgency Gauge & Factor Decomposition */}
            <div className="card p-6 border-slate-200 space-y-5 bg-gradient-to-b from-white to-rose-50/20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-600" />
                  <span>Urgency Index Cockpit</span>
                </span>
                <span className="badge-red text-[10px]">
                  {assessment.urgency_level}
                </span>
              </div>

              {/* Urgency Progress Arc / Bar */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="text-4xl sm:text-5xl font-black font-mono text-rose-600 font-display">
                    {assessment.urgency_score}
                    <span className="text-base text-slate-400 font-normal ml-1">/ 100</span>
                  </div>
                  <span className="text-xs font-bold text-rose-700">Immediate Action Tier</span>
                </div>

                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full transition-all duration-700"
                    style={{ width: `${assessment.urgency_score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Calculated using IMD rain thresholds, canopy relative humidity, and ambient perishability.
                </p>
              </div>

              {/* Factor Breakdown Weights */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Urgency Score Factor Breakdown:
                </div>

                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600">Weather & Rain Exposure:</span>
                      <strong className="text-rose-700">35% (+30 pts)</strong>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full w-[85%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600">Ambient Shelf-Life Decay:</span>
                      <strong className="text-amber-700">30% (+25 pts)</strong>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[75%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600">APMC Mandi Price Volatility:</span>
                      <strong className="text-purple-700">20% (+18 pts)</strong>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full w-[65%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600">Logistics & Cold Storage Limit:</span>
                      <strong className="text-blue-700">15% (+12 pts)</strong>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[50%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Categorized Risk Intelligence Panel */}
            <div className="card p-6 border-slate-200 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Categorized Root Causes & Risk Signals Flagged</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Grounded Decision Engine v2.1
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Weather Risk Box */}
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-950 flex items-center gap-1.5">
                      <CloudRain className="w-4 h-4 text-blue-600" />
                      <span>Weather Risk</span>
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">HIGH SEVERITY</span>
                  </div>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    {assessment.weather_alert || '35mm rain threat in Nashik basin within 48 hours.'} Moisture on harvest accelerates soft rot.
                  </p>
                </div>

                {/* Market Risk Box */}
                <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-950 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                      <span>Market Glut Risk</span>
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">CRITICAL</span>
                  </div>
                  <p className="text-[11px] text-rose-900 leading-relaxed">
                    {assessment.mandi_price_signal || 'Terminal market prices slumping 20% due to rain-threat distressed panic selling.'}
                  </p>
                </div>

                {/* Crop Condition Box */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-amber-600" />
                      <span>Perishability Decay</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">TICKING</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Harvest lot at 31°C ambient field temperature. Bio-shelf life decaying rapidly past 36 hours.
                  </p>
                </div>

                {/* Logistics Bottleneck Box */}
                <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-purple-600" />
                      <span>Logistics Corridor</span>
                    </span>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">MODERATE</span>
                  </div>
                  <p className="text-[11px] text-purple-900 leading-relaxed">
                    Rural approach roads risk waterlogging delays. Direct farmgate transit pickup must be locked within 12h.
                  </p>
                </div>
              </div>

              {/* Recommended Action Summary */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-900 font-bold mb-0.5">Primary Decision Recommendation:</strong>
                  <span>{assessment.recommended_action}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
             5. EMERGENCY RISK PROGRESSION TIMELINE
             ────────────────────────────────────────────────────────── */}
          <div className="card p-6 border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 font-display">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>Risk Escalation Trajectory (Intervention Safe Window)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Projected timeline showing risk progression if dispatch action is postponed.
                </p>
              </div>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 w-fit">
                ● 24-Hour Safe Intervention Window
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-black text-slate-900 flex items-center justify-between">
                  <span>NOW</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">Optimal</span>
                </div>
                <p className="text-[11px] text-slate-600">Pre-monsoon warning detected; produce is Grade A and intact.</p>
                <div className="text-[10px] text-emerald-700 font-bold">100% Value Retained</div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                <div className="font-black text-amber-950 flex items-center justify-between">
                  <span>+6 HOURS</span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">Moisture</span>
                </div>
                <p className="text-[11px] text-slate-600">Canopy RH increases past 85%; micro-condensation begins.</p>
                <div className="text-[10px] text-amber-800 font-bold">~95% Value Retained</div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-1">
                <div className="font-black text-amber-950 flex items-center justify-between">
                  <span>+12 HOURS</span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">Glut Slump</span>
                </div>
                <p className="text-[11px] text-slate-600">APMC wholesale arrivals flood market; auction bids slump 22%.</p>
                <div className="text-[10px] text-amber-800 font-bold">~85% Value Retained</div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 space-y-1 ring-1 ring-rose-500/30">
                <div className="font-black text-rose-950 flex items-center justify-between">
                  <span>+24 HOURS</span>
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-200 px-1.5 py-0.2 rounded">DEADLINE</span>
                </div>
                <p className="text-[11px] text-rose-900">Soft rot incubation begins; factory puree intake rejected.</p>
                <div className="text-[10px] text-rose-800 font-bold">Window Closes</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-100/80 border border-slate-200 space-y-1 opacity-70">
                <div className="font-black text-slate-900 flex items-center justify-between">
                  <span>+36 HOURS</span>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">Severe Loss</span>
                </div>
                <p className="text-[11px] text-slate-600">Total distress liquidation required; up to 60% loss exposure.</p>
                <div className="text-[10px] text-rose-700 font-bold">Distress Dumping</div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
             6. RANKED SALVAGE PATHWAYS (CORE DECISION ENGINE)
             ────────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 font-display">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Ranked Salvage Pathways (अनुशंसित बचाव विकल्प)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluated using transparent financial recovery criteria, logistical time-to-safety, and real-time facility readiness.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                5 Feasible Routes Evaluated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {assessment.salvage_pathways.map((pathway, idx) => {
                const isRecommended = idx === 0;
                const isExpanded = expandedPathwayIndex === idx;

                return (
                  <div
                    key={pathway.route_type}
                    className={`card p-6 flex flex-col justify-between relative transition-all border ${
                      isRecommended
                        ? 'border-2 border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Primary Recommendation</span>
                      </span>
                    )}

                    <div className="space-y-3.5">
                      {/* Pathway Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                            Option {idx + 1} • {pathway.channel_name}
                          </div>
                          <h4 className="text-base font-black text-slate-900 font-display">
                            {pathway.title}
                          </h4>
                        </div>

                        {pathway.feasibility_status && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            pathway.feasibility_status === 'FEASIBLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {pathway.feasibility_status}
                          </span>
                        )}
                      </div>

                      {/* Financial Projection Box */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Estimated Salvaged Net Payout
                          </div>
                          <div className="text-2xl font-black font-mono text-emerald-800">
                            ₹{Math.round(pathway.estimated_net_payout).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Value Salvaged
                          </div>
                          <div className="text-lg font-black text-slate-900 font-mono">
                            {pathway.salvaged_value_pct}%
                          </div>
                        </div>
                      </div>

                      {/* Operational Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Time-to-Safety</div>
                            <div className="font-bold text-slate-800">{pathway.time_to_safety_hours} hours</div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Readiness</div>
                            <div className="font-bold text-slate-800 truncate max-w-[120px]">{pathway.capacity_status}</div>
                          </div>
                        </div>
                      </div>

                      {/* Itemized Deductions Dropdown */}
                      {pathway.itemized_deductions && pathway.itemized_deductions.length > 0 && (
                        <div>
                          <button
                            onClick={() => setExpandedPathwayIndex(isExpanded ? null : idx)}
                            className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span>{isExpanded ? 'Hide' : 'Inspect'} Itemized Costs & Net Breakdown ({pathway.itemized_deductions.length})</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono">
                              {pathway.itemized_deductions.map((ded, di) => (
                                <div key={di} className="flex justify-between text-slate-700">
                                  <span>{ded.name}:</span>
                                  <span className="font-bold text-rose-600">-₹{ded.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pathway Action Footer */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">
                        Risk level: <strong className={pathway.risk_level === 'LOW' ? 'text-emerald-700' : pathway.risk_level === 'MEDIUM' ? 'text-amber-700' : 'text-rose-700'}>{pathway.risk_level}</strong>
                      </div>

                      <button
                        onClick={() => {
                          setDispatchModalPathway(pathway);
                          setDispatchedRefCode(null);
                        }}
                        className={`text-xs py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs w-full sm:w-auto cursor-pointer ${
                          isRecommended
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        <span>{pathway.action_button_label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
             7. FINANCIAL RECOVERY COMPARISON CHART & MATRIX
             ────────────────────────────────────────────────────────── */}
          <div className="card p-6 border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 font-display">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>Financial Recovery Comparison Matrix (Value Saved)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Net farmer payouts across alternative salvage channels vs distress mandi liquidation.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                +₹16,800 Maximum Loss Avoided
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Option 1 Bar */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-emerald-950">Option 1: Emergency Food Processing (Sahyadri Hub)</span>
                  <span className="font-mono text-emerald-800 font-black text-sm">₹64,800 Net (94.7% Recovered)</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full w-[94.7%]" />
                </div>
                <div className="flex justify-between text-[11px] text-emerald-800 font-semibold">
                  <span>Zero weather risk exposure at factory intake</span>
                  <span>+₹16,800 vs Mandi</span>
                </div>
              </div>

              {/* Option 2 Bar */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800">Option 2: Alternative Corporate Offtake (Reliance Fresh)</span>
                  <span className="font-mono text-slate-900 font-black text-sm">₹61,500 Net (89.8% Recovered)</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full w-[89.8%]" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Reefer van pickup directly from farmgate</span>
                  <span className="text-emerald-700 font-bold">+₹13,500 vs Mandi</span>
                </div>
              </div>

              {/* Option 3 Bar */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800">Option 3: Cold Storage Buffer (Niphad Pre-Cooling Hub)</span>
                  <span className="font-mono text-slate-900 font-black text-sm">₹58,200 Net (85.0% Recovered)</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[85.0%]" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>14-day buffer allows market rate recovery post-monsoon</span>
                  <span className="text-emerald-700 font-bold">+₹10,200 vs Mandi</span>
                </div>
              </div>

              {/* Option 5 Bar: Mandi */}
              <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-rose-950">Option 5: Distressed APMC Wholesale Mandi Liquidation</span>
                  <span className="font-mono text-rose-800 font-black text-sm">₹48,000 Net (70.1% Recovered)</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full w-[70.1%]" />
                </div>
                <div className="flex justify-between text-[11px] text-rose-800 font-semibold">
                  <span>Heavy losses from 22% auction price slump & moisture cut</span>
                  <span>Baseline Distress</span>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
             8. INTERACTIVE "WHAT-IF" SCENARIO SIMULATOR
             ────────────────────────────────────────────────────────── */}
          {scenarioCalculations && (
            <div className="card p-6 border-slate-200 space-y-5 bg-gradient-to-br from-slate-900 to-emerald-950 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-black text-white text-base flex items-center gap-2 font-display">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Interactive "What-If" Salvage Scenario Simulator</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Test how market price slumps, rainfall intensity, and remaining shelf life impact your net recovery.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setScenarioPriceSlumpPct(22);
                    setScenarioRainIntensity('MODERATE');
                    setScenarioShelfLifeDays(3);
                  }}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-emerald-200 border border-white/15 flex items-center gap-1.5 cursor-pointer w-fit"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Simulator</span>
                </button>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                {/* Control 1: APMC Price Slump */}
                <div className="space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-300">APMC Mandi Price Slump:</span>
                    <span className="text-amber-400 font-mono font-black">-{scenarioPriceSlumpPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="35"
                    step="5"
                    value={scenarioPriceSlumpPct}
                    onChange={(e) => setScenarioPriceSlumpPct(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0% (Normal)</span>
                    <span>20% (Glut)</span>
                    <span>35% (Crash)</span>
                  </div>
                </div>

                {/* Control 2: Rainfall Threat */}
                <div className="space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-300">Precipitation Threat:</span>
                    <span className="text-blue-400 font-bold">{scenarioRainIntensity}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    {(['MILD', 'MODERATE', 'SEVERE'] as const).map(tier => (
                      <button
                        key={tier}
                        onClick={() => setScenarioRainIntensity(tier)}
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          scenarioRainIntensity === tier
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {scenarioRainIntensity === 'SEVERE' ? '45mm storm threat' : scenarioRainIntensity === 'MODERATE' ? '25mm showers' : '10mm drizzle'}
                  </span>
                </div>

                {/* Control 3: Shelf-life */}
                <div className="space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-300">Remaining Ambient Days:</span>
                    <span className="text-emerald-400 font-mono font-black">{scenarioShelfLifeDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={scenarioShelfLifeDays}
                    onChange={(e) => setScenarioShelfLifeDays(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 Day (Rot)</span>
                    <span>3 Days</span>
                    <span>6 Days (Fresh)</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Simulator Output Box */}
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-300 block text-[11px]">Projected Urgency Index:</span>
                  <div className="text-2xl font-black font-mono text-rose-400 mt-0.5">
                    {scenarioCalculations.simulatedUrgency} / 100
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {scenarioCalculations.simulatedUrgency > 80 ? 'CRITICAL DISPATCH' : 'MONITOR ACTIVE'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-300 block text-[11px]">Mandi Realization Under Slump:</span>
                  <div className="text-2xl font-black font-mono text-amber-300 mt-0.5">
                    ₹{scenarioCalculations.mandiProjectedNet.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Net @ ₹{scenarioCalculations.mandiProjectedRate}/kg
                  </span>
                </div>

                <div>
                  <span className="text-slate-300 block text-[11px]">Value Protected by Factory Route:</span>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                    +₹{scenarioCalculations.valueProtected.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-300">
                    100% Guaranteed Contract Price
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
             9. REGIONAL EMERGENCY SALVAGE HUB NETWORK GRID
             ────────────────────────────────────────────────────────── */}
          <div className="card p-6 border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 font-display">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>Nearby Emergency Salvage Facilities (Nashik Cluster)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Verified agro-processing plants, cold storage pre-cooling rooms, and wholesale yards within transit radius.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
                ● 4 Ready Facilities
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Sahyadri Food Park</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">42 km</span>
                </div>
                <p className="text-[11px] text-slate-500">Dindori Puree & Pulping Line. 28 MT available intake slot.</p>
                <div className="text-[10px] text-emerald-700 font-bold">● Puree Processing Ready</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Niphad Pre-Cooling Hub</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">12 km</span>
                </div>
                <p className="text-[11px] text-slate-500">Controlled atmosphere shock chambers. 45 MT available.</p>
                <div className="text-[10px] text-blue-700 font-bold">● Cold Chain Buffer Ready</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Pimpalgaon Baswant APMC</span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">18 km</span>
                </div>
                <p className="text-[11px] text-slate-500">Wholesale auction yard. Open intake but price glut alert.</p>
                <div className="text-[10px] text-amber-700 font-bold">● Mandi Auction Open</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Reliance DC Ghansoli</span>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">195 km</span>
                </div>
                <p className="text-[11px] text-slate-500">Institutional retail sourcing yard with reefer fleet transit.</p>
                <div className="text-[10px] text-purple-700 font-bold">● Corporate Offtake Ready</div>
              </div>
            </div>
          </div>

        </div>
      ) : null}

      {/* ──────────────────────────────────────────────────────────
         10. SLIDE-OVER ASSUMPTIONS DRAWER
         ────────────────────────────────────────────────────────── */}
      {showConfigDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    GROUNDED PARAMETERS
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2 font-display">
                    Customize Rescue Assumptions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Calibrate microclimate and biological shelf-life sensitivity for this crop lot.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfigDrawer(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="label">Ambient Safe Shelf-Life (Days):</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={customAssumptions.ambient_shelf_life_days}
                    onChange={(e) =>
                      setCustomAssumptions({ ...customAssumptions, ambient_shelf_life_days: Number(e.target.value) })
                    }
                    className="input-field font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Post-harvest limit before rot at 28-34°C field conditions</span>
                </div>

                <div>
                  <label className="label">Rainfall Alert Trigger (mm / 48h):</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={customAssumptions.rainfall_alert_threshold_mm}
                    onChange={(e) =>
                      setCustomAssumptions({ ...customAssumptions, rainfall_alert_threshold_mm: Number(e.target.value) })
                    }
                    className="input-field font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Precipitation causing road impassability or canopy rot</span>
                </div>

                <div>
                  <label className="label">APMC Mandi Price Slump Threshold (%):</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={customAssumptions.mandi_price_slump_threshold_pct}
                    onChange={(e) =>
                      setCustomAssumptions({ ...customAssumptions, mandi_price_slump_threshold_pct: Number(e.target.value) })
                    }
                    className="input-field font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Projected auction rate decline during panic rush arrivals</span>
                </div>

                <div>
                  <label className="label">Puree Extraction Recovery (%):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="20"
                    max="98"
                    value={customAssumptions.processing_recovery_pct}
                    onChange={(e) =>
                      setCustomAssumptions({ ...customAssumptions, processing_recovery_pct: Number(e.target.value) })
                    }
                    className="input-field font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Industrial paste yield from raw Grade A tomato</span>
                </div>

                <div>
                  <label className="label">Cold Storage Monthly Tariff (₹/kg/mo):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="3.0"
                    value={customAssumptions.cold_storage_monthly_rate_per_kg}
                    onChange={(e) =>
                      setCustomAssumptions({ ...customAssumptions, cold_storage_monthly_rate_per_kg: Number(e.target.value) })
                    }
                    className="input-field font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Verified commercial chamber tariff at Niphad CA hub</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={handleResetAssumptions}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
              >
                Reset to Defaults
              </button>

              <button
                onClick={handleApplyCustomAssumptions}
                className="btn-primary text-xs py-2 px-5"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         11. EMERGENCY SALVAGE DISPATCH WORKFLOW MODAL
         ────────────────────────────────────────────────────────── */}
      {dispatchModalPathway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  EMERGENCY DISPATCH PROTOCOL
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 font-display">
                  {dispatchModalPathway.title}
                </h3>
                <p className="text-xs text-slate-500">Destination: {dispatchModalPathway.channel_name}</p>
              </div>
              <button
                onClick={() => setDispatchModalPathway(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dispatchedRefCode ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {dispatchedRefCode}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 font-display">
                    Rescue Dispatch Order Dispatched!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Consignment reservation lodged with <strong>{dispatchModalPathway.channel_name}</strong> and transferred to Smart Execution Tracker.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allocated Quantity:</span>
                    <strong className="text-slate-800">{assessment?.quantity_kg.toLocaleString()} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Salvaged Net:</span>
                    <strong className="text-emerald-700 font-mono font-black">₹{Math.round(dispatchModalPathway.estimated_net_payout).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time-to-Safety:</span>
                    <strong className="text-slate-800">{dispatchModalPathway.time_to_safety_hours} hours</strong>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-3">
                  {onNavigateToExecution && (
                    <button
                      onClick={() => {
                        setDispatchModalPathway(null);
                        onNavigateToExecution();
                      }}
                      className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
                    >
                      <span>Track in Execution Tracker</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setDispatchModalPathway(null)}
                    className="btn-secondary text-xs py-2.5 px-4"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Commercial Summary Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="font-bold text-slate-900 text-sm">Commercial Salvage Terms</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allocated Cargo:</span>
                    <strong className="text-slate-800">{assessment?.quantity_kg.toLocaleString()} kg {assessment?.crop_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Facility:</span>
                    <strong className="text-slate-800">{dispatchModalPathway.channel_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expected Net Payout:</span>
                    <strong className="font-mono text-emerald-700 font-black text-sm">
                      ₹{Math.round(dispatchModalPathway.estimated_net_payout).toLocaleString()} ({dispatchModalPathway.salvaged_value_pct}%)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Critical Response Window:</span>
                    <strong className="text-rose-700 font-bold">&lt; {dispatchModalPathway.time_to_safety_hours} Hours</strong>
                  </div>
                </div>

                {/* Dispatch Scheduling Choice */}
                <div>
                  <label className="label">Select Dispatch Window:</label>
                  <select
                    value={dispatchScheduledWindow}
                    onChange={(e) => setDispatchScheduledWindow(e.target.value)}
                    className="input-field text-xs font-semibold"
                  >
                    <option value="IMMEDIATE_6H">Immediate Farmgate Loading (Next 6 Hours) [Recommended]</option>
                    <option value="NEXT_12H">Next Morning Loading (Within 12 Hours)</option>
                    <option value="NEXT_24H">Within 24 Hours (Prior to Storm Window)</option>
                  </select>
                </div>

                <div>
                  <label className="label">Gate Instructions & Dock Requirements:</label>
                  <textarea
                    rows={2}
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    className="input-field resize-none text-xs"
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Dispatched with priority terminal intake pass under Agri2Value Emergency Escrow.</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setDispatchModalPathway(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirmDispatch}
                    disabled={dispatchSubmitting}
                    className="btn-primary text-xs flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500"
                  >
                    {dispatchSubmitting ? 'Dispatching Consignment...' : 'Confirm Emergency Dispatch'}
                    <ArrowRight className="w-3.5 h-3.5" />
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
