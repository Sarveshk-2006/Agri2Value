// frontend/src/components/WeatherSprayWidget.tsx
import React, { useEffect, useState } from 'react';
import { 
  CloudSun, 
  Wind, 
  Droplets, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { api } from '../api';
import type { WeatherResponse } from '../types';

interface WeatherSprayWidgetProps {
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export const WeatherSprayWidget: React.FC<WeatherSprayWidgetProps> = ({
  latitude = 20.0768,
  longitude = 74.0375,
  locationName = 'Niphad, Nashik',
}) => {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getWeather(latitude, longitude);
      setWeather(data);
    } catch {
      setError('Unable to load meteorological data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [latitude, longitude]);

  if (loading && !weather) {
    return (
      <div className="glass-card rounded-xl p-5 border border-slate-800 animate-pulse flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-slate-800 rounded" />
          <div className="h-6 w-36 bg-slate-800 rounded" />
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-800" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="glass-card rounded-xl p-5 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Local Weather Feed Degraded ({locationName})</span>
        </div>
        <button
          onClick={fetchWeather}
          className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { current, advisory } = weather;

  // Badge styling based on advisory status
  const badgeConfig = {
    FAVORABLE: {
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/40',
      text: 'text-emerald-300',
      icon: CheckCircle2,
      label: 'Favorable for Field Operations',
    },
    CAUTION: {
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/40',
      text: 'text-amber-300',
      icon: AlertTriangle,
      label: 'Caution: Check Spray Drift & Foliage',
    },
    UNFAVORABLE: {
      bg: 'bg-rose-500/15',
      border: 'border-rose-500/40',
      text: 'text-rose-300',
      icon: XCircle,
      label: 'Field Operations Discouraged',
    },
    UNKNOWN: {
      bg: 'bg-slate-500/15',
      border: 'border-slate-500/40',
      text: 'text-slate-300',
      icon: Info,
      label: 'Advisory Pending',
    },
  }[advisory.status] || {
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/40',
    text: 'text-slate-300',
    icon: Info,
    label: 'Advisory Pending',
  };

  const BadgeIcon = badgeConfig.icon;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/90 shadow-lg space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CloudSun className="w-3.5 h-3.5 text-teal-400" />
              <span>Observed Microclimate • {locationName}</span>
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              weather.is_live
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {weather.is_live ? 'LIVE API' : 'OFFLINE REFERENCE'}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-2xl font-black text-white font-mono">
              {Math.round(current.temperature_c)}°C
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-1">
              <span>{current.weather_icon}</span>
              <span>{current.weather_description}</span>
              <span className="text-slate-500">(Feels {Math.round(current.apparent_temperature_c)}°C)</span>
            </span>
          </div>
        </div>

        <button
          onClick={fetchWeather}
          title="Refresh meteorological observation"
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sensor Metrics Row */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/60 text-xs">
        <div className="flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-500">Humidity</div>
            <div className="font-semibold text-slate-200">{Math.round(current.relative_humidity_pct)}%</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-500">Wind (10m)</div>
            <div className="font-semibold text-slate-200">{current.wind_speed_kmh} km/h</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-500">Rainfall</div>
            <div className="font-semibold text-slate-200">{current.rain_mm} mm</div>
          </div>
        </div>
      </div>

      {/* Field Work Advisory Banner */}
      <div className={`p-3 rounded-xl border ${badgeConfig.bg} ${badgeConfig.border} space-y-1.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-xs">
            <BadgeIcon className={`w-4 h-4 shrink-0 ${badgeConfig.text}`} />
            <span className={badgeConfig.text}>{badgeConfig.label}</span>
          </div>
          <button
            onClick={() => setShowDisclaimer(!showDisclaimer)}
            className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer flex items-center gap-0.5"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Advisory Disclaimer</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {advisory.headline}
        </p>

        {advisory.reasons && advisory.reasons.length > 0 && (
          <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
            {advisory.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}

        {showDisclaimer && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-amber-300/90 italic leading-snug">
            {advisory.disclaimer}
          </div>
        )}
      </div>

      {/* Attribution Footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
        <span>{weather.attribution}</span>
        <span className="font-mono">Obs: {new Date(current.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};
