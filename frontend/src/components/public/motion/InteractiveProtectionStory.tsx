// frontend/src/components/public/motion/InteractiveProtectionStory.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  CheckCircle2,
  Clock,
  Coins,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const InteractiveProtectionStory: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(1);

  const STAGES = [
    {
      id: 1,
      title: 'Tripartite Digital Deal Sheet',
      subtitle: 'Legal Contract Pre-Commitment',
      icon: FileText,
      badge: 'Escrow Locked',
      desc: 'Before produce leaves the farm gate, a tripartite contract is locked between the Farmer, Verified Buyer, and Logistics Carrier. Net price, allowed tare deductions, and payment date are legally locked.',
      features: [
        'Zero verbal handshake vulnerability',
        'Transparent maximum deduction ceiling',
        'Full dispute jurisdiction in Nashik District Court',
      ],
      preview: {
        contractNo: 'AGRI-VAL-2026-NIP-0881',
        buyer: 'Sahyadri Agro Processing Ltd.',
        produce: '4,000 kg Tomato (Abhinav Grade A)',
        agreedRate: '₹24.50 / kg',
        escrowAmount: '₹98,000.00 (Locked in ICICI Escrow)',
      },
    },
    {
      id: 2,
      title: 'Weighbridge & Quality Telemetry',
      subtitle: 'Zero Weight Manipulation',
      icon: Scale,
      badge: 'GPS Verified',
      desc: 'Produce weight and moisture content are automatically ingested directly from certified APMC and factory digital weighbridges. Discrepancies exceeding 1.5% trigger an immediate audit.',
      features: [
        'Automated digital gross & tare scale slip ingestion',
        'Photographic crate inspection timestamped at gate',
        'Automatic transit delay compensation calculation',
      ],
      preview: {
        contractNo: 'AGRI-VAL-2026-NIP-0881',
        weighbridge: 'Pimpalgaon Certified Platform Scale #4',
        grossWeight: '4,012 kg (0.3% moisture loss allowance)',
        gradeConfirmed: 'Grade A (Refractometer 4.8 Brix)',
        auditStatus: 'VERIFIED & INGESTED INTO RECORD',
      },
    },
    {
      id: 3,
      title: 'Statutory T+3 Payout Settlement',
      subtitle: 'Prompt Payment Guarantee',
      icon: Coins,
      badge: 'Direct Bank Settlement',
      desc: 'Buyer funds held in escrow are automatically released directly to the farmer bank account within 3 business days of weighbridge confirmation, with an emergency 1-click dispute lock.',
      features: [
        'Direct NEFT/RTGS settlement to farmer Aadhaar-linked account',
        'Statutory 18% p.a. interest penalty on unapproved buyer delays',
        '1-click dispute filing freezes escrow until mediation',
      ],
      preview: {
        contractNo: 'AGRI-VAL-2026-NIP-0881',
        farmerName: 'Ramesh Patil (Patil Krishi Farm)',
        bankAccount: 'Bank of Maharashtra (••• 4092)',
        netPaid: '₹89,840.00 Net Payout Transferred',
        utrRef: 'MAHB261108920194 (Settled)',
      },
    },
  ];

  const current = STAGES.find((s) => s.id === activeStage) || STAGES[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Farmer Protection & Legal Escrow Infrastructure</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              End-to-End Deal Transparency System
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl">
              Eliminating delayed buyer payments, unjustified quality cuts, and verbal agreement defaults through escrow security and digital weighbridge audits.
            </p>
          </div>

          <Link
            to="/app/protection"
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md"
          >
            <span>Open Protection Hub</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Step Selectors */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STAGES.map((s) => {
            const Icon = s.icon;
            const isSelected = activeStage === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStage(s.id)}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600/90 text-white border-emerald-400 shadow-lg shadow-emerald-700/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isSelected ? 'bg-white text-emerald-900' : 'bg-white/10 text-slate-300'
                  }`}>
                    0{s.id}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-white/10 text-slate-400'
                  }`}>
                    {s.badge}
                  </span>
                </div>
                <div className="text-xs font-black truncate">{s.title}</div>
                <div className="text-[10px] opacity-80 mt-0.5 truncate">{s.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stage Display */}
      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
          >
            {/* Left: Explanatory Features */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 mb-2">
                STAGE 0{current.id} OF 03
              </div>
              <h4 className="text-xl font-black text-slate-900 font-display tracking-tight">
                {current.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                {current.desc}
              </p>

              <div className="mt-5 space-y-2.5">
                {current.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-bit Encrypted Deal Registry</span>
                </span>
                <span>•</span>
                <span>Statutory APMC Compliance</span>
              </div>
            </div>

            {/* Right: Digital Proof Artifact Mockup */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white font-mono text-xs shadow-lg border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  AGRI2VALUE AUDIT LOG
                </span>
                <span>{current.preview.contractNo}</span>
              </div>

              <div className="mt-4 space-y-2.5 text-[11px]">
                {Object.entries(current.preview).map(([key, val]) => {
                  if (key === 'contractNo') return null;
                  return (
                    <div key={key} className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-white font-bold">{val}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between text-[10px] text-emerald-400 font-semibold">
                <span>✓ Cryptographically Signed &amp; Validated</span>
                <span>Niphad, Nashik Corridor</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

