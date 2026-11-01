// frontend/src/pages/public/HowItWorksView.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Calculator,
  Truck,
  Flame,
  CheckCircle2,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';

export const HowItWorksView: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      step: 1,
      title: 'UNDERSTAND',
      subtitle: 'Build the Farm Digital Twin',
      icon: Compass,
      color: 'emerald',
      badge: 'STAGE 1 • FOUNDATION',
      description: 'The platform captures the farm’s exact location, acreage, irrigation resources (drip, borewell, solar pump), and registers harvest lots with maturity date and physical grading (Grade A / B / C).',
      keyOutputs: [
        'Precise geo-coordinates for microclimate weather lookup',
        'Normalized harvest volume in kilograms (kg)',
        'Perishability shelf-life index based on crop variety',
        'Resource-aware constraint boundaries'
      ]
    },
    {
      step: 2,
      title: 'DECIDE',
      subtitle: 'Deterministic 4-Route Feasibility Math',
      icon: Calculator,
      color: 'teal',
      badge: 'STAGE 2 • CORE DIFFERENTIATOR',
      description: 'Agri2Value’s calculation engine evaluates 4 distinct economic channels simultaneously: Direct Corporate Buyer, APMC Mandi Auction, Cold Chain Storage, and Agro-Processing Plant.',
      keyOutputs: [
        'Live vs benchmark market rate ingestion',
        'Itemized logistics tariff and distance math',
        'Deduction of hamali, commission, packaging, and holding fees',
        'Feasibility flags (passed checks, unmet preconditions, missing data)'
      ]
    },
    {
      step: 3,
      title: 'EXECUTE',
      subtitle: 'Smart Execution Network Dispatch',
      icon: Truck,
      color: 'blue',
      badge: 'STAGE 3 • FIELD DISPATCH',
      description: 'Once a winning route is selected, the farmer initiates direct booking with verified buyers, cold storage facilities, or refrigerated transport fleet operators without middleman cartels.',
      keyOutputs: [
        'Direct procurement booking with enterprise retail buyers',
        'Reefer van reservation with verified payload matching',
        'Cold room intake reservation with compatible commodities',
        'Formal execution request dispatch with tracking ID'
      ]
    },
    {
      step: 4,
      title: 'PROTECT',
      subtitle: 'Crop Rescue Mode Automated Watchdog',
      icon: Flame,
      color: 'rose',
      badge: 'STAGE 4 • DISTRESS SHIELD',
      description: 'Continuous monitoring of weather anomalies, market price gluts, and shelf-life expiration triggers emergency salvage actions before perishables suffer total value destruction.',
      keyOutputs: [
        'Composite Urgency Index scoring (0 to 100)',
        'Ranked distress pathways (quick-turn buyer, processing pulp, urgent cold buffer)',
        'Salvage payout comparison vs catastrophic 100% loss',
        'Automated advisory notifications to farmer phone'
      ]
    },
    {
      step: 5,
      title: 'VERIFY',
      subtitle: 'Execution Lifecycle & Financial Reconciliation',
      icon: CheckCircle2,
      color: 'purple',
      badge: 'STAGE 5 • SETTLEMENT & AUDIT',
      description: 'The execution status advances through a 5-stage state machine (SUBMITTED ➔ PROVIDER_ACCEPTED ➔ CONFIRMED ➔ IN_EXECUTION ➔ COMPLETED) with an immutable event log.',
      keyOutputs: [
        'Timestamped status transitions with actor role audit',
        'Side-by-side reconciliation of estimated vs actual realized payout',
        'Permanent decision snapshot archive for season-over-season comparison',
        'Farmer feedback and provider reliability scoring'
      ]
    }
  ];

  const currentStepData = steps[activeStep - 1];
  const StepIcon = currentStepData.icon;

  return (
    <div className="pt-24 pb-20 space-y-16">
      
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>OPERATING MODEL & ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
            How Agri2Value Delivers Real Value
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
            A cohesive 5-stage pipeline bridging farmgate harvest to verified bank account realization.
          </p>
        </div>
      </section>

      {/* Step Selector Tabs */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {steps.map((s) => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                activeStep === s.step
                  ? 'border-emerald-600 bg-white shadow-lg ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="text-[11px] font-mono font-bold text-slate-400">STAGE 0{s.step}</div>
              <div className="font-extrabold text-sm text-slate-900 mt-1">{s.title}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Active Step Deep-Dive Showcase */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card p-6 sm:p-10 border-slate-200 shadow-xl space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <StepIcon className="w-7 h-7" />
              </div>
              <div>
                <span className="badge-green text-[10px] mb-1">
                  {currentStepData.badge}
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-display">
                  Stage 0{currentStepData.step}: {currentStepData.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {currentStepData.subtitle}
                </p>
              </div>
            </div>

            <Link
              to="/app/dashboard"
              className="btn-primary text-xs py-2 px-4 shadow-sm shrink-0"
            >
              <span>Test in App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Operational Description
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {currentStepData.description}
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Competition Verification Integrity</span>
                </div>
                <p>
                  Built with FastAPI, strict Pydantic schemas, and SQLAlchemy ORM. All calculations run on verified server-side business logic without arbitrary mock generators.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Key System Deliverables & Signals
              </h3>
              <div className="space-y-2.5">
                {currentStepData.keyOutputs.map((out, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{out}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Route Flow Diagram Preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card p-8 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black font-display text-white">
              Deterministic Decision Flow Diagram
            </h3>
            <p className="text-xs text-slate-400">
              How a harvest lot moves through the evaluation engine into the execution pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
              <div className="text-emerald-400 font-bold">1. Harvest Lot</div>
              <div className="text-slate-400 text-[11px]">4,000 kg Tomato (Grade A)</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
              <div className="text-teal-400 font-bold">2. Constraint Filter</div>
              <div className="text-slate-400 text-[11px]">MOQ, Perishability, Radius</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
              <div className="text-blue-400 font-bold">3. Financial Math</div>
              <div className="text-slate-400 text-[11px]">Gross - Logistics - Storage</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-900/60 border border-emerald-500 text-center space-y-1">
              <div className="text-emerald-300 font-bold">4. Winning Order</div>
              <div className="text-emerald-200 text-[11px]">₹95,200 Net Realization</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="card p-8 bg-emerald-50/50 border-emerald-200 space-y-3">
          <h2 className="text-xl font-black text-slate-900 font-display">
            Ready to Walk Through the Entire Flow?
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Test the live scenario presets or explore how Crop Rescue handles adverse weather in the interactive app console.
          </p>
          <div className="pt-2">
            <Link to="/app/dashboard" className="btn-primary text-xs py-2 px-5">
              Launch Platform Experience →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
