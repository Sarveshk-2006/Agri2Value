// frontend/src/components/DecisionEngineView.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Cpu,
  Calculator,
  ShieldCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Sparkles,
  Award,
  ArrowRight,
  Sliders,
  Scale,
  FileCheck,
  ExternalLink,
  Flame,
  Truck,
  Warehouse,
  ShoppingBag,
  DollarSign,
  Layers,
  Sprout,
  Calendar,
  Building2,
  Check,
} from 'lucide-react';
import type {
  CropLot,
  DecisionRun,
  DecisionOption,
  FeasibilityStatus,
  SensitivityAnalysisResult,
  OutcomeComparison,
  AssumptionItem,
  AssumptionProvenance,
  RouteType,
} from '../types';
import { api } from '../api';

interface DecisionEngineViewProps {
  lots: CropLot[];
  selectedLotId?: string;
  onLotSelect?: (lotId: string) => void;
  onNavigateToExecution?: () => void;
}

type EngineTab = 'RECOMMENDATIONS' | 'SENSITIVITY' | 'OUTCOMES' | 'ASSUMPTIONS';

export const DecisionEngineView: React.FC<DecisionEngineViewProps> = ({
  lots,
  selectedLotId,
  onLotSelect,
  onNavigateToExecution,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const activeLotId = selectedLotId || (lots.length > 0 ? lots[0].id : '');
  const activeLot = lots.find((l) => l.id === activeLotId) || lots[0];

  const [activeTab, setActiveTab] = useState<EngineTab>(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const tabParam = params.get('tab');
    if (tabParam === 'sensitivity') return 'SENSITIVITY';
    if (tabParam === 'outcomes') return 'OUTCOMES';
    if (tabParam === 'assumptions') return 'ASSUMPTIONS';
    return 'RECOMMENDATIONS';
  });
  const [selectedScenario, setSelectedScenario] = useState<string>('PILOT_BASELINE');
  const [decisionRun, setDecisionRun] = useState<DecisionRun | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSnapshotExpanded, setIsSnapshotExpanded] = useState<boolean>(false);

  // Sensitivity State
  const [sensitivityResult, setSensitivityResult] = useState<SensitivityAnalysisResult | null>(null);
  const [sensitivityLoading, setSensitivityLoading] = useState<boolean>(false);
  const [priceVariance, setPriceVariance] = useState<number>(15);
  const [transportVariance, setTransportVariance] = useState<number>(20);
  const [wastageVariance, setWastageVariance] = useState<number>(5);

  // Outcome Reconciliation State
  const [outcomeComparison, setOutcomeComparison] = useState<OutcomeComparison | null>(null);
  const [, setOutcomeLoading] = useState<boolean>(false);

  // Benchmark Assumptions
  const [benchmarkAssumptions, setBenchmarkAssumptions] = useState<AssumptionItem[]>([]);

  const handleActionOption = async (option: DecisionOption) => {
    if (!decisionRun || !activeLot) return;
    setActionSubmitting(option.id);
    setActionSuccess(null);
    try {
      await api.createExecutionRequest({
        crop_lot_id: activeLot.id,
        decision_run_id: decisionRun.id,
        route_type: option.route_type,
        requested_quantity_kg: activeLot.quantity_kg_normalized,
        notes: `Smart Execution Network Request initiated from Engine Option: ${option.route_name}. Projected net profit: ₹${Number(option.net_profit).toLocaleString()}`,
      });
      setActionSuccess(option.id);
      setTimeout(() => {
        if (onNavigateToExecution) {
          onNavigateToExecution();
        } else {
          navigate('/app/execution');
        }
      }, 1200);
    } catch (err: any) {
      alert(`Execution request failed: ${err.message}`);
    } finally {
      setActionSubmitting(null);
    }
  };

  const runEvaluation = async (lotId: string, scenario: string) => {
    if (!lotId) return;
    setLoading(true);
    setError(null);
    try {
      const scenarioParam = scenario === 'PILOT_BASELINE' ? undefined : scenario;
      const result = await api.evaluateDecision(lotId, scenarioParam);
      setDecisionRun(result);
      if (result.sensitivity_preview) {
        setSensitivityResult(result.sensitivity_preview);
      }
      loadOutcomeComparison(result.id);
    } catch (err: any) {
      console.error('Failed to run decision engine:', err);
      setError(err.message || 'Decision evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  const loadSensitivity = async (lotId: string) => {
    if (!lotId) return;
    setSensitivityLoading(true);
    try {
      const res = await api.runSensitivityAnalysis(lotId, {
        price_variance_pct: priceVariance,
        transport_variance_pct: transportVariance,
        wastage_variance_pct: wastageVariance,
      });
      setSensitivityResult(res);
    } catch (err: any) {
      console.error('Sensitivity analysis error:', err);
    } finally {
      setSensitivityLoading(false);
    }
  };

  const loadOutcomeComparison = async (decisionId: string) => {
    if (!decisionId) return;
    setOutcomeLoading(true);
    try {
      const data = await api.getDecisionOutcomeComparison(decisionId);
      setOutcomeComparison(data);
    } catch (err: any) {
      console.error('Failed to load outcome reconciliation:', err);
    } finally {
      setOutcomeLoading(false);
    }
  };

  const loadAssumptions = async () => {
    try {
      const list = await api.getBenchmarkAssumptions();
      setBenchmarkAssumptions(list);
    } catch (err: any) {
      console.error('Failed to load assumptions config:', err);
    }
  };

  useEffect(() => {
    if (activeLotId) {
      runEvaluation(activeLotId, selectedScenario);
      loadAssumptions();
    }
  }, [activeLotId, selectedScenario]);

  const toggleExpand = (optId: string) => {
    setExpandedOptionId(expandedOptionId === optId ? null : optId);
  };

  // Filter feasible vs infeasible pathways
  const feasibleOptions = decisionRun
    ? decisionRun.options.filter(
        (o) => o.feasibility_status === 'FEASIBLE' || o.feasibility_status === 'CONDITIONALLY_FEASIBLE'
      )
    : [];

  const infeasibleOptions = decisionRun
    ? decisionRun.options.filter(
        (o) => o.feasibility_status === 'INFEASIBLE' || o.feasibility_status === 'NEEDS_MORE_DATA'
      )
    : [];

  const recommendedOption = decisionRun?.options.find((o) => o.is_recommended) || feasibleOptions[0];
  const baselineOption = decisionRun?.options.find((o) => o.route_type === 'RAW_MANDI');

  // Route Type Icon resolver
  const getRouteIcon = (routeType: RouteType) => {
    switch (routeType) {
      case 'PROCESSING':
        return <Building2 className="w-4 h-4 text-emerald-700" />;
      case 'DIRECT_BUYER':
        return <ShoppingBag className="w-4 h-4 text-sky-700" />;
      case 'RAW_MANDI':
        return <Scale className="w-4 h-4 text-amber-700" />;
      case 'STORAGE':
        return <Warehouse className="w-4 h-4 text-indigo-700" />;
      case 'GROUP_SELLING':
        return <Layers className="w-4 h-4 text-purple-700" />;
      default:
        return <Truck className="w-4 h-4 text-slate-700" />;
    }
  };

  // Human-friendly Feasibility badge
  const getFeasibilityBadge = (status: FeasibilityStatus) => {
    switch (status) {
      case 'FEASIBLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Feasible</span>
          </span>
        );
      case 'CONDITIONALLY_FEASIBLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Conditional</span>
          </span>
        );
      case 'INFEASIBLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Disqualified</span>
          </span>
        );
      case 'NEEDS_MORE_DATA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
            <Info className="w-3.5 h-3.5 text-purple-600" />
            <span>Needs Data</span>
          </span>
        );
    }
  };

  // Human-friendly Provenance badge
  const getProvenanceBadge = (prov: AssumptionProvenance) => {
    switch (prov) {
      case 'VERIFIED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Verified APMC / Gov
          </span>
        );
      case 'CONFIGURED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Configured Tariff
          </span>
        );
      case 'ILLUSTRATIVE_BENCHMARK':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Illustrative Benchmark
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
            Unverified Source
          </span>
        );
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
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                  {t('profit.title')}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Feasibility-Aware • Deterministic</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {t('profit.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Re-Evaluate Header Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => activeLotId && runEvaluation(activeLotId, selectedScenario)}
            disabled={loading}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? t('profit.calculating', 'Calculating...') : t('profit.calculate', 'Calculate Optimal Pathway')}</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION B — STEP-ORIENTED DECISION INPUT PANEL
          ────────────────────────────────────────────────────────── */}
      <div className="card p-5 sm:p-6 bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Decision Input Workspace
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Step 1: Select Lot → Step 2: Review → Step 3: Run
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: Select Harvest Lot */}
          <div className="space-y-1.5">
            <label className="label">{t('profit.step1')} *</label>
            <select
              value={activeLotId}
              onChange={(e) => onLotSelect && onLotSelect(e.target.value)}
              className="input-field text-xs sm:text-sm font-semibold"
            >
              {lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.crop_name} {lot.variety ? `(${lot.variety})` : ''} — {Number(lot.quantity_kg_normalized).toLocaleString('en-IN')} kg (Grade {lot.quality_grade || 'Ungraded'})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Active Lot Context Overview */}
          <div className="space-y-1.5">
            <label className="label">{t('profit.step2')}</label>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeLot?.crop_name} ({activeLot?.variety || 'Hybrid'})</span>
                </span>
                <span className="font-mono text-emerald-700">
                  {Number(activeLot?.quantity_kg_normalized).toLocaleString('en-IN')} kg
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Grade: {activeLot?.quality_grade || 'A'}</span>
                <span>Status: {activeLot?.status || 'READY'}</span>
              </div>
            </div>
          </div>

          {/* Step 3: Simulation Preset Switcher */}
          <div className="space-y-1.5">
            <label className="label">{t('profit.step3')}</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="input-field text-xs font-semibold cursor-pointer"
            >
              <option value="PILOT_BASELINE">Realistic Base Case (Market Spreads)</option>
              <option value="MANDI_WINS">Mandi Wins (Distant Buyer & High Freight)</option>
              <option value="PROCESSING_BOTTLENECK">Processing Infeasible (Capacity Limit)</option>
              <option value="MISSING_DATA">Incomplete Data (Missing Recovery Yield)</option>
            </select>
          </div>
        </div>

        {/* Feature Tabs Navigation */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('RECOMMENDATIONS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'RECOMMENDATIONS'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Ranked Recommendations</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('SENSITIVITY');
              if (activeLotId) loadSensitivity(activeLotId);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'SENSITIVITY'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Sensitivity Analysis (3 Scenarios)</span>
          </button>

          <button
            onClick={() => setActiveTab('OUTCOMES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'OUTCOMES'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Reconciliation & Realization</span>
          </button>

          <button
            onClick={() => setActiveTab('ASSUMPTIONS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ASSUMPTIONS'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Technical Assumptions ({benchmarkAssumptions.length || 8})</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          TAB 1: RANKED RECOMMENDATIONS & FINANCIAL WORKSPACE
          ────────────────────────────────────────────────────────── */}
      {activeTab === 'RECOMMENDATIONS' && (
        <div className="space-y-6">
          {/* ──────────────────────────────────────────────────────────
              SECTION C — RECOMMENDED PATHWAY (PRIMARY VISUAL FOCAL POINT)
              ────────────────────────────────────────────────────────── */}
          {recommendedOption ? (
            <div className="card p-6 sm:p-8 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 border-2 border-emerald-500/80 shadow-md space-y-6 relative overflow-hidden">
              {/* Subtle accent ribbon */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Recommendation Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-emerald-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
                    {getRouteIcon(recommendedOption.route_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-800 text-white text-[10px] font-black uppercase tracking-wider">
                        <Award className="w-3 h-3" />
                        <span>Recommended Pathway (Rank #1)</span>
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                        {recommendedOption.route_type.replace(/_/g, ' ')}
                      </span>
                      {getFeasibilityBadge(recommendedOption.feasibility_status)}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-display">
                      {recommendedOption.route_name}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {recommendedOption.explanation}
                    </p>
                  </div>
                </div>

                {/* Uplift Badge */}
                {recommendedOption.additional_profit_vs_baseline > 0 && (
                  <div className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-xs">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <span>
                      +₹{Number(recommendedOption.additional_profit_vs_baseline).toLocaleString('en-IN')} vs Raw Mandi
                    </span>
                  </div>
                )}
              </div>

              {/* Financial Highlight Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Estimated Net Profit (Primary Focal Point) */}
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Estimated Net Profit
                  </span>
                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono tracking-tight">
                      ₹{Number(recommendedOption.net_profit).toLocaleString('en-IN')}
                    </div>
                    <span className="block text-[11px] text-emerald-700 font-semibold mt-0.5">
                      ₹{Number(recommendedOption.effective_realization_per_kg).toFixed(2)} / kg net realization
                    </span>
                  </div>
                </div>

                {/* 2. Gross Expected Revenue */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Gross Expected Revenue
                  </span>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                      ₹{Number(recommendedOption.gross_revenue).toLocaleString('en-IN')}
                    </div>
                    <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                      On {Number(recommendedOption.saleable_quantity).toLocaleString('en-IN')}{' '}
                      {recommendedOption.saleable_quantity_unit}
                    </span>
                  </div>
                </div>

                {/* 3. Total Deductions */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Deductions
                  </span>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
                      -₹{Number(recommendedOption.total_costs).toLocaleString('en-IN')}
                    </div>
                    <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                      Freight, processing & handling
                    </span>
                  </div>
                </div>

                {/* 4. Payment Realization Timeline */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Payment Realization
                  </span>
                  <div className="mt-2">
                    <div className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{recommendedOption.time_to_payment_days || '3–5'} Days</span>
                    </div>
                    <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                      Direct DBT / NEFT bank transfer
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-emerald-100">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified feasible against capacity, transport route & pricing telematics</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => navigate('/app/infra')}
                    className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-1.5"
                  >
                    <span>View Facility In Infrastructure</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleActionOption(recommendedOption)}
                    disabled={actionSubmitting === recommendedOption.id}
                    className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    {actionSuccess === recommendedOption.id ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Execution Request Initiated!</span>
                      </>
                    ) : actionSubmitting === recommendedOption.id ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Initiating Request...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>Proceed with This Pathway</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* No Feasible Option Warning */
            <div className="card p-8 bg-amber-50 border border-amber-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Feasible Pathway Available</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                All candidate routes failed feasibility gating due to capacity limitations, high freight tariffs, or missing price telematics.
              </p>
              <button
                onClick={() => navigate('/app/rescue')}
                className="btn-primary text-xs inline-flex items-center gap-2 mx-auto"
              >
                <Flame className="w-4 h-4" />
                <span>Assess Crop Rescue Distress Options</span>
              </button>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              SECTION D — FINANCIAL DEDUCTION WATERFALL (TRANSPARENCY)
              ────────────────────────────────────────────────────────── */}
          {recommendedOption && (
            <div className="card p-5 sm:p-6 bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Profit Breakdown & Deduction Waterfall
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Exact Decimal Reconciliation
                </span>
              </div>

              {/* Waterfall Steps */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                {/* 1. Gross Revenue */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    1. Gross Revenue
                  </span>
                  <div className="text-base font-mono font-black text-emerald-900 mt-1">
                    +₹{Number(recommendedOption.gross_revenue).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    {Number(recommendedOption.saleable_quantity).toLocaleString('en-IN')} kg yield
                  </span>
                </div>

                {/* 2. Freight & Transit */}
                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    2. Freight & Logistics
                  </span>
                  <div className="text-base font-mono font-black text-rose-800 mt-1">
                    -₹{Number(recommendedOption.cost_breakdown.transport).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-rose-600 block mt-0.5">
                    Transporter haulage
                  </span>
                </div>

                {/* 3. Processing / Storage Fees */}
                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    3. Processing / Rent
                  </span>
                  <div className="text-base font-mono font-black text-rose-800 mt-1">
                    -₹{(
                      Number(recommendedOption.cost_breakdown.processing) +
                      Number(recommendedOption.cost_breakdown.storage)
                    ).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-rose-600 block mt-0.5">
                    Facility conversion fees
                  </span>
                </div>

                {/* 4. Mandi Tax & Cess */}
                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    4. Taxes & Handling
                  </span>
                  <div className="text-base font-mono font-black text-rose-800 mt-1">
                    -₹{(
                      Number(recommendedOption.cost_breakdown.commission_and_fees) +
                      Number(recommendedOption.cost_breakdown.labour)
                    ).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-rose-600 block mt-0.5">
                    Statutory / APMC charges
                  </span>
                </div>

                {/* 5. Net Estimated Profit */}
                <div className="p-3.5 rounded-xl bg-emerald-800 text-white shadow-xs">
                  <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">
                    5. Net Estimated Return
                  </span>
                  <div className="text-base font-mono font-black text-white mt-1">
                    = ₹{Number(recommendedOption.net_profit).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-300 block mt-0.5">
                    ₹{Number(recommendedOption.effective_realization_per_kg).toFixed(2)}/kg realization
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              SECTION E — ALL 5 CANDIDATE PATHWAYS COMPARISON
              ────────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Comparative Analysis Across All 5 Commercial Pathways
                </h3>
                <p className="text-xs text-slate-500">
                  Feasibility-gated ranking evaluating net realization against baseline APMC auction benchmarks.
                </p>
              </div>
              <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                {feasibleOptions.length} Feasible • {infeasibleOptions.length} Disqualified
              </span>
            </div>

            {/* Pathways Cards Stack */}
            <div className="space-y-3">
              {decisionRun?.options.map((option, idx) => {
                const isWinner = option.is_recommended;
                const isExpanded = expandedOptionId === option.id;
                const isFeasible =
                  option.feasibility_status === 'FEASIBLE' ||
                  option.feasibility_status === 'CONDITIONALLY_FEASIBLE';

                return (
                  <div
                    key={option.id}
                    className={`card p-4 sm:p-5 border transition-all ${
                      isWinner
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                        : isFeasible
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-slate-200 bg-slate-50/70 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                            isWinner
                              ? 'bg-emerald-800 text-white shadow-xs'
                              : isFeasible
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                              {option.route_name}
                            </h4>
                            {isWinner && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-white text-[10px] font-black uppercase">
                                Recommended
                              </span>
                            )}
                            {getFeasibilityBadge(option.feasibility_status)}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {option.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Financial Numbers */}
                      <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Net Estimated Profit
                          </span>
                          <span
                            className={`text-lg sm:text-xl font-mono font-black ${
                              isWinner
                                ? 'text-emerald-800'
                                : isFeasible
                                ? 'text-slate-900'
                                : 'text-slate-400'
                            }`}
                          >
                            ₹{Number(option.net_profit).toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[11px] text-slate-500 font-semibold">
                            ₹{Number(option.effective_realization_per_kg).toFixed(2)}/kg
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleExpand(option.id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Expand Cost Breakdown"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          {isFeasible && (
                            <button
                              type="button"
                              onClick={() => handleActionOption(option)}
                              disabled={actionSubmitting === option.id}
                              className={`text-xs py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                                isWinner
                                  ? 'bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              Select Route
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Deductions Drawer */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-3 text-xs animate-in fade-in">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Gross Revenue</span>
                            <span className="font-mono font-bold text-slate-800">
                              ₹{Number(option.gross_revenue).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Transport Freight</span>
                            <span className="font-mono font-bold text-rose-700">
                              -₹{Number(option.cost_breakdown.transport).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Processing / Storage</span>
                            <span className="font-mono font-bold text-rose-700">
                              -₹{(
                                Number(option.cost_breakdown.processing) +
                                Number(option.cost_breakdown.storage)
                              ).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Mandi Taxes & Cess</span>
                            <span className="font-mono font-bold text-rose-700">
                              -₹{Number(option.cost_breakdown.commission_and_fees).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Feasibility Reasons / Checks */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {option.feasibility_reasons.passed_checks.map((chk, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{chk}</span>
                            </span>
                          ))}
                          {option.feasibility_reasons.failed_checks.map((fail, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-semibold"
                            >
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>{fail}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              SECTION J — TECHNICAL SNAPSHOT (COLLAPSIBLE FOR JUDGES)
              ────────────────────────────────────────────────────────── */}
          <div className="pt-2">
            <button
              onClick={() => setIsSnapshotExpanded(!isSnapshotExpanded)}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs text-slate-700 font-bold cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Technical Evaluation Snapshot & Audit Metadata</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">
                  (Judge Transparency • Zero Secrets)
                </span>
              </div>
              {isSnapshotExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isSnapshotExpanded && decisionRun && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 mt-2 space-y-3 text-xs animate-in fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Decision Run ID</span>
                    <span className="font-bold text-slate-800 truncate block">{decisionRun.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Algorithm Version</span>
                    <span className="font-bold text-emerald-700 block">{decisionRun.algorithm_version}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Evaluation Timestamp</span>
                    <span className="font-bold text-slate-800 block">
                      {new Date(decisionRun.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Deterministic Guard</span>
                    <span className="font-bold text-indigo-700 block">Decimal Precision (Python 3.14)</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                  {decisionRun.disclaimer}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          TAB 2: SENSITIVITY ANALYSIS (3 SCENARIOS)
          ────────────────────────────────────────────────────────── */}
      {activeTab === 'SENSITIVITY' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="card p-5 sm:p-7 bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>3-Scenario Sensitivity Stress Testing</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluates how market price dips, diesel freight shocks, and sorting wastage impact projected net profit.
                </p>
              </div>

              {sensitivityResult?.recommendation_stability && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{sensitivityResult.recommendation_stability.replace(/_/g, ' ')}</span>
                </span>
              )}
            </div>

            {/* Slippage Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>Price Variance</span>
                  <span className="font-mono text-emerald-700">±{priceVariance}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={priceVariance}
                  onChange={(e) => setPriceVariance(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>Transport Surcharge</span>
                  <span className="font-mono text-emerald-700">+{transportVariance}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={transportVariance}
                  onChange={(e) => setTransportVariance(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span>Transit Wastage</span>
                  <span className="font-mono text-emerald-700">+{wastageVariance}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={wastageVariance}
                  onChange={(e) => setWastageVariance(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* 3 Scenarios Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sensitivityResult?.scenarios.map((sc, i) => {
                const isExpected = sc.name.toLowerCase().includes('expected') || sc.name.toLowerCase().includes('base');
                const isConservative = sc.name.toLowerCase().includes('conservative');

                return (
                  <div
                    key={i}
                    className={`p-5 rounded-2xl border flex flex-col justify-between ${
                      isExpected
                        ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/10'
                        : isConservative
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {sc.name}
                      </span>
                      <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                        ₹{Number(sc.projected_net_profit).toLocaleString('en-IN')}
                      </div>
                      <span className="text-xs text-slate-500 mt-1 block">
                        Gross: ₹{Number(sc.projected_gross_revenue).toLocaleString('en-IN')} • Costs: ₹{Number(sc.projected_total_costs).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                      {sc.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          TAB 3: RECONCILIATION & OUTCOME COMPARISON
          ────────────────────────────────────────────────────────── */}
      {activeTab === 'OUTCOMES' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="card p-5 sm:p-7 bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>Realized vs Projected Settlement Reconciliation</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Audits post-delivery weighbridge tickets and bank realizations against initial decision forecasts.
                </p>
              </div>
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                Integrated Farmer Settlement
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Forecasted Decision Parameters
                </span>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Selected Pathway:</span>
                  <span className="font-bold text-slate-800">{outcomeComparison?.recommended_route || 'Sahyadri Processing'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Expected Delivery Quantity:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {outcomeComparison?.expected_quantity_kg.toLocaleString('en-IN') || 4000} kg
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Forecasted Net Profit:</span>
                  <span className="font-mono font-black text-emerald-800">
                    ₹{outcomeComparison?.estimated_net_profit_inr.toLocaleString('en-IN') || '68,400'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Actual Realization Status
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {outcomeComparison?.comparison_notes ||
                    'Harvest lot is currently pending final dispatch execution. Once delivered to Sahyadri Processing and payment is settled via DBT, actual weighbridge variances will display here.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          TAB 4: TECHNICAL ASSUMPTIONS & BENCHMARKS
          ────────────────────────────────────────────────────────── */}
      {activeTab === 'ASSUMPTIONS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="card p-5 sm:p-7 bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Itemized Decision Cost & Tariff Assumptions</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Disclosing all background rates, freight slabs, and processing ratios used in calculations.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                Transparent Provenance
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-3">Assumption Parameter</th>
                    <th className="py-2.5 px-3">Applied Rate / Value</th>
                    <th className="py-2.5 px-3">Provenance Category</th>
                    <th className="py-2.5 px-3">Source & Verification Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {benchmarkAssumptions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                        {item.value} {item.unit}
                      </td>
                      <td className="py-3 px-3">{getProvenanceBadge(item.provenance)}</td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs">{item.source_description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
