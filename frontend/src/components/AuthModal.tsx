// frontend/src/components/AuthModal.tsx
import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Smartphone, KeyRound, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../api';
import type { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess }) => {
  const [phone, setPhone] = useState('9876543210');
  const [demoCode, setDemoCode] = useState('123456');
  const [fullName, setFullName] = useState('Ramesh Patil');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tokens = await api.demoLogin(phone, demoCode, fullName);
      const user = await api.getMe();
      onSuccess({
        ...user,
        full_name: tokens.full_name || fullName,
      });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify demo code (123456).');
    } finally {
      setLoading(false);
    }
  };

  const setPilotPersona = () => {
    setPhone('9876543210');
    setFullName('Ramesh Patil');
    setDemoCode('123456');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl glass-panel p-6 sm:p-8 border border-slate-700/60 shadow-2xl shadow-emerald-950/40 relative">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Farmer Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">
            Agri2Value Phase 1 Demonstration Environment
          </p>
        </div>

        {/* Demo Warning Banner */}
        <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-300 leading-relaxed">
            <span className="font-semibold">Demo Authentication Notice:</span> No real SMS is sent. Use demo OTP code <strong className="font-mono text-white bg-amber-400/20 px-1 py-0.5 rounded">123456</strong> for any phone number.
          </div>
        </div>

        {/* Quick Pilot Selector */}
        <div className="mb-6">
          <button
            type="button"
            onClick={setPilotPersona}
            className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/40 text-left transition-all duration-150 flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-sm">
                RP
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                  Ramesh Patil (Pilot Tomato Farmer)
                </div>
                <div className="text-[11px] text-slate-400">
                  Niphad, Nashik • 3.5 Acres • 4,000 kg Lot
                </div>
              </div>
            </div>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Farmer Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
              placeholder="e.g. Ramesh Patil"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Mobile Phone Number</span>
              <span className="text-[10px] text-slate-400">10-digit Indian Number</span>
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono text-slate-100 placeholder-slate-500 transition-colors"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Demo OTP Code</span>
              <span className="text-[10px] text-emerald-400 font-mono">Default: 123456</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                maxLength={6}
                value={demoCode}
                onChange={(e) => setDemoCode(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono tracking-widest text-slate-100 placeholder-slate-500 transition-colors"
                placeholder="123456"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-sm transition-all duration-150 shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In as Farmer</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
