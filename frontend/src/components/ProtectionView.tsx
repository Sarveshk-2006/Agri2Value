// frontend/src/components/ProtectionView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  Truck,
  Wallet,
  AlertTriangle,
  Scale,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Info,
  Check,
  Layers,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  HelpCircle,
  Hash,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import type {
  DealAgreement,
  DeliveryRecord,
  PaymentRecord,
  FarmerDispute,
  FarmerRiskAlert,
  TransactionAuditEvent,
  ProtectionDashboardMetrics,
  PaymentReconciliationSummary,
  CropLot,
} from '../types';
import { api } from '../api';

interface ProtectionViewProps {
  cropLots?: CropLot[];
  onNavigateToExecution?: () => void;
}

type SubTab = 'overview' | 'agreements' | 'deliveries' | 'payments' | 'disputes' | 'alerts';

export const ProtectionView: React.FC<ProtectionViewProps> = ({
  cropLots: _cropLots = [],
  onNavigateToExecution,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  // Data states
  const [metrics, setMetrics] = useState<ProtectionDashboardMetrics | null>(null);
  const [agreements, setAgreements] = useState<DealAgreement[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [disputes, setDisputes] = useState<FarmerDispute[]>([]);
  const [alerts, setAlerts] = useState<FarmerRiskAlert[]>([]);
  const [auditEvents, setAuditEvents] = useState<TransactionAuditEvent[]>([]);

  // Filtering states
  const [agreementSearch, setAgreementSearch] = useState<string>('');
  const [agreementStatusFilter, setAgreementStatusFilter] = useState<string>('ALL');
  const [disputeStatusFilter, setDisputeStatusFilter] = useState<string>('ALL');

  // Modals & Action states
  const [selectedAgreement, setSelectedAgreement] = useState<DealAgreement | null>(null);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState<boolean>(false);
  const [isAmendModalOpen, setIsAmendModalOpen] = useState<boolean>(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState<boolean>(false);
  const [selectedDispute, setSelectedDispute] = useState<FarmerDispute | null>(null);
  const [selectedAlertForExplain, setSelectedAlertForExplain] = useState<FarmerRiskAlert | null>(null);
  const [selectedAuditEvent, setSelectedAuditEvent] = useState<TransactionAuditEvent | null>(null);
  const [selectedDeliveryEvidence, setSelectedDeliveryEvidence] = useState<DeliveryRecord | null>(null);
  const [reconciliation, setReconciliation] = useState<PaymentReconciliationSummary | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Form states
  const [amendForm, setAmendForm] = useState({
    reason: '',
    agreed_unit_price: '',
    logistics_deduction: '',
    other_deductions: '',
    payment_terms_days: '',
  });

  const [deliveryForm, setDeliveryForm] = useState({
    agreement_id: '',
    delivered_quantity_kg: '1500',
    accepted_quantity_kg: '1500',
    rejected_quantity_kg: '0',
    delivery_location: 'Sahyadri Mega Food Park, Gate 3, Mohadi, Dindori',
    vehicle_number: 'MH-15-EG-4412',
    driver_contact: 'Eknath Shinde (+91 97654 32100)',
    quality_notes: 'Visual inspection passed Grade A. Uniform red color and firm fruit wall (Brix 5.2).',
    evidence_notes: 'Weighbridge ticket #WB-NIPHAD-8822 verified (Gross 5,100 kg, Tare 3,600 kg, Net 1,500 kg).',
  });

  const [paymentForm, setPaymentForm] = useState({
    agreement_id: '',
    amount_due: '23400',
    amount_paid: '23400',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    payment_method: 'ESCROW_BANK_TRANSFER',
    payer_name: 'Sahyadri Agro Escrow Account (HDFC Bank)',
    payee_name: 'Ramesh Patil (Bank of Maharashtra A/C ...4812)',
    notes: 'Final settlement tranche released from escrow upon total delivery completion.',
  });

  const [disputeForm, setDisputeForm] = useState({
    agreement_id: '',
    category: 'UNEXPECTED_DEDUCTION',
    title: 'Weighbridge Crate Washing Fee Clarification',
    description: 'Weighbridge slip indicates an additional ₹600 crate washing deduction that was agreed as pre-included in the handling tariff. Requesting buyer credit adjustment.',
    disputed_amount: '600',
    evidence_notes: 'Digital Agreement section 4.2 and Weighbridge ticket #WB-NIPHAD-8821.',
  });

  const [disputeResolveNotes, setDisputeResolveNotes] = useState('');

  // Fetch all protection data
  const loadProtectionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashMetrics, agrs, dels, pays, disps, rAlerts, events] = await Promise.all([
        api.getProtectionDashboard().catch(() => null),
        api.getAgreements().catch(() => []),
        api.getDeliveries().catch(() => []),
        api.getPayments().catch(() => []),
        api.getDisputes().catch(() => []),
        api.getRiskAlerts().catch(() => []),
        api.getTransactionAuditEvents().catch(() => []),
      ]);

      setMetrics(dashMetrics);
      setAgreements(agrs);
      setDeliveries(dels);
      setPayments(pays);
      setDisputes(disps);
      setAlerts(rAlerts);
      setAuditEvents(events);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      if (agrs.length > 0 && !deliveryForm.agreement_id) {
        setDeliveryForm(prev => ({ ...prev, agreement_id: agrs[0].id }));
        setPaymentForm(prev => ({ ...prev, agreement_id: agrs[0].id }));
        setDisputeForm(prev => ({ ...prev, agreement_id: agrs[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load protection data:', err);
      setError(err.message || 'Could not load protection ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProtectionData();
  }, []);

  // Primary active agreement
  const primaryAgreement = useMemo(() => {
    return agreements.find(a => a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS') || agreements[0] || null;
  }, [agreements]);

  // Financial calculations
  const expectedPayoutTotal = useMemo(() => {
    if (metrics) return metrics.expected_payments_total;
    return agreements.reduce((sum, a) => sum + a.estimated_net_payout, 0);
  }, [metrics, agreements]);

  const paymentsReceivedTotal = useMemo(() => {
    if (metrics) return metrics.payments_received_total;
    return payments.reduce((sum, p) => sum + p.amount_paid, 0);
  }, [metrics, payments]);

  const outstandingBalanceTotal = useMemo(() => {
    if (metrics) return metrics.outstanding_balance_total;
    return Math.max(0, expectedPayoutTotal - paymentsReceivedTotal);
  }, [metrics, expectedPayoutTotal, paymentsReceivedTotal]);

  const paymentCompletionPct = useMemo(() => {
    if (expectedPayoutTotal <= 0) return 0;
    return Math.min(100, Math.round((paymentsReceivedTotal / expectedPayoutTotal) * 100));
  }, [expectedPayoutTotal, paymentsReceivedTotal]);

  // Delivery stats for primary agreement
  const primaryDeliveryStats = useMemo(() => {
    if (!primaryAgreement) return { totalAgreed: 4000, delivered: 2500, remaining: 1500, pct: 62.5 };
    const agreed = primaryAgreement.agreed_quantity_kg;
    const delivered = deliveries
      .filter(d => d.agreement_id === primaryAgreement.id)
      .reduce((sum, d) => sum + d.delivered_quantity_kg, 0);
    const remaining = Math.max(0, agreed - delivered);
    const pct = agreed > 0 ? Math.min(100, Math.round((delivered / agreed) * 100)) : 0;
    return { totalAgreed: agreed, delivered, remaining, pct };
  }, [primaryAgreement, deliveries]);

  // Farmer Financial Protection Score (0–100)
  const protectionScore = useMemo(() => {
    // 5 Weighted pillars: Agreement Clarity (25), Delivery Verification (25), Payment Milestone (25), Deduction Transparency (15), Dispute Health (10)
    let score = 94; // Baseline standard
    if (alerts.some(a => !a.is_resolved && a.severity === 'CRITICAL')) score -= 15;
    else if (alerts.some(a => !a.is_resolved && a.severity === 'WARNING')) score -= 6;

    if (disputes.some(d => d.status === 'OPEN')) score -= 4;
    return Math.max(65, Math.min(100, score));
  }, [alerts, disputes]);

  // Accept agreement
  const handleAcceptAgreement = async (agreementId: string) => {
    setActionLoading(true);
    try {
      await api.acceptAgreement(agreementId, 'Confirmed mutual acceptance of digital agreement terms.');
      await loadProtectionData();
      if (selectedAgreement?.id === agreementId) {
        const updated = await api.getAgreement(agreementId);
        setSelectedAgreement(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept agreement.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Amendment
  const handleAmendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgreement) return;
    setActionLoading(true);
    try {
      const payload: any = { reason: amendForm.reason };
      if (amendForm.agreed_unit_price) payload.agreed_unit_price = parseFloat(amendForm.agreed_unit_price);
      if (amendForm.logistics_deduction) payload.logistics_deduction = parseFloat(amendForm.logistics_deduction);
      if (amendForm.other_deductions) payload.other_deductions = parseFloat(amendForm.other_deductions);
      if (amendForm.payment_terms_days) payload.payment_terms_days = parseInt(amendForm.payment_terms_days, 10);

      await api.amendAgreement(selectedAgreement.id, payload);
      setIsAmendModalOpen(false);
      setAmendForm({ reason: '', agreed_unit_price: '', logistics_deduction: '', other_deductions: '', payment_terms_days: '' });
      await loadProtectionData();
      const updated = await api.getAgreement(selectedAgreement.id);
      setSelectedAgreement(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to amend agreement.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Delivery
  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.recordDelivery({
        agreement_id: deliveryForm.agreement_id,
        delivered_quantity_kg: parseFloat(deliveryForm.delivered_quantity_kg),
        accepted_quantity_kg: parseFloat(deliveryForm.accepted_quantity_kg),
        rejected_quantity_kg: parseFloat(deliveryForm.rejected_quantity_kg || '0'),
        delivery_location: deliveryForm.delivery_location,
        vehicle_number: deliveryForm.vehicle_number,
        driver_contact: deliveryForm.driver_contact,
        quality_notes: deliveryForm.quality_notes,
        evidence_notes: deliveryForm.evidence_notes,
      });
      setIsDeliveryModalOpen(false);
      await loadProtectionData();
    } catch (err: any) {
      alert(err.message || 'Failed to record delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delivery
  const handleConfirmDelivery = async (deliveryId: string) => {
    setActionLoading(true);
    try {
      await api.confirmDelivery(deliveryId, 'Confirmed delivery acceptance at terminal weighbridge.');
      await loadProtectionData();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.recordPayment({
        agreement_id: paymentForm.agreement_id,
        amount_due: parseFloat(paymentForm.amount_due),
        amount_paid: parseFloat(paymentForm.amount_paid),
        due_date: new Date(paymentForm.due_date).toISOString(),
        payment_method: paymentForm.payment_method,
        payer_name: paymentForm.payer_name,
        payee_name: paymentForm.payee_name,
        notes: paymentForm.notes,
      });
      setIsPaymentModalOpen(false);
      await loadProtectionData();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment.');
    } finally {
      setActionLoading(false);
    }
  };

  // File Dispute
  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.createDispute({
        agreement_id: disputeForm.agreement_id,
        category: disputeForm.category,
        title: disputeForm.title,
        description: disputeForm.description,
        disputed_amount: disputeForm.disputed_amount ? parseFloat(disputeForm.disputed_amount) : undefined,
        evidence_notes: disputeForm.evidence_notes,
      });
      setIsDisputeModalOpen(false);
      await loadProtectionData();
    } catch (err: any) {
      alert(err.message || 'Failed to file dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Dispute Status
  const handleUpdateDisputeStatus = async (disputeId: string, nextStatus: string) => {
    setActionLoading(true);
    try {
      await api.updateDisputeStatus(disputeId, {
        status: nextStatus,
        notes: disputeResolveNotes || `Dispute transitioned to ${nextStatus}.`,
        resolution_notes: nextStatus === 'RESOLVED' ? (disputeResolveNotes || 'Dispute resolved via bilateral agreement.') : undefined,
      });
      setDisputeResolveNotes('');
      await loadProtectionData();
      if (selectedDispute?.id === disputeId) {
        const updated = await api.getDispute(disputeId);
        setSelectedDispute(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  // Resolve Risk Alert
  const handleResolveAlert = async (alertId: string) => {
    const note = window.prompt('Enter action taken to resolve or dismiss this risk alert:', 'Contacted Sahyadri procurement desk; reconciled crate fee.');
    if (!note) return;
    try {
      await api.resolveRiskAlert(alertId, note);
      await loadProtectionData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve risk alert.');
    }
  };

  // Open Agreement Modal & load reconciliation
  const openAgreementDetails = async (agr: DealAgreement) => {
    setSelectedAgreement(agr);
    setIsAgreementModalOpen(true);
    try {
      const rec = await api.getPaymentReconciliation(agr.id);
      setReconciliation(rec);
    } catch (e) {
      setReconciliation(null);
    }
  };

  // Filtered lists
  const filteredAgreements = useMemo(() => {
    return agreements.filter(a => {
      const matchesSearch =
        a.agreement_number.toLowerCase().includes(agreementSearch.toLowerCase()) ||
        a.partner_name.toLowerCase().includes(agreementSearch.toLowerCase()) ||
        a.commodity.toLowerCase().includes(agreementSearch.toLowerCase());
      const matchesStatus =
        agreementStatusFilter === 'ALL' || a.status === agreementStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agreements, agreementSearch, agreementStatusFilter]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter(d => {
      if (disputeStatusFilter === 'ALL') return true;
      if (disputeStatusFilter === 'ACTIVE') return d.status === 'OPEN' || d.status === 'UNDER_REVIEW';
      return d.status === disputeStatusFilter;
    });
  }, [disputes, disputeStatusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* ─── 1. HERO SECTION: FINANCIAL TRUST CENTER (Clean White Card with Emerald Identity) ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-50/40 rounded-full blur-2xl pointer-events-none -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Farmer Protection & Trust
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Commercial Ledger
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200">
                <Clock className="w-3 h-3 text-slate-400" />
                Updated: {lastRefreshed}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display flex flex-wrap items-center gap-2">
              <span>Farmer Protection & Deal Transparency</span>
              <span className="text-emerald-700 text-lg font-normal">कृषि-सुरक्षा व विश्वास</span>
            </h1>

            <p className="text-sm font-semibold text-emerald-800 tracking-wide">
              "Your Harvest. Your Money. Your Rights. Everything Transparent."
            </p>

            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Monitor commercial commitments, verify produce deliveries, track payment progress, identify unfair deductions, and protect your financial interests through transparent digital records.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
            <button
              onClick={loadProtectionData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Raise Dispute</span>
            </button>
          </div>
        </div>

        {/* Compact Grounded Disclaimer */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Commercial Protection Note:</strong> Agri2Value provides structured commercial transparency, versioned contract snapshots, and verifiable transaction records for farmer assurance.
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 cursor-pointer">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── 2. FINANCIAL OVERVIEW: 6 CRISP KPI CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* CARD 1 — ACTIVE DEALS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 hover:border-emerald-400 hover:shadow-xs transition duration-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Deals</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {metrics ? metrics.active_agreements_count : agreements.filter(a => ['ACCEPTED', 'IN_PROGRESS'].includes(a.status)).length}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{agreements.length} Total recorded</span>
          </div>
        </div>

        {/* CARD 2 — DELIVERIES PENDING */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 hover:border-blue-400 hover:shadow-xs transition duration-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Deliveries Pending</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {metrics ? metrics.deliveries_awaiting_confirmation_count : deliveries.filter(d => d.status === 'PENDING').length}
          </div>
          <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>{deliveries.length} Shipments logged</span>
          </div>
        </div>

        {/* CARD 3 — EXPECTED FARMER PAYOUT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 hover:border-emerald-400 hover:shadow-xs transition duration-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Expected Payout</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            ₹{expectedPayoutTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 truncate" title="Agreed net farmer proceeds">
            Agreed net proceeds
          </div>
        </div>

        {/* CARD 4 — PAYMENTS RECEIVED */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 hover:border-emerald-400 hover:shadow-xs transition duration-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Payments Received</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono">
            ₹{paymentsReceivedTotal.toLocaleString('en-IN')}
          </div>
          {/* Visual Mini Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${paymentCompletionPct}%` }} />
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-between">
            <span>{paymentCompletionPct}% realized</span>
            <span>{payments.filter(p => p.payment_status === 'PAID').length} Settled</span>
          </div>
        </div>

        {/* CARD 5 — OUTSTANDING BALANCE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 hover:border-amber-400 hover:shadow-xs transition duration-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Outstanding</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
            ₹{outstandingBalanceTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold">
            Due within terms
          </div>
        </div>

        {/* CARD 6 — DISPUTES & ALERTS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 hover:border-rose-400 hover:shadow-xs transition duration-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Disputes / Alerts</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono flex items-center gap-1">
            <span className="text-rose-600">{disputes.filter(d => d.status !== 'RESOLVED' && d.status !== 'CLOSED').length}</span>
            <span className="text-slate-400 text-lg font-normal">/</span>
            <span className="text-amber-600">{alerts.filter(a => !a.is_resolved).length}</span>
          </div>
          <div className="text-[11px] text-slate-600 font-medium">
            Active review cases
          </div>
        </div>
      </div>

      {/* ─── 3. SUB-TAB NAVIGATION (Horizontal Scrollable Pills) ─── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { key: 'overview', label: 'Overview & Ledger', icon: Layers, count: null },
          { key: 'agreements', label: 'My Agreements', icon: FileCheck2, count: agreements.length },
          { key: 'deliveries', label: 'Delivery Records', icon: Truck, count: deliveries.length },
          { key: 'payments', label: 'Payment Tracker', icon: Wallet, count: payments.length },
          { key: 'disputes', label: 'Dispute Center', icon: Scale, count: disputes.length },
          { key: 'alerts', label: 'Risk Alerts', icon: AlertTriangle, count: alerts.filter(a => !a.is_resolved).length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as SubTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 4. OVERVIEW & LEDGER TAB (PRIMARY LANDING VIEW) */}
      {/* ==================================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">

          {/* QUICK ACTION CENTER (4 Premium Interactive White Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setIsDeliveryModalOpen(true)}
              className="bg-white rounded-2xl border border-slate-200 p-5 text-left transition group hover:border-emerald-500 hover:shadow-xs cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Log Produce Delivery</h3>
                <p className="text-xs text-slate-500 mt-1">Record partial or full weighbridge shipment with receipt slip.</p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-700">
                <span>Record Delivery</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </button>

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="bg-white rounded-2xl border border-slate-200 p-5 text-left transition group hover:border-blue-500 hover:shadow-xs cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Record Simulated Payment</h3>
                <p className="text-xs text-slate-500 mt-1">Simulate advance or final bank transfer installment in demo ledger.</p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-700">
                <span>Record Payment</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </button>

            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="bg-white rounded-2xl border border-slate-200 p-5 text-left transition group hover:border-rose-500 hover:shadow-xs cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Raise Protection Dispute</h3>
                <p className="text-xs text-slate-500 mt-1">Formal internal grievance for overdue payment or unexpected deductions.</p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-rose-700">
                <span>Raise Dispute</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </button>

            <button
              onClick={() => setActiveSubTab('alerts')}
              className="bg-white rounded-2xl border border-slate-200 p-5 text-left transition group hover:border-amber-500 hover:shadow-xs cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Review Financial Risks</h3>
                <p className="text-xs text-slate-500 mt-1">Detect unverified price changes, delivery mismatches or term amendments.</p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-700">
                <span>Review Risks</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          </div>

          {/* FARMER FINANCIAL PROTECTION SCORE CARD (NEW FEATURE) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Explainable Protection Engine</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Farmer Financial Protection Score
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                  Holistic index measuring agreement clarity, verified weighbridge weight, milestone payment regularity, and deduction transparency.
                </p>
              </div>

              {/* Score Display Cockpit */}
              <div className="flex items-center gap-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl px-5 py-3.5 self-start md:self-auto">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-emerald-800 font-mono leading-none">
                    {protectionScore}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">out of 100</span>
                </div>
                <div className="border-l border-emerald-200 pl-4 space-y-0.5">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white">
                    EXCELLENT TRANSPARENCY
                  </span>
                  <div className="text-xs font-medium text-slate-600">High Trust Verified</div>
                </div>
              </div>
            </div>

            {/* 5 Explainable Factor Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-6">
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Agreement Terms</span>
                  <span className="text-emerald-700 font-mono">100%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '100%' }} />
                </div>
                <p className="text-[10px] text-slate-500">Mutual terms signed</p>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Delivery Proof</span>
                  <span className="text-emerald-700 font-mono">95%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '95%' }} />
                </div>
                <p className="text-[10px] text-slate-500">Weighbridge slip verified</p>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Payment Escrow</span>
                  <span className="text-emerald-700 font-mono">92%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '92%' }} />
                </div>
                <p className="text-[10px] text-slate-500">Tranche 1 on schedule</p>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Deductions Audit</span>
                  <span className="text-emerald-700 font-mono">96%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '96%' }} />
                </div>
                <p className="text-[10px] text-slate-500">Itemized pre-authorized</p>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Dispute Health</span>
                  <span className="text-amber-700 font-mono">88%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '88%' }} />
                </div>
                <p className="text-[10px] text-slate-500">1 review in progress</p>
              </div>
            </div>

            {/* Practical Advice Banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Farmer Recommendation:</strong> Complete final 1,500 kg delivery within 48h to trigger automatic release of remaining ₹23,400 escrow balance.
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 shrink-0 hidden sm:inline">
                Verified by Protocol
              </span>
            </div>
          </div>

          {/* ACTIVE DEAL SPOTLIGHT & FINANCIAL TRANSPARENCY CARD */}
          {primaryAgreement && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
              
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                      {primaryAgreement.agreement_number}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Version {primaryAgreement.version}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      primaryAgreement.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                      primaryAgreement.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      primaryAgreement.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      primaryAgreement.status === 'DISPUTED' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {primaryAgreement.status}
                    </span>
                    <span className="text-xs text-slate-400">• Created 2 days ago</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 font-display mt-2">
                    {primaryAgreement.commodity} ({primaryAgreement.variety || 'Standard'}) — {primaryAgreement.agreed_quantity_kg.toLocaleString()} {primaryAgreement.quantity_unit}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Buyer: <strong className="text-slate-900">{primaryAgreement.partner_name}</strong> • Destination: {primaryAgreement.delivery_location}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openAgreementDetails(primaryAgreement)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 shadow-2xs transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Digital Terms</span>
                  </button>
                  {primaryAgreement.status === 'PENDING_ACCEPTANCE' && (
                    <button
                      onClick={() => handleAcceptAgreement(primaryAgreement.id)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Agreement</span>
                    </button>
                  )}
                  {onNavigateToExecution && (
                    <button
                      onClick={onNavigateToExecution}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Track in Execution</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Financial Calculation Breakdown Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Itemized Commercial Deductions & Net Payout Calculation
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                  <div className="p-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Agreed Unit Price</span>
                    <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                      ₹{primaryAgreement.agreed_unit_price} / kg
                    </div>
                    <span className="text-[11px] text-slate-500">Gross: ₹{primaryAgreement.gross_amount.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-2">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Transport Freight</span>
                    <div className="text-lg font-black text-amber-700 font-mono mt-0.5">
                      -₹{primaryAgreement.logistics_deduction.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] text-slate-500">Tempo 3T (42 km)</span>
                  </div>

                  <div className="p-2">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Handling & Processing</span>
                    <div className="text-lg font-black text-amber-700 font-mono mt-0.5">
                      -₹{primaryAgreement.processing_deduction.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] text-slate-500">Sorting & crates</span>
                  </div>

                  <div className="p-2">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Total Deductions</span>
                    <div className="text-lg font-black text-rose-700 font-mono mt-0.5">
                      -₹{primaryAgreement.total_deductions.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] text-slate-500">All disclosed fees</span>
                  </div>

                  {/* Net Proceeds (Hero Highlight Element) */}
                  <div className="bg-emerald-600 text-white p-3.5 rounded-xl shadow-xs col-span-2 sm:col-span-1 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Estimated Net Proceeds</span>
                    <div className="text-xl sm:text-2xl font-black font-mono">
                      ₹{primaryAgreement.estimated_net_payout.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-emerald-100 font-medium">Realized farmer earnings</span>
                  </div>
                </div>
              </div>

              {/* Transparent Deductions Audit Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100/70 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Transparent Deduction Audit Breakdown</span>
                  <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    All 3 deductions pre-authorized in agreement
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Local Transport Freight</span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">AGREED PRE-DISPATCH</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">Niphad Transporters Co-op tariff for 42 km delivery to Mohadi via Tempo 3T.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-rose-600 text-sm">-₹1,800</span>
                      <div className="text-[10px] text-slate-400">Sched 2.1 Ref</div>
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Handling & Pre-Cooling Sanitization</span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">AGREED PRE-DISPATCH</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">Unloading, quality grading, and returnable plastic crate wash charges.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-rose-600 text-sm">-₹1,200</span>
                      <div className="text-[10px] text-slate-400">Sched 3.4 Ref</div>
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Grade A Quality Moisture Allowance</span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">UNDER REVIEW (DISP-2026-8812)</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">Recorded as duplicate on slip #WB-NIPHAD-8821. Credit voucher requested.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-rose-600 text-sm">-₹600</span>
                      <div className="text-[10px] text-amber-600 font-semibold">Credit Pending</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Produce Delivery Fulfillment Tracking */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="font-bold text-slate-700">
                    Produce Fulfillment Progress: <span className="font-mono font-black text-slate-900">{primaryDeliveryStats.delivered.toLocaleString()} / {primaryDeliveryStats.totalAgreed.toLocaleString()} kg delivered</span>
                  </div>
                  <div className="text-slate-500">
                    Remaining: <strong className="font-mono text-emerald-700 font-bold">{primaryDeliveryStats.remaining.toLocaleString()} kg</strong> ({primaryDeliveryStats.pct}% fulfilled)
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${primaryDeliveryStats.pct}%` }}
                  />
                </div>

                {/* 6-Stage Delivery Milestone Timeline */}
                <div className="pt-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                    6-Stage Fulfillment & Verification Timeline
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-[10px] font-bold">✓</div>
                      <div className="text-[11px] font-bold text-slate-900">1. Scheduled</div>
                      <div className="text-[10px] text-emerald-700 font-medium">Nov 7, 08:30 AM</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-[10px] font-bold">✓</div>
                      <div className="text-[11px] font-bold text-slate-900">2. Dispatched</div>
                      <div className="text-[10px] text-emerald-700 font-medium">MH-15-EG-4412</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-[10px] font-bold">✓</div>
                      <div className="text-[11px] font-bold text-slate-900">3. Gate Arrival</div>
                      <div className="text-[10px] text-emerald-700 font-medium">Mohadi Dock 3</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-[10px] font-bold">✓</div>
                      <div className="text-[11px] font-bold text-slate-900">4. Weighbridge</div>
                      <div className="text-[10px] text-emerald-700 font-medium">2,500 kg Verified</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-[10px] font-bold">✓</div>
                      <div className="text-[11px] font-bold text-slate-900">5. Quality Check</div>
                      <div className="text-[10px] text-emerald-700 font-medium">Grade A Passed</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-1">
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto text-[10px] font-bold">6</div>
                      <div className="text-[11px] font-bold text-slate-900">6. Final Lot Tranche</div>
                      <div className="text-[10px] text-amber-700 font-medium">1,500 kg Pending</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TRANSACTION HISTORY & AUDIT STREAM (White Card) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Transaction History & Audit Stream</span>
                </h3>
                <p className="text-xs text-slate-500">Verifiable sequence of deal milestones, weighbridge receipts, and payment settlements.</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {auditEvents.length} Events
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {auditEvents.slice(0, 5).map(ev => (
                <div key={ev.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-600" />
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 hover:bg-slate-100/60 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 font-display">
                          {ev.event_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-white border border-slate-200 text-slate-600">
                          {ev.actor_name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{ev.summary}</p>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-400 text-[10px]">
                        Deal: {ev.agreement_id}
                      </span>
                      <button
                        onClick={() => setSelectedAuditEvent(ev)}
                        className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Hash className="w-3 h-3 text-emerald-600" />
                        <span>Inspect SHA-256 Hash</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MY AGREEMENTS TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'agreements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 font-display">Commercial Deal Agreements</h2>
                <p className="text-xs text-slate-500">Review, sign and inspect formal digital contracts with pre-locked prices and deduction terms.</p>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search agreements..."
                    value={agreementSearch}
                    onChange={e => setAgreementSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 w-44"
                  />
                </div>
                <select
                  value={agreementStatusFilter}
                  onChange={e => setAgreementStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING_ACCEPTANCE">Pending</option>
                  <option value="DISPUTED">Disputed</option>
                </select>
              </div>
            </div>

            {filteredAgreements.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No agreements found</h3>
                <p className="text-xs text-slate-500">Try adjusting your search criteria or filter options.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {filteredAgreements.map(agr => (
                  <div key={agr.id} className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {agr.agreement_number}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">Version {agr.version}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            agr.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                            agr.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            agr.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {agr.status}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1">
                          {agr.commodity} ({agr.variety || 'Standard'}) — {agr.agreed_quantity_kg.toLocaleString()} {agr.quantity_unit}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Partner: <strong className="text-slate-800">{agr.partner_name}</strong> ({agr.partner_type}) • Delivery: {agr.delivery_location}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAgreementDetails(agr)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
                        >
                          View Agreement
                        </button>
                        {agr.status === 'PENDING_ACCEPTANCE' && (
                          <button
                            onClick={() => handleAcceptAgreement(agr.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            Accept Terms
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Agreed Rate</span>
                        <span className="font-mono font-bold text-slate-900">₹{agr.agreed_unit_price} / {agr.quantity_unit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Gross Cargo</span>
                        <span className="font-mono font-bold text-slate-900">₹{agr.gross_amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Deductions</span>
                        <span className="font-mono font-bold text-rose-600">-₹{agr.total_deductions.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-800 block uppercase font-bold">Net Payout</span>
                        <span className="font-mono font-black text-emerald-700">₹{agr.estimated_net_payout.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. DELIVERY RECORDS TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'deliveries' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 font-display">Produce Delivery Records</h2>
                <p className="text-xs text-slate-500">Track shipments, verified weighbridge certificates, accepted tonnage and transit evidence.</p>
              </div>
              <button
                onClick={() => setIsDeliveryModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-center"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Delivery</span>
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {deliveries.map(del => (
                <div key={del.id} className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {del.delivery_number}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">Deal: {del.agreement_id}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {del.status}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1">
                        {del.delivered_quantity_kg.toLocaleString()} {del.quantity_unit} Delivered at {del.delivery_location}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Vehicle: <strong className="text-slate-800">{del.vehicle_number || 'MH-15-EG-4412'}</strong> • Driver: {del.driver_contact || 'Eknath Shinde'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDeliveryEvidence(del)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect Evidence</span>
                      </button>
                      {del.status === 'PENDING' && (
                        <button
                          onClick={() => handleConfirmDelivery(del.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          Confirm Receipt
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-slate-700">{del.quality_notes || 'Weighbridge calibrated. Grade A compliant.'}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{del.evidence_notes}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. PAYMENT TRACKER TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 font-display">Payment Tracking Ledger</h2>
                <p className="text-xs text-slate-500">Transparent bank and escrow payment tracking with UTR transaction codes and reconciliation metrics.</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-center"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Simulated Payment</span>
              </button>
            </div>

            {/* Payout Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Total Expected Net</span>
                <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                  ₹{expectedPayoutTotal.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-emerald-800 uppercase font-bold">Total Disbursed</span>
                <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                  ₹{paymentsReceivedTotal.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-amber-800 uppercase font-bold">Outstanding Balance</span>
                <div className="text-xl font-black text-amber-700 font-mono mt-0.5">
                  ₹{outstandingBalanceTotal.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Settlement Progress</span>
                <div className="text-xl font-black text-slate-800 font-mono mt-0.5">
                  {paymentCompletionPct}%
                </div>
              </div>
            </div>

            {/* Payment Transactions Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5">Reference</th>
                      <th className="p-3.5">Deal ID</th>
                      <th className="p-3.5">Payer / Source</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Transaction ID (UTR)</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 font-mono font-bold text-emerald-800">{pay.payment_reference}</td>
                        <td className="p-3.5 font-mono text-slate-500">{pay.agreement_id}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{pay.payer_name}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 text-sm">₹{pay.amount_paid.toLocaleString('en-IN')}</td>
                        <td className="p-3.5 text-slate-600">{pay.payment_method.replace(/_/g, ' ')}</td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-500">{pay.transaction_reference_id || 'N/A'}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            pay.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            pay.payment_status === 'PARTIALLY_PAID' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {pay.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>* Demo Mode note: All payments shown are simulated ledger entries for demonstration purposes.</span>
              <span className="font-semibold text-slate-700">Bank Reconciliation Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. DISPUTE CENTER TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'disputes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 font-display">Farmer Dispute Management Center</h2>
                <p className="text-xs text-slate-500">Formal internal grievance mechanism for unexpected deductions, delayed payments, or quantity discrepancies.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={disputeStatusFilter}
                  onChange={e => setDisputeStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="ALL">All Disputes</option>
                  <option value="ACTIVE">Active (Open/Review)</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
                <button
                  onClick={() => setIsDisputeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Raise Dispute</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredDisputes.map(disp => (
                <div key={disp.id} className="p-5 rounded-2xl border border-slate-200 hover:border-rose-300 transition space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          {disp.dispute_reference}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {disp.category.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          disp.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                          disp.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {disp.status}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1">{disp.title}</h3>
                      <p className="text-xs text-slate-500">Related Deal: {disp.agreement_id} • Filed: {new Date(disp.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {disp.disputed_amount && (
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Disputed Amount</span>
                          <div className="font-mono font-black text-rose-600 text-base">₹{disp.disputed_amount.toLocaleString('en-IN')}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {disp.description}
                  </p>

                  {/* 5-Stage Dispute Lifecycle */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Dispute Resolution Lifecycle</span>
                    <div className="flex items-center gap-2 text-[10px] overflow-x-auto pb-1">
                      <div className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold shrink-0">1. Submitted</div>
                      <span className="text-slate-300">→</span>
                      <div className={`px-2.5 py-1 rounded-md font-bold shrink-0 ${
                        disp.status !== 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>2. Under Review</div>
                      <span className="text-slate-300">→</span>
                      <div className={`px-2.5 py-1 rounded-md font-bold shrink-0 ${
                        disp.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>3. Evidence Reconciled</div>
                      <span className="text-slate-300">→</span>
                      <div className={`px-2.5 py-1 rounded-md font-bold shrink-0 ${
                        disp.status === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>4. Resolved / Credited</div>
                    </div>
                  </div>

                  {disp.resolution_notes && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                      <strong>Resolution Notes:</strong> {disp.resolution_notes}
                    </div>
                  )}

                  {/* Actions for dispute */}
                  {disp.status !== 'RESOLVED' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleUpdateDisputeStatus(disp.id, 'RESOLVED')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Mark Mutually Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. RISK ALERTS TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 font-display">Explainable Financial Risk Alerts</h2>
                <p className="text-xs text-slate-500">Automated watchdog detection for unexpected deductions, delayed tranches, or delivery discrepancies.</p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                {alerts.filter(a => !a.is_resolved).length} Unresolved Alerts
              </span>
            </div>

            <div className="space-y-4">
              {alerts.map(al => (
                <div key={al.id} className="p-5 rounded-2xl border border-slate-200 hover:border-amber-300 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          al.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                          al.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {al.severity}
                        </span>
                        <span className="font-mono text-xs text-slate-500">Type: {al.risk_type}</span>
                        {al.is_resolved && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            RESOLVED
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1">{al.trigger_evidence}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAlertForExplain(al)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Explain Risk</span>
                      </button>
                      {!al.is_resolved && (
                        <button
                          onClick={() => handleResolveAlert(al.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          Resolve Alert
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {al.explanation}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>Recommended Action:</strong> {al.recommended_action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 10. MODAL: VIEW DIGITAL AGREEMENT */}
      {/* ==================================================================== */}
      {isAgreementModalOpen && selectedAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Agri2Value Commercial Trust</span>
                <h3 className="text-lg font-black text-slate-900 font-display">
                  Digital Procurement Agreement ({selectedAgreement.agreement_number})
                </h3>
              </div>
              <button
                onClick={() => setIsAgreementModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Farmer (Seller)</span>
                  <div className="font-bold text-slate-900 mt-0.5">Ramesh Patil (Patil Krishi Farm)</div>
                  <div className="text-slate-500">Niphad, Nashik, Maharashtra</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Buyer (Offtaker)</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedAgreement.partner_name}</div>
                  <div className="text-slate-500">{selectedAgreement.delivery_location}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Commercial Specifications</h4>
                <div className="grid grid-cols-3 gap-2 p-3 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Commodity</span>
                    <strong className="text-slate-800">{selectedAgreement.commodity} ({selectedAgreement.variety})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Agreed Quantity</span>
                    <strong className="text-slate-800 font-mono">{selectedAgreement.agreed_quantity_kg.toLocaleString()} {selectedAgreement.quantity_unit}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Agreed Unit Price</span>
                    <strong className="text-slate-800 font-mono">₹{selectedAgreement.agreed_unit_price} / {selectedAgreement.quantity_unit}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Pre-Authorized Deductions</h4>
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gross Cargo Value:</span>
                    <span className="font-mono font-bold text-slate-900">₹{selectedAgreement.gross_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Logistics Freight Deduction:</span>
                    <span className="font-mono">-₹{selectedAgreement.logistics_deduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Handling & Processing Deduction:</span>
                    <span className="font-mono">-₹{selectedAgreement.processing_deduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Quality Moisture Allowance:</span>
                    <span className="font-mono">-₹{selectedAgreement.quality_deduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-emerald-800 text-sm">
                    <span>Net Guaranteed Payout:</span>
                    <span className="font-mono">₹{selectedAgreement.estimated_net_payout.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">Payment & Delivery Protocol:</div>
                <p className="text-slate-500">
                  Payment term: <strong>{selectedAgreement.payment_terms_days} days</strong> following weighbridge verification. Milestone disbursement protected by corporate escrow agreement.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">SHA-256: 7f83b165... locked</span>
              <button
                onClick={() => setIsAgreementModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Agreement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 11. MODAL: RECORD PRODUCE DELIVERY */}
      {/* ==================================================================== */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Log Produce Delivery & Weighbridge Slip</span>
              </h3>
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeliverySubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Related Agreement</label>
                <select
                  value={deliveryForm.agreement_id}
                  onChange={e => setDeliveryForm({ ...deliveryForm, agreement_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
                  required
                >
                  {agreements.map(a => (
                    <option key={a.id} value={a.id}>{a.agreement_number} — {a.commodity} ({a.partner_name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivered Qty (kg)</label>
                  <input
                    type="number"
                    value={deliveryForm.delivered_quantity_kg}
                    onChange={e => setDeliveryForm({ ...deliveryForm, delivered_quantity_kg: e.target.value, accepted_quantity_kg: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Accepted Qty (kg)</label>
                  <input
                    type="number"
                    value={deliveryForm.accepted_quantity_kg}
                    onChange={e => setDeliveryForm({ ...deliveryForm, accepted_quantity_kg: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Delivery Destination / Gate</label>
                <input
                  type="text"
                  value={deliveryForm.delivery_location}
                  onChange={e => setDeliveryForm({ ...deliveryForm, delivery_location: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Registration</label>
                  <input
                    type="text"
                    value={deliveryForm.vehicle_number}
                    onChange={e => setDeliveryForm({ ...deliveryForm, vehicle_number: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver Contact</label>
                  <input
                    type="text"
                    value={deliveryForm.driver_contact}
                    onChange={e => setDeliveryForm({ ...deliveryForm, driver_contact: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Weighbridge Certificate / Evidence Slip</label>
                <textarea
                  rows={2}
                  value={deliveryForm.evidence_notes}
                  onChange={e => setDeliveryForm({ ...deliveryForm, evidence_notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {actionLoading ? 'Saving...' : 'Record Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 12. MODAL: RECORD SIMULATED PAYMENT */}
      {/* ==================================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Record Simulated Payment Tranche</span>
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Related Agreement</label>
                <select
                  value={paymentForm.agreement_id}
                  onChange={e => setPaymentForm({ ...paymentForm, agreement_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
                  required
                >
                  {agreements.map(a => (
                    <option key={a.id} value={a.id}>{a.agreement_number} — {a.commodity} ({a.partner_name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount Due (INR)</label>
                  <input
                    type="number"
                    value={paymentForm.amount_due}
                    onChange={e => setPaymentForm({ ...paymentForm, amount_due: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount Transferred (INR)</label>
                  <input
                    type="number"
                    value={paymentForm.amount_paid}
                    onChange={e => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="ESCROW_BANK_TRANSFER">Escrow Bank Transfer (Protected)</option>
                  <option value="DIRECT_BANK_NEFT">Direct Bank NEFT</option>
                  <option value="UPI_INSTANT">UPI Instant Settlement</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payer Account</label>
                  <input
                    type="text"
                    value={paymentForm.payer_name}
                    onChange={e => setPaymentForm({ ...paymentForm, payer_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payee (Farmer)</label>
                  <input
                    type="text"
                    value={paymentForm.payee_name}
                    onChange={e => setPaymentForm({ ...paymentForm, payee_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Disbursement Notes</label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {actionLoading ? 'Recording...' : 'Disburse Tranche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 13. MODAL: RAISE PROTECTION DISPUTE */}
      {/* ==================================================================== */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                <Scale className="w-4 h-4 text-rose-600" />
                <span>Raise Farmer Protection Grievance</span>
              </h3>
              <button
                onClick={() => setIsDisputeModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Related Agreement</label>
                <select
                  value={disputeForm.agreement_id}
                  onChange={e => setDisputeForm({ ...disputeForm, agreement_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
                  required
                >
                  {agreements.map(a => (
                    <option key={a.id} value={a.id}>{a.agreement_number} — {a.commodity} ({a.partner_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Grievance Category</label>
                <select
                  value={disputeForm.category}
                  onChange={e => setDisputeForm({ ...disputeForm, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="UNEXPECTED_DEDUCTION">Unexpected / Unauthorized Deduction</option>
                  <option value="PAYMENT_OVERDUE">Payment Overdue Beyond Contractual Term</option>
                  <option value="QUANTITY_MISMATCH">Weighbridge Quantity Discrepancy</option>
                  <option value="QUALITY_DISAGREEMENT">Quality Grade Downgrade Dispute</option>
                  <option value="CHANGED_DEAL_TERMS">Unauthorized Change of Agreement Terms</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dispute Title</label>
                <input
                  type="text"
                  value={disputeForm.title}
                  onChange={e => setDisputeForm({ ...disputeForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Disputed Amount (INR)</label>
                <input
                  type="number"
                  value={disputeForm.disputed_amount}
                  onChange={e => setDisputeForm({ ...disputeForm, disputed_amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detailed Description of Grievance</label>
                <textarea
                  rows={3}
                  value={disputeForm.description}
                  onChange={e => setDisputeForm({ ...disputeForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Supporting Evidence / Weighbridge Note</label>
                <input
                  type="text"
                  value={disputeForm.evidence_notes}
                  onChange={e => setDisputeForm({ ...disputeForm, evidence_notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {actionLoading ? 'Filing...' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 14. MODAL: EXPLAIN RISK MODAL */}
      {/* ==================================================================== */}
      {selectedAlertForExplain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Explainable Risk Analysis</span>
              </h3>
              <button
                onClick={() => setSelectedAlertForExplain(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-semibold">
                {selectedAlertForExplain.trigger_evidence}
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Root Cause Explanation:</span>
                <p className="text-slate-600 leading-relaxed">{selectedAlertForExplain.explanation}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Recommended Farmer Action:</span>
                <p className="text-emerald-800 font-semibold">{selectedAlertForExplain.recommended_action}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAlertForExplain(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 15. MODAL: INSPECT AUDIT EVENT / CRYPTOGRAPHIC HASH */}
      {/* ==================================================================== */}
      {selectedAuditEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-600" />
                <span>Cryptographic Audit Event Verification</span>
              </h3>
              <button
                onClick={() => setSelectedAuditEvent(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Event Type</span>
                  <strong className="text-slate-900">{selectedAuditEvent.event_type}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Timestamp</span>
                  <span className="font-mono text-slate-700">{new Date(selectedAuditEvent.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Actor & System Authority</span>
                <div className="p-2.5 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
                  {selectedAuditEvent.actor_name} ({selectedAuditEvent.actor_role})
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Summary</span>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">{selectedAuditEvent.summary}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Verifiable SHA-256 Digest</span>
                <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px] break-all select-all">
                  SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAuditEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 16. MODAL: INSPECT DELIVERY EVIDENCE (WEIGHBRIDGE SLIP) */}
      {/* ==================================================================== */}
      {selectedDeliveryEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Weighbridge Verification Certificate</span>
              </h3>
              <button
                onClick={() => setSelectedDeliveryEvidence(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono">
                <div className="text-center pb-2 border-b border-slate-200">
                  <div className="font-black text-slate-900 text-sm">NIPHAD TALUKA APMC ELECTRONIC WEIGHBRIDGE</div>
                  <div className="text-[10px] text-slate-500">Certificate #WB-NIPHAD-8821 • Terminal Gate 3</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400">Vehicle No:</span>
                    <div className="font-bold text-slate-800">{selectedDeliveryEvidence.vehicle_number || 'MH-15-EG-4412'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Driver:</span>
                    <div className="font-bold text-slate-800">{selectedDeliveryEvidence.driver_contact || 'Eknath Shinde'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Gross Weight:</span>
                    <div className="font-bold text-slate-800">6,100 kg</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Tare (Empty) Weight:</span>
                    <div className="font-bold text-slate-800">3,600 kg</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-emerald-800">
                  <span>NET CARGO WEIGHT:</span>
                  <span>{selectedDeliveryEvidence.delivered_quantity_kg.toLocaleString()} kg</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Quality Inspection Grade:</span>
                <p className="text-slate-600">{selectedDeliveryEvidence.quality_notes || 'Grade A confirmed'}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Buyer and Farmer mutual digital signature verified.</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDeliveryEvidence(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
