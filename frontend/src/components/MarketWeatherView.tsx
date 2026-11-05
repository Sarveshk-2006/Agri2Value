// frontend/src/components/MarketWeatherView.tsx
import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  CloudSun, 
  Search, 
  RefreshCw, 
  Sparkles,
  ArrowRight
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="badge-blue mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Phase 2.6 External Intelligence Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-3">
            <span>Market & Meteorological Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Live and verified APMC Mandi commodity rates paired with microclimate forecasting for Nashik horticultural belts. Strictly audited for unit consistency and provenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadWeather(); loadMandi(); }}
            className="btn-secondary text-xs sm:text-sm py-2 px-3.5"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${loadingWeather || loadingMandi ? 'animate-spin' : ''}`} />
            <span>Refresh Feeds</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: METEOROLOGICAL INTELLIGENCE & SPRAY ADVISORY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
            <CloudSun className="w-5 h-5 text-emerald-600" />
            <span>Local Microclimate & Field Operations Advisory</span>
          </h2>
          {weather && (
            <span className="text-xs text-slate-500 font-mono font-medium">
              Station: Niphad, Nashik (20.08°N, 74.04°E)
            </span>
          )}
        </div>

        {weather ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Current Observed Conditions Card */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="label text-[10px] mb-0">Observed Readings</span>
                <span className={weather.is_live ? 'badge-green text-[10px]' : 'badge-slate text-[10px]'}>
                  {weather.is_live ? 'LIVE OPEN-METEO' : 'OFFLINE REFERENCE'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-black text-slate-900 font-mono">
                    {Math.round(weather.current.temperature_c)}°C
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-semibold">
                    <span className="text-xl">{weather.current.weather_icon}</span>
                    <span>{weather.current.weather_description}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono space-y-1">
                  <div>Feels like: <strong className="text-slate-800">{Math.round(weather.current.apparent_temperature_c)}°C</strong></div>
                  <div>Humidity: <strong className="text-blue-600">{weather.current.relative_humidity_pct}%</strong></div>
                  <div>Wind (10m): <strong className="text-emerald-700">{weather.current.wind_speed_kmh} km/h</strong></div>
                  <div>Precipitation: <strong className="text-slate-800">{weather.current.precipitation_mm} mm</strong></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Observed: {new Date(weather.current.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="font-mono">Ingested: {new Date(weather.retrieved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Field Work & Spray Advisory Card (2 cols) */}
            <div className="lg:col-span-2 card p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="label text-[10px] mb-0">Field Operations Guidance</span>
                    <span className={
                      weather.advisory.status === 'FAVORABLE'
                        ? 'badge-green'
                        : weather.advisory.status === 'CAUTION'
                        ? 'badge-yellow'
                        : 'badge-red'
                    }>
                      {weather.advisory.status}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setShowAdvisoryDisclaimer(!showAdvisoryDisclaimer)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                  >
                    Statutory Disclaimer
                  </button>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-slate-900">
                    {weather.advisory.headline}
                  </h3>
                  <ul className="mt-2 text-xs text-slate-600 space-y-1 list-disc list-inside">
                    {weather.advisory.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {showAdvisoryDisclaimer && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed font-sans">
                  <strong>Notice:</strong> {weather.advisory.disclaimer}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Attribution: {weather.attribution}</span>
                <span className="text-emerald-700 font-bold">FastAPI Backend Proxy Active</span>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-8 rounded-2xl card text-center text-slate-400">Loading weather feeds...</div>
        )}

        {/* 7-Day Forecast Strip */}
        {weather && weather.daily_forecast && weather.daily_forecast.length > 0 && (
          <div className="card p-5">
            <div className="label text-[10px] mb-3">
              7-Day Horticultural Microclimate Forecast (Open-Meteo High-Resolution Model)
            </div>
            <div className="flex overflow-x-auto gap-3 pb-2 md:grid md:grid-cols-7 no-scrollbar">
              {weather.daily_forecast.map((day, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1 hover:bg-emerald-50/50 transition-colors shrink-0 w-32 md:w-auto">
                  <div className="text-xs font-bold text-slate-700">
                    {new Date(day.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-2xl my-1">{day.weather_icon}</div>
                  <div className="text-xs font-black text-slate-900 font-mono">
                    {Math.round(day.temp_max_c)}° / <span className="text-slate-400 font-normal">{Math.round(day.temp_min_c)}°</span>
                  </div>
                  <div className="text-[10px] text-blue-600 font-medium">
                    {day.precipitation_sum_mm > 0 ? `${day.precipitation_sum_mm} mm rain` : 'No rain'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Wind: {Math.round(day.max_wind_speed_kmh)} km/h
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: APMC MANDI COMMODITY BENCHMARK RATES */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Maharashtra APMC Mandi Rate Intelligence</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Source: Data.gov.in / Agmarknet • Converted from standard Quintal auctions to INR per Kilogram.
            </p>
          </div>

          {/* Search & Commodity Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mandi, crop, district..."
                className="input-field pl-9 py-2 text-xs w-full"
              />
            </div>

            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="input-field py-2 text-xs w-full sm:w-40 font-semibold"
            >
              {uniqueCommodities.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── Mobile Card View (< 768px) ─── */}
        <div className="md:hidden space-y-3">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((r, idx) => (
              <div key={idx} className="card p-4 space-y-3 hover:border-emerald-300">
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{r.commodity}</h3>
                    <p className="text-xs text-slate-500">{r.variety || 'Standard Grade'}</p>
                  </div>
                  <span className={r.is_live ? 'badge-green text-[10px]' : 'badge-yellow text-[10px]'}>
                    {r.is_live ? 'LIVE AGMARKNET' : 'CANONICAL DEMO'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="label text-[9px] mb-0.5">APMC Mandi</span>
                    <div className="font-bold text-slate-900">{r.market}</div>
                    <div className="text-[10px] text-slate-500">{r.district}, {r.state}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100">
                    <span className="label text-[9px] mb-0.5 text-emerald-900">Modal Rate</span>
                    <div className="text-base font-black font-mono text-emerald-800">
                      ₹{r.normalized_modal_price_per_kg ? r.normalized_modal_price_per_kg.toFixed(2) : (r.modal_price / 100).toFixed(2)} / kg
                    </div>
                    <div className="text-[10px] text-emerald-700">₹{r.modal_price.toLocaleString()} / Qtl</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>Recorded: {r.observation_date}</span>
                  {onNavigateToDecision && (
                    <button
                      onClick={onNavigateToDecision}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                    >
                      <span>Run Profit Engine</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card p-8 text-center text-slate-400 text-xs">
              No mandi records match your filter criteria.
            </div>
          )}
        </div>

        {/* ─── Desktop Mandi Records Table (>= 768px) ─── */}
        <div className="hidden md:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Commodity & Variety</th>
                  <th className="p-3">Mandi / District</th>
                  <th className="p-3 text-right">Modal Rate (/kg)</th>
                  <th className="p-3 text-right">Auction Range (/Qtl)</th>
                  <th className="p-3">Observation Date</th>
                  <th className="p-3">Data Provenance</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900 text-sm">{r.commodity}</div>
                        <div className="text-[11px] text-slate-500">{r.variety || 'Standard'}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{r.market}</div>
                        <div className="text-[11px] text-slate-500">{r.district}, {r.state}</div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-base font-black font-mono text-emerald-700">
                          ₹{r.normalized_modal_price_per_kg ? r.normalized_modal_price_per_kg.toFixed(2) : (r.modal_price / 100).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">per kg normalized</div>
                      </td>
                      <td className="p-3 text-right font-mono">
                        <div className="text-xs text-slate-800 font-bold">
                          ₹{r.min_price.toLocaleString()} – ₹{r.max_price.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">₹{r.modal_price.toLocaleString()} / Quintal</div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-slate-800">{r.observation_date}</div>
                        <div className="text-[10px] text-slate-400">Recorded yard auction</div>
                      </td>
                      <td className="p-3">
                        <span className={r.is_live ? 'badge-green' : 'badge-yellow'}>
                          {r.is_live ? 'LIVE AGMARKNET' : 'CANONICAL DEMO'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {onNavigateToDecision && (
                          <button
                            onClick={onNavigateToDecision}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                          >
                            <span>Evaluate</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No mandi commodity records matched your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
