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
  UserCheck
} from 'lucide-react';
import { api } from '../../api';
import type { User } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
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
      const userProfile: User = {
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
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      
      {/* ─── LEFT SHOWCASE COLUMN (JSPM Inspired) ─── */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-gradient-to-tr from-emerald-950 via-slate-900 to-slate-950 p-10 lg:p-14 text-white flex-col justify-between relative overflow-hidden">
        
        {/* Auth Hero Background Image (JSPM Narhe Winners) */}
        <img
          src="/auth_hero.png"
          alt="Agriculture Auth Background"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay pointer-events-none scale-105"
        />

        {/* Decorative blur & pattern */}
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-white font-display tracking-tight">
              Agri<span className="text-emerald-400">2Value</span>
            </span>
          </Link>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold font-mono">
            <span>FASTAPI JWT AUTHENTICATION</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-black font-display text-white leading-tight">
            Empowering <span className="text-emerald-400">Indian Farmers</span> with Transparent Value Realization
          </h2>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Deterministic 4-channel route profit engine</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct execution dispatch to verified buyers</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automated Crop Rescue distress protection watchdog</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>PCCOE Grand Challenge 2026</span>
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Pilot: Ramesh Patil</span>
          </div>
        </div>

      </div>

      {/* ─── RIGHT AUTH FORM CONTAINER ─── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
        <div className="w-full max-w-md mx-auto space-y-6">
          
          {/* Back to Home Link */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Website</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              Farmer Sign In
            </h1>
            <p className="text-xs text-slate-500">
              Access your farm digital twin, profit decisions, and execution requests.
            </p>
          </div>

          {/* Toggle Tabs (Sign In vs Register) */}
          <div className="flex bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              className="flex-1 py-2 rounded-xl bg-white text-slate-900 shadow-xs"
            >
              Sign In (Existing Farmer)
            </button>
            <Link
              to="/register"
              className="flex-1 py-2 rounded-xl text-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              New Account (Register)
            </Link>
          </div>

          {/* Quick Pilot Selector Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-950">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Quick Pilot Farmer Login</span>
              </div>
              <div className="text-[11px] text-emerald-800">
                Ramesh Patil • +91 9876543210 (Niphad, Nashik)
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickPilotSelect}
              className="btn-primary text-xs py-1.5 px-3 shrink-0 shadow-xs"
            >
              Autofill
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            <div>
              <label className="label">Registered Farmer Full Name *</label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Patil"
                className="input"
              />
            </div>

            <div>
              <label className="label">Mobile Phone Number (10 digits) *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 border-r border-slate-200 pr-2 flex items-center gap-1">
                  <span>🇮🇳</span> +91
                </div>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="input pl-18 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Demo OTP / Access Code *</label>
                <span className="text-[11px] font-mono text-emerald-700 font-bold">Default: 123456</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="text"
                  maxLength={6}
                  value={demoCode}
                  onChange={(e) => setDemoCode(e.target.value)}
                  placeholder="123456"
                  className="input pl-9 font-mono tracking-widest text-center"
                />
              </div>
            </div>

            {/* Security Note */}
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Competition Demonstration Mode:</strong> Authenticates against the local FastAPI backend JWT service and initializes canonical Ramesh Patil pilot scenario records.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center text-sm py-3 shadow-md shadow-emerald-600/25"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Session...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 font-bold">
                  <span>Authorize Farmer Session</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>

          </form>

        </div>
      </div>

    </div>
  );
};
