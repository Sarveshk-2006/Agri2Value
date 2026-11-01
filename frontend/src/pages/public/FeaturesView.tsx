// frontend/src/pages/public/FeaturesView.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  CloudSun,
  Truck,
  Warehouse,
  Factory,
  Flame,
  ShieldCheck,
  Cpu,
  Sprout,
  CheckCircle2,
  ArrowRight,
  Filter
} from 'lucide-react';

interface FeatureItem {
  id: string;
  name: string;
  category: 'Intelligence' | 'Execution' | 'Protection' | 'Telematics';
  badge: 'LIVE / DETERMINISTIC' | 'LIVE API' | 'VERIFIED DEMO' | 'SIMULATED / PREPARED';
  badgeColor: 'emerald' | 'blue' | 'amber' | 'purple';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  highlights: string[];
  link: string;
}

export const FeaturesView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const features: FeatureItem[] = [
    {
      id: 'decision-engine',
      name: 'Profit Decision Engine',
      category: 'Intelligence',
      badge: 'LIVE / DETERMINISTIC',
      badgeColor: 'emerald',
      icon: TrendingUp,
      description: 'The authoritative core engine that evaluates 4 market pathways (Corporate Buyer, Mandi Yard, Cold Chain, Processing) using pure decimal arithmetic and real cost deductions.',
      highlights: [
        'Deterministic calculation guarantee (Zero black-box AI)',
        'Logistics tariff deduction based on road distance',
        'Feasibility reason tracking & constraint verification',
        'Confidence labels and snapshot persistence'
      ],
      link: '/app/decision'
    },
    {
      id: 'market-intelligence',
      name: 'Maharashtra APMC Mandi Rates',
      category: 'Intelligence',
      badge: 'LIVE API',
      badgeColor: 'blue',
      icon: TrendingUp,
      description: 'Live APMC daily market yard bulletins with Agmarknet feed proxy, price ranges, modal rates, and curated benchmark fallbacks for Nashik, Pimpalgaon, Lasalgaon, and Pune.',
      highlights: [
        'Observation date recorded separately from retrieval timestamp',
        'Unit normalization to standardized INR / kg',
        'Anti-staleness safeguards and warning flags',
        'Data provenance badges (LIVE AGMARKNET vs CANONICAL DEMO)'
      ],
      link: '/app/market'
    },
    {
      id: 'weather-advisory',
      name: 'Weather Microclimate Intelligence',
      category: 'Intelligence',
      badge: 'LIVE API',
      badgeColor: 'blue',
      icon: CloudSun,
      description: 'Localized farm microclimate forecasting through Open-Meteo backend proxy with spray advisories, precipitation risk alerts, and 7-day horticultural models.',
      highlights: [
        'High-resolution hourly and 7-day daily forecasts',
        'Field work suitability guidance (Rain & Wind thresholds)',
        'Statutory advisory notices and CC BY 4.0 attribution',
        'Direct linkage to Crop Rescue risk assessment'
      ],
      link: '/app/market'
    },
    {
      id: 'buyer-network',
      name: 'Smart Buyer Procurement Network',
      category: 'Execution',
      badge: 'VERIFIED DEMO',
      badgeColor: 'amber',
      icon: Sprout,
      description: 'Direct procurement channel connecting smallholder farmers to enterprise food retailers, modern trade buyers, and verified FPO procurement desks.',
      highlights: [
        'Verified corporate buyer profiles (Reliance, Sahyadri, BigBasket)',
        'Accepted crop varieties, quality grades, and MOQ thresholds',
        'Indicative procurement rates with grade premiums',
        '1-click direct procurement inquiry workflows'
      ],
      link: '/app/buyers'
    },
    {
      id: 'logistics-fleet',
      name: 'Cold Chain & Transport Fleet',
      category: 'Execution',
      badge: 'VERIFIED DEMO',
      badgeColor: 'amber',
      icon: Truck,
      description: 'Refrigerated reefer vans and local pickup vehicles with transparent per-km tariffs, payload matching, and base district availability tracking.',
      highlights: [
        'Payload capacities ranging from 1,000 kg to 10,000 kg',
        'Temperature-controlled chilled vehicle indicators',
        'Direct reservation modal with payload allocation',
        'Integrated with 5-stage execution tracking'
      ],
      link: '/app/infra'
    },
    {
      id: 'cold-storage',
      name: 'Cold Storage Hubs',
      category: 'Execution',
      badge: 'VERIFIED DEMO',
      badgeColor: 'amber',
      icon: Warehouse,
      description: 'Regional multi-commodity cold rooms across Nashik and Pune providing temperature control (0°C to 12°C) to prevent immediate harvest price dumping.',
      highlights: [
        'Available vs total storage capacity in Metric Tonnes (MT)',
        'Monthly tariff transparency per kg raw produce',
        'Minimum and maximum holding day constraints',
        'Direct capacity reservation workflows'
      ],
      link: '/app/infra'
    },
    {
      id: 'processing-plants',
      name: 'Agro-Processing Conversion',
      category: 'Execution',
      badge: 'VERIFIED DEMO',
      badgeColor: 'amber',
      icon: Factory,
      description: 'Commercial puree, paste, pulp, and dehydration facilities that convert bumper surplus or Grade B crops into shelf-stable value-added products.',
      highlights: [
        'Turnaround days and recovery conversion ratios',
        'Processing fees per kg raw commodity',
        'Zero field-dump loss salvage routes',
        'Capacity reservation and batch lot tracking'
      ],
      link: '/app/infra'
    },
    {
      id: 'crop-rescue',
      name: 'Crop Rescue Mode',
      category: 'Protection',
      badge: 'LIVE / DETERMINISTIC',
      badgeColor: 'emerald',
      icon: Flame,
      description: 'Emergency watchdog console triggered when perishable crops face distress risk from yard price collapses, unseasonal rainfall, or shelf-life expiration.',
      highlights: [
        'Composite Urgency Index score (0 to 100)',
        '4 ranked salvage pathways with net payout comparisons',
        'Preserves farmer dignity by preventing distress dumping',
        'Fast-track 24-hour execution triggers'
      ],
      link: '/app/rescue'
    },
    {
      id: 'iot-telematics',
      name: 'IoT & Edge Microclimate Telematics',
      category: 'Telematics',
      badge: 'SIMULATED / PREPARED',
      badgeColor: 'purple',
      icon: Cpu,
      description: 'FarmMonitor-inspired virtual edge sensor telemetry console demonstrating 6 microclimate telemetry gauges in preparation for Phase 4A hardware edge integration.',
      highlights: [
        'Volumetric soil moisture, air temperature, and relative humidity',
        '24-hour rainfall accumulation and solar lux intensity',
        'Transparent simulation disclosure (No hardware required)',
        'Architectural readiness for physical ESP32 boards'
      ],
      link: '/app/iot'
    }
  ];

  const categories = ['All', 'Intelligence', 'Execution', 'Protection', 'Telematics'];

  const filteredFeatures = selectedCategory === 'All'
    ? features
    : features.filter(f => f.category === selectedCategory);

  return (
    <div className="pt-24 pb-20 space-y-16">
      
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FULL PRODUCT SPECIFICATION & STATUS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
            Comprehensive Platform Capabilities
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
            Detailed breakdown of all 9 core Agri2Value subsystems with honest data provenance and implementation readiness disclosures.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Filter by Subsystem:
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feat) => {
            const FeatIcon = feat.icon;
            return (
              <div
                key={feat.id}
                className="card p-6 flex flex-col justify-between space-y-5 hover:border-emerald-300 transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                      <FeatIcon className="w-6 h-6" />
                    </div>
                    <span className={
                      feat.badgeColor === 'emerald'
                        ? 'badge-green'
                        : feat.badgeColor === 'blue'
                        ? 'badge-blue'
                        : feat.badgeColor === 'amber'
                        ? 'badge-yellow'
                        : 'badge-purple'
                    }>
                      {feat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {feat.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    {feat.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    to={feat.link}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Launch Feature in App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="card p-8 bg-slate-900 text-white space-y-3">
          <h2 className="text-xl font-black font-display text-white">
            Verify Any Feature Live on the Platform
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All algorithms, schemas, and live feeds are functional and verified in the live prototype environment.
          </p>
          <div className="pt-2">
            <Link to="/app/dashboard" className="btn-primary text-xs py-2.5 px-6">
              Open Farmer Console →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
