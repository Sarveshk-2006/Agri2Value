// frontend/src/components/public/motion/InteractiveProfitEngineStory.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Building2,
  Warehouse,
  Truck,
  Scale,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CropConfig {
  name: string;
  variety: string;
  mandiRatePerKg: number;
  corpRatePerKg: number;
  coldProjectedRatePerKg: number;
  coldHoldingDays: number;
  coldDailyRatePerKg: number;
  spoilagePct: number;
  freightPerKg: number;
  cessPct: number;
  platformFeePct: number;
}

const CROPS: Record<string, CropConfig> = {
  tomato: {
    name: 'Tomato',
    variety: 'Abhinav Grade A',
    mandiRatePerKg: 14.20,
    corpRatePerKg: 24.50,
    coldProjectedRatePerKg: 28.00,
    coldHoldingDays: 21,
    coldDailyRatePerKg: 0.035,
    spoilagePct: 3.5,
    freightPerKg: 1.20,
    cessPct: 1.5,
    platformFeePct: 2.0,
  },
  onion: {
    name: 'Onion',
    variety: 'Garwa Summer Crop',
    mandiRatePerKg: 18.50,
    corpRatePerKg: 29.00,
    coldProjectedRatePerKg: 35.00,
    coldHoldingDays: 45,
    coldDailyRatePerKg: 0.025,
    spoilagePct: 2.0,
    freightPerKg: 0.90,
    cessPct: 1.5,
    platformFeePct: 2.0,
  },
  grapes: {
    name: 'Table Grapes',
    variety: 'Thompson Seedless',
    mandiRatePerKg: 42.00,
    corpRatePerKg: 78.00,
    coldProjectedRatePerKg: 95.00,
    coldHoldingDays: 30,
    coldDailyRatePerKg: 0.050,
    spoilagePct: 2.5,
    freightPerKg: 2.10,
    cessPct: 1.5,
    platformFeePct: 2.5,
  },
};

export const InteractiveProfitEngineStory: React.FC = () => {
  const [selectedCropKey, setSelectedCropKey] = useState<string>('tomato');
  const [volumeKg, setVolumeKg] = useState<number>(4000);
  const [activeTab, setActiveTab] = useState<'comparison' | 'waterfall'>('comparison');

  const crop = CROPS[selectedCropKey];

  // Route 1: Local APMC Mandi
  const mandiGross = volumeKg * crop.mandiRatePerKg;
  const mandiCess = (mandiGross * crop.cessPct) / 100;
  const mandiHandling = volumeKg * 0.35;
  const mandiFreight = volumeKg * 0.60;
  const mandiTotalDeductions = mandiCess + mandiHandling + mandiFreight;
  const mandiNet = mandiGross - mandiTotalDeductions;

  // Route 2: Direct Institutional Retail (Recommended)
  const corpGross = volumeKg * crop.corpRatePerKg;
  const corpFee = (corpGross * crop.platformFeePct) / 100;
  const corpFreight = volumeKg * crop.freightPerKg;
  const corpCrates = volumeKg * 0.25;
  const corpTotalDeductions = corpFee + corpFreight + corpCrates;
  const corpNet = corpGross - corpTotalDeductions;

  // Route 3: Cold Storage Holding Arbitrage
  const coldGross = volumeKg * crop.coldProjectedRatePerKg;
  const coldStorageFee = volumeKg * (crop.coldDailyRatePerKg * crop.coldHoldingDays);
  const coldSpoilageLoss = (coldGross * crop.spoilagePct) / 100;
  const coldFreight = volumeKg * crop.freightPerKg;
  const coldTotalDeductions = coldStorageFee + coldSpoilageLoss + coldFreight;
  const coldNet = coldGross - coldTotalDeductions;

  // Realized advantage of Recommended over Mandi
  const netAdvantage = corpNet - mandiNet;
  const percentageGain = ((netAdvantage / mandiNet) * 100).toFixed(1);

  // Maximum net value for normalization
  const maxNet = Math.max(mandiNet, corpNet, coldNet);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* Header & Controls Bar */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-3">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Deterministic Net Payout Algebra</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Interactive Profit Engine Simulator
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl">
              Adjust volume and crop varieties to see real deterministic net payout comparisons across selling routes.
            </p>
          </div>

          {/* Realized Extra Net Payout Pill */}
          <motion.div
            key={netAdvantage}
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-green-600/20 border border-emerald-400/40 backdrop-blur-md self-start md:self-auto"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              Extra Realized Payout
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
              +₹{Math.round(netAdvantage).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-emerald-300 font-semibold mt-0.5 flex items-center gap-1">
              <span>+{percentageGain}% over distress mandi spot rate</span>
            </div>
          </motion.div>
        </div>

        {/* Interactive Sliders & Crop Selector */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Crop Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              Select Monitored Produce
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CROPS).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCropKey(key)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border ${
                    selectedCropKey === key
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-700/30'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  }`}
                >
                  <div className="truncate">{item.name}</div>
                  <div className="text-[10px] opacity-80 truncate">{item.variety}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Harvest Volume Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Harvest Volume
              </label>
              <span className="text-sm font-black font-mono text-emerald-300">
                {volumeKg.toLocaleString('en-IN')} kg ({(volumeKg / 1000).toFixed(1)} MT)
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={15000}
              step={500}
              value={volumeKg}
              onChange={(e) => setVolumeKg(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>1,000 kg</span>
              <span>5,000 kg</span>
              <span>10,000 kg</span>
              <span>15,000 kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Overview Comparison vs Detailed Deductions Waterfall */}
      <div className="px-6 sm:px-8 pt-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'comparison'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pathway Comparison Matrix
          </button>
          <button
            onClick={() => setActiveTab('waterfall')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'waterfall'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Itemized Deductions Waterfall
          </button>
        </div>

        <Link
          to="/app/decision"
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hidden sm:flex items-center gap-1 mb-3"
        >
          <span>Open Full Engine</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tab Content */}
      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'comparison' ? (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Route 2: Recommended Corporate / Institutional */}
              <div className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-500 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                  ★ Recommended Pathway
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900 font-display">
                          Direct Institutional Processing / Retail
                        </span>
                        <span className="badge-green text-[10px] font-mono">T+3 Escrow Guarantee</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Fixed commercial contract at ₹{crop.corpRatePerKg.toFixed(2)}/kg with pre-cooling freight allocation.
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Net Farmer Payout
                    </div>
                    <div className="text-2xl font-black text-emerald-800 font-mono">
                      ₹{Math.round(corpNet).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-bold font-mono">
                      ₹{(corpNet / volumeKg).toFixed(2)}/kg net
                    </div>
                  </div>
                </div>

                {/* Animated Visual Bar */}
                <div className="mt-4 pt-3 border-t border-emerald-200/60">
                  <div className="h-2.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(corpNet / maxNet) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-emerald-600 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                    <span>Gross: ₹{Math.round(corpGross).toLocaleString('en-IN')}</span>
                    <span className="text-rose-600 font-medium">
                      Deductions (Freight, Platform, Crates): -₹{Math.round(corpTotalDeductions).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Route 1: Local APMC Mandi */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900 font-display">
                          Local APMC Mandi (Pimpalgaon / Nashik Yard)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-100 text-amber-800 font-bold">
                          Spot Auction
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Prevailing modal spot rate ₹{crop.mandiRatePerKg.toFixed(2)}/kg subject to commission & unloading deductions.
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Net Farmer Payout
                    </div>
                    <div className="text-2xl font-black text-slate-700 font-mono">
                      ₹{Math.round(mandiNet).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium font-mono">
                      ₹{(mandiNet / volumeKg).toFixed(2)}/kg net
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(mandiNet / maxNet) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-slate-400 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                    <span>Gross: ₹{Math.round(mandiGross).toLocaleString('en-IN')}</span>
                    <span className="text-rose-600 font-medium">
                      Deductions (Mandi Cess, Handling, Freight): -₹{Math.round(mandiTotalDeductions).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Route 3: Cold Storage Holding */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <Warehouse className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900 font-display">
                          Cold Storage Holding Arbitrage ({crop.coldHoldingDays} Days Buffer)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-100 text-teal-800 font-bold">
                          Arbitrage Strategy
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Holds produce at Niphad Cold Hub until off-peak rate of ₹{crop.coldProjectedRatePerKg.toFixed(2)}/kg is realized.
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Net Farmer Payout
                    </div>
                    <div className="text-2xl font-black text-teal-800 font-mono">
                      ₹{Math.round(coldNet).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-teal-700 font-bold font-mono">
                      ₹{(coldNet / volumeKg).toFixed(2)}/kg net
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(coldNet / maxNet) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-teal-600 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                    <span>Projected Gross: ₹{Math.round(coldGross).toLocaleString('en-IN')}</span>
                    <span className="text-rose-600 font-medium">
                      Holding Tariff & Spoilage Buffer: -₹{Math.round(coldTotalDeductions).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="waterfall"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <strong>Zero Hallucinations Guarantee:</strong> Every rupee deduction is calculated strictly through deterministic mathematical models. No hidden commissions, subjective markups, or unverified fees.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* APMC Mandi Deductions */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <h4 className="font-extrabold text-sm text-slate-900 font-display mb-3 flex items-center justify-between">
                    <span>APMC Mandi Waterfall Breakdown</span>
                    <span className="font-mono text-xs text-slate-500">Rate: ₹{crop.mandiRatePerKg}/kg</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Gross Auction Value</span>
                      <span className="font-mono font-bold text-slate-900">₹{Math.round(mandiGross).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                      <span>Mandi Cess & Market Tax ({crop.cessPct}%)</span>
                      <span className="font-mono font-semibold">-₹{Math.round(mandiCess).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                      <span>Hamali / Unloading Handling</span>
                      <span className="font-mono font-semibold">-₹{Math.round(mandiHandling).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                      <span>Local Tractor Freight</span>
                      <span className="font-mono font-semibold">-₹{Math.round(mandiFreight).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-sm font-black text-slate-900">
                      <span>Final Mandi Realized Payout</span>
                      <span className="font-mono text-emerald-800">₹{Math.round(mandiNet).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Corporate Contract Deductions */}
                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-300">
                  <h4 className="font-extrabold text-sm text-emerald-950 font-display mb-3 flex items-center justify-between">
                    <span>Direct Institutional Waterfall Breakdown</span>
                    <span className="font-mono text-xs text-emerald-700">Contract: ₹{crop.corpRatePerKg}/kg</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-emerald-100">
                      <span className="text-slate-600">Gross Contract Valuation</span>
                      <span className="font-mono font-bold text-slate-900">₹{Math.round(corpGross).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-100 text-rose-600">
                      <span>Agri2Value Escrow Facilitation ({crop.platformFeePct}%)</span>
                      <span className="font-mono font-semibold">-₹{Math.round(corpFee).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-100 text-rose-600">
                      <span>Dedicated Insulated Freight (₹{crop.freightPerKg}/kg)</span>
                      <span className="font-mono font-semibold">-₹{Math.round(corpFreight).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-100 text-rose-600">
                      <span>Standard Crates Cleaning & Tracking</span>
                      <span className="font-mono font-semibold">-₹{Math.round(corpCrates).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-sm font-black text-emerald-950">
                      <span>Guaranteed Bank Settlement</span>
                      <span className="font-mono text-emerald-800">₹{Math.round(corpNet).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

