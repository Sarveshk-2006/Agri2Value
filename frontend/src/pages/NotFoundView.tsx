// frontend/src/pages/NotFoundView.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Home, LayoutDashboard, ArrowLeft } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900 font-sans">
      <div className="card p-8 sm:p-12 max-w-lg w-full text-center space-y-6 shadow-xl border-slate-200">
        
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <Sprout className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="badge-yellow text-xs font-mono">ERROR 404 • ROUTE NOT FOUND</span>
          <h1 className="text-3xl font-black font-display text-slate-900">
            Field Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            The agricultural pathway or page you requested does not exist or may have been re-indexed.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-4 justify-center"
          >
            <Home className="w-4 h-4" />
            <span>Public Website</span>
          </Link>

          <Link
            to="/app/dashboard"
            className="btn-primary w-full sm:w-auto text-xs py-2.5 px-5 justify-center shadow-md shadow-emerald-600/20"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Farmer Dashboard</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-emerald-700 font-bold">
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Agri2Value Homepage</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
