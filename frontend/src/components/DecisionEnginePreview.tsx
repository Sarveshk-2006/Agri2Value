// frontend/src/components/DecisionEnginePreview.tsx
import React from 'react';
import { Cpu, Calculator, ShieldCheck, TrendingUp, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { CropLot } from '../types';

interface DecisionEnginePreviewProps {
  primaryLot: CropLot | undefined;
}

export const DecisionEnginePreview: React.FC<DecisionEnginePreviewProps> = ({ primaryLot }) => {
  const lotQty = primaryLot ? Number(primaryLot.quantity_kg_normalized) : 4000;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-slate-800 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Scheduled for Phase 2: Profit Engine Vertical Slice</span>
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-6 h-6 text-emerald-400" />
          <span>Decision Engine Architecture & Simulation</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          The Profit Decision Engine takes the verified farm and crop lot from Phase 1, evaluates real market prices and verified processing conversion ratios, and enforces a strict feasibility gate before recommending any option.
        </p>
      </div>

      {/* Core Formula Card */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span>Net Profit Calculation Formula (Enforced in Phase 2)</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-emerald-400 border border-slate-800/80 overflow-x-auto leading-relaxed">
          Net Profit = Gross Revenue - (Processing Cost + Transport Cost + Packaging + Holding Storage + Mandi Cess/Commission)
        </div>
        <p className="text-xs text-slate-400">
          Rule: Never compare raw gross price to processed gross price without full cost deduction. Missing cost fields are flagged as conditional or infeasible.
        </p>
      </div>

      {/* 3 Pathway Comparison (Simulation for 4,000 kg Tomato) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Simulation for Active Lot ({lotQty.toLocaleString()} kg Tomato)</span>
          </div>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
            Illustrative Sample Calculations Only
          </span>
        </div>

        {/* Prominent Sample Data Notice */}
        <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-300 leading-relaxed">
            <strong className="font-semibold text-white">Illustrative Sample Values Notice:</strong> All Mandi benchmark rates, direct buyer quotes, and processing conversion yields displayed below are sample illustrative values for simulation and architecture verification. They do not represent live real-time market data feeds.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Path 1: Raw Mandi */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Path A (Raw Mandi)</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                FEASIBLE
              </span>
            </div>
            <h3 className="text-base font-bold text-white">APMC Pimpalgaon (Nashik)</h3>
            <p className="text-xs text-slate-400">Direct open auction sale at Asia's largest tomato market. Immediate payment, high price volatility.</p>
            
            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Sample Mandi Rate:</span>
                <span className="font-mono text-slate-200">₹14.00 / kg (Sample)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gross Revenue:</span>
                <span className="font-mono text-slate-200">₹{(lotQty * 14).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Transport & Cess:</span>
                <span className="font-mono text-red-400">-₹{(lotQty * 2.2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-800">
                <span>Estimated Net Profit:</span>
                <span className="font-mono text-emerald-400">₹{(lotQty * 11.8).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Path 2: Direct Buyer */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Path B (Direct Buyer)</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                PENDING QUOTE
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Direct Retail Buyer</h3>
            <p className="text-xs text-slate-400">Direct farm-gate procurement contract with pre-agreed Grade A specifications.</p>
            
            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Sample Buyer Rate:</span>
                <span className="font-mono text-slate-200">₹18.50 / kg (Sample)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gross Revenue:</span>
                <span className="font-mono text-slate-200">₹{(lotQty * 18.5).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Grading & Crates:</span>
                <span className="font-mono text-red-400">-₹{(lotQty * 1.5).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-800">
                <span>Estimated Net Profit:</span>
                <span className="font-mono text-emerald-400">₹{(lotQty * 17.0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Path 3: Food Processing Value-Add */}
          <div className="glass-panel rounded-2xl p-5 border border-emerald-500/40 bg-emerald-950/20 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase">Path C (Value-Add)</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                RECOMMENDED
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Tomato Puree & Pulping</h3>
            <p className="text-xs text-slate-300">
              Contract processing at Nashik Agro Processing Cluster (yield: 28% puree, 1,120 kg paste).
            </p>
            
            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Puree Wholesale:</span>
                <span className="font-mono text-slate-100">₹95.00 / kg</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Gross Output Revenue:</span>
                <span className="font-mono text-emerald-300">₹{(lotQty * 0.28 * 95).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Processing & Packing:</span>
                <span className="font-mono text-red-400">-₹{(lotQty * 5.8).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-800">
                <span>Estimated Net Profit:</span>
                <span className="font-mono text-emerald-400 text-sm">
                  ₹{(lotQty * 0.28 * 95 - lotQty * 5.8).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Feasibility Check Details */}
      <div className="rounded-xl glass-panel p-5 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Feasibility Enforcement Gate</span>
        </h3>
        <p className="text-xs text-slate-400">
          In Phase 2, an option cannot be marked "Feasible" without satisfying the following:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Processor Capacity</span>
              <span className="text-slate-400">Slot confirmed with cluster hub before deadline.</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Transport Availability</span>
              <span className="text-slate-400">Refrigerated / covered truck booked within 24h.</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Working Capital</span>
              <span className="text-slate-400">Upfront processing cost within farmer credit threshold.</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
