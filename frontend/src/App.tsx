// frontend/src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PublicNavbar } from './components/public/PublicNavbar';
import { PublicFooter } from './components/public/PublicFooter';

// Public Pages
import { HomeView } from './pages/public/HomeView';
import { AboutView } from './pages/public/AboutView';
import { HowItWorksView } from './pages/public/HowItWorksView';
import { FeaturesView } from './pages/public/FeaturesView';
import { ContactView } from './pages/public/ContactView';

// Auth Pages
import { LoginView } from './pages/auth/LoginView';
import { RegisterView } from './pages/auth/RegisterView';

// Authenticated Application Views
import { DashboardView } from './components/DashboardView';
import { FarmsView } from './components/FarmsView';
import { HarvestLotsView } from './components/HarvestLotsView';
import { DecisionEngineView } from './components/DecisionEngineView';
import { MarketWeatherView } from './components/MarketWeatherView';
import { BuyersView } from './components/BuyersView';
import { InfrastructureView } from './components/InfrastructureView';
import { ExecutionRequestsView } from './components/ExecutionRequestsView';
import { CropRescueView } from './components/CropRescueView';
import { IoTMonitoringView } from './components/IoTMonitoringView';
import { ProtectionView } from './components/ProtectionView';
import { SpecsView } from './components/SpecsView';
import { ProfileView } from './pages/app/ProfileView';
import { NotFoundView } from './pages/NotFoundView';

import { api, DEFAULT_DEMO_USER } from './api';
import type { CropLot, Farm, User, TabKey } from './types';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { FarmerChatbot } from './components/FarmerChatbot';
import { MobileNav } from './components/MobileNav';

/* ──────────────────────────────────────────────────────────
   1. PUBLIC WEBSITE WRAPPER COMPONENT
   ────────────────────────────────────────────────────────── */
interface PublicLayoutProps {
  user: User | null;
  onLogout: () => void;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <PublicNavbar user={user} onLogout={onLogout} />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   2. AUTHENTICATED APP WRAPPER COMPONENT
   ────────────────────────────────────────────────────────── */
interface AppLayoutProps {
  user: User | null;
  backendOnline: boolean;
  farms: Farm[];
  cropLots: CropLot[];
  onLogout: () => void;
  onResetDemoData: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  backendOnline,
  farms,
  cropLots,
  onLogout,
  onResetDemoData,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // If user is logged out, immediately protect the /app route and redirect to home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Map route pathname to active TabKey
  const getTabKeyFromPath = (path: string): TabKey => {
    if (path.includes('/app/farms')) return 'farms';
    if (path.includes('/app/lots')) return 'lots';
    if (path.includes('/app/decision')) return 'decision-preview';
    if (path.includes('/app/market')) return 'market-weather';
    if (path.includes('/app/buyers')) return 'buyers';
    if (path.includes('/app/infra')) return 'infrastructure';
    if (path.includes('/app/execution')) return 'execution';
    if (path.includes('/app/rescue')) return 'rescue';
    if (path.includes('/app/protection')) return 'protection';
    if (path.includes('/app/iot')) return 'iot-monitoring';
    if (path.includes('/app/profile')) return 'profile';
    if (path.includes('/app/specs')) return 'specs';
    return 'dashboard';
  };

  const activeTab = getTabKeyFromPath(location.pathname);

  const handleSelectTab = (tab: TabKey) => {
    const routeMap: Record<TabKey, string> = {
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
      'profile': '/app/profile',
      'specs': '/app/specs',
    };
    if (routeMap[tab]) {
      navigate(routeMap[tab]);
    }
  };

  const handleLogoutAndRedirect = () => {
    onLogout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* Top Header */}
      <Header
        user={user}
        backendOnline={backendOnline}
        onLogout={handleLogoutAndRedirect}
        onOpenInfo={() => navigate('/app/specs')}
        onOpenProfile={() => navigate('/app/profile')}
      />

      {/* Main Layout with Sidebar */}
      <div className="flex-1 flex w-full">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          farmCount={farms.length}
          lotCount={cropLots.length}
          urgentRescueCount={1}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Footer / Demo Control Bar */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700 font-bold">Agri2Value (कृषि-मूल्य) — Smart Farm-to-Profit Execution Platform</span>
            <span>•</span>
            <span className="text-slate-500">Indradhanu: PCCOE International Grand Challenge 2026</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onResetDemoData}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition-colors cursor-pointer font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Seed</span>
            </button>
            <span>•</span>
            <span className="font-mono text-[11px] text-slate-400">v1.0.0-competition</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (JSPM Narhe Winners Inspired) */}
      <MobileNav activeTab={activeTab} onSelectTab={handleSelectTab} />

    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   3. INTERNAL APP ROUTING & STATE CONTAINER
   ────────────────────────────────────────────────────────── */
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(DEFAULT_DEMO_USER);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cropLots, setCropLots] = useState<CropLot[]>([]);
  const [selectedLotIdForDecision, setSelectedLotIdForDecision] = useState<string | undefined>(undefined);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Modals
  const [isCreateFarmOpen, setIsCreateFarmOpen] = useState(false);
  const [isCreateLotOpen, setIsCreateLotOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    const health = await api.checkHealth();
    setBackendOnline(health.backendOnline);

    const [fetchedFarms, fetchedLots] = await Promise.all([
      api.getFarms(),
      api.getCropLots(),
    ]);

    setFarms(fetchedFarms);
    setCropLots(fetchedLots);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      const health = await api.checkHealth();
      setBackendOnline(health.backendOnline);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
    showToast('Signed out of session');
    navigate('/', { replace: true });
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    showToast(`Signed in as ${loggedInUser.full_name}`);
    loadData();
    navigate('/app/dashboard');
  };

  const handleCreateFarm = async (farmData: Partial<Farm>) => {
    const newFarm = await api.createFarm(farmData);
    setFarms([newFarm, ...farms]);
    showToast(`Farm '${newFarm.farm_name}' registered successfully`);
  };

  const handleCreateLot = async (farmId: string, lotData: Partial<CropLot>) => {
    const newLot = await api.createCropLot(farmId, lotData);
    setCropLots([newLot, ...cropLots]);
    showToast(`Harvest lot '${newLot.crop_name}' registered (${newLot.quantity_kg_normalized} kg)`);
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset all farms and lots back to canonical Phase 1 demo seed?')) {
      api.resetDemoData();
      loadData();
      showToast('Reset to canonical Phase 1 seed scenario (Ramesh Patil • 4,000 kg Tomato)');
    }
  };

  const handleSelectTab = (tab: TabKey) => {
    const routeMap: Record<TabKey, string> = {
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
      'profile': '/app/profile',
      'specs': '/app/specs',
    };
    if (routeMap[tab]) {
      navigate(routeMap[tab]);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Routes>
        
        {/* ─── Public Website Routes ─── */}
        <Route element={<PublicLayout user={user} onLogout={handleLogout} />}>
          <Route path="/" element={<HomeView />} />
          <Route path="/about" element={<AboutView />} />
          <Route path="/how-it-works" element={<HowItWorksView />} />
          <Route path="/features" element={<FeaturesView />} />
          <Route path="/contact" element={<ContactView />} />
        </Route>

        {/* ─── Dedicated Auth Routes ─── */}
        <Route path="/login" element={<LoginView onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" element={<RegisterView onRegisterSuccess={handleLoginSuccess} />} />

        {/* ─── Authenticated Application Routes ─── */}
        <Route
          path="/app"
          element={
            <AppLayout
              user={user}
              backendOnline={backendOnline}
              farms={farms}
              cropLots={cropLots}
              onLogout={handleLogout}
              onResetDemoData={handleResetDemoData}
            />
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          
          <Route
            path="dashboard"
            element={
              <DashboardView
                user={user}
                farms={farms}
                cropLots={cropLots}
                onSelectTab={handleSelectTab}
                onOpenCreateLot={() => setIsCreateLotOpen(true)}
                onOpenCreateFarm={() => setIsCreateFarmOpen(true)}
              />
            }
          />

          <Route
            path="farms"
            element={
              <FarmsView
                farms={farms}
                onCreateFarm={handleCreateFarm}
                isOpenCreateModal={isCreateFarmOpen}
                onCloseCreateModal={() => setIsCreateFarmOpen(false)}
                onOpenCreateModal={() => setIsCreateFarmOpen(true)}
              />
            }
          />

          <Route
            path="lots"
            element={
              <HarvestLotsView
                cropLots={cropLots}
                farms={farms}
                onCreateLot={handleCreateLot}
                isOpenCreateModal={isCreateLotOpen}
                onCloseCreateModal={() => setIsCreateLotOpen(false)}
                onOpenCreateModal={() => setIsCreateLotOpen(true)}
                onNavigateToDecision={(lotId) => {
                  if (lotId) setSelectedLotIdForDecision(lotId);
                  navigate('/app/decision');
                }}
                onNavigateToRescue={(lotId) => {
                  if (lotId) setSelectedLotIdForDecision(lotId);
                  navigate('/app/rescue');
                }}
              />
            }
          />

          <Route
            path="decision"
            element={
              <DecisionEngineView
                lots={cropLots}
                selectedLotId={selectedLotIdForDecision}
                onLotSelect={setSelectedLotIdForDecision}
                onNavigateToExecution={() => navigate('/app/execution')}
              />
            }
          />

          <Route
            path="market"
            element={<MarketWeatherView />}
          />

          <Route
            path="buyers"
            element={<BuyersView cropLots={cropLots} />}
          />

          <Route
            path="infra"
            element={<InfrastructureView cropLots={cropLots} />}
          />

          <Route
            path="execution"
            element={
              <ExecutionRequestsView
                cropLots={cropLots}
                onNavigateToProtection={() => navigate('/app/protection')}
              />
            }
          />

          <Route
            path="rescue"
            element={
              <CropRescueView
                cropLots={cropLots}
                selectedLotId={selectedLotIdForDecision}
                onLotSelect={setSelectedLotIdForDecision}
              />
            }
          />

          <Route
            path="protection"
            element={
              <ProtectionView
                cropLots={cropLots}
                onNavigateToExecution={() => navigate('/app/execution')}
              />
            }
          />

          <Route
            path="iot"
            element={<IoTMonitoringView farms={farms} />}
          />

          <Route
            path="profile"
            element={
              <ProfileView
                user={user}
                farms={farms}
                onResetDemoData={handleResetDemoData}
                onLogout={handleLogout}
              />
            }
          />

          <Route path="specs" element={<SpecsView />} />
        </Route>

        {/* ─── 404 Catch-All ─── */}
        <Route path="*" element={<NotFoundView />} />

      </Routes>

      {/* Floating AI Farmer Advisor Chatbot (JSPM Narhe Winners Inspired) */}
      <FarmerChatbot />
    </>
  );
};

/* ──────────────────────────────────────────────────────────
   4. ROOT APPLICATION ENTRY POINT
   ────────────────────────────────────────────────────────── */
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};
