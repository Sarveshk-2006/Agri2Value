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
      <div className="card p-5 animate-pulse flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="h-6 w-36 bg-slate-200 rounded" />
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-200" />
      </div>
    );
  }

  if (error || !weather || !weather.current || !weather.advisory) {
    return (
      <div className="card p-5 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-600 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Local Weather Feed Degraded ({locationName})</span>
        </div>
        <button
          onClick={fetchWeather}
          className="text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const current = weather.current || {
    temperature_c: 28.4,
    apparent_temperature_c: 29.1,
    relative_humidity_pct: 62,
    wind_speed_kmh: 12.8,
    precipitation_mm: 0,
    rain_mm: 0,
    weather_icon: '☀️',
    weather_description: 'Mainly Clear & Sunny',
  };

  const advisory = weather.advisory || {
    status: 'FAVORABLE',
    headline: 'Optimal Harvesting Conditions in Niphad Basin',
    reasons: ['Morning humidity levels support operations', 'Solar radiation intensity optimal'],
    disclaimer: 'Based on IMD Agromet automated guidance models.',
  };

  const badgeConfigMap = {
    FAVORABLE: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: CheckCircle2,
      label: 'Favorable for Field Operations',
    },
    CAUTION: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: AlertTriangle,
      label: 'Caution: Check Spray Drift & Foliage',
    },
    UNFAVORABLE: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      icon: XCircle,
      label: 'Field Operations Discouraged',
    },
    UNKNOWN: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-800',
      icon: Info,
      label: 'Advisory Pending',
    },
  };

  const statusKey = ((advisory && advisory.status) || 'UNKNOWN') as keyof typeof badgeConfigMap;
  const badgeConfig = badgeConfigMap[statusKey] || badgeConfigMap.UNKNOWN;
  const BadgeIcon = badgeConfig.icon;

  return (
    <div className="card p-6 space-y-4 h-full flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-[10px] mb-0 flex items-center gap-1.5">
              <CloudSun className="w-3.5 h-3.5 text-emerald-600" />
              <span>Microclimate • {locationName}</span>
            </span>
            <span className={weather.is_live ? 'badge-green text-[10px]' : 'badge-slate text-[10px]'}>
              {weather.is_live ? 'LIVE OPEN-METEO' : 'OFFLINE REFERENCE'}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {Math.round(current.temperature_c)}°C
            </span>
            <span className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
              <span className="text-lg">{current.weather_icon}</span>
              <span>{current.weather_description}</span>
              <span className="text-slate-400 font-normal">(Feels {Math.round(current.apparent_temperature_c)}°C)</span>
            </span>
          </div>
        </div>

        <button
          onClick={fetchWeather}
          title="Refresh meteorological observation"
          className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sensor Metrics Row */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <div className="label text-[9px] mb-0">Humidity</div>
            <div className="font-extrabold text-slate-800">{Math.round(current.relative_humidity_pct)}%</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <div className="label text-[9px] mb-0">Wind (10m)</div>
            <div className="font-extrabold text-slate-800">{current.wind_speed_kmh} km/h</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <div className="label text-[9px] mb-0">Precipitation</div>
            <div className="font-extrabold text-slate-800">{current.rain_mm} mm</div>
          </div>
        </div>
      </div>

      {/* Field Work Advisory Banner */}
      <div className={`p-4 rounded-xl border ${badgeConfig.bg} ${badgeConfig.border} space-y-1.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs">
            <BadgeIcon className={`w-4 h-4 shrink-0 ${badgeConfig.text}`} />
            <span className={badgeConfig.text}>{badgeConfig.label}</span>
          </div>
          <button
            onClick={() => setShowDisclaimer(!showDisclaimer)}
            className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer flex items-center gap-0.5"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Advisory Notice</span>
          </button>
        </div>

        <p className="text-xs text-slate-800 leading-relaxed font-medium">
          {advisory.headline}
        </p>

        {advisory.reasons && advisory.reasons.length > 0 && (
          <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
            {advisory.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}

        {showDisclaimer && (
          <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-amber-900 italic leading-snug">
            {advisory.disclaimer}
          </div>
        )}
      </div>

      {/* Attribution Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>{weather.attribution}</span>
        <span className="font-mono">Observed: {new Date(current.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};
