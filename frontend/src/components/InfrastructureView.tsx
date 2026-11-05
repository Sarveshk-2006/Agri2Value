// frontend/src/components/InfrastructureView.tsx
import React, { useState, useEffect } from 'react';
import {
  Truck,
  Warehouse,
  Factory,
  CheckCircle2,
  MapPin,
  Sparkles,
  X,
  Thermometer,
  ArrowRight
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
      <div className="card p-6 sm:p-8 space-y-2 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">
                Logistics, Cold Chain & Processing Units
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Find reliable rural transport fleets, multi-commodity cold rooms, and agro-processing facilities with verifiable capacities and pre-agreed service tariffs.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="badge-blue">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nashik Regional Network</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 w-full sm:w-fit overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('logistics')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap flex-shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'logistics'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-600" />
          <span>Transport Fleet ({logistics.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cold-storage')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap flex-shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'cold-storage'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Warehouse className="w-4 h-4 text-blue-600" />
          <span>Cold Storage Hubs ({coldStorage.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('processing')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap flex-shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'processing'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Factory className="w-4 h-4 text-purple-600" />
          <span>Processing Plants ({processing.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 card">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
                  className="card p-6 space-y-4 hover:border-emerald-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{log.provider_name}</h3>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Base: {log.base_district}</span>
                        </div>
                      </div>
                      {log.is_temperature_controlled && (
                        <span className="badge-blue text-[10px]">
                          <Thermometer className="w-3 h-3" />
                          <span>CHILLED</span>
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vehicle Type:</span>
                        <span className="font-bold text-slate-800">{log.vehicle_type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payload Capacity:</span>
                        <span className="font-bold text-slate-900">{log.capacity_kg.toLocaleString()} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Base Tariff:</span>
                        <span className="font-mono font-bold text-emerald-700">₹{log.per_km_rate_per_kg}/km/kg (Min ₹{log.minimum_fare})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Service Area:</span>
                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{log.service_districts}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700">Available</span>
                    <button
                      onClick={() => handleOpenBooking('LOGISTICS', log.id, log.provider_name, log.per_km_rate_per_kg, log.capacity_kg)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      <span>Book Fleet</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sub-tab 2: Cold Storage */}
          {activeSubTab === 'cold-storage' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {coldStorage.map((fac) => (
                <div
                  key={fac.id}
                  className="card p-6 space-y-4 hover:border-blue-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{fac.facility_name}</h3>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{fac.location_taluka}, {fac.location_district}</span>
                        </div>
                      </div>
                      <span className="badge-blue text-[10px]">
                        {fac.temperature_range_celsius}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Available Capacity:</span>
                        <span className="font-bold text-emerald-700">{Math.round(fac.available_capacity_kg / 1000)} MT / {Math.round(fac.total_capacity_kg / 1000)} MT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tariff per Month:</span>
                        <span className="font-mono font-bold text-slate-900">₹{fac.storage_rate_per_kg_per_month} / kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Min Storage Period:</span>
                        <span className="font-medium text-slate-700">{fac.min_holding_days} days</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700">Open for Intake</span>
                    <button
                      onClick={() => handleOpenBooking('COLD_STORAGE', fac.id, fac.facility_name, fac.storage_rate_per_kg_per_month, fac.available_capacity_kg)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      <span>Reserve Cold Space</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sub-tab 3: Processing Plants */}
          {activeSubTab === 'processing' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {processing.map((proc) => (
                <div
                  key={proc.id}
                  className="card p-6 space-y-4 hover:border-purple-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{proc.facility_name}</h3>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{proc.location_taluka}, {proc.location_district}</span>
                        </div>
                      </div>
                      <span className="badge-purple text-[10px]">
                        {proc.facility_type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Daily Intake:</span>
                        <span className="font-bold text-slate-900">{proc.daily_capacity_kg.toLocaleString()} kg/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Service Fee:</span>
                        <span className="font-mono font-bold text-purple-700">₹{proc.processing_charge_per_kg} / kg raw</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Commodity:</span>
                        <span className="font-medium text-slate-700">{proc.accepted_commodities}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Output Product:</span>
                        <span className="font-medium text-slate-800">{proc.output_product_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700">Lines Running</span>
                    <button
                      onClick={() => handleOpenBooking('PROCESSING', proc.id, proc.facility_name, proc.processing_charge_per_kg, proc.daily_capacity_kg)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      <span>Book Line</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Booking Modal */}
      {bookingEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-7 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Reserve Capacity: {bookingEntity.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Category: <strong className="text-slate-800">{bookingEntity.type.replace('_', ' ')}</strong>
                </p>
              </div>
              <button
                onClick={() => setBookingEntity(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{submitSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
                <div>
                  <label className="label">Select Produce Lot to Allocate:</label>
                  <select
                    value={selectedLotId}
                    onChange={(e) => setSelectedLotId(e.target.value)}
                    className="input-field text-xs font-semibold"
                    required
                  >
                    {cropLots.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.crop_name} {l.variety ? `(${l.variety})` : ''} — {Number(l.quantity_kg_normalized).toLocaleString()} kg (Grade {l.quality_grade || 'Ungraded'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Requested Quantity (kg):</label>
                    <input
                      type="number"
                      value={requestedQty}
                      onChange={(e) => setRequestedQty(Number(e.target.value))}
                      max={bookingEntity.capacityAvailable}
                      className="input-field font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Indicative Tariff:</label>
                    <div className="input-field bg-slate-50 font-mono font-bold text-slate-800">
                      ₹{bookingEntity.unitPrice} / unit
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Booking Notes & Logistics Preferences:</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide gate timing or loading dock requirements..."
                    className="input-field resize-none text-xs"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBookingEntity(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs"
                  >
                    {submitting ? 'Submitting...' : 'Confirm Reservation'}
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
