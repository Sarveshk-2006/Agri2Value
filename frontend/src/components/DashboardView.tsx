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
  Sparkles,
  ArrowRight,
  Flame,
  Shield
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
import { formatNumber } from '../i18n/formatters';

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
  const [, setMandiLoading] = useState<boolean>(true);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [, setProtectionSummary] = useState<FarmerProtectionSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<TransactionAuditEvent[]>([]);

  const primaryFarm = farms[0];
  const activeLot = cropLots[activeLotIndex] || cropLots[0];

  const totalKg = cropLots.reduce((sum, l) => sum + (Number(l.quantity_kg_normalized) || 0), 0);
  const totalAcres = farms.reduce((sum, f) => sum + (Number(f.land_area) || 0), 0);

  const hasPerishableLot = cropLots.some(
    (l) => l.crop_name.toLowerCase().includes('tomato') || l.crop_name.toLowerCase().includes('grape')
  );

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
      } finally {
        if (isMounted) setMandiLoading(false);
      }
    };
    fetchMandiData();
    return () => {
      isMounted = false;
    };
  }, [activeLot?.crop_name, primaryFarm?.district]);

  useEffect(() => {
    let isMounted = true;
    const fetchOperationalData = async () => {
      try {
        const prot = await api.getProtectionDashboard();
        if (isMounted) {
          setProtectionSummary(prot);
          setRecentEvents(prot.recent_events || []);
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
      'schemes': '/app/schemes',
      'equipment': '/app/equipment',
      'pesticide-exchange': '/app/pesticide-exchange',
      'labour': '/app/labour',
      'legal-advisor': '/app/legal-advisor',
    };
    if (routeMap[tab]) {
      navigate(routeMap[tab]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-up font-sans">
      
      {/* ─── SECTION 1: CLEAN HUMAN WELCOME BANNER ─── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-green-900 to-slate-950 text-white p-6 sm:p-8 shadow-sm border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold font-display backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Smart Farming Console Active</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Ramesh'}! 🌾
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              Real-time APMC mandi rates, microclimate forecasting, and guaranteed profitable selling choices for your harvest.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <button
              onClick={() => handleSelectTab('decision-preview')}
              className="px-5 py-3 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Run Profit Engine</span>
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              onClick={onOpenCreateLot}
              className="px-4 py-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4 text-emerald-200" />
              <span>Register Harvest</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: PERISHABLE CROP ALERT (CLEAN 1-LINE PILL) ─── */}
      {hasPerishableLot && (
        <section className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-amber-950 font-display">Perishable Tomato Watchdog Active: </span>
              <span className="text-amber-800">4,000 kg harvest has ~48h shelf life. Pre-cooling and direct food processing stand ready.</span>
            </div>
          </div>

          <button
            onClick={() => handleSelectTab('rescue')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto transition shadow-2xs"
          >
            Launch Rescue Mode →
          </button>
        </section>
      )}

      {/* ─── SECTION 3: 4 CLEAN STAT CARDS ─── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Land Holdings */}
        <div
          onClick={() => handleSelectTab('farms')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Land Holdings</span>
            <div className="w-8 h-8 rounded-xl bg-green-50 text-green-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 font-display">{farms.length} Parcels</div>
            <div className="text-xs text-gray-500 mt-0.5">{totalAcres.toFixed(1)} Acres • {primaryFarm?.district || 'Nashik'}</div>
          </div>
          <div className="text-[11px] font-bold text-emerald-700">Verified GPS Boundaries →</div>
        </div>

        {/* Card 2: Harvest Volume */}
        <div
          onClick={() => handleSelectTab('lots')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Active Harvest</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wheat className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 font-mono">{formatNumber(totalKg, i18n.language)} kg</div>
            <div className="text-xs text-gray-500 mt-0.5">{cropLots.length} Lots • Grade {activeLot?.quality_grade || 'A'} Brix 5.2</div>
          </div>
          <div className="text-[11px] font-bold text-amber-700">Manage Produce Lots →</div>
        </div>

        {/* Card 3: Mandi Price Benchmark */}
        <div
          onClick={() => handleSelectTab('market-weather')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>APMC Mandi Benchmark</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              ₹{mandiQuote ? Number(mandiQuote.rate_per_kg).toFixed(2) : '14.00'} <span className="text-xs font-normal text-gray-500">/kg</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">{mandiQuote?.market_name || 'APMC Pimpalgaon'}</div>
          </div>
          <div className="text-[11px] font-bold text-blue-700">Live Agmarknet Sync →</div>
        </div>

        {/* Card 4: Best Profit Pathway */}
        <div
          onClick={() => handleSelectTab('decision-preview')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Top Profit Realization</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-purple-700 font-mono">₹23.80 <span className="text-xs font-normal text-gray-500">/kg</span></div>
            <div className="text-xs text-gray-500 mt-0.5">+77% Uplift vs Mandi Base</div>
          </div>
          <div className="text-[11px] font-bold text-purple-700">4 Pathways Evaluated →</div>
        </div>
      </section>

      {/* ─── SECTION 4: UNIFIED SMART FARMING & FIELD SERVICES (6 MINIMAL CARDS) ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Smart Farming Services & Field Tools</span>
          </h2>
          <span className="text-[11px] text-gray-400">100% Middleman-Free</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Tool 1: Govt Schemes */}
          <div
            onClick={() => handleSelectTab('schemes')}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer group active:scale-[0.98] space-y-1.5 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              🏛️
            </div>
            <div>
              <div className="font-bold text-gray-900 text-xs sm:text-sm font-display group-hover:text-emerald-700 transition">
                Govt Schemes
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                PMFBY, SMAM & Solar
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
              Explore →
            </span>
          </div>

          {/* Tool 2: Farm Machinery */}
          <div
            onClick={() => handleSelectTab('equipment')}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer group active:scale-[0.98] space-y-1.5 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              🚜
            </div>
            <div>
              <div className="font-bold text-gray-900 text-xs sm:text-sm font-display group-hover:text-blue-700 transition">
                Find Machinery
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                Tractors & Harvesters
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 flex items-center gap-0.5">
              Hourly Rent →
            </span>
          </div>

          {/* Tool 3: Input Exchange */}
          <div
            onClick={() => handleSelectTab('pesticide-exchange')}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer group active:scale-[0.98] space-y-1.5 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              🌿
            </div>
            <div>
              <div className="font-bold text-gray-900 text-xs sm:text-sm font-display group-hover:text-green-700 transition">
                Input Exchange
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                Bio-nutrients & sprays
              </p>
            </div>
            <span className="text-[10px] font-bold text-green-700 flex items-center gap-0.5">
              Barter/Share →
            </span>
          </div>

          {/* Tool 4: Labour Crews */}
          <div
            onClick={() => handleSelectTab('labour')}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer group active:scale-[0.98] space-y-1.5 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              👥
            </div>
            <div>
              <div className="font-bold text-gray-900 text-xs sm:text-sm font-display group-hover:text-purple-700 transition">
                Harvest Crews
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                Pickers & sprayers
              </p>
            </div>
            <span className="text-[10px] font-bold text-purple-700 flex items-center gap-0.5">
              Book Squad →
            </span>
          </div>

          {/* Tool 5: Cold Storage */}
          <div
            onClick={() => handleSelectTab('infrastructure')}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer group active:scale-[0.98] space-y-1.5 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              ❄️
            </div>
            <div>
              <div className="font-bold text-gray-900 text-xs sm:text-sm font-display group-hover:text-cyan-700 transition">
                Cold Storage
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                Nearby cooling hubs
              </p>
            </div>
            <span className="text-[10px] font-bold text-cyan-700 flex items-center gap-0.5">
              View Map →
            </span>
          </div>

          {/* Tool 6: Diagnostic Scanner */}
          <div
            onClick={() => setIsScannerModalOpen(true)}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer group active:scale-[0.98] space-y-1.5 flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              🔬
            </div>
            <div>
              <div className="font-bold text-gray-900 text-xs sm:text-sm font-display group-hover:text-rose-700 transition">
                Crop Scanner
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                Quality & pathology
              </p>
            </div>
            <span className="text-[10px] font-bold text-rose-700 flex items-center gap-0.5">
              Scan Photo →
            </span>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: MICROCLIMATE WEATHER & MANDI BENCHMARK (CLEAN 2-COL) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <WeatherSprayWidget
            latitude={primaryFarm?.latitude || 20.0768}
            longitude={primaryFarm?.longitude || 74.0375}
            locationName={primaryFarm ? `${primaryFarm.village}, ${primaryFarm.district}` : 'Niphad, Nashik'}
          />
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">APMC Mandi Intelligence</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                LIVE AGMARKNET
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-black text-gray-900 font-mono">
                  ₹{mandiQuote ? Number(mandiQuote.rate_per_kg).toFixed(2) : '14.00'}
                  <span className="text-xs text-gray-500 font-normal ml-1">/kg</span>
                </div>
                <div className="text-xs text-gray-600 font-bold mt-1">
                  {mandiQuote?.market_name || 'APMC Pimpalgaon Baswant'}
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>Arrival Date</div>
                <div className="font-bold text-gray-800">{mandiQuote?.observation_date || 'Today'}</div>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed pt-1">
              Live modal auction rate for Grade A Tomato. Direct factory contracts offer ₹23.80/kg (+70% higher net realization).
            </p>
          </div>

          <button
            onClick={() => handleSelectTab('market-weather')}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-green-50 text-green-800 font-bold text-xs border border-gray-200 hover:border-green-300 transition text-center"
          >
            Explore Historical Mandi Trends →
          </button>
        </div>
      </section>

      {/* ─── SECTION 6: ACTIVE PRODUCE & FARM HOLDING (CLEAN SPLIT) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Active Produce Lot */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Harvest Produce</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                Ready for Dispatch
              </span>
            </div>

            {activeLot ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg font-display">{activeLot.crop_name}</h3>
                    <p className="text-xs text-gray-500">{activeLot.variety || 'Abhinav Hybrid'} • Grade {activeLot.quality_grade || 'A'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-gray-900">{Number(activeLot.quantity_kg_normalized).toLocaleString()} kg</div>
                    <div className="text-[11px] text-gray-400">Standard Volume</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 text-xs text-emerald-900 font-medium border border-emerald-100 flex items-center justify-between">
                  <span>Top Route: Sahyadri Agro Processing</span>
                  <span className="font-bold text-emerald-800">₹23.80/kg Net</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No active lots registered.</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => handleSelectTab('lots')}
              className="text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              All Harvest Lots ({cropLots.length})
            </button>
            <button
              onClick={() => handleSelectTab('decision-preview')}
              className="btn-primary text-xs py-2 px-4 shadow-sm"
            >
              Evaluate Profit Pathways →
            </button>
          </div>
        </div>

        {/* Registered Farm Parcel */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registered Land Parcel</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                Primary Holding
              </span>
            </div>

            {primaryFarm ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg font-display">{primaryFarm.farm_name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span>{primaryFarm.village}, {primaryFarm.district}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-gray-900">{primaryFarm.land_area} {primaryFarm.land_area_unit}</div>
                    <div className="text-[11px] text-gray-400">Cultivable Area</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 text-xs text-gray-700 flex items-center justify-between border border-gray-100">
                  <span>On-Farm Storage: 200 Crates</span>
                  <span className="text-green-700 font-bold">Cold Bay Ready</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No farm parcel registered.</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => handleSelectTab('farms')}
              className="text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              All Land Holdings ({farms.length})
            </button>
            <button
              onClick={() => handleSelectTab('farms')}
              className="btn-secondary text-xs py-2 px-4"
            >
              Manage Digital Twin →
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: RECENT ACTIVITY STRIP (COMPACT & CLEAN) ─── */}
      <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-sm font-display">Recent Activity & Deal Milestones</h3>
          </div>
          <button
            onClick={() => handleSelectTab('protection')}
            className="text-xs font-bold text-green-700 hover:underline"
          >
            Open Trust Ledger →
          </button>
        </div>

        <div className="space-y-2">
          {recentEvents.slice(0, 2).map((evt) => (
            <div
              key={evt.id}
              className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-green-100 text-green-800 flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </span>
                <div>
                  <span className="font-bold text-gray-900">{evt.event_type.replace(/_/g, ' ')}: </span>
                  <span className="text-gray-600">{evt.summary || 'Milestone verified.'}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-gray-400 shrink-0">
                {evt.created_at ? new Date(evt.created_at).toLocaleDateString() : 'Recent'}
              </span>
            </div>
          ))}
          {recentEvents.length === 0 && (
            <p className="text-xs text-gray-400 italic py-2 text-center">No recent contract events. All holdings synchronized.</p>
          )}
        </div>
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
