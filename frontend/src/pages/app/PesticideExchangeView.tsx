// frontend/src/pages/app/PesticideExchangeView.tsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  MapPin,
  CheckCircle2,
  Share2,
  Gift,
  ShieldCheck,
  X,
  Phone,
  Clock
} from 'lucide-react';

export interface AgrochemicalListing {
  id: string;
  name: string;
  activeIngredient?: string;
  crop: 'Vegetables' | 'Wheat' | 'Cotton' | 'Sugarcane' | 'Rice' | 'Grapes' | 'All';
  quantity: string;
  price: number; // 0 for share/donate
  type: 'buy' | 'share' | 'donate';
  expiryDate: string;
  distanceKm: number;
  ownerName: string;
  ownerPhone: string;
  rating: number;
  isBioOrganic: boolean;
  image: string;
  safetyWarning: string;
  batchNo: string;
}

const INITIAL_LISTINGS: AgrochemicalListing[] = [
  {
    id: 'p1',
    name: 'Super Nova - Natural Seaweed Extract',
    activeIngredient: 'Ascophyllum Nodosum (Marine Algae Extract)',
    crop: 'Vegetables',
    quantity: '500 ml Sealed Bottle',
    price: 250,
    type: 'buy',
    expiryDate: '2026-12-10',
    distanceKm: 1.2,
    ownerName: 'Rajendra Patil',
    ownerPhone: '+91 98224 55102',
    rating: 4.9,
    isBioOrganic: true,
    image: '/1.png',
    safetyWarning: '100% Natural Organic Bio-Stimulant for root and shoot vigor.',
    batchNo: 'SN-2025-08'
  },
  {
    id: 'p2',
    name: 'Cromin+ Ammonium Polyphosphate (NPK 10:34:00)',
    activeIngredient: 'Liquid Ammonium Polyphosphate with Zinc',
    crop: 'Wheat',
    quantity: '1 Liter Sealed Jar',
    price: 450,
    type: 'buy',
    expiryDate: '2026-10-15',
    distanceKm: 3.4,
    ownerName: 'Swapnil Deshmukh',
    ownerPhone: '+91 94227 12908',
    rating: 4.8,
    isBioOrganic: false,
    image: '/2.png',
    safetyWarning: 'Concentrated water-soluble starter fertilizer. Wear gloves during dilution.',
    batchNo: 'CR-NPK-992'
  },
  {
    id: 'p3',
    name: 'GACIL Enriched Micro-Nutrients (Grade II)',
    activeIngredient: 'Fe 4.0%, Zn 6.0%, Mn 1.0%, Cu 0.5%, B 0.5%',
    crop: 'Cotton',
    quantity: '5 kg Bag',
    price: 600,
    type: 'buy',
    expiryDate: '2027-01-20',
    distanceKm: 5.1,
    ownerName: 'Amol Jadhav',
    ownerPhone: '+91 98501 33214',
    rating: 5.0,
    isBioOrganic: true,
    image: '/3.png',
    safetyWarning: 'Chelated formulation prevents soil fixation and corrects micronutrient chlorosis.',
    batchNo: 'GC-GR2-771'
  },
  {
    id: 'p4',
    name: 'Zeal Agrilla - Flowering Bio-Stimulant',
    activeIngredient: 'Nitrobenzene 20% w/w with Plant Amino Acids',
    crop: 'Sugarcane',
    quantity: '250 gm Unopened Box',
    price: 0,
    type: 'share',
    expiryDate: '2026-09-30',
    distanceKm: 2.8,
    ownerName: 'Sanjay Shinde',
    ownerPhone: '+91 97635 88912',
    rating: 4.7,
    isBioOrganic: true,
    image: '/4.png',
    safetyWarning: 'Available for mutual farmer barter or exchange for Trichoderma bio-agent.',
    batchNo: 'ZA-FLW-104'
  },
  {
    id: 'p5',
    name: 'Multiplex Chamak Micronutrient Spray',
    activeIngredient: 'Multi-micronutrients mixture for foliar application',
    crop: 'Rice',
    quantity: '1 Liter',
    price: 0,
    type: 'donate',
    expiryDate: '2026-11-15',
    distanceKm: 0.8,
    ownerName: 'Kishor Mane',
    ownerPhone: '+91 98904 22177',
    rating: 4.9,
    isBioOrganic: true,
    image: '/5.png',
    safetyWarning: 'Excess stock after transplanting. Free for any small farmer in village.',
    batchNo: 'MC-2025-03'
  },
  {
    id: 'p6',
    name: 'Trichoderma Harzianum Bio-Fungicide',
    activeIngredient: 'Trichoderma Harzianum 2% WP (2x10^6 CFU/g)',
    crop: 'Vegetables',
    quantity: '1 kg Foil Pack',
    price: 180,
    type: 'buy',
    expiryDate: '2026-11-30',
    distanceKm: 2.1,
    ownerName: 'Nitin Pawar',
    ownerPhone: '+91 98603 99450',
    rating: 4.9,
    isBioOrganic: true,
    image: '/1.png',
    safetyWarning: 'Biological control agent for Fusarium wilt, damping-off, and root rot.',
    batchNo: 'TH-WP-550'
  }
];

export const PesticideExchangeView: React.FC = () => {
  const [listings, setListings] = useState<AgrochemicalListing[]>(INITIAL_LISTINGS);
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AgrochemicalListing | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Listing Form State
  const [newListingForm, setNewListingForm] = useState({
    name: '',
    activeIngredient: '',
    crop: 'Vegetables' as AgrochemicalListing['crop'],
    quantity: '500 ml',
    price: 200,
    type: 'buy' as AgrochemicalListing['type'],
    expiryDate: '2026-12-31',
    isBioOrganic: true,
    safetyWarning: '',
    batchNo: 'BATCH-2026',
  });

  const crops = ['All', 'Vegetables', 'Wheat', 'Cotton', 'Sugarcane', 'Rice'];

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.activeIngredient && item.activeIngredient.toLowerCase().includes(search.toLowerCase())) ||
        item.ownerName.toLowerCase().includes(search.toLowerCase());

      const matchCrop = selectedCrop === 'All' || item.crop === selectedCrop;
      const matchType = selectedType === 'All' || item.type === selectedType;

      return matchSearch && matchCrop && matchType;
    });
  }, [listings, search, selectedCrop, selectedType]);

  const handlePostListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListingForm.name) return;

    const newEntry: AgrochemicalListing = {
      id: `p-${Date.now()}`,
      name: newListingForm.name,
      activeIngredient: newListingForm.activeIngredient || 'Plant Extract / Certified Salt',
      crop: newListingForm.crop,
      quantity: newListingForm.quantity,
      price: newListingForm.type === 'donate' ? 0 : Number(newListingForm.price),
      type: newListingForm.type,
      expiryDate: newListingForm.expiryDate,
      distanceKm: 0.5,
      ownerName: 'Ramesh Patil (You)',
      ownerPhone: '+91 98220 12345',
      rating: 5.0,
      isBioOrganic: newListingForm.isBioOrganic,
      image: '/1.png',
      safetyWarning: newListingForm.safetyWarning || 'Sealed manufacturer container with original label.',
      batchNo: newListingForm.batchNo
    };

    setListings([newEntry, ...listings]);
    setIsPostModalOpen(false);
    setToastMessage(`Listing for '${newEntry.name}' published successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleClaim = (item: AgrochemicalListing) => {
    setToastMessage(`Request sent to ${item.ownerName} (${item.ownerPhone}) for ${item.name}!`);
    setSelectedListing(null);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-8 pb-12 font-sans animate-fade-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Executive Header ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-display">
            <span className="text-sm">🌱</span>
            <span>Agrochemical & Bio-Input Exchange (कृषी-रसायन विनिमय केंद्र)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-display">
            Agrochemical & Bio-Input Safety Exchange
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
            Peer-to-peer exchange for unused sealed bio-stimulants, organic micro-nutrients, and botanical sprays. Share or buy leftover inputs at discount, reduce agricultural input waste, and prevent toxic chemical dumping.
          </p>
        </div>

        <button
          onClick={() => setIsPostModalOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm px-5 py-3 shadow-md shadow-green-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List Unused Input</span>
        </button>
      </div>

      {/* ─── Mandatory Safety Compliance Banner ─── */}
      <div className="bg-amber-50 rounded-2xl p-4 sm:p-5 border border-amber-200/80 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-900 leading-relaxed">
          <span className="font-bold text-sm block font-display">Agronomic Safety Standard & Exchange Guidelines</span>
          <p>
            1. Only factory-sealed, unadulterated packages within valid shelf life with visible batch numbers may be listed.
            <br />
            2. Never exchange banned Red-Triangle pesticides or unlabeled loose chemicals.
            <br />
            3. Prioritize certified organic bio-stimulants and micronutrients to protect soil health and avoid chemical contamination.
          </p>
        </div>
      </div>

      {/* ─── Search and Filters ─── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, active ingredient, or owner..."
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-green-500"
            >
              <option value="All">All Types (Buy, Share & Donate)</option>
              <option value="buy">💰 Buy at Discount</option>
              <option value="share">🔄 Farmer Barter / Share</option>
              <option value="donate">🎁 100% Free Donation</option>
            </select>
          </div>
        </div>

        {/* Crop Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-gray-100">
          {crops.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCrop(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCrop === c
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Listings Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((item) => {
          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group justify-between"
            >
              <div>
                {/* Header Image & Tags */}
                <div className="relative h-44 overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-36 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top Left Tags */}
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    {item.isBioOrganic ? (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        🌱 Bio-Organic
                      </span>
                    ) : (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        🧪 Mineral Salt
                      </span>
                    )}

                    <span className="bg-gray-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow backdrop-blur-xs">
                      {item.crop}
                    </span>
                  </div>

                  {/* Type Badge Top Right */}
                  <div className="absolute top-3 right-3">
                    {item.type === 'donate' ? (
                      <span className="bg-emerald-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        <span>FREE</span>
                      </span>
                    ) : item.type === 'share' ? (
                      <span className="bg-purple-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        <span>Barter</span>
                      </span>
                    ) : (
                      <span className="bg-green-700 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow">
                        ₹{item.price}
                      </span>
                    )}
                  </div>

                  {/* Distance Bottom Right */}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-700 shadow flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-green-600" />
                    <span>{item.distanceKm} km</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-green-700 transition">
                      {item.name}
                    </h3>
                    {item.activeIngredient && (
                      <p className="text-[11px] font-mono text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded mt-1 line-clamp-1 border border-emerald-100">
                        {item.activeIngredient}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span className="font-bold text-gray-700">{item.quantity}</span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-gray-500">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>Exp: {item.expiryDate}</span>
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    {item.safetyWarning}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 pt-0 space-y-2.5 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Listed by <strong className="text-gray-700">{item.ownerName}</strong></span>
                  <span className="text-[10px] font-mono text-gray-400">{item.batchNo}</span>
                </div>

                <button
                  onClick={() => setSelectedListing(item)}
                  className="w-full btn-primary text-xs py-2.5 justify-center shadow-xs"
                >
                  <span>{item.type === 'donate' ? 'Claim Free Donation' : item.type === 'share' ? 'Propose Barter / Share' : `Buy for ₹${item.price}`} →</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Contact / Claim Modal ─── */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤝</span>
                <div>
                  <h2 className="text-base font-bold text-gray-900 font-display">Exchange Request</h2>
                  <p className="text-[11px] text-gray-500">{selectedListing.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800">Exchange Value:</span>
                  <span className="text-lg font-black text-emerald-950 font-display">
                    {selectedListing.type === 'donate' ? 'FREE 🎁' : selectedListing.type === 'share' ? 'Mutual Barter 🔄' : `₹${selectedListing.price} 💰`}
                  </span>
                </div>
                <div className="text-xs text-emerald-700">
                  <span>Batch verification code: </span>
                  <span className="font-mono font-bold text-emerald-900">{selectedListing.batchNo}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
                <div className="text-gray-500">Contact Details of Owner:</div>
                <div className="font-bold text-gray-900 text-sm">{selectedListing.ownerName}</div>
                <div className="flex items-center gap-2 text-green-700 font-bold">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedListing.ownerPhone}</span>
                </div>
                <div className="text-gray-500">Village: Niphad Sub-District ({selectedListing.distanceKm} km away)</div>
              </div>

              <div className="text-xs text-gray-500 leading-relaxed">
                By confirming, you agree to inspect the container seal and expiry date in person before handing over payment or barter items.
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedListing(null)}
                  className="btn-secondary text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleClaim(selectedListing)}
                  className="btn-primary text-xs flex-1 justify-center"
                >
                  Send Pickup Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Post Unused Agrochemical Modal ─── */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌿</span>
                <h2 className="text-lg font-bold text-gray-900 font-display">List Unused Agrochemical / Bio-Input</h2>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostListing} className="p-6 space-y-4">
              <div>
                <label className="label">Product Name & Brand *</label>
                <input
                  required
                  value={newListingForm.name}
                  onChange={(e) => setNewListingForm({ ...newListingForm, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Super Nova Seaweed Extract"
                />
              </div>

              <div>
                <label className="label">Active Ingredient / Formulation</label>
                <input
                  value={newListingForm.activeIngredient}
                  onChange={(e) => setNewListingForm({ ...newListingForm, activeIngredient: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Ascophyllum Nodosum (Marine Algae 20%)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Crop Suitability</label>
                  <select
                    value={newListingForm.crop}
                    onChange={(e) => setNewListingForm({ ...newListingForm, crop: e.target.value as AgrochemicalListing['crop'] })}
                    className="input-field"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Rice">Rice</option>
                    <option value="All">All Crops</option>
                  </select>
                </div>

                <div>
                  <label className="label">Exchange Type *</label>
                  <select
                    value={newListingForm.type}
                    onChange={(e) => setNewListingForm({ ...newListingForm, type: e.target.value as AgrochemicalListing['type'] })}
                    className="input-field"
                  >
                    <option value="buy">💰 Sell at Discount</option>
                    <option value="share">🔄 Farmer Barter / Share</option>
                    <option value="donate">🎁 Free Donation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quantity / Volume *</label>
                  <input
                    required
                    value={newListingForm.quantity}
                    onChange={(e) => setNewListingForm({ ...newListingForm, quantity: e.target.value })}
                    className="input-field"
                    placeholder="e.g. 500 ml Sealed Bottle"
                  />
                </div>

                {newListingForm.type !== 'donate' && (
                  <div>
                    <label className="label">Price (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      value={newListingForm.price}
                      onChange={(e) => setNewListingForm({ ...newListingForm, price: Number(e.target.value) })}
                      className="input-field"
                      placeholder="250"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newListingForm.expiryDate}
                    onChange={(e) => setNewListingForm({ ...newListingForm, expiryDate: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Batch Number</label>
                  <input
                    value={newListingForm.batchNo}
                    onChange={(e) => setNewListingForm({ ...newListingForm, batchNo: e.target.value })}
                    className="input-field"
                    placeholder="e.g. SN-2025-08"
                  />
                </div>
              </div>

              <div>
                <label className="label">Safety Warning / Condition Note</label>
                <textarea
                  rows={2}
                  value={newListingForm.safetyWarning}
                  onChange={(e) => setNewListingForm({ ...newListingForm, safetyWarning: e.target.value })}
                  className="input-field"
                  placeholder="Sealed manufacturer container, stored in cool dry shed..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Publish Exchange Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

