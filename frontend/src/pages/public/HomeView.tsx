// frontend/src/pages/public/HomeView.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Flame,
  ArrowRight,
  Layers,
  Sparkles,
  PlayCircle,
  ShieldCheck,
  Activity,
  ChevronDown
} from 'lucide-react';
import tractorsImg from '../../assets/TRACTORS.jpg';

export const HomeView: React.FC = () => {
  const [activeScenarioRoute, setActiveScenarioRoute] = useState<'BUYER' | 'MANDI' | 'STORAGE' | 'PROCESSING'>('BUYER');

  // Category browse items matching JSPM Narhe Winners visual style
  const CATEGORIES = [
    { label: 'Crop Lots', emoji: '🌾', path: '/app/lots', desc: 'Digital Twin & Harvests' },
    { label: 'Mandi Rates', emoji: '⚖️', path: '/app/market', desc: 'APMC Daily Yard Feeds' },
    { label: 'Profit Engine', emoji: '📊', path: '/app/decision', desc: '4-Way Route Comparison' },
    { label: 'Logistics Fleet', emoji: '🚚', path: '/app/infra', desc: 'Reefer & Dry Trucks' },
    { label: 'Cold Storage', emoji: '❄️', path: '/app/infra', desc: 'Holding Facilities' },
    { label: 'Processing', emoji: '🏭', path: '/app/infra', desc: 'Agro-Processing Units' },
    { label: 'Farmer Trust', emoji: '🛡️', path: '/app/protection', desc: 'Deals & Digital Escrow' },
    { label: 'Crop Rescue', emoji: '🌱', path: '/app/rescue', desc: 'Emergency Salvage AI' },
  ];

  // Feature cards matching JSPM Narhe Winners with vibrant gradients
  const FEATURES = [
    {
      icon: <TrendingUp className="w-7 h-7 text-white" />,
      title: 'AI Profit Decision Engine',
      desc: 'Compares corporate buyers, mandis, cold chain, and processing with strict net proceeds calculation.',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      icon: <Activity className="w-7 h-7 text-white" />,
      title: 'Virtual IoT & Telematics',
      desc: 'Continuous cold storage and reefer van sensor monitoring with automated spoilage alerts.',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: <ShieldCheck className="w-7 h-7 text-white" />,
      title: 'Farmer Protection & Trust',
      desc: 'Immutable digital deal records, weighbridge verification slips, and evidence-backed dispute filing.',
      gradient: 'from-purple-500 to-violet-600',
    },
    {
      icon: <Flame className="w-7 h-7 text-white" />,
      title: 'Crop Rescue Salvage',
      desc: 'Automated weather spike alerts and distress detection routing crops to buyers within 24 hours.',
      gradient: 'from-orange-500 to-amber-600',
    },
  ];

  return (
    <div className="overflow-x-hidden font-sans space-y-20 pb-20">
      
      {/* ─── 1. HERO SECTION (WITH TRACTORS.JPG BACKGROUND MATCHING JSPM WINNERS) ─── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <img
          src={tractorsImg}
          alt="Modern Agricultural Farm and Tractors"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 animate-softPulse"
        />

        {/* Strong dark overlays for maximum typography legibility */}
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/80" />

        {/* Ambient emerald radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[350px] bg-emerald-500/20 blur-[130px] rounded-full pointer-events-none" />

        {/* ── Centered Hero Content ── */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 text-center py-28 space-y-7">

          {/* Glowing Animated Top Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-5 py-2 rounded-full text-xs sm:text-sm font-bold shadow-green backdrop-blur-md animate-fadeUp">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>India&apos;s Unified Agri-Service Platform 🌾</span>
            <span className="hidden sm:inline text-emerald-400/60">•</span>
            <span className="hidden sm:inline text-emerald-200">Indradhanu 2026</span>
          </div>

          {/* Main Display Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.08] font-display drop-shadow-2xl tracking-tight">
            The Centralized Service{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200">
              Platform for Farmers
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl md:text-2xl text-slate-200 leading-relaxed max-w-3xl mx-auto drop-shadow font-normal">
            Beyond rentals. Your all-in-one ecosystem for AI profit optimization, cold chain logistics, mandi intelligence, digital agreements, and sovereign crop rescue.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            <Link
              to="/app/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-lg rounded-2xl shadow-green-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <span>Launch Decision Platform 🌾</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/40 text-white font-bold text-lg rounded-2xl hover:bg-white/20 hover:border-white/70 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5 text-emerald-300" />
              <span>Sign In / Demo Access →</span>
            </Link>
          </div>

          {/* Trust Stats Pills */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            {[
              { emoji: '🌾', text: '18,000+ Farmers Benefited' },
              { emoji: '🚜', text: '2,400+ Logistics & Facilities' },
              { emoji: '⭐', text: '4.8 / 5 Rating' },
              { emoji: '📍', text: '320+ Villages Covered' },
              { emoji: '🛡️', text: '100% Deterministic Engine' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full shadow-xs"
              >
                <span>{item.emoji}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-xs flex flex-col items-center gap-1 animate-bounce pointer-events-none">
          <span className="tracking-widest uppercase text-[10px] font-bold">Scroll</span>
          <ChevronDown className="w-4 h-4 text-emerald-400" />
        </div>

      </section>

      {/* ─── 2. FLOATING STATS CARDS (OVERLAPPING HERO -MT-14) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-white rounded-2xl p-6 text-center shadow-xl border border-slate-100 hover:-translate-y-1 transition-all duration-200">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">4</div>
            <div className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mt-1">Selling Pathways</div>
            <div className="text-[11px] text-slate-500 mt-1">Corporate, Mandi, Cold, Processing</div>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-xl border border-slate-100 hover:-translate-y-1 transition-all duration-200">
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono">+35%</div>
            <div className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mt-1">Realization Uplift</div>
            <div className="text-[11px] text-slate-500 mt-1">Direct corporate buyer routing</div>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-xl border border-slate-100 hover:-translate-y-1 transition-all duration-200">
            <div className="text-3xl sm:text-4xl font-black text-blue-600 font-mono">5-Stage</div>
            <div className="text-xs font-extrabold text-blue-700 uppercase tracking-wider mt-1">Operating Model</div>
            <div className="text-[11px] text-slate-500 mt-1">Understand to Settlement</div>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-xl border border-slate-100 hover:-translate-y-1 transition-all duration-200">
            <div className="text-3xl sm:text-4xl font-black text-rose-600 font-mono">24h</div>
            <div className="text-xs font-extrabold text-rose-700 uppercase tracking-wider mt-1">Crop Rescue Action</div>
            <div className="text-[11px] text-slate-500 mt-1">Emergency salvage risk triggers</div>
          </div>

        </div>
      </section>

      {/* ─── 3. BROWSE BY CATEGORY & AGRI-SERVICE (MATCHING JSPM WINNERS) ─── */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-display">
              Browse by Agri-Service & Pathway 🌾
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              Discover connected digital twins, mandi advisory feeds, cold chain logistics, and guaranteed contracts.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={i}
                to={cat.path}
                className="group flex flex-col items-center text-center p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/50 hover:-translate-y-1 transition-all duration-200 shadow-2xs"
              >
                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                  {cat.emoji}
                </span>
                <span className="text-xs font-black text-slate-800 group-hover:text-emerald-700 leading-tight">
                  {cat.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 group-hover:text-emerald-600">
                  {cat.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. VIBRANT GRADIENT FEATURE CARDS (WHY FARMERS LOVE AGRI2VALUE) ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <span>RURAL RESILIENCE ENGINE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-display">
              Why Farmers & FPOs Trust Agri2Value
            </h2>
            <p className="text-slate-500 text-sm">
              Built for rural India: works reliably across fluctuating mandi rates, fragmented logistics, and adverse harvest weather.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-4"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center text-white shadow-lg`}>
                  {feat.icon}
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
                  {feat.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. INTERACTIVE DECISION SPOTLIGHT (FLAGSHIP DEMO) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card p-6 sm:p-10 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 border-slate-200 shadow-xl space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="space-y-1">
              <span className="badge-green">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INTERACTIVE DEMO • PILOT CROP SCENARIO</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                See How Ramesh Patil Gained ₹41,600 More
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                4,000 kg Grade A Hybrid Tomato lot in Niphad, Nashik. The deterministic engine calculates real gross revenues, itemized logistics, and net payout for all 4 available market pathways simultaneously.
              </p>
            </div>

            <Link
              to="/app/decision"
              className="btn-primary text-xs py-2.5 px-4 shadow-sm shrink-0"
            >
              <span>Explore Engine Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Interactive Route Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            <button
              onClick={() => setActiveScenarioRoute('BUYER')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                activeScenarioRoute === 'BUYER'
                  ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-slate-50/80 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">Corporate Buyer</span>
                <span className="badge-green text-[9px] py-0 px-1">WINNER</span>
              </div>
              <div className="text-xl font-black font-mono text-emerald-700">₹23.80 / kg</div>
              <div className="text-[11px] text-slate-500">Net payout: ₹95,200</div>
            </button>

            <button
              onClick={() => setActiveScenarioRoute('MANDI')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                activeScenarioRoute === 'MANDI'
                  ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-slate-50/80 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">APMC Mandi Yard</span>
                <span className="badge-yellow text-[9px] py-0 px-1">BASELINE</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900">₹13.40 / kg</div>
              <div className="text-[11px] text-slate-500">Net payout: ₹53,600</div>
            </button>

            <button
              onClick={() => setActiveScenarioRoute('STORAGE')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                activeScenarioRoute === 'STORAGE'
                  ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-slate-50/80 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">Cold Chain Holding</span>
                <span className="badge-blue text-[9px] py-0 px-1">30-DAY BUFFER</span>
              </div>
              <div className="text-xl font-black font-mono text-blue-800">₹17.20 / kg</div>
              <div className="text-[11px] text-slate-500">Net payout: ₹68,800</div>
            </button>

            <button
              onClick={() => setActiveScenarioRoute('PROCESSING')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                activeScenarioRoute === 'PROCESSING'
                  ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-slate-50/80 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">Agro-Processing</span>
                <span className="badge-purple text-[9px] py-0 px-1">PUREE / PASTE</span>
              </div>
              <div className="text-xl font-black font-mono text-purple-800">₹14.50 / kg</div>
              <div className="text-[11px] text-slate-500">Net payout: ₹58,000</div>
            </button>

          </div>

          {/* Active Detail Breakdown Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
            {activeScenarioRoute === 'BUYER' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Recommendation: Direct Corporate Procurement (Reliance Retail Desk)
                    </h3>
                    <p className="text-xs text-slate-500">
                      High-grade horticultural demand directly matches Ramesh Patil&apos;s Grade A crop lot.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total Net Farmer Realization</span>
                    <div className="text-2xl font-black font-mono text-emerald-700">₹95,200.00</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Gross Procurement Rate</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">₹28.00 / kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Packaging & Grate Surcharge</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">- ₹1.80 / kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Transport Logistics Tariff (45 km)</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">- ₹2.40 / kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-emerald-800 font-bold">Extra Profit vs Mandi</div>
                    <div className="font-black text-emerald-700 font-mono text-sm">+ ₹41,600.00 (+77%)</div>
                  </div>
                </div>
              </div>
            )}

            {activeScenarioRoute === 'MANDI' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      APMC Mandi Auction Yard: Pimpalgaon Baswant
                    </h3>
                    <p className="text-xs text-slate-500">
                      Subject to yard arrival volume, cess deductions, and middleman commission.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total Net Realization</span>
                    <div className="text-2xl font-black font-mono text-slate-900">₹53,600.00</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Auction Modal Rate</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">₹16.00 / kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Hamali & Weighment</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">- ₹0.80 / kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Local Transport to Yard</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">- ₹1.80 / kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-amber-800 font-bold">Vulnerability Risk</div>
                    <div className="font-bold text-amber-700 text-xs">Yard gluts cause price crashes</div>
                  </div>
                </div>
              </div>
            )}

            {activeScenarioRoute === 'STORAGE' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Cold Chain Storage Holding: Niphad Agro Cold Storage
                    </h3>
                    <p className="text-xs text-slate-500">
                      Store harvest for up to 30 days to capitalize on forecasted market rate recovery.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Estimated Net Payout</span>
                    <div className="text-2xl font-black font-mono text-blue-800">₹68,800.00</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Target Off-Season Rate</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">₹24.00 / kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Monthly Storage Fee</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">- ₹2.20 / kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Reefer Van Transport</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">- ₹2.60 / kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="text-blue-800 font-bold">Storage Advantage</div>
                    <div className="font-bold text-blue-700 text-xs">+ ₹15,200 vs immediate mandi sale</div>
                  </div>
                </div>
              </div>
            )}

            {activeScenarioRoute === 'PROCESSING' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Agro-Processing Conversion: Sahyadri Farmer Producer Co.
                    </h3>
                    <p className="text-xs text-slate-500">
                      Converts surplus or B-grade tomatoes into high-value puree and paste concentrate.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Estimated Realization</span>
                    <div className="text-2xl font-black font-mono text-purple-800">₹58,000.00</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Concentrate Base Price</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">₹18.00 / kg raw</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Processing Line Fee</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">- ₹1.70 / kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-slate-400">Logistics to Plant</div>
                    <div className="font-bold text-slate-900 font-mono text-sm">- ₹1.80 / kg</div>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                    <div className="text-purple-800 font-bold">Waste Elimination</div>
                    <div className="font-bold text-purple-700 text-xs">Zero field dump loss</div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ─── 6. THE 5-STAGE OPERATING MODEL ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <span className="badge-blue">
            <Layers className="w-3.5 h-3.5" />
            <span>ARCHITECTURE</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
            The Agri2Value 5-Stage Operating Model
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A cohesive pipeline connecting farm registration to final verified financial settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Stage 1 */}
          <div className="card p-5 space-y-3 border-t-4 border-t-emerald-600 hover:border-emerald-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-mono font-bold flex items-center justify-center">
              01
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">UNDERSTAND</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create the farm digital twin: acreage, GPS coordinates, irrigation resources, and harvest lot grading.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="card p-5 space-y-3 border-t-4 border-t-teal-600 hover:border-teal-300">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 font-mono font-bold flex items-center justify-center">
              02
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">DECIDE</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Run deterministic math comparing Corporate Buyers, Mandi auctions, Cold Storage, and Agro-Processing.
            </p>
          </div>

          {/* Stage 3 */}
          <div className="card p-5 space-y-3 border-t-4 border-t-blue-600 hover:border-blue-300">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-mono font-bold flex items-center justify-center">
              03
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">EXECUTE</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              1-click dispatch to verified buyers, refrigerated transport fleet, or cold rooms without intermediaries.
            </p>
          </div>

          {/* Stage 4 */}
          <div className="card p-5 space-y-3 border-t-4 border-t-rose-600 hover:border-rose-300">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 font-mono font-bold flex items-center justify-center">
              04
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">PROTECT</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Crop Rescue Mode monitors weather spikes and price gluts, initiating emergency salvage before spoilage.
            </p>
          </div>

          {/* Stage 5 */}
          <div className="card p-5 space-y-3 border-t-4 border-t-purple-600 hover:border-purple-300">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-mono font-bold flex items-center justify-center">
              05
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">VERIFY</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Audit timeline and financial reconciliation comparing estimated profit against realized bank payouts.
            </p>
          </div>

        </div>

      </section>

      {/* ─── 7. FINAL HIGH-IMPACT CTA BANNER (MATCHING JSPM WINNERS) ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-800 via-emerald-800 to-teal-900 text-white shadow-2xl relative overflow-hidden rounded-3xl max-w-7xl mx-auto">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold">
            <span>START SHARING & MAXIMIZING VALUE</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white font-display leading-tight">
            Start maximizing your harvest profit today 🌾
          </h2>

          <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Join 18,000+ Indian farmers securing transparent digital deals, zero-middleman pricing, and higher crop realizations.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link
              to="/app/dashboard"
              className="bg-white text-emerald-950 hover:bg-emerald-50 px-8 py-4 rounded-2xl font-black text-base shadow-2xl hover:-translate-y-1 transition-all"
            >
              Launch Decision Platform →
            </Link>
            <Link
              to="/login"
              className="border-2 border-white/40 text-white hover:bg-white/10 px-8 py-4 rounded-2xl font-bold text-base hover:-translate-y-1 transition-all backdrop-blur-sm"
            >
              Sign In with Demo OTP
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
