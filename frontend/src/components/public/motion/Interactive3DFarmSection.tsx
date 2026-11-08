// frontend/src/components/public/motion/Interactive3DFarmSection.tsx
import React, { useState, Suspense, lazy } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  MapPin,
  Compass,
  RotateCw,
  Layers,
  ArrowRight,
  Maximize2,
  Cpu,
  Warehouse,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Interactive3DFarmFallback } from './Interactive3DFarmFallback';

// Lazy-load the Three.js 3D Canvas
const Interactive3DFarmCanvas = lazy(() => import('./Interactive3DFarmCanvas'));

export const Interactive3DFarmSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState<'3D' | '2D'>(shouldReduceMotion ? '2D' : '3D');

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* Top Header & View Controls Bar */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>React Three Fiber 3D Farm Digital Twin</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Location-Aware 3D Farm Experience
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl">
              Inspect real registered farm plots, topography contours, on-farm shaded storage sheds, and live microclimate telemetry pins.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <div className="bg-white/10 p-1 rounded-xl border border-white/15 flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => setViewMode('3D')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === '3D'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                3D Interactive Twin
              </button>
              <button
                onClick={() => setViewMode('2D')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === '2D'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Geospatial 2D Topo
              </button>
            </div>

            <Link
              to="/app/farms"
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              <span>Manage Land</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <MapPin className="w-3.5 h-3.5" />
              <span>Patil Krishi Farm (20.0768° N, 74.0375° E)</span>
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline">Niphad, Nashik • 3.50 Acres Registered</span>
          </div>

          <div className="text-[11px] text-slate-400">
            {viewMode === '3D' ? '🖱 Drag to rotate • Scroll to zoom • Tap pins for telemetry' : 'Cadastral GIS Overview'}
          </div>
        </div>
      </div>

      {/* Main Visualizer Window */}
      <div className="relative h-[480px] sm:h-[540px] w-full bg-[#0a1811] overflow-hidden">
        {viewMode === '3D' ? (
          <Suspense fallback={<Interactive3DFarmFallback />}>
            <Interactive3DFarmCanvas />
          </Suspense>
        ) : (
          <Interactive3DFarmFallback />
        )}

        {/* Floating Controls Overlay on Desktop */}
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden sm:flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 text-white text-[10px] font-mono border border-slate-700/80 backdrop-blur-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Plot A: 2.0 Ac Tomato (Abhinav)</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 text-white text-[10px] font-mono border border-slate-700/80 backdrop-blur-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>Plot B: 1.5 Ac Onion (Garwa)</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 text-white text-[10px] font-mono border border-slate-700/80 backdrop-blur-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Shaded Storage Shed (2 MT)</span>
          </div>
        </div>

        {/* Clear Data Grounding Badge */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-black/60 text-emerald-300 text-[10px] font-mono border border-emerald-500/30 backdrop-blur-xs">
            Calibrated with Verified Farm GPS
          </div>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <p className="max-w-2xl leading-relaxed">
          <strong>Digital Grounding Disclosure:</strong> Modeled 3D mesh is dynamically scaled to match registered cadastral acreage (3.5 Acres) and actual verified storage assets. Microclimate telemetry streams from active IoT edge sensors.
        </p>
        <Link
          to="/app/farms"
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0"
        >
          <span>Open Full Farms &amp; Land Module</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

