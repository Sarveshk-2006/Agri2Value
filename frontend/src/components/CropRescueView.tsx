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
} from 'lucide-react';
import type { CropLot, CropRescueAssessment, RescuePathwayOption } from '../types';
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

  useEffect(() => {
    if (selectedLotId && selectedLotId !== activeLotId) {
      setActiveLotId(selectedLotId);
    }
  }, [selectedLotId]);

  const loadAssessment = async (lotId: string) => {
    if (!lotId) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const data = await api.getCropRescueAssessment(lotId);
      setAssessment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate crop rescue urgency');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeLotId) {
      loadAssessment(activeLotId);
    }
  }, [activeLotId]);

  const handleSelectLot = (id: string) => {
    setActiveLotId(id);
    if (onLotSelect) onLotSelect(id);
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
      <div className="rounded-2xl p-6 bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/40 border border-rose-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Flame className="w-48 h-48 text-rose-500" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
              <Flame className="w-3.5 h-3.5" /> Emergency Salvage Workflow
            </span>
            <span className="text-xs text-slate-400 font-mono">Phase 3 Crop Rescue</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Crop Rescue Mode (फसल बचाव मोड)
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            When weather threats loom, shelf-life is ticking down, or local mandi prices experience an extreme glut, Crop Rescue Mode rapidly identifies and ranks alternative value pathways to prevent distress sales or total harvest spoilage.
          </p>
        </div>
      </div>

      {/* Lot Selector Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Select Harvest Lot:
          </label>
          <select
            value={activeLotId}
            onChange={e => handleSelectLot(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-rose-500"
          >
            {cropLots.map(lot => (
              <option key={lot.id} value={lot.id}>
                {lot.crop_name} {lot.variety ? `(${lot.variety})` : ''} — {lot.quantity_kg_normalized.toLocaleString()} kg [Grade {lot.quality_grade || 'A'}]
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => activeLotId && loadAssessment(activeLotId)}
          disabled={loading || !activeLotId}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-evaluate Lot Risk
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={onNavigateToExecution}
            className="underline hover:text-emerald-200 text-xs font-bold"
          >
            View in Orders →
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-slate-400 space-y-3">
          <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Assessing spoilage timeline, weather vulnerability, and mandi slumps...</p>
        </div>
      ) : assessment ? (
        <div className="space-y-6">
          {/* Top Diagnostics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Urgency Gauge */}
            <div className={`p-5 rounded-2xl border ${
              assessment.urgency_level === 'CRITICAL'
                ? 'bg-rose-950/40 border-rose-500/40'
                : assessment.urgency_level === 'HIGH'
                ? 'bg-amber-950/40 border-amber-500/40'
                : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Urgency Index
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  assessment.urgency_level === 'CRITICAL'
                    ? 'bg-rose-500 text-slate-950'
                    : assessment.urgency_level === 'HIGH'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-blue-500 text-slate-950'
                }`}>
                  {assessment.urgency_level}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-extrabold ${
                  assessment.urgency_level === 'CRITICAL'
                    ? 'text-rose-400'
                    : assessment.urgency_level === 'HIGH'
                    ? 'text-amber-400'
                    : 'text-blue-400'
                }`}>
                  {assessment.urgency_score}
                </span>
                <span className="text-slate-400 text-sm">/ 100</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    assessment.urgency_level === 'CRITICAL'
                      ? 'bg-rose-500'
                      : assessment.urgency_level === 'HIGH'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${assessment.urgency_score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {assessment.urgency_level === 'CRITICAL'
                  ? 'Urgent action required within 24-48 hours to avert loss.'
                  : 'Monitor closely or buffer in storage.'}
              </p>
            </div>

            {/* Risk Reasons & Triggers */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 md:col-span-2 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Root Causes & Risk Signals Flagged
              </span>

              <div className="space-y-2">
                {assessment.risk_reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Weather & Mandi pills */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                {assessment.weather_alert && (
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                    <CloudRain className="w-3 h-3" />
                    {assessment.weather_alert}
                  </span>
                )}
                {assessment.mandi_price_signal && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    {assessment.mandi_price_signal}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Missing Data Disclaimers if any */}
          {assessment.missing_data_warnings && assessment.missing_data_warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-300">Data Transparency Note: </span>
                {assessment.missing_data_warnings.join(' • ')}
              </div>
            </div>
          )}

          {/* 4 Ranked Salvage Pathways */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Ranked Salvage Pathways (अनुशंसित बचाव विकल्प)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluated using transparent financial recovery criteria, logistical time-to-safety, and real-time facility readiness.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessment.salvage_pathways.map((pathway, idx) => {
                const isExecuting = executingPathway === pathway.route_type;
                const isRecommended = idx === 0;

                return (
                  <div
                    key={pathway.route_type}
                    className={`rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                      isRecommended
                        ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/50'
                        : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider shadow">
                        ★ Primary Recommendation
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                            Option {idx + 1} • {pathway.channel_name}
                          </div>
                          <h4 className="text-base font-bold text-slate-100 mt-0.5">
                            {pathway.title}
                          </h4>
                        </div>
                      </div>

                      {/* Financial Projection */}
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-slate-400">Estimated Salvaged Net Payout</div>
                          <div className="text-xl font-extrabold text-emerald-400">
                            ₹{Math.round(pathway.estimated_net_payout).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400">Value Salvaged</div>
                          <div className="text-base font-bold text-slate-200">
                            {pathway.salvaged_value_pct}%
                          </div>
                        </div>
                      </div>

                      {/* Operational metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <div>
                            <div className="text-[10px] text-slate-400">Time-to-Safety</div>
                            <div className="font-semibold text-slate-200">{pathway.time_to_safety_hours} hours</div>
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
                          <Warehouse className="w-3.5 h-3.5 text-blue-400" />
                          <div>
                            <div className="text-[10px] text-slate-400">Readiness</div>
                            <div className="font-semibold text-slate-200">{pathway.capacity_status}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-400">
                        Risk level: <strong className="text-slate-200">{pathway.risk_level}</strong>
                      </div>

                      <button
                        onClick={() => handleTriggerRescue(pathway)}
                        disabled={isExecuting}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                          isRecommended
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isExecuting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                        {pathway.action_button_label}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transparent Algorithm & Disclaimer Card */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 space-y-1.5">
            <div className="font-semibold text-slate-400">
              Deterministic Decision Criteria & Safe Limits:
            </div>
            <p>
              {assessment.disclaimer}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
