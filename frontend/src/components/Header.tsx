// frontend/src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, LogOut, Bell, HelpCircle, Globe, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';
import type { User } from '../types';

interface HeaderProps {
  user: User | null;
  backendOnline: boolean;
  onLogout: () => void;
  onOpenInfo: () => void;
  onOpenProfile?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  backendOnline,
  onLogout,
  onOpenInfo,
  onOpenProfile,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left Side: Brand & Mobile Menu Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Hamburger (Opens App Drawer) */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open all modules menu"}
              title="All Modules Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-emerald-600" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Brand & Tagline - Clickable redirect to Dashboard / Home */}
          <Link
            to={user ? "/app/dashboard" : "/"}
            className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer"
            title="Agri2Value Dashboard"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white transition-transform group-hover:scale-105 shrink-0">
              <Sprout className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 font-display">
                  Agri<span className="text-emerald-600">2Value</span>
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                {t('common.appTagline')}
              </p>
            </div>
          </Link>
        </div>

        {/* Center Indicator (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
            backendOnline 
              ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800' 
              : 'bg-amber-50/80 border-amber-200/80 text-amber-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{backendOnline ? t('common.networkLive') : t('common.offlineMode')}</span>
          </div>
        </div>

        {/* User Profile & Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Language Selector Pill */}
          <LanguageSelector variant="dark" />

          {/* Public Website Link */}
          <Link
            to="/"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Return to Public Website"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('common.publicSite')}</span>
          </Link>

          {/* Architecture / Specs Button */}
          <button
            onClick={onOpenInfo}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all cursor-pointer"
            title="System Specifications & Architecture"
          >
            <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            <span className="hidden lg:inline">{t('common.architecture')}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5 sm:pl-2 sm:border-l sm:border-slate-200">
              {/* Notification Pill */}
              <div className="relative p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors" title={t('common.notifications')}>
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
              </div>

              {/* Farmer Profile Chip */}
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs cursor-pointer text-left"
                title="View Farmer Profile & Settings"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  👨‍🌾
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.full_name || 'Ramesh Patil'}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold leading-tight truncate max-w-[120px]">
                    {user.role} • Patil Krishi Farm
                  </div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title={t('common.signOut')}
                className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                aria-label={t('common.signOut')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-primary text-xs py-1.5 px-3 sm:py-2 sm:px-4 shadow-sm"
            >
              {t('common.signIn')}
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};
