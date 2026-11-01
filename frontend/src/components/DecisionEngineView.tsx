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
  ArrowRight
} from 'lucide-react';
import type { CropLot, DecisionRun, DecisionOption, FeasibilityStatus } from '../types';
import { api } from '../api';

interface DecisionEngineViewProps {
  lots: CropLot[];
  selectedLotId?: string;
  onLotSelect?: (lotId: string) => void;
  onNavigateToExecution?: () => void;
}

export const DecisionEngineView: React.FC<DecisionEngineViewProps> = ({
  lots,
  selectedLotId,
  onLotSelect,
  onNavigateToExecution,
}) => {
  const activeLotId = selectedLotId || (lots.length > 0 ? lots[0].id : '');
  const activeLot = lots.find((l) => l.id === activeLotId) || lots[0];

  const [selectedScenario, setSelectedScenario] = useState<string>('PILOT_BASELINE');
  const [decisionRun, setDecisionRun] = useState<DecisionRun | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error('Failed to run decision engine:', err);
      setError(err.message || 'Decision evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeLotId) {
      runEvaluation(activeLotId, selectedScenario);
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

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="card p-6 sm:p-8 space-y-4 border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="badge-green">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Phase 2 Verified: Feasibility-Aware Profit Decision Engine</span>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-bold">
            Version: v2.0-deterministic
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3 font-display">
            <Cpu className="w-7 h-7 text-emerald-600" />
            <span>Profit Decision Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Evaluates your harvest lot against real market pathways, itemized transit and handling costs, 
            and strict feasibility constraints. Infeasible routes are filtered out before ranking.
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
            <label className="label">Simulation Scenario (Verification Test):</label>
            <div className="flex gap-2">
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="input-field text-xs font-semibold"
              >
                <option value="PILOT_BASELINE">Realistic Nashik Pilot (Direct Buyer Wins)</option>
                <option value="MANDI_WINS">Mandi Wins (Distant Buyer & High Logistics)</option>
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
      </div>

      {/* Sample Data Disclosure Notice */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-amber-900 leading-relaxed">
          <div className="font-extrabold text-amber-950">
            Illustrative Sample Data Disclosure (PCCOE Grand Challenge Pilot)
          </div>
          <p>
            All Mandi benchmark rates, institutional buyer quotes, processing yields, and cold storage rates displayed below 
            are explicitly labelled <strong>illustrative sample parameters</strong> based on the Niphad / Pimpalgaon cluster. 
            They are used for software calculation verification and do not represent live real-time API market guarantees.
          </p>
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

      {!loading && decisionRun && (
        <>
          {/* RECOMMENDED WINNER BANNER (JSPM Inspired Highlight) */}
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

              {/* Action Banner for Recommended Option */}
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
                None of the evaluated routes passed hard feasibility checks. Review the rejected routes below to see why they failed.
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

          {/* Transparent Input Snapshot & Audit Footer */}
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

        </>
      )}

    </div>
  );
};
