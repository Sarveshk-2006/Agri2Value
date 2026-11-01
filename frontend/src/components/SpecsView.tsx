// frontend/src/components/SpecsView.tsx
import React from 'react';
import { FileCode2, Database, CheckCircle2, Server, Award, Terminal } from 'lucide-react';

export const SpecsView: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-slate-800 space-y-2">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileCode2 className="w-6 h-6 text-emerald-400" />
          <span>System Blueprint & Architecture (Phase 1)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Documenting the architectural layers, API blueprints, database schemas, and judging criteria for PCCOE International Grand Challenge 2026.
        </p>
      </div>

      {/* Grid of specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backend & DB */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <span>Backend & Database Stack</span>
          </h2>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>FastAPI 0.111+</strong> async REST API with structured structlog logging.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>SQLAlchemy 2.0 + asyncpg</strong> with full async session management.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Alembic</strong> version-controlled migrations (0001_initial_schema).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>PostgreSQL & SQLite</strong> dual-engine compatibility for production & local dev.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>JWT HS256 Authentication</strong> with server-side role & ownership enforcement.</span>
            </li>
          </ul>
        </div>

        {/* Database Tables */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Database Tables Implemented</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-mono text-emerald-400 font-semibold">users</div>
              <div className="text-slate-400 text-[11px]">id (UUID), full_name, phone (unique), role, preferred_language, timestamps.</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-mono text-emerald-400 font-semibold">farms</div>
              <div className="text-slate-400 text-[11px]">id, owner_user_id (FK), farm_name, state, district, village, land_area, land_area_unit, GPS.</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-mono text-emerald-400 font-semibold">farm_resources</div>
              <div className="text-slate-400 text-[11px]">id, farm_id (FK), resource_type (storage, equipment, labour), name, quantity, unit.</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-mono text-emerald-400 font-semibold">crop_lots & crop_lot_events</div>
              <div className="text-slate-400 text-[11px]">id, farm_id, owner_user_id, crop_name, variety, quantity, quantity_unit, quantity_kg_normalized, quality_grade, status, data_mode, immutable audit event log.</div>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span>APIs Implemented & Tested</span>
          </h2>
          <div className="space-y-1.5 font-mono text-xs text-slate-300">
            <div className="p-2 rounded bg-slate-900 flex justify-between">
              <span>GET /api/v1/health</span>
              <span className="text-emerald-400">Health & DB check</span>
            </div>
            <div className="p-2 rounded bg-slate-900 flex justify-between">
              <span>POST /api/v1/auth/demo-login</span>
              <span className="text-emerald-400">JWT Token Issue</span>
            </div>
            <div className="p-2 rounded bg-slate-900 flex justify-between">
              <span>GET /api/v1/auth/me</span>
              <span className="text-emerald-400">User Profile</span>
            </div>
            <div className="p-2 rounded bg-slate-900 flex justify-between">
              <span>POST /api/v1/farms</span>
              <span className="text-emerald-400">Create Farm</span>
            </div>
            <div className="p-2 rounded bg-slate-900 flex justify-between">
              <span>GET /api/v1/farms</span>
              <span className="text-emerald-400">List My Farms</span>
            </div>
            <div className="p-2 rounded bg-slate-900 flex justify-between">
              <span>POST /api/v1/farms/{'{id}'}/crop-lots</span>
              <span className="text-emerald-400">Register Harvest</span>
            </div>
            <div className="p-2 rounded bg-slate-900 flex justify-between">
              <span>GET /api/v1/crop-lots</span>
              <span className="text-emerald-400">List Crop Lots</span>
            </div>
          </div>
        </div>

        {/* Judging & Grand Challenge */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Grand Challenge 2026 Criteria Alignment</span>
          </h2>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Ground Truth & Data Provenance:</strong> Every demo record explicitly tagged as `demo` / `DEMO_SEED`. No fabricated or fake claims.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>End-to-End Vertical Architecture:</strong> From farmer sign-in to farm creation, harvest lot registration, and normalized metrics.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Automated Testing:</strong> 14 automated unit & integration tests covering security, schemas, isolation, and CRUD.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Clean Codebase:</strong> Strict separation of concerns (Core, Database, API, Schemas, Services, Frontend UI).</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
};
