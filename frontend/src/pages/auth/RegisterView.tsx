// frontend/src/pages/auth/RegisterView.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { api } from '../../api';
import type { User } from '../../types';

interface RegisterViewProps {
  onRegisterSuccess: (user: User) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onRegisterSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Nashik');
  const [taluka, setTaluka] = useState('Niphad');
  const [primaryCrop, setPrimaryCrop] = useState('Tomato');
  const [landArea, setLandArea] = useState('5.0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // In the demonstration architecture, we log the user in via demoLogin with the registered credentials
      const tokens = await api.demoLogin(phone || '9876543210', '123456', fullName || 'New Registered Farmer');
      const registeredUser: User = {
        id: tokens.user_id,
        full_name: fullName,
        phone: phone,
        role: 'FARMER',
        preferred_language: 'mr',
        is_active: true,
      };
      onRegisterSuccess(registeredUser);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration simulation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoFarmer = () => {
    setFullName('Suresh Deshmukh');
    setPhone('9822012345');
    setDistrict('Nashik');
    setTaluka('Dindori');
    setPrimaryCrop('Grapes');
    setLandArea('7.5');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      
      {/* ─── LEFT SHOWCASE COLUMN ─── */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-gradient-to-tr from-emerald-950 via-slate-900 to-slate-950 p-10 lg:p-14 text-white flex-col justify-between relative overflow-hidden">
        
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none" />
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

        {/* Onboarding Description */}
        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold font-mono">
            <span>FARMER ONBOARDING EXPERIENCE</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-black font-display text-white leading-tight">
            Join the Smart Agricultural Revolution
          </h2>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Map your farm land and irrigation infrastructure</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Track harvest lots and perishability in real time</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Connect directly to verified buyers and cold rooms</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>PCCOE Grand Challenge 2026</span>
          <span className="text-emerald-400 font-mono text-[11px]">Free Pilot Access</span>
        </div>

      </div>

      {/* ─── RIGHT REGISTRATION FORM ─── */}
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
              Register New Farmer
            </h1>
            <p className="text-xs text-slate-500">
              Create your digital twin and configure your farm parameters.
            </p>
          </div>

          {/* Toggle Tabs (Sign In vs Register) */}
          <div className="flex bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
            <Link
              to="/login"
              className="flex-1 py-2 rounded-xl text-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In (Existing Farmer)
            </Link>
            <button
              type="button"
              className="flex-1 py-2 rounded-xl bg-white text-slate-900 shadow-xs"
            >
              New Account (Register)
            </button>
          </div>

          {/* Demo Pre-fill Chip */}
          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 font-medium">Testing as new farmer?</span>
            <button
              type="button"
              onClick={handleFillDemoFarmer}
              className="btn-secondary text-[11px] py-1 px-2.5 font-bold text-emerald-800"
            >
              Pre-fill Suresh Deshmukh
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            
            <div>
              <label className="label">Farmer Full Name *</label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Suresh Deshmukh"
                className="input"
              />
            </div>

            <div>
              <label className="label">Mobile Phone Number *</label>
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
                  placeholder="9822012345"
                  className="input pl-18 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">District (Maharashtra) *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="input"
                >
                  <option value="Nashik">Nashik</option>
                  <option value="Pune">Pune</option>
                  <option value="Ahmednagar">Ahmednagar</option>
                  <option value="Solapur">Solapur</option>
                </select>
              </div>

              <div>
                <label className="label">Taluka / Village *</label>
                <input
                  required
                  type="text"
                  value={taluka}
                  onChange={(e) => setTaluka(e.target.value)}
                  placeholder="e.g. Niphad"
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Primary Crop *</label>
                <select
                  value={primaryCrop}
                  onChange={(e) => setPrimaryCrop(e.target.value)}
                  className="input"
                >
                  <option value="Tomato">Tomato (टॉमेटो)</option>
                  <option value="Onion">Onion (कांदा)</option>
                  <option value="Grapes">Grapes (द्राक्षे)</option>
                  <option value="Pomegranate">Pomegranate (डाळिंब)</option>
                </select>
              </div>

              <div>
                <label className="label">Landholding (Acres) *</label>
                <input
                  required
                  type="number"
                  step="0.5"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  placeholder="5.0"
                  className="input font-mono"
                />
              </div>
            </div>

            {/* Disclosure Notice */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Demonstration Onboarding:</strong> Registration configures a localized farmer session initialized with demonstration farms and lot scenarios for the competition judges.
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
                  <span>Setting Up Account...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 font-bold">
                  <UserPlus className="w-4 h-4" />
                  <span>Register & Open Platform</span>
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
