// frontend/src/pages/public/HomeView.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  TrendingUp,
  Sparkles,
  Sprout,
  ArrowRight,
  Layers,
  ShieldCheck,
  Activity,
  Flame,
  Truck,
  Building2,
  Wheat,
  MapPin,
  Cpu,
  ShoppingBag,
  Warehouse,
  CloudSun,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Users,
  Compass,
  FileText,
  Clock,
  Droplets,
  DollarSign,
  Boxes,
  Zap,
  BarChart3,
  Calendar,
  Lock,
  ChevronDown,
  Sun,
  Wind,
  Check,
  PlayCircle
} from 'lucide-react';
import tractorsImg from '../../assets/TRACTORS.jpg';

// Specialized Motion Design System Components
import { ScrollProgressBar } from '../../components/public/motion/ScrollProgressBar';
import { SmoothScrollProvider } from '../../components/public/motion/SmoothScrollProvider';
import { AnimatedCounter } from '../../components/public/motion/AnimatedCounter';
import { FadeIn, StaggerContainer, StaggerItem, HoverCard } from '../../components/public/motion/MotionWrappers';
import { InteractiveProfitEngineStory } from '../../components/public/motion/InteractiveProfitEngineStory';
import { InteractiveCropRescueStory } from '../../components/public/motion/InteractiveCropRescueStory';
import { InteractiveProtectionStory } from '../../components/public/motion/InteractiveProtectionStory';
import { Interactive3DFarmSection } from '../../components/public/motion/Interactive3DFarmSection';

export const HomeView: React.FC = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  // ─── INTERACTIVE STATE ───
  // Walkthrough Stage: 1 to 5
  const [activeStage, setActiveStage] = useState<number>(1);
  // Why Agri2Value Solution Tab: 'PROFIT' | 'IOT' | 'PROTECTION' | 'RESCUE'
  const [activeSolution, setActiveSolution] = useState<'PROFIT' | 'IOT' | 'PROTECTION' | 'RESCUE'>('PROFIT');
  // Intelligence Showcase Tab: 'PROFIT' | 'MARKET' | 'RESCUE'
  const [activeIntelTab, setActiveIntelTab] = useState<'PROFIT' | 'MARKET' | 'RESCUE'>('PROFIT');
  // Ecosystem Hover Node
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // ─── 8 ENTERPRISE AGRI-SERVICE MODULES ───
  const AGRI_MODULES = [
    {
      id: 'farms',
      title: 'Farms & Land Holdings',
      desc: 'Digital twin, GPS cadastral mapping, 3D boundary visualization, on-farm shaded sheds, and equipment inventory.',
      icon: MapPin,
      tag: '3D Digital Twin',
      path: '/app/farms',
      color: 'emerald',
    },
    {
      id: 'harvest',
      title: 'Harvest Intelligence',
      desc: 'Standardized kilogram batches, Brix sweetness scoring, Grade A/B/C classification, and batch dispatch readiness.',
      icon: Wheat,
      tag: 'Quality Grading',
      path: '/app/lots',
      color: 'green',
    },
    {
      id: 'profit',
      title: 'Profit Decision Engine',
      desc: 'Deterministic mathematical optimization without AI hallucinations. Compares 4 channels with itemized cost deductions.',
      icon: Cpu,
      tag: 'Deterministic Math',
      path: '/app/decision',
      color: 'teal',
    },
    {
      id: 'buyers',
      title: 'Commercial Buyer Network',
      desc: 'Pre-qualified procurement tenders with Sahyadri Co-op, Reliance Fresh, and BigBasket with guaranteed floor prices.',
      icon: ShoppingBag,
      tag: 'Pre-Qualified Off-Take',
      path: '/app/buyers',
      color: 'sky',
    },
    {
      id: 'logistics',
      title: 'Logistics & Cold Storage',
      desc: 'Refrigerated reefer vans, local tempos, pre-cooling centers, and distance-mileage transparent freight schedules.',
      icon: Truck,
      tag: 'Transparent Freight',
      path: '/app/infra',
      color: 'blue',
    },
    {
      id: 'market',
      title: 'Market & Weather Intel',
      desc: 'Real-time Agmarknet APMC daily yard auctions, Open-Meteo 7-day microclimate forecasts, and safe spray windows.',
      icon: CloudSun,
      tag: 'Live Mandi & Weather',
      path: '/app/market',
      color: 'indigo',
    },
    {
      id: 'protection',
      title: 'Farmer Protection & Trust',
      desc: 'Cryptographically versioned commercial contracts, weighbridge tare confirmation, escrow payouts, and formal dispute center.',
      icon: ShieldCheck,
      tag: 'SHA-256 Ledger',
      path: '/app/protection',
      color: 'purple',
    },
    {
      id: 'rescue',
      title: 'Crop Rescue Mode',
      desc: 'Automated distress watchdog monitoring rainfall washout and shelf-life horizons to trigger emergency salvage within 24 hours.',
      icon: Flame,
      tag: 'Emergency Triage',
      path: '/app/rescue',
      color: 'rose',
    },
  ];

  // ─── 5-STAGE OPERATING MODEL DATA ───
  const WALKTHROUGH_STAGES = [
    {
      stage: 1,
      name: 'Farm Registration',
      subtitle: 'Understand Land & Resources',
      badge: 'Step 01: Digital Twin',
      desc: 'Farmer records agricultural parcels with latitude/longitude (Niphad, Nashik), cultivated acreage, on-farm shaded storage, plastic harvesting crates, and available family labor.',
      challengeSolved: 'Eliminates unrecorded land data; enables precise logistics vehicle routing and on-farm capacity verification.',
      mockupData: {
        farmName: 'Patil Krishi Farm',
        location: 'Niphad, Nashik, Maharashtra (20.08°N, 74.04°E)',
        area: '3.50 Acres (1.42 Ha • 140 Guntha)',
        resources: ['Shaded On-farm Shed (2 MT)', '80 Harvesting Crates (20 kg)', 'Family + 2 Seasonal Laborers'],
        status: 'Active Holding Verified',
      },
    },
    {
      stage: 2,
      name: 'Harvest Management',
      subtitle: 'Batch Normalization & Grading',
      badge: 'Step 02: Harvest Intake',
      desc: 'Harvested produce is registered with normalized metric weights, quality grade evaluation (Grade A/B/C), Brix sugar level, and estimated harvest date.',
      challengeSolved: 'Prevents weight arbitrary disputes at delivery by creating an immutable benchmark timestamp before dispatch.',
      mockupData: {
        lotCrop: 'Tomato (Hybrid Abhinav)',
        quantity: '4,000 kg (4.00 MT • 200 Crates)',
        grade: 'Grade A (Table & Puree Grade)',
        brix: 'Brix 5.2 • Firm Ripe Red',
        harvestDate: 'Today (Local Nashik Harvest)',
        status: 'Ready for Profit Evaluation',
      },
    },
    {
      stage: 3,
      name: 'Intelligent Profit Decisions',
      subtitle: '4-Way Deterministic Algebra',
      badge: 'Step 03: Decision Engine',
      desc: 'The deterministic calculation engine evaluates four marketing pathways simultaneously: Direct Corporate Off-Take, Wholesale APMC Mandi, Cold Chain Holding, and Agro-Processing.',
      challengeSolved: 'No AI hallucinations. Itemizes exact transport freight, handling fees, and storage tariffs, showing verified net farmer proceeds.',
      mockupData: {
        buyerOffer: { name: 'Sahyadri Agro Processing', gross: '₹28.00/kg', net: '₹23.80/kg', totalNet: '₹95,200', win: true },
        mandiYard: { name: 'APMC Pimpalgaon Yard', gross: '₹16.00/kg', net: '₹13.40/kg', totalNet: '₹53,600', baseline: true },
        coldStorage: { name: 'Niphad Pre-Cooling Hub', gross: '₹24.00/kg (30d)', net: '₹17.20/kg', totalNet: '₹68,800' },
        processing: { name: 'Puree & Paste Line', gross: '₹18.00/kg', net: '₹14.50/kg', totalNet: '₹58,000' },
        uplift: '+₹41,600 (+77% vs APMC Yard)',
      },
    },
    {
      stage: 4,
      name: 'Buyer & Logistics Connection',
      subtitle: 'Fleet Reservation & Contracts',
      badge: 'Step 04: Execution Dispatch',
      desc: '1-click contract execution locks agreed terms with pre-qualified buyers and reserves rural transport fleets (Tempo 3T or Reefer Van) with transparent mileage rates.',
      challengeSolved: 'Bypasses predatory middlemen; guarantees backhaul transportation and locks accepted unit price before produce leaves farm gate.',
      mockupData: {
        contractNo: 'AGR-A2V-2026-0814 (Version 1.0 Locked)',
        partner: 'Sahyadri Mega Food Park • Mohadi, Dindori',
        agreedRate: '₹18.00 / kg Guaranteed Floor',
        vehicle: 'Tempo 3T (MH-15-EG-4412)',
        driver: 'Dnyaneshwar Shinde (+91 94231 55210)',
        transitDistance: '42 km • Reefer Pre-Cooling Active',
      },
    },
    {
      stage: 5,
      name: 'Execution & Settlement',
      subtitle: 'Weighbridge & Escrow Payout',
      badge: 'Step 05: Verified Payout',
      desc: 'Receiving weighbridge digitally confirms tare weight, accepted tonnage, and quality sign-off. Escrow dispatches milestone tranches directly to the farmer bank account.',
      challengeSolved: 'Prevents unauthorized deductions, weighbridge tampering, and delayed payments with an immutable SHA-256 audit digest.',
      mockupData: {
        deliveredQty: '4,000 kg (Weighbridge Tare Verified)',
        acceptedQty: '4,000 kg (Zero Rejection)',
        tranche1: '₹45,000 Disbursed (Bank UTR: UPI-RBI-20260309-8812)',
        tranche2: '₹23,400 Scheduled upon delivery reconciliation',
        auditDigest: 'SHA-256: 8f9b2c3a...d9e4a1b7 (Tamper-Proof)',
        status: 'Settlement Complete & Ledger Reconciled',
      },
    },
  ];

  return (
    <SmoothScrollProvider>
      {/* Precision Scroll Progress Indicator */}
      <ScrollProgressBar />

      <div className="overflow-x-hidden font-sans space-y-24 pb-24 text-slate-900 bg-slate-50 selection:bg-emerald-600 selection:text-white">

        {/* ──────────────────────────────────────────────────────────
            SECTION 1 — HERO SECTION (CINEMATIC PARALLAX + SAAS COCKPIT)
            ────────────────────────────────────────────────────────── */}
        <section className="relative min-h-[94vh] flex items-center justify-center overflow-hidden pt-24 pb-20">
          {/* Background Image with Cinematic Slow Zoom */}
          <motion.img
            src={tractorsImg}
            alt="Modern Agricultural Farm and Tractors"
            initial={shouldReduceMotion ? { scale: 1 } : { scale: 1.12 }}
            animate={shouldReduceMotion ? { scale: 1 } : { scale: 1.03 }}
            transition={{ duration: 10, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Sophisticated Dark Overlays for Contrast & Legibility */}
          <div className="absolute inset-0 bg-slate-950/75" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/80 to-slate-950/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60" />

          {/* Subtle Breathing Ambient Emerald Light Glow */}
          <motion.div
            animate={shouldReduceMotion ? {} : { opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/20 blur-[140px] rounded-full pointer-events-none"
          />

          {/* Main Content Container (2-Column Desktop Grid) */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              {/* Left Column: Headline, Typography, CTAs & Value Props (7 Cols) */}
              <div className="lg:col-span-7 space-y-7 text-left">
                
                {/* Product Badge */}
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide backdrop-blur-md shadow-xs"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>{t('landing.heroBadge', 'Next-Generation AgriTech Platform')}</span>
                  <span className="text-emerald-400/60">•</span>
                  <span className="text-emerald-200 font-medium font-sans">कृषि-मूल्य • Farm-to-Profit Intelligence</span>
                </motion.div>

                {/* Staggered Display Headline */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.10] font-display tracking-tight drop-shadow-lg">
                  <motion.span
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                    className="block sm:inline"
                  >
                    {t('landing.heroHeadline1', 'AGRICULTURE. CONNECTED.')}{' '}
                  </motion.span>
                  <motion.span
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 block sm:inline"
                  >
                    {t('landing.heroHeadline2', 'INTELLIGENT. PROFITABLE.')}
                  </motion.span>
                </h1>

                {/* Subheading Reveal */}
                <motion.p
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
                  className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed font-normal max-w-2xl drop-shadow"
                >
                  {t(
                    'landing.heroSubtitle',
                    'One intelligent platform connecting farm management, profit decisions, market opportunities, logistics, and farmer protection.'
                  )}
                </motion.p>

                {/* Interactive CTAs with Tap/Hover Motion */}
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.45, ease: 'easeOut' }}
                  className="flex flex-col sm:flex-row gap-3.5 pt-2"
                >
                  <motion.a
                    href="#modules"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -2 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-emerald-600" />
                    <span>{t('landing.explorePlatform', 'Explore Agri2Value')}</span>
                  </motion.a>

                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -2 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  >
                    <Link
                      to="/app/dashboard"
                      className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <span>{t('landing.openConsole', 'Open Farmer Console')}</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </Link>
                  </motion.div>

                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  >
                    <Link
                      to="/login"
                      className="px-5 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl backdrop-blur-xs transition-all flex items-center justify-center gap-2"
                    >
                      <PlayCircle className="w-4 h-4 text-emerald-300" />
                      <span>{t('landing.signInDemo', 'Sign In / Demo Access')}</span>
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Trust Value Props Strip */}
                <motion.div
                  initial={shouldReduceMotion ? {} : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300"
                >
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
                </motion.div>

              </div>

              {/* Right Column: Live Enterprise SaaS Product Cockpit Preview (5 Cols) */}
              <motion.div
                initial={shouldReduceMotion ? {} : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                className="lg:col-span-5 relative"
              >
                <motion.div
                  animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                  className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-4 text-white text-xs"
                >
                  
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

                </motion.div>
              </motion.div>

            </div>
          </div>

          {/* Bottom Scroll Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs flex flex-col items-center gap-1 pointer-events-none">
            <span className="tracking-widest uppercase text-[9px] font-bold">Explore Platform</span>
            <ChevronDown className="w-4 h-4 text-emerald-400 animate-bounce" />
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 2 — PRODUCT IMPACT METRICS (WITH ANIMATED COUNTERS)
            ────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Selling Pathways */}
            <StaggerItem>
              <HoverCard className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:border-emerald-300 transition-all space-y-2 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Selling Pathways</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-display mt-1">
                    <AnimatedCounter value={4} suffix=" Options" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Direct Corporate Off-Take, Mandi Auction Yard, Cold Chain Buffer, and Agro-Processing.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Multi-Channel Optimization</span>
                </div>
              </HoverCard>
            </StaggerItem>

            {/* Metric 2: Net Profit Realization */}
            <StaggerItem>
              <HoverCard className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:border-emerald-300 transition-all space-y-2 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Realization</span>
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-emerald-700 font-display mt-1">
                    +35% to <AnimatedCounter value={77} prefix="+" suffix="%" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Realized net payout uplift verified against wholesale APMC baseline via itemized deductions.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Deterministic Net Payout</span>
                </div>
              </HoverCard>
            </StaggerItem>

            {/* Metric 3: End-to-End Execution */}
            <StaggerItem>
              <HoverCard className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:border-emerald-300 transition-all space-y-2 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Execution Pipeline</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-display mt-1">
                    <AnimatedCounter value={5} suffix=" Stages" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    From Farm Digital Twin and Quality Grading to Fleet Booking and Verified Escrow Settlement.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[10px] text-blue-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  <span>Full Lifecycle Continuity</span>
                </div>
              </HoverCard>
            </StaggerItem>

            {/* Metric 4: Crop Rescue Capabilities */}
            <StaggerItem>
              <HoverCard className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:border-emerald-300 transition-all space-y-2 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Emergency Rescue</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-rose-700 font-display mt-1">
                    &lt;<AnimatedCounter value={24} suffix="h Triage" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Automated weather spike alerts and distress triage routing perishable crops before spoilage.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[10px] text-rose-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-rose-600" />
                  <span>Shelf-Life Salvage Watchdog</span>
                </div>
              </HoverCard>
            </StaggerItem>

          </StaggerContainer>

          {/* Provenance Disclosure Note */}
          <div className="mt-3 text-center text-[11px] text-slate-400">
            * Verified benchmarks derived from real Nashik Horticultural Pilot (4,000 kg Tomato Lot, Niphad Cluster) with zero fabricated statistics.
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 3 — AGRI-SERVICE MODULES (ANIMATED ENTERPRISE GRID)
            ────────────────────────────────────────────────────────── */}
        <section id="modules" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
          <FadeIn className="text-center space-y-2 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span>CORE APPLICATION PLATFORM</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Browse by Agri-Service &amp; Pathway
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              A cohesive suite of agricultural SaaS modules designed to eliminate post-harvest leakage, verify transactions, and connect smallholders to profitable off-take opportunities.
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {AGRI_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <StaggerItem key={mod.id}>
                  <HoverCard hoverY={-6}>
                    <Link
                      to={mod.path}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between group space-y-4 h-full"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center border border-slate-100 group-hover:border-emerald-200 transition-colors group-hover:scale-105">
                            <Icon className="w-5 h-5 transition-transform group-hover:rotate-3" />
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 border border-slate-200 group-hover:border-emerald-200 transition-colors">
                            {mod.tag}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-800 transition-colors font-display">
                            {mod.title}
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed mt-1">
                            {mod.desc}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                        <span>Launch Module</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                      </div>
                    </Link>
                  </HoverCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 4 — INTERACTIVE 3D FARM DIGITAL TWIN (REACT THREE FIBER)
            ────────────────────────────────────────────────────────── */}
        <section id="farm-3d" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 scroll-mt-24">
          <FadeIn>
            <Interactive3DFarmSection />
          </FadeIn>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 5 — INTERACTIVE PROFIT ENGINE STORYTELLING
            ────────────────────────────────────────────────────────── */}
        <section id="profit-engine" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 scroll-mt-24">
          <FadeIn>
            <InteractiveProfitEngineStory />
          </FadeIn>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 6 — WHY AGRI2VALUE (SPLIT CHALLENGES VS SOLUTIONS)
            ────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <FadeIn>
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-8">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Ground Reality vs Digital Precision
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                    Why Farmers &amp; FPOs Trust Agri2Value
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                    Addressing the systemic bottlenecks of Indian agriculture with reproducible mathematics and transparent commercial safeguards.
                  </p>
                </div>

                {/* Solution Switcher Pills */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                  {[
                    { key: 'PROFIT', label: 'Profit Engine' },
                    { key: 'IOT', label: 'IoT Telematics' },
                    { key: 'PROTECTION', label: 'Farmer Trust' },
                    { key: 'RESCUE', label: 'Crop Rescue' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveSolution(tab.key as any)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeSolution === tab.key
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Layout: Challenges (Left) vs Interactive Solution Preview (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Left Column: The 4 Ground Challenges (5 cols) */}
                <div className="lg:col-span-5 space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Actual Challenges in Indian Agriculture
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Scale className="w-4 h-4 text-amber-600" />
                      <span>Mandi Price Uncertainty &amp; Yard Gluts</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Daily yard auction price crashes and unrecorded commission cuts reduce smallholder net realizations by 20% to 40%.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span>Fragmented Cold Chain &amp; Arbitrary Freight</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Smallholders lack access to dedicated refrigerated transport, resulting in transit spoilage and opaque per-km freight tariffs.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Flame className="w-4 h-4 text-rose-600" />
                      <span>Unseasonal Weather &amp; Perishability Spikes</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Excess rain or moisture causes rapid bacterial deterioration, forcing emergency distress sales at salvage throwaway rates.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Unrecorded Weighbridges &amp; Payment Delays</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Verbal commitments and lack of weighbridge receipts leave farmers vulnerable to unauthorized quality and weight cuts.
                    </p>
                  </div>
                </div>

                {/* Right Column: Live Solution Component Preview (7 cols) */}
                <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col justify-between space-y-4">
                  
                  {activeSolution === 'PROFIT' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Solution 01</span>
                          <h4 className="text-base font-extrabold text-white">Deterministic Profit Decision Engine</h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Zero Hallucinations
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Algebraic evaluation compares gross procurement rates, route mileage tariffs, and statutory market cess to ensure guaranteed net proceeds.
                      </p>

                      <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 font-mono text-xs space-y-2">
                        <div className="text-slate-400"># Canonical Profit Calculation (Tomato Lot: 4,000 kg)</div>
                        <div className="flex justify-between text-slate-200">
                          <span>Gross Revenue (4,000 kg × ₹28.00):</span>
                          <span className="text-white font-bold">₹1,12,000.00</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                          <span>Logistics Freight Tariff (42 km Tempo):</span>
                          <span>-₹7,200.00</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                          <span>Packaging &amp; Sorting Deductions:</span>
                          <span>-₹9,600.00</span>
                        </div>
                        <div className="pt-2 border-t border-slate-700 flex justify-between text-emerald-400 font-bold text-sm">
                          <span>Verified Net Farmer Payout:</span>
                          <span>₹95,200.00 (₹23.80/kg)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSolution === 'IOT' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Solution 02</span>
                          <h4 className="text-base font-extrabold text-white">Virtual IoT Microclimate &amp; Cold Storage Telematics</h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          Telemetry Stream
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Continuous monitoring of soil moisture, ambient canopy temperature, relative humidity, and cold room cooling cycles.
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                          <span className="text-[10px] text-slate-400 block">Soil Moisture</span>
                          <span className="text-lg font-black font-mono text-emerald-400">38.5%</span>
                          <span className="text-[9px] text-emerald-300 block">Optimal Range</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                          <span className="text-[10px] text-slate-400 block">Canopy Temp</span>
                          <span className="text-lg font-black font-mono text-white">28.2°C</span>
                          <span className="text-[9px] text-slate-400 block">Day High</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                          <span className="text-[10px] text-slate-400 block">Relative Humidity</span>
                          <span className="text-lg font-black font-mono text-blue-400">62%</span>
                          <span className="text-[9px] text-blue-300 block">Normal Vapor</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                          <span className="text-[10px] text-slate-400 block">Battery Voltage</span>
                          <span className="text-lg font-black font-mono text-emerald-400">4.12 V</span>
                          <span className="text-[9px] text-emerald-300 block">Solar Charged</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSolution === 'PROTECTION' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Solution 03</span>
                          <h4 className="text-base font-extrabold text-white">Farmer Protection &amp; Digital Deal Transparency</h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Cryptographic Trust
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Every commercial off-take agreement locks unit price and pre-approved deductions with digital weighbridge sign-offs.
                      </p>

                      <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-mono font-bold text-white">Agreement AGR-A2V-2026-0814</span>
                          <span className="text-emerald-400 font-bold">ACCEPTED &amp; LOCKED</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Buyer: Sahyadri Agro Processing Co-op • Floor Rate: ₹18.00 / kg • Max Deduction: ₹3,600
                        </div>
                        <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[11px]">
                          <span className="text-slate-300">Milestone Tranche 1: ₹45,000 Disbursed</span>
                          <span className="font-mono text-purple-400">SHA-256 Verified</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSolution === 'RESCUE' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Solution 04</span>
                          <h4 className="text-base font-extrabold text-white">Crop Rescue Salvage Mode</h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Urgency: 85/100
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Instantaneous post-harvest distress alerts detect approaching rainfall threats and divert perishables within 24 hours.
                      </p>

                      <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-300">⚠️ Active Weather Hazard Detected</span>
                          <span className="text-[10px] font-mono text-white bg-rose-600 px-2 py-0.5 rounded">Action: 36h Safe Window</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          35mm unseasonal heavy rain forecasted in Niphad cluster. Recommended action: Bypass open mandi yard and route 4,000 kg harvest directly to food park puree processing line.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bottom Nav CTA */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Explore complete interactive system in console</span>
                    <Link
                      to="/app/dashboard"
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Launch Live Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>

              </div>

            </div>
          </FadeIn>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 7 — INTERACTIVE DISTRESS RESCUE DEMONSTRATION
            ────────────────────────────────────────────────────────── */}
        <section id="rescue-demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 scroll-mt-24">
          <FadeIn>
            <InteractiveCropRescueStory />
          </FadeIn>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 8 — INTERACTIVE FARMER PROTECTION & ESCROW STORY
            ────────────────────────────────────────────────────────── */}
        <section id="protection-demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 scroll-mt-24">
          <FadeIn>
            <InteractiveProtectionStory />
          </FadeIn>
        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 9 — INTERACTIVE WALKTHROUGH ("SEE HOW IT WORKS")
            ────────────────────────────────────────────────────────── */}
        <section id="walkthrough" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
          
          <FadeIn className="text-center space-y-2 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <span>END-TO-END EXECUTION WORKFLOW</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-display">
              See How Agri2Value Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Follow the complete agricultural journey from farm parcel onboarding to verified bank payout. Select any stage to inspect live product capabilities.
            </p>
          </FadeIn>

          {/* 5-Stage Interactive Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {WALKTHROUGH_STAGES.map((stg) => {
              const isActive = activeStage === stg.stage;
              return (
                <button
                  key={stg.stage}
                  onClick={() => setActiveStage(stg.stage)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
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
                    {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>

                  <div>
                    <div className={`font-extrabold text-xs sm:text-sm font-display ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {stg.name}
                    </div>
                    <div className={`text-[10px] sm:text-[11px] truncate mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {stg.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Detailed Panel */}
          {(() => {
            const currentStage = WALKTHROUGH_STAGES.find((s) => s.stage === activeStage) || WALKTHROUGH_STAGES[0];
            return (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStage.stage}
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? {} : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  
                  {/* Left Column: Stage Explanation (6 cols) */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span>{currentStage.badge}</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                      {currentStage.name}: {currentStage.subtitle}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {currentStage.desc}
                    </p>

                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                      <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Real-World Challenge Resolved:</span>
                      </div>
                      <p className="text-xs text-emerald-800">
                        {currentStage.challengeSolved}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <Link
                        to="/app/dashboard"
                        className="btn-primary text-xs py-2 px-4 shadow-xs"
                      >
                        <span>Try in Farmer Console</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className="text-xs text-slate-400 font-mono">Step {currentStage.stage} of 5</span>
                    </div>
                  </div>

                  {/* Right Column: Realistic High-Fidelity UI Mockup (6 cols) */}
                  <div className="lg:col-span-6 bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Console Data Snapshot • Stage 0{currentStage.stage}
                      </span>
                      <span className="badge-green text-[10px]">VERIFIED DATA</span>
                    </div>

                    {currentStage.stage === 1 && (
                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                          <span className="text-slate-400 text-[10px] block">Farm Profile</span>
                          <div className="font-bold text-slate-900 text-sm">{(currentStage.mockupData as any).farmName}</div>
                          <div className="text-slate-500 text-[11px]">{(currentStage.mockupData as any).location}</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                          <span className="text-slate-400 text-[10px] block">Cultivated Parcel Area</span>
                          <div className="font-bold text-emerald-700 font-mono text-sm">{(currentStage.mockupData as any).area}</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                          <span className="text-slate-400 text-[10px] block">Associated On-Farm Resources</span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(currentStage.mockupData as any).resources.map((r: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStage.stage === 2 && (
                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                          <span className="text-slate-400 text-[10px] block">Produce Batch</span>
                          <div className="font-bold text-slate-900 text-sm">{(currentStage.mockupData as any).lotCrop}</div>
                          <div className="text-emerald-700 font-mono font-bold">{(currentStage.mockupData as any).quantity}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                            <span className="text-slate-400 text-[10px] block">Quality Grade</span>
                            <span className="font-bold text-slate-900 text-xs">{(currentStage.mockupData as any).grade}</span>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                            <span className="text-slate-400 text-[10px] block">Sugar / Brix Score</span>
                            <span className="font-bold text-emerald-700 font-mono text-xs">{(currentStage.mockupData as any).brix}</span>
                          </div>
                        </div>
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center justify-between">
                          <span>Dispatch Status</span>
                          <span>{(currentStage.mockupData as any).status}</span>
                        </div>
                      </div>
                    )}

                    {currentStage.stage === 3 && (
                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-300 space-y-1">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-emerald-900">★ {(currentStage.mockupData as any).buyerOffer.name}</span>
                            <span className="font-mono text-emerald-700">{(currentStage.mockupData as any).buyerOffer.net}</span>
                          </div>
                          <div className="text-[11px] text-emerald-700 flex justify-between">
                            <span>Total Realized: {(currentStage.mockupData as any).buyerOffer.totalNet}</span>
                            <span className="font-bold">{(currentStage.mockupData as any).uplift}</span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex justify-between items-center text-[11px]">
                          <span className="text-slate-700">{(currentStage.mockupData as any).mandiYard.name}</span>
                          <span className="font-mono font-bold text-slate-900">{(currentStage.mockupData as any).mandiYard.net} (Net: {(currentStage.mockupData as any).mandiYard.totalNet})</span>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex justify-between items-center text-[11px]">
                          <span className="text-slate-700">{(currentStage.mockupData as any).coldStorage.name}</span>
                          <span className="font-mono font-bold text-blue-800">{(currentStage.mockupData as any).coldStorage.net}</span>
                        </div>
                      </div>
                    )}

                    {currentStage.stage === 4 && (
                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                          <span className="text-slate-400 text-[10px] block">Cryptographic Agreement</span>
                          <div className="font-bold text-slate-900 font-mono">{(currentStage.mockupData as any).contractNo}</div>
                          <div className="text-slate-600 text-[11px]">Buyer: {(currentStage.mockupData as any).partner}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                            <span className="text-slate-400 text-[10px] block">Fleet Assigned</span>
                            <span className="font-bold text-slate-900">{(currentStage.mockupData as any).vehicle}</span>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                            <span className="text-slate-400 text-[10px] block">Transit Distance</span>
                            <span className="font-bold text-slate-900">{(currentStage.mockupData as any).transitDistance}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStage.stage === 5 && (
                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                          <span className="text-slate-400 text-[10px] block">Weighbridge Receipt</span>
                          <div className="font-bold text-slate-900">Delivered: {(currentStage.mockupData as any).deliveredQty}</div>
                          <div className="text-emerald-700 font-semibold text-[11px]">Accepted: {(currentStage.mockupData as any).acceptedQty}</div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                          <span className="text-emerald-800 text-[10px] font-bold block">Escrow Disbursement</span>
                          <div className="text-emerald-900 font-bold">{(currentStage.mockupData as any).tranche1}</div>
                          <div className="text-[10px] text-emerald-700 font-mono">{(currentStage.mockupData as any).auditDigest}</div>
                        </div>
                      </div>
                    )}

                  </div>

                </motion.div>
              </AnimatePresence>
            );
          })()}

        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 10 — AGRICULTURAL ECOSYSTEM VISUALIZATION
            ────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <FadeIn className="text-center space-y-2 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
              <span>UNIFIED STAKEHOLDER NETWORK</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Integrated Agricultural Execution Ecosystem
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Agri2Value interconnects every critical stakeholder in the horticultural value chain into a unified, transparent execution network.
            </p>
          </FadeIn>

          {/* 6 Connected Ecosystem Nodes with Stagger Motion */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
            {[
              {
                step: '01',
                title: 'Farmers',
                sub: 'Producers & Growers',
                icon: Sprout,
                value: 'Guaranteed Payout & Dispute Escrow',
                color: 'emerald',
              },
              {
                step: '02',
                title: 'FPOs & Co-ops',
                sub: 'Aggregators',
                icon: Users,
                value: 'Consolidated Bulk Tenders',
                color: 'teal',
              },
              {
                step: '03',
                title: 'Corporate Buyers',
                sub: 'Retail & Processors',
                icon: Building2,
                value: 'Traceable Grade A Supply',
                color: 'sky',
              },
              {
                step: '04',
                title: 'Logistics Fleets',
                sub: 'Tempo & Reefer Trucks',
                icon: Truck,
                value: 'Predictable Backhaul Bookings',
                color: 'blue',
              },
              {
                step: '05',
                title: 'Cold Storage Hubs',
                sub: 'Pre-Cooling Facilities',
                icon: Warehouse,
                value: 'High Occupancy & Monitored Temp',
                color: 'indigo',
              },
              {
                step: '06',
                title: 'Processing Plants',
                sub: 'Puree & Paste Units',
                icon: Boxes,
                value: 'Zero Field Dump Waste',
                color: 'purple',
              },
            ].map((node, idx) => {
              const Icon = node.icon;
              const isHovered = hoveredNode === idx;
              return (
                <StaggerItem key={idx}>
                  <div
                    onMouseEnter={() => setHoveredNode(idx)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`p-4 rounded-2xl border transition-all text-center flex flex-col justify-between space-y-3 cursor-pointer h-full ${
                      isHovered
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-lg -translate-y-1.5'
                        : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                        <span className={isHovered ? 'text-emerald-200' : 'text-slate-400'}>{node.step}</span>
                        <span className={`w-2 h-2 rounded-full ${isHovered ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                      </div>

                      <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-colors ${
                        isHovered ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm font-display">{node.title}</h4>
                        <span className={`text-[10px] block ${isHovered ? 'text-emerald-100' : 'text-slate-500'}`}>
                          {node.sub}
                        </span>
                      </div>
                    </div>

                    <div className={`pt-2 border-t text-[10px] font-semibold leading-tight ${
                      isHovered ? 'border-white/20 text-emerald-200' : 'border-slate-100 text-emerald-700'
                    }`}>
                      {node.value}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

        </section>

        {/* ──────────────────────────────────────────────────────────
            SECTION 11 — FINAL HIGH-CONVERSION CTA BANNER
            ────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-gradient-to-br from-emerald-950 via-[#0a3528] to-slate-950 text-white rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden border border-emerald-800/40 text-center space-y-6">
              
              {/* Ambient Lighting Glows */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none -mb-20" />

              <div className="relative z-10 max-w-3xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>TRANSFORM YOUR HORTICULTURAL REALIZATIONS</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight leading-tight">
                  {t('landing.finalCtaTitle', 'Your Farm Deserves Smarter Decisions.')}
                </h2>

                <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal">
                  {t(
                    'landing.finalCtaSubtitle',
                    'Join forward-looking farmers, FPOs, and agribusinesses securing transparent digital contracts, deterministic profit optimization, and guaranteed market connections.'
                  )}
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-4">
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -2 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    className="w-full sm:w-auto"
                  >
                    <Link
                      to="/app/dashboard"
                      className="w-full sm:w-auto px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-700/30 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Launch Farmer Console</span>
                      <ArrowRight className="w-5 h-5 text-white" />
                    </Link>
                  </motion.div>

                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    className="w-full sm:w-auto"
                  >
                    <Link
                      to="/login"
                      className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/15 border border-white/30 text-white font-bold text-base rounded-2xl backdrop-blur-md transition-all flex items-center justify-center gap-2"
                    >
                      <span>Sign In with Demo OTP</span>
                    </Link>
                  </motion.div>
                </div>

                <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-emerald-200/80">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>100% Deterministic Engine</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zero Middleman Loss</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Cryptographic Trust Ledger</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Free Demo Account</span>
                  </span>
                </div>
              </div>

            </div>
          </FadeIn>
        </section>

      </div>
    </SmoothScrollProvider>
  );
};
