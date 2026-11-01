// frontend/src/components/BuyersView.tsx
import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Truck,
  MapPin,
  Send,
  Sparkles,
  Building2,
  Star,
  Info,
  ChevronRight,
  X,
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
      <div className="p-6 rounded-2xl glass-panel border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Commercial Buyer Network
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Connect directly with verified corporate buyers, retail supermarket chains, and wholesale aggregators
              across Maharashtra with transparent offered rates and payment terms.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 3 Simulation Mode</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl glass-panel border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search company or market..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Crop:</span>
          </div>
          <select
            value={commodityFilter}
            onChange={(e) => setCommodityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
          >
            <option value="All">All Crops</option>
            <option value="Tomato">Tomato</option>
            <option value="Onion">Onion</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>District:</span>
          </div>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
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
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading commercial buyers and open demands...
        </div>
      ) : filteredBuyers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-slate-800 space-y-2">
          <Building2 className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">No Buyers Found</h4>
          <p className="text-xs text-slate-500">No buyer demands matching the selected criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredBuyers.map((buyer) => (
            <div
              key={buyer.id}
              className="p-5 rounded-2xl glass-panel border border-slate-800/80 bg-slate-900/50 hover:border-emerald-500/30 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-base">{buyer.company_name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {buyer.verification_badge}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                      {buyer.buyer_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {buyer.district}, {buyer.state}
                    </span>
                    <span>•</span>
                    <span>Radius: {buyer.service_radius_km} km</span>
                    {buyer.rating && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {buyer.rating}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Purchasing Requirements (Offers) */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Open Procurement Demands:
                </div>

                <div className="space-y-2">
                  {buyer.offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400 text-sm">
                            {offer.commodity}
                          </span>
                          {offer.variety && (
                            <span className="text-xs text-slate-400">({offer.variety})</span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            Grades: {offer.accepted_grades}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>
                            Rate: <strong className="text-white text-xs">₹{offer.offered_price_per_kg}</strong>/kg
                          </span>
                          <span>•</span>
                          <span>
                            Vol: {offer.min_quantity_kg.toLocaleString()} - {offer.max_quantity_kg.toLocaleString()} kg
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <Truck className="w-3 h-3" />
                            {offer.logistics_requirement.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenSellModal(buyer, offer)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
                      >
                        <span>Sell This Lot</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Contact: {buyer.contact_person}</span>
                <span className="font-mono">{buyer.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sell Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-lg w-full rounded-2xl glass-panel border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Initiate Sale Request
                </h3>
                <p className="text-xs text-slate-400">
                  Target Buyer: <strong className="text-emerald-400">{selectedOffer.buyer.company_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedOffer(null)}
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
              <form onSubmit={handleConfirmSubmit} className="space-y-4 text-xs">
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
                      if (l) setRequestedQty(l.quantity_kg_normalized);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    required
                  >
                    {cropLots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.crop_name} ({lot.quantity_kg_normalized} kg) — Grade {lot.quality_grade || 'Ungraded'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Quantity to Sell (kg)</label>
                    <input
                      type="number"
                      value={requestedQty}
                      onChange={(e) => setRequestedQty(Number(e.target.value))}
                      min={selectedOffer.offer.min_quantity_kg}
                      max={selectedOffer.offer.max_quantity_kg}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Offered Rate (INR/kg)</label>
                    <input
                      type="text"
                      disabled
                      value={`₹${selectedOffer.offer.offered_price_per_kg}`}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-emerald-400 font-bold"
                    />
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Gross Realization:</span>
                    <span className="font-bold text-white">
                      ₹{(requestedQty * selectedOffer.offer.offered_price_per_kg).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Payment Terms:</span>
                    <span className="text-slate-300">{selectedOffer.offer.payment_terms_days} days via APMC Escrow</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Logistics Requirement:</span>
                    <span className="text-slate-300">{selectedOffer.offer.logistics_requirement.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Special Notes / Packaging Requirements</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Graded into 20 kg plastic crates, farmgate pickup available after 8 AM."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Submitting this request will reserve capacity and notify the buyer. A genuine binding trade
                    commitment occurs upon formal provider confirmation.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOffer(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Sending Request...' : 'Send Sale Request'}</span>
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
