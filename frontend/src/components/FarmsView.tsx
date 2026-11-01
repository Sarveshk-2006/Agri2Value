// frontend/src/components/FarmsView.tsx
import React, { useState } from 'react';
import { Home, Plus, MapPin, Wrench, X, Check } from 'lucide-react';
import type { Farm } from '../types';

interface FarmsViewProps {
  farms: Farm[];
  onCreateFarm: (farm: Partial<Farm>) => Promise<void>;
  isOpenCreateModal: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
}

export const FarmsView: React.FC<FarmsViewProps> = ({
  farms,
  onCreateFarm,
  isOpenCreateModal,
  onCloseCreateModal,
  onOpenCreateModal,
}) => {
  // Form state
  const [farmName, setFarmName] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Nashik');
  const [village, setVillage] = useState('Niphad');
  const [landArea, setLandArea] = useState('3.5');
  const [landAreaUnit, setLandAreaUnit] = useState('acre');
  const [latitude, setLatitude] = useState('20.0768');
  const [longitude, setLongitude] = useState('74.0375');

  // Resource inputs
  const [resources, setResources] = useState<Array<{ resource_type: string; name: string; quantity?: number; unit?: string }>>([
    { resource_type: 'storage', name: 'On-farm Shaded Shed', quantity: 2000, unit: 'kg' },
    { resource_type: 'equipment', name: 'Harvesting Crates', quantity: 60, unit: 'crates' }
  ]);
  const [resType, setResType] = useState('storage');
  const [resName, setResName] = useState('');
  const [resQty, setResQty] = useState('');
  const [resUnit, setResUnit] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addResource = () => {
    if (!resName.trim()) return;
    setResources([...resources, {
      resource_type: resType,
      name: resName.trim(),
      quantity: resQty ? Number(resQty) : undefined,
      unit: resUnit.trim() || undefined,
    }]);
    setResName('');
    setResQty('');
    setResUnit('');
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onCreateFarm({
        farm_name: farmName.trim(),
        state: state.trim(),
        district: district.trim(),
        village: village.trim(),
        land_area: landArea ? Number(landArea) : undefined,
        land_area_unit: landAreaUnit,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        resources: resources.map(r => ({
          ...r,
          id: 'res-' + Math.random().toString(36).substring(2, 7),
          availability_status: 'available',
        })),
      });
      onCloseCreateModal();
      // reset form
      setFarmName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create farm');
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
            <Home className="w-5 h-5 text-emerald-400" />
            <span>Farm Profiles & Land Holdings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your land holdings and on-farm resources (storage, equipment, labour) for feasibility verification.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Farm</span>
        </button>
      </div>

      {/* Farms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {farms.map((farm) => (
          <div key={farm.id} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 hover:border-emerald-500/30 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{farm.farm_name}</h3>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{farm.village}, {farm.district}, {farm.state}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/80 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60">
                <div className="text-slate-500">Land Area</div>
                <div className="font-bold text-slate-200 mt-0.5 font-mono">
                  {farm.land_area ? `${farm.land_area} ${farm.land_area_unit}` : 'Not specified'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60">
                <div className="text-slate-500">GPS Coordinates</div>
                <div className="font-bold text-slate-300 mt-0.5 font-mono text-[11px]">
                  {farm.latitude ? `${farm.latitude.toFixed(4)}, ${farm.longitude?.toFixed(4)}` : 'On-demand GPS'}
                </div>
              </div>
            </div>

            {/* Resources */}
            <div>
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Associated Resources</span>
                <span className="text-slate-500 text-[10px] font-normal">
                  {farm.resources?.length || 0} registered
                </span>
              </div>
              <div className="space-y-1.5">
                {farm.resources && farm.resources.length > 0 ? (
                  farm.resources.map((res, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-200">{res.name}</span>
                      </div>
                      {res.quantity && (
                        <span className="font-mono text-emerald-400 font-semibold text-xs">
                          {res.quantity} {res.unit}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 italic p-2">No resources recorded.</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Farm Modal */}
      {isOpenCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl glass-panel p-6 sm:p-8 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-400" />
                <span>Register Farm Profile</span>
              </h2>
              <button
                onClick={onCloseCreateModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Farm Name *
                </label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Patil Krishi Farm"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Village *</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Land Area */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Land Area</label>
                  <input
                    type="number"
                    step="0.01"
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                    placeholder="3.5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-slate-100 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit</label>
                  <select
                    value={landAreaUnit}
                    onChange={(e) => setLandAreaUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:border-emerald-500"
                  >
                    <option value="acre">Acre</option>
                    <option value="hectare">Hectare</option>
                    <option value="bigha">Bigha</option>
                    <option value="guntha">Guntha</option>
                    <option value="sq_meter">Square Meter</option>
                  </select>
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Latitude (Optional)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="19.1136"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-slate-100 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Longitude (Optional)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="73.9723"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-slate-100 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Resources */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Add Farm Resources (Storage, Crates, Labour)
                </label>
                <div className="flex gap-2 mb-3">
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="storage">Storage</option>
                    <option value="equipment">Equipment</option>
                    <option value="labour">Labour</option>
                    <option value="vehicle">Vehicle</option>
                  </select>
                  <input
                    type="text"
                    value={resName}
                    onChange={(e) => setResName(e.target.value)}
                    placeholder="e.g. Shaded Shed"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  />
                  <input
                    type="number"
                    value={resQty}
                    onChange={(e) => setResQty(e.target.value)}
                    placeholder="Qty"
                    className="w-16 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={addResource}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {resources.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <span>{r.name} ({r.resource_type}) {r.quantity ? `• ${r.quantity} ${r.unit || ''}` : ''}</span>
                      <button
                        type="button"
                        onClick={() => removeResource(i)}
                        className="text-red-400 hover:text-red-300 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
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
                  <span>{loading ? 'Creating...' : 'Create Farm Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
