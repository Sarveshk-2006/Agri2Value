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
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Coins,
  X,
  UserCheck
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
    if (route.includes('BUYER')) return <UserCheck className="w-5 h-5 text-emerald-600" />;
    if (route.includes('STORAGE')) return <Warehouse className="w-5 h-5 text-blue-600" />;
    if (route.includes('PROCESSING')) return <Factory className="w-5 h-5 text-purple-600" />;
    return <Truck className="w-5 h-5 text-amber-600" />;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">
              Smart Execution Tracker
            </h1>
            <span className="badge-green">
              Traceable Workflow
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            End-to-end lifecycle from profit recommendation to confirmed booking, in-transit tracking, and realized settlement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadRequests}
            disabled={loading}
            className="btn-secondary text-xs py-2 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
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
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterStatus === status
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
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
        <div className="py-20 text-center text-slate-400 card">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Retrieving your execution workflow history...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 rounded-2xl card text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No execution requests found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You haven't initiated any harvest sale or infrastructure bookings yet. Browse verified commercial buyers or reserve cold storage / processing facilities to get started.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onNavigateToBuyers && (
              <button
                onClick={onNavigateToBuyers}
                className="btn-primary text-xs"
              >
                Browse Buyers
              </button>
            )}
            {onNavigateToInfra && (
              <button
                onClick={onNavigateToInfra}
                className="btn-secondary text-xs"
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
                className="card overflow-hidden hover:border-slate-300 transition-all"
              >
                {/* Header Card Summary */}
                <div
                  onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                  className="p-5 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      {getRouteIcon(req.route_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-base">
                          {req.route_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{req.id.substring(0, 8)}
                        </span>
                        <span
                          className={
                            req.status === 'COMPLETED'
                              ? 'badge-green'
                              : req.status === 'CONFIRMED'
                              ? 'badge-blue'
                              : req.status === 'IN_EXECUTION'
                              ? 'badge-yellow soft-pulse'
                              : isTerminated
                              ? 'badge-red'
                              : 'badge-slate'
                          }
                        >
                          {req.status}
                        </span>
                        {req.data_mode === 'DEMO_SIMULATION' && (
                          <span className="badge-yellow text-[9px]">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span>Quantity: <strong className="text-slate-800">{req.requested_quantity_kg.toLocaleString()} kg</strong></span>
                        <span>•</span>
                        <span>Date: {new Date(req.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Route: {req.pickup_location} → {req.delivery_location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <div className="label text-[10px] mb-0">Indicative Net Payout</div>
                      <div className="text-xl font-black font-mono text-emerald-700">
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
                  <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-6">
                    {/* Stepper Workflow Progress */}
                    <div>
                      <div className="label text-[10px] mb-3">
                        Execution Stage & Verification State
                      </div>
                      {isTerminated ? (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
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
                                    ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                                    : isDone
                                    ? 'bg-white border-slate-200'
                                    : 'bg-white/60 border-slate-200/60 opacity-50'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[9px] text-slate-600 font-bold">
                                      {idx + 1}
                                    </div>
                                  )}
                                  <span className={`text-xs font-bold ${isCurrent ? 'text-emerald-800' : isDone ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {step.label}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
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
                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                            Decision Engine Estimate (Snapshot)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Immutable</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-600">
                            <span>Indicative Volume</span>
                            <span className="font-bold text-slate-800">{req.requested_quantity_kg.toLocaleString()} kg</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Indicative Unit Price</span>
                            <span className="font-bold text-slate-800">₹{req.indicative_unit_price}/kg</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Gross Cargo Value</span>
                            <span className="font-bold text-slate-800">₹{Math.round(req.indicative_total_value).toLocaleString()}</span>
                          </div>
                          {req.indicative_logistics_cost > 0 && (
                            <div className="flex justify-between text-slate-600">
                              <span>Logistics & Transport</span>
                              <span className="text-rose-600 font-bold">-₹{Math.round(req.indicative_logistics_cost).toLocaleString()}</span>
                            </div>
                          )}
                          {req.indicative_storage_cost > 0 && (
                            <div className="flex justify-between text-slate-600">
                              <span>Cold Storage Tariff</span>
                              <span className="text-rose-600 font-bold">-₹{Math.round(req.indicative_storage_cost).toLocaleString()}</span>
                            </div>
                          )}
                          {req.indicative_processing_cost > 0 && (
                            <div className="flex justify-between text-slate-600">
                              <span>Processing Charge</span>
                              <span className="text-rose-600 font-bold">-₹{Math.round(req.indicative_processing_cost).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="pt-2 border-t border-slate-100 flex justify-between font-bold">
                            <span className="text-slate-800">Estimated Net Payout</span>
                            <span className="text-emerald-700 font-mono">₹{Math.round(req.indicative_net_payout).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actual Realized Settlement */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            Actual Realized Outcome
                          </span>
                          <span className={req.status === 'COMPLETED' ? 'badge-green text-[10px]' : 'badge-slate text-[10px]'}>
                            {req.status === 'COMPLETED' ? 'Settled' : 'Pending Settlement'}
                          </span>
                        </div>
                        {req.status === 'COMPLETED' && req.actual_net_payout !== undefined ? (
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-600">
                              <span>Weighbridge Verified Qty</span>
                              <span className="text-slate-800 font-bold">{req.actual_quantity_kg?.toLocaleString()} kg</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Settlement Rate</span>
                              <span className="text-slate-800 font-bold">₹{req.actual_unit_price}/kg</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Actual Realized Gross</span>
                              <span className="text-slate-800 font-bold">₹{Math.round(req.actual_gross_revenue || 0).toLocaleString()}</span>
                            </div>
                            {req.actual_logistics_cost ? (
                              <div className="flex justify-between text-slate-600">
                                <span>Actual Transport Cost</span>
                                <span className="text-rose-600 font-bold">-₹{Math.round(req.actual_logistics_cost).toLocaleString()}</span>
                              </div>
                            ) : null}
                            <div className="pt-2 border-t border-slate-100 flex justify-between font-extrabold text-sm">
                              <span className="text-slate-900">Realized Farmer Payout</span>
                              <span className="text-emerald-700 font-mono">₹{Math.round(req.actual_net_payout).toLocaleString()}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 text-center text-slate-400 space-y-1">
                            <p className="text-xs">Financial settlement pending execution completion.</p>
                            <span className="text-[11px] text-slate-500">Values update upon delivery & weighbridge verification.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational Action Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        {req.status === 'SUBMITTED' && (
                          <button
                            onClick={() => handleAdvanceStatus(req, 'PROVIDER_ACCEPTED')}
                            disabled={actionLoading === req.id}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            <span>Accept Terms (Provider)</span>
                          </button>
                        )}
                        {req.status === 'PROVIDER_ACCEPTED' && (
                          <button
                            onClick={() => handleAdvanceStatus(req, 'CONFIRMED')}
                            disabled={actionLoading === req.id}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            <span>Confirm & Lock Capacity</span>
                          </button>
                        )}
                        {req.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleAdvanceStatus(req, 'IN_EXECUTION')}
                            disabled={actionLoading === req.id}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            <span>Mark In Execution / Transit</span>
                          </button>
                        )}
                        {req.status === 'IN_EXECUTION' && (
                          <button
                            onClick={() => handleOpenCompleteModal(req)}
                            disabled={actionLoading === req.id}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Complete & Settle Financials</span>
                          </button>
                        )}
                      </div>

                      {!isTerminated && req.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCancelRequest(req)}
                          disabled={actionLoading === req.id}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Complete & Settle Financials Modal */}
      {completingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Complete & Settle Execution Request
              </h3>
              <button
                onClick={() => setCompletingRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Actual Delivered Quantity (kg):</label>
                  <input
                    type="number"
                    value={actualQty}
                    onChange={(e) => setActualQty(Number(e.target.value))}
                    className="input-field font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="label">Settled Unit Price (₹/kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={actualPrice}
                    onChange={(e) => setActualPrice(Number(e.target.value))}
                    className="input-field font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Transport Cost (₹):</label>
                  <input
                    type="number"
                    value={actualLogistics}
                    onChange={(e) => setActualLogistics(Number(e.target.value))}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">Storage Cost (₹):</label>
                  <input
                    type="number"
                    value={actualStorage}
                    onChange={(e) => setActualStorage(Number(e.target.value))}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">Processing Cost (₹):</label>
                  <input
                    type="number"
                    value={actualProcessing}
                    onChange={(e) => setActualProcessing(Number(e.target.value))}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="label">Completion Verification Notes:</label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="input-field resize-none text-xs"
                />
              </div>

              {/* Calculated Net Realized Preview */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-emerald-800 font-bold">Calculated Net Farmer Payout:</span>
                <span className="font-mono font-black text-emerald-900 text-base">
                  ₹{(actualQty * actualPrice - actualLogistics - actualStorage - actualProcessing).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingRequest(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitComplete}
                  className="btn-primary text-xs"
                >
                  Confirm Settlement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
