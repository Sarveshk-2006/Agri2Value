// frontend/src/components/HarvestLotsView.tsx
import React, { useState } from 'react';
import { Wheat, Plus, CheckCircle, X, ArrowRight, Flame, Sparkles } from 'lucide-react';
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
  const [dataMode] = useState<'real' | 'demo'>('demo');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Wheat className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">
              Harvest & Crop Lots
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered produce lots with normalized kilogram metrics, quality grades, and audit trail events.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="btn-primary self-start sm:self-auto"
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
              className="card p-6 space-y-4 hover:border-emerald-300"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900">{lot.crop_name}</h3>
                    {lot.variety && (
                      <span className="text-xs font-semibold text-slate-500">({lot.variety})</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Farm: <span className="text-slate-800 font-semibold">{farm?.farm_name || 'Patil Farm'}</span>
                    {farm && <span> • {farm.village}, {farm.district}</span>}
                  </div>
                </div>

                <span
                  className={lot.data_mode === 'demo' ? 'badge-yellow' : 'badge-green'}
                >
                  {lot.data_mode === 'demo' ? 'DEMO SEED' : 'REAL DATA'}
                </span>
              </div>

              {/* Quantity display */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="label text-[10px] mb-0.5">Entered Quantity</div>
                  <div className="text-xl font-mono font-black text-slate-900">
                    {Number(lot.quantity).toLocaleString()} {lot.quantity_unit}
                  </div>
                </div>
                <div className="text-right">
                  <div className="label text-[10px] mb-0.5 text-emerald-800">Normalized Base</div>
                  <div className="text-base font-mono font-black text-emerald-700">
                    = {Number(lot.quantity_kg_normalized).toLocaleString()} kg
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="label text-[9px] mb-0.5">Quality Grade</span>
                  <span className="font-extrabold text-emerald-700">Grade {lot.quality_grade || 'Ungraded'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="label text-[9px] mb-0.5">Status</span>
                  <span className="font-bold text-slate-800">{lot.status}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="label text-[9px] mb-0.5">Harvest Date</span>
                  <span className="font-semibold text-slate-700">
                    {lot.harvest_date ? new Date(lot.harvest_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {lot.notes && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl font-mono border border-slate-200/60 leading-relaxed">
                  {lot.notes}
                </div>
              )}

              {/* Event Timeline */}
              {lot.events && lot.events.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="label text-[10px] mb-2">
                    Audit Trail Events ({lot.events.length})
                  </div>
                  <div className="space-y-1.5">
                    {lot.events.map((evt, idx) => (
                      <div key={idx} className="text-[11px] text-slate-600 flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono text-slate-800 font-bold">[{evt.event_type}]</span>{' '}
                          <span>{evt.description}</span>{' '}
                          <span className="text-slate-400 text-[10px]">
                            ({new Date(evt.created_at).toLocaleTimeString()})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                {onNavigateToRescue && (
                  <button
                    onClick={() => onNavigateToRescue(lot.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer active:scale-98"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>Crop Rescue</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigateToDecision && onNavigateToDecision(lot.id)}
                  className="btn-primary text-xs py-2 px-3.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Profit Options</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Harvest Lot Modal */}
      {isOpenCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
                <Wheat className="w-5 h-5 text-amber-600" />
                <span>Register Harvest Lot</span>
              </h2>
              <button
                onClick={onCloseCreateModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Associated Farm *</label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="input-field"
                  required
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name} ({f.village}, {f.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    placeholder="e.g. Tomato"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Variety</label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="e.g. Abhinav"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select
                    value={quantityUnit}
                    onChange={(e) => setQuantityUnit(e.target.value)}
                    className="input-field"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="quintal">Quintal (100 kg)</option>
                    <option value="tonne">Metric Tonne (1,000 kg)</option>
                    <option value="bag">Crates / Bags (50 kg)</option>
                    <option value="maund">Maund (37.32 kg)</option>
                  </select>
                </div>
              </div>

              {/* Real-time normalized preview */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <span className="text-emerald-800 font-semibold">Normalized base for calculations:</span>
                <span className="font-mono font-extrabold text-emerald-900 text-sm">
                  {calculatedKg.toLocaleString()} kg
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quality Grade</label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="input-field font-semibold"
                  >
                    <option value="A">Grade A (Export / Retail Fresh)</option>
                    <option value="B">Grade B (Standard Market)</option>
                    <option value="C">Grade C (Processing / Saucing)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Harvest Date</label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes / Storage Condition</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Harvested at morning cool hours, packed in crates, shaded shed storage."
                  className="input-field resize-none text-xs"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs"
                >
                  {loading ? 'Registering...' : 'Register Harvest'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
