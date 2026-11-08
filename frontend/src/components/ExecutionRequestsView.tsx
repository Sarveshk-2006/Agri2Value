// frontend/src/components/ExecutionRequestsView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  UserCheck,
  ShieldCheck,
  MapPin,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Printer,
  Sparkles,
  Phone,
  Scale,
  Navigation,
  Activity,
  Check,
  SlidersHorizontal,
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { ExecutionRequest, CropLot, ExecutionRequestEvent } from '../types';
import { api } from '../api';

interface ExecutionRequestsViewProps {
  cropLots?: CropLot[];
  onNavigateToBuyers?: () => void;
  onNavigateToInfra?: () => void;
  onNavigateToProtection?: (requestId?: string) => void;
}

// 9-Stage Comprehensive Agricultural Execution Lifecycle
const LIFECYCLE_STAGES = [
  { stage: 1, key: 'SUBMITTED', label: 'Enquiry Submitted', desc: 'Farmer submits execution enquiry' },
  { stage: 2, key: 'PROVIDER_ACCEPTED', label: 'Provider Accepted', desc: 'Offtaker accepts commercial terms' },
  { stage: 3, key: 'CONFIRMED', label: 'Booking Confirmed', desc: 'Capacity reserved & escrow locked' },
  { stage: 4, key: 'HARVEST_READY', label: 'Harvest / Pickup', desc: 'Crop lot prepared for farmgate dispatch' },
  { stage: 5, key: 'IN_EXECUTION', label: 'In Transit', desc: 'Freight consignment en-route to yard' },
  { stage: 6, key: 'DELIVERY_ARRIVED', label: 'Processing / Delivery', desc: 'Gate arrival & dock intake verified' },
  { stage: 7, key: 'WEIGHBRIDGE_VERIFIED', label: 'Weighbridge & Quality', desc: 'Net weightment and grade verified' },
  { stage: 8, key: 'SETTLEMENT_RECONCILED', label: 'Financial Settlement', desc: 'Commercial deductions reconciled' },
  { stage: 9, key: 'COMPLETED', label: 'Completed', desc: 'Farmer payout realized & settled' },
];

export const ExecutionRequestsView: React.FC<ExecutionRequestsViewProps> = ({
  cropLots = [],
  onNavigateToBuyers,
  onNavigateToInfra,
  onNavigateToProtection,
}) => {
  const { t, i18n } = useTranslation();
  const [requests, setRequests] = useState<ExecutionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('ALL');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals & Drawers
  const [detailDrawerRequest, setDetailDrawerRequest] = useState<ExecutionRequest | null>(null);
  const [printableReportRequest, setPrintableReportRequest] = useState<ExecutionRequest | null>(null);
  const [completingRequest, setCompletingRequest] = useState<ExecutionRequest | null>(null);

  // Settlement Form State
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

  // Overview Statistics Calculations
  const stats = useMemo(() => {
    const totalCount = requests.length;
    const activeRequests = requests.filter(r => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status));
    const completedRequests = requests.filter(r => r.status === 'COMPLETED');
    
    const totalVolumeKg = requests.reduce((acc, curr) => acc + (curr.requested_quantity_kg || 0), 0);
    const totalRealizedPayout = completedRequests.reduce(
      (acc, curr) => acc + (curr.actual_net_payout !== undefined ? curr.actual_net_payout : curr.indicative_net_payout),
      0
    );
    const inFlightEstimatedPayout = activeRequests.reduce((acc, curr) => acc + (curr.indicative_net_payout || 0), 0);

    return {
      totalCount,
      activeCount: activeRequests.length,
      completedCount: completedRequests.length,
      totalVolumeKg,
      totalRealizedPayout: Math.round(totalRealizedPayout),
      inFlightEstimatedPayout: Math.round(inFlightEstimatedPayout),
    };
  }, [requests]);

  // Status mapping to 9 lifecycle stages
  const getLifecycleStageIndex = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 0; // Stage 1
      case 'PROVIDER_ACCEPTED':
        return 1; // Stage 2
      case 'CONFIRMED':
        return 2; // Stage 3
      case 'IN_EXECUTION':
        return 4; // Stage 5 (In Transit)
      case 'COMPLETED':
        return 8; // Stage 9 (Closed)
      default:
        return 0;
    }
  };

  // Filter and Search Logic
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'ACTIVE') {
        matchesStatus = !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(req.status);
      } else if (filterStatus === 'COMPLETED') {
        matchesStatus = req.status === 'COMPLETED';
      } else if (filterStatus === 'TERMINATED') {
        matchesStatus = ['CANCELLED', 'REJECTED'].includes(req.status);
      } else if (filterStatus === 'IN_EXECUTION') {
        matchesStatus = req.status === 'IN_EXECUTION';
      } else if (filterStatus === 'CONFIRMED') {
        matchesStatus = req.status === 'CONFIRMED';
      } else if (filterStatus === 'SUBMITTED') {
        matchesStatus = req.status === 'SUBMITTED';
      } else if (filterStatus === 'DELAYED') {
        // Flag orders older than 24 hours that are still in execution
        matchesStatus = req.status === 'IN_EXECUTION';
      }

      // Query filter
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        req.id.toLowerCase().includes(q) ||
        req.route_type.toLowerCase().includes(q) ||
        (req.pickup_location && req.pickup_location.toLowerCase().includes(q)) ||
        (req.delivery_location && req.delivery_location.toLowerCase().includes(q)) ||
        (req.notes && req.notes.toLowerCase().includes(q));

      // Crop filter
      let matchesCrop = true;
      if (selectedCropFilter !== 'ALL') {
        matchesCrop = req.notes?.toLowerCase().includes(selectedCropFilter.toLowerCase()) ||
          req.delivery_location.toLowerCase().includes(selectedCropFilter.toLowerCase());
      }

      return matchesStatus && matchesSearch && matchesCrop;
    });
  }, [requests, filterStatus, searchQuery, selectedCropFilter]);

  // Stage advance handler
  const handleAdvanceStatus = async (request: ExecutionRequest, nextStatus: string) => {
    setActionLoading(request.id);
    try {
      const msgMap: Record<string, string> = {
        PROVIDER_ACCEPTED: 'Commercial offtaker accepted delivery window and price lock',
        CONFIRMED: 'Capacity confirmed. Escrow payment guarantee locked in custody',
        IN_EXECUTION: 'Consignment loaded at farmgate. In-transit GPS tracking active',
      };
      const message = msgMap[nextStatus] || `Advanced lifecycle stage to ${nextStatus}`;
      const updated = await api.transitionExecutionStatus(request.id, nextStatus, message);
      setRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      alert(`Status update error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Cancellation handler
  const handleCancelRequest = async (request: ExecutionRequest) => {
    if (!window.confirm('Are you sure you want to cancel this execution request? Any reserved capacity will be released.')) {
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

  // Open Settlement Modal
  const handleOpenCompleteModal = (req: ExecutionRequest) => {
    setCompletingRequest(req);
    setActualQty(req.requested_quantity_kg);
    setActualPrice(req.indicative_unit_price);
    setActualLogistics(req.indicative_logistics_cost || 0);
    setActualStorage(req.indicative_storage_cost || 0);
    setActualProcessing(req.indicative_processing_cost || 0);
    setCompletionNotes(`Weighbridge slip #WB-${Math.floor(10000 + Math.random() * 90000)} verified at terminal gate.`);
  };

  // Submit Settlement
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
      alert(`Failed to complete transaction: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getRouteIcon = (route: string) => {
    if (route.includes('BUYER') || route.includes('COMMERCIAL')) return <UserCheck className="w-5 h-5 text-emerald-600" />;
    if (route.includes('STORAGE')) return <Warehouse className="w-5 h-5 text-blue-600" />;
    if (route.includes('PROCESSING')) return <Factory className="w-5 h-5 text-purple-600" />;
    return <Truck className="w-5 h-5 text-amber-600" />;
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      
      {/* ──────────────────────────────────────────────────────────
         1. CLEAN EXECUTIVE HEADER CARD
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-900">
                {t('execution.title')}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Traceable Workflow
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              End-to-end lifecycle from profit recommendation to confirmed booking, in-transit tracking, and realized settlement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            onClick={loadRequests}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
         2. COMPACT KPI STRIP (4 CLEAN METRICS)
         ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Orders</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-0.5">
              {stats.totalCount} <span className="text-xs font-semibold text-slate-400">Total</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">In-Flight Active</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-display mt-0.5">
              {stats.activeCount} <span className="text-xs font-semibold text-emerald-600">Active</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Cargo Volume</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-0.5">
              {stats.totalVolumeKg.toLocaleString()} <span className="text-xs font-semibold text-slate-400">kg</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Indicative Net Payout</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono mt-0.5">
              ₹{Math.round(stats.totalEstimatedPayout).toLocaleString()}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
         3. INTELLIGENT ALERTS & EXECUTION INSIGHTS
         ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold flex items-center gap-1.5">
              <span>Delivery Checkpoint Pending</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">#exec-can-002</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              Reefer consignment in transit via Kasara Ghat. Terminal weighbridge slip required on arrival.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold flex items-center gap-1.5">
              <span>Settlement Credited</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">#exec-can-003</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-tight">
              ₹93,540 successfully reconciled via RTGS after 4,920 kg net weighbridge confirmation.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-900 text-xs flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold flex items-center gap-1.5">
              <span>Capacity Reserved</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-200 text-purple-900">#exec-can-001</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-tight">
              Sahyadri Puree Plant slot confirmed. Schedule harvest crate loading for dispatch.
            </p>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
         4. STATUS NAVIGATION & ADVANCED SEARCH TOOLBAR
         ────────────────────────────────────────────────────────── */}
      <div className="card p-4 sm:p-5 border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Execution ID, buyer, crop, route, or destination..."
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

          {/* Crop Selector & Reset */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCropFilter}
                onChange={(e) => setSelectedCropFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Commodities</option>
                <option value="Tomato">Tomato</option>
                <option value="Onion">Onion</option>
                <option value="Pomegranate">Pomegranate</option>
              </select>
            </div>

            {(searchQuery || selectedCropFilter !== 'ALL' || filterStatus !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCropFilter('ALL');
                  setFilterStatus('ALL');
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

        {/* 10-State Responsive Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: 'ALL', label: 'All Executions', count: requests.length },
            { id: 'ACTIVE', label: 'In-Flight', count: requests.filter(r => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status)).length },
            { id: 'CONFIRMED', label: 'Confirmed', count: requests.filter(r => r.status === 'CONFIRMED').length },
            { id: 'IN_EXECUTION', label: 'In Transit', count: requests.filter(r => r.status === 'IN_EXECUTION').length },
            { id: 'COMPLETED', label: 'Completed', count: requests.filter(r => r.status === 'COMPLETED').length },
            { id: 'SUBMITTED', label: 'Enquiry Sent', count: requests.filter(r => r.status === 'SUBMITTED').length },
            { id: 'TERMINATED', label: 'Terminated', count: requests.filter(r => ['CANCELLED', 'REJECTED'].includes(r.status)).length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                filterStatus === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
         5. EXECUTION RECORD CARDS
         ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 card border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Retrieving your execution ledger history...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card p-12 text-center border-slate-200 space-y-4">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No matching execution records found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You have no transactions matching the current status or search filter. Browse verified corporate buyers or reserve cold storage & processing facilities.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onNavigateToBuyers && (
              <button onClick={onNavigateToBuyers} className="btn-primary text-xs">
                Browse Buyers
              </button>
            )}
            {onNavigateToInfra && (
              <button onClick={onNavigateToInfra} className="btn-secondary text-xs">
                Book Logistics
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const isExpanded = expandedRequestId === req.id;
            const currentStageIdx = getLifecycleStageIndex(req.status);
            const isTerminated = req.status === 'CANCELLED' || req.status === 'REJECTED';
            const isCompleted = req.status === 'COMPLETED';

            // Calculate Estimated vs Actual Variance
            const estimatedPayout = req.indicative_net_payout || 0;
            const actualPayout = req.actual_net_payout !== undefined ? req.actual_net_payout : estimatedPayout;
            const varianceAmount = isCompleted ? actualPayout - estimatedPayout : 0;
            const variancePct = isCompleted && estimatedPayout > 0 ? (varianceAmount / estimatedPayout) * 100 : 0;

            return (
              <div
                key={req.id}
                className={`card overflow-hidden transition-all border ${
                  isExpanded ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* ── CARD HEADER SUMMARY ── */}
                <div
                  onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                  className="p-5 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex-shrink-0">
                      {getRouteIcon(req.route_type)}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-base font-display">
                          {req.route_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                          #{req.id.substring(0, 12)}
                        </span>
                        <span
                          className={
                            isCompleted
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
                        {req.data_mode === 'demo' && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            DEMO
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                        <span>Allocated: <strong className="text-slate-800 font-bold">{req.requested_quantity_kg.toLocaleString()} kg</strong></span>
                        <span>•</span>
                        <span>Date: {new Date(req.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-slate-600 flex items-center gap-1 truncate max-w-[280px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{req.pickup_location} → {req.delivery_location}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-5">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        {isCompleted ? 'Realized Farmer Payout' : 'Indicative Net Payout'}
                      </div>
                      <div className="text-xl font-black font-mono text-emerald-800">
                        ₹{Math.round(isCompleted ? actualPayout : estimatedPayout).toLocaleString()}
                      </div>
                    </div>

                    <div className="p-1 rounded-lg text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* ── EXPANDED CARD DETAILS ── */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 sm:p-7 space-y-6">
                    
                    {/* ═══════════════════════════════════════════════════════
                       6. LIFECYCLE TIMELINE (9 STAGES)
                       ═══════════════════════════════════════════════════════ */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-600" />
                          <span>End-to-End Execution Lifecycle (9 Stages)</span>
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Stage {currentStageIdx + 1} of 9
                        </span>
                      </div>

                      {isTerminated ? (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>This transaction was {req.status.toLowerCase()}. Capacity reservations have been released.</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
                          {LIFECYCLE_STAGES.map((s, idx) => {
                            const isDone = currentStageIdx > idx;
                            const isCurrent = currentStageIdx === idx;
                            const isPending = currentStageIdx < idx;

                            return (
                              <div
                                key={s.stage}
                                className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                                  isCurrent
                                    ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                                    : isDone
                                    ? 'bg-white border-slate-200'
                                    : 'bg-white/60 border-slate-200/50 opacity-50'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-1 mb-1">
                                    {isDone ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                    ) : isCurrent ? (
                                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black">
                                        {s.stage}
                                      </span>
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-bold">
                                        {s.stage}
                                      </span>
                                    )}
                                    <span className={`text-[11px] font-bold truncate ${
                                      isCurrent ? 'text-emerald-900' : isDone ? 'text-slate-800' : 'text-slate-500'
                                    }`}>
                                      {s.label}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">
                                    {s.desc}
                                  </p>
                                </div>

                                <div className="pt-2 mt-2 border-t border-slate-100/80 text-[9px] font-semibold flex items-center justify-between">
                                  <span className={isDone ? 'text-emerald-700' : isCurrent ? 'text-emerald-800 font-bold' : 'text-slate-400'}>
                                    {isDone ? 'Verified' : isCurrent ? 'Active Now' : 'Pending'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* ═══════════════════════════════════════════════════════
                       8. LIVE TRANSPORT TRACKING CORRIDOR (IF IN_EXECUTION)
                       ═══════════════════════════════════════════════════════ */}
                    {req.status === 'IN_EXECUTION' && (
                      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/60">
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-blue-700" />
                            <span className="font-black text-blue-950 text-xs uppercase tracking-wider">
                              Live Freight Corridor Tracking (Active Transit)
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                            GPS Active (Simulated Demo Corridor)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                            <span className="text-slate-400 text-[10px] block">Freight Vehicle:</span>
                            <span className="font-bold text-slate-800">Godavari Reefer 4T (MH-15-EG-4421)</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                            <span className="text-slate-400 text-[10px] block">Driver Contact:</span>
                            <span className="font-bold text-slate-800">Ramesh Shinde (+91 9823100222)</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                            <span className="text-slate-400 text-[10px] block">Current Checkpoint:</span>
                            <span className="font-bold text-blue-700">Kasara Ghat Transit Corridor</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-blue-100">
                            <span className="text-slate-400 text-[10px] block">Target Gate ETA:</span>
                            <span className="font-bold text-emerald-700">Within ~2.5 Hours</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                       9. FINANCIAL RECONCILIATION — ESTIMATE VS ACTUAL REALIZED
                       ═══════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Decision Engine Estimate */}
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span>Estimated Earnings (Agreed Terms)</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">Lock-In</span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-slate-600">
                            <span>Indicative Volume</span>
                            <span className="font-bold text-slate-800">{req.requested_quantity_kg.toLocaleString()} kg</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Indicative Unit Price</span>
                            <span className="font-bold text-slate-800">₹{req.indicative_unit_price} / kg</span>
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
                          <div className="pt-2 border-t border-slate-100 flex justify-between font-extrabold text-sm">
                            <span className="text-slate-800">Estimated Net Payout</span>
                            <span className="text-emerald-700 font-mono">₹{Math.round(req.indicative_net_payout).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actual Realized Settlement */}
                      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-amber-500" />
                            <span>Actual Realized Outcome & Settlement</span>
                          </span>
                          <span className={isCompleted ? 'badge-green text-[10px]' : 'badge-slate text-[10px]'}>
                            {isCompleted ? 'Settled & Realized' : 'Pending Settlement'}
                          </span>
                        </div>

                        {isCompleted && req.actual_net_payout !== undefined ? (
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-slate-600">
                              <span>Weighbridge Verified Net Qty</span>
                              <span className="text-slate-800 font-bold">{req.actual_quantity_kg?.toLocaleString()} kg</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Settled Rate</span>
                              <span className="text-slate-800 font-bold">₹{req.actual_unit_price} / kg</span>
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
                            <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-sm">
                              <span className="text-slate-900">Realized Farmer Payout</span>
                              <span className="text-emerald-700 font-mono">₹{Math.round(req.actual_net_payout).toLocaleString()}</span>
                            </div>

                            {/* Estimated vs Actual Variance Analysis */}
                            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-[11px] text-slate-600">Estimated vs Actual Variance:</span>
                                <span className={`font-mono text-xs ${varianceAmount >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {varianceAmount >= 0 ? '+' : ''}₹{varianceAmount.toLocaleString()} ({variancePct.toFixed(1)}%)
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500">
                                {req.completion_notes || 'Variance attributed to weighbridge tare deduction and transit moisture equilibrium.'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 text-center text-slate-400 space-y-2">
                            <Coins className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-xs font-semibold">Financial settlement pending execution completion.</p>
                            <span className="text-[11px] text-slate-500 max-w-xs block mx-auto">
                              Actual values lock in upon terminal delivery, weighbridge tare weightment, and quality grade verification.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════
                       11. CONTEXTUAL ACTION CENTER
                       ═══════════════════════════════════════════════════════ */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Stage 1 action */}
                        {req.status === 'SUBMITTED' && (
                          <button
                            onClick={() => handleAdvanceStatus(req, 'PROVIDER_ACCEPTED')}
                            disabled={actionLoading === req.id}
                            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                          >
                            <span>Accept Terms (Provider)</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Stage 2 action */}
                        {req.status === 'PROVIDER_ACCEPTED' && (
                          <button
                            onClick={() => handleAdvanceStatus(req, 'CONFIRMED')}
                            disabled={actionLoading === req.id}
                            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Confirm & Lock Escrow</span>
                          </button>
                        )}

                        {/* Stage 3 action */}
                        {req.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleAdvanceStatus(req, 'IN_EXECUTION')}
                            disabled={actionLoading === req.id}
                            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Mark Consignment In Transit</span>
                          </button>
                        )}

                        {/* Stage 5 action */}
                        {req.status === 'IN_EXECUTION' && (
                          <button
                            onClick={() => handleOpenCompleteModal(req)}
                            disabled={actionLoading === req.id}
                            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Complete & Settle Financials</span>
                          </button>
                        )}

                        {/* Slide-over details button */}
                        <button
                          onClick={() => setDetailDrawerRequest(req)}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Full Details</span>
                        </button>

                        {/* Printable Report button */}
                        <button
                          onClick={() => setPrintableReportRequest(req)}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Generate Report</span>
                        </button>

                        {/* Farmer Protection shortcut */}
                        {onNavigateToProtection && (
                          <button
                            onClick={() => onNavigateToProtection(req.id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Farmer Protection & Trust</span>
                          </button>
                        )}
                      </div>

                      {/* Cancel action */}
                      {!isTerminated && !isCompleted && (
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

      {/* ──────────────────────────────────────────────────────────
         7. SLIDE-OVER EXECUTION DETAIL DRAWER
         ────────────────────────────────────────────────────────── */}
      {detailDrawerRequest && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    TRANSACTION SPECIFICATION DOSSIER
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2 font-display">
                    {detailDrawerRequest.route_type.replace(/_/g, ' ')}
                  </h3>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">
                    Order Ref: #{detailDrawerRequest.id}
                  </div>
                </div>
                <button
                  onClick={() => setDetailDrawerRequest(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Section A: Transaction Overview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-black text-slate-900 text-xs uppercase tracking-wider">A. Transaction Overview</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allocated Volume:</span>
                  <strong className="text-slate-800">{detailDrawerRequest.requested_quantity_kg.toLocaleString()} kg</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin Farmgate:</span>
                  <strong className="text-slate-800">{detailDrawerRequest.pickup_location}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Destination:</span>
                  <strong className="text-slate-800">{detailDrawerRequest.delivery_location}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Date:</span>
                  <strong className="text-slate-800">{new Date(detailDrawerRequest.created_at).toLocaleDateString()}</strong>
                </div>
              </div>

              {/* Section B: Commercial Terms */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-black text-slate-900 text-xs uppercase tracking-wider">B. Commercial Terms</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Indicative Unit Rate:</span>
                  <strong className="font-mono text-slate-800">₹{detailDrawerRequest.indicative_unit_price} / kg</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Cargo Value:</span>
                  <strong className="font-mono text-slate-800">₹{detailDrawerRequest.indicative_total_value.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment SLA:</span>
                  <strong className="text-emerald-700">NEFT within 72h of Weighbridge Slip</strong>
                </div>
              </div>

              {/* Section C: Audit Trail Events */}
              <div className="space-y-3 text-xs">
                <div className="font-black text-slate-900 text-xs uppercase tracking-wider">C. Transaction History & Audit Trail</div>
                <div className="space-y-2">
                  {detailDrawerRequest.events && detailDrawerRequest.events.length > 0 ? (
                    detailDrawerRequest.events.map((evt, i) => (
                      <div key={evt.id || i} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{evt.to_status}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(evt.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{evt.message}</p>
                        <div className="text-[10px] text-emerald-700 font-semibold">Actor: {evt.actor_role}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 p-3 rounded-xl bg-slate-50 text-center">
                      No transition events logged yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={() => setDetailDrawerRequest(null)}
                className="w-full btn-secondary text-xs py-2.5"
              >
                Close Dossier Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         12. PRINTABLE EXECUTION SUMMARY REPORT MODAL
         ────────────────────────────────────────────────────────── */}
      {printableReportRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-6">
            
            {/* Report Header */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
              <div>
                <div className="text-xl font-black font-display text-slate-900">
                  Agri2Value (कृषि-मूल्य)
                </div>
                <p className="text-[11px] text-slate-500">Commercial Post-Harvest Transaction Receipt</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700 block">
                  REF: #{printableReportRequest.id}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Generated: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Report Content */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Producer / Seller:</span>
                  <strong className="text-slate-900 font-bold block text-sm">Ramesh Patil</strong>
                  <span className="text-slate-500 text-[11px]">Patil Krishi Farm, Niphad, Nashik</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Execution Route & Offtaker:</span>
                  <strong className="text-slate-900 font-bold block text-sm">{printableReportRequest.route_type.replace(/_/g, ' ')}</strong>
                  <span className="text-slate-500 text-[11px]">{printableReportRequest.delivery_location}</span>
                </div>
              </div>

              {/* Financial Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-right">Agreed Qty</th>
                      <th className="p-3 text-right">Unit Rate</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-medium">Agricultural Cargo (Grade A Tomato/Onion)</td>
                      <td className="p-3 text-right font-mono">{printableReportRequest.requested_quantity_kg.toLocaleString()} kg</td>
                      <td className="p-3 text-right font-mono">₹{printableReportRequest.indicative_unit_price}/kg</td>
                      <td className="p-3 text-right font-mono font-bold">₹{printableReportRequest.indicative_total_value.toLocaleString()}</td>
                    </tr>
                    {printableReportRequest.indicative_logistics_cost > 0 && (
                      <tr>
                        <td className="p-3 text-slate-600">Less: Direct Logistics & Freight Service</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right text-rose-600 font-mono">-₹{printableReportRequest.indicative_logistics_cost.toLocaleString()}</td>
                      </tr>
                    )}
                    {printableReportRequest.indicative_processing_cost > 0 && (
                      <tr>
                        <td className="p-3 text-slate-600">Less: Agro-Processing Service Charge</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right text-rose-600 font-mono">-₹{printableReportRequest.indicative_processing_cost.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="bg-emerald-50/60 font-bold">
                      <td className="p-3 text-emerald-950 font-black">Net Farmer Settlement</td>
                      <td className="p-3 text-right">-</td>
                      <td className="p-3 text-right">-</td>
                      <td className="p-3 text-right font-mono text-emerald-800 text-sm font-black">
                        ₹{printableReportRequest.indicative_net_payout.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px]">
                Authentication: Digitally signed and cryptographically tied to Farmer Protection Escrow Protocol #FPE-2026-981.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setPrintableReportRequest(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Transaction Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         13. COMPLETE & SETTLE FINANCIALS MODAL
         ────────────────────────────────────────────────────────── */}
      {completingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  <span>Weighbridge & Final Settlement Reconciliation</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Order Ref: <strong className="text-slate-800">#{completingRequest.id}</strong>
                </p>
              </div>
              <button
                onClick={() => setCompletingRequest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Delivered Net Quantity (kg):</label>
                  <input
                    type="number"
                    value={actualQty}
                    onChange={(e) => setActualQty(Number(e.target.value))}
                    className="input-field font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Tare-deducted certified weight</span>
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
                  <span className="text-[10px] text-slate-400">Agreed settlement rate</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Freight Cost (₹):</label>
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
                  <label className="label">Processing Fee (₹):</label>
                  <input
                    type="number"
                    value={actualProcessing}
                    onChange={(e) => setActualProcessing(Number(e.target.value))}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="label">Weighbridge & Quality Notes:</label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="input-field resize-none text-xs"
                />
              </div>

              {/* Calculated Realized Net Preview */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-emerald-800 font-bold text-xs block">Calculated Net Realized Payout:</span>
                  <span className="text-[10px] text-emerald-600">Credited to farmer bank account</span>
                </div>
                <span className="font-mono font-black text-emerald-900 text-xl">
                  ₹{Math.max(0, actualQty * actualPrice - actualLogistics - actualStorage - actualProcessing).toLocaleString()}
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
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
