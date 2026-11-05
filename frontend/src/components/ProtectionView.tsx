// frontend/src/components/ProtectionView.tsx
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  Truck,
  Wallet,
  AlertTriangle,
  Scale,
  Clock,
  ArrowUpRight,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Info,
  Check,
  Layers,
  FileText
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

  // Data states
  const [metrics, setMetrics] = useState<ProtectionDashboardMetrics | null>(null);
  const [agreements, setAgreements] = useState<DealAgreement[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [disputes, setDisputes] = useState<FarmerDispute[]>([]);
  const [alerts, setAlerts] = useState<FarmerRiskAlert[]>([]);
  const [auditEvents, setAuditEvents] = useState<TransactionAuditEvent[]>([]);

  // Modals & Action states
  const [selectedAgreement, setSelectedAgreement] = useState<DealAgreement | null>(null);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState<boolean>(false);
  const [isAmendModalOpen, setIsAmendModalOpen] = useState<boolean>(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState<boolean>(false);
  const [selectedDispute, setSelectedDispute] = useState<FarmerDispute | null>(null);
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
    delivered_quantity_kg: '',
    accepted_quantity_kg: '',
    rejected_quantity_kg: '0',
    delivery_location: 'Sahyadri Agro Hub, MIDC Ambad, Nashik',
    vehicle_number: 'MH-15-EG-4412',
    driver_contact: 'Eknath Shinde (+91 97654 32100)',
    quality_notes: 'Visual inspection passed Grade A. Uniform red color and firm texture.',
    evidence_notes: 'Weighbridge ticket #WB-NIPHAD-8821 verified (demo simulated proof).',
  });

  const [paymentForm, setPaymentForm] = useState({
    agreement_id: '',
    amount_due: '31000',
    amount_paid: '31000',
    due_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK_TRANSFER',
    payer_name: 'Sahyadri Agro-Retail Hub',
    payee_name: 'Ramesh Patil',
    notes: 'Installment tranche transferred to farmer bank account.',
  });

  const [disputeForm, setDisputeForm] = useState({
    agreement_id: '',
    category: 'PAYMENT_OVERDUE',
    title: 'Payment installment delayed beyond agreed terms',
    description: 'Produce delivered and confirmed at weighbridge, but payment remains unpaid past the contractual due date.',
    disputed_amount: '31000',
    evidence_notes: 'Delivery DEL-2026-0001 confirmed by buyer on record.',
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

  // Accept agreement
  const handleAcceptAgreement = async (agreementId: string) => {
    setActionLoading(true);
    try {
      await api.acceptAgreement(agreementId, 'Confirmed acceptance of digital agreement terms.');
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
    const note = window.prompt('Enter action taken to resolve or dismiss this risk alert:', 'Contacted buyer Vikram Shinde; reconciled payment terms.');
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* ─── Top Banner & Header (Harmonized Forest Green Gradient) ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-green-700 to-teal-800 text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 border border-white/20 text-white backdrop-blur-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                Phase 5: Financial Trust & Protection
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-400/20 text-amber-100 border border-amber-300/30">
                <Info className="w-3.5 h-3.5" />
                Demo Transparency Ledger
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display flex flex-wrap items-center gap-2">
              <span>Farmer Protection & Deal Transparency</span>
              <span className="text-emerald-200 text-base font-normal">कृषि-सुरक्षा व विश्वास</span>
            </h1>
            <p className="text-emerald-50 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Understand commercial commitments, preserve transaction evidence, track payment progress, identify price & deduction risks, and raise transparent disputes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
            <button
              onClick={loadProtectionData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 backdrop-blur-xs transition cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Raise Dispute</span>
            </button>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="mt-4 pt-3 border-t border-white/15 flex items-start gap-2 text-xs text-emerald-100/90">
          <Info className="w-4 h-4 text-emerald-200 shrink-0 mt-0.5" />
          <span>
            <strong>Demo Architecture Disclaimer:</strong> Agri2Value provides structured commercial transparency, versioned snapshots, and audit trails. No real-world banking, escrow, lending or legally binding e-signatures are integrated.
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

      {/* ─── KPI Stats Ribbon (Crisp White Cards) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Active Agreements */}
        <div className="card p-4 space-y-1 hover:border-emerald-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="label text-[10px] mb-0">Active Deals</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {metrics ? metrics.active_agreements_count : agreements.filter(a => ['ACCEPTED', 'IN_PROGRESS'].includes(a.status)).length}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{agreements.length} Total recorded</span>
          </div>
        </div>

        {/* Deliveries Pending Confirmation */}
        <div className="card p-4 space-y-1 hover:border-emerald-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="label text-[10px] mb-0">Deliveries Pending</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {metrics ? metrics.deliveries_awaiting_confirmation_count : deliveries.filter(d => d.status === 'PENDING').length}
          </div>
          <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{deliveries.length} Shipments</span>
          </div>
        </div>

        {/* Total Net Payout Agreed */}
        <div className="card p-4 space-y-1 hover:border-emerald-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="label text-[10px] mb-0">Agreed Net</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            ₹{((metrics ? metrics.expected_payments_total : agreements.reduce((a, b) => a + b.estimated_net_payout, 0)) / 1000).toFixed(1)}k
          </div>
          <div className="text-[11px] text-slate-500">
            Disclosed net payout
          </div>
        </div>

        {/* Payments Realized */}
        <div className="card p-4 space-y-1 hover:border-emerald-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="label text-[10px] mb-0">Paid Tranches</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-xl font-black text-green-700 font-mono">
            ₹{((metrics ? metrics.payments_received_total : payments.reduce((a, b) => a + b.amount_paid, 0)) / 1000).toFixed(1)}k
          </div>
          <div className="text-[11px] text-green-700 font-semibold">
            {payments.filter(p => p.payment_status === 'PAID').length} Settled
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="card p-4 space-y-1 hover:border-emerald-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="label text-[10px] mb-0">Outstanding</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700 font-mono">
            ₹{((metrics ? metrics.outstanding_balance_total : 0) / 1000).toFixed(1)}k
          </div>
          <div className="text-[11px] text-amber-700 font-semibold">
            Due per terms
          </div>
        </div>

        {/* Disputes / Alerts */}
        <div className="card p-4 space-y-1 hover:border-emerald-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="label text-[10px] mb-0">Disputes / Alerts</span>
            <Scale className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono flex items-center gap-1">
            <span className="text-rose-600">{disputes.filter(d => d.status !== 'RESOLVED' && d.status !== 'CLOSED').length}</span>
            <span className="text-slate-400 text-lg font-normal">/</span>
            <span className="text-amber-600">{alerts.filter(a => !a.is_resolved).length}</span>
          </div>
          <div className="text-[11px] text-rose-700 font-semibold">
            Active Cases
          </div>
        </div>
      </div>

      {/* ─── Sub-tab Navigation (Horizontal Scrollable Pills) ─── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { key: 'overview', label: 'Overview & Ledger', icon: Layers },
          { key: 'agreements', label: `My Agreements (${agreements.length})`, icon: FileCheck2 },
          { key: 'deliveries', label: `Delivery Records (${deliveries.length})`, icon: Truck },
          { key: 'payments', label: `Payment Tracker (${payments.length})`, icon: Wallet },
          { key: 'disputes', label: `Dispute Center (${disputes.length})`, icon: Scale },
          { key: 'alerts', label: `Risk Alerts (${alerts.filter(a => !a.is_resolved).length})`, icon: AlertTriangle },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as SubTab)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 1. OVERVIEW & LEDGER TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setIsDeliveryModalOpen(true)}
              className="card p-5 text-left transition group hover:border-emerald-400 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Log Produce Delivery</h3>
              <p className="text-xs text-slate-500 mt-1">Record partial or full weighbridge shipment with receipt slip.</p>
            </button>

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="card p-5 text-left transition group hover:border-emerald-400 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Record Simulated Payment</h3>
              <p className="text-xs text-slate-500 mt-1">Simulate advance or final bank transfer installment into ledger.</p>
            </button>

            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="card p-5 text-left transition group hover:border-rose-400 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Raise Protection Dispute</h3>
              <p className="text-xs text-slate-500 mt-1">Formal internal grievance for overdue payment or unexpected deductions.</p>
            </button>

            <button
              onClick={() => setActiveSubTab('alerts')}
              className="card p-5 text-left transition group hover:border-amber-400 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Review Explainable Risks</h3>
              <p className="text-xs text-slate-500 mt-1">Detect unverified price changes, delivery mismatches or term amendments.</p>
            </button>
          </div>

          {/* Primary Active Agreement Spotlight */}
          {agreements.length > 0 && (
            <div className="card p-6 sm:p-8 space-y-4 hover:border-emerald-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                      {agreements[0].agreement_number}
                    </span>
                    <span className="text-xs text-slate-500">Version {agreements[0].version}</span>
                    <span className={
                      agreements[0].status === 'ACCEPTED' ? 'badge-green' :
                      agreements[0].status === 'IN_PROGRESS' ? 'badge-blue' :
                      agreements[0].status === 'COMPLETED' ? 'badge-green' :
                      agreements[0].status === 'DISPUTED' ? 'badge-red' :
                      'badge-yellow'
                    }>
                      {agreements[0].status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 font-display mt-2">
                    {agreements[0].commodity} ({agreements[0].variety || 'Standard'}) — {agreements[0].agreed_quantity_kg.toLocaleString()} {agreements[0].quantity_unit}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Buyer: <strong className="text-slate-800">{agreements[0].partner_name}</strong> • Delivery: {agreements[0].delivery_location}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openAgreementDetails(agreements[0])}
                    className="btn-secondary text-xs py-2 px-3.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Digital Terms</span>
                  </button>
                  {agreements[0].status === 'PENDING_ACCEPTANCE' && (
                    <button
                      onClick={() => handleAcceptAgreement(agreements[0].id)}
                      disabled={actionLoading}
                      className="btn-primary text-xs py-2 px-3.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Agreement</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Itemized Commercial Deductions Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="label text-[10px] mb-0.5">Agreed Unit Price</span>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    ₹{agreements[0].agreed_unit_price} / kg
                  </div>
                  <span className="text-[10px] text-slate-500">Gross: ₹{agreements[0].gross_amount.toLocaleString('en-IN')}</span>
                </div>

                <div>
                  <span className="label text-[10px] mb-0.5 text-amber-800">Transport Deduction</span>
                  <div className="text-base font-black text-amber-700 font-mono mt-0.5">
                    -₹{agreements[0].logistics_deduction.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500">Disclosed logistics</span>
                </div>

                <div>
                  <span className="label text-[10px] mb-0.5 text-amber-800">Handling & Processing</span>
                  <div className="text-base font-black text-amber-700 font-mono mt-0.5">
                    -₹{(agreements[0].processing_deduction + agreements[0].other_deductions).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500">Crates & loading</span>
                </div>

                <div>
                  <span className="label text-[10px] mb-0.5 text-rose-800">Total Deductions</span>
                  <div className="text-base font-black text-rose-700 font-mono mt-0.5">
                    -₹{agreements[0].total_deductions.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500">All disclosed fees</span>
                </div>

                <div className="bg-emerald-50/80 p-3 rounded-lg border border-emerald-200 col-span-2 sm:col-span-1">
                  <span className="label text-[10px] mb-0.5 text-emerald-900">Estimated Net Proceeds</span>
                  <div className="text-lg font-black text-emerald-800 font-mono mt-0.5">
                    ₹{agreements[0].estimated_net_payout.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">Net farmer payout</span>
                </div>
              </div>

              {/* Delivery Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Produce Fulfillment Progress:</span>
                  <span className="text-slate-800 font-bold font-mono">
                    {deliveries.filter(d => d.agreement_id === agreements[0].id).reduce((acc, curr) => acc + curr.accepted_quantity_kg, 0).toLocaleString()} / {agreements[0].agreed_quantity_kg.toLocaleString()} kg
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (deliveries.filter(d => d.agreement_id === agreements[0].id).reduce((acc, curr) => acc + curr.accepted_quantity_kg, 0) / agreements[0].agreed_quantity_kg) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recent Audit Stream */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 font-display">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Immutable Transaction Audit Stream</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">Cryptographic Event Log</span>
            </div>

            {auditEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No transaction events recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {auditEvents.slice(0, 5).map(ev => (
                  <div key={ev.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{ev.event_type.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
                            {ev.actor_role}: {ev.actor_name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ev.summary}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. MY AGREEMENTS TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'agreements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 font-display">Commercial Deal Agreements</h2>
              <p className="text-xs text-slate-500">Immutable accepted terms, price locks, and disclosed cost schedules.</p>
            </div>
            {onNavigateToExecution && (
              <button
                onClick={onNavigateToExecution}
                className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Execution Network</span>
              </button>
            )}
          </div>

          {agreements.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No Deal Agreements Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Confirm an execution request with a buyer or processing partner to generate a structured commercial agreement.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {agreements.map(agr => (
                <div key={agr.id} className="card p-6 space-y-4 hover:border-emerald-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                          {agr.agreement_number}
                        </span>
                        <span className="text-xs text-slate-400">v{agr.version}</span>
                        <span className={
                          agr.status === 'ACCEPTED' ? 'badge-green' :
                          agr.status === 'IN_PROGRESS' ? 'badge-blue' :
                          agr.status === 'DISPUTED' ? 'badge-red' :
                          'badge-yellow'
                        }>
                          {agr.status}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 font-display mt-2">
                        {agr.commodity} ({agr.variety || 'Standard Grade'}) — {agr.agreed_quantity_kg.toLocaleString()} {agr.quantity_unit}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Partner: <strong className="text-slate-800">{agr.partner_name}</strong> ({agr.partner_type}) • {agr.delivery_location}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openAgreementDetails(agr)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Deal Summary & PDF</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAgreement(agr);
                          setIsAmendModalOpen(true);
                        }}
                        className="btn-secondary text-xs py-1.5 px-3 border-amber-200 text-amber-800 hover:bg-amber-50"
                      >
                        <span>Amend Terms</span>
                      </button>
                      {agr.status === 'PENDING_ACCEPTANCE' && (
                        <button
                          onClick={() => handleAcceptAgreement(agr.id)}
                          disabled={actionLoading}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Deduction breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="label text-[10px] mb-0.5">Agreed Price</span>
                      <div className="font-black text-slate-900 font-mono">₹{agr.agreed_unit_price} / {agr.quantity_unit}</div>
                    </div>
                    <div>
                      <span className="label text-[10px] mb-0.5">Gross Amount</span>
                      <div className="font-bold text-slate-800 font-mono">₹{agr.gross_amount.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <span className="label text-[10px] mb-0.5 text-amber-800">Transport Fee</span>
                      <div className="font-bold text-amber-700 font-mono">-₹{agr.logistics_deduction.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <span className="label text-[10px] mb-0.5 text-amber-800">Other Deductions</span>
                      <div className="font-bold text-amber-700 font-mono">-₹{(agr.processing_deduction + agr.quality_deduction + agr.other_deductions).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="label text-[10px] mb-0.5 text-emerald-900 font-bold">Net Proceeds</span>
                      <div className="font-black text-emerald-800 font-mono">₹{agr.estimated_net_payout.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {/* Amendment History note */}
                  {agr.version > 1 && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>
                        This agreement has been amended ({agr.version - 1} prior version preserved). Previous accepted snapshot remains immutable in the audit archive.
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. DELIVERY VERIFICATION TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'deliveries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 font-display">Produce Delivery Verification</h2>
              <p className="text-xs text-slate-500">Bilateral weighbridge receipt confirmation and partial delivery tracking.</p>
            </div>
            <button
              onClick={() => setIsDeliveryModalOpen(true)}
              className="btn-primary text-xs py-2 px-3.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Delivery</span>
            </button>
          </div>

          {deliveries.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <Truck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No Delivery Records Logged</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Record your first harvest shipment to generate bilateral weighbridge verification.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map(del => (
                <div key={del.id} className="card p-5 space-y-3 hover:border-emerald-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                          {del.delivery_number}
                        </span>
                        <span className={
                          del.status === 'CONFIRMED' ? 'badge-green' :
                          del.status === 'PARTIALLY_DELIVERED' ? 'badge-blue' :
                          'badge-yellow'
                        }>
                          {del.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(del.delivery_timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 mt-1">
                        Delivered: {del.delivered_quantity_kg.toLocaleString()} {del.quantity_unit} • Accepted: {del.accepted_quantity_kg.toLocaleString()} {del.quantity_unit}
                        {del.rejected_quantity_kg > 0 && (
                          <span className="text-rose-600 font-semibold ml-2">({del.rejected_quantity_kg} kg rejected)</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Location: {del.delivery_location} • Vehicle: {del.vehicle_number || 'N/A'} • Driver: {del.driver_contact || 'N/A'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!del.farmer_confirmed ? (
                        <button
                          onClick={() => handleConfirmDelivery(del.id)}
                          disabled={actionLoading}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          Confirm as Farmer
                        </button>
                      ) : (
                        <span className="badge-green text-xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>Farmer Confirmed</span>
                        </span>
                      )}

                      {del.partner_confirmed ? (
                        <span className="badge-blue text-xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>Buyer Confirmed</span>
                        </span>
                      ) : (
                        <span className="badge-slate text-xs">
                          Buyer confirmation pending
                        </span>
                      )}
                    </div>
                  </div>

                  {del.quality_notes && (
                    <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <strong>Quality Inspection Notes:</strong> {del.quality_notes}
                    </div>
                  )}

                  {del.evidence_notes && (
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between border-t border-slate-100 pt-2 gap-2">
                      <span>Proof Reference: {del.evidence_notes}</span>
                      <span className="text-amber-800 font-mono text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                        {del.evidence_data_mode}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. PAYMENT TRACKER TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 font-display">Payment Tracking Ledger</h2>
              <p className="text-xs text-slate-500">Auditable payment records with due date tracking and automatic balance reconciliation.</p>
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="btn-primary text-xs py-2 px-3.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Simulated Payment</span>
            </button>
          </div>

          {/* Ledger Table */}
          {payments.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <Wallet className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No Payments Recorded</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Record an advance or partial installment to populate the transparent payment ledger.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Payment Ref</th>
                      <th className="p-3.5">Payer / Buyer</th>
                      <th className="p-3.5 text-right">Amount Due</th>
                      <th className="p-3.5 text-right">Amount Paid</th>
                      <th className="p-3.5">Due Date</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 font-mono">Simulated UTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-mono text-emerald-700 font-bold">{p.payment_reference}</td>
                        <td className="p-3.5 font-extrabold text-slate-900">{p.payer_name}</td>
                        <td className="p-3.5 text-right font-mono text-slate-700">₹{p.amount_due.toLocaleString('en-IN')}</td>
                        <td className="p-3.5 text-right font-mono font-black text-emerald-700">₹{p.amount_paid.toLocaleString('en-IN')}</td>
                        <td className="p-3.5 text-slate-500">{new Date(p.due_date).toLocaleDateString()}</td>
                        <td className="p-3.5">{p.payment_method.replace(/_/g, ' ')}</td>
                        <td className="p-3.5">
                          <span className={
                            p.payment_status === 'PAID' ? 'badge-green' :
                            p.payment_status === 'PARTIALLY_PAID' ? 'badge-blue' :
                            p.payment_status === 'OVERDUE' ? 'badge-red' :
                            'badge-yellow'
                          }>
                            {p.payment_status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">{p.transaction_reference_id || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. DISPUTE CENTER TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'disputes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 font-display">Farmer Dispute Management Center</h2>
              <p className="text-xs text-slate-500">Transparent grievance workflow with event logging, evidence capture, and status resolution.</p>
            </div>
            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="btn-primary text-xs py-2 px-3.5 bg-rose-600 hover:bg-rose-700 border-none self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>File New Dispute</span>
            </button>
          </div>

          {disputes.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <Scale className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No Disputes Filed</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active commercial disputes. If you experience payment delays or unexpected deductions, raise a dispute record here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map(disp => (
                <div key={disp.id} className="card p-6 space-y-4 hover:border-rose-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-bold">
                          {disp.dispute_reference}
                        </span>
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {disp.category.replace(/_/g, ' ')}
                        </span>
                        <span className={
                          disp.status === 'RESOLVED' ? 'badge-green' :
                          disp.status === 'UNDER_REVIEW' ? 'badge-yellow' :
                          'badge-red'
                        }>
                          {disp.status}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 font-display mt-2">{disp.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{disp.description}</p>
                      {disp.disputed_amount && (
                        <p className="text-xs text-rose-700 font-black font-mono mt-1">
                          Disputed Amount: ₹{disp.disputed_amount.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {disp.status !== 'RESOLVED' && disp.status !== 'CLOSED' && (
                        <>
                          {disp.status === 'OPEN' && (
                            <button
                              onClick={() => handleUpdateDisputeStatus(disp.id, 'UNDER_REVIEW')}
                              disabled={actionLoading}
                              className="btn-secondary text-xs py-1.5 px-3 border-amber-200 text-amber-800 hover:bg-amber-50"
                            >
                              Mark Under Review
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateDisputeStatus(disp.id, 'RESOLVED')}
                            disabled={actionLoading}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            Resolve Dispute
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dispute Events Timeline */}
                  {disp.events && disp.events.length > 0 && (
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <div className="label text-[10px] mb-1">Dispute History Timeline</div>
                      {disp.events.map((evt, idx) => (
                        <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-900">[{evt.action}]</span> {evt.notes}
                            <span className="text-slate-400 text-[10px] ml-2">({new Date(evt.created_at).toLocaleTimeString()})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. RISK ALERTS TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 font-display">Explainable Financial Risk Alerts</h2>
              <p className="text-xs text-slate-500">Automated watchdogs monitoring payment deadlines, unexpected deductions, and quality claims.</p>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">All Deals in Safe Status</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active commercial risks or overdue payment alerts detected across your trade records.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(al => (
                <div
                  key={al.id}
                  className={`card p-5 space-y-3 ${
                    al.is_resolved ? 'border-slate-200 opacity-60' :
                    al.severity === 'CRITICAL' ? 'border-rose-300 bg-rose-50/30' :
                    'border-amber-300 bg-amber-50/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={al.severity === 'CRITICAL' ? 'badge-red' : al.severity === 'WARNING' ? 'badge-yellow' : 'badge-blue'}>
                          {al.severity} SEVERITY
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">{al.risk_type}</span>
                        {al.is_resolved && <span className="badge-green text-[10px]">RESOLVED</span>}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 font-display mt-2">{al.trigger_evidence}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{al.explanation}</p>
                      {al.recommended_action && (
                        <p className="text-xs text-slate-500 mt-1"><strong className="text-slate-700">Action:</strong> {al.recommended_action}</p>
                      )}
                    </div>

                    {!al.is_resolved && (
                      <button
                        onClick={() => handleResolveAlert(al.id)}
                        className="btn-secondary text-xs py-1.5 px-3 self-start md:self-center"
                      >
                        Dismiss / Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: AGREEMENT DETAILS & AUDIT */}
      {/* ==================================================================== */}
      {isAgreementModalOpen && selectedAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card p-5 sm:p-7 w-full max-w-2xl max-h-[88vh] overflow-y-auto space-y-5 shadow-2xl bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-display">
                    Commercial Agreement {selectedAgreement.agreement_number}
                  </h3>
                  <span className="text-[11px] text-slate-400">Version {selectedAgreement.version} • Digital Snapshot</span>
                </div>
              </div>
              <button
                onClick={() => setIsAgreementModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Core Details */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="label text-[10px] mb-0.5">Commodity & Quantity</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedAgreement.commodity} — {selectedAgreement.agreed_quantity_kg.toLocaleString()} {selectedAgreement.quantity_unit}
                  </div>
                </div>
                <div>
                  <span className="label text-[10px] mb-0.5">Commercial Partner</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedAgreement.partner_name}
                  </div>
                </div>
              </div>

              {/* Deductions Ledger */}
              <div className="space-y-2">
                <h4 className="label text-[11px] text-slate-700 mb-0">Disclosed Deductions & Net Payout</h4>
                <div className="divide-y divide-slate-100 text-xs bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-1.5">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Gross Procurement Amount</span>
                    <span className="font-black text-slate-900 font-mono">₹{selectedAgreement.gross_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-1.5 flex justify-between text-amber-700 font-medium">
                    <span>Logistics / Transport Deduction</span>
                    <span className="font-mono">-₹{selectedAgreement.logistics_deduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-1.5 flex justify-between text-amber-700 font-medium">
                    <span>Processing & Handling Fees</span>
                    <span className="font-mono">-₹{(selectedAgreement.processing_deduction + selectedAgreement.other_deductions).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-1.5 flex justify-between text-rose-700 font-semibold">
                    <span>Total Disclosed Deductions</span>
                    <span className="font-mono">-₹{selectedAgreement.total_deductions.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 flex justify-between font-black text-sm text-emerald-800 border-t border-slate-200">
                    <span>Estimated Net Proceeds to Farmer</span>
                    <span className="font-mono">₹{selectedAgreement.estimated_net_payout.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Payment Reconciliation */}
              {reconciliation && (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 font-display">Payment Reconciliation Summary</span>
                    <span className={
                      reconciliation.is_fully_paid ? 'badge-green' :
                      reconciliation.is_overdue ? 'badge-red' :
                      'badge-yellow'
                    }>
                      {reconciliation.is_fully_paid ? 'PAID' : reconciliation.is_overdue ? 'OVERDUE' : 'PENDING'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] pt-1">
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <span className="text-slate-500 text-[10px]">Agreed Net</span>
                      <div className="font-mono font-bold text-slate-900">₹{reconciliation.net_agreed_payout.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <span className="text-slate-500 text-[10px]">Gross Value</span>
                      <div className="font-mono font-bold text-amber-700">₹{reconciliation.gross_agreed_amount.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <span className="text-slate-500 text-[10px]">Received</span>
                      <div className="font-mono font-black text-emerald-700">₹{reconciliation.total_paid.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                      <span className="text-slate-500 text-[10px]">Outstanding</span>
                      <div className="font-mono font-black text-rose-700">₹{reconciliation.outstanding_balance.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAgreementModalOpen(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: LOG DELIVERY */}
      {/* ==================================================================== */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>Record Produce Delivery</span>
              </h3>
              <button onClick={() => setIsDeliveryModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeliverySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="label">Select Deal Agreement</label>
                <select
                  value={deliveryForm.agreement_id}
                  onChange={e => setDeliveryForm({ ...deliveryForm, agreement_id: e.target.value })}
                  className="input-field"
                  required
                >
                  {agreements.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.agreement_number} — {a.commodity} ({a.partner_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Delivered Quantity (kg)</label>
                  <input
                    type="number"
                    value={deliveryForm.delivered_quantity_kg}
                    onChange={e => {
                      const val = e.target.value;
                      setDeliveryForm({
                        ...deliveryForm,
                        delivered_quantity_kg: val,
                        accepted_quantity_kg: val,
                      });
                    }}
                    placeholder="e.g. 2000"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Accepted Quantity (kg)</label>
                  <input
                    type="number"
                    value={deliveryForm.accepted_quantity_kg}
                    onChange={e => setDeliveryForm({ ...deliveryForm, accepted_quantity_kg: e.target.value })}
                    placeholder="e.g. 2000"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Vehicle Number</label>
                  <input
                    type="text"
                    value={deliveryForm.vehicle_number}
                    onChange={e => setDeliveryForm({ ...deliveryForm, vehicle_number: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Driver Contact</label>
                  <input
                    type="text"
                    value={deliveryForm.driver_contact}
                    onChange={e => setDeliveryForm({ ...deliveryForm, driver_contact: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Quality Inspection Notes</label>
                <textarea
                  value={deliveryForm.quality_notes}
                  onChange={e => setDeliveryForm({ ...deliveryForm, quality_notes: e.target.value })}
                  rows={2}
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary text-xs py-2 px-3.5"
                >
                  {actionLoading ? 'Recording...' : 'Submit Delivery Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: RECORD SIMULATED PAYMENT */}
      {/* ==================================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>Record Simulated Payment Tranche</span>
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="label">Deal Agreement</label>
                <select
                  value={paymentForm.agreement_id}
                  onChange={e => setPaymentForm({ ...paymentForm, agreement_id: e.target.value })}
                  className="input-field"
                  required
                >
                  {agreements.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.agreement_number} — Net ₹{a.estimated_net_payout.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount Due (INR)</label>
                  <input
                    type="number"
                    value={paymentForm.amount_due}
                    onChange={e => setPaymentForm({ ...paymentForm, amount_due: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Amount Transferred (INR)</label>
                  <input
                    type="number"
                    value={paymentForm.amount_paid}
                    onChange={e => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Contractual Due Date</label>
                  <input
                    type="date"
                    value={paymentForm.due_date}
                    onChange={e => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="input-field"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI Digital Payment</option>
                    <option value="CASH_RECEIPT">Cash Mandi Receipt</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Notes & Reference</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                <strong>Simulated Record:</strong> Demonstrates financial ledger tracking and automatic reconciliation. No actual banking transfers take place.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary text-xs py-2 px-3.5"
                >
                  {actionLoading ? 'Recording...' : 'Save Payment Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: RAISE DISPUTE */}
      {/* ==================================================================== */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                <Scale className="w-5 h-5 text-rose-600" />
                <span>Raise Commercial Dispute</span>
              </h3>
              <button onClick={() => setIsDisputeModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="label">Select Deal Agreement</label>
                <select
                  value={disputeForm.agreement_id}
                  onChange={e => setDisputeForm({ ...disputeForm, agreement_id: e.target.value })}
                  className="input-field"
                  required
                >
                  {agreements.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.agreement_number} — {a.commodity} ({a.partner_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Dispute Category</label>
                <select
                  value={disputeForm.category}
                  onChange={e => setDisputeForm({ ...disputeForm, category: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="PAYMENT_OVERDUE">Payment Overdue</option>
                  <option value="PAYMENT_AMOUNT_MISMATCH">Payment Amount Mismatch</option>
                  <option value="UNEXPECTED_DEDUCTION">Unexpected Deduction Introduced</option>
                  <option value="QUANTITY_MISMATCH">Delivered Quantity Mismatch</option>
                  <option value="QUALITY_DISAGREEMENT">Quality Rejection Disagreement</option>
                  <option value="CHANGED_DEAL_TERMS">Changed Terms After Acceptance</option>
                  <option value="DELIVERY_DISAGREEMENT">Delivery / Pickup Disagreement</option>
                  <option value="OTHER">Other Commercial Concern</option>
                </select>
              </div>

              <div>
                <label className="label">Dispute Title</label>
                <input
                  type="text"
                  value={disputeForm.title}
                  onChange={e => setDisputeForm({ ...disputeForm, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Detailed Description & Evidence</label>
                <textarea
                  value={disputeForm.description}
                  onChange={e => setDisputeForm({ ...disputeForm, description: e.target.value })}
                  rows={3}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Disputed Amount (INR, if applicable)</label>
                <input
                  type="number"
                  value={disputeForm.disputed_amount}
                  onChange={e => setDisputeForm({ ...disputeForm, disputed_amount: e.target.value })}
                  className="input-field font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary text-xs py-2 px-3.5 bg-rose-600 hover:bg-rose-700 border-none"
                >
                  {actionLoading ? 'Filing...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: AMEND AGREEMENT */}
      {/* ==================================================================== */}
      {isAmendModalOpen && selectedAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Amend Agreement Terms (v{selectedAgreement.version} ➔ v{selectedAgreement.version + 1})</span>
              </h3>
              <button onClick={() => setIsAmendModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAmendSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                <strong>Immutable Versioning:</strong> Amending terms preserves a permanent snapshot of version {selectedAgreement.version} and resets deal status to PENDING_ACCEPTANCE requiring explicit re-acceptance.
              </div>

              <div>
                <label className="label">Amendment Reason / Rationale</label>
                <input
                  type="text"
                  value={amendForm.reason}
                  onChange={e => setAmendForm({ ...amendForm, reason: e.target.value })}
                  placeholder="e.g. Adjusted price following APMC supply spike"
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">New Agreed Price (INR/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={amendForm.agreed_unit_price}
                    onChange={e => setAmendForm({ ...amendForm, agreed_unit_price: e.target.value })}
                    placeholder={`Current: ${selectedAgreement.agreed_unit_price}`}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Transport Deduction (INR)</label>
                  <input
                    type="number"
                    value={amendForm.logistics_deduction}
                    onChange={e => setAmendForm({ ...amendForm, logistics_deduction: e.target.value })}
                    placeholder={`Current: ${selectedAgreement.logistics_deduction}`}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAmendModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary text-xs py-2 px-3.5 bg-amber-600 hover:bg-amber-700 border-none"
                >
                  {actionLoading ? 'Amending...' : 'Submit Amendment Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
