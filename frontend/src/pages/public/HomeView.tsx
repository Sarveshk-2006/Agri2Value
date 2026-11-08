// frontend/src/pages/public/HomeView.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  Layers,
  ShieldCheck,
  Flame,
  Truck,
  CheckCircle2,
  ChevronRight,
  Compass,
  ChevronDown,
  PlayCircle,
  MapPin,
  Wheat,
  Cpu,
  ShoppingBag,
  CloudSun,
  Sprout,
  Users,
  Building2,
  Warehouse,
  Boxes
} from 'lucide-react';
import tractorsImg from '../../assets/TRACTORS.jpg';

// Specialized Motion & Interactive Components
import { ScrollProgressBar } from '../../components/public/motion/ScrollProgressBar';
import { SmoothScrollProvider } from '../../components/public/motion/SmoothScrollProvider';
import { AnimatedCounter } from '../../components/public/motion/AnimatedCounter';
import { InteractiveProfitEngineStory } from '../../components/public/motion/InteractiveProfitEngineStory';
import { InteractiveCropRescueStory } from '../../components/public/motion/InteractiveCropRescueStory';
import { InteractiveProtectionStory } from '../../components/public/motion/InteractiveProtectionStory';
import { Interactive3DFarmSection } from '../../components/public/motion/Interactive3DFarmSection';

export const HomeView: React.FC = () => {
  const { t } = useTranslation();

  // Interactive Tab State: '3D_FARM' | 'PROFIT' | 'RESCUE' | 'PROTECTION'
  const [activeStudioTab, setActiveStudioTab] = useState<'3D_FARM' | 'PROFIT' | 'RESCUE' | 'PROTECTION'>('3D_FARM');
  // Walkthrough Stage: 1 to 5
  const [activeStage, setActiveStage] = useState<number>(1);
  // Ecosystem Hover Node
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // ─── 8 ENTERPRISE AGRI-SERVICE MODULES (CLEAN MINIMAL TAGLINES) ───
  const AGRI_MODULES = [
    {
      id: 'farms',
      title: 'Farms & Land Holdings',
      desc: 'GPS cadastral mapping, 3D boundary parcels, and on-farm storage asset tracking.',
      icon: MapPin,
      tag: '3D Digital Twin',
      path: '/app/farms',
    },
    {
      id: 'harvest',
      title: 'Harvest Produce Lots',
      desc: 'Standardized weights, Brix sugar scoring, and Grade A/B/C classification.',
      icon: Wheat,
      tag: 'Quality Grading',
      path: '/app/lots',
    },
    {
      id: 'profit',
      title: 'Profit Decision Engine',
      desc: '4-way deterministic algebra comparing gross off-take, freight, and net payouts.',
      icon: Cpu,
      tag: 'Deterministic Math',
      path: '/app/decision',
    },
    {
      id: 'buyers',
      title: 'Buyer Network',
      desc: 'Pre-qualified procurement tenders with corporate processors and retail chains.',
      icon: ShoppingBag,
      tag: 'Verified Contracts',
      path: '/app/buyers',
    },
    {
      id: 'logistics',
      title: 'Logistics & Storage',
      desc: 'Refrigerated reefer fleets, cold room booking, and transparent mileage freight.',
      icon: Truck,
      tag: 'Cold Chain',
      path: '/app/infra',
    },
    {
      id: 'market',
      title: 'Market & Weather Intel',
      desc: 'Real-time APMC Mandi rates and hyper-local agronomic weather forecasts.',
      icon: CloudSun,
      tag: 'Live Mandi Feeds',
      path: '/app/market',
    },
    {
      id: 'protection',
      title: 'Farmer Protection & Trust',
      desc: 'Tripartite legal contracts, digital weighbridge receipts, and escrow payout safety.',
      icon: ShieldCheck,
      tag: 'Escrow Security',
      path: '/app/protection',
    },
    {
      id: 'rescue',
      title: 'Crop Rescue Mode',
      desc: '24-hour distress triage algorithm routing perishable crops before weather loss.',
      icon: Flame,
      tag: 'Emergency Triage',
      path: '/app/rescue',
    },
  ];

  // ─── 5-STAGE WORKFLOW (STRUCTURED MINIMAL DATA) ───
  const WORKFLOW_STAGES = [
    {
      stage: 1,
      name: 'Farm Registration',
      subtitle: 'Land & Resources',
      badge: 'Step 01',
      desc: 'Onboard agricultural parcels with verified GPS coordinates, on-farm shaded storage, and equipment inventory.',
      result: 'Patil Krishi Farm • 3.50 Acres Registered • Niphad, Nashik',
      metrics: [
        { label: 'GPS Geolocation', val: '20.08°N, 74.04°E' },
        { label: 'Storage Shed', val: '2 MT Capacity' },
        { label: 'Harvest Crates', val: '80 Plastic Units' },
      ],
    },
    {
      stage: 2,
      name: 'Harvest Intake',
      subtitle: 'Grading & Volume',
      badge: 'Step 02',
      desc: 'Produce weight, moisture, and quality parameters are recorded before dispatch to establish a benchmark.',
      result: '4,000 kg Tomato • Abhinav Grade A • Brix 5.2',
      metrics: [
        { label: 'Standard Base', val: '4,000 kg (4 MT)' },
        { label: 'Quality Class', val: 'Grade A (Table / Puree)' },
        { label: 'Dispute Safety', val: 'Pre-Dispatch Benchmark' },
      ],
    },
    {
      stage: 3,
      name: 'Profit Engine',
      subtitle: 'Deterministic Math',
      badge: 'Step 03',
      desc: 'Evaluates Corporate Off-Take, Mandi Auction, Cold Chain, and Processing with transparent cost deductions.',
      result: 'Sahyadri Agro Processing Wins • ₹23.80/kg Net • +77% Uplift',
      metrics: [
        { label: 'Gross Revenue', val: '₹1,12,000' },
        { label: 'Transport Deduction', val: '-₹7,200 (42 km)' },
        { label: 'Net Farmer Gain', val: '+₹41,600 over Mandi' },
      ],
    },
    {
      stage: 4,
      name: 'Buyer & Logistics',
      subtitle: 'Dispatch & Contract',
      badge: 'Step 04',
      desc: '1-click contract locks agreed terms with verified buyers and dispatches dedicated transport vehicles.',
      result: 'Agreement Locked • Tempo 3T (MH-15) Dispatched',
      metrics: [
        { label: 'Guaranteed Floor', val: '₹18.00–₹24.50/kg' },
        { label: 'Assigned Vehicle', val: 'Tempo 3T Reefer' },
        { label: 'Transit SLA', val: '42 km Direct Delivery' },
      ],
    },
    {
      stage: 5,
      name: 'Escrow Settlement',
      subtitle: 'Weighbridge & Payout',
      badge: 'Step 05',
      desc: 'Digital scale weighbridge tare confirmation triggers automated escrow release to the farmer bank account.',
      result: 'Delivered 4,000 kg • Zero Rejection • Tranche Disbursed',
      metrics: [
        { label: 'Disbursed Net', val: '₹89,840.00 Settled' },
        { label: 'Payment Terms', val: 'Statutory T+3 Days' },
        { label: 'Dispute Safety', val: '1-Click Escrow Lock' },
      ],
    },
  ];

  return (
    <SmoothScrollProvider>
      {/* Precision Scroll Progress Indicator */}
      <ScrollProgressBar />

      <div className="overflow-x-hidden font-sans space-y-20 pb-20 text-slate-900 bg-slate-50 selection:bg-emerald-600 selection:text-white">

        {/* ──────────────────────────────────────────────────────────
            SECTION 1 — HERO SECTION (EXACT EARLIER VERSION MATCHING SCREENSHOT)
            ────────────────────────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-24 pb-20">
          {/* Background Image with Parallax Vibe */}
          <img
            src={tractorsImg}
            alt="Modern Agricultural Farm and Tractors"
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          />

          {/* Sophisticated Dark Overlays for Extreme Contrast & Professionalism */}
          <div className="absolute inset-0 bg-slate-950/75" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/80 to-slate-950/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />

          {/* Subtle Ambient Emerald Lighting */}
          <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/15 blur-[130px] rounded-full pointer-events-none" />

          {/* Main Content Container (2-Column Desktop Grid) */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              {/* Left Column: Headline, Typography, CTAs & Value Props (7 Cols) */}
              <div className="lg:col-span-7 space-y-7 text-left">
                
                {/* Product Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide backdrop-blur-md shadow-xs animate-in fade-in duration-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>{t('landing.heroBadge', 'Next-Generation AgriTech Platform')}</span>
                  <span className="text-emerald-400/60">•</span>
                  <span className="text-emerald-200 font-medium font-sans">कृषि-मूल्य • Farm-to-Profit Intelligence</span>
                </div>

                {/* Display Headline */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.10] font-display tracking-tight drop-shadow-lg">
                  <span>{t('landing.heroHeadline1', 'AGRICULTURE. CONNECTED.')}</span>{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 block sm:inline">
                    {t('landing.heroHeadline2', 'INTELLIGENT. PROFITABLE.')}
                  </span>
                </h1>

                {/* Subheading */}
                <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed font-normal max-w-2xl drop-shadow">
                  {t(
                    'landing.heroSubtitle',
                    'One intelligent platform connecting farm management, profit decisions, market opportunities, logistics, and farmer protection.'
                  )}
                </p>

                {/* Two Clear Primary CTAs */}
                <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                  <a
                    href="#modules"
                    className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
                  >
                    <Compass className="w-4 h-4 text-emerald-600" />
                    <span>{t('landing.explorePlatform', 'Explore Agri2Value')}</span>
                  </a>

                  <Link
                    to="/app/dashboard"
                    className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
                  >
                    <span>{t('landing.openConsole', 'Open Farmer Console')}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Link>

                  <Link
                    to="/login"
                    className="px-5 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl backdrop-blur-xs transition-all flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4 text-emerald-300" />
                    <span>{t('landing.signInDemo', 'Sign In / Demo Access')}</span>
                  </Link>
                </div>

                {/* Trust Value Props Strip */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>4 Selling Pathways</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Deterministic Math</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Live Agmarknet Mandi Feeds</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zero Middleman Loss</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Enterprise SaaS Product Cockpit Preview (5 Cols) */}
              <div className="lg:col-span-5 relative">
                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-4 text-white text-xs">
                  
                  {/* Cockpit Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <div className="font-bold text-slate-100 text-xs">Patil Krishi Farm • Niphad, Nashik</div>
                        <div className="text-[10px] text-emerald-400">APMC Mandi &amp; Open-Meteo Synced</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Live Engine
                    </span>
                  </div>

                  {/* Active Produce Lot */}
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300">Tomato (Abhinav Hybrid Red)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        Grade A • Brix 5.2
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                      <span>Batch Volume: 4,000 kg (4 MT)</span>
                      <span>Fair Average Quality</span>
                    </div>
                  </div>

                  {/* Decision Winner Recommendation */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-600/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        ★ TOP RECOMMENDED PATHWAY
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
                        +77% UPLIFT
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-white">Sahyadri Agro Processing</div>
                        <div className="text-[10px] text-slate-400">Mega Food Park, Mohadi • 42 km</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black font-mono text-emerald-400">₹23.80 / kg</div>
                        <div className="text-[10px] text-slate-400">Net: ₹95,200.00</div>
                      </div>
                    </div>

                    {/* Math Breakdown Ribbon */}
                    <div className="pt-2 border-t border-emerald-800/40 grid grid-cols-3 gap-2 text-[10px] text-slate-300">
                      <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Gross Revenue</span>
                        <span className="font-mono font-bold text-white">₹1,12,000</span>
                      </div>
                      <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Logistics Tariff</span>
                        <span className="font-mono font-bold text-rose-400">-₹7,200</span>
                      </div>
                      <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Extra Realization</span>
                        <span className="font-mono font-bold text-emerald-400">+₹41,600</span>
                      </div>
                    </div>
                  </div>

                  {/* Micro Telematics Status Bar */}
                  <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Reefer Fleet MH-15-EG-4412 Reserved</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>SHA-256 Agreement Locked</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* Bottom Scroll Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs flex flex-col items-center gap-1 pointer-events-none">
            <span className="tracking-widest uppercase text-[9px] font-bold">Explore Platform</span>
            <ChevronDown className="w-4 h-4 text-emerald-400 animate-bounce" />
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 2 — COMPACT PRODUCT IMPACT STRIP (4 METRICS)
            ────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Metric 1 */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Selling Pathways</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display mt-2">
                <AnimatedCounter value={4} suffix=" Options" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Corporate, Mandi, Cold Storage &amp; Processing.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Realization</span>
                <Sparkles className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-display mt-2">
                +35% to <AnimatedCounter value={77} prefix="+" suffix="%" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Verified uplift over distress spot auction rate.
              </p>
            </div>

            {/* Metric 3 */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Execution Pipeline</span>
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display mt-2">
                <AnimatedCounter value={5} suffix=" Stages" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                From 3D farm profile to bank settlement.
              </p>
            </div>

            {/* Metric 4 */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Emergency Rescue</span>
                <Flame className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-700 font-display mt-2">
                &lt;<AnimatedCounter value={24} suffix="h Triage" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Automated weather alerts &amp; salvage routing.
              </p>
            </div>

          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 3 — CORE PRODUCT MODULES (MINIMAL, UNCLUTTERED GRID)
            ────────────────────────────────────────────────────────── */}
        <section id="modules" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24">
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800">
              Core Platform Suite
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              8 Integrated AgriTech Services
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Select any service to access specialized decision tools and execution workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {AGRI_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.id}
                  to={mod.path}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 border border-slate-200 group-hover:border-emerald-200 transition-colors">
                        {mod.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-emerald-800 transition-colors font-display">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-2">
                        {mod.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 4 — UNIFIED INTERACTIVE STUDIO (CLEAN TABBED CENTER)
            ────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800">
                Live Interactive Studio
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Test Decision &amp; Execution Engines
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Explore simulated telemetry, mathematical calculators, and rescue routing in real time.
              </p>
            </div>

            {/* Clean Segmented Tab Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl border border-slate-300/60 text-xs font-bold self-start md:self-auto">
              {[
                { key: '3D_FARM', label: '3D Farm Twin', icon: MapPin },
                { key: 'PROFIT', label: 'Profit Simulator', icon: TrendingUp },
                { key: 'RESCUE', label: 'Rescue Triage', icon: Flame },
                { key: 'PROTECTION', label: 'Deal Protection', icon: ShieldCheck },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeStudioTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveStudioTab(tab.key as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unified Studio Container */}
          <div className="transition-all duration-300">
            {activeStudioTab === '3D_FARM' && <Interactive3DFarmSection />}
            {activeStudioTab === 'PROFIT' && <InteractiveProfitEngineStory />}
            {activeStudioTab === 'RESCUE' && <InteractiveCropRescueStory />}
            {activeStudioTab === 'PROTECTION' && <InteractiveProtectionStory />}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 5 — 5-STAGE WORKFLOW (STRUCTURED MINIMAL PIPELINE)
            ────────────────────────────────────────────────────────── */}
        <section id="walkthrough" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24">
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-800">
              End-to-End Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              From Farm Parcel to Bank Settlement
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Click through the 5 operating stages to see how verified data drives transparent execution.
            </p>
          </div>

          {/* 5 Compact Stepper Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {WORKFLOW_STAGES.map((stg) => {
              const isActive = activeStage === stg.stage;
              return (
                <button
                  key={stg.stage}
                  onClick={() => setActiveStage(stg.stage)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                    isActive
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-md ring-2 ring-emerald-600/30'
                      : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      0{stg.stage}
                    </span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                  <div>
                    <div className={`font-bold text-xs ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {stg.name}
                    </div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {stg.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stage Result Display Card */}
          {(() => {
            const stg = WORKFLOW_STAGES.find((s) => s.stage === activeStage) || WORKFLOW_STAGES[0];
            return (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span>{stg.badge}</span>
                      <span>•</span>
                      <span>{stg.name}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                      {stg.result}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {stg.desc}
                    </p>
                  </div>

                  {/* Concise 3-Metric Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 lg:w-[480px]">
                    {stg.metrics.map((m, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-semibold text-slate-400 block truncate">{m.label}</span>
                        <span className="text-xs font-bold font-mono text-slate-900 mt-0.5 block truncate">{m.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Step {stg.stage} of 5 in Agri2Value Lifecycle</span>
                  <Link
                    to="/app/dashboard"
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                  >
                    <span>Open Console Workflow</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })()}
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 6 — COMPACT AGRICULTURAL ECOSYSTEM STRIP
            ────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <span className="text-[11px] font-bold tracking-wider uppercase text-purple-800">
              Connected Network
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Integrated Value Chain Stakeholders
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Bridging farm gate supply directly with processors, buyers, and cold logistics.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { title: 'Farmers', sub: 'Producers', icon: Sprout, benefit: 'Guaranteed Payout' },
              { title: 'FPOs', sub: 'Aggregators', icon: Users, benefit: 'Bulk Tenders' },
              { title: 'Corporate Buyers', sub: 'Retailers', icon: Building2, benefit: 'Grade A Supply' },
              { title: 'Logistics Fleets', sub: 'Reefers', icon: Truck, benefit: 'Backhaul Loads' },
              { title: 'Cold Hubs', sub: 'Pre-Cooling', icon: Warehouse, benefit: 'Monitored Temp' },
              { title: 'Processors', sub: 'Puree Plants', icon: Boxes, benefit: 'Zero Dump Waste' },
            ].map((node, idx) => {
              const Icon = node.icon;
              const isHovered = hoveredNode === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredNode(idx)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`p-3.5 rounded-2xl border transition-all text-center flex flex-col justify-between space-y-2 cursor-pointer ${
                    isHovered
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-md -translate-y-1'
                      : 'bg-white text-slate-800 border-slate-200/80 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center ${
                      isHovered ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">{node.title}</h4>
                      <span className={`text-[10px] block ${isHovered ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {node.sub}
                      </span>
                    </div>
                  </div>
                  <div className={`pt-1.5 border-t text-[10px] font-semibold ${
                    isHovered ? 'border-white/20 text-emerald-200' : 'border-slate-100 text-emerald-700'
                  }`}>
                    {node.benefit}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 7 — FINAL CLEAN CONVERSION CTA BANNER
            ────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-emerald-950 via-[#0a3528] to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-emerald-800/40 text-center space-y-5">
            <div className="relative z-10 max-w-2xl mx-auto space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>AGRICULTURAL INTELLIGENCE 2026</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white font-display tracking-tight">
                {t('landing.finalCtaTitle', 'Your Farm Deserves Smarter Decisions.')}
              </h2>

              <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-normal">
                {t(
                  'landing.finalCtaSubtitle',
                  'Join forward-looking farmers, FPOs, and agribusinesses securing transparent digital contracts, deterministic profit optimization, and guaranteed market connections.'
                )}
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-3">
                <Link
                  to="/app/dashboard"
                  className="w-full sm:w-auto px-7 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>Launch Farmer Console</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 border border-white/30 text-white font-bold text-sm rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>Sign In with Demo OTP</span>
                </Link>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-y-1.5 gap-x-5 text-[11px] text-emerald-200/80">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deterministic Engine</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero Middleman Loss</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Escrow Safe Payouts</span>
                </span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </SmoothScrollProvider>
  );
};
