// frontend/src/components/Header.tsx
import React from 'react';
import { Sprout, ShieldAlert, Wifi, WifiOff, LogOut, User as UserIcon } from 'lucide-react';
import type { User } from '../types';

interface HeaderProps {
  user: User | null;
  backendOnline: boolean;
  onLogout: () => void;
  onOpenInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  backendOnline,
  onLogout,
  onOpenInfo,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Sprout className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Agri2Value</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Phase 1 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Farm-to-Profit Decision & Execution Platform</p>
          </div>
        </div>

        {/* Provenance & Demo Mode Badge */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>DEMO MODE ACTIVE</span>
            <span className="text-amber-400/60 font-mono text-[11px]">(OTP: 123456)</span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            backendOnline 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}>
            {backendOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>API Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-blue-400" />
                <span>Offline / Mock</span>
              </>
            )}
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenInfo}
            className="hidden sm:inline-flex items-center text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors"
          >
            System Info & Specs
          </button>

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xs">
                  {user.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-slate-200">{user.full_name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>{user.role}</span>
                    <span>•</span>
                    <span className="font-mono">{user.phone}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <UserIcon className="w-4 h-4" />
              <span>Not logged in</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
