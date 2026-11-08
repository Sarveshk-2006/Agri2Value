// frontend/src/components/public/PublicNavbar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, Menu, X, ArrowRight, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../LanguageSelector';
import type { User } from '../../types';

interface PublicNavbarProps {
  user: User | null;
  onLogout?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: t('nav.home'), path: '/' },
    { label: 'About', path: '/about' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Features', path: '/features' },
    { label: 'Contact', path: '/contact' },
  ];

  const isNavSolid = isScrolled || !isHomePage;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isNavSolid
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xl font-black tracking-tight font-display ${isNavSolid ? 'text-slate-900' : 'text-slate-900 md:text-white'}`}>
                  Agri<span className="text-emerald-500">2Value</span>
                </span>
                <span className="badge-green text-[10px] font-mono py-0.5 px-1.5 hidden sm:inline-flex">
                  PRO 2026
                </span>
              </div>
              <p className={`text-[10px] tracking-wide hidden sm:block ${isNavSolid ? 'text-slate-500' : 'text-slate-600 md:text-emerald-100/90'}`}>
                कृषि-मूल्य • Farm-to-Profit Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className={`hidden md:flex items-center gap-1 p-1 rounded-2xl border backdrop-blur-md transition-all ${
            isNavSolid
              ? 'bg-slate-100/80 border-slate-200/80 text-slate-700'
              : 'bg-white/10 border-white/20 text-white'
          }`}>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? isNavSolid ? 'bg-white text-emerald-700 shadow-xs' : 'bg-white text-emerald-800 shadow-md'
                      : isNavSolid ? 'text-slate-600 hover:text-slate-900 hover:bg-white/50' : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector variant="dark" />
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate max-w-[120px]">{user.full_name}</span>
                </div>
                <Link
                  to="/app/dashboard"
                  className="btn-primary text-xs py-2 px-3.5 shadow-sm shadow-emerald-600/20"
                >
                  <span>{t('common.farmerConsole')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors px-2 py-1"
                  >
                    {t('common.signOut')}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isNavSolid
                      ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      : 'border-white/30 text-white hover:bg-white/10'
                  }`}
                >
                  {t('common.signIn')}
                </Link>
                <Link
                  to="/app/dashboard"
                  className="btn-primary text-xs py-2 px-4 shadow-md shadow-emerald-600/25"
                >
                  <span>{t('common.farmerConsole')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelector variant="dark" />
            <Link
              to="/app/dashboard"
              className="btn-primary text-xs py-1.5 px-3"
            >
              App
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-5 pt-3 pb-6 shadow-xl space-y-4 animate-in slide-in-from-top-4">
          <div className="space-y-1 pt-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{user.full_name}</span>
                  <span className="badge-green text-[10px]">ACTIVE</span>
                </div>
                <Link
                  to="/app/dashboard"
                  className="btn-primary w-full justify-center text-sm py-2.5"
                >
                  Open Farmer Console
                </Link>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full text-center text-xs font-bold text-rose-600 py-1.5"
                  >
                    Logout Session
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  className="btn-secondary justify-center text-xs py-2.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary justify-center text-xs py-2.5"
                >
                  New Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
