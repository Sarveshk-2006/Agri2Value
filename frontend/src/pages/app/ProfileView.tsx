// frontend/src/pages/app/ProfileView.tsx
import React from 'react';
import {
  User,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Lock,
  Globe,
  Award
} from 'lucide-react';
import type { User as UserType, Farm } from '../../types';

interface ProfileViewProps {
  user: UserType | null;
  farms: Farm[];
  onResetDemoData: () => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  farms,
  onResetDemoData,
  onLogout,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="card p-6 sm:p-8 space-y-2 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">
                Farmer Profile & Account Settings
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage your agricultural profile, verified credentials, and demonstration session parameters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-green">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>VERIFIED PILOT FARMER</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Farmer Identity Card */}
        <div className="card p-6 space-y-6">
          <div className="text-center space-y-3 pb-6 border-b border-slate-100">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center mx-auto text-3xl font-bold shadow-md shadow-emerald-500/20">
              👨‍🌾
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-display">
                {user?.full_name || 'Ramesh Patil'}
              </h2>
              <p className="text-xs text-slate-500">
                Primary Producer • {farms[0]?.village || 'Niphad'}, {farms[0]?.district || 'Nashik'}
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <span className="badge-green text-[10px]">PATIL KRISHI FARM</span>
              <span className="badge-blue text-[10px]">ROLE: FARMER</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Mobile Phone:</span>
              <span className="font-mono font-bold text-slate-900">+91 {user?.phone || '9876543210'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Language:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-600" />
                <span>Marathi (मराठी) / EN</span>
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Registered Farms:</span>
              <span className="font-bold text-slate-900">{farms.length} Farm Parcels</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Total Cultivated Area:</span>
              <span className="font-bold text-emerald-700">
                {farms.reduce((sum, f) => sum + (f.land_area || 0), 0)} Acres
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onLogout}
              className="w-full btn-secondary justify-center text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              Sign Out of Session
            </button>
          </div>
        </div>

        {/* Right Columns: Security & Farm Twin Summary */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Farm Holdings Summary */}
          <div className="card p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Registered Land & Infrastructure Holdings</span>
            </h3>

            <div className="space-y-3">
              {farms.map((f) => (
                <div key={f.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{f.farm_name}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {f.village}, {f.district}, {f.state} ({f.land_area} {f.land_area_unit})
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {f.resources?.map((r) => (
                      <span key={r.id} className="badge-slate text-[10px]">
                        {r.resource_type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session & Cryptographic Security */}
          <div className="card p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Session Authorization & Cryptographic Metadata</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 text-[11px]">Auth Architecture</span>
                <div className="font-bold text-slate-900">FastAPI JWT (RS256/HS256)</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Active Token Ingested</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 text-[11px]">Tenant Isolation</span>
                <div className="font-bold text-slate-900">Strict User ID Guard</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Isolation Verified by Tests</div>
              </div>
            </div>
          </div>

          {/* Reset Demo Data Console */}
          <div className="card p-6 bg-amber-50/50 border-amber-200 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Competition Evaluation Data Reset</span>
                </h3>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  Reset local storage and demo memory back to the canonical Phase 1 benchmark: Ramesh Patil, 4,000 kg Grade A Hybrid Tomato lot, and default simulation parameters.
                </p>
              </div>

              <button
                onClick={onResetDemoData}
                className="btn-secondary text-xs py-2 px-3 shrink-0 bg-white border-amber-300 text-amber-950 hover:bg-amber-100 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Reset Demo Seed</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
