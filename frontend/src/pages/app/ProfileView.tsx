// frontend/src/pages/app/ProfileView.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  History,
  Inbox,
  Receipt,
  List,
  Users,
  PlusCircle,
  Shield,
  User,
  Snowflake,
  Satellite,
  Flower2,
  BarChart3,
  Activity,
  Wheat,
  ShieldCheck,
  ArrowRight,
  LogOut,
  RotateCcw,
  CheckCircle2,
  Phone,
  Download,
  Check
} from 'lucide-react';
import type { User as UserType, Farm, CropLot, TabKey } from '../../types';
import { LanguageSelector } from '../../components/LanguageSelector';
import { CropDamageScannerModal } from '../../components/CropDamageScannerModal';

interface ProfileViewProps {
  user: UserType | null;
  farms: Farm[];
  cropLots?: CropLot[];
  onSelectTab?: (tab: TabKey) => void;
  onOpenCreateFarm?: () => void;
  onOpenCreateLot?: () => void;
  onResetDemoData: () => void;
  onLogout: () => void;
}

type ProfileTab =
  | 'overview'
  | 'bookings'
  | 'received'
  | 'invoices'
  | 'listings'
  | 'hiring'
  | 'add'
  | 'claims'
  | 'profile';

type BookingCategory = 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

interface BookingItem {
  id: string;
  equipmentName: string;
  category: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  totalPrice: number;
  duration: number;
  date: string;
  timeRange: string;
  damageReported?: boolean;
}

interface ReceivedBookingItem {
  id: string;
  equipmentName: string;
  userName: string;
  userPhone: string;
  status: 'pending' | 'upcoming' | 'confirmed' | 'completed';
  totalPrice: number;
  duration: number;
  date: string;
  damageReported?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  farms = [],
  cropLots = [],
  onSelectTab,
  onResetDemoData,
  onLogout,
}) => {
  const navigate = useNavigate();

  // Active Profile Section Tab
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<BookingCategory>('all');

  // Profile Form state
  const primaryFarm = farms[0];
  const [name, setName] = useState(user?.full_name || 'Ramesh Patil');
  const [phone, setPhone] = useState(user?.phone || '9876543210');
  const [village, setVillage] = useState(primaryFarm?.village || 'Niphad');
  const [district, setDistrict] = useState(primaryFarm?.district || 'Nashik');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Profile preferences saved successfully! 🌾');

  // Add Equipment / Listing Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('Tractor');
  const [newListingType, setNewListingType] = useState<'rent' | 'sell' | 'both'>('rent');
  const [newPrice, setNewPrice] = useState('250');
  const [newSalePrice, setNewSalePrice] = useState('');
  const [newLocation, setNewLocation] = useState('Niphad, Nashik');
  const [newDescription, setNewDescription] = useState('');

  // Sample Bookings State (Farmer Equipment / Produce Dispatch Bookings)
  const [myBookings, setMyBookings] = useState<BookingItem[]>([
    {
      id: 'b-101',
      equipmentName: 'Mahindra 575 DI Tractor with Rotavator',
      category: 'ongoing',
      status: 'confirmed',
      totalPrice: 1200,
      duration: 3,
      date: 'Today',
      timeRange: '10:00 AM – 01:00 PM',
    },
    {
      id: 'b-102',
      equipmentName: 'Reefer Cold Transit Tempo (MH-15-EG-4412)',
      category: 'upcoming',
      status: 'confirmed',
      totalPrice: 4200,
      duration: 5,
      date: 'Tomorrow, 07:00 AM',
      timeRange: 'Niphad to Mohadi Mega Food Park',
    },
    {
      id: 'b-103',
      equipmentName: 'Pimpalgaon APMC Weighbridge Inspection Lot',
      category: 'completed',
      status: 'completed',
      totalPrice: 850,
      duration: 1,
      date: 'Nov 06, 2026',
      timeRange: 'Grading Certificate Issued',
    },
  ]);

  // Sample Received Bookings / Buyer Procurement Tenders
  const [receivedBookings, setReceivedBookings] = useState<ReceivedBookingItem[]>([
    {
      id: 'rb-201',
      equipmentName: '4,000 kg Tomato (Abhinav Grade A)',
      userName: 'Sahyadri Agro Processing (Procurement)',
      userPhone: '+91 98221 44550',
      status: 'upcoming',
      totalPrice: 95200,
      duration: 4,
      date: 'Nov 10 · 08:30 AM',
    },
    {
      id: 'rb-202',
      equipmentName: 'Solar Cold Room Bay #3 (3 MT Holding)',
      userName: 'Vikas Shetkari Sangh',
      userPhone: '+91 94220 88712',
      status: 'pending',
      totalPrice: 3600,
      duration: 72,
      date: 'Nov 12 · 11:00 AM',
    },
  ]);

  // Sample Labour Hiring Campaigns
  const [labourCampaigns, setLabourCampaigns] = useState([
    {
      id: 'l-01',
      title: 'Tomato Harvest & Crate Grading Crew',
      workers: 6,
      dailyWage: 450,
      dates: 'Nov 10 – Nov 12',
      status: 'Assigned',
      leadWorker: 'Baban Shinde (+91 97632 11094)',
    },
    {
      id: 'l-02',
      title: 'Tractor Ploughing & Bed Preparation',
      workers: 2,
      dailyWage: 600,
      dates: 'Nov 15 – Nov 16',
      status: 'Open for Applicants',
      leadWorker: 'Coordinated via Niphad FPO Hub',
    },
  ]);

  // Sample Protection Claims
  const [protectionClaims, setProtectionClaims] = useState([
    {
      id: 'CLM-771',
      title: 'Transit Rain Damage Safeguard #4412',
      crop: 'Tomato (Grade A)',
      amount: '₹14,500',
      status: 'Platform Verified',
      date: 'Nov 05, 2026',
      audit: 'Digital weighbridge slip benchmark locked.',
    },
  ]);

  const firstName = (user?.full_name || 'Ramesh').split(' ')[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile preferences updated successfully! 🌾');
  };

  const handleCancelBooking = (bookingId: string) => {
    setMyBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, category: 'cancelled', status: 'cancelled' } : b))
    );
    showToast('Booking cancelled successfully.');
  };

  const handleConfirmReceived = (id: string) => {
    setReceivedBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'upcoming' } : b))
    );
    showToast('Booking verified & marked as Upcoming! ✓');
  };

  const handleFinalizeReceived = (id: string) => {
    setReceivedBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'completed' } : b))
    );
    showToast('Session finalized & settlement initiated ✓');
  };

  const handleAddEquipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      showToast('Please enter equipment or produce name');
      return;
    }
    showToast(`"${newItemName}" listed successfully! 🚜`);
    setNewItemName('');
    setNewDescription('');
    setActiveTab('listings');
  };

  const handleNavClick = (tabKey: TabKey) => {
    if (onSelectTab) {
      onSelectTab(tabKey);
    } else {
      const map: Record<string, string> = {
        'dashboard': '/app/dashboard',
        'farms': '/app/farms',
        'lots': '/app/lots',
        'decision-preview': '/app/decision',
        'market-weather': '/app/market',
        'buyers': '/app/buyers',
        'infrastructure': '/app/infra',
        'execution': '/app/execution',
        'rescue': '/app/rescue',
        'protection': '/app/protection',
        'iot-monitoring': '/app/iot',
        'schemes': '/app/schemes',
        'equipment': '/app/equipment',
        'pesticide-exchange': '/app/pesticide-exchange',
        'labour': '/app/labour',
        'legal-advisor': '/app/legal-advisor',
      };
      if (map[tabKey]) navigate(map[tabKey]);
    }
  };

  // Financial Summary Computations (Clean, Transparent Math)
  const grossEarnings = 95200;
  const gstAmount = grossEarnings * 0.05; // 5% Agri GST
  const platformFee = grossEarnings * 0.02; // 2% Service Fee
  const netEarnings = grossEarnings - gstAmount - platformFee;

  const filteredBookings =
    bookingFilter === 'all'
      ? myBookings
      : myBookings.filter((b) => b.category === bookingFilter);

  return (
    <div className="min-h-screen bg-gray-50/60 py-4 sm:py-6 text-gray-900">
      
      {/* Toast Notification */}
      {isSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-green-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-green-600/30 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Crop Health & Quality Diagnostic Modal */}
      <CropDamageScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onNavigateToRescue={() => navigate('/app/rescue')}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">

          {/* ══════════════════════════════════════════════════════════
              LEFT COLUMN: FARMER IDENTITY & NAVIGATION SIDEBAR
              ══════════════════════════════════════════════════════════ */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            
            {/* 1. Farmer Profile Badge Card (JSPM Narhe Winners Style) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              
              {/* Vibrant Emerald Avatar Square with Rounded Corners */}
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-md flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-600 text-3xl">
                <span className="select-none">👨‍🌾</span>
              </div>

              {/* Farmer Name & Village */}
              <p className="font-bold text-gray-900 text-base font-display">{name}</p>
              <p className="text-xs sm:text-sm text-gray-500 capitalize mt-0.5">
                Farmer · {village}, {district}
              </p>

              {/* Trust Score Progress Bar & Trusted Badge */}
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all duration-1000"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-gray-400">Trust Index:</span>
                  <span className="text-green-600 font-bold">100%</span>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-black uppercase rounded-lg border border-green-200 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span>Trusted Farmer</span>
                </span>
              </div>
            </div>

            {/* 2. Sidebar Navigation Card (Exact Reference Project Menu) */}
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-sm font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all duration-150 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-green-600 text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center justify-between px-5 py-3.5 transition-all duration-150 cursor-pointer border-t border-gray-50 ${
                  activeTab === 'bookings'
                    ? 'bg-green-600 text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 shrink-0" />
                  <span>My Bookings</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {myBookings.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('received')}
                className={`w-full flex items-center justify-between px-5 py-3.5 transition-all duration-150 cursor-pointer border-t border-gray-50 ${
                  activeTab === 'received'
                    ? 'bg-green-600 text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4 shrink-0" />
                  <span>Received Bookings</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'received' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-800'
                }`}>
                  {receivedBookings.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all duration-150 cursor-pointer border-t border-gray-50 ${
                  activeTab === 'invoices'
                    ? 'bg-green-600 text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Receipt className="w-4 h-4 shrink-0" />
                <span>Fin & Invoices</span>
              </button>

              <button
                onClick={() => setActiveTab('listings')}
                className={`w-full flex items-center justify-between px-5 py-3.5 transition-all duration-150 cursor-pointer border-t border-gray-50 ${
                  activeTab === 'listings'
                    ? 'bg-green-600 text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <List className="w-4 h-4 shrink-0" />
                  <span>My Listings</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'listings' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {farms.length + (cropLots.length || 1)}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('hiring')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all duration-150 cursor-pointer border-t border-gray-50 ${
                  activeTab === 'hiring'
                    ? 'bg-green-600 text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Labour & Freight</span>
              </button>

              <button
                onClick={() => setActiveTab('add')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all duration-150 cursor-pointer border-t border-gray-50 ${
                  activeTab === 'add'
                    ? 'bg-green-600 text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>Add Equipment & Land</span>
              </button>

              <button
                onClick={() => setActiveTab('claims')}
                className={`w-full flex items-center justify-between px-5 py-3.5 transition-all duration-150 cursor-pointer border-t border-gray-50 ${
                  activeTab === 'claims'
                    ? 'bg-green-600 text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Protection Claims</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'claims' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {protectionClaims.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all duration-150 cursor-pointer border-t border-gray-50 ${
                  activeTab === 'profile'
                    ? 'bg-green-600 text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>My Profile</span>
              </button>
            </nav>

            {/* Quick Session Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-xs space-y-2">
              <div className="flex items-center justify-between text-gray-500 font-medium">
                <span>Account Status:</span>
                <span className="text-green-600 font-bold">Active Verified</span>
              </div>
              <div className="flex items-center justify-between text-gray-500 font-medium pt-1 border-t border-gray-50">
                <span>Language:</span>
                <LanguageSelector />
              </div>
            </div>

          </aside>

          {/* ══════════════════════════════════════════════════════════
              RIGHT MAIN CONTENT AREA
              ══════════════════════════════════════════════════════════ */}
          <main className="flex-1 min-w-0 w-full space-y-6">

            {/* ──────────────────────────────────────────────────────────
                TAB 1: OVERVIEW (HOME DASHBOARD VIEW)
                ────────────────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 1. Friendly Human Welcome Header */}
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-display">
                  Welcome back, {firstName}! 👋
                </h2>

                {/* 2. Four Soft Pastel Stat Cards (JSPM Narhe Winners Style) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Bookings */}
                  <div
                    onClick={() => setActiveTab('bookings')}
                    className="rounded-2xl p-4 md:p-5 bg-blue-50 text-blue-700 border border-blue-100 hover:-translate-y-1 transition-all cursor-pointer shadow-xs"
                  >
                    <p className="text-xl md:text-2xl font-black font-display">{myBookings.length}</p>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-tight opacity-70 mt-1">
                      TOTAL BOOKINGS
                    </p>
                  </div>

                  {/* Upcoming Dispatches */}
                  <div
                    onClick={() => {
                      setActiveTab('bookings');
                      setBookingFilter('upcoming');
                    }}
                    className="rounded-2xl p-4 md:p-5 bg-yellow-50 text-yellow-700 border border-yellow-100 hover:-translate-y-1 transition-all cursor-pointer shadow-xs"
                  >
                    <p className="text-xl md:text-2xl font-black font-display">
                      {myBookings.filter((b) => b.category === 'upcoming').length}
                    </p>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-tight opacity-70 mt-1">
                      UPCOMING
                    </p>
                  </div>

                  {/* My Listings */}
                  <div
                    onClick={() => setActiveTab('listings')}
                    className="rounded-2xl p-4 md:p-5 bg-purple-50 text-purple-700 border border-purple-100 hover:-translate-y-1 transition-all cursor-pointer shadow-xs"
                  >
                    <p className="text-xl md:text-2xl font-black font-display">
                      {farms.length + (cropLots.length || 1)}
                    </p>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-tight opacity-70 mt-1">
                      MY LISTINGS
                    </p>
                  </div>

                  {/* Net Profit Realization */}
                  <div
                    onClick={() => setActiveTab('invoices')}
                    className="rounded-2xl p-4 md:p-5 bg-green-50 text-green-700 border border-green-100 hover:-translate-y-1 transition-all cursor-pointer shadow-xs"
                  >
                    <p className="text-xl md:text-2xl font-black font-display">₹{netEarnings.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-tight opacity-70 mt-1">
                      NET PROFIT
                    </p>
                  </div>
                </div>

                {/* 3. Smart Farming Services Section Header */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span>SMART FARMING SERVICES</span>
                  </h3>

                  {/* 2x2 Grid of Large Rounded Service Action Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Service 1: Cold Storage Locator */}
                    <button
                      type="button"
                      onClick={() => handleNavClick('infrastructure')}
                      className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-5 group cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110 shrink-0">
                        <Snowflake className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 leading-tight text-base font-display">
                          Cold Storage Locator
                        </h4>
                        <p className="text-xs text-gray-400 font-medium mt-1">
                          Preserve your harvest. Find nearby cold chain units.
                        </p>
                      </div>
                    </button>

                    {/* Service 2: Crop Protection Claims */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('claims')}
                      className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-5 group cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110 shrink-0">
                        <Satellite className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 leading-tight text-base font-display">
                          Crop Protection Claims
                        </h4>
                        <p className="text-xs text-gray-400 font-medium mt-1">
                          Platform-backed claims. Rapid audit via weighbridge & deal ledger.
                        </p>
                      </div>
                    </button>

                    {/* Service 3: Crop Disease Scanner */}
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-5 group cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110 shrink-0">
                        <Flower2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 leading-tight text-base font-display">
                          Crop Disease Scanner
                        </h4>
                        <p className="text-xs text-gray-400 font-medium mt-1">
                          Detect crop pathology and check harvest Brix quality grading.
                        </p>
                      </div>
                    </button>

                    {/* Service 4: Profit & Risk Analyzer */}
                    <button
                      type="button"
                      onClick={() => handleNavClick('decision-preview')}
                      className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-5 group cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110 shrink-0">
                        <BarChart3 className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 leading-tight text-base font-display">
                          Profit & Risk Analyzer
                        </h4>
                        <p className="text-xs text-gray-400 font-medium mt-1">
                          Market insights. Compare 5 selling routes & net profit.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 4. Three Deep Colored Feature Highlight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Card A: ESP32 Live Telematics Widget */}
                  <div
                    onClick={() => handleNavClick('iot-monitoring')}
                    className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl p-6 border border-indigo-800 shadow-xl relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full bg-blue-500/20 group-hover:bg-blue-400/30 transition-colors" />
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-300 shadow-inner">
                          <Activity className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest px-2.5 py-0.5 bg-white/5 rounded-full border border-white/10">
                            ESP32 LIVE
                          </span>
                          <span className="text-[9px] font-black text-green-400 uppercase animate-pulse">
                            Irrigation Active
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                          <p className="text-[9px] font-black text-blue-300/60 uppercase tracking-widest mb-1">
                            SOIL MOISTURE
                          </p>
                          <p className="text-xl font-black text-white font-display">68%</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                          <p className="text-[9px] font-black text-blue-300/60 uppercase tracking-widest mb-1">
                            TEMPERATURE
                          </p>
                          <p className="text-xl font-black text-white font-display">24.5°C</p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-xs font-bold text-white uppercase tracking-widest group-hover:text-blue-300 transition-colors flex items-center gap-2">
                          OPEN FARM PORTAL <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                        <div className="text-[10px] text-white/40 font-mono">ID: esp32_01</div>
                      </div>
                    </div>
                  </div>

                  {/* Card B: Mandi Market Advisor Widget */}
                  <div
                    onClick={() => handleNavClick('market-weather')}
                    className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-3xl p-6 border border-emerald-800 shadow-xl relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full bg-emerald-500/20 group-hover:bg-emerald-400/30 transition-colors" />
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-300 shadow-inner">
                          <Wheat className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest px-2.5 py-0.5 bg-white/5 rounded-full border border-white/10">
                          AGMARKNET LIVE
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-lg font-display">Mandi Market Advisor</h3>
                      <p className="text-emerald-200/80 text-xs font-medium mt-1 mb-6">
                        Real Agmarknet mandi prices, modal price trends & weather insights directly.
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-xs font-bold text-white uppercase tracking-widest group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                          EXPLORE NOW <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                        <div className="text-[10px] text-white/40 font-mono">APMC: Nashik</div>
                      </div>
                    </div>
                  </div>

                  {/* Card C: Damage Protection Fund (Full Width Banner) */}
                  <div
                    onClick={() => setActiveTab('claims')}
                    className="col-span-1 md:col-span-2 bg-gradient-to-br from-red-950 via-rose-950 to-stone-900 rounded-3xl p-6 border border-rose-900 shadow-xl relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 blur-[70px] rounded-full bg-rose-500/20 group-hover:bg-rose-400/30 transition-colors" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-rose-300">
                            <Shield className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest px-2.5 py-0.5 bg-white/5 rounded-full border border-white/10">
                            ACTIVE PROTECTION
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-lg font-display">Damage Protection Fund</h3>
                        <p className="text-rose-200/80 text-xs font-medium max-w-xl">
                          Platform-backed coverage for all harvest dispatches. Digital agreements verified with cryptographic security.
                        </p>
                      </div>

                      <span className="self-start sm:self-center shrink-0 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2">
                        <span>VIEW ACTIVE CLAIMS</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Recent Activity Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm font-display">Recent Activity</h3>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all</span>
                      <span>→</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {myBookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-100 text-green-800 flex items-center justify-center font-bold text-sm">
                            🚜
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{b.equipmentName}</div>
                            <div className="text-[11px] text-gray-500">
                              {b.date} · {b.timeRange}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            b.category === 'ongoing'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : b.category === 'upcoming'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {b.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────
                TAB 2: MY BOOKINGS (EQUIPMENT & LOGISTICS BOOKINGS)
                ────────────────────────────────────────────────────────── */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-display">My Bookings</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Manage rental equipment, cold bays, and transit bookings</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="btn-primary text-xs py-2 px-4 shadow-sm"
                  >
                    + Book Equipment
                  </button>
                </div>

                {/* Filter Status Tabs */}
                <div className="flex gap-2 flex-wrap bg-gray-50 rounded-2xl p-1.5 border border-gray-100 text-xs">
                  {(['all', 'upcoming', 'ongoing', 'completed', 'cancelled'] as BookingCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setBookingFilter(cat)}
                      className={`px-4 py-2 rounded-xl font-bold capitalize transition-all cursor-pointer ${
                        bookingFilter === cat
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat} (
                      {cat === 'all' ? myBookings.length : myBookings.filter((b) => b.category === cat).length})
                    </button>
                  ))}
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-3xl mb-2">📅</p>
                    <p className="font-bold text-sm">No {bookingFilter !== 'all' ? bookingFilter : ''} bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((b) => (
                      <div
                        key={b.id}
                        className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                          b.category === 'ongoing'
                            ? 'border-green-300 bg-green-50/40'
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
                              🚜
                            </div>
                            <div>
                              <h4 className="font-black text-gray-900 text-sm sm:text-base font-display">
                                {b.equipmentName}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                                  {b.category}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                  {b.date} · {b.timeRange}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
                            <p className="text-lg font-black text-gray-900 font-display">₹{b.totalPrice.toLocaleString()}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase">{b.duration} HR SESSION</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2 text-xs">
                          {b.category !== 'cancelled' && b.category !== 'completed' && (
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition cursor-pointer"
                            >
                              Cancel Booking
                            </button>
                          )}
                          <button
                            onClick={() => showToast(`Session verified for ${b.equipmentName}`)}
                            className="btn-primary text-xs py-2 px-4"
                          >
                            View Booking Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────
                TAB 3: RECEIVED BOOKINGS (BUYER PROCUREMENT OFFERS)
                ────────────────────────────────────────────────────────── */}
            {activeTab === 'received' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-display">Received Bookings & Buyer Tenders</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Procurement requests from verified buyers and processors</p>
                  </div>
                  <span className="badge-green text-xs font-bold">
                    {receivedBookings.length} Active Tenders
                  </span>
                </div>

                <div className="space-y-4">
                  {receivedBookings.map((b) => (
                    <div key={b.id} className="border border-gray-100 rounded-2xl p-5 bg-white hover:border-gray-200 transition-all space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center text-2xl shrink-0">
                            🌾
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-sm sm:text-base font-display">
                              {b.equipmentName}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Booked by: <strong className="text-gray-800">{b.userName}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-lg font-black text-green-700 font-display">₹{b.totalPrice.toLocaleString()}</p>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            b.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      </div>

                      {/* Contact & Direct Communication Strip */}
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-gray-800">{b.userPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${b.userPhone}`}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
                          >
                            Call Buyer
                          </a>
                          <a
                            href={`https://wa.me/91${b.userPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold hover:bg-emerald-200 transition"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>

                      {/* Operational Actions */}
                      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-50">
                        {b.status === 'pending' && (
                          <button
                            onClick={() => handleConfirmReceived(b.id)}
                            className="btn-primary text-xs py-2 px-4"
                          >
                            Verify & Confirm Tender ✓
                          </button>
                        )}
                        {b.status === 'upcoming' && (
                          <button
                            onClick={() => handleFinalizeReceived(b.id)}
                            className="btn-primary text-xs py-2 px-4"
                          >
                            Finalize Handover & Weighbridge
                          </button>
                        )}
                        {b.status === 'completed' && (
                          <span className="text-xs text-green-700 font-bold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Delivery Completed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────
                TAB 4: FIN & INVOICES
                ────────────────────────────────────────────────────────── */}
            {activeTab === 'invoices' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-display">Financial Realization & Invoices</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Transparent ledger breakdown of gross sales, deductions & net payout</p>
                  </div>
                  <button
                    onClick={() => showToast('GST Statement downloaded to downloads folder.')}
                    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Summary</span>
                  </button>
                </div>

                {/* 3 Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      GROSS SALE VALUE
                    </span>
                    <span className="text-2xl font-black text-gray-900 font-display mt-1 block">
                      ₹{grossEarnings.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">From 1 harvest dispatch lot</span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                      STATUTORY GST & FEES
                    </span>
                    <span className="text-2xl font-black text-rose-600 font-display mt-1 block">
                      -₹{(gstAmount + platformFee).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">5% GST + 2% platform fee</span>
                  </div>

                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider block">
                      NET FARMER PAYOUT
                    </span>
                    <span className="text-2xl font-black text-green-700 font-display mt-1 block">
                      ₹{netEarnings.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-green-600 mt-0.5 block">Escrow released to bank</span>
                  </div>
                </div>

                {/* Invoices List Table */}
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 text-sm font-display">Generated Tax Invoices</h3>
                  <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between font-bold text-gray-500 uppercase text-[10px]">
                      <span>Invoice / Batch</span>
                      <span>Recipient</span>
                      <span>Net Amount</span>
                      <span>Action</span>
                    </div>
                    <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <div>
                        <p className="font-bold text-gray-900">INV-2026-NPH-0082</p>
                        <p className="text-[11px] text-gray-400">4,000 kg Tomato • Nov 08, 2026</p>
                      </div>
                      <div className="text-gray-700 font-medium">Sahyadri Agro Processing</div>
                      <div className="font-black text-green-700">₹88,536.00</div>
                      <button
                        onClick={() => showToast('Downloading Tax Invoice PDF...')}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-bold hover:bg-green-100 transition cursor-pointer"
                      >
                        PDF Receipt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────
                TAB 5: MY LISTINGS (FARMS & HARVEST LOTS)
                ────────────────────────────────────────────────────────── */}
            {activeTab === 'listings' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-display">My Listings & Land Holdings</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Active farm parcels, crop lots, and shared farm implements</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    + Add New Listing
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {farms.map((f) => (
                    <div key={f.id} className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-green-300 transition-all space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center text-xl">
                            🌱
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm font-display">{f.farm_name}</h4>
                            <p className="text-xs text-gray-500">{f.village}, {f.district}</p>
                          </div>
                        </div>
                        <span className="badge-green text-[10px]">
                          {f.land_area} ACRES
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {f.soil_type || 'Medium Black'} soil with {f.irrigation_type || 'Drip Irrigation'}. Active APMC geo-tagging synced.
                      </p>
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-mono text-[11px]">{f.gps_coordinates || '20.08°N, 74.04°E'}</span>
                        <button
                          onClick={() => handleNavClick('farms')}
                          className="text-green-600 font-bold hover:underline"
                        >
                          View 3D Cadastral
                        </button>
                      </div>
                    </div>
                  ))}

                  {cropLots.map((lot) => (
                    <div key={lot.id} className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-green-300 transition-all space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl">
                            🍅
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm font-display">{lot.crop_name}</h4>
                            <p className="text-xs text-gray-500">Grade {lot.quality_grade || 'A'} · Brix {lot.brix || '5.2'}</p>
                          </div>
                        </div>
                        <span className="badge-green text-[10px]">
                          {Number(lot.quantity_kg_normalized).toLocaleString()} KG
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Harvest produce lot registered for multi-channel profit evaluation. Ready for buyer dispatch.
                      </p>
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Target: Sahyadri Processing</span>
                        <button
                          onClick={() => handleNavClick('lots')}
                          className="text-green-600 font-bold hover:underline"
                        >
                          Manage Lot
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────
                TAB 6: LABOUR HIRING & REEFER FREIGHT
                ────────────────────────────────────────────────────────── */}
            {activeTab === 'hiring' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-display">Labour & Freight Logistics</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Organize harvest crews, tractor operators & reefer transport</p>
                  </div>
                  <button
                    onClick={() => showToast('Labour hiring request initiated.')}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    + Hire Labour Crew
                  </button>
                </div>

                <div className="space-y-4">
                  {labourCampaigns.map((c) => (
                    <div key={c.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base font-display">{c.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'Assigned' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {c.workers} Workers · ₹{c.dailyWage}/day per worker · Dates: {c.dates}
                        </p>
                        <p className="text-xs text-gray-600 font-medium pt-1">
                          Coordinator: {c.leadWorker}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => showToast(`Contacting lead worker for ${c.title}`)}
                          className="btn-secondary text-xs py-2 px-3"
                        >
                          Contact Crew
                        </button>
                        <button
                          onClick={() => handleNavClick('infrastructure')}
                          className="btn-primary text-xs py-2 px-3"
                        >
                          Book Reefer Truck
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────
                TAB 7: ADD EQUIPMENT & LAND / PRODUCE
                ────────────────────────────────────────────────────────── */}
            {activeTab === 'add' && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-display">List Your Equipment & Farm Assets 🌾</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Share tractors, implements, cold bays, or farmland with fellow farmers</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="text-xs font-bold text-green-600 hover:text-green-700"
                  >
                    ← Back to Overview
                  </button>
                </div>

                <form onSubmit={handleAddEquipmentSubmit} className="space-y-5 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Equipment / Asset Name *
                      </label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g. Mahindra 575 DI or Solar Cold Unit"
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Category *
                      </label>
                      <select
                        value={newItemType}
                        onChange={(e) => setNewItemType(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 outline-none transition"
                      >
                        <option>Tractor</option>
                        <option>Harvester</option>
                        <option>Sprayer</option>
                        <option>Rotavator</option>
                        <option>Plough</option>
                        <option>Cold Storage Bay</option>
                        <option>Farmland Parcel</option>
                      </select>
                    </div>
                  </div>

                  {/* Listing Type Toggle Buttons */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Listing Type *
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { val: 'rent', label: '🕐 For Rent', desc: 'Hourly / daily rental' },
                        { val: 'sell', label: '🏷️ For Sale', desc: 'One-time transfer' },
                        { val: 'both', label: '🤝 Rent & Sell', desc: 'Both options open' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setNewListingType(opt.val as any)}
                          className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                            newListingType === opt.val
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <div className="font-bold text-xs">{opt.label}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Rental Price (₹ / Hour or Day)
                      </label>
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 outline-none transition"
                        placeholder="e.g. 250"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Location / Village *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 outline-none transition"
                          placeholder="e.g. Niphad, Nashik"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Description & Details
                    </label>
                    <textarea
                      rows={3}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Condition, attachments, availability hours..."
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 outline-none transition"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      className="btn-primary text-sm py-3 px-6 shadow-green"
                    >
                      Publish Listing 🚜
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="btn-ghost text-sm py-3 px-4"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────
                TAB 8: PROTECTION CLAIMS
                ────────────────────────────────────────────────────────── */}
            {activeTab === 'claims' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-display">Farmer Protection & Escrow Safeguard</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Platform-backed security against transit loss, buyer default, or weighbridge disputes</p>
                  </div>
                  <button
                    onClick={() => handleNavClick('protection')}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    + Open Protection Ledger
                  </button>
                </div>

                <div className="space-y-4">
                  {protectionClaims.map((claim) => (
                    <div key={claim.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                            🛡️
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm font-display">{claim.title}</h4>
                            <p className="text-xs text-gray-500">Case ID: {claim.id} · {claim.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-rose-700 text-sm">{claim.amount}</span>
                          <span className="badge-green text-[10px]">{claim.status}</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                        {claim.audit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────
                TAB 9: MY PROFILE & SETTINGS
                ────────────────────────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-display">My Profile & Account Preferences</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Manage your farmer credentials, contact details, and platform language.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="text-xs font-bold text-green-600 hover:text-green-700"
                  >
                    ← Back to Overview
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5 max-w-xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Farmer Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                      placeholder="e.g. Ramesh Patil"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Mobile Phone (Registered with APMC)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Village / Taluka
                      </label>
                      <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                        placeholder="e.g. Niphad"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        District
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                        placeholder="e.g. Nashik"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Interface & Regional Language
                    </label>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Select Language:</span>
                      <LanguageSelector />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      type="submit"
                      className="btn-primary text-xs py-2.5 px-6 shadow-sm"
                    >
                      Save Profile Changes ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="btn-ghost text-xs py-2.5 px-4"
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                {/* Account Actions: Reset Demo Data & Sign Out */}
                <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <button
                    onClick={onResetDemoData}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-green-700 font-semibold cursor-pointer transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo Data to Initial Scenario</span>
                  </button>

                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold cursor-pointer transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out of Session</span>
                  </button>
                </div>
              </div>
            )}

          </main>

        </div>
      </div>
    </div>
  );
};
