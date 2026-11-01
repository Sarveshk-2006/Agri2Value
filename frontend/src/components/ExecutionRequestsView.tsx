// frontend/src/components/ExecutionRequestsView.tsx
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Warehouse,
  Factory,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Coins,
  History,
  X,
  PlayCircle,
  UserCheck,
} from 'lucide-react';
import type { ExecutionRequest, CropLot } from '../types';
import { api } from '../api';

interface ExecutionRequestsViewProps {
  cropLots?: CropLot[];
  onNavigateToBuyers?: () => void;
  onNavigateToInfra?: () => void;
}

const STATUS_STEPS = [
  { key: 'SUBMITTED', label: 'Submitted', desc: 'Enquiry sent to provider' },
  { key: 'PROVIDER_ACCEPTED', label: 'Accepted', desc: 'Provider accepted terms' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Capacity reserved' },
  { key: 'IN_EXECUTION', label: 'In Execution', desc: 'Harvest / Transit / Processing' },
  { key: 'COMPLETED', label: 'Completed', desc: 'Settled & Realized' },
];

export const ExecutionRequestsView: React.FC<ExecutionRequestsViewProps> = ({
  onNavigateToBuyers,
  onNavigateToInfra,
}) => {
  const [requests, setRequests] = useState<ExecutionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Completion modal state
  const [completingRequest, setCompletingRequest] = useState<ExecutionRequest | null>(null);
  const [actualQty, setActualQty] = useState<number>(0);
  const [actualPrice, setActualPrice] = useState<number>(0);
  const [actualLogistics, setActualLogistics] = useState<number>(0);
  const [actualStorage, setActualStorage] = useState<number>(0);
  const [actualProcessing, setActualProcessing] = useState<number>(0);
  const [completionNotes, setCompletionNotes] = useState<string>('');

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getExecutionRequests();
      setRequests(data);
      if (data.length > 0 && !expandedRequestId) {
        setExpandedRequestId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load execution requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAdvanceStatus = async (request: ExecutionRequest, nextStatus: string) => {
    setActionLoading(request.id);
    try {
      const msgMap: Record<string, string> = {
        PROVIDER_ACCEPTED: 'Provider confirmed terms and availability',
        CONFIRMED: 'Farmer verified booking; capacity reserved in escrow lock',
        IN_EXECUTION: 'Goods dispatched from farmgate / in-transit',
      };
      const message = msgMap[nextStatus] || `Advanced status to ${nextStatus}`;
      const updated = await api.transitionExecutionStatus(request.id, nextStatus, message);
      setRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      alert(`Transition error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (request: ExecutionRequest) => {
    if (!window.confirm('Are you sure you want to cancel this request? Any reserved capacity will be released.')) {
      return;
    }
    setActionLoading(request.id);
    try {
      const updated = await api.transitionExecutionStatus(request.id, 'CANCELLED', 'Cancelled by farmer request');
      setRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenCompleteModal = (req: ExecutionRequest) => {
    setCompletingRequest(req);
    setActualQty(req.requested_quantity_kg);
    setActualPrice(req.indicative_unit_price);
    setActualLogistics(req.indicative_logistics_cost || 0);
    setActualStorage(req.indicative_storage_cost || 0);
    setActualProcessing(req.indicative_processing_cost || 0);
    setCompletionNotes('Weighbridge slip verified at delivery yard.');
  };

  const handleSubmitComplete = async () => {
    if (!completingRequest) return;
    setActionLoading(completingRequest.id);
    try {
      const updated = await api.completeExecutionRequest(completingRequest.id, {
        actual_quantity_kg: Number(actualQty),
        actual_unit_price: Number(actualPrice),
        actual_logistics_cost: Number(actualLogistics),
        actual_storage_cost: Number(actualStorage),
        actual_processing_cost: Number(actualProcessing),
        completion_notes: completionNotes,
      });
      setRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setCompletingRequest(null);
    } catch (err: any) {
      alert(`Failed to complete: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status);
    if (filterStatus === 'COMPLETED') return r.status === 'COMPLETED';
    if (filterStatus === 'TERMINATED') return ['CANCELLED', 'REJECTED'].includes(r.status);
    return r.status === filterStatus;
  });

  const getStepIndex = (status: string) => {
    if (status === 'CANCELLED' || status === 'REJECTED') return -1;
    return STATUS_STEPS.findIndex(s => s.key === status);
  };

  const getRouteIcon = (route: string) => {
    if (route.includes('BUYER')) return <UserCheck className="w-4 h-4 text-emerald-400" />;
    if (route.includes('STORAGE')) return <Warehouse className="w-4 h-4 text-cyan-400" />;
    if (route.includes('PROCESSING')) return <Factory className="w-4 h-4 text-purple-400" />;
    return <Truck className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-400" />
              Smart Execution Tracker
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Traceable Workflow
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            End-to-end lifecycle from profit recommendation to confirmed booking and realized settlement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadRequests}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'ACTIVE', 'COMPLETED', 'TERMINATED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterStatus === status
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {status} ({
              requests.filter(r => {
                if (status === 'ALL') return true;
                if (status === 'ACTIVE') return !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status);
                if (status === 'COMPLETED') return r.status === 'COMPLETED';
                return ['CANCELLED', 'REJECTED'].includes(r.status);
              }).length
            })
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Retrieving your execution workflow history...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No execution requests found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You haven't initiated any harvest sale or infrastructure bookings yet. Browse verified commercial buyers or reserve cold storage / processing facilities to get started.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onNavigateToBuyers && (
              <button
                onClick={onNavigateToBuyers}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                Browse Buyers
              </button>
            )}
            {onNavigateToInfra && (
              <button
                onClick={onNavigateToInfra}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Book Infrastructure
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const isExpanded = expandedRequestId === req.id;
            const currentStepIdx = getStepIndex(req.status);
            const isTerminated = req.status === 'CANCELLED' || req.status === 'REJECTED';

            return (
              <div
                key={req.id}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-lg transition-all"
              >
                {/* Header Card Summary */}
                <div
                  onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                  className="p-5 cursor-pointer hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      {getRouteIcon(req.route_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100 text-base">
                          {req.route_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          #{req.id.substring(0, 8)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                            req.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : req.status === 'CONFIRMED'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : req.status === 'IN_EXECUTION'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                              : isTerminated
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {req.status}
                        </span>
                        {req.data_mode === 'DEMO_SIMULATION' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span>Quantity: <strong className="text-slate-200">{req.requested_quantity_kg.toLocaleString()} kg</strong></span>
                        <span>•</span>
                        <span>Date: {new Date(req.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Route: {req.pickup_location} → {req.delivery_location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Indicative Net Payout</div>
                      <div className="text-lg font-bold text-emerald-400">
                        ₹{Math.round(req.indicative_net_payout).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/40 p-5 space-y-6">
                    {/* Stepper Workflow Progress */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        Execution Stage & Verification State
                      </h4>
                      {isTerminated ? (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>This request was {req.status.toLowerCase()}. Capacity reservations have been released.</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 relative">
                          {STATUS_STEPS.map((step, idx) => {
                            const isDone = currentStepIdx >= idx;
                            const isCurrent = currentStepIdx === idx;
                            return (
                              <div
                                key={step.key}
                                className={`p-3 rounded-xl border transition-all ${
                                  isCurrent
                                    ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm'
                                    : isDone
                                    ? 'bg-slate-900 border-slate-700/80'
                                    : 'bg-slate-900/40 border-slate-800 opacity-50'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  {isDone ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] text-slate-400">
                                      {idx + 1}
                                    </div>
                                  )}
                                  <span className={`text-xs font-semibold ${isCurrent ? 'text-emerald-300' : isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                                    {step.label}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-tight">
                                  {step.desc}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Financial Reconciliation (Estimates vs Actual Realized) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Indicative Decision Estimates */}
                      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                            Decision Engine Estimate (Snapshot)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Immutable</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Indicative Volume</span>
                            <span className="text-slate-200">{req.requested_quantity_kg.toLocaleString()} kg</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Indicative Unit Price</span>
                            <span className="text-slate-200">₹{req.indicative_unit_price}/kg</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Gross Cargo Value</span>
                            <span className="text-slate-200">₹{Math.round(req.indicative_total_value).toLocaleString()}</span>
                          </div>
                          {req.indicative_logistics_cost > 0 && (
                            <div className="flex justify-between text-slate-400">
                              <span>Logistics & Transport</span>
                              <span className="text-rose-400">-₹{Math.round(req.indicative_logistics_cost).toLocaleString()}</span>
                            </div>
                          )}
                          {req.indicative_storage_cost > 0 && (
                            <div className="flex justify-between text-slate-400">
                              <span>Cold Storage Tariff</span>
                              <span className="text-rose-400">-₹{Math.round(req.indicative_storage_cost).toLocaleString()}</span>
                            </div>
                          )}
                          {req.indicative_processing_cost > 0 && (
                            <div className="flex justify-between text-slate-400">
                              <span>Processing Charge</span>
                              <span className="text-rose-400">-₹{Math.round(req.indicative_processing_cost).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="pt-2 border-t border-slate-800 flex justify-between font-semibold">
                            <span className="text-slate-200">Estimated Net Payout</span>
                            <span className="text-emerald-400">₹{Math.round(req.indicative_net_payout).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actual Realized Settlement */}
                      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            Actual Realized Outcome
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${req.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                            {req.status === 'COMPLETED' ? 'Settled' : 'Pending Completion'}
                          </span>
                        </div>
                        {req.status === 'COMPLETED' && req.actual_net_payout !== undefined ? (
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-400">
                              <span>Weighbridge Verified Qty</span>
                              <span className="text-slate-200 font-semibold">{req.actual_quantity_kg?.toLocaleString()} kg</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Settled Unit Price</span>
                              <span className="text-slate-200 font-semibold">₹{req.actual_unit_price}/kg</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Realized Gross Revenue</span>
                              <span className="text-slate-200">₹{Math.round(req.actual_gross_revenue || 0).toLocaleString()}</span>
                            </div>
                            {(req.actual_logistics_cost || 0) > 0 && (
                              <div className="flex justify-between text-slate-400">
                                <span>Actual Transport Cost</span>
                                <span className="text-rose-400">-₹{Math.round(req.actual_logistics_cost || 0).toLocaleString()}</span>
                              </div>
                            )}
                            {(req.actual_storage_cost || 0) > 0 && (
                              <div className="flex justify-between text-slate-400">
                                <span>Actual Storage Cost</span>
                                <span className="text-rose-400">-₹{Math.round(req.actual_storage_cost || 0).toLocaleString()}</span>
                              </div>
                            )}
                            {(req.actual_processing_cost || 0) > 0 && (
                              <div className="flex justify-between text-slate-400">
                                <span>Actual Processing Fee</span>
                                <span className="text-rose-400">-₹{Math.round(req.actual_processing_cost || 0).toLocaleString()}</span>
                              </div>
                            )}
                            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold">
                              <span className="text-slate-200">Realized Farmer Payout</span>
                              <span className="text-emerald-400 text-sm">₹{Math.round(req.actual_net_payout).toLocaleString()}</span>
                            </div>
                            {req.completion_notes && (
                              <p className="text-[11px] text-slate-400 italic pt-1">
                                Note: {req.completion_notes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-xs text-slate-500">
                            Realized receipts and weighbridge quantities will be recorded upon completion.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline & Audit Events */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        Audit Trail & Timestamped Events ({req.events?.length || 0})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {req.events && req.events.length > 0 ? (
                          req.events.map(ev => (
                            <div
                              key={ev.id}
                              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-start justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-200">
                                    {ev.to_status}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                    {ev.actor_role}
                                  </span>
                                </div>
                                <p className="text-slate-400 mt-0.5">{ev.message}</p>
                              </div>
                              <span className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">
                                {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-500 italic">No events logged yet.</div>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500">
                        {req.data_mode === 'DEMO_SIMULATION' && (
                          <span>Demo mode allows you to simulate each step in the commercial execution lifecycle.</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => handleCancelRequest(req)}
                              disabled={actionLoading === req.id}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs rounded-lg border border-rose-500/30 transition-colors"
                            >
                              Cancel Request
                            </button>
                            <button
                              onClick={() => handleAdvanceStatus(req, 'PROVIDER_ACCEPTED')}
                              disabled={actionLoading === req.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              Simulate: Accept Request
                            </button>
                          </>
                        )}

                        {req.status === 'PROVIDER_ACCEPTED' && (
                          <>
                            <button
                              onClick={() => handleCancelRequest(req)}
                              disabled={actionLoading === req.id}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs rounded-lg border border-rose-500/30 transition-colors"
                            >
                              Decline & Cancel
                            </button>
                            <button
                              onClick={() => handleAdvanceStatus(req, 'CONFIRMED')}
                              disabled={actionLoading === req.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg shadow transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Confirm & Reserve Capacity
                            </button>
                          </>
                        )}

                        {req.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleAdvanceStatus(req, 'IN_EXECUTION')}
                            disabled={actionLoading === req.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Dispatch / Start Transit
                          </button>
                        )}

                        {req.status === 'IN_EXECUTION' && (
                          <button
                            onClick={() => handleOpenCompleteModal(req)}
                            disabled={actionLoading === req.id}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow transition-colors"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            Record Completion Settlement
                          </button>
                        )}

                        {req.status === 'COMPLETED' && (
                          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Order Fulfilled & Closed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completion Modal */}
      {completingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Record Settlement & Actuals
                </h3>
              </div>
              <button
                onClick={() => setCompletingRequest(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Record final weighbridge numbers and realized deductions. Note: This updates the execution record only; the original Profit Engine recommendation snapshot remains permanently immutable.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Weighbridge Quantity (kg)
                </label>
                <input
                  type="number"
                  value={actualQty}
                  onChange={e => setActualQty(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Settled Unit Price (₹/kg)
                </label>
                <input
                  type="number"
                  value={actualPrice}
                  onChange={e => setActualPrice(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Transport (₹)</label>
                  <input
                    type="number"
                    value={actualLogistics}
                    onChange={e => setActualLogistics(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Storage (₹)</label>
                  <input
                    type="number"
                    value={actualStorage}
                    onChange={e => setActualStorage(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Processing (₹)</label>
                  <input
                    type="number"
                    value={actualProcessing}
                    onChange={e => setActualProcessing(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300 font-semibold">Calculated Net Payout:</span>
                <span className="text-base font-bold text-emerald-400">
                  ₹{Math.round(actualQty * actualPrice - actualLogistics - actualStorage - actualProcessing).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Completion Notes / Weighment Slip Ref
                </label>
                <textarea
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Weighbridge slip #WB-88192 from Pimpalgaon Yard"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setCompletingRequest(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitComplete}
                disabled={actionLoading === completingRequest.id}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
              >
                {actionLoading === completingRequest.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
