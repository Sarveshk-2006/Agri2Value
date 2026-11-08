// frontend/src/components/public/PublicFooter.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Mail, Phone, MapPin, ExternalLink, ShieldCheck, Cpu, Globe } from 'lucide-react';
import { LanguageSelector } from '../LanguageSelector';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white font-display tracking-tight">
                Agri<span className="text-emerald-400">2Value</span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed">
              India&apos;s feasibility-aware post-harvest intelligence platform. Transforming horticultural yield into predictable farmer profits through transparent route optimization.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-emerald-400 font-medium w-fit">
                <Cpu className="w-3.5 h-3.5" />
                <span>Deterministic Profit Engine Active</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[11px]">Select Language:</span>
                <LanguageSelector variant="dark" />
              </div>
            </div>
          </div>

          {/* Column 2: Platform Capabilities */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">
              Platform Features
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/app/decision" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Profit Decision Engine</span>
                  <span className="badge-green text-[9px] py-0 px-1">FLAGSHIP</span>
                </Link>
              </li>
              <li>
                <Link to="/app/market" className="hover:text-emerald-400 transition-colors">
                  APMC Mandi Yard Feeds
                </Link>
              </li>
              <li>
                <Link to="/app/market" className="hover:text-emerald-400 transition-colors">
                  Open-Meteo Weather & Spray Advisories
                </Link>
              </li>
              <li>
                <Link to="/app/buyers" className="hover:text-emerald-400 transition-colors">
                  Pre-Qualified Buyer Network
                </Link>
              </li>
              <li>
                <Link to="/app/infra" className="hover:text-emerald-400 transition-colors">
                  Cold Storage & Transport Fleets
                </Link>
              </li>
              <li>
                <Link to="/app/protection" className="hover:text-emerald-400 transition-colors">
                  Farmer Protection & Trust Ledger
                </Link>
              </li>
              <li>
                <Link to="/app/rescue" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Crop Rescue Mode</span>
                  <span className="badge-red text-[9px] py-0 px-1">URGENT</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Operating Model & Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">
              Operating Model
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">
                  01. Understand: Farm Digital Twin
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">
                  02. Decide: Deterministic 4-Way Math
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">
                  03. Execute: Smart Logistics Dispatch
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">
                  04. Protect: Emergency Crop Rescue
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">
                  05. Verify: Transparent Financial Settlement
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-400 transition-colors">
                  About Agri2Value Architecture
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Regional Pilot Hub & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">
              Pilot Hub & Helpdesk
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Niphad Taluka, Nashik District, Maharashtra 422303</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+91 98765 43210 (Kisan Advisory Helpdesk)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>contact@agri2value.org</span>
              </div>
              <div className="pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Submit Inquiry or Partnership</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Attribution & Legal */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              © 2026 Agri2Value (कृषि-मूल्य) — Agricultural Intelligence & Execution Platform. All rights reserved.
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-[11px]">
            <Link to="/about" className="hover:text-slate-300 transition-colors">System Architecture</Link>
            <span>•</span>
            <Link to="/features" className="hover:text-slate-300 transition-colors">Features & Provenance</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-slate-300 transition-colors">Contact Support</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
