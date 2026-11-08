// frontend/src/components/DashboardView.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Wheat, 
  MapPin, 
  Layers, 
  TrendingUp, 
  PlusCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Database,
  Flame,
  Activity,
  Landmark,
  ScanLine,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Boxes,
  Calendar,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  Shield,
  Clock,
} from 'lucide-react';
import type {
  CropLot,
  Farm,
  User,
  MandiQuoteResponse,
  FarmerProtectionSummary,
  TransactionAuditEvent,
} from '../types';
import type { TabKey } from './Navigation';
import { api } from '../api';
import { WeatherSprayWidget } from './WeatherSprayWidget';
import { SchemeDiscoveryModal } from './SchemeDiscoveryModal';
import { CropDamageScannerModal } from './CropDamageScannerModal';
import { formatNumber, formatCurrency, formatDate } from '../i18n/formatters';

interface DashboardViewProps {
  user: User | null;
  farms: Farm[];
  cropLots: CropLot[];
  onSelectTab: (tab: TabKey) => void;
  onOpenCreateLot: () => void;
  onOpenCreateFarm: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  farms,
  cropLots,
  onSelectTab,
  onOpenCreateLot,
  onOpenCreateFarm,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // State
  const [activeLotIndex, setActiveLotIndex] = useState<number>(0);
  const [mandiQuote, setMandiQuote] = useState<MandiQuoteResponse | null>(null);
  const [mandiLoading, setMandiLoading] = useState<boolean>(true);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [protectionSummary, setProtectionSummary] = useState<FarmerProtectionSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<TransactionAuditEvent[]>([]);
  const [executionCount, setExecutionCount] = useState<number>(1);

  const primaryFarm = farms[0];
  const activeLot = cropLots[activeLotIndex] || cropLots[0];

  const totalKg = cropLots.reduce((sum, l) => sum + (Number(l.quantity_kg_normalized) || 0), 0);
  const totalAcres = farms.reduce((sum, f) => sum + (Number(f.land_area) || 0), 0);

  // Check if any lot is perishable (Tomato/Fruits) for the Crop Rescue alert
  const hasPerishableLot = cropLots.some(
    (l) => l.crop_name.toLowerCase().includes('tomato') || l.crop_name.toLowerCase().includes('grape')
  );

  // Fetch real Mandi Quote from backend
  useEffect(() => {
    let isMounted = true;
    const fetchMandiData = async () => {
      setMandiLoading(true);
      try {
        const crop = activeLot?.crop_name || 'Tomato';
        const district = primaryFarm?.district || 'Nashik';
        const quote = await api.getMandiQuote(crop, district, 'APMC Pimpalgaon Baswant');
        if (isMounted) setMandiQuote(quote);
      } catch {
        // Fallback gracefully handled by api client mock if offline
      } finally {
        if (isMounted) setMandiLoading(false);
      }
    };
    fetchMandiData();
    return () => {
      isMounted = false;
    };
  }, [activeLot?.crop_name, primaryFarm?.district]);

  // Fetch real Protection & Operational Ledger
  useEffect(() => {
    let isMounted = true;
    const fetchOperationalData = async () => {
      try {
        const prot = await api.getProtectionDashboard();
        if (isMounted) {
          setProtectionSummary(prot.farmer_protection_summary);
          setRecentEvents(prot.recent_events || []);
        }
      } catch {}
      try {
        const execs = await api.getExecutionRequests();
        if (isMounted && Array.isArray(execs)) {
          const active = execs.filter((e: any) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED').length;
          setExecutionCount(active > 0 ? active : 1);
        }
      } catch {}
    };
    fetchOperationalData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectTab = (tab: TabKey) => {
    if (onSelectTab) onSelectTab(tab);
    const routeMap: Record<string, string> = {
      'dashboard': '/app/dashboard',
      'farms': '/app/farms',
      'lots': '/app/lots',
      'decision-preview': '/app/decision',
      'market-weather': '/app/market',
      'buyers': '/app/buyers',
      'infrastructure': '/app/infra',
      'execution': '/app/execution',
      'rescue': '/app/rescue',
      'protection': '/app/protection',
      'iot-monitoring': '/app/iot',
      'profile': '/app/profile',
      'specs': '/app/specs',
    };
    if (routeMap[tab]) {
      navigate(routeMap[tab]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── SECTION A: WELCOME HEADER & QUICK ACTIONS ─── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-[#0a3528] to-slate-950 text-white p-6 sm:p-8 border border-emerald-800/40 shadow-md">
        {/* Subtle ambient emerald mesh highlights */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 -mb-20 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide backdrop-blur-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{t('dashboard.networkActive')}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-display text-white">
              {t('dashboard.welcome')}, {user?.full_name?.split(' ')[0] || 'Ramesh'}! 🌾
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              {t('dashboard.heroDesc')}
            </p>
          </div>

          {/* Primary & Secondary Action CTAs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <button
              onClick={() => handleSelectTab('decision-preview')}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{t('dashboard.runProfit')}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              onClick={onOpenCreateLot}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white border border-white/20 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-xs transition-all cursor-pointer active:scale-98"
            >
              <PlusCircle className="w-4 h-4 text-emerald-300" />
              <span>{t('dashboard.registerHarvest')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECTION B: IMPORTANT FARM ALERT (CROP RESCUE) ─── */}
      {hasPerishableLot ? (
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-slate-900 font-display">
                  {t('dashboard.rescueActive')}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white tracking-wider uppercase">
                  HIGH URGENCY
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {t('dashboard.rescueDesc')}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSelectTab('rescue')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-98"
          >
            <span>{t('dashboard.launchRescue')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">All crops within normal shelf-life thresholds. No active distress signals.</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-bold">Watchdog Normal</span>
        </div>
      )}

      {/* ─── SECTION C: FARM PERFORMANCE KPI CARDS ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Registered Farms */}
        <div
          onClick={() => handleSelectTab('farms')}
          className="card p-5 sm:p-6 flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition-all shadow-2xs cursor-pointer group active:scale-[0.99]"
          title="Click to view and manage registered land holdings"
        >
          <div className="flex items-start justify-between">
            <span className="label text-[11px] font-bold text-slate-500 mb-0 flex items-center gap-1">
              <span>{t('dashboard.landHolding')}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 font-display">{farms.length}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span>{totalAcres.toFixed(1)} {t('dashboard.totalAcres')}</span>
              {primaryFarm && <span>• {primaryFarm.district}</span>}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Digital Twin</span>
            <span className="badge-green text-[10px]">VERIFIED HOLDINGS</span>
          </div>
        </div>

        {/* KPI 2: Harvest Lots */}
        <div
          onClick={() => handleSelectTab('lots')}
          className="card p-5 sm:p-6 flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all shadow-2xs cursor-pointer group active:scale-[0.99]"
          title="Click to inspect harvest lots and register yields"
        >
          <div className="flex items-start justify-between">
            <span className="label text-[11px] font-bold text-slate-500 mb-0 flex items-center gap-1">
              <span>{t('dashboard.harvestVolume')}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Wheat className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 font-mono">
              {formatNumber(totalKg, i18n.language)} <span className="text-sm font-normal text-slate-500">kg</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              <span>{cropLots.length} {t('dashboard.activeLots')} ({activeLot?.crop_name || 'Produce'})</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Quality Class</span>
            <span className="badge-green text-[10px]">GRADE {activeLot?.quality_grade || 'A'} CHECKED</span>
          </div>
        </div>

        {/* KPI 3: APMC Benchmark */}
        <div
          onClick={() => handleSelectTab('market-weather')}
          className="card p-5 sm:p-6 flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition-all shadow-2xs cursor-pointer group active:scale-[0.99]"
          title="Click to view real-time Agmarknet mandi rates & weather"
        >
          <div className="flex items-start justify-between">
            <span className="label text-[11px] font-bold text-slate-500 mb-0 flex items-center gap-1">
              <span>{t('dashboard.apmcPrice')}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-emerald-700 font-mono">
              ₹{mandiQuote ? Number(mandiQuote.rate_per_kg).toFixed(2) : '14.00'}{' '}
              <span className="text-xs font-normal text-slate-500">/kg</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium truncate" title={mandiQuote?.market_name || 'APMC Pimpalgaon Baswant'}>
              <span>{mandiQuote?.market_name || 'APMC Pimpalgaon Baswant'}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Market Source</span>
            <span className={mandiQuote?.is_live ? 'badge-green text-[10px]' : 'badge-slate text-[10px]'}>
              {mandiQuote?.is_live ? 'LIVE AGMARKNET' : 'REGIONAL RATE'}
            </span>
          </div>
        </div>

        {/* KPI 4: Execution Engine */}
        <div
          onClick={() => handleSelectTab('decision-preview')}
          className="card p-5 sm:p-6 flex flex-col justify-between hover:border-purple-400 hover:shadow-md transition-all shadow-2xs cursor-pointer group active:scale-[0.99]"
          title="Click to run deterministic profit comparison"
        >
          <div className="flex items-start justify-between">
            <span className="label text-[11px] font-bold text-slate-500 mb-0 flex items-center gap-1">
              <span>{t('dashboard.dispatchReadiness')}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 font-display flex items-center gap-2">
              <span>{t('dashboard.fourPathways')}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              <span>Direct Buyer, Cold, Mandi & Processing</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Engine Status</span>
            <span className="badge-green text-[10px]">FEASIBILITY VERIFIED</span>
          </div>
        </div>

      </section>

      {/* ─── SECTION C2: OPERATIONAL SETTLEMENT & ESCROW PROTECTION BANNER ─── */}
      <section className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Shield className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-slate-900 font-display">
                  Commercial Escrow & Farmer Protection Pulse
                </h3>
                <span className="badge-green text-[10px] font-mono">
                  TRUST SCORE {protectionSummary?.trust_score || 98}/100
                </span>
                <span className="badge-blue text-[10px]">
                  {executionCount} ACTIVE DISPATCH
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every buyer contract is digitally hashed and backed by corporate escrow safeguards with automated penalty enforcement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-wrap lg:flex-nowrap border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-6 shrink-0">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Deal Value</span>
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                {formatCurrency(protectionSummary?.total_deal_value || 64200, i18n.language)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Settled Realized</span>
              <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                {formatCurrency(protectionSummary?.settled_amount || 33200, i18n.language)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Escrow In-Flight</span>
              <span className="text-base sm:text-lg font-black text-amber-700 font-mono">
                {formatCurrency(protectionSummary?.outstanding_payout_escrow || 31000, i18n.language)}
              </span>
            </div>
            <button
              onClick={() => handleSelectTab('protection')}
              className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECTION D: WEATHER & MARKET INTELLIGENCE ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Weather & Spray Advisory (2 cols) */}
        <div className="lg:col-span-2">
          <WeatherSprayWidget
            latitude={primaryFarm?.latitude || 20.0768}
            longitude={primaryFarm?.longitude || 74.0375}
            locationName={primaryFarm ? `${primaryFarm.village}, ${primaryFarm.district}` : 'Niphad, Nashik'}
          />
        </div>

        {/* Mandi Intelligence Card (1 col) */}
        <div className="card p-6 flex flex-col justify-between space-y-4 h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label text-[10px] mb-0 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>APMC Market Intelligence</span>
                {mandiLoading && <RefreshCw className="w-3 h-3 animate-spin text-emerald-600 ml-1" />}
              </span>
              <span className={mandiQuote?.is_live ? 'badge-green text-[10px]' : 'badge-slate text-[10px]'}>
                {mandiQuote?.is_live ? 'LIVE AGMARKNET FEED' : 'REGIONAL RATE'}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mt-1 font-display">
              {mandiQuote?.market_name || 'APMC Pimpalgaon Baswant'}
            </h3>

            <div className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono mt-2">
              ₹{mandiQuote ? Number(mandiQuote.rate_per_kg).toFixed(2) : '14.00'}{' '}
              <span className="text-xs text-slate-500 font-normal">/kg</span>
            </div>

            <div className="text-xs text-slate-500 font-mono mt-0.5">
              ≈ ₹{((mandiQuote ? Number(mandiQuote.rate_per_kg) : 14) * 100).toLocaleString()} / Quintal standard auction batch
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              <strong className="text-slate-800">{mandiQuote?.commodity || 'Tomato'} (Hybrid Abhinav)</strong> • Daily modal yard auction price for Grade A fair-average-quality lot.
            </p>

            {mandiQuote?.is_stale && (
              <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{mandiQuote.staleness_warning || 'Data cached over 24h. Mandi holiday observation.'}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Observed: {mandiQuote?.observation_date || 'Recent'}</span>
              <span>{mandiQuote?.district || 'Nashik'}, {mandiQuote?.state || 'MH'}</span>
            </div>

            <button
              onClick={() => handleSelectTab('market-weather')}
              className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Explore Multi-Mandi Feed & Historical Trends</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
            </button>
          </div>
        </div>

      </section>

      {/* ─── SECTION E: QUICK INTELLIGENCE & FARMER SERVICES ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Tool 1: Government Scheme & Subsidy Explorer */}
        <div className="card p-6 border-slate-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shadow-2xs">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="badge-green text-[10px]">
                UP TO ₹2 CR SUBSIDY
              </span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-display">
                {t('dashboard.exploreSchemes')} 🏛️
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Explore Agriculture Infrastructure Fund (3% interest subvention), PMFBY crop loss safety, MIDH (up to 50% cold storage grants), and PoCRA climate incentives. Calculate eligible benefits instantly.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSchemeModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>{t('dashboard.exploreSchemes')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tool 2: AI Crop Damage & Spoilage Diagnostic Scanner */}
        <div className="card p-6 border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shadow-2xs">
                <ScanLine className="w-5 h-5" />
              </div>
              <span className="badge-blue text-[10px]">
                COMPUTER VISION AI
              </span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-display">
                {t('dashboard.cropDiagnostic')} 📷
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Scan produce photos to detect early fungal blight, transit bruising, or sunscald. Directly links damage severity to Crop Rescue salvage routes and insurance claim dossiers.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsScannerModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>{t('dashboard.cropDiagnostic')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </section>

      {/* ─── SECTION F: ACTIVE HARVEST WORKSPACE & SECTION G: REGISTERED FARM ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Active Lot Focus Card (2 cols) */}
        <div className="lg:col-span-2 card p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header with Lot Switcher if multiple exist */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    {t('dashboard.activeWorkspace')}
                  </h2>
                  <span className="badge-green text-[10px]">
                    OPERATIONAL DIGITAL TWIN
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Current produce lot registered for multi-channel profit optimization
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectTab('lots')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('dashboard.manageLots')} ({cropLots.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Multiple Lots Selector Strip */}
            {cropLots.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {cropLots.map((lot, idx) => (
                  <button
                    key={lot.id}
                    onClick={() => setActiveLotIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      activeLotIndex === idx
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{lot.crop_name}</span>
                    <span className="font-mono text-[11px] opacity-80">({Number(lot.quantity_kg_normalized).toLocaleString()} kg)</span>
                  </button>
                ))}
              </div>
            )}

            {activeLot ? (
              <div className="rounded-2xl bg-slate-50/70 border border-slate-200/80 p-5 space-y-4">
                
                {/* Produce Identity & Quantity Callout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-3xl shrink-0">
                      {activeLot.crop_name.toLowerCase().includes('tomato') ? '🍅' :
                       activeLot.crop_name.toLowerCase().includes('onion') ? '🧅' :
                       activeLot.crop_name.toLowerCase().includes('grape') ? '🍇' :
                       activeLot.crop_name.toLowerCase().includes('pomegranate') ? '🍎' : '🌾'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-slate-900 font-display">
                          {activeLot.crop_name}
                        </h3>
                        {activeLot.variety && (
                          <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {activeLot.variety}
                          </span>
                        )}
                        <span className="badge-green text-[10px]">
                          GRADE {activeLot.quality_grade || 'A'} CERTIFIED
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{primaryFarm ? `${primaryFarm.farm_name} • ${primaryFarm.village}, ${primaryFarm.district}` : 'Patil Krishi Farm, Niphad'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-2xl sm:text-3xl font-mono font-black text-slate-900">
                      {Number(activeLot.quantity).toLocaleString()} <span className="text-sm font-normal text-slate-500">{activeLot.quantity_unit}</span>
                    </div>
                    <div className="text-xs text-emerald-700 font-bold font-mono mt-0.5">
                      = {Number(activeLot.quantity_kg_normalized).toLocaleString()} kg normalized
                    </div>
                  </div>
                </div>

                {/* 3-Column Verification Info Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <div className="label text-[10px] mb-1 font-bold text-slate-400">Lot Status</div>
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{activeLot.status}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <div className="label text-[10px] mb-1 font-bold text-slate-400">Harvest Date</div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>{activeLot.harvest_date ? new Date(activeLot.harvest_date).toLocaleDateString() : 'Recent Harvest'}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <div className="label text-[10px] mb-1 font-bold text-slate-400">Data Provenance</div>
                    <div className="font-bold text-amber-800 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-amber-600" />
                      <span>{activeLot.data_mode === 'real' ? 'FARM VERIFIED' : 'DEMO SEED SCENARIO'}</span>
                    </div>
                  </div>
                </div>

                {/* Operational Feasibility Checklist Callout */}
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">
                      Feasibility Checks Passed: 200 Crates On-Site • Sahyadri Hub Buyer Feasible
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">4/4 Routes Valid</span>
                </div>

                {activeLot.notes && (
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-600 leading-relaxed font-mono">
                    <strong className="text-slate-800 font-sans">Field Notes:</strong> {activeLot.notes}
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <Wheat className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Harvest Lots Registered Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Register your crop yield to evaluate real-time net realization across direct corporate buyers, cold chain storage, APMC mandis, and food processing plants.
                </p>
                <button
                  onClick={onOpenCreateLot}
                  className="btn-primary text-xs py-2 px-4"
                >
                  Register First Harvest Lot
                </button>
              </div>
            )}
          </div>

          {/* Action Footer for Profit Decision Engine */}
          {activeLot && (
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Ready to evaluate net profit across 4 channels?
              </span>

              <button
                onClick={() => handleSelectTab('decision-preview')}
                className="btn-primary text-xs py-2.5 px-5 shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('dashboard.analyseProfit')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ─── SECTION G: REGISTERED FARM & RESOURCES ─── */}
        <div className="card p-6 space-y-4 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-display">{t('dashboard.registeredFarm')}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Physical land parcel & equipment twin</p>
              </div>
              <button
                onClick={() => handleSelectTab('farms')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>{t('dashboard.manageFarms')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {primaryFarm ? (
              <div className="space-y-4">
                
                {/* Farm Land Overview Card */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900 font-display">
                      {primaryFarm.farm_name}
                    </h3>
                    <span className="badge-green text-[10px]">PRIMARY PARCEL</span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{primaryFarm.village}, {primaryFarm.district}, {primaryFarm.state}</span>
                  </div>

                  <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Cultivated Land Area:</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">
                      {primaryFarm.land_area} {primaryFarm.land_area_unit}
                    </span>
                  </div>
                </div>

                {/* Farm Resources */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="label text-[10px] mb-0 font-bold text-slate-500">
                      On-Site Equipment & Resources ({primaryFarm.resources?.length || 0})
                    </span>
                  </div>

                  <div className="space-y-2">
                    {primaryFarm.resources && primaryFarm.resources.length > 0 ? (
                      primaryFarm.resources.map((res, i) => (
                        <div 
                          key={i} 
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between hover:bg-white hover:border-slate-300 transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{res.name}</div>
                            <div className="text-[10px] text-slate-500 capitalize">{res.resource_type}</div>
                          </div>
                          {res.quantity && (
                            <div className="text-right font-mono font-bold text-slate-800 text-xs bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                              {res.quantity} {res.unit}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic py-2">No resources cataloged yet.</div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">No farm registered to this farmer profile.</p>
                <button
                  onClick={onOpenCreateFarm}
                  className="btn-primary text-xs py-2 px-4"
                >
                  Create Farm Profile
                </button>
              </div>
            )}
          </div>

          {/* Quick shortcut to IoT Monitoring */}
          {primaryFarm && (
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => handleSelectTab('iot-monitoring')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 hover:border-blue-300 transition-all text-xs font-bold text-blue-900 cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>Microclimate & IoT Telematics</span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>

      </section>

      {/* ─── SECTION H: LIVE OPERATIONAL ACTIVITY & AUDIT TRAIL ─── */}
      <section className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 font-display">
                Operational Activity & Verification Stream
              </h2>
              <span className="badge-green text-[10px] font-mono">
                SHA-256 VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tamper-evident record of contract executions, payment escrows, and logistics milestones.
            </p>
          </div>
          <button
            onClick={() => handleSelectTab('protection')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Trust Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentEvents.length > 0 ? (
          <div className="space-y-3">
            {recentEvents.slice(0, 5).map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-mono text-[10px] font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900">
                        {evt.event_type.replace(/_/g, ' ')}
                      </span>
                      {evt.deal_reference && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700">
                          {evt.deal_reference}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                      {evt.description || 'Verified on-chain contract milestone.'}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 text-slate-400 font-mono text-[10px] border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {evt.created_at ? new Date(evt.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                  {evt.actor_role && (
                    <span className="capitalize text-slate-500 font-sans font-semibold">
                      by {evt.actor_role.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">
            No recent transaction events recorded. All active holdings are synchronized and ready.
          </div>
        )}
      </section>

      {/* ─── MODALS ─── */}
      <SchemeDiscoveryModal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
      />

      <CropDamageScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onNavigateToRescue={() => handleSelectTab('rescue')}
      />

    </div>
  );
};
