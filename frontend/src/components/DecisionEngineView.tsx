// frontend/src/components/DecisionEngineView.tsx
import React, { useState, useEffect } from 'react';
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
  Send,
  Award,
  ArrowRight,
  Sliders,
  Scale,
  FileCheck,
  BadgeAlert,
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
  const activeLotId = selectedLotId || (lots.length > 0 ? lots[0].id : '');
  const activeLot = lots.find((l) => l.id === activeLotId) || lots[0];

  const [activeTab, setActiveTab] = useState<EngineTab>('RECOMMENDATIONS');
  const [selectedScenario, setSelectedScenario] = useState<string>('PILOT_BASELINE');
  const [decisionRun, setDecisionRun] = useState<DecisionRun | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState<string | null>(null);

  // Phase 6 Sensitivity State
  const [sensitivityResult, setSensitivityResult] = useState<SensitivityAnalysisResult | null>(null);
  const [sensitivityLoading, setSensitivityLoading] = useState<boolean>(false);
  const [priceVariance, setPriceVariance] = useState<number>(15);
  const [transportVariance, setTransportVariance] = useState<number>(20);
  const [wastageVariance, setWastageVariance] = useState<number>(5);

  // Phase 6 Actual Outcome Reconciliation State
  const [outcomeComparison, setOutcomeComparison] = useState<OutcomeComparison | null>(null);
  const [outcomeLoading, setOutcomeLoading] = useState<boolean>(false);

  // Phase 6 Benchmark Assumptions
  const [benchmarkAssumptions, setBenchmarkAssumptions] = useState<AssumptionItem[]>([]);

  const handleActionOption = async (option: DecisionOption) => {
    if (!decisionRun || !activeLot) return;
    setActionSubmitting(option.id);
    try {
      await api.createExecutionRequest({
        crop_lot_id: activeLot.id,
        decision_run_id: decisionRun.id,
        route_type: option.route_type,
        requested_quantity_kg: activeLot.quantity_kg_normalized,
        notes: `Smart Execution Network Request initiated from Engine Option: ${option.route_name}. Projected net profit: ₹${Number(option.net_profit).toLocaleString()}`,
      });
      alert(`Execution request created for ${option.route_name}! Redirecting to Execution Tracker.`);
      if (onNavigateToExecution) {
        onNavigateToExecution();
      }
    } catch (err: any) {
      alert(`Booking request failed: ${err.message}`);
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
      // Auto-load outcome comparison for this decision run
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

  const recommendedOption = decisionRun?.options.find((o) => o.is_recommended);
  const baselineOption = decisionRun?.options.find((o) => o.route_type === 'RAW_MANDI');

  const getFeasibilityBadge = (status: FeasibilityStatus) => {
    switch (status) {
      case 'FEASIBLE':
        return (
          <span className="badge-green">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>FEASIBLE</span>
          </span>
        );
      case 'CONDITIONALLY_FEASIBLE':
        return (
          <span className="badge-yellow">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>CONDITIONAL</span>
          </span>
        );
      case 'INFEASIBLE':
        return (
          <span className="badge-red">
            <XCircle className="w-3.5 h-3.5" />
            <span>INFEASIBLE</span>
          </span>
        );
      case 'NEEDS_MORE_DATA':
        return (
          <span className="badge-purple">
            <Info className="w-3.5 h-3.5" />
            <span>NEEDS DATA</span>
          </span>
        );
    }
  };

  const getProvenanceBadge = (prov: AssumptionProvenance) => {
    switch (prov) {
      case 'VERIFIED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            VERIFIED APMC / GOV
          </span>
        );
      case 'CONFIGURED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            CONFIGURED TARIFF
          </span>
        );
      case 'ILLUSTRATIVE_BENCHMARK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            EMPIRICAL BENCHMARK
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            UNVERIFIED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card p-6 sm:p-8 space-y-4 border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="badge-green">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Phase 6 Intelligence: Feasibility-Aware Profit Optimization</span>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-bold">
            Deterministic Engine • Decimal Precision
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3 font-display">
            <Cpu className="w-7 h-7 text-emerald-600" />
            <span>Profit Decision Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Evaluates your harvest lot against candidate commercial pathways, itemized transit and handling costs,
            strict feasibility gating, and sensitivity ranges. Infeasible routes are filtered out before ranking.
          </p>
        </div>

        {/* Harvest Lot Selection & Scenario Controls */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lot Selector */}
          <div className="space-y-1.5">
            <label className="label">Select Harvest Lot to Evaluate:</label>
            <select
              value={activeLotId}
              onChange={(e) => onLotSelect && onLotSelect(e.target.value)}
              className="input-field font-semibold"
            >
              {lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.crop_name} {lot.variety ? `(${lot.variety})` : ''} — {Number(lot.quantity_kg_normalized).toLocaleString()} kg (Grade {lot.quality_grade || 'Ungraded'})
                </option>
              ))}
            </select>
            {activeLot && (
              <div className="text-[11px] text-slate-500 font-medium">
                Active Lot: <strong className="text-slate-800">{activeLot.crop_name} {activeLot.variety ? `(${activeLot.variety})` : ''}</strong> • {Number(activeLot.quantity_kg_normalized).toLocaleString()} kg • Status: {activeLot.status}
              </div>
            )}
          </div>

          {/* Test Scenario Switcher */}
          <div className="space-y-1.5">
            <label className="label">Simulation Scenario (Audit Presets):</label>
            <div className="flex gap-2">
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="input-field text-xs font-semibold"
              >
                <option value="PILOT_BASELINE">Realistic Nashik Pilot (Direct Buyer Wins)</option>
                <option value="MANDI_WINS">Mandi Wins (Distant Buyer & High Freight Tariff)</option>
                <option value="PROCESSING_BOTTLENECK">Processing Infeasible (Capacity Limit / Facility Down)</option>
                <option value="MISSING_DATA">Incomplete Data (Missing Processing Yield)</option>
              </select>

              <button
                onClick={() => activeLotId && runEvaluation(activeLotId, selectedScenario)}
                disabled={loading}
                className="btn-primary text-xs py-2 px-3.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-Evaluate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Phase 6 Feature Tabs Navigation */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('RECOMMENDATIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'RECOMMENDATIONS'
                ? 'bg-emerald-600 text-white shadow-xs'
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'SENSITIVITY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Sensitivity Analysis (3 Scenarios)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('OUTCOMES');
              if (decisionRun) loadOutcomeComparison(decisionRun.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'OUTCOMES'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Expected vs Actual Reconciliation</span>
          </button>

          <button
            onClick={() => setActiveTab('ASSUMPTIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ASSUMPTIONS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Disclosed Assumptions ({decisionRun?.assumptions_disclosed?.length || benchmarkAssumptions.length})</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
          <XCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center card space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <div className="text-sm font-bold text-slate-900">Running Deterministic Financial Engine...</div>
          <p className="text-xs text-slate-500">Validating hard constraints, calculating itemized deductions, and ranking feasible routes.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: RANKED RECOMMENDATIONS & PATHWAYS                                 */}
      {/* ========================================================================= */}
      {!loading && decisionRun && activeTab === 'RECOMMENDATIONS' && (
        <>
          {/* RECOMMENDED WINNER BANNER */}
          {recommendedOption ? (
            <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 via-green-50/60 to-white p-6 sm:p-8 space-y-5 shadow-sm relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                  <Award className="w-4 h-4" />
                  <span>RECOMMENDED BEST ROUTE</span>
                </span>

                {recommendedOption.time_to_payment_days && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Payment: ~{recommendedOption.time_to_payment_days} days</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Left: Route Name and Explanation */}
                <div className="space-y-3 lg:col-span-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                    {recommendedOption.route_name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/90 p-4 rounded-xl border border-emerald-200 shadow-2xs">
                    {recommendedOption.explanation}
                  </p>

                  {/* Operational constraints if any */}
                  {recommendedOption.operational_constraints && recommendedOption.operational_constraints.length > 0 && (
                    <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 space-y-1">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <BadgeAlert className="w-3.5 h-3.5 text-amber-600" />
                        <span>Execution Prerequisites & Constraints:</span>
                      </div>
                      <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                        {recommendedOption.operational_constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Additional Profit vs Mandi callout */}
                  {baselineOption && recommendedOption.route_type !== 'RAW_MANDI' && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold">
                      <TrendingUp className="w-4 h-4 text-emerald-700" />
                      <span>
                        +₹{Number(recommendedOption.additional_profit_vs_baseline).toLocaleString()} additional net profit vs local APMC Mandi benchmark
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Net Profit Metric Box */}
                <div className="bg-white p-6 rounded-2xl border-2 border-emerald-400 text-center space-y-2 shadow-xs">
                  <div className="label text-[11px] mb-0 text-slate-500">Estimated Net Profit</div>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-700">
                    ₹{Number(recommendedOption.net_profit).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-600 font-mono font-bold">
                    ₹{Number(recommendedOption.net_profit_per_kg).toFixed(2)} / kg net realization
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    Gross: ₹{Number(recommendedOption.gross_revenue).toLocaleString()} | Costs: ₹{Number(recommendedOption.total_costs).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="mt-4 pt-4 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-600 font-medium">
                  Ready to execute this optimal pathway? Lodge an execution request directly with matched partners.
                </span>
                <button
                  onClick={() => handleActionOption(recommendedOption)}
                  disabled={actionSubmitting === recommendedOption.id}
                  className="btn-primary text-xs py-2.5 px-4 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Action This Recommendation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <div className="text-base font-bold text-amber-950">No Feasible Route Confirmed</div>
              <p className="text-xs text-amber-800 max-w-xl mx-auto">
                None of the evaluated routes passed hard feasibility checks. Infeasible routes are strictly blocked from winning. Review rejected routes below.
              </p>
            </div>
          )}

          {/* RANKED FEASIBLE ROUTES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Ranked Feasible Routes ({feasibleOptions.length})</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Sorted strictly by Net Profit per kg</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {feasibleOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`card p-5 sm:p-6 space-y-4 transition-all ${
                    opt.is_recommended
                      ? 'border-emerald-400 bg-emerald-50/20 shadow-xs'
                      : 'hover:border-slate-300'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-black text-xs flex items-center justify-center">
                        #{opt.rank}
                      </span>
                      <div>
                        <div className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                          <span>{opt.route_name}</span>
                          {opt.is_recommended && (
                            <span className="badge-green text-[10px]">
                              WINNER
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{opt.data_source}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getFeasibilityBadge(opt.feasibility_status)}
                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-emerald-700">
                          ₹{Number(opt.net_profit).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono font-bold">
                          ₹{Number(opt.net_profit_per_kg).toFixed(2)} / kg
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="label text-[10px] mb-0.5">Saleable Output</span>
                      <span className="font-mono text-slate-800 font-bold">
                        {Number(opt.saleable_quantity).toLocaleString()} {opt.saleable_quantity_unit}
                      </span>
                    </div>
                    <div>
                      <span className="label text-[10px] mb-0.5">Gross Revenue</span>
                      <span className="font-mono text-slate-800 font-bold">
                        ₹{Number(opt.gross_revenue).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="label text-[10px] mb-0.5">Total Deductions</span>
                      <span className="font-mono text-rose-600 font-bold">
                        -₹{Number(opt.total_costs).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="label text-[10px] mb-0.5">vs Mandi Baseline</span>
                      <span className={`font-mono font-bold ${opt.additional_profit_vs_baseline >= 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {opt.additional_profit_vs_baseline >= 0 ? '+' : ''}₹{Number(opt.additional_profit_vs_baseline).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Explanation */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {opt.explanation}
                  </p>

                  {/* Itemized Cost Breakdown Toggle & Action Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => toggleExpand(opt.id)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {expandedOptionId === opt.id ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide Itemized Cost Breakdown</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>View Itemized Cost Breakdown ({opt.cost_breakdown.line_items?.length || 0} items)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleActionOption(opt)}
                      disabled={actionSubmitting === opt.id}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      <Send className="w-3 h-3 text-emerald-600" />
                      <span>Action Pathway</span>
                    </button>
                  </div>

                  {/* Expanded Cost Breakdown Drawer */}
                  {expandedOptionId === opt.id && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="label text-[10px] flex items-center gap-2">
                        <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Transparent Itemized Deductions (No Hidden Costs)</span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Cost Item</th>
                              <th className="p-2.5">Category</th>
                              <th className="p-2.5">Unit Rate</th>
                              <th className="p-2.5 text-right">Amount (INR)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                            {opt.cost_breakdown.line_items?.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/70">
                                <td className="p-2.5 font-sans font-medium text-slate-900">{item.name}</td>
                                <td className="p-2.5 text-slate-500 capitalize">{item.category}</td>
                                <td className="p-2.5 text-slate-500">
                                  {item.unit_rate ? `₹${item.unit_rate} ${item.unit_name || ''}` : '—'}
                                </td>
                                <td className="p-2.5 text-right font-bold text-rose-600">
                                  -₹{Number(item.amount).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50/90 font-bold border-t border-slate-200">
                              <td colSpan={3} className="p-2.5 font-sans text-slate-900 text-right">
                                Total Deductions:
                              </td>
                              <td className="p-2.5 text-right text-rose-600 font-mono">
                                -₹{Number(opt.total_costs).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* INFEASIBLE & NEEDS MORE DATA ROUTES */}
          {infeasibleOptions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
                  <ShieldCheck className="w-5 h-5 text-rose-600" />
                  <span>Infeasible & Incomplete Routes ({infeasibleOptions.length})</span>
                </h3>
                <span className="text-xs text-slate-500">Guaranteed Gating: Infeasible routes never win</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {infeasibleOptions.map((opt) => (
                  <div
                    key={opt.id}
                    className="p-5 rounded-2xl bg-white border border-rose-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                      <h4 className="text-sm font-bold text-slate-900">{opt.route_name}</h4>
                      {getFeasibilityBadge(opt.feasibility_status)}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {opt.explanation}
                    </p>

                    {/* Failed Constraint Details */}
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5 text-xs">
                      <div className="font-bold text-rose-700 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Hard Constraint / Data Gap:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                        {opt.feasibility_reasons.failed_checks?.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                        {opt.feasibility_reasons.data_gaps?.map((g, idx) => (
                          <li key={idx} className="text-purple-700 font-medium">{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SENSITIVITY & SCENARIO ANALYSIS                                   */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'SENSITIVITY' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
                  <Sliders className="w-5 h-5 text-emerald-600" />
                  <span>Multi-Scenario Sensitivity Explorer</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Assess how your estimated net proceeds hold up when market prices fluctuate, transport tariffs surge, or quality sorting rejections vary.
                </p>
              </div>

              {sensitivityResult && (
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-500">Recommendation Stability</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                    sensitivityResult.recommendation_stability === 'ROBUST'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {sensitivityResult.recommendation_stability}
                  </span>
                </div>
              )}
            </div>

            {/* Interactive Variance Sliders */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Price Shift:</span>
                  <span className="font-mono text-emerald-700">±{priceVariance}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={priceVariance}
                  onChange={(e) => setPriceVariance(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Downside mandi glut vs upside buyer premium</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Transport Tariff Surge:</span>
                  <span className="font-mono text-emerald-700">+{transportVariance}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="5"
                  value={transportVariance}
                  onChange={(e) => setTransportVariance(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Diesel price spike or rural vehicle shortage</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Sorting Rejection Variance:</span>
                  <span className="font-mono text-emerald-700">±{wastageVariance}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={wastageVariance}
                  onChange={(e) => setWastageVariance(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Buyer collection gate grading rigor</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => activeLotId && loadSensitivity(activeLotId)}
                disabled={sensitivityLoading}
                className="btn-primary text-xs py-2 px-4"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sensitivityLoading ? 'animate-spin' : ''}`} />
                <span>Re-Calculate Sensitivity</span>
              </button>
            </div>
          </div>

          {/* Scenario Comparison Cards */}
          {sensitivityResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sensitivityResult.scenarios.map((scen, idx) => {
                const isCons = scen.name === 'Conservative' || scen.scenario_type === 'CONSERVATIVE';
                const isExp = scen.name === 'Expected' || scen.scenario_type === 'EXPECTED';

                return (
                  <div
                    key={idx}
                    className={`card p-6 space-y-4 ${
                      isExp
                        ? 'border-2 border-emerald-500 bg-emerald-50/20'
                        : isCons
                        ? 'border-slate-300 bg-slate-50/40'
                        : 'border-blue-300 bg-blue-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        isExp
                          ? 'bg-emerald-600 text-white'
                          : isCons
                          ? 'bg-slate-700 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {scen.name || scen.scenario_type}
                      </span>

                      {scen.recommended_route && (
                        <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">
                          {scen.recommended_route}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                      {scen.description}
                    </p>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-1 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Projected Net Proceeds</div>
                      <div className={`text-2xl font-black font-mono ${
                        isExp
                          ? 'text-emerald-700'
                          : isCons
                          ? 'text-slate-800'
                          : 'text-blue-700'
                      }`}>
                        ₹{Number(scen.projected_net_profit).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Gross: ₹{Number(scen.projected_gross_revenue).toLocaleString()} | Costs: ₹{Number(scen.projected_total_costs).toLocaleString()}
                      </div>
                    </div>

                    {scen.net_profit_variance_inr !== undefined && (
                      <div className="text-xs flex items-center justify-between text-slate-600 pt-2 border-t border-slate-200">
                        <span>Variance vs Baseline:</span>
                        <span className={`font-mono font-bold ${
                          scen.net_profit_variance_inr >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}>
                          {scen.net_profit_variance_inr >= 0 ? '+' : ''}₹{Number(scen.net_profit_variance_inr).toLocaleString()}
                          {scen.net_profit_variance_pct !== undefined ? ` (${scen.net_profit_variance_pct}%)` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Vulnerability Warnings */}
          {sensitivityResult?.key_vulnerabilities && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Key Commercial Vulnerabilities to Monitor:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-800">
                {sensitivityResult.key_vulnerabilities.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EXPECTED VS ACTUAL RECONCILIATION                                */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'OUTCOMES' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  <span>Historical Decision vs Actual Outcome Reconciliation</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Verifies prediction accuracy by comparing original decision estimates against real weighbridge delivery records and payment receipts from Phase 5 Farmer Protection.
                </p>
              </div>

              {decisionRun && (
                <button
                  onClick={() => loadOutcomeComparison(decisionRun.id)}
                  disabled={outcomeLoading}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${outcomeLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Realization Data</span>
                </button>
              )}
            </div>

            {outcomeLoading ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                <span className="text-xs text-slate-600">Reconciling delivery and payment ledgers...</span>
              </div>
            ) : outcomeComparison?.has_actual_outcome ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-emerald-950 text-sm">
                      {outcomeComparison.status === 'RECONCILED' ? 'Completed Transaction Reconciled' : 'Partially Reconciled Transaction'}
                    </div>
                    <p className="mt-1 text-slate-700">{outcomeComparison.comparison_notes}</p>
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Financial Metric</th>
                        <th className="p-3 text-right">Engine Expected</th>
                        <th className="p-3 text-right">Actual Realized</th>
                        <th className="p-3 text-right">Variance</th>
                        <th className="p-3 text-right">Accuracy %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3 font-sans font-medium text-slate-900">Saleable Quantity</td>
                        <td className="p-3 text-right">{Number(outcomeComparison.expected_quantity_kg).toLocaleString()} kg</td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          {outcomeComparison.actual_quantity_kg ? `${Number(outcomeComparison.actual_quantity_kg).toLocaleString()} kg` : '—'}
                        </td>
                        <td className="p-3 text-right">
                          {outcomeComparison.quantity_variance_pct !== undefined ? `${outcomeComparison.quantity_variance_pct}%` : '—'}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          {outcomeComparison.quantity_variance_pct !== undefined
                            ? `${(100 - Math.abs(Number(outcomeComparison.quantity_variance_pct))).toFixed(1)}%`
                            : '—'}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3 font-sans font-medium text-slate-900">Realized Rate / kg</td>
                        <td className="p-3 text-right">₹{Number(outcomeComparison.expected_unit_price).toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          {outcomeComparison.actual_unit_price ? `₹${Number(outcomeComparison.actual_unit_price).toFixed(2)}` : '—'}
                        </td>
                        <td className="p-3 text-right">
                          {outcomeComparison.price_variance_pct !== undefined ? `${outcomeComparison.price_variance_pct}%` : '—'}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          {outcomeComparison.price_variance_pct !== undefined
                            ? `${(100 - Math.abs(Number(outcomeComparison.price_variance_pct))).toFixed(1)}%`
                            : '—'}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3 font-sans font-medium text-slate-900">Deductions (Transport & Fees)</td>
                        <td className="p-3 text-right text-rose-600">-₹{Number(outcomeComparison.estimated_deductions_inr).toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-rose-600">
                          {outcomeComparison.actual_deductions_inr !== undefined ? `-₹${Number(outcomeComparison.actual_deductions_inr).toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-right">
                          {outcomeComparison.deductions_variance_inr !== undefined ? `₹${Number(outcomeComparison.deductions_variance_inr).toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-500">—</td>
                      </tr>

                      <tr className="bg-emerald-50/50 font-bold border-t border-slate-200">
                        <td className="p-3 font-sans text-slate-900">Net Farmer Payout</td>
                        <td className="p-3 text-right text-emerald-700">₹{Number(outcomeComparison.estimated_net_profit_inr).toLocaleString()}</td>
                        <td className="p-3 text-right text-emerald-700 text-sm">
                          {outcomeComparison.actual_net_proceeds_inr !== undefined ? `₹${Number(outcomeComparison.actual_net_proceeds_inr).toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-right">
                          {outcomeComparison.net_profit_variance_inr !== undefined ? (
                            <span className={outcomeComparison.net_profit_variance_inr >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                              {outcomeComparison.net_profit_variance_inr >= 0 ? '+' : ''}₹{Number(outcomeComparison.net_profit_variance_inr).toLocaleString()}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="p-3 text-right text-emerald-700">
                          {outcomeComparison.net_profit_variance_pct !== undefined
                            ? `${(100 - Math.abs(Number(outcomeComparison.net_profit_variance_pct))).toFixed(1)}%`
                            : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-sm font-bold text-slate-800">Pending Execution / No Realized Deliveries Yet</div>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {outcomeComparison?.comparison_notes ||
                    'When you accept an agreement and complete delivery via the Smart Execution Network, actual weighbridge receipts and bank payment vouchers will be reconciled here against engine expectations.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DISCLOSED ASSUMPTIONS & PROVENANCE                                */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'ASSUMPTIONS' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>Transparent Assumptions & Data Provenance Register</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Every calculation in Agri2Value is grounded in disclosed, auditable cost parameters. We never hide assumptions behind a black-box AI model.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Assumption Parameter</th>
                    <th className="p-3">Applied Value</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Data Provenance</th>
                    <th className="p-3">Source & Verification Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(decisionRun?.assumptions_disclosed?.length ? decisionRun.assumptions_disclosed : benchmarkAssumptions).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{String(item.value)}</td>
                      <td className="p-3 font-mono text-slate-500">{item.unit}</td>
                      <td className="p-3">{getProvenanceBadge(item.provenance)}</td>
                      <td className="p-3 text-slate-600 text-[11px] leading-relaxed">{item.source_description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">Unit Normalization Standard:</div>
              <p>
                All prices and weights are strictly normalized to standard <strong>INR/kg</strong> and <strong>kg</strong> using official conversion standards (1 Quintal = 100 kg, 1 Tonne = 1,000 kg). Currency calculations utilize exact Decimal arithmetic to eliminate floating-point rounding errors.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transparent Input Snapshot & Audit Footer */}
      {!loading && decisionRun && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Auditable Calculation Snapshot:</span>
            <span className="font-mono text-[11px] text-slate-500">Run ID: {decisionRun.id.substring(0, 8)}...</span>
          </div>
          <p>
            Inputs: {decisionRun.input_snapshot.crop_name} {decisionRun.input_snapshot.variety ? `(${decisionRun.input_snapshot.variety})` : ''} — {decisionRun.input_snapshot.quantity_kg} kg | Grade {decisionRun.input_snapshot.quality_grade || 'Ungraded'} | Farm: {decisionRun.input_snapshot.farm_village}, {decisionRun.input_snapshot.farm_district}.
          </p>
          <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200">
            Timestamp: {new Date(decisionRun.created_at).toLocaleString()} | Algorithm: {decisionRun.algorithm_version}
          </div>
        </div>
      )}
    </div>
  );
};
