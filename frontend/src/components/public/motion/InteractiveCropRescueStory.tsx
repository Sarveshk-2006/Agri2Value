// frontend/src/components/public/motion/InteractiveCropRescueStory.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  AlertTriangle,
  CloudSun,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  MapPin,
  CheckCircle2,
  Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Scenario {
  id: string;
  title: string;
  trigger: string;
  riskScore: number;
  threatDescription: string;
  spotLossValue: number;
  salvagedValue: number;
  salvageFacility: string;
  distanceKm: number;
  processingYield: string;
  turnaroundHours: number;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'RAIN_SHOCK',
    title: 'Unseasonal Monsoon Cloudburst',
    trigger: '28 mm precipitation forecast in 24 hours over Niphad',
    riskScore: 94,
    threatDescription: 'Field waterlogging and skin rupture will destroy 100% of harvest if held in open field sheds.',
    spotLossValue: 0,
    salvagedValue: 54200,
    salvageFacility: 'Sahyadri Puree & Pulp Works (Unit 2)',
    distanceKm: 18,
    processingYield: '92.5% puree paste recovery',
    turnaroundHours: 18,
  },
  {
    id: 'GLUT_CRASH',
    title: 'Severe APMC Market Glut Collapse',
    trigger: '14,000 MT sudden arrivals in Pimpalgaon Mandi yard',
    riskScore: 88,
    threatDescription: 'Spot price crashed from ₹14.50 to ₹4.20/kg. Mandi deductions exceed gross revenue, causing debt.',
    spotLossValue: 16800,
    salvagedValue: 48600,
    salvageFacility: 'Nashik Agro Dehydration Plant',
    distanceKm: 24,
    processingYield: 'Sun-dried flakes contract',
    turnaroundHours: 24,
  },
  {
    id: 'HEAT_SPOILAGE',
    title: 'Extreme Heatwave & Ethylene Degradation',
    trigger: 'Ambient farm temperature sustained at 38.5°C with 78% RH',
    riskScore: 82,
    threatDescription: 'Bacterial soft rot accelerating; shelf-life diminished from 6 days to under 30 hours.',
    spotLossValue: 0,
    salvagedValue: 51800,
    salvageFacility: 'Niphad Pre-Cooling Hub & Flash Pulping',
    distanceKm: 9,
    processingYield: 'Immediate cold stabilizing + pulp',
    turnaroundHours: 12,
  },
];

export const InteractiveCropRescueStory: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('RAIN_SHOCK');
  const scenario = SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];

  return (
    <div className="bg-white rounded-3xl border border-rose-200/80 shadow-xl shadow-rose-950/5 overflow-hidden">
      {/* Top Banner with Pulse Alert */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 mb-3">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <span>Automated Distress Triage Algorithm</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Crop Rescue Mode: Distress Salvage Simulator
            </h3>
            <p className="text-xs sm:text-sm text-rose-100/80 mt-1 max-w-xl">
              When sudden weather shocks or market glut crashes hit, Agri2Value algorithmically diverts perishable crops to commercial processors before total loss occurs.
            </p>
          </div>

          {/* Risk Meter Pill */}
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md self-start lg:self-auto">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="5"
                  fill="transparent"
                />
                <motion.circle
                  key={scenario.riskScore}
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="#f43f5e"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={150.7}
                  initial={{ strokeDashoffset: 150.7 }}
                  animate={{ strokeDashoffset: 150.7 - (150.7 * scenario.riskScore) / 100 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-black font-mono text-white">{scenario.riskScore}%</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                Urgency Threat Index
              </div>
              <div className="text-xs font-extrabold text-white">
                CRITICAL DISTRESS DETECTED
              </div>
              <div className="text-[10px] text-rose-200 font-mono mt-0.5">
                Resolution Window: &lt;{scenario.turnaroundHours}h
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Toggle Buttons */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2.5">
            Test Real-World Shock Scenario:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  selectedScenarioId === sc.id
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-700/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                <div className="text-xs font-black truncate">{sc.title}</div>
                <div className="text-[10px] opacity-80 mt-0.5 line-clamp-1">{sc.trigger}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Simulation Body */}
      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Left: The Distress Danger vs Salvage Outcome */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Unmanaged Field Outcome (Distress Spot Selling)</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  {scenario.threatDescription}
                </p>
                <div className="mt-4 pt-3 border-t border-rose-200/80 flex items-baseline justify-between">
                  <span className="text-xs text-rose-700 font-medium">Expected Recovery:</span>
                  <span className="text-lg font-black font-mono text-rose-900">
                    ₹{scenario.spotLossValue.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-rose-600">(Total Loss / Spoilage)</span>
                  </span>
                </div>
              </div>

              {/* The Algorithmic Rescue Outcome */}
              <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Agri2Value Automated Rescue Diversion</span>
                  </div>
                  <span className="badge-green text-[10px] font-mono">Salvaged</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Automatically mapped to <strong className="text-emerald-900">{scenario.salvageFacility}</strong> ({scenario.distanceKm} km away) with guaranteed processing yield of {scenario.processingYield}.
                </p>
                <div className="mt-4 pt-3 border-t border-emerald-200/80 flex items-baseline justify-between">
                  <span className="text-xs text-emerald-800 font-bold">Salvaged Farmer Bank Value:</span>
                  <span className="text-2xl font-black font-mono text-emerald-800">
                    +₹{scenario.salvagedValue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: 4-Step Rescue Dispatch Workflow */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Rescue Execution Protocol (Triage to Payout)</span>
                  <span className="text-emerald-700 font-mono text-[11px]">Active SLA: &lt;{scenario.turnaroundHours}h</span>
                </h4>

                <div className="space-y-3">
                  {[
                    {
                      step: '01',
                      title: 'Hyper-Local Weather / Mandi Trigger Ingestion',
                      desc: scenario.trigger,
                      status: 'COMPLETED',
                    },
                    {
                      step: '02',
                      title: 'Factory Intake Capacity Lock',
                      desc: `Matched with ${scenario.salvageFacility} (${scenario.distanceKm} km)`,
                      status: 'COMPLETED',
                    },
                    {
                      step: '03',
                      title: 'Priority 3PL Transit Allocation',
                      desc: 'Dedicated transport dispatched directly to farm coordinates within 2 hours',
                      status: 'ACTIVE',
                    },
                    {
                      step: '04',
                      title: 'Institutional Escrow Settlement',
                      desc: `₹${scenario.salvagedValue.toLocaleString('en-IN')} locked into digital agreement; paid within 48h`,
                      status: 'PENDING',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-[11px] font-mono flex items-center justify-center shrink-0">
                        {item.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                          <span>{item.title}</span>
                          {item.status === 'COMPLETED' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                          {item.status === 'ACTIVE' && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Live Pilot in Nashik Horticultural Corridor</span>
                <Link
                  to="/app/rescue"
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Launch Rescue Mode</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

