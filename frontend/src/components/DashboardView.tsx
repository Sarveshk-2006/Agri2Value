// frontend/src/components/DashboardView.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wheat, 
  MapPin, 
  Layers, 
  TrendingUp, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Database,
  Flame,
  Activity,
  Landmark,
  ScanLine
} from 'lucide-react';
import type { CropLot, Farm, User } from '../types';
import type { TabKey } from './Navigation';
import { WeatherSprayWidget } from './WeatherSprayWidget';
import { SchemeDiscoveryModal } from './SchemeDiscoveryModal';
import { CropDamageScannerModal } from './CropDamageScannerModal';

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
  const primaryFarm = farms[0];
  const primaryLot = cropLots[0];

  const totalKg = cropLots.reduce((sum, l) => sum + (Number(l.quantity_kg_normalized) || 0), 0);
  const totalAcres = farms.reduce((sum, f) => sum + (Number(f.land_area) || 0), 0);

  const navigate = useNavigate();

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

  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      
      {/* Hero Welcome Banner (JSPM Winners Inspired) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 text-white p-6 sm:p-8 shadow-sm">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-24 -mb-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Smart Execution Network Active • Competition-Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-display">
              Namaste, {user?.full_name?.split(' ')[0] || 'Ramesh'}! 🌾
            </h1>
            <p className="text-sm text-emerald-50 max-w-2xl leading-relaxed">
              Your farm profiles, real-time APMC Mandi feeds, Open-Meteo microclimate, and Smart Execution Network are synchronized. Maximize your harvest profit through feasibility-checked routes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleSelectTab('decision-preview')}
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Run Profit Engine</span>
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </button>
            <button
              onClick={onOpenCreateLot}
              className="px-4 py-2.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-800/90 text-white border border-white/20 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Lot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Crop Rescue Alert Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900">
                Crop Rescue Alert: Perishable Harvest Protection Active
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white tracking-wide">
                HIGH URGENCY
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Rapid salvage pathways available for Tomato lots facing shelf-life expiry or APMC Mandi gluts. Direct factory processing and cold room buffering ready.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSelectTab('rescue')}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-98"
        >
          <span>Launch Crop Rescue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards (JSPM Winners Inspired Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="label">Registered Farms</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{farms.length}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>{totalAcres.toFixed(1)} Acres</span>
              {primaryFarm && <span>• {primaryFarm.district}</span>}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="label">Harvest Lots</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{cropLots.length}</div>
            <div className="text-xs text-slate-500 mt-1">
              <span>{totalKg.toLocaleString()} kg normalized</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Wheat className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="label">APMC Benchmark</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              ₹14.00 <span className="text-xs font-normal text-slate-500">/kg</span>
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">
              <span>Tomato (Pimpalgaon APMC)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="label">Execution Engine</span>
            <div className="text-2xl font-black text-emerald-700 mt-1 flex items-center gap-2">
              <span>Optimized</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span>Direct Buyer & Processing Active</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* External Intelligence Strip (Weather & Mandi) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeatherSprayWidget
            latitude={primaryFarm?.latitude || 20.0768}
            longitude={primaryFarm?.longitude || 74.0375}
            locationName={primaryFarm ? `${primaryFarm.village}, ${primaryFarm.district}` : 'Niphad, Nashik'}
          />
        </div>

        {/* Mandi Intelligence Card */}
        <div className="card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label mb-0">Mandi Benchmark</span>
              <span className="badge-green text-[10px]">
                LIVE BENCHMARK
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mt-1">Pimpalgaon Baswant APMC</h3>
            <div className="text-3xl font-black text-slate-900 font-mono mt-2">
              ₹14.00 <span className="text-xs text-slate-500 font-normal">/kg</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Tomato (Hybrid Abhinav) • Modal Yard Rate. Converted from ₹1,400/Quintal standard auction batch.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">Agmarknet Provenance</span>
            <button
              onClick={() => handleSelectTab('market-weather')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Mandi Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Specialized Farmer Intelligence & Subsidy Tools (JSPM Winners Inspired) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool 1: Government Scheme & Subsidy Explorer */}
        <div className="card p-6 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 border-emerald-200/80 shadow-md hover:shadow-lg transition-all space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
              <Landmark className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              UP TO ₹2 CR SUBSIDY
            </span>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Government Schemes & Subsidy Explorer 🏛️
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Explore AIF (3% interest subvention), PMFBY, MIDH (50% cold storage grants), and PoCRA climate incentives. Calculate eligible benefits instantly.
            </p>
          </div>
          <button
            onClick={() => setIsSchemeModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>Explore Schemes & Calculate Subsidy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tool 2: AI Crop Damage & Spoilage Diagnostic Scanner */}
        <div className="card p-6 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 border-blue-200/80 shadow-md hover:shadow-lg transition-all space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <ScanLine className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
              AI COMPUTER VISION
            </span>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              AI Crop Damage & Quality Diagnostic 📷
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Scan tomato or crop photos to detect early fungal blight, transit bruising, or sunscald. Directly links damage severity to Crop Rescue salvage routes.
            </p>
          </div>
          <button
            onClick={() => setIsScannerModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>Launch Vision Scanner & Diagnostic</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Harvest Lot Focus & Farm Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Lot Focus Card (2 cols) */}
        <div className="lg:col-span-2 card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Active Harvest Scenario</span>
                <span className="badge-yellow text-[10px]">
                  {primaryLot?.data_mode === 'demo' ? 'DEMO SEED' : 'LIVE'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Current pilot lot registered for value-add decision analysis
              </p>
            </div>
            <button
              onClick={() => handleSelectTab('lots')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View all ({cropLots.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {primaryLot ? (
            <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-2xl">
                    🍅
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{primaryLot.crop_name}</span>
                      {primaryLot.variety && (
                        <span className="text-xs font-medium text-slate-500">({primaryLot.variety})</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{primaryFarm ? `${primaryFarm.village}, ${primaryFarm.district}` : 'Niphad, Nashik, MH'}</span>
                      </span>
                      <span>•</span>
                      <span>Grade: <strong className="text-emerald-700">{primaryLot.quality_grade || 'A'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xl font-mono font-black text-slate-900">
                    {Number(primaryLot.quantity).toLocaleString()} {primaryLot.quantity_unit}
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold font-mono">
                    = {Number(primaryLot.quantity_kg_normalized).toLocaleString()} kg normalized
                  </div>
                </div>
              </div>

              {/* Status pill & notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="label text-[10px] mb-1">Lot Status</div>
                  <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{primaryLot.status}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="label text-[10px] mb-1">Harvest Date</div>
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{primaryLot.harvest_date ? new Date(primaryLot.harvest_date).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="label text-[10px] mb-1">Data Provenance</div>
                  <div className="font-bold text-amber-700 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-amber-500" />
                    <span>{primaryLot.data_mode.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {primaryLot.notes && (
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-600 leading-relaxed font-mono">
                  {primaryLot.notes}
                </div>
              )}

              {/* Call to Action for Profit Engine */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Feasibility Check: <span className="text-emerald-700 font-bold">Local Shed + Crates Available</span>
                </div>
                <button
                  onClick={() => onSelectTab('decision-preview')}
                  className="btn-primary text-xs py-2 px-4 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Profit Recommendation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl bg-slate-50 border border-slate-200">
              <Wheat className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-medium">No crop lots registered yet.</p>
              <button
                onClick={onOpenCreateLot}
                className="btn-primary mt-3 text-xs"
              >
                Register First Harvest Lot
              </button>
            </div>
          )}
        </div>

        {/* Primary Farm & Resources Card (1 col) */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Registered Farm</h2>
            <button
              onClick={() => onSelectTab('farms')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Manage &rarr;
            </button>
          </div>

          {primaryFarm ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <div className="text-base font-extrabold text-slate-900">{primaryFarm.farm_name}</div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{primaryFarm.village}, {primaryFarm.district}, {primaryFarm.state}</span>
                </div>
                <div className="text-xs text-slate-700 pt-2 border-t border-emerald-100/80 flex items-center justify-between">
                  <span>Land Area:</span>
                  <span className="font-bold text-emerald-800">{primaryFarm.land_area} {primaryFarm.land_area_unit}</span>
                </div>
              </div>

              <div>
                <div className="label mb-2">
                  Farm Resources ({primaryFarm.resources?.length || 0})
                </div>
                <div className="space-y-2">
                  {primaryFarm.resources && primaryFarm.resources.length > 0 ? (
                    primaryFarm.resources.map((res, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between hover:bg-white transition-colors">
                        <div>
                          <div className="font-bold text-slate-800">{res.name}</div>
                          <div className="text-[10px] text-slate-500 capitalize">{res.resource_type}</div>
                        </div>
                        {res.quantity && (
                          <div className="text-right font-mono font-bold text-slate-700 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                            {res.quantity} {res.unit}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">No resources added.</div>
                  )}
                </div>
              </div>

              {/* Quick shortcut to IoT Monitoring */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleSelectTab('iot-monitoring')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:border-blue-200 transition-all text-xs font-bold text-blue-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Microclimate & IoT Telematics</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <button
                onClick={onOpenCreateFarm}
                className="btn-primary text-xs"
              >
                Create Farm Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Modals (JSPM Narhe Winners Inspired) ─── */}
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
