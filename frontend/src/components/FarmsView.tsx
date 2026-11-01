// frontend/src/components/FarmsView.tsx
import React, { useState } from 'react';
import { Home, Plus, MapPin, Wrench, X, Compass } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Home className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">
              Farm Profiles & Land Holdings
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your land holdings and on-farm resources (storage, sorting sheds, crates) for feasibility verification.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Farm</span>
        </button>
      </div>

      {/* Farms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {farms.map((farm) => (
          <div key={farm.id} className="card p-6 space-y-4 hover:border-emerald-300">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{farm.farm_name}</h3>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{farm.village}, {farm.district}, {farm.state}</span>
                </div>
              </div>
              <span className="badge-green">
                ACTIVE HOLDING
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 py-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="label text-[10px] mb-1">Land Area</div>
                <div className="font-extrabold text-slate-900 font-mono text-sm">
                  {farm.land_area ? `${farm.land_area} ${farm.land_area_unit}` : 'Not specified'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="label text-[10px] mb-1">GPS Coordinates</div>
                <div className="font-bold text-slate-700 font-mono text-xs flex items-center gap-1">
                  <Compass className="w-3 h-3 text-slate-400" />
                  <span>{farm.latitude ? `${farm.latitude.toFixed(4)}, ${farm.longitude?.toFixed(4)}` : 'On-demand GPS'}</span>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div>
              <div className="label text-[10px] mb-2 flex items-center justify-between">
                <span>Associated Farm Resources</span>
                <span className="text-slate-400 font-normal">
                  {farm.resources?.length || 0} registered
                </span>
              </div>
              <div className="space-y-1.5">
                {farm.resources && farm.resources.length > 0 ? (
                  farm.resources.map((res, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs hover:bg-white transition-colors">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-slate-800">{res.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">({res.resource_type})</span>
                      </div>
                      {res.quantity && (
                        <span className="font-mono text-emerald-700 font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                          {res.quantity} {res.unit}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-xl">No resources recorded.</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Farm Modal */}
      {isOpenCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-display">
                <Home className="w-5 h-5 text-emerald-600" />
                <span>Register Farm Profile</span>
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
                <label className="label">
                  Farm Name *
                </label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Patil Krishi Farm"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">District *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Village *</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Land Area</label>
                  <input
                    type="number"
                    step="0.1"
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select
                    value={landAreaUnit}
                    onChange={(e) => setLandAreaUnit(e.target.value)}
                    className="input-field"
                  >
                    <option value="acre">Acres</option>
                    <option value="hectare">Hectares</option>
                    <option value="guntha">Guntha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Latitude</label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">Longitude</label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              {/* Resources Section */}
              <div className="pt-2 border-t border-slate-100">
                <label className="label">
                  On-Farm Resources (Storage / Equipment)
                </label>
                
                <div className="space-y-2 mb-3">
                  {resources.map((res, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-medium text-slate-800">
                        {res.name} <span className="text-slate-400">({res.resource_type})</span>
                        {res.quantity && <span className="ml-1 text-emerald-700 font-mono font-bold">({res.quantity} {res.unit})</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeResource(i)}
                        className="text-rose-600 hover:text-rose-800 cursor-pointer font-bold px-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value)}
                    className="input-field text-xs sm:col-span-1"
                  >
                    <option value="storage">Storage</option>
                    <option value="equipment">Equipment</option>
                    <option value="labour">Labour</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Resource name"
                    value={resName}
                    onChange={(e) => setResName(e.target.value)}
                    className="input-field text-xs sm:col-span-2"
                  />
                  <button
                    type="button"
                    onClick={addResource}
                    className="btn-secondary text-xs py-2 px-3 sm:col-span-1"
                  >
                    Add
                  </button>
                </div>
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
                  {loading ? 'Saving...' : 'Register Farm'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
