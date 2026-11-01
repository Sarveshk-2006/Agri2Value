// frontend/src/components/SpecsView.tsx
import React from 'react';
import { FileCode2, Database, CheckCircle2, Server, Award, Terminal } from 'lucide-react';

export const SpecsView: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="card p-6 sm:p-8 space-y-2 border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <FileCode2 className="w-4 h-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">
            System Architecture & Decision Engine Specifications
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Documenting the architectural layers, API blueprints, database schemas, and judging criteria for Indradhanu: PCCOE International Grand Challenge 2026.
        </p>
      </div>

      {/* Grid of specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backend & DB */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-display">
            <Server className="w-5 h-5 text-emerald-600" />
            <span>Backend & Database Stack</span>
          </h2>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>FastAPI 0.111+</strong> async REST API with structured structlog logging and Pydantic V2 validations.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>SQLAlchemy 2.0 + asyncpg / aiosqlite</strong> with full async session transaction management.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Alembic</strong> version-controlled migrations (0001_initial_schema through 0004_iot_telematics).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Deterministic Profit Engine:</strong> Zero hallucinations. Strict mathematical calculations of gross revenue, logistics, processing fee, and net payout.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>JWT HS256 Authentication</strong> with server-side role & tenant ownership isolation.</span>
            </li>
          </ul>
        </div>

        {/* Database Tables */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-display">
            <Database className="w-5 h-5 text-blue-600" />
            <span>Core Database Models</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-mono text-emerald-700 font-bold">users</div>
              <div className="text-slate-500 text-[11px]">id (UUID), full_name, phone (unique), role, preferred_language, timestamps.</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-mono text-emerald-700 font-bold">farms & farm_resources</div>
              <div className="text-slate-500 text-[11px]">farm holdings, GPS coordinates, storage sheds, sorting equipment, crates.</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-mono text-emerald-700 font-bold">crop_lots & decision_runs</div>
              <div className="text-slate-500 text-[11px]">normalized kilograms, quality grades, immutable auditable decision snapshots.</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-mono text-emerald-700 font-bold">execution_requests & iot_telemetry</div>
              <div className="text-slate-500 text-[11px]">traceable partner orders, financial reconciliation, and microclimate telemetry.</div>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-display">
            <Terminal className="w-5 h-5 text-purple-600" />
            <span>Key API Endpoints</span>
          </h2>
          <div className="space-y-1.5 font-mono text-xs text-slate-700">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between">
              <span>GET /api/v1/health</span>
              <span className="text-emerald-700 font-bold">Health & DB check</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between">
              <span>POST /api/v1/decision/evaluate</span>
              <span className="text-emerald-700 font-bold">Profit Decision Engine</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between">
              <span>GET /api/v1/weather/farm</span>
              <span className="text-blue-700 font-bold">Open-Meteo Proxy</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between">
              <span>GET /api/v1/mandi/prices</span>
              <span className="text-blue-700 font-bold">APMC Mandi Intelligence</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between">
              <span>POST /api/v1/execution/requests</span>
              <span className="text-purple-700 font-bold">Smart Execution Network</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between">
              <span>GET /api/v1/execution/crop-rescue/assess</span>
              <span className="text-rose-700 font-bold">Crop Rescue Triage</span>
            </div>
          </div>
        </div>

        {/* Judging & Grand Challenge */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-display">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Grand Challenge 2026 Evaluation Criteria</span>
          </h2>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Ground Truth & Data Provenance:</strong> Every demo record explicitly tagged as `DEMO_SEED` / `SIMULATED`. Zero fake or fabricated claims.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>End-to-End Vertical Architecture:</strong> From farmer sign-in to farm creation, harvest lot registration, deterministic profit analysis, and execution booking.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Automated Testing:</strong> Over 75 automated unit & integration tests covering security, schemas, isolation, and CRUD.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Design Excellence:</strong> Modern JSPM-inspired agricultural SaaS ergonomics designed for high legibility and field usability.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
};
