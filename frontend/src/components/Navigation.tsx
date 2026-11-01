// frontend/src/components/Navigation.tsx
import React from 'react';
import { LayoutDashboard, Home, Wheat, Cpu, FileCode2 } from 'lucide-react';

export type TabKey = 'dashboard' | 'farms' | 'lots' | 'decision-preview' | 'specs';

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  farmCount: number;
  lotCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  farmCount,
  lotCount,
}) => {
  const tabs = [
    {
      key: 'dashboard' as TabKey,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      key: 'farms' as TabKey,
      label: 'Farms & Land',
      icon: Home,
      badge: farmCount > 0 ? farmCount : null,
    },
    {
      key: 'lots' as TabKey,
      label: 'Harvest Lots',
      icon: Wheat,
      badge: lotCount > 0 ? lotCount : null,
    },
    {
      key: 'decision-preview' as TabKey,
      label: 'Profit Decision Engine',
      icon: Cpu,
      badge: 'Active',
    },
    {
      key: 'specs' as TabKey,
      label: 'Architecture & Blueprint',
      icon: FileCode2,
      badge: null,
    },
  ];

  return (
    <nav className="w-full border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-emerald-500/30 text-emerald-200'
                        : typeof tab.badge === 'string'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
