// frontend/src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Wifi, WifiOff, LogOut, ShieldAlert, Bell, HelpCircle, Globe } from 'lucide-react';
import type { User } from '../types';

interface HeaderProps {
  user: User | null;
  backendOnline: boolean;
  onLogout: () => void;
  onOpenInfo: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  backendOnline,
  onLogout,
  onOpenInfo,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Tagline - Clickable redirect to Dashboard / Home */}
        <Link
          to={user ? "/app/dashboard" : "/"}
          className="flex items-center gap-3 group cursor-pointer"
          title="Agri2Value Dashboard"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white transition-transform group-hover:scale-105">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-display">
                Agri<span className="text-emerald-600">2Value</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                PRO 2026
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              कृषि-मूल्य • Farm-to-Profit Decision & Execution Network
            </p>
          </div>
        </Link>

        {/* Center Indicators */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Demo Mode Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>DEMO MODE</span>
            <span className="text-amber-600/70 font-mono text-[11px]">(OTP: 123456)</span>
          </div>

          {/* Backend Connection Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            backendOnline 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            {backendOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>API Live (Nashik Edge)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                <span>Offline / Mock Mode</span>
              </>
            )}
          </div>
        </div>

        {/* User Profile & Right Actions (JSPM Winners Inspired) */}
        <div className="flex items-center gap-3">
          {/* Public Website Link */}
          <Link
            to="/"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Return to Public Website"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Public Site</span>
          </Link>

          {/* Architecture / Specs Button */}
          <button
            onClick={onOpenInfo}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all cursor-pointer"
            title="System Specifications & Architecture"
          >
            <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            <span className="hidden lg:inline">Architecture</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-slate-200">
              {/* Notification Pill */}
              <div className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors" title="Notifications">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
              </div>

              {/* Farmer Profile Chip */}
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs cursor-pointer text-left"
                title="View Farmer Profile & Settings"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  👨‍🌾
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.full_name || 'Ramesh Patil'}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold leading-tight">
                    {user.role} • Patil Krishi Farm
                  </div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Sign Out to Home Page"
                className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-primary text-xs py-2 px-4 shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};
