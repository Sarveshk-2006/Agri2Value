// frontend/src/pages/app/LabourView.tsx
import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Star,
  Phone,
  ShieldCheck,
  ChevronRight,
  Plus,
  Minus,
  X,
  FileCheck
} from 'lucide-react';

export interface LabourCrew {
  id: string;
  gangName: string;
  mukadamName: string;
  phone: string;
  skillType: 'Harvesting' | 'Spraying' | 'Irrigation' | 'General Labour' | 'Tractor Driving' | 'Pruning';
  availableWorkers: number;
  dailyWagePerWorker: number;
  village: string;
  distanceKm: number;
  rating: number;
  completedJobs: number;
  experienceYears: number;
  specialization: string;
  isAvailableToday: boolean;
}

const INITIAL_CREWS: LabourCrew[] = [
  {
    id: 'crew-1',
    gangName: 'Sahyadri Tomato & Grape Harvest Squad',
    mukadamName: 'Pandurang Shinde (Mukadam)',
    phone: '+91 98229 11045',
    skillType: 'Harvesting',
    availableWorkers: 12,
    dailyWagePerWorker: 450,
    village: 'Niphad, Nashik',
    distanceKm: 2.1,
    rating: 4.9,
    completedJobs: 142,
    experienceYears: 8,
    specialization: 'Perishable tomato sorting & damage-free grape bunch harvesting',
    isAvailableToday: true,
  },
  {
    id: 'crew-2',
    gangName: 'Shri Ram Certified Spraying Squad',
    mukadamName: 'Santosh Gaikwad (Leader)',
    phone: '+91 94235 66710',
    skillType: 'Spraying',
    availableWorkers: 4,
    dailyWagePerWorker: 550,
    village: 'Dindori, Nashik',
    distanceKm: 4.5,
    rating: 5.0,
    completedJobs: 98,
    experienceYears: 6,
    specialization: 'Battery & tractor boom spraying with safety PPE & calibrated nozzle speeds',
    isAvailableToday: true,
  },
  {
    id: 'crew-3',
    gangName: 'Khandesh Vineyard & Orchard Pruning Gang',
    mukadamName: 'Kailas Jadhav',
    phone: '+91 98901 88320',
    skillType: 'Pruning',
    availableWorkers: 8,
    dailyWagePerWorker: 500,
    village: 'Pimpalgaon Baswant, Nashik',
    distanceKm: 5.8,
    rating: 4.8,
    completedJobs: 86,
    experienceYears: 10,
    specialization: 'Sub-cane thinning, forward spur pruning, and shoot positioning',
    isAvailableToday: true,
  },
  {
    id: 'crew-4',
    gangName: 'Maratha Heavy Tractor & Machinery Operators',
    mukadamName: 'Raju More',
    phone: '+91 97631 44521',
    skillType: 'Tractor Driving',
    availableWorkers: 3,
    dailyWagePerWorker: 650,
    village: 'Yeola, Nashik',
    distanceKm: 11.2,
    rating: 4.9,
    completedJobs: 114,
    experienceYears: 7,
    specialization: 'Laser leveling, deep subsoil ripping, and rotavator pulverization',
    isAvailableToday: false,
  },
  {
    id: 'crew-5',
    gangName: 'Godavari General Agricultural Crew',
    mukadamName: 'Babanrao Kadam',
    phone: '+91 98502 33189',
    skillType: 'General Labour',
    availableWorkers: 15,
    dailyWagePerWorker: 400,
    village: 'Ozar, Nashik',
    distanceKm: 3.5,
    rating: 4.7,
    completedJobs: 175,
    experienceYears: 12,
    specialization: 'Weeding, mulching, drip lateral laying, and produce crate loading',
    isAvailableToday: true,
  },
  {
    id: 'crew-6',
    gangName: 'Drip & Micro-Irrigation Installation Crew',
    mukadamName: 'Mahesh Wagh',
    phone: '+91 94220 77931',
    skillType: 'Irrigation',
    availableWorkers: 5,
    dailyWagePerWorker: 480,
    village: 'Lasalgaon, Nashik',
    distanceKm: 14.0,
    rating: 4.8,
    completedJobs: 62,
    experienceYears: 5,
    specialization: 'Online dripper fitting, sand media backwash servicing, and venturi automation',
    isAvailableToday: true,
  }
];

export const LabourView: React.FC = () => {
  const [crews, setCrews] = useState<LabourCrew[]>(INITIAL_CREWS);
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [requiredDate, setRequiredDate] = useState(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toISOString().split('T')[0];
  });

  // Modal
  const [bookingCrew, setBookingCrew] = useState<LabourCrew | null>(null);
  const [workersCount, setWorkersCount] = useState<number>(4);
  const [jobLocation, setJobLocation] = useState('Patil Krishi Farm, Survey 42/1, Niphad');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const skills = ['All', 'Harvesting', 'Spraying', 'Irrigation', 'General Labour', 'Tractor Driving', 'Pruning'];

  const filteredCrews = useMemo(() => {
    return crews.filter((c) => {
      const matchSearch =
        c.gangName.toLowerCase().includes(search.toLowerCase()) ||
        c.mukadamName.toLowerCase().includes(search.toLowerCase()) ||
        c.village.toLowerCase().includes(search.toLowerCase());

      const matchSkill = selectedSkill === 'All' || c.skillType === selectedSkill;

      return matchSearch && matchSkill;
    });
  }, [crews, search, selectedSkill]);

  const handleOpenBooking = (crew: LabourCrew) => {
    setBookingCrew(crew);
    setWorkersCount(Math.min(4, crew.availableWorkers));
  };

  const handleConfirmBooking = () => {
    if (!bookingCrew) return;
    const totalWage = workersCount * bookingCrew.dailyWagePerWorker;
    setToastMessage(
      `Labour request sent to ${bookingCrew.mukadamName}! ${workersCount} workers booked for ${requiredDate} (Est. ₹${totalWage.toLocaleString('en-IN')}).`
    );
    setBookingCrew(null);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-8 pb-12 font-sans animate-fade-up">
      {/* Toast */}
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
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Farm Labour & Harvesting Crew Coordinator (शेतमजूर व तोडणी कामगार)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-display">
            Agricultural Labour & Harvesting Crews
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
            Hire verified local harvest teams, certified sprayers, and tractor operators with standardized daily wages, transparent crew counts, and zero middleman commissions.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 self-stretch md:self-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            👥
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Available Labour Network</div>
            <div className="text-xl font-black text-emerald-900 font-display">47 Field Workers</div>
            <div className="text-[11px] text-emerald-700 font-medium">Standard Daily Wage: ₹400–₹550/day</div>
          </div>
        </div>
      </div>

      {/* ─── Filters & Search Bar ─── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gang name, mukadam, village or specialized skill..."
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <Calendar className="w-4 h-4 text-green-600 shrink-0" />
            <div className="flex-1">
              <div className="text-[10px] font-bold text-gray-500 uppercase">Work Date Required</div>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none w-full"
              />
            </div>
          </div>
        </div>

        {/* Skill Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-gray-100">
          {skills.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSkill(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSkill === s
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Labour Crew Cards Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCrews.map((crew) => {
          return (
            <div
              key={crew.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between space-y-5"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    {crew.skillType}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{crew.rating.toFixed(1)}</span>
                    <span className="text-gray-400 font-normal">({crew.completedJobs})</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-base font-display leading-snug">
                    {crew.gangName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>{crew.village} ({crew.distanceKm} km away)</span>
                  </div>
                </div>

                {/* Daily Wage Callout */}
                <div className="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-emerald-800 uppercase">Daily Wage Rate</div>
                    <div className="text-xl font-black text-emerald-950 font-display">
                      ₹{crew.dailyWagePerWorker} <span className="text-xs font-normal text-emerald-800">/ worker / day</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase">Crew Capacity</div>
                    <div className="text-sm font-extrabold text-emerald-900">
                      {crew.availableWorkers} Workers
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-600">
                  <div className="font-bold text-gray-800">Mukadam: <span className="font-normal text-gray-700">{crew.mukadamName}</span></div>
                  <div className="font-bold text-gray-800">Specialization: <span className="font-normal text-gray-600">{crew.specialization}</span></div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{crew.experienceYears} Years Track Record</span>
                  <span className={`font-bold ${crew.isAvailableToday ? 'text-green-600' : 'text-gray-400'}`}>
                    {crew.isAvailableToday ? '🟢 Ready for Dispatch' : '🔴 Booked Today'}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenBooking(crew)}
                  className="w-full btn-primary text-xs py-2.5 justify-center shadow-xs"
                >
                  <span>Book Crew for {requiredDate} →</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Booking Modal ─── */}
      {bookingCrew && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">👥</span>
                <div>
                  <h2 className="text-base font-bold text-gray-900 font-display">Book Farm Labour Crew</h2>
                  <p className="text-[11px] text-gray-500">{bookingCrew.gangName}</p>
                </div>
              </div>
              <button
                onClick={() => setBookingCrew(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-800">Rate per Worker:</span>
                  <span className="font-black text-emerald-950 font-display text-base">₹{bookingCrew.dailyWagePerWorker} / day</span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-700">
                  <span>Mukadam Contact:</span>
                  <span className="font-bold text-emerald-900">{bookingCrew.phone}</span>
                </div>
              </div>

              <div>
                <label className="label">Scheduled Date of Field Work *</label>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label flex justify-between">
                  <span>Number of Workers Required *</span>
                  <span className="text-green-700 font-bold">{workersCount} Workers</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setWorkersCount(Math.max(1, workersCount - 1))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max={bookingCrew.availableWorkers}
                    value={workersCount}
                    onChange={(e) => setWorkersCount(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <button
                    type="button"
                    onClick={() => setWorkersCount(Math.min(bookingCrew.availableWorkers, workersCount + 1))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>1 Worker</span>
                  <span>Max Available: {bookingCrew.availableWorkers} Workers</span>
                </div>
              </div>

              <div>
                <label className="label">Farm Parcel & Field Location *</label>
                <input
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  className="input-field"
                  placeholder="Village, Survey number, landmark"
                />
              </div>

              {/* Wage Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Daily Wage ({workersCount} workers × ₹{bookingCrew.dailyWagePerWorker}):</span>
                  <span>₹{(workersCount * bookingCrew.dailyWagePerWorker).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Coordination Fee:</span>
                  <span className="text-green-600 font-bold">₹0 (Free Service)</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-extrabold text-gray-900">
                  <span>Estimated Total Daily Payout:</span>
                  <span className="text-green-700 text-base">₹{(workersCount * bookingCrew.dailyWagePerWorker).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBookingCrew(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className="btn-primary text-xs flex-1 justify-center"
                >
                  Confirm Labour Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

