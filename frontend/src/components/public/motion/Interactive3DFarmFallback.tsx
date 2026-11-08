// frontend/src/components/public/motion/Interactive3DFarmFallback.tsx
import React from 'react';
import { MapPin, Cpu, Warehouse, Sun, Droplets, Compass } from 'lucide-react';

export const Interactive3DFarmFallback: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[450px] bg-gradient-to-br from-[#0c2419] to-[#06150e] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden text-white font-sans select-none">
      {/* Background Topo Lines Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 40%, rgba(74, 222, 128, 0.4) 0%, transparent 60%),
                            repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 20px, rgba(16, 185, 129, 0.15) 21px, transparent 22px)`
        }}
      />

      {/* Top Header Information */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Patil Krishi Farm • 20.0768° N, 74.0375° E</span>
          </div>
          <h4 className="text-xl sm:text-2xl font-black font-display text-white">
            Geospatial Digital Twin &amp; Plot Layout
          </h4>
          <p className="text-xs text-emerald-100/70 mt-0.5">
            Niphad Taluka, Nashik District, Maharashtra • 3.50 Acres Registered
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-300 font-bold">TELEMETRY SYNC ACTIVE</span>
        </div>
      </div>

      {/* Center 2D Plot Grid Layout */}
      <div className="relative z-10 my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Plot A */}
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 backdrop-blur-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-extrabold text-white">Plot A — Tomato Field</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              2.0 Acres
            </span>
          </div>
          <div className="text-[11px] text-emerald-100/80 space-y-1">
            <div>Variety: <strong className="text-white">Abhinav (Fresh Table &amp; Processing)</strong></div>
            <div>Harvest Date: <strong className="text-emerald-300 font-mono">8 Nov 2026</strong></div>
            <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-emerald-200">
              <span>Moist: 38.5%</span>
              <span>•</span>
              <span>Temp: 28.2°C</span>
            </div>
          </div>
        </div>

        {/* Plot B */}
        <div className="p-4 rounded-2xl bg-teal-950/60 border border-teal-500/40 backdrop-blur-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-extrabold text-white">Plot B — Onion Field</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              1.5 Acres
            </span>
          </div>
          <div className="text-[11px] text-teal-100/80 space-y-1">
            <div>Variety: <strong className="text-white">Garwa (Summer Storage Onion)</strong></div>
            <div>Holding Buffer: <strong className="text-teal-300 font-mono">45 Days Potential</strong></div>
            <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-teal-200">
              <span>Moist: 26.0%</span>
              <span>•</span>
              <span>Soil pH: 6.8</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Infrastructure Assets Strip */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-emerald-400" />
            <span>Shaded Shed (2 MT)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Solar Drip Pump (5 HP)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Node NSK-NIP-01</span>
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          Model: WGS84 Cadastral Mesh
        </div>
      </div>
    </div>
  );
};

