// frontend/src/pages/auth/LoginView.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  User,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { api } from '../../api';
import type { User as UserType } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('9876543210');
  const [demoCode, setDemoCode] = useState('123456');
  const [fullName, setFullName] = useState('Ramesh Patil');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleQuickPilotSelect = () => {
    setPhone('9876543210');
    setDemoCode('123456');
    setFullName('Ramesh Patil');
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const tokens = await api.demoLogin(phone, demoCode, fullName);
      const userProfile: UserType = {
        id: tokens.user_id,
        full_name: fullName,
        phone: phone,
        role: 'FARMER',
        preferred_language: 'mr',
        is_active: true,
      };
      onLoginSuccess(userProfile);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your demo access code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* ─── LEFT SHOWCASE COLUMN (Moving, Lively, JSPM Narhe Winners Style) ─── */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-gradient-to-tr from-emerald-950 via-slate-900 to-slate-950 p-8 lg:p-12 xl:p-14 text-white flex-col justify-between relative overflow-hidden">
        
        {/* Animated ambient mesh glow orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-[110px] pointer-events-none animate-float" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-teal-400/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-green-500/20 rounded-full blur-[110px] pointer-events-none animate-float delay-300" />

        {/* Dynamic Farmer Hero Image with smooth breathing animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="/auth_hero.png"
            alt="Agriculture Auth Background"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay scale-105 animate-soft-pulse transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-slate-950/85 to-slate-950/70" />
        </div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 animate-fade-up">
          <Link
            to="/"
            className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-emerald-400/50 hover:bg-white/15 transition-all shadow-lg group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black text-white font-display tracking-tight">
                Agri<span className="text-emerald-400">2Value</span>
              </span>
              <span className="block text-[10px] text-emerald-300 font-mono tracking-wider font-semibold">
                KRISHI-MULYA PLATFORM
              </span>
            </div>
          </Link>
        </div>

        {/* Value Proposition Hero Content */}
        <div className="relative z-10 space-y-6 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold font-mono tracking-wide backdrop-blur-md animate-fade-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>FASTAPI JWT AUTHENTICATION • SOVEREIGN DATA</span>
          </div>

          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black font-display text-white leading-tight animate-fade-up delay-100">
            Empowering{' '}
            <span className="bg-gradient-to-r from-emerald-300 via-green-300 to-teal-200 bg-clip-text text-transparent">
              Indian Farmers
            </span>{' '}
            with Transparent Value Realization
          </h2>

          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed animate-fade-up delay-200">
            Deterministic AI-driven profit decisions, verified buyer contracts, and real-time distress rescue for perishable produce.
          </p>

          {/* Interactive Feature Pills */}
          <div className="space-y-3 pt-1 text-xs text-slate-200 animate-fade-up delay-300">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-colors">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="font-medium">Deterministic 4-channel route profit engine (Mandi, Direct, Storage, Processing)</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-colors">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="font-medium">Direct digital execution dispatch to verified institutional buyers</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-colors">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="font-medium">Automated Crop Rescue distress protection watchdog with weather sync</span>
            </div>
          </div>

          {/* Live Pilot Metrics Pill Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900/80 border border-emerald-500/30 backdrop-blur-md shadow-lg flex items-center justify-between text-xs animate-fade-up delay-400">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Nashik Valley Active Pilot</span>
                <span className="text-[11px] text-slate-400">Ramesh Patil • 150 Quintal Tomato Lot</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 font-extrabold font-mono text-sm block">+38.4%</span>
              <span className="text-[10px] text-slate-400">Net Profit Lift</span>
            </div>
          </div>
        </div>

        {/* Footer info strip */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Indradhanu: PCCOE Grand Challenge 2026</span>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Canonical Pilot Scenario Ready</span>
          </div>
        </div>

      </div>

      {/* ─── RIGHT AUTH FORM CONTAINER (Perfect Spacing, Smooth Animations) ─── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10 sm:py-14 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        
        {/* Ambient background decoration */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-green-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg mx-auto space-y-6 relative z-10 animate-fade-up">
          
          {/* Back to Home Link */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform duration-200" />
              <span>Back to Public Website</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
              Farmer Sign In
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Access your farm digital twin, profit decisions, and execution requests.
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200/80 shadow-xs">
            <button
              type="button"
              className="flex-1 py-2.5 rounded-xl bg-white text-emerald-950 shadow-sm border border-slate-200/60 font-extrabold flex items-center justify-center gap-1.5 cursor-default"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sign In (Existing Farmer)</span>
            </button>
            <Link
              to="/register"
              className="flex-1 py-2.5 rounded-xl text-center text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>New Account (Register)</span>
            </Link>
          </div>

          {/* Quick Pilot Farmer Login Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-green-50/70 to-emerald-100/50 border border-emerald-200/90 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform shrink-0">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-950 font-display">Quick Pilot Farmer Login</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-800 text-[10px] font-bold font-mono">
                    DEMO READY
                  </span>
                </div>
                <div className="text-xs text-emerald-800 font-medium truncate">
                  Ramesh Patil • <span className="font-mono font-semibold">+91 9876543210</span> (Niphad, Nashik)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickPilotSelect}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-display shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autofill</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-scale-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Registered Full Name */}
            <div>
              <label className="label">Registered Farmer Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400 outline-none shadow-xs"
                />
              </div>
            </div>

            {/* Mobile Phone Number */}
            <div>
              <label className="label">Mobile Phone Number (10 digits) *</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 border-r border-slate-200 pr-2.5 flex items-center gap-1.5 pointer-events-none">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl pl-20 pr-4 py-3 text-sm font-mono font-semibold text-slate-900 transition-all placeholder:text-slate-400 outline-none shadow-xs tracking-wider"
                />
              </div>
            </div>

            {/* Demo OTP Code */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Demo OTP / Access Code *</label>
                <button
                  type="button"
                  onClick={() => setDemoCode('123456')}
                  className="text-[11px] font-mono text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200/80 font-bold transition-colors cursor-pointer"
                >
                  Default: 123456
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  required
                  type="text"
                  maxLength={6}
                  value={demoCode}
                  onChange={(e) => setDemoCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono font-bold text-slate-900 transition-all placeholder:text-slate-400 outline-none shadow-xs tracking-[0.25em]"
                />
              </div>
            </div>

            {/* Security Demonstration Mode Notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong className="text-slate-800 font-semibold">Competition Demonstration Mode:</strong>{' '}
                Authenticates against the local FastAPI backend JWT service and initializes canonical Ramesh Patil pilot scenario records.
              </span>
            </div>

            {/* Submit Action CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:via-green-500 hover:to-emerald-600 text-white font-bold font-display text-sm sm:text-base shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform pointer-events-none" />
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authorizing Session...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Authorize Farmer Session</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
                  </span>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
};
