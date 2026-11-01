// frontend/src/components/DashboardView.tsx
import React from 'react';
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
  Database
} from 'lucide-react';
import type { CropLot, Farm, User } from '../types';
import type { TabKey } from './Navigation';
import { WeatherSprayWidget } from './WeatherSprayWidget';

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

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-emerald-500/20 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phase 1 Vertical Foundation Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {user?.full_name || 'Farmer'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Your farm profiles and harvest lots are persisted and ready. Proceed to Phase 2 to calculate optimal profit pathways across local Mandis, direct buyers, and food processing options.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateLot}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Harvest</span>
            </button>
            <button
              onClick={() => onSelectTab('decision-preview')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Explore Engine</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Registered Farms</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{farms.length}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span>{totalAcres.toFixed(1)} Acres total</span>
            {primaryFarm && <span>• {primaryFarm.district}</span>}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Harvest Lots</span>
            <Wheat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{cropLots.length}</div>
          <div className="text-xs text-slate-400 mt-1">
            <span>{totalKg.toLocaleString()} kg normalized weight</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pilot Scenario</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">Tomato</div>
          <div className="text-xs text-slate-400 mt-1">
            <span>Abhinav (Grade A) • Niphad, Nashik</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Engine Status</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>Ready</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-xs text-emerald-400 mt-1">
            <span>Awaiting Phase 2 Execution</span>
          </div>
        </div>
      </div>

      {/* External Intelligence Strip (Phase 2.6) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeatherSprayWidget
            latitude={primaryFarm?.latitude || 20.0768}
            longitude={primaryFarm?.longitude || 74.0375}
            locationName={primaryFarm ? `${primaryFarm.village}, ${primaryFarm.district}` : 'Niphad, Nashik'}
          />
        </div>

        {/* Mandi Intelligence Shortcut Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/90 shadow-lg flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>APMC Mandi Benchmark</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Pimpalgaon APMC
              </span>
            </div>

            <div className="text-2xl font-black text-white font-mono">
              ₹14.00 <span className="text-xs text-slate-400 font-normal">/kg</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Tomato (Hybrid Abhinav) • Modal Yard Rate. Normalizes ₹1,400/Quintal standard auction rate.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">Data.gov.in / Agmarknet</span>
            <button
              onClick={() => onSelectTab('market-weather')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Mandi Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Harvest Lot Focus & Farm Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Lot Focus Card (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Active Harvest Scenario</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {primaryLot?.data_mode === 'demo' ? 'DEMO SEED' : 'LIVE'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Current pilot lot registered for value-add decision analysis
              </p>
            </div>
            <button
              onClick={() => onSelectTab('lots')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all ({cropLots.length}) &rarr;
            </button>
          </div>

          {primaryLot ? (
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                    🍅
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{primaryLot.crop_name}</span>
                      {primaryLot.variety && (
                        <span className="text-xs font-normal text-slate-400">({primaryLot.variety})</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{primaryFarm ? `${primaryFarm.village}, ${primaryFarm.district}` : 'Niphad, Nashik, MH'}</span>
                      </span>
                      <span>•</span>
                      <span>Grade: <strong className="text-emerald-400">{primaryLot.quality_grade || 'A'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xl font-mono font-bold text-white">
                    {Number(primaryLot.quantity).toLocaleString()} {primaryLot.quantity_unit}
                  </div>
                  <div className="text-xs text-emerald-400 font-mono">
                    = {Number(primaryLot.quantity_kg_normalized).toLocaleString()} kg
                  </div>
                </div>
              </div>

              {/* Status pill & notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-500 mb-1">Lot Status</div>
                  <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{primaryLot.status}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-500 mb-1">Harvest Date</div>
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{primaryLot.harvest_date ? new Date(primaryLot.harvest_date).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-500 mb-1">Provenance</div>
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span>{primaryLot.data_mode.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {primaryLot.notes && (
                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-mono">
                  {primaryLot.notes}
                </div>
              )}

              {/* Call to Action for Phase 2 */}
              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Feasibility Check: <span className="text-emerald-400 font-medium">Local Shed + Crates Available</span>
                </div>
                <button
                  onClick={() => onSelectTab('decision-preview')}
                  className="px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Preview Profit Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl bg-slate-900/50 border border-slate-800">
              <Wheat className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-300">No crop lots registered yet.</p>
              <button
                onClick={onOpenCreateLot}
                className="mt-3 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs"
              >
                Register First Harvest Lot
              </button>
            </div>
          )}
        </div>

        {/* Primary Farm & Resources Card (1 col) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Registered Farm</h2>
            <button
              onClick={() => onSelectTab('farms')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Manage &rarr;
            </button>
          </div>

          {primaryFarm ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-sm font-bold text-white">{primaryFarm.farm_name}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{primaryFarm.village}, {primaryFarm.district}, {primaryFarm.state}</span>
                </div>
                <div className="text-xs text-slate-300 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                  <span>Land Area:</span>
                  <span className="font-semibold text-emerald-400">{primaryFarm.land_area} {primaryFarm.land_area_unit}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Farm Resources ({primaryFarm.resources?.length || 0})
                </div>
                <div className="space-y-2">
                  {primaryFarm.resources && primaryFarm.resources.length > 0 ? (
                    primaryFarm.resources.map((res, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-200">{res.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{res.resource_type}</div>
                        </div>
                        {res.quantity && (
                          <div className="text-right font-mono font-semibold text-slate-300 text-xs">
                            {res.quantity} {res.unit}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">No resources added.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <button
                onClick={onOpenCreateFarm}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs"
              >
                Create Farm Profile
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
