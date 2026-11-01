// frontend/src/components/BuyersView.tsx
import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  MapPin,
  Sparkles,
  Building2,
  Star,
  X,
  ArrowRight
} from 'lucide-react';
import type { Buyer, BuyerOffer, CropLot } from '../types';
import { api } from '../api';

interface BuyersViewProps {
  cropLots: CropLot[];
  onNavigateToExecution?: () => void;
  onSelectLotForExecution?: (lotId: string) => void;
}

export const BuyersView: React.FC<BuyersViewProps> = ({
  cropLots,
  onNavigateToExecution,
}) => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [commodityFilter, setCommodityFilter] = useState<string>('All');
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sell Modal State
  const [selectedOffer, setSelectedOffer] = useState<{ buyer: Buyer; offer: BuyerOffer } | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<string>(cropLots[0]?.id || '');
  const [requestedQty, setRequestedQty] = useState<number>(cropLots[0]?.quantity_kg_normalized || 3000);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const loadBuyersAndOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedBuyers = await api.getBuyers();
      setBuyers(fetchedBuyers);
    } catch (err: any) {
      console.error('Failed to load buyers:', err);
      setError(err.message || 'Could not load buyer network');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuyersAndOffers();
  }, []);

  const handleOpenSellModal = (buyer: Buyer, offer: BuyerOffer) => {
    setSelectedOffer({ buyer, offer });
    const lot = cropLots[0];
    if (lot) {
      setSelectedLotId(lot.id);
      setRequestedQty(Math.min(offer.max_quantity_kg, lot.quantity_kg_normalized));
    }
    setSubmitSuccess(null);
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !selectedLotId) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.createExecutionRequest({
        crop_lot_id: selectedLotId,
        route_type: 'DIRECT_BUYER',
        requested_quantity_kg: requestedQty,
        buyer_id: selectedOffer.buyer.id,
        buyer_offer_id: selectedOffer.offer.id,
        notes: notes || undefined,
      });
      setSubmitSuccess(`Request submitted to ${selectedOffer.buyer.company_name}!`);
      setTimeout(() => {
        setSelectedOffer(null);
        if (onNavigateToExecution) onNavigateToExecution();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit execution request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBuyers = buyers.filter((b) => {
    const matchesDistrict = districtFilter === 'All' || b.district.toLowerCase() === districtFilter.toLowerCase();
    const matchesCommodity =
      commodityFilter === 'All' ||
      b.offers.some((o) => o.commodity.toLowerCase().includes(commodityFilter.toLowerCase()));
    const matchesSearch =
      !searchQuery ||
      b.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.district.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesCommodity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="card p-6 sm:p-8 space-y-2 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">
                Commercial Buyer Network
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Connect directly with verified corporate buyers, retail supermarket chains, and wholesale aggregators across Maharashtra with transparent offered rates and payment terms.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-yellow">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 3 Simulation Mode</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search company or market..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Crop:</span>
          </div>
          <select
            value={commodityFilter}
            onChange={(e) => setCommodityFilter(e.target.value)}
            className="input-field py-1.5 text-xs w-36 font-semibold"
          >
            <option value="All">All Crops</option>
            <option value="Tomato">Tomato</option>
            <option value="Onion">Onion</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold ml-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>District:</span>
          </div>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="input-field py-1.5 text-xs w-36 font-semibold"
          >
            <option value="All">All Districts</option>
            <option value="Nashik">Nashik</option>
            <option value="Pune">Pune</option>
            <option value="Mumbai">Mumbai</option>
          </select>
        </div>
      </div>

      {/* Buyer Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm card">
          Loading commercial buyers and open demands...
        </div>
      ) : filteredBuyers.length === 0 ? (
        <div className="p-12 text-center card space-y-2">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No Buyers Found</h4>
          <p className="text-xs text-slate-500">No buyer demands matching the selected criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredBuyers.map((buyer) => (
            <div
              key={buyer.id}
              className="card p-6 space-y-4 hover:border-emerald-300"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-base">{buyer.company_name}</h3>
                    <span className="badge-green text-[10px]">
                      {buyer.verification_badge}
                    </span>
                    <span className="badge-slate text-[10px]">
                      {buyer.buyer_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {buyer.district}, {buyer.state}
                    </span>
                    <span>•</span>
                    <span>Radius: {buyer.service_radius_km} km</span>
                    {buyer.rating && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {buyer.rating}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {buyer.data_mode.toUpperCase()}
                </span>
              </div>

              {/* Offers List */}
              <div className="space-y-3">
                <div className="label text-[10px] mb-1">
                  Active Procurement Offers ({buyer.offers.length})
                </div>

                {buyer.offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-emerald-50/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{offer.commodity}</span>
                        {offer.variety && (
                          <span className="text-xs text-slate-500 font-medium">({offer.variety})</span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {offer.accepted_grades ? `Grade ${offer.accepted_grades}` : 'Any Grade'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Required: {offer.min_quantity_kg.toLocaleString()} – {offer.max_quantity_kg.toLocaleString()} kg</span>
                        <span>•</span>
                        <span>Payment: {offer.payment_terms_days} days</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <div className="text-left sm:text-right">
                        <div className="text-lg font-black font-mono text-emerald-700">
                          ₹{Number(offer.offered_price_per_kg).toFixed(2)} <span className="text-xs font-normal text-slate-500">/kg</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Fixed Yard Gate</div>
                      </div>

                      <button
                        onClick={() => handleOpenSellModal(buyer, offer)}
                        className="btn-primary text-xs py-1.5 px-3 shadow-xs"
                      >
                        <span>Initiate Deal</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sell Harvest / Initiate Request Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Initiate Commercial Sale
                </h3>
                <p className="text-xs text-slate-500">
                  Buyer: <strong className="text-slate-800">{selectedOffer.buyer.company_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedOffer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
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
              <form onSubmit={handleConfirmSubmit} className="space-y-4 text-xs">
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Requested Quantity (kg):</label>
                    <input
                      type="number"
                      value={requestedQty}
                      onChange={(e) => setRequestedQty(Number(e.target.value))}
                      min={selectedOffer.offer.min_quantity_kg}
                      max={selectedOffer.offer.max_quantity_kg}
                      className="input-field font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Agreed Rate:</label>
                    <div className="input-field bg-slate-50 font-mono font-bold text-emerald-700">
                      ₹{selectedOffer.offer.offered_price_per_kg} / kg
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Transaction Value:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(requestedQty * selectedOffer.offer.offered_price_per_kg).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Payment Terms:</span>
                    <span className="font-bold text-slate-800">{selectedOffer.offer.payment_terms_days} days via Escrow/Direct</span>
                  </div>
                </div>

                <div>
                  <label className="label">Dispatch Notes (Optional):</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Specify crate packing, loading time preferences..."
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
                    onClick={() => setSelectedOffer(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs"
                  >
                    {submitting ? 'Submitting...' : 'Submit Execution Request'}
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
