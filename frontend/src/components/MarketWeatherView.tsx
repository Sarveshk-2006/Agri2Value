// frontend/src/components/MarketWeatherView.tsx
import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  CloudSun, 
  Search, 
  RefreshCw, 
  MapPin, 
  Calendar, 
  Cpu, 
  Sparkles 
} from 'lucide-react';
import { api } from '../api';
import type { 
  WeatherResponse, 
  MandiPricesResponse, 
  MandiRecord 
} from '../types';

interface MarketWeatherViewProps {
  onNavigateToDecision?: () => void;
}

export const MarketWeatherView: React.FC<MarketWeatherViewProps> = ({
  onNavigateToDecision,
}) => {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [mandiData, setMandiData] = useState<MandiPricesResponse | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingMandi, setLoadingMandi] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('All');
  const [showAdvisoryDisclaimer, setShowAdvisoryDisclaimer] = useState(false);

  const loadWeather = async () => {
    try {
      setLoadingWeather(true);
      const res = await api.getWeather(20.0768, 74.0375); // Niphad, Nashik
      setWeather(res);
    } catch (e) {
      console.error('Weather error:', e);
    } finally {
      setLoadingWeather(false);
    }
  };

  const loadMandi = async () => {
    try {
      setLoadingMandi(true);
      const res = await api.getMandiPrices('Maharashtra');
      setMandiData(res);
    } catch (e) {
      console.error('Mandi error:', e);
    } finally {
      setLoadingMandi(false);
    }
  };

  useEffect(() => {
    loadWeather();
    loadMandi();
  }, []);

  // Filtered mandi records
  const records: MandiRecord[] = mandiData?.records || [];
  const filteredRecords = records.filter(r => {
    const term = search.toLowerCase();
    const matchSearch = (
      r.commodity.toLowerCase().includes(term) ||
      r.market.toLowerCase().includes(term) ||
      r.district.toLowerCase().includes(term) ||
      (r.variety && r.variety.toLowerCase().includes(term))
    );
    const matchCommodity = selectedCommodity === 'All' || r.commodity.toLowerCase() === selectedCommodity.toLowerCase();
    return matchSearch && matchCommodity;
  });

  const uniqueCommodities = ['All', ...new Set(records.map(r => r.commodity))];

  return (
    <div className="space-y-8">
      
      {/* Page Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Phase 2.6 External Intelligence Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Market & Meteorological Intelligence</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Live and verified APMC mandi commodity prices paired with microclimate forecasting for Nashik horticultural belts. Strictly audited for unit consistency and provenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadWeather(); loadMandi(); }}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/40 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loadingWeather || loadingMandi ? 'animate-spin' : ''}`} />
            <span>Refresh Feeds</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: METEOROLOGICAL INTELLIGENCE & SPRAY ADVISORY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-teal-400" />
            <span>Local Microclimate & Field Operations Advisory</span>
          </h2>
          {weather && (
            <span className="text-xs text-slate-400 font-mono">
              Station: Niphad, Nashik (20.08°N, 74.04°E)
            </span>
          )}
        </div>

        {weather ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Current Observed Conditions Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Observed Readings
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  weather.is_live
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {weather.is_live ? 'LIVE OPEN-METEO' : 'OFFLINE REFERENCE'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-black text-white font-mono">
                    {Math.round(weather.current.temperature_c)}°C
                  </div>
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                    <span className="text-lg">{weather.current.weather_icon}</span>
                    <span className="font-medium">{weather.current.weather_description}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono space-y-1">
                  <div>Feels like: <strong className="text-slate-200">{Math.round(weather.current.apparent_temperature_c)}°C</strong></div>
                  <div>Humidity: <strong className="text-cyan-400">{weather.current.relative_humidity_pct}%</strong></div>
                  <div>Wind (10m): <strong className="text-teal-400">{weather.current.wind_speed_kmh} km/h</strong></div>
                  <div>Precipitation: <strong className="text-slate-200">{weather.current.precipitation_mm} mm</strong></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Observed at: {new Date(weather.current.observed_at).toLocaleString()}</span>
                <span>Ingested: {new Date(weather.retrieved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Field Work & Spray Advisory Card (2 cols) */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Agricultural Decision Guidance
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      weather.advisory.status === 'FAVORABLE'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : weather.advisory.status === 'CAUTION'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    }`}>
                      {weather.advisory.status}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setShowAdvisoryDisclaimer(!showAdvisoryDisclaimer)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Statutory Disclaimer
                  </button>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-white">
                    {weather.advisory.headline}
                  </h3>
                  <ul className="mt-2 text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {weather.advisory.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {showAdvisoryDisclaimer && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed font-sans">
                  <strong>Notice:</strong> {weather.advisory.disclaimer}
                </div>
              )}

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Attribution: {weather.attribution}</span>
                <span className="text-emerald-400 font-medium">Backend Proxy Active</span>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-8 rounded-2xl glass-panel text-center text-slate-400">Loading weather...</div>
        )}

        {/* 7-Day Forecast Strip */}
        {weather && weather.daily_forecast && weather.daily_forecast.length > 0 && (
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 overflow-x-auto no-scrollbar">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              7-Day Horticultural Forecast (Open-Meteo Atmospheric Model)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 min-w-[650px]">
              {weather.daily_forecast.map((day, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center space-y-1">
                  <div className="text-xs font-semibold text-slate-300">
                    {new Date(day.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-2xl my-1">{day.weather_icon}</div>
                  <div className="text-xs font-bold text-white font-mono">
                    {Math.round(day.temp_max_c)}° / <span className="text-slate-400 font-normal">{Math.round(day.temp_min_c)}°</span>
                  </div>
                  <div className="text-[10px] text-cyan-400">
                    {day.precipitation_sum_mm > 0 ? `${day.precipitation_sum_mm} mm rain` : 'No rain'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Wind: {day.max_wind_speed_kmh} km/h
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: VERIFIED APMC MANDI PRICES */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Verified APMC Mandi Rates & Market Yard Bulletins</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Source: Data.gov.in / Agmarknet (Resource ID: 9ef84268-d588-465a-a308-a864a43d0070). Quoted in ₹/Quintal and normalized to INR/kg.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              mandiData?.is_live
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {mandiData?.is_live ? 'LIVE AGMARKNET API' : 'CURATED BENCHMARK ARCHIVE'}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by commodity, APMC market yard, or district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {uniqueCommodities.map((comm) => (
              <button
                key={comm}
                onClick={() => setSelectedCommodity(comm)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCommodity === comm
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/60'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {comm}
              </button>
            ))}
          </div>
        </div>

        {/* Mandi Prices Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Market & District</th>
                  <th className="py-3.5 px-4">Commodity & Variety</th>
                  <th className="py-3.5 px-4">Observation Date</th>
                  <th className="py-3.5 px-4">Source Price (₹/Quintal)</th>
                  <th className="py-3.5 px-4">Normalized Rate (₹/kg)</th>
                  <th className="py-3.5 px-4">Provenance</th>
                  <th className="py-3.5 px-4 text-right">Decision Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{r.market}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{r.district}, {r.state}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{r.commodity}</div>
                        <div className="text-[11px] text-slate-400">{r.variety || 'Standard Auction Grade'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{r.observation_date}</span>
                        </div>
                        {r.is_stale && (
                          <span className="text-[10px] text-amber-400 font-medium">
                            Stale (&gt; 7 days)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-200">
                          Modal: <strong>₹{r.modal_price.toLocaleString()}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Range: ₹{r.min_price} – ₹{r.max_price}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {r.unit_normalized && r.normalized_modal_price_per_kg ? (
                          <div>
                            <span className="text-sm font-bold text-emerald-400 font-mono">
                              ₹{Number(r.normalized_modal_price_per_kg).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">/kg</span>
                          </div>
                        ) : (
                          <span className="text-amber-400 text-[11px]">Unnormalized ({r.source_unit})</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${r.is_live ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <span className="text-[11px] text-slate-300">
                            {r.is_live ? 'Data.gov.in Live' : 'Curated Bulletin'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]" title={r.data_source}>
                          {r.data_source}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {onNavigateToDecision && (
                          <button
                            onClick={onNavigateToDecision}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            <span>Evaluate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No matching mandi rate records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>{mandiData?.disclaimer}</span>
            <span className="font-mono text-slate-500">Total Records: {filteredRecords.length}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
