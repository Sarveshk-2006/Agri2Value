// frontend/src/components/AuthModal.tsx
import React, { useState } from 'react';
import { UserCheck, Smartphone, KeyRound, AlertTriangle, ArrowRight, Sprout } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative space-y-5">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-100">
            <Sprout className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">Farmer Sign In</h2>
          <p className="text-xs text-slate-500 mt-1">
            Agri2Value (कृषि-मूल्य) • Indradhanu Grand Challenge 2026
          </p>
        </div>

        {/* Demo Warning Banner */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-900 leading-relaxed font-medium">
            <span className="font-bold">Demonstration Authentication:</span> No real SMS required. Use demo OTP code <strong className="font-mono text-amber-950 bg-amber-200/60 px-1 py-0.5 rounded">123456</strong> for any 10-digit number.
          </div>
        </div>

        {/* Quick Pilot Selector */}
        <div>
          <button
            type="button"
            onClick={setPilotPersona}
            className="w-full p-3 rounded-xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200 text-left transition-all duration-150 flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                RP
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Ramesh Patil (Pilot Tomato Farmer)
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Niphad, Nashik • 3.5 Acres • 4,000 kg Lot
                </div>
              </div>
            </div>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">
              Farmer Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder="e.g. Ramesh Patil"
            />
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>Mobile Phone Number</span>
              <span className="text-[10px] text-slate-400 font-normal">10-digit Indian Number</span>
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="input-field pl-10 font-mono font-bold"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>Demo OTP Code</span>
              <span className="text-[10px] text-emerald-700 font-bold font-mono">Default: 123456</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                maxLength={6}
                value={demoCode}
                onChange={(e) => setDemoCode(e.target.value)}
                className="input-field pl-10 font-mono tracking-widest font-extrabold"
                placeholder="123456"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3"
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
