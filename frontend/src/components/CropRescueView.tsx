// frontend/src/components/CropRescueView.tsx
import React, { useState, useEffect } from 'react';
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
  const [executingPathway, setExecutingPathway] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Phase 6 Configurable Assumptions
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [customAssumptions, setCustomAssumptions] = useState<CropRescueCustomAssumptions>({
    ambient_shelf_life_days: 4,
    rainfall_alert_threshold_mm: 25,
    mandi_price_slump_threshold_pct: 25,
    cold_storage_monthly_rate_per_kg: 1.80,
    processing_recovery_pct: 28,
  });

  // Expanded deductions per pathway
  const [expandedPathwayIndex, setExpandedPathwayIndex] = useState<number | null>(null);

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
    if (activeLotId) {
      loadAssessment(activeLotId, customAssumptions);
    }
  };

  const handleResetAssumptions = () => {
    const defaults: CropRescueCustomAssumptions = {
      ambient_shelf_life_days: 4,
      rainfall_alert_threshold_mm: 25,
      mandi_price_slump_threshold_pct: 25,
      cold_storage_monthly_rate_per_kg: 1.80,
      processing_recovery_pct: 28,
    };
    setCustomAssumptions(defaults);
    if (activeLotId) {
      loadAssessment(activeLotId, defaults);
    }
  };

  const handleTriggerRescue = async (pathway: RescuePathwayOption) => {
    if (!assessment) return;
    setExecutingPathway(pathway.route_type);
    try {
      const payload: any = {
        crop_lot_id: assessment.crop_lot_id,
        route_type: pathway.route_type,
        requested_quantity_kg: assessment.quantity_kg,
        notes: `Urgent Crop Rescue Plan: Initiated under ${pathway.title} to salvage crop before spoilage or price collapse.`,
      };

      if (pathway.route_type === 'DIRECT_BUYER_FAST' && pathway.target_entity_id) {
        payload.buyer_id = pathway.target_entity_id;
      } else if (pathway.route_type === 'COLD_STORAGE_BUFFER' && pathway.target_entity_id) {
        payload.cold_storage_facility_id = pathway.target_entity_id;
      } else if (pathway.route_type === 'PROCESSING_PUREE' && pathway.target_entity_id) {
        payload.processing_facility_id = pathway.target_entity_id;
      }

      await api.createExecutionRequest(payload);
      setSuccessMessage(`Rescue order for ${pathway.title} successfully lodged in Smart Execution Network!`);
      setTimeout(() => {
        if (onNavigateToExecution) {
          onNavigateToExecution();
        }
      }, 1500);
    } catch (err: any) {
      alert(`Rescue order failed: ${err.message}`);
    } finally {
      setExecutingPathway(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-rose-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Flame className="w-48 h-48 text-rose-600" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge-red">
              <Flame className="w-3.5 h-3.5" /> Emergency Salvage Intelligence
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold">Phase 6 Grounded Rules</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Crop Rescue Mode (फसल बचाव मोड)
          </h1>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            When weather threats loom, ambient shelf-life is ticking down, or local APMC Mandi rates slump into a glut, Crop Rescue Mode rapidly compares transparent salvage pathways to prevent distress sales or total harvest spoilage.
          </p>
        </div>
      </div>

      {/* Lot Selector & Custom Assumptions Trigger */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="label text-[10px] mb-0 whitespace-nowrap">
            Select Harvest Lot:
          </label>
          <select
            value={activeLotId}
            onChange={(e) => handleSelectLot(e.target.value)}
            className="input-field text-xs font-semibold py-1.5"
          >
            {cropLots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.crop_name} {lot.variety ? `(${lot.variety})` : ''} — {lot.quantity_kg_normalized.toLocaleString()} kg [Grade {lot.quality_grade || 'A'}]
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className={`btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 ${
              showConfigDrawer ? 'bg-slate-200 border-slate-300' : ''
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-700" />
            <span>Customize Assumptions</span>
            {showConfigDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={() => activeLotId && loadAssessment(activeLotId, customAssumptions)}
            disabled={loading || !activeLotId}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-evaluate</span>
          </button>
        </div>
      </div>

      {/* Configurable Assumptions Drawer (Phase 6 Requirement) */}
      {showConfigDrawer && (
        <div className="card p-6 bg-slate-50/80 border-slate-300 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Configurable Agricultural Assumptions</h3>
            </div>
            <button
              onClick={handleResetAssumptions}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <p className="text-xs text-slate-600">
            Customize the biological shelf-life, rainfall sensitivity, or processing yield thresholds for your specific microclimate or variety.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Ambient Safe Shelf-Life (Days):</label>
              <input
                type="number"
                min="1"
                max="14"
                value={customAssumptions.ambient_shelf_life_days}
                onChange={(e) =>
                  setCustomAssumptions({ ...customAssumptions, ambient_shelf_life_days: Number(e.target.value) })
                }
                className="input-field text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500">Tomato limit before rot at 28-34°C</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Rainfall Alert Trigger (mm):</label>
              <input
                type="number"
                min="5"
                max="100"
                value={customAssumptions.rainfall_alert_threshold_mm}
                onChange={(e) =>
                  setCustomAssumptions({ ...customAssumptions, rainfall_alert_threshold_mm: Number(e.target.value) })
                }
                className="input-field text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500">Precipitation causing transit delay</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Puree Recovery Yield (%):</label>
              <input
                type="number"
                min="15"
                max="40"
                value={customAssumptions.processing_recovery_pct}
                onChange={(e) =>
                  setCustomAssumptions({ ...customAssumptions, processing_recovery_pct: Number(e.target.value) })
                }
                className="input-field text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500">28° Brix paste output yield from raw</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Cold Storage Tariff (₹/kg/mo):</label>
              <input
                type="number"
                step="0.10"
                min="0.5"
                max="5.0"
                value={customAssumptions.cold_storage_monthly_rate_per_kg}
                onChange={(e) =>
                  setCustomAssumptions({ ...customAssumptions, cold_storage_monthly_rate_per_kg: Number(e.target.value) })
                }
                className="input-field text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500">Commercial buffer storage fee</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleApplyCustomAssumptions} className="btn-primary text-xs py-2 px-4">
              <span>Apply Custom Parameters</span>
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={onNavigateToExecution} className="underline hover:text-emerald-950 text-xs font-bold">
            View in Orders →
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center card space-y-3">
          <div className="w-10 h-10 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-800">Assessing spoilage timeline, weather vulnerability, and mandi slumps...</p>
        </div>
      ) : assessment ? (
        <div className="space-y-6">
          {/* Top Diagnostics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Urgency Gauge */}
            <div
              className={`card p-6 ${
                assessment.urgency_level === 'CRITICAL'
                  ? 'border-rose-300 bg-rose-50/30'
                  : assessment.urgency_level === 'HIGH'
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="label text-[10px] mb-0">Urgency Index</span>
                <span
                  className={
                    assessment.urgency_level === 'CRITICAL'
                      ? 'badge-red'
                      : assessment.urgency_level === 'HIGH'
                      ? 'badge-yellow'
                      : 'badge-blue'
                  }
                >
                  {assessment.urgency_level}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl font-black font-mono ${
                    assessment.urgency_level === 'CRITICAL'
                      ? 'text-rose-600'
                      : assessment.urgency_level === 'HIGH'
                      ? 'text-amber-600'
                      : 'text-blue-600'
                  }`}
                >
                  {assessment.urgency_score}
                </span>
                <span className="text-slate-400 text-sm font-bold">/ 100</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    assessment.urgency_level === 'CRITICAL'
                      ? 'bg-rose-600'
                      : assessment.urgency_level === 'HIGH'
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${assessment.urgency_score}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {assessment.urgency_level === 'CRITICAL'
                  ? 'Urgent action required within 24-48 hours to avert loss.'
                  : 'Monitor closely or buffer in cold storage.'}
              </p>
            </div>

            {/* Risk Reasons & Triggers */}
            <div className="card p-6 md:col-span-2 space-y-3">
              <span className="label text-[10px] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Root Causes & Risk Signals Flagged
              </span>

              <div className="space-y-2">
                {assessment.risk_reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="font-medium">{reason}</span>
                  </div>
                ))}
              </div>

              {/* Weather & Mandi pills */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                {assessment.weather_alert && (
                  <span className="badge-blue">
                    <CloudRain className="w-3.5 h-3.5" />
                    {assessment.weather_alert}
                  </span>
                )}
                {assessment.mandi_price_signal && (
                  <span className="badge-red">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {assessment.mandi_price_signal}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Transparent Scenario Comparison Notes */}
          {assessment.scenario_comparison_notes && assessment.scenario_comparison_notes.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5 text-xs text-blue-950">
              <div className="font-bold flex items-center gap-1.5 text-blue-900">
                <Info className="w-4 h-4 text-blue-700" />
                <span>Transparent Scenario Comparison:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {assessment.scenario_comparison_notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Ranked Salvage Pathways */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Ranked Salvage Pathways (अनुशंसित बचाव विकल्प)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated using transparent financial recovery criteria, logistical time-to-safety, and real-time facility readiness.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessment.salvage_pathways.map((pathway, idx) => {
                const isExecuting = executingPathway === pathway.route_type;
                const isRecommended = idx === 0;
                const isExpanded = expandedPathwayIndex === idx;

                return (
                  <div
                    key={pathway.route_type}
                    className={`card p-6 flex flex-col justify-between relative transition-all ${
                      isRecommended
                        ? 'border-2 border-emerald-400 bg-emerald-50/20 shadow-xs'
                        : 'hover:border-slate-300'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider shadow-xs">
                        ★ Primary Recommendation
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="label text-[10px] mb-0.5">
                            Option {idx + 1} • {pathway.channel_name}
                          </div>
                          <h4 className="text-base font-extrabold text-slate-900">{pathway.title}</h4>
                        </div>

                        {pathway.feasibility_status && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pathway.feasibility_status === 'FEASIBLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {pathway.feasibility_status}
                          </span>
                        )}
                      </div>

                      {/* Financial Projection */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="label text-[10px] mb-0.5">Estimated Salvaged Net Payout</div>
                          <div className="text-2xl font-black font-mono text-emerald-700">
                            ₹{Math.round(pathway.estimated_net_payout).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="label text-[10px] mb-0.5">Value Salvaged</div>
                          <div className="text-lg font-black text-slate-900 font-mono">
                            {pathway.salvaged_value_pct}%
                          </div>
                        </div>
                      </div>

                      {/* Operational metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <div className="label text-[9px] mb-0">Time-to-Safety</div>
                            <div className="font-bold text-slate-800">{pathway.time_to_safety_hours} hours</div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <div className="label text-[9px] mb-0">Readiness</div>
                            <div className="font-bold text-slate-800">{pathway.capacity_status}</div>
                          </div>
                        </div>
                      </div>

                      {/* Itemized Deductions Expander */}
                      {pathway.itemized_deductions && pathway.itemized_deductions.length > 0 && (
                        <div>
                          <button
                            onClick={() => setExpandedPathwayIndex(isExpanded ? null : idx)}
                            className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>{isExpanded ? 'Hide' : 'Show'} Itemized Costs ({pathway.itemized_deductions.length})</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-2.5 rounded-lg bg-slate-100/70 border border-slate-200 text-xs space-y-1 font-mono">
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

                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">
                        Risk level: <strong className="text-slate-800">{pathway.risk_level}</strong>
                      </div>

                      <button
                        onClick={() => handleTriggerRescue(pathway)}
                        disabled={isExecuting}
                        className={`text-xs py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                          isRecommended
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {isExecuting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>{pathway.action_button_label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disclosed Crop Rescue Assumptions */}
          {assessment.assumptions_disclosed && assessment.assumptions_disclosed.length > 0 && (
            <div className="card p-6 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Crop Rescue Operational Assumptions Disclosed</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Assumption</th>
                      <th className="p-2.5">Value</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5">Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {assessment.assumptions_disclosed.map((assump: AssumptionItem, ai: number) => (
                      <tr key={ai}>
                        <td className="p-2.5 font-medium text-slate-900">{assump.name}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">{String(assump.value)}</td>
                        <td className="p-2.5 font-mono text-slate-500">{assump.unit}</td>
                        <td className="p-2.5 text-slate-600 text-[11px]">{assump.source_description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
