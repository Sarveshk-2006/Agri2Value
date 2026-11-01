// frontend/src/pages/public/AboutView.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  Target,
  Eye,
  CheckCircle2,
  Cpu,
  ArrowRight
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="pt-24 pb-20 space-y-16">
      
      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold font-mono">
            <span>ABOUT AGRI2VALUE (कृषि-मूल्य)</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
            Transforming Agricultural Output into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Predictable Value
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
            Developed for Indradhanu: PCCOE International Grand Challenge 2026 to bridge the critical gap between farmgate harvest and market realization.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="card p-8 space-y-4 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 font-display">Our Mission</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To empower every smallholder farmer in India with deterministic, transparent, and feasibility-aware decision intelligence. We replace the uncertainty of traditional mandi distress selling with mathematical precision, verified execution logistics, and automated distress protection.
            </p>
          </div>

          <div className="card p-8 space-y-4 border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 font-display">Our Vision</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              A transparent agricultural ecosystem where farmers are not price-takers at the mercy of yard auction cartels, but active value realizers who command fair margins based on verified crop quality, optimal logistics, and timely cold chain preservation.
            </p>
          </div>

        </div>
      </section>

      {/* The Core Problem & Our Approach */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="badge-yellow">THE AGRICULTURAL PARADOX</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            The Problem We Set Out to Solve
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Why do record bumper harvests frequently lead to farmer insolvency?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 space-y-3">
            <div className="font-extrabold text-sm text-slate-900">1. Mandi Glut Vulnerability</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Perishable crops like tomatoes and onions cannot wait. When multiple farmers harvest simultaneously, local APMC yard prices collapse to ₹2–₹5/kg, causing heavy net losses after transport and labor expenses.
            </p>
          </div>

          <div className="card p-6 space-y-3">
            <div className="font-extrabold text-sm text-slate-900">2. Fragmented Supply Infrastructure</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cold rooms and food processing plants exist across Maharashtra, but smallholder farmers lack direct visibility into available intake capacities, tariff structures, and commodity compatibility.
            </p>
          </div>

          <div className="card p-6 space-y-3">
            <div className="font-extrabold text-sm text-slate-900">3. Black-Box Speculation</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Existing mobile apps often provide generic market price tables without factoring in real distance, vehicle minimum fare, moisture loss, or buyer qualification requirements.
            </p>
          </div>
        </div>
      </section>

      {/* The 4 Architectural Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="card p-8 bg-slate-900 text-white space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-black font-display text-white">
                Agri2Value Architectural Principles
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Technical foundations ensuring accountability and competition readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Deterministic Calculation Guarantee</span>
              </div>
              <p className="text-slate-400">
                Financial recommendations are computed through verifiable decimal arithmetic. LLMs or black-box neural networks never generate currency figures.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Strict Data Provenance</span>
              </div>
              <p className="text-slate-400">
                Every rate and weather reading is explicitly tagged with observation date, retrieval timestamp, and live vs benchmark status.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Farmer Data Ownership Isolation</span>
              </div>
              <p className="text-slate-400">
                JWT security ensures each farmer&apos;s lots, land area, and execution records remain strictly isolated and cryptographically secured.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Transparent Simulation Disclosures</span>
              </div>
              <p className="text-slate-400">
                Hardware IoT telemetry and simulated logistics providers are prominently marked with disclaimer badges to preserve academic integrity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="card p-8 sm:p-12 border-emerald-200 bg-emerald-50/50 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-display">
            Explore the Working Agricultural Prototype
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Evaluate Ramesh Patil&apos;s tomato scenario or explore Maharashtra APMC market intelligence right now.
          </p>
          <div className="pt-2">
            <Link
              to="/app/dashboard"
              className="btn-primary text-xs py-2.5 px-6 shadow-md"
            >
              <span>Open Authenticated Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
