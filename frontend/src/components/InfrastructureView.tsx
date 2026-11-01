// frontend/src/components/InfrastructureView.tsx
import React, { useState, useEffect } from 'react';
import {
  Truck,
  Warehouse,
  Factory,
  CheckCircle2,
  MapPin,
  Send,
  Sparkles,
  ChevronRight,
  X,
  Thermometer,
} from 'lucide-react';
import type { LogisticsProvider, ColdStorageFacility, ProcessingFacility, CropLot } from '../types';
import { api } from '../api';

interface InfrastructureViewProps {
  cropLots: CropLot[];
  onNavigateToExecution?: () => void;
}

type InfraSubTab = 'logistics' | 'cold-storage' | 'processing';

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  cropLots,
  onNavigateToExecution,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<InfraSubTab>('logistics');

  const [logistics, setLogistics] = useState<LogisticsProvider[]>([]);
  const [coldStorage, setColdStorage] = useState<ColdStorageFacility[]>([]);
  const [processing, setProcessing] = useState<ProcessingFacility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Booking Modal
  const [bookingEntity, setBookingEntity] = useState<{
    type: 'LOGISTICS' | 'COLD_STORAGE' | 'PROCESSING';
    id: string;
    name: string;
    unitPrice: number;
    capacityAvailable: number;
  } | null>(null);

  const [selectedLotId, setSelectedLotId] = useState<string>(cropLots[0]?.id || '');
  const [requestedQty, setRequestedQty] = useState<number>(cropLots[0]?.quantity_kg_normalized || 3000);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInfrastructure = async () => {
    setLoading(true);
    try {
      const [fetchedLog, fetchedCold, fetchedProc] = await Promise.all([
        api.getLogisticsProviders(),
        api.getColdStorageFacilities(),
        api.getProcessingFacilities(),
      ]);
      setLogistics(fetchedLog);
      setColdStorage(fetchedCold);
      setProcessing(fetchedProc);
    } catch (err) {
      console.error('Failed to load infrastructure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfrastructure();
  }, []);

  const handleOpenBooking = (
    type: 'LOGISTICS' | 'COLD_STORAGE' | 'PROCESSING',
    id: string,
    name: string,
    unitPrice: number,
    capacityAvailable: number
  ) => {
    setBookingEntity({ type, id, name, unitPrice, capacityAvailable });
    const lot = cropLots[0];
    if (lot) {
      setSelectedLotId(lot.id);
      setRequestedQty(Math.min(capacityAvailable, lot.quantity_kg_normalized));
    }
    setSubmitSuccess(null);
    setError(null);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingEntity || !selectedLotId) return;

    setSubmitting(true);
    setError(null);
    try {
      let routeType = 'LOGISTICS_ONLY';
      let payload: any = {
        crop_lot_id: selectedLotId,
        requested_quantity_kg: requestedQty,
        notes: notes || undefined,
      };

      if (bookingEntity.type === 'LOGISTICS') {
        routeType = 'LOGISTICS_ONLY';
        payload.route_type = routeType;
        payload.logistics_provider_id = bookingEntity.id;
      } else if (bookingEntity.type === 'COLD_STORAGE') {
        routeType = 'COLD_STORAGE';
        payload.route_type = routeType;
        payload.cold_storage_facility_id = bookingEntity.id;
      } else if (bookingEntity.type === 'PROCESSING') {
        routeType = 'PROCESSING';
        payload.route_type = routeType;
        payload.processing_facility_id = bookingEntity.id;
      }

      await api.createExecutionRequest(payload);
      setSubmitSuccess(`Capacity request submitted to ${bookingEntity.name}!`);
      setTimeout(() => {
        setBookingEntity(null);
        if (onNavigateToExecution) onNavigateToExecution();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit reservation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-indigo-950/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Truck className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Logistics, Cold Chain & Processing Units
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Find reliable rural transport fleets, multi-commodity cold rooms, and agro-processing facilities
              with verifiable capacities and pre-agreed service tariffs.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nashik Regional Network</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('logistics')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'logistics'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Transport Fleet ({logistics.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cold-storage')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'cold-storage'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Cold Storage Hubs ({coldStorage.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('processing')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'processing'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Processing Plants ({processing.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Retrieving logistics fleet, cold rooms, and processing units...</p>
        </div>
      ) : (
        <>
          {/* Sub-tab 1: Logistics */}
          {activeSubTab === 'logistics' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {logistics.map((log) => (
            <div
              key={log.id}
              className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{log.provider_name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Base: {log.base_district}</span>
                  </div>
                </div>
                {log.is_temperature_controlled && (
                  <span className="p-1.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
                    <Thermometer className="w-3 h-3" />
                    <span>CHILLED</span>
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle Type:</span>
                  <span className="font-semibold text-slate-200">{log.vehicle_type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payload Capacity:</span>
                  <span className="font-bold text-white">{log.capacity_kg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Now:</span>
                  <span className="font-bold text-emerald-400">{log.current_available_capacity_kg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tariff:</span>
                  <span className="font-semibold text-slate-300">₹{log.per_km_rate_per_kg}/kg/km (Min: ₹{log.minimum_fare})</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                <span>Coverage: </span>
                <span className="text-slate-300">{log.service_districts}</span>
              </div>

              <button
                onClick={() =>
                  handleOpenBooking(
                    'LOGISTICS',
                    log.id,
                    log.provider_name,
                    Number(log.per_km_rate_per_kg),
                    log.current_available_capacity_kg
                  )
                }
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Book Vehicle</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab 2: Cold Storage */}
      {activeSubTab === 'cold-storage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {coldStorage.map((cold) => (
            <div
              key={cold.id}
              className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{cold.facility_name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{cold.location_taluka}, {cold.location_district}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {cold.availability_status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Storage Tariff</div>
                  <div className="text-sm font-bold text-white mt-0.5">₹{cold.storage_rate_per_kg_per_month}/kg/mo</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Available Space</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{cold.available_capacity_kg.toLocaleString()} kg</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Temperature Control:</span>
                  <span className="text-cyan-300 font-mono">{cold.temperature_range_celsius}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Humidity Regulated:</span>
                  <span className="text-cyan-300 font-mono">{cold.humidity_range_pct}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Holding Duration:</span>
                  <span className="text-slate-300">{cold.min_holding_days} to {cold.max_holding_days} days</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                <span>Compatible Crops: </span>
                <span className="text-slate-300">{cold.compatible_commodities}</span>
              </div>

              <button
                onClick={() =>
                  handleOpenBooking(
                    'COLD_STORAGE',
                    cold.id,
                    cold.facility_name,
                    Number(cold.storage_rate_per_kg_per_month),
                    cold.available_capacity_kg
                  )
                }
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-950/50"
              >
                <span>Reserve Cold Room Space</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab 3: Processing Plants */}
      {activeSubTab === 'processing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {processing.map((proc) => (
            <div
              key={proc.id}
              className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/50 hover:border-cyan-500/30 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{proc.facility_name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{proc.location_taluka}, {proc.location_district}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {proc.availability_status}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Technology:</span>
                  <span className="font-bold text-white">{proc.facility_type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Processing Charge:</span>
                  <span className="font-bold text-emerald-400">₹{proc.processing_charge_per_kg} / kg raw</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily Intake Capacity:</span>
                  <span className="text-slate-200">{proc.daily_capacity_kg.toLocaleString()} kg (Avail: {proc.available_capacity_kg.toLocaleString()} kg)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Finished Product:</span>
                  <span className="text-amber-300 font-semibold">{proc.output_product_name}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Yield Recovery Ratio:</span>
                  <span className="text-slate-300 font-mono">{(proc.output_recovery_ratio * 100).toFixed(0)}% output weight</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                <span>Accepted Raw Input: </span>
                <span className="text-slate-300">{proc.accepted_commodities} (Grades: {proc.accepted_grades})</span>
              </div>

              <button
                onClick={() =>
                  handleOpenBooking(
                    'PROCESSING',
                    proc.id,
                    proc.facility_name,
                    Number(proc.processing_charge_per_kg),
                    proc.available_capacity_kg
                  )
                }
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-950/50"
              >
                <span>Dispatch for Value-Addition</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* Booking Modal */}
      {bookingEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl glass-panel border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Book Infrastructure Capacity</h3>
                <p className="text-xs text-slate-400 font-medium text-cyan-400">{bookingEntity.name}</p>
              </div>
              <button
                onClick={() => setBookingEntity(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1">Select Harvest Lot</label>
                  <select
                    value={selectedLotId}
                    onChange={(e) => {
                      setSelectedLotId(e.target.value);
                      const l = cropLots.find((lot) => lot.id === e.target.value);
                      if (l) setRequestedQty(Math.min(bookingEntity.capacityAvailable, l.quantity_kg_normalized));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    required
                  >
                    {cropLots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.crop_name} ({lot.quantity_kg_normalized} kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Volume to Reserve (kg)</label>
                  <input
                    type="number"
                    value={requestedQty}
                    onChange={(e) => setRequestedQty(Number(e.target.value))}
                    max={bookingEntity.capacityAvailable}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Available facility slot: {bookingEntity.capacityAvailable.toLocaleString()} kg
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Booking Notes / Desired Timing</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Inbound delivery needed by Thursday morning; crates loaded."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingEntity(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-950/60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Confirm Request'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
