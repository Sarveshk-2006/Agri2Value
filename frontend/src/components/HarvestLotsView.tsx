// frontend/src/components/HarvestLotsView.tsx
import React, { useState } from 'react';
import { Wheat, Plus, CheckCircle, X, Check, ArrowRight } from 'lucide-react';
import type { CropLot, Farm } from '../types';

interface HarvestLotsViewProps {
  cropLots: CropLot[];
  farms: Farm[];
  onCreateLot: (farmId: string, lot: Partial<CropLot>) => Promise<void>;
  isOpenCreateModal: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
  onNavigateToDecision?: (lotId?: string) => void;
  onNavigateToRescue?: (lotId?: string) => void;
}

export const HarvestLotsView: React.FC<HarvestLotsViewProps> = ({
  cropLots,
  farms,
  onCreateLot,
  isOpenCreateModal,
  onCloseCreateModal,
  onOpenCreateModal,
  onNavigateToDecision,
  onNavigateToRescue,
}) => {
  const [selectedFarmId, setSelectedFarmId] = useState(farms[0]?.id || '');
  const [cropName, setCropName] = useState('Tomato');
  const [variety, setVariety] = useState('Abhinav');
  const [quantity, setQuantity] = useState('4000');
  const [quantityUnit, setQuantityUnit] = useState('kg');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [dataMode, setDataMode] = useState<'real' | 'demo'>('demo');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unit multiplier preview
  const unitMultipliers: Record<string, number> = {
    kg: 1,
    quintal: 100,
    tonne: 1000,
    bag: 50,
    maund: 37.3242,
  };

  const calculatedKg = (Number(quantity) || 0) * (unitMultipliers[quantityUnit] || 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) {
      setError('Please select a farm.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onCreateLot(selectedFarmId, {
        crop_name: cropName.trim(),
        variety: variety.trim() || undefined,
        quantity: Number(quantity),
        quantity_unit: quantityUnit,
        quality_grade: qualityGrade,
        harvest_date: new Date(harvestDate).toISOString(),
        data_mode: dataMode,
        notes: notes.trim() || undefined,
      });
      onCloseCreateModal();
    } catch (err: any) {
      setError(err.message || 'Failed to register harvest lot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Wheat className="w-5 h-5 text-emerald-400" />
            <span>Harvest & Crop Lots</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered produce lots with normalized kilogram metrics, quality grades, and audit trail events.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Harvest</span>
        </button>
      </div>

      {/* Crop Lots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cropLots.map((lot) => {
          const farm = farms.find((f) => f.id === lot.farm_id);
          return (
            <div
              key={lot.id}
              className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition-all shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{lot.crop_name}</h3>
                    {lot.variety && (
                      <span className="text-xs text-slate-400">({lot.variety})</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Farm: <span className="text-slate-300 font-medium">{farm?.farm_name || 'Patil Farm'}</span>
                    {farm && <span> • {farm.village}, {farm.district}</span>}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                    lot.data_mode === 'demo'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {lot.data_mode === 'demo' ? 'DEMO SEED' : 'REAL DATA'}
                </span>
              </div>

              {/* Quantity display */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Entered Quantity</div>
                  <div className="text-xl font-mono font-bold text-white mt-0.5">
                    {Number(lot.quantity).toLocaleString()} {lot.quantity_unit}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Normalized (Calculation Base)</div>
                  <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                    = {Number(lot.quantity_kg_normalized).toLocaleString()} kg
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/60">
                  <span className="text-slate-500 block text-[11px]">Quality Grade</span>
                  <span className="font-bold text-emerald-300">Grade {lot.quality_grade || 'Ungraded'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60">
                  <span className="text-slate-500 block text-[11px]">Status</span>
                  <span className="font-semibold text-slate-200">{lot.status}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60">
                  <span className="text-slate-500 block text-[11px]">Harvest Date</span>
                  <span className="text-slate-300">
                    {lot.harvest_date ? new Date(lot.harvest_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {lot.notes && (
                <div className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg font-mono border border-slate-800/60">
                  {lot.notes}
                </div>
              )}

              {/* Event Timeline */}
              {lot.events && lot.events.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Audit Trail Events ({lot.events.length})
                  </div>
                  <div className="space-y-1.5">
                    {lot.events.map((evt, idx) => (
                      <div key={idx} className="text-[11px] text-slate-400 flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono text-slate-300 font-semibold">[{evt.event_type}]</span>{' '}
                          <span>{evt.description}</span>{' '}
                          <span className="text-slate-500 text-[10px]">
                            ({new Date(evt.created_at).toLocaleTimeString()})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                {onNavigateToRescue && (
                  <button
                    onClick={() => onNavigateToRescue(lot.id)}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Crop Rescue</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigateToDecision && onNavigateToDecision(lot.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Evaluate Profit Options</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Harvest Lot Modal */}
      {isOpenCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl glass-panel p-6 sm:p-8 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wheat className="w-5 h-5 text-emerald-400" />
                <span>Register Harvest Lot</span>
              </h2>
              <button
                onClick={onCloseCreateModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Select Farm */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Associated Farm *
                </label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:border-emerald-500"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name} ({f.village}, {f.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Name & Variety */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Crop Name *</label>
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:border-emerald-500"
                  >
                    <option value="Tomato">Tomato (Pilot)</option>
                    <option value="Onion">Onion</option>
                    <option value="Potato">Potato</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Soybean">Soybean</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Variety</label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="e.g. Abhinav"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quantity & Unit with Live Normalization */}
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-slate-100 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Unit *</label>
                    <select
                      value={quantityUnit}
                      onChange={(e) => setQuantityUnit(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:border-emerald-500"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="quintal">Quintal (100 kg)</option>
                      <option value="tonne">Metric Tonne (1,000 kg)</option>
                      <option value="bag">Standard Bag (50 kg)</option>
                      <option value="maund">Maund (37.32 kg)</option>
                    </select>
                  </div>
                </div>

                {/* Normalization preview pill */}
                <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono flex items-center justify-between">
                  <span>Normalized Weight:</span>
                  <span className="font-bold text-sm">
                    {calculatedKg.toLocaleString()} kg
                  </span>
                </div>
              </div>

              {/* Quality Grade & Harvest Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quality Grade</label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:border-emerald-500"
                  >
                    <option value="A">Grade A (Premium / Firm)</option>
                    <option value="B">Grade B (Standard Market)</option>
                    <option value="C">Grade C (Processing Only)</option>
                    <option value="ungraded">Ungraded / Field Run</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Harvest Date</label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Data Provenance Mode */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Data Provenance Label</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs ${
                    dataMode === 'demo' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="dataMode"
                      value="demo"
                      checked={dataMode === 'demo'}
                      onChange={() => setDataMode('demo')}
                      className="text-amber-500"
                    />
                    <span>Demo / Synthetic</span>
                  </label>
                  <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs ${
                    dataMode === 'real' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="dataMode"
                      value="real"
                      checked={dataMode === 'real'}
                      onChange={() => setDataMode('real')}
                      className="text-emerald-500"
                    />
                    <span>Real Harvest</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Firm red harvest ready for Mandi or Puree processing."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:border-emerald-500"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Registering...' : 'Register Harvest Lot'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
