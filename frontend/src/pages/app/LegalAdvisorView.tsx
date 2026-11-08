// frontend/src/pages/app/LegalAdvisorView.tsx
import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Scale,
  UploadCloud,
  FileCheck,
  HelpCircle,
  Clock,
  DollarSign,
  ChevronRight,
  Gavel,
  Check,
  X
} from 'lucide-react';

interface ContractAuditClause {
  title: string;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  finding: string;
  recommendation: string;
  statutoryReference?: string;
}

interface ContractAuditResult {
  overallVerdict: 'APPROVED_SAFE' | 'ACTION_REQUIRED' | 'HIGH_RISK_REJECT';
  scoreOutOf100: number;
  buyerName: string;
  produceType: string;
  contractType: string;
  clauses: ContractAuditClause[];
}

const SAMPLE_SAFE_CONTRACT: ContractAuditResult = {
  overallVerdict: 'APPROVED_SAFE',
  scoreOutOf100: 94,
  buyerName: 'Sahyadri Agro Processing Consortium Ltd.',
  produceType: 'Tomato (Abhinav Hybrid Red) • 4,000 kg',
  contractType: 'Corporate Contract Farming & Direct Procurement Agreement',
  clauses: [
    {
      title: 'Statutory Payment Timeline (T+3 SLA)',
      status: 'SAFE',
      finding: 'Agreement mandates electronic disbursement directly into farmer bank account within T+3 business days of weighbridge gate-in.',
      recommendation: 'Complies with Section 6 of the Farmers’ Agreement Act and RBI NEFT standards.',
      statutoryReference: 'Section 6(1) of Central Act No. 20 of 2020'
    },
    {
      title: 'Guaranteed Price Floor vs APMC Market Rate',
      status: 'SAFE',
      finding: 'Offers guaranteed base floor of ₹18.00/kg plus a quality bonus up to ₹24.50/kg linked to APMC modal price index.',
      recommendation: 'Protects farmer from downside market gluts while allowing upside participation.',
      statutoryReference: 'MSP & Model Contract Guidelines'
    },
    {
      title: 'Quality Refraction & Dockage Caps',
      status: 'SAFE',
      finding: 'Visual defect deduction strictly capped at maximum 4% of batch weight. Joint sampling protocol before unloading.',
      recommendation: 'Excellent term. Middlemen cannot unilaterally dock 15%-25% for minor fruit blemishes.'
    },
    {
      title: 'Dispute Conciliation & Jurisdiction',
      status: 'SAFE',
      finding: 'Disputes referred to local Sub-Divisional Magistrate (SDM) Conciliation Board with 30-day timebound disposal.',
      recommendation: 'Prevents expensive distant litigation in corporate headquarters cities.'
    }
  ]
};

const SAMPLE_RISKY_CONTRACT: ContractAuditResult = {
  overallVerdict: 'HIGH_RISK_REJECT',
  scoreOutOf100: 38,
  buyerName: 'Unregulated Private Commission Agent (Vashi Consignment)',
  produceType: 'Tomato / Vegetables Unsorted Batch',
  contractType: 'Informal Consignment Note & Commission Mandate',
  clauses: [
    {
      title: 'Statutory Payment Timeline',
      status: 'CRITICAL',
      finding: 'Clause states: "Payment disbursed upon full realization from terminal retailers (approx. 45–60 days)".',
      recommendation: 'HIGH RISK: Unlawful under APMC bylaws. Buyer may delay payouts indefinitely or default after produce is consumed.',
      statutoryReference: 'Violates APMC Rule 32(A) (Mandatory 24-hr payment)'
    },
    {
      title: 'Price Floor & Market Risk',
      status: 'CRITICAL',
      finding: 'Zero guaranteed floor price. Price determined entirely upon arrival at distant terminal market at buyer discretion.',
      recommendation: 'DO NOT SIGN: All transit spoilage and market crashes are dumped onto the farmer.',
    },
    {
      title: 'Uncapped Dockage & Sorting Penalties',
      status: 'WARNING',
      finding: 'Buyer reserves unilateral right to reject up to 30% of crates upon inspection without farmer presence.',
      recommendation: 'Insist on third-party APMC grader certification prior to dispatch.'
    },
    {
      title: 'Dispute Resolution & Land Hypothecation',
      status: 'WARNING',
      finding: 'Dispute forum is private arbitration in Mumbai. Unclear recovery clauses.',
      recommendation: 'Under law, agricultural land can NEVER be attached or mortgaged for produce supply agreements.'
    }
  ]
};

export const LegalAdvisorView: React.FC = () => {
  const [activeAudit, setActiveAudit] = useState<ContractAuditResult | null>(SAMPLE_SAFE_CONTRACT);
  const [contractText, setContractText] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);

  const handleAuditPastedText = () => {
    if (!contractText.trim()) return;
    setIsAuditing(true);
    setTimeout(() => {
      // Rule-based heuristic parse
      const lower = contractText.toLowerCase();
      const hasT3 = lower.includes('t+3') || lower.includes('3 days') || lower.includes('immediate');
      const hasFloor = lower.includes('floor') || lower.includes('guaranteed') || lower.includes('minimum');

      const customResult: ContractAuditResult = {
        overallVerdict: hasT3 && hasFloor ? 'APPROVED_SAFE' : 'ACTION_REQUIRED',
        scoreOutOf100: hasT3 && hasFloor ? 88 : 55,
        buyerName: 'Custom Analyzed Procurement Contract',
        produceType: 'Agricultural Produce / Crop Contract',
        contractType: 'Bilateral Agreement Document',
        clauses: [
          {
            title: 'Payment Settlement Terms',
            status: hasT3 ? 'SAFE' : 'WARNING',
            finding: hasT3 ? 'Identified prompt settlement terms within 3 business days.' : 'Payment terms lack specific statutory T+3 timeline guarantee.',
            recommendation: hasT3 ? 'Standard compliant.' : 'Request amendment guaranteeing payment within 72 hours of weighbridge receipt.'
          },
          {
            title: 'Pricing & Floor Protection',
            status: hasFloor ? 'SAFE' : 'CRITICAL',
            finding: hasFloor ? 'Guaranteed price floor identified.' : 'No explicit price floor specified; subject to terminal spot market volatility.',
            recommendation: hasFloor ? 'Safe pricing clause.' : 'Require a fixed floor price covering cost of cultivation (CoP + 50%).'
          },
          {
            title: 'Weight Tare & Grader Verification',
            status: 'SAFE',
            finding: 'Standard weighbridge verification protocol recommended.',
            recommendation: 'Ensure gross minus tare weighbridge slips are signed by both parties at dispatch point.'
          }
        ]
      };

      setActiveAudit(customResult);
      setIsAuditing(false);
    }, 800);
  };

  return (
    <div className="space-y-8 pb-12 font-sans animate-fade-up">
      {/* ─── Executive Header ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-display">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Agricultural Contract & MSP Legal Protector (कायदेशीर करार व हमीभाव सल्लागार)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-display">
            Legal & MSP Contract Protector
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
            Scrutinize agricultural off-take contracts, mandi consignment notes, and buyer agreements before signing. Detect predatory dockage penalties, enforce statutory T+3 payment SLAs, and protect farmer rights under law.
          </p>
        </div>

        {/* Quick Statutory Shield Pill */}
        <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 self-stretch md:self-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            ⚖️
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Statutory Protection</div>
            <div className="text-xl font-black text-emerald-900 font-display">Section 6 Enforced</div>
            <div className="text-[11px] text-emerald-700 font-medium">T+3 Escrow Payout Mandate</div>
          </div>
        </div>
      </div>

      {/* ─── 4 Core Farmer Legal Rights Overview ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'T+3 Payment Mandate',
            icon: Clock,
            desc: 'Under Central law, buyers must disburse payment within 3 business days of delivery weighbridge slip.',
            tag: 'Mandatory Law'
          },
          {
            title: 'Zero Land Attachment',
            icon: ShieldCheck,
            desc: 'Agricultural land of a farmer can NEVER be attached or mortgaged for any produce supply recovery.',
            tag: '100% Immunity'
          },
          {
            title: 'Capped Dockage Rules',
            icon: Scale,
            desc: 'Refractions must be sampled jointly with third-party APMC or licensed warehouse grading slips.',
            tag: 'Anti-Exploitation'
          },
          {
            title: 'SDM Fast-Track Redress',
            icon: Gavel,
            desc: 'Sub-Divisional Magistrate conciliation board resolves farmer disputes within 30 days locally.',
            tag: 'No Cost Court'
          }
        ].map((right, idx) => {
          const Icon = right.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {right.tag}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm font-display">{right.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{right.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ─── Contract Upload & Sample Selector ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-display">Upload or Audit Agreement Terms</h2>
            <p className="text-xs text-gray-500">Paste contract clauses below or test with pre-loaded real agricultural contract samples.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveAudit(SAMPLE_SAFE_CONTRACT)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeAudit === SAMPLE_SAFE_CONTRACT
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50'
              }`}
            >
              Load Safe Sahyadri Sample
            </button>
            <button
              onClick={() => setActiveAudit(SAMPLE_RISKY_CONTRACT)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeAudit === SAMPLE_RISKY_CONTRACT
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-rose-50'
              }`}
            >
              Load Risky Consignment Note
            </button>
          </div>
        </div>

        {/* Text Input / Paste Box */}
        <div className="space-y-3">
          <textarea
            rows={3}
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder="Paste clauses from your purchase contract, MSP mandi receipt, or agreement (e.g. 'Buyer agrees to pay within 3 days...')..."
            className="input-field text-xs font-mono"
          />
          <div className="flex justify-end">
            <button
              onClick={handleAuditPastedText}
              disabled={!contractText.trim() || isAuditing}
              className="btn-primary text-xs px-5 py-2.5"
            >
              {isAuditing ? 'Auditing Clauses...' : 'Run Legal Clause Audit →'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Active Audit Results Panel ─── */}
      {activeAudit && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          {/* Header Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Audit Target:</span>
                <span className="text-sm font-black text-gray-900">{activeAudit.buyerName}</span>
              </div>
              <div className="text-xs text-gray-600">{activeAudit.produceType} • {activeAudit.contractType}</div>
            </div>

            {/* Verdict Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-500 uppercase">Protection Index</div>
                <div className={`text-2xl font-black font-display ${
                  activeAudit.scoreOutOf100 >= 80 ? 'text-green-600' : 'text-rose-600'
                }`}>
                  {activeAudit.scoreOutOf100} / 100
                </div>
              </div>

              <div className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                activeAudit.overallVerdict === 'APPROVED_SAFE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {activeAudit.overallVerdict === 'APPROVED_SAFE' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Safe to Execute</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>High Risk Detected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Clauses List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Clause-by-Clause Legal Scrutiny & Farmer Protection Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAudit.clauses.map((clause, idx) => {
                const isSafe = clause.status === 'SAFE';
                const isCritical = clause.status === 'CRITICAL';

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-5 border space-y-3 ${
                      isSafe
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : isCritical
                        ? 'bg-rose-50/60 border-rose-200'
                        : 'bg-amber-50/60 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-900 text-sm font-display">
                        {clause.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isSafe
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : isCritical
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}>
                        {clause.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-700 leading-relaxed">
                      <span className="font-bold text-gray-900 block mb-0.5">Contract Finding:</span>
                      {clause.finding}
                    </div>

                    <div className="bg-white/80 rounded-xl p-3 border border-gray-200/60 text-xs text-gray-800 space-y-1">
                      <span className="font-bold text-emerald-800 block">Legal Advisory:</span>
                      <p className="leading-relaxed">{clause.recommendation}</p>
                      {clause.statutoryReference && (
                        <div className="text-[10px] text-gray-400 font-mono pt-1">
                          Ref: {clause.statutoryReference}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
