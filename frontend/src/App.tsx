// frontend/src/App.tsx
import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Navigation, type TabKey } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { FarmsView } from './components/FarmsView';
import { HarvestLotsView } from './components/HarvestLotsView';
import { DecisionEngineView } from './components/DecisionEngineView';
import { MarketWeatherView } from './components/MarketWeatherView';
import { BuyersView } from './components/BuyersView';
import { InfrastructureView } from './components/InfrastructureView';
import { ExecutionRequestsView } from './components/ExecutionRequestsView';
import { CropRescueView } from './components/CropRescueView';
import { SpecsView } from './components/SpecsView';
import { AuthModal } from './components/AuthModal';
import { api, DEFAULT_DEMO_USER } from './api';
import type { CropLot, Farm, User } from './types';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(DEFAULT_DEMO_USER);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cropLots, setCropLots] = useState<CropLot[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedLotIdForDecision, setSelectedLotIdForDecision] = useState<string | undefined>(undefined);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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
    // Re-check health every 15s
    const interval = setInterval(async () => {
      const health = await api.checkHealth();
      setBackendOnline(health.backendOnline);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthModalOpen(false);
    showToast(`Signed in as ${loggedInUser.full_name}`);
    loadData();
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs sm:text-sm shadow-2xl shadow-emerald-950/80 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        user={user}
        backendOnline={backendOnline}
        onLogout={handleLogout}
        onOpenInfo={() => setActiveTab('specs')}
      />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        farmCount={farms.length}
        lotCount={cropLots.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            user={user}
            farms={farms}
            cropLots={cropLots}
            onSelectTab={setActiveTab}
            onOpenCreateLot={() => setIsCreateLotOpen(true)}
            onOpenCreateFarm={() => setIsCreateFarmOpen(true)}
          />
        )}

        {activeTab === 'farms' && (
          <FarmsView
            farms={farms}
            onCreateFarm={handleCreateFarm}
            isOpenCreateModal={isCreateFarmOpen}
            onCloseCreateModal={() => setIsCreateFarmOpen(false)}
            onOpenCreateModal={() => setIsCreateFarmOpen(true)}
          />
        )}

        {activeTab === 'lots' && (
          <HarvestLotsView
            cropLots={cropLots}
            farms={farms}
            onCreateLot={handleCreateLot}
            isOpenCreateModal={isCreateLotOpen}
            onCloseCreateModal={() => setIsCreateLotOpen(false)}
            onOpenCreateModal={() => setIsCreateLotOpen(true)}
            onNavigateToDecision={(lotId) => {
              if (lotId) setSelectedLotIdForDecision(lotId);
              setActiveTab('decision-preview');
            }}
            onNavigateToRescue={(lotId) => {
              if (lotId) setSelectedLotIdForDecision(lotId);
              setActiveTab('rescue');
            }}
          />
        )}

        {activeTab === 'decision-preview' && (
          <DecisionEngineView
            lots={cropLots}
            selectedLotId={selectedLotIdForDecision}
            onLotSelect={setSelectedLotIdForDecision}
            onNavigateToExecution={() => setActiveTab('execution')}
          />
        )}

        {activeTab === 'rescue' && (
          <CropRescueView
            cropLots={cropLots}
            selectedLotId={selectedLotIdForDecision}
            onLotSelect={setSelectedLotIdForDecision}
            onNavigateToExecution={() => setActiveTab('execution')}
          />
        )}

        {activeTab === 'buyers' && (
          <BuyersView
            cropLots={cropLots}
            onNavigateToExecution={() => setActiveTab('execution')}
          />
        )}

        {activeTab === 'infrastructure' && (
          <InfrastructureView
            cropLots={cropLots}
            onNavigateToExecution={() => setActiveTab('execution')}
          />
        )}

        {activeTab === 'execution' && (
          <ExecutionRequestsView
            cropLots={cropLots}
            onNavigateToBuyers={() => setActiveTab('buyers')}
            onNavigateToInfra={() => setActiveTab('infrastructure')}
          />
        )}

        {activeTab === 'market-weather' && (
          <MarketWeatherView
            onNavigateToDecision={() => setActiveTab('decision-preview')}
          />
        )}

        {activeTab === 'specs' && <SpecsView />}
      </main>

      {/* Footer / Demo Control Bar */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400 font-medium">Agri2Value — Smart Execution Network & Rescue (Phase 3)</span>
            <span>•</span>
            <span>Indradhanu: PCCOE International Grand Challenge 2026</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetDemoData}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Seed</span>
            </button>
            <span>•</span>
            <span className="font-mono text-[11px] text-slate-600">v0.1.0-alpha</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen || !user}
        onSuccess={handleLoginSuccess}
      />

    </div>
  );
};
