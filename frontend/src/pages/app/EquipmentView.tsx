// frontend/src/pages/app/EquipmentView.tsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Clock,
  DollarSign,
  Star,
  CheckCircle2,
  Calendar,
  X,
  Phone,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Sliders,
  Check
} from 'lucide-react';
import tractorsImg from '../../assets/TRACTORS.jpg';

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'Tractor' | 'Harvester' | 'Sprayer' | 'Rotavator' | 'Plough' | 'Laser Leveler' | 'Tools';
  listingType: 'rent' | 'sell' | 'both';
  pricePerHour: number;
  salePrice?: number;
  location: string;
  distanceKm: number;
  ownerName: string;
  ownerPhone: string;
  rating: number;
  hpRating?: string;
  imageUrl?: string;
  description: string;
  isAvailable: boolean;
  fuelType?: string;
}

const INITIAL_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'eq-1',
    name: 'Mahindra 575 DI (45 HP Tractor)',
    type: 'Tractor',
    listingType: 'both',
    pricePerHour: 280,
    salePrice: 420000,
    location: 'Niphad, Nashik',
    distanceKm: 2.4,
    ownerName: 'Vikas Jadhav',
    ownerPhone: '+91 98221 44512',
    rating: 4.9,
    hpRating: '45 HP • Dual Clutch',
    imageUrl: tractorsImg,
    description: 'Well-maintained Mahindra tractor with power steering and auxiliary hydraulic valve, ideal for rotavator and plough work.',
    isAvailable: true,
    fuelType: 'Diesel (Owner operated or bare rental)'
  },
  {
    id: 'eq-2',
    name: 'John Deere 5050D (50 HP 4WD)',
    type: 'Tractor',
    listingType: 'rent',
    pricePerHour: 350,
    location: 'Pimpalgaon Baswant, Nashik',
    distanceKm: 4.8,
    ownerName: 'Dnyaneshwar Shinde',
    ownerPhone: '+91 94220 89123',
    rating: 5.0,
    hpRating: '50 HP • 4WD Heavy Duty',
    imageUrl: 'https://images.unsplash.com/photo-1592982537447-6f23dbdc7e90?auto=format&fit=crop&w=800&q=75',
    description: 'High-torque 4WD tractor suitable for deep tillage, heavy trailers, and sugarcane harvesting haulage.',
    isAvailable: true,
    fuelType: 'Diesel'
  },
  {
    id: 'eq-3',
    name: 'Swaraj 744 FE (48 HP Multi-Speed)',
    type: 'Tractor',
    listingType: 'rent',
    pricePerHour: 260,
    location: 'Dindori, Nashik',
    distanceKm: 6.2,
    ownerName: 'Rajendra Kadam',
    ownerPhone: '+91 98902 33145',
    rating: 4.8,
    hpRating: '48 HP • Multi-speed Reverse PTO',
    imageUrl: tractorsImg,
    description: 'Fuel efficient workhorse with dual clutch, multi-speed PTO for threshers and mist blowers.',
    isAvailable: true,
    fuelType: 'Diesel'
  },
  {
    id: 'eq-4',
    name: 'Preet 987 Self-Propelled Combine Harvester',
    type: 'Harvester',
    listingType: 'rent',
    pricePerHour: 1400,
    location: 'Yeola, Nashik',
    distanceKm: 12.5,
    ownerName: 'Kalyanrao Patil',
    ownerPhone: '+91 94231 77890',
    rating: 4.9,
    hpRating: '101 HP Heavy Harvester',
    imageUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=75',
    description: '14-foot cutter bar, high grain recovery for soybean, wheat, and gram with straw chopper.',
    isAvailable: true,
    fuelType: 'Diesel with Operator'
  },
  {
    id: 'eq-5',
    name: 'Claas Crop Tiger 30 Combine Harvester',
    type: 'Harvester',
    listingType: 'both',
    pricePerHour: 1600,
    salePrice: 1850000,
    location: 'Sinnar, Nashik',
    distanceKm: 18.0,
    ownerName: 'Sunil Gholap',
    ownerPhone: '+91 97632 11200',
    rating: 4.7,
    hpRating: 'Compact Crawler Rubber Track',
    imageUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=75',
    description: 'Rubber crawler tracks for wet and muddy soil conditions. Zero field sinking during late monsoon harvesting.',
    isAvailable: false,
    fuelType: 'Diesel'
  },
  {
    id: 'eq-6',
    name: 'Aspee HTP Tractor-Mounted Boom Sprayer',
    type: 'Sprayer',
    listingType: 'rent',
    pricePerHour: 120,
    location: 'Ozar, Nashik',
    distanceKm: 3.1,
    ownerName: 'Ganesh Deshmukh',
    ownerPhone: '+91 98601 45892',
    rating: 4.9,
    hpRating: '500L Tank • 24ft Hydraulic Boom',
    imageUrl: 'https://images.unsplash.com/photo-1592982537447-6f23dbdc7e90?auto=format&fit=crop&w=800&q=75',
    description: 'Precision Italian anti-drift nozzles for grape vineyards and tomato beds. Uniform droplet deposition.',
    isAvailable: true,
    fuelType: 'PTO Driven'
  },
  {
    id: 'eq-7',
    name: 'Shaktiman Regular Light Duty Rotavator (6 ft)',
    type: 'Rotavator',
    listingType: 'both',
    pricePerHour: 150,
    salePrice: 95000,
    location: 'Chandwad, Nashik',
    distanceKm: 8.5,
    ownerName: 'Babasaheb More',
    ownerPhone: '+91 98234 66781',
    rating: 4.8,
    hpRating: '48 L-Type Boron Blades',
    imageUrl: tractorsImg,
    description: 'Boron steel blades, multi-speed gearbox, excellent seedbed pulverization for vegetable planting.',
    isAvailable: true,
    fuelType: 'Implement'
  },
  {
    id: 'eq-8',
    name: 'Landforce Laser Guided Land Leveler',
    type: 'Laser Leveler',
    listingType: 'rent',
    pricePerHour: 450,
    location: 'Lasalgaon, Nashik',
    distanceKm: 14.2,
    ownerName: 'Nitin Sonawane',
    ownerPhone: '+91 98500 78219',
    rating: 5.0,
    hpRating: 'Dual Laser Transmitter & Scraper',
    imageUrl: tractorsImg,
    description: 'Saves up to 30% irrigation water and improves germination uniformity by millimeter-precise grade leveling.',
    isAvailable: true,
    fuelType: 'Tractor PTO'
  }
];

export const EquipmentView: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(INITIAL_EQUIPMENT);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedListingType, setSelectedListingType] = useState<string>('All');
  const [maxDistance, setMaxDistance] = useState<number>(25);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<EquipmentItem | null>(null);
  const [bookingSuccessToast, setBookingSuccessToast] = useState<string | null>(null);

  // New Equipment Form State
  const [newEqForm, setNewEqForm] = useState({
    name: '',
    type: 'Tractor' as EquipmentItem['type'],
    listingType: 'rent' as EquipmentItem['listingType'],
    pricePerHour: 250,
    salePrice: 400000,
    location: 'Niphad, Nashik',
    hpRating: '',
    description: '',
  });

  // Booking Form State
  const [bookingDate, setBookingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [bookingHours, setBookingHours] = useState<number>(4);
  const [bookingFieldLocation, setBookingFieldLocation] = useState('Survey 42/1, Patil Krishi Farm, Niphad');

  const types = ['All', 'Tractor', 'Harvester', 'Sprayer', 'Rotavator', 'Laser Leveler'];

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase()) ||
        item.ownerName.toLowerCase().includes(search.toLowerCase());

      const matchType = selectedType === 'All' || item.type === selectedType;
      const matchListing = selectedListingType === 'All' || item.listingType === selectedListingType || item.listingType === 'both';
      const matchDistance = item.distanceKm <= maxDistance;

      return matchSearch && matchType && matchListing && matchDistance;
    });
  }, [equipmentList, search, selectedType, selectedListingType, maxDistance]);

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqForm.name) return;

    const newItem: EquipmentItem = {
      id: `eq-${Date.now()}`,
      name: newEqForm.name,
      type: newEqForm.type,
      listingType: newEqForm.listingType,
      pricePerHour: Number(newEqForm.pricePerHour),
      salePrice: newEqForm.listingType !== 'rent' ? Number(newEqForm.salePrice) : undefined,
      location: newEqForm.location,
      distanceKm: 1.2,
      ownerName: 'Ramesh Patil (You)',
      ownerPhone: '+91 98220 12345',
      rating: 5.0,
      hpRating: newEqForm.hpRating || 'Standard Farm Spec',
      imageUrl: tractorsImg,
      description: newEqForm.description || 'Verified farm equipment in working condition.',
      isAvailable: true,
      fuelType: 'Diesel'
    };

    setEquipmentList([newItem, ...equipmentList]);
    setIsAddModalOpen(false);
    setBookingSuccessToast(`Equipment '${newItem.name}' listed successfully!`);
    setTimeout(() => setBookingSuccessToast(null), 4000);
  };

  const handleConfirmBooking = () => {
    if (!bookingItem) return;
    const totalCost = bookingItem.pricePerHour * bookingHours;
    setBookingSuccessToast(
      `Slot reserved for ${bookingItem.name} on ${bookingDate} for ${bookingHours} hrs (Est. ₹${totalCost.toLocaleString('en-IN')})!`
    );
    setBookingItem(null);
    setTimeout(() => setBookingSuccessToast(null), 5000);
  };

  return (
    <div className="space-y-8 pb-12 font-sans animate-fade-up">
      {/* Toast */}
      {bookingSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bookingSuccessToast}</span>
        </div>
      )}

      {/* ─── Page Executive Header ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-display">
            <span className="text-sm">🚜</span>
            <span>Agro-Equipment & Machinery Rental Hub (कृषी यंत्रसामग्री केंद्र)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-display">
            Farm Implements & Equipment Marketplace
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
            Rent high-power tractors, combine harvesters, laser levelers, and boom sprayers by the hour from nearby verified farmers, or list your idle machinery to earn rental income.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm px-5 py-3 shadow-md shadow-green-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List Your Equipment</span>
        </button>
      </div>

      {/* ─── Search and Filters ─── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tractor model, implement, village or owner..."
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition"
            />
          </div>

          {/* Listing Type Select */}
          <div className="md:col-span-3">
            <select
              value={selectedListingType}
              onChange={(e) => setSelectedListingType(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-green-500"
            >
              <option value="All">All Listing Types</option>
              <option value="rent">🕐 For Rent (Hourly)</option>
              <option value="sell">🏷️ For Sale</option>
              <option value="both">🤝 Rent & Sell</option>
            </select>
          </div>

          {/* Max Distance Slider */}
          <div className="md:col-span-3 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <MapPin className="w-4 h-4 text-green-600 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>Radius:</span>
                <span className="text-green-700 font-black">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>
          </div>
        </div>

        {/* Equipment Type Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-gray-100">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === t
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Equipment Cards Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredEquipment.map((eq) => {
          return (
            <div
              key={eq.id}
              className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer"
            >
              {/* Image Frame */}
              <div className="relative h-44 overflow-hidden bg-gray-100">
                <img
                  src={eq.imageUrl || tractorsImg}
                  alt={eq.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="bg-green-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow">
                    {eq.type}
                  </span>
                  {eq.listingType === 'both' ? (
                    <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      Rent & Sell
                    </span>
                  ) : eq.listingType === 'sell' ? (
                    <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      For Sale
                    </span>
                  ) : (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      Hourly Rent
                    </span>
                  )}
                </div>

                {/* Distance Badge */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-gray-800 shadow flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-green-600" />
                  <span>{eq.distanceKm} km</span>
                </div>

                {/* Price Pill at Bottom Right of Image */}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-right shadow">
                  <span className="text-sm font-extrabold text-green-700">₹{eq.pricePerHour}</span>
                  <span className="text-[10px] text-gray-500 font-medium">/hr</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-green-700 transition">
                    {eq.name}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate">{eq.location}</span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{eq.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {eq.hpRating && (
                    <div className="text-[11px] font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                      {eq.hpRating}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pt-1">
                    {eq.description}
                  </p>
                </div>

                {/* Footer with Owner & Action */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Owner: <strong className="text-gray-700">{eq.ownerName}</strong></span>
                    <span className={`font-bold ${eq.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                      {eq.isAvailable ? '🟢 Available' : '🔴 In Field'}
                    </span>
                  </div>

                  <button
                    onClick={() => setBookingItem(eq)}
                    disabled={!eq.isAvailable}
                    className="w-full btn-primary text-xs py-2.5 justify-center shadow-xs"
                  >
                    <span>Book Machine →</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Add Equipment Modal ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌾</span>
                <h2 className="text-lg font-bold text-gray-900 font-display">List Your Equipment & Machinery</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEquipment} className="p-6 space-y-4">
              <div>
                <label className="label">Machine / Implement Name *</label>
                <input
                  required
                  value={newEqForm.name}
                  onChange={(e) => setNewEqForm({ ...newEqForm, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Swaraj 744 FE (48 HP) with Rotavator"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Equipment Type *</label>
                  <select
                    value={newEqForm.type}
                    onChange={(e) => setNewEqForm({ ...newEqForm, type: e.target.value as EquipmentItem['type'] })}
                    className="input-field"
                  >
                    <option value="Tractor">Tractor</option>
                    <option value="Harvester">Harvester</option>
                    <option value="Sprayer">Boom Sprayer</option>
                    <option value="Rotavator">Rotavator</option>
                    <option value="Plough">Plough</option>
                    <option value="Laser Leveler">Laser Leveler</option>
                  </select>
                </div>

                <div>
                  <label className="label">Listing Type *</label>
                  <select
                    value={newEqForm.listingType}
                    onChange={(e) => setNewEqForm({ ...newEqForm, listingType: e.target.value as EquipmentItem['listingType'] })}
                    className="input-field"
                  >
                    <option value="rent">Hourly Rental</option>
                    <option value="sell">For Sale</option>
                    <option value="both">Rent & Sell</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Hourly Rate (₹/hr) *</label>
                  <input
                    type="number"
                    min="50"
                    required
                    value={newEqForm.pricePerHour}
                    onChange={(e) => setNewEqForm({ ...newEqForm, pricePerHour: Number(e.target.value) })}
                    className="input-field"
                    placeholder="250"
                  />
                  <span className="text-[10px] text-green-700 font-bold">Standard Regional: ₹250–₹350/hr</span>
                </div>

                <div>
                  <label className="label">HP / Specification</label>
                  <input
                    value={newEqForm.hpRating}
                    onChange={(e) => setNewEqForm({ ...newEqForm, hpRating: e.target.value })}
                    className="input-field"
                    placeholder="e.g. 48 HP • Multi-speed"
                  />
                </div>
              </div>

              <div>
                <label className="label">Location / Village *</label>
                <input
                  required
                  value={newEqForm.location}
                  onChange={(e) => setNewEqForm({ ...newEqForm, location: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Niphad, Nashik"
                />
              </div>

              <div>
                <label className="label">Description & Attachments</label>
                <textarea
                  rows={2}
                  value={newEqForm.description}
                  onChange={(e) => setNewEqForm({ ...newEqForm, description: e.target.value })}
                  className="input-field"
                  placeholder="Condition, available attachments (trolley, plough), operator included etc."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Publish Equipment Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Instant Booking Modal ─── */}
      {bookingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚜</span>
                <div>
                  <h2 className="text-base font-bold text-gray-900 font-display">Reserve Equipment Slot</h2>
                  <p className="text-[11px] text-gray-500">{bookingItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setBookingItem(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-800 font-bold">Hourly Machine Tariff</div>
                  <div className="text-2xl font-black text-emerald-950 font-display">
                    ₹{bookingItem.pricePerHour}<span className="text-xs font-normal text-emerald-800"> / hour</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-emerald-700 font-medium">Owner: {bookingItem.ownerName}</div>
                  <div className="text-emerald-900 font-bold">{bookingItem.ownerPhone}</div>
                </div>
              </div>

              <div>
                <label className="label">Date of Farm Work *</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label flex justify-between">
                  <span>Required Operating Hours *</span>
                  <span className="text-green-700 font-bold">{bookingHours} Hours</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={bookingHours}
                  onChange={(e) => setBookingHours(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>1 hr</span>
                  <span>4 hrs (Half Day)</span>
                  <span>8 hrs (Full Day)</span>
                  <span>16 hrs</span>
                </div>
              </div>

              <div>
                <label className="label">Your Field / Land Parcel Location *</label>
                <input
                  value={bookingFieldLocation}
                  onChange={(e) => setBookingFieldLocation(e.target.value)}
                  className="input-field"
                  placeholder="Survey No., Village name"
                />
              </div>

              {/* Estimated Total Calculation */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Tariff ({bookingHours} hrs × ₹{bookingItem.pricePerHour}):</span>
                  <span>₹{(bookingHours * bookingItem.pricePerHour).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Operator & Transport:</span>
                  <span className="text-green-600 font-bold">Included</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-extrabold text-gray-900">
                  <span>Total Payable:</span>
                  <span className="text-green-700 text-base">₹{(bookingHours * bookingItem.pricePerHour).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBookingItem(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className="btn-primary text-xs flex-1 justify-center"
                >
                  Confirm Machine Reservation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
