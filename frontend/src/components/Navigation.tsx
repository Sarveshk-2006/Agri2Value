// frontend/src/components/Navigation.tsx
import React from 'react';
import {
  LayoutDashboard,
  Home,
  Wheat,
  Sparkles,
  FileCode2,
  CloudSun,
  Users,
  Truck,
  FileText,
  Flame,
  Activity
} from 'lucide-react';
import type { TabKey } from '../types';

export type { TabKey };

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
      label: 'Farms',
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
      label: 'Profit Engine',
      icon: Sparkles,
      badge: 'Active',
    },
    {
      key: 'rescue' as TabKey,
      label: 'Crop Rescue',
      icon: Flame,
      badge: 'URGENT',
    },
    {
      key: 'market-weather' as TabKey,
      label: 'Market & Weather',
      icon: CloudSun,
      badge: 'Live',
    },
    {
      key: 'buyers' as TabKey,
      label: 'Buyer Network',
      icon: Users,
      badge: null,
    },
    {
      key: 'infrastructure' as TabKey,
      label: 'Logistics & Storage',
      icon: Truck,
      badge: null,
    },
    {
      key: 'execution' as TabKey,
      label: 'Execution Tracker',
      icon: FileText,
      badge: null,
    },
    {
      key: 'iot-monitoring' as TabKey,
      label: 'IoT Monitoring',
      icon: Activity,
      badge: 'Simulated',
    },
    {
      key: 'specs' as TabKey,
      label: 'Architecture',
      icon: FileCode2,
      badge: null,
    },
  ];

  return (
    <nav className="w-full border-b border-slate-200 bg-white shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : typeof tab.badge === 'string'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
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
