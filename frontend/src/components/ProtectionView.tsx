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
  Printer,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Info,
  Check,
  Layers
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
      setError(err.message || 'Failed to load protection data.');
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

  // Submit Dispute
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
      alert(err.message || 'Failed to raise dispute.');
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
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/80 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Phase 5: Financial Trust & Protection
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Info className="w-3.5 h-3.5" />
                Demo Transparency Ledger
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Farmer Protection & Deal Transparency
              <span className="text-emerald-400 text-lg font-normal">कृषि-सुरक्षा व आर्थिक विश्वास</span>
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Understand commercial commitments, preserve transaction evidence, track payment progress, identify price & deduction risks, and raise transparent disputes.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={loadProtectionData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium shadow-md shadow-rose-900/30 transition"
            >
              <Scale className="w-4 h-4" />
              Raise Dispute
            </button>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Demo Architecture Disclaimer:</strong> Agri2Value provides structured commercial transparency, versioned snapshots, and audit trails. No real-world banking, escrow, lending or legally binding e-signatures are integrated.
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white cursor-pointer">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Active Agreements */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Active Deals</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics ? metrics.active_agreements_count : agreements.filter(a => ['ACCEPTED', 'IN_PROGRESS'].includes(a.status)).length}
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {agreements.length} Total recorded
          </div>
        </div>

        {/* Deliveries Pending Confirmation */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Deliveries Pending</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics ? metrics.deliveries_awaiting_confirmation_count : deliveries.filter(d => d.status === 'PENDING').length}
          </div>
          <div className="text-[11px] text-sky-400 mt-0.5 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {deliveries.length} Shipments logged
          </div>
        </div>

        {/* Expected Payments */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Expected Payout</span>
            <Wallet className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{metrics ? metrics.expected_payments_total.toLocaleString('en-IN') : '62,000'}
          </div>
          <div className="text-[11px] text-indigo-300 mt-0.5 font-medium">
            Agreed Net Farmer Proceeds
          </div>
        </div>

        {/* Payments Received */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Payments Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{metrics ? metrics.payments_received_total.toLocaleString('en-IN') : '31,000'}
          </div>
          <div className="text-[11px] text-emerald-300 mt-0.5 font-medium">
            {payments.length} Ledger entries
          </div>
        </div>

        {/* Outstanding / Overdue */}
        <div className={`rounded-xl p-4 shadow-sm border transition ${metrics && metrics.overdue_payments_total > 0 ? 'bg-amber-950/30 border-amber-500/40' : 'bg-slate-900/70 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Outstanding Balance</span>
            <AlertTriangle className={`w-4 h-4 ${metrics && metrics.overdue_payments_total > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${metrics && metrics.overdue_payments_total > 0 ? 'text-amber-300' : 'text-white'}`}>
            ₹{metrics ? metrics.outstanding_balance_total.toLocaleString('en-IN') : '31,000'}
          </div>
          <div className="text-[11px] text-amber-400 mt-0.5 font-medium flex items-center gap-1">
            {metrics && metrics.overdue_payments_total > 0 ? `₹${metrics.overdue_payments_total.toLocaleString('en-IN')} Overdue` : 'On track'}
          </div>
        </div>

        {/* Active Disputes & Alerts */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Disputes / Alerts</span>
            <Scale className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <span>{disputes.filter(d => d.status !== 'RESOLVED' && d.status !== 'CLOSED').length}</span>
            <span className="text-slate-500 text-lg font-normal">/</span>
            <span className="text-amber-400">{alerts.filter(a => !a.is_resolved).length}</span>
          </div>
          <div className="text-[11px] text-rose-400 mt-0.5 font-medium">
            Active Review Cases
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
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
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 1. OVERVIEW & LEDGER TAB */}
      {/* ==================================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setIsDeliveryModalOpen(true)}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 text-left transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-sm">Log Produce Delivery</h3>
              <p className="text-xs text-slate-400 mt-1">Record partial or full weighbridge shipment with receipt slip.</p>
            </button>

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 text-left transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-sm">Record Simulated Payment</h3>
              <p className="text-xs text-slate-400 mt-1">Simulate advance or final bank transfer installment into ledger.</p>
            </button>

            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 text-left transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-sm">Raise Protection Dispute</h3>
              <p className="text-xs text-slate-400 mt-1">Formal internal grievance for overdue payment or unexpected deductions.</p>
            </button>

            <button
              onClick={() => setActiveSubTab('alerts')}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 text-left transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-sm">Review Explainable Risks</h3>
              <p className="text-xs text-slate-400 mt-1">Detect unverified price changes, delivery mismatches or term amendments.</p>
            </button>
          </div>

          {/* Primary Active Agreement Spotlight */}
          {agreements.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {agreements[0].agreement_number}
                    </span>
                    <span className="text-xs text-slate-400">Version {agreements[0].version}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      agreements[0].status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      agreements[0].status === 'IN_PROGRESS' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                      agreements[0].status === 'COMPLETED' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                      agreements[0].status === 'DISPUTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {agreements[0].status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {agreements[0].commodity} ({agreements[0].variety || 'Standard'}) — {agreements[0].agreed_quantity_kg.toLocaleString()} {agreements[0].quantity_unit}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Buyer: <strong className="text-slate-200">{agreements[0].partner_name}</strong> • Delivery: {agreements[0].delivery_location}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAgreementDetails(agreements[0])}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Digital Terms
                  </button>
                  {agreements[0].status === 'PENDING_ACCEPTANCE' && (
                    <button
                      onClick={() => handleAcceptAgreement(agreements[0].id)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept Agreement
                    </button>
                  )}
                </div>
              </div>

              {/* Itemized Commercial Deductions Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-4">
                <div>
                  <span className="text-[11px] text-slate-400">Agreed Unit Price</span>
                  <div className="text-base font-bold text-white mt-0.5">
                    ₹{agreements[0].agreed_unit_price} / kg
                  </div>
                  <span className="text-[10px] text-slate-500">Gross: ₹{agreements[0].gross_amount.toLocaleString('en-IN')}</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400">Transport Deduction</span>
                  <div className="text-base font-bold text-amber-400 mt-0.5">
                    -₹{agreements[0].logistics_deduction.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500">Disclosed logistics</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400">Handling / Processing</span>
                  <div className="text-base font-bold text-amber-400 mt-0.5">
                    -₹{(agreements[0].processing_deduction + agreements[0].other_deductions).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500">Crate & loading charges</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400">Total Deductions</span>
                  <div className="text-base font-bold text-rose-400 mt-0.5">
                    -₹{agreements[0].total_deductions.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500">All disclosed fees</span>
                </div>

                <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20 col-span-2 md:col-span-1">
                  <span className="text-[11px] text-emerald-300 font-semibold">Estimated Net Proceeds</span>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    ₹{agreements[0].estimated_net_payout.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-300/80">Net payout to farmer</span>
                </div>
              </div>

              {/* Delivery Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Produce Fulfillment Progress:</span>
                  <span className="text-slate-200 font-medium">
                    {deliveries.filter(d => d.agreement_id === agreements[0].id).reduce((acc, curr) => acc + curr.accepted_quantity_kg, 0).toLocaleString()} / {agreements[0].agreed_quantity_kg.toLocaleString()} kg
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
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
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Immutable Transaction Audit Stream
              </h3>
              <span className="text-xs text-slate-500">Live cryptographic demo log</span>
            </div>

            {auditEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No transaction events recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {auditEvents.slice(0, 5).map(ev => (
                  <div key={ev.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{ev.event_type.replace(/_/g, ' ')}</span>
                          <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {ev.actor_role}: {ev.actor_name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">{ev.summary}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Commercial Deal Agreements</h2>
            {onNavigateToExecution && (
              <button
                onClick={onNavigateToExecution}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                From Execution Network
              </button>
            )}
          </div>

          {agreements.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
              <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No Deal Agreements Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Confirm an execution request with a buyer or processing partner to generate a structured commercial agreement.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {agreements.map(agr => (
                <div key={agr.id} className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-emerald-400 font-semibold">{agr.agreement_number}</span>
                        <span className="text-xs text-slate-500">v{agr.version}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          agr.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' :
                          agr.status === 'IN_PROGRESS' ? 'bg-sky-500/20 text-sky-400' :
                          agr.status === 'DISPUTED' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {agr.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        {agr.commodity} ({agr.variety || 'Standard Grade'}) — {agr.agreed_quantity_kg.toLocaleString()} {agr.quantity_unit}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Partner: <strong className="text-slate-200">{agr.partner_name}</strong> ({agr.partner_type}) • {agr.delivery_location}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAgreementDetails(agr)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Deal Summary & PDF
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAgreement(agr);
                          setIsAmendModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-slate-700 transition"
                      >
                        Amend Terms
                      </button>
                      {agr.status === 'PENDING_ACCEPTANCE' && (
                        <button
                          onClick={() => handleAcceptAgreement(agr.id)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Deduction breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500">Agreed Price</span>
                      <div className="font-semibold text-slate-200">₹{agr.agreed_unit_price} / {agr.quantity_unit}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Gross Amount</span>
                      <div className="font-semibold text-slate-200">₹{agr.gross_amount.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Transport Fee</span>
                      <div className="font-semibold text-amber-400">-₹{agr.logistics_deduction.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Other Deductions</span>
                      <div className="font-semibold text-amber-400">-₹{(agr.processing_deduction + agr.quality_deduction + agr.other_deductions).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="font-bold text-emerald-400">
                      <span className="text-slate-500 font-normal">Net Farmer Proceeds</span>
                      <div>₹{agr.estimated_net_payout.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {/* Amendment History accordion note if version > 1 */}
                  {agr.version > 1 && (
                    <div className="text-[11px] text-amber-300 bg-amber-950/20 border border-amber-500/20 p-2.5 rounded-lg flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0" />
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Produce Delivery Verification</h2>
              <p className="text-xs text-slate-400">Bilateral weighbridge receipt confirmation and partial delivery tracking.</p>
            </div>
            <button
              onClick={() => setIsDeliveryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Delivery
            </button>
          </div>

          {deliveries.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
              <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No Delivery Records Logged</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Record your first harvest shipment to generate bilateral weighbridge verification.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map(del => (
                <div key={del.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-sky-400 font-semibold">{del.delivery_number}</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          del.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400' :
                          del.status === 'PARTIALLY_DELIVERED' ? 'bg-sky-500/20 text-sky-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {del.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(del.delivery_timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-white mt-1">
                        Delivered: {del.delivered_quantity_kg.toLocaleString()} {del.quantity_unit} • Accepted: {del.accepted_quantity_kg.toLocaleString()} {del.quantity_unit}
                        {del.rejected_quantity_kg > 0 && (
                          <span className="text-rose-400 font-normal ml-2">({del.rejected_quantity_kg} kg rejected)</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Location: {del.delivery_location} • Vehicle: {del.vehicle_number || 'N/A'} • Driver: {del.driver_contact || 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!del.farmer_confirmed ? (
                        <button
                          onClick={() => handleConfirmDelivery(del.id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                        >
                          Confirm as Farmer
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <Check className="w-3.5 h-3.5" />
                          Farmer Confirmed
                        </span>
                      )}

                      {del.partner_confirmed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                          <Check className="w-3.5 h-3.5" />
                          Buyer Confirmed
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-lg">
                          Buyer confirmation pending
                        </span>
                      )}
                    </div>
                  </div>

                  {del.quality_notes && (
                    <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      <strong>Quality Inspection Notes:</strong> {del.quality_notes}
                    </div>
                  )}

                  {del.evidence_notes && (
                    <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                      <span>Proof Reference: {del.evidence_notes}</span>
                      <span className="text-amber-400 font-mono text-[10px]">{del.evidence_data_mode}</span>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Payment Tracking Ledger</h2>
              <p className="text-xs text-slate-400">Auditable payment records with due date tracking and automatic balance reconciliation.</p>
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Simulated Payment
            </button>
          </div>

          {/* Ledger Table */}
          {payments.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
              <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No Payments Recorded</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Record an advance or partial installment to populate the transparent payment ledger.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Payment Ref</th>
                      <th className="p-3.5">Payer / Buyer</th>
                      <th className="p-3.5">Amount Due</th>
                      <th className="p-3.5">Amount Paid</th>
                      <th className="p-3.5">Due Date</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Simulated UTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-mono text-emerald-400 font-semibold">{p.payment_reference}</td>
                        <td className="p-3.5 font-medium text-white">{p.payer_name}</td>
                        <td className="p-3.5 font-semibold text-slate-200">₹{p.amount_due.toLocaleString('en-IN')}</td>
                        <td className="p-3.5 font-bold text-emerald-400">₹{p.amount_paid.toLocaleString('en-IN')}</td>
                        <td className="p-3.5 text-slate-400">{new Date(p.due_date).toLocaleDateString()}</td>
                        <td className="p-3.5">{p.payment_method.replace(/_/g, ' ')}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            p.payment_status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                            p.payment_status === 'PARTIALLY_PAID' ? 'bg-sky-500/20 text-sky-400' :
                            p.payment_status === 'OVERDUE' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Farmer Dispute Management Center</h2>
              <p className="text-xs text-slate-400">Transparent grievance workflow with event logging, evidence capture, and status resolution.</p>
            </div>
            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              File New Dispute
            </button>
          </div>

          {disputes.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
              <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No Disputes Filed</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No active commercial disputes. If you experience payment delays or unexpected deductions, raise a dispute record here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map(disp => (
                <div key={disp.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-rose-400 font-semibold">{disp.dispute_reference}</span>
                        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {disp.category.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          disp.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                          disp.status === 'UNDER_REVIEW' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {disp.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">{disp.title}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">{disp.description}</p>
                      {disp.disputed_amount && (
                        <p className="text-xs text-amber-400 font-semibold mt-1">
                          Disputed Amount: ₹{disp.disputed_amount.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {disp.status !== 'RESOLVED' && disp.status !== 'CLOSED' && (
                        <>
                          {disp.status === 'OPEN' && (
                            <button
                              onClick={() => handleUpdateDisputeStatus(disp.id, 'UNDER_REVIEW')}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition"
                            >
                              Mark Under Review
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateDisputeStatus(disp.id, 'RESOLVED')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                          >
                            Resolve Dispute
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dispute Events Timeline */}
                  {disp.events && disp.events.length > 0 && (
                    <div className="border-t border-slate-800 pt-3">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dispute Timeline:</span>
                      <div className="mt-2 space-y-2">
                        {disp.events.map(ev => (
                          <div key={ev.id} className="text-xs flex items-start gap-2 bg-slate-950/40 p-2 rounded">
                            <span className="text-emerald-400">•</span>
                            <div className="flex-1">
                              <span className="font-medium text-slate-200">{ev.actor_role} ({ev.actor_name}):</span>{' '}
                              <span className="text-slate-300">{ev.notes}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(ev.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {disp.resolution_notes && (
                    <div className="text-xs text-emerald-300 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
                      <strong>Resolution Notes:</strong> {disp.resolution_notes}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 italic">
                    {disp.disclaimer}
                  </div>
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
              <h2 className="text-lg font-bold text-white">Farmer Commercial Risk Alerts</h2>
              <p className="text-xs text-slate-400">Objective, non-accusatory early warnings on price deviations, unexpected deductions, and overdue payments.</p>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No Active Risk Alerts</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                All agreements, payments, and deliveries reconcile cleanly without unexpected commercial variances.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`rounded-xl p-5 border space-y-3 transition ${
                    alert.is_resolved
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                      : alert.severity === 'CRITICAL'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-amber-950/20 border-amber-500/40'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {alert.risk_type.replace(/_/g, ' ')}
                      </span>
                      {alert.is_resolved && (
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Resolved
                        </span>
                      )}
                    </div>

                    {!alert.is_resolved && (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                      >
                        Resolve / Dismiss
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400 font-medium">Triggering Evidence:</span>
                      <p className="text-slate-200 mt-1">{alert.trigger_evidence}</p>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400 font-medium">Explanation:</span>
                      <p className="text-slate-200 mt-1">{alert.explanation}</p>
                    </div>

                    <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-500/20">
                      <span className="text-emerald-300 font-medium">Recommended Farmer Action:</span>
                      <p className="text-emerald-200 mt-1">{alert.recommended_action}</p>
                    </div>
                  </div>

                  {alert.resolution_notes && (
                    <div className="text-xs text-slate-400 bg-slate-950/40 p-2 rounded">
                      <strong>Resolution Note:</strong> {alert.resolution_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: VIEW DIGITAL AGREEMENT / PRINTABLE SUMMARY */}
      {/* ==================================================================== */}
      {isAgreementModalOpen && selectedAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Digital Commercial Agreement Record</h3>
                  <span className="text-xs text-slate-400 font-mono">{selectedAgreement.agreement_number} • Version {selectedAgreement.version}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setIsAgreementModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Deal Certificate Body */}
            <div className="space-y-4 print:text-black">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                <strong>Digital Deal Confirmation:</strong> This structured record captures commercial terms mutually agreed between Farmer and Buyer/Partner on Agri2Value.
              </div>

              {/* Contracting Parties */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-semibold uppercase">Farmer (Seller):</span>
                  <div className="font-bold text-white text-sm mt-1">Ramesh Patil</div>
                  <div className="text-slate-400">Patil Krishi Farm, Niphad, Nashik</div>
                  <div className="text-slate-400">Phone: +91 98765 43210</div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-semibold uppercase">Commercial Partner (Buyer):</span>
                  <div className="font-bold text-white text-sm mt-1">{selectedAgreement.partner_name}</div>
                  <div className="text-slate-400">Type: {selectedAgreement.partner_type}</div>
                  <div className="text-slate-400">Contact: {selectedAgreement.partner_contact || 'Registered Terminal'}</div>
                </div>
              </div>

              {/* Commodity & Terms */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Agreed Produce Particulars</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500">Commodity</span>
                    <div className="font-semibold text-white">{selectedAgreement.commodity}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Variety & Grade</span>
                    <div className="font-semibold text-white">{selectedAgreement.variety || 'Commercial'} ({selectedAgreement.quality_grade || 'Grade A'})</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Agreed Volume</span>
                    <div className="font-semibold text-white">{selectedAgreement.agreed_quantity_kg.toLocaleString()} {selectedAgreement.quantity_unit}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Unit Price</span>
                    <div className="font-semibold text-emerald-400">₹{selectedAgreement.agreed_unit_price} / {selectedAgreement.quantity_unit}</div>
                  </div>
                </div>
              </div>

              {/* Itemized Deductions Ledger */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Transparent Deductions & Net Payout</h4>
                <div className="divide-y divide-slate-800 text-xs bg-slate-950/60 rounded-xl border border-slate-800 p-3">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-300">Gross Procurement Amount</span>
                    <span className="font-semibold text-white">₹{selectedAgreement.gross_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-2 flex justify-between text-amber-300">
                    <span>Logistics / Transport Deduction</span>
                    <span>-₹{selectedAgreement.logistics_deduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-2 flex justify-between text-amber-300">
                    <span>Processing / Handling Fees</span>
                    <span>-₹{(selectedAgreement.processing_deduction + selectedAgreement.other_deductions).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-2 flex justify-between text-rose-400 font-medium">
                    <span>Total Disclosed Deductions</span>
                    <span>-₹{selectedAgreement.total_deductions.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-2.5 flex justify-between font-bold text-sm text-emerald-400 border-t-2 border-emerald-500/30">
                    <span>Estimated Net Proceeds to Farmer</span>
                    <span>₹{selectedAgreement.estimated_net_payout.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Payment & Delivery Logistics */}
              <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500">Delivery Destination</span>
                  <div className="font-medium text-white">{selectedAgreement.delivery_location}</div>
                </div>
                <div>
                  <span className="text-slate-500">Payment Terms</span>
                  <div className="font-medium text-white">{selectedAgreement.payment_terms_days} days post weighbridge acceptance</div>
                </div>
              </div>

              {/* Payment Reconciliation Ledger */}
              {reconciliation && (
                <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">Payment Reconciliation Summary</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold">
                      {reconciliation.is_fully_paid ? 'PAID' : reconciliation.is_overdue ? 'OVERDUE' : 'PENDING'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-slate-900/60 p-2 rounded">
                      <span className="text-slate-500">Agreed Net</span>
                      <div className="font-mono text-white font-semibold">₹{reconciliation.net_agreed_payout.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded">
                      <span className="text-slate-500">Gross Value</span>
                      <div className="font-mono text-amber-400 font-semibold">₹{reconciliation.gross_agreed_amount.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded">
                      <span className="text-slate-500">Amount Received</span>
                      <div className="font-mono text-emerald-400 font-semibold">₹{reconciliation.total_paid.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded">
                      <span className="text-slate-500">Outstanding</span>
                      <div className="font-mono text-rose-400 font-semibold">₹{reconciliation.outstanding_balance.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Explicit Demo Disclaimer */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <strong>Legal Notice & Demonstration Acknowledgment:</strong>
                <p>
                  This document serves as an internal digital record of agreed terms between the farmer and buyer. No legally binding digital signature has been executed under the Information Technology Act. Real-world contract enforcement requires certified e-Sign integration.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsAgreementModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Record Produce Delivery
              </h3>
              <button onClick={() => setIsDeliveryModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeliverySubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Select Deal Agreement</label>
                <select
                  value={deliveryForm.agreement_id}
                  onChange={e => setDeliveryForm({ ...deliveryForm, agreement_id: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                >
                  {agreements.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.agreement_number} — {a.commodity} ({a.partner_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Delivered Quantity (kg)</label>
                  <input
                    type="number"
                    value={deliveryForm.delivered_quantity_kg}
                    onChange={e => {
                      const val = e.target.value;
                      setDeliveryForm({
                        ...deliveryForm,
                        delivered_quantity_kg: val,
                        accepted_quantity_kg: val, // default accepted = delivered
                      });
                    }}
                    placeholder="e.g. 2000"
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Accepted Quantity (kg)</label>
                  <input
                    type="number"
                    value={deliveryForm.accepted_quantity_kg}
                    onChange={e => setDeliveryForm({ ...deliveryForm, accepted_quantity_kg: e.target.value })}
                    placeholder="e.g. 2000"
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Vehicle Number</label>
                  <input
                    type="text"
                    value={deliveryForm.vehicle_number}
                    onChange={e => setDeliveryForm({ ...deliveryForm, vehicle_number: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Driver Contact</label>
                  <input
                    type="text"
                    value={deliveryForm.driver_contact}
                    onChange={e => setDeliveryForm({ ...deliveryForm, driver_contact: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Quality Inspection Notes</label>
                <textarea
                  value={deliveryForm.quality_notes}
                  onChange={e => setDeliveryForm({ ...deliveryForm, quality_notes: e.target.value })}
                  rows={2}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                Record Simulated Payment Tranche
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Deal Agreement</label>
                <select
                  value={paymentForm.agreement_id}
                  onChange={e => setPaymentForm({ ...paymentForm, agreement_id: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                >
                  {agreements.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.agreement_number} — Net ₹{a.estimated_net_payout.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Amount Due (INR)</label>
                  <input
                    type="number"
                    value={paymentForm.amount_due}
                    onChange={e => setPaymentForm({ ...paymentForm, amount_due: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Amount Transferred (INR)</label>
                  <input
                    type="number"
                    value={paymentForm.amount_paid}
                    onChange={e => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Contractual Due Date</label>
                  <input
                    type="date"
                    value={paymentForm.due_date}
                    onChange={e => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Payment Method</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI Digital Payment</option>
                    <option value="CASH_RECEIPT">Cash Mandi Receipt</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Notes & Reference</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="p-2.5 bg-amber-950/20 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                <strong>Simulated Record:</strong> Demonstrates financial ledger tracking and automatic reconciliation. No actual banking transfers take place.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-rose-400" />
                Raise Commercial Dispute
              </h3>
              <button onClick={() => setIsDisputeModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Select Deal Agreement</label>
                <select
                  value={disputeForm.agreement_id}
                  onChange={e => setDisputeForm({ ...disputeForm, agreement_id: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
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
                <label className="text-slate-400 font-medium">Dispute Category</label>
                <select
                  value={disputeForm.category}
                  onChange={e => setDisputeForm({ ...disputeForm, category: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
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
                <label className="text-slate-400 font-medium">Dispute Title</label>
                <input
                  type="text"
                  value={disputeForm.title}
                  onChange={e => setDisputeForm({ ...disputeForm, title: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Detailed Description & Evidence</label>
                <textarea
                  value={disputeForm.description}
                  onChange={e => setDisputeForm({ ...disputeForm, description: e.target.value })}
                  rows={3}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Disputed Amount (INR, if applicable)</label>
                <input
                  type="number"
                  value={disputeForm.disputed_amount}
                  onChange={e => setDisputeForm({ ...disputeForm, disputed_amount: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-400 italic">
                Notice: Internal platform workflow for commercial mediation. Does not constitute legal arbitration or judicial court filing.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Amend Agreement Terms (v{selectedAgreement.version} ➔ v{selectedAgreement.version + 1})
              </h3>
              <button onClick={() => setIsAmendModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAmendSubmit} className="space-y-3 text-xs">
              <div className="p-2.5 bg-amber-950/20 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                <strong>Immutable Versioning:</strong> Amending terms preserves a permanent snapshot of version {selectedAgreement.version} and resets deal status to PENDING_ACCEPTANCE requiring explicit re-acceptance.
              </div>

              <div>
                <label className="text-slate-400 font-medium">Amendment Reason / Rationale</label>
                <input
                  type="text"
                  value={amendForm.reason}
                  onChange={e => setAmendForm({ ...amendForm, reason: e.target.value })}
                  placeholder="e.g. Adjusted price following APMC supply spike"
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">New Agreed Unit Price (INR/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={amendForm.agreed_unit_price}
                    onChange={e => setAmendForm({ ...amendForm, agreed_unit_price: e.target.value })}
                    placeholder={`Current: ${selectedAgreement.agreed_unit_price}`}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Transport Deduction (INR)</label>
                  <input
                    type="number"
                    value={amendForm.logistics_deduction}
                    onChange={e => setAmendForm({ ...amendForm, logistics_deduction: e.target.value })}
                    placeholder={`Current: ${selectedAgreement.logistics_deduction}`}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAmendModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
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
