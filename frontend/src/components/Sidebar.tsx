// frontend/src/components/Sidebar.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  Wheat,
  Sparkles,
  CloudSun,
  Users,
  Truck,
  FileText,
  Flame,
  Activity,
  FileCode2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowUpRight,
  UserCheck,
  Globe,
  ShieldCheck
} from 'lucide-react';
import type { TabKey } from '../types';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  farmCount: number;
  lotCount: number;
  urgentRescueCount?: number;
}

interface NavGroup {
  sectionTitle: string;
  items: {
    key: TabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number | null;
    badgeColor?: 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  farmCount,
  lotCount,
  urgentRescueCount = 1,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navGroups: NavGroup[] = [
    {
      sectionTitle: 'Overview',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          key: 'profile',
          label: 'Farmer Profile',
          icon: UserCheck,
          badge: null,
        },
      ],
    },
    {
      sectionTitle: 'Farm Management',
      items: [
        {
          key: 'farms',
          label: 'Farms & Land',
          icon: Home,
          badge: farmCount > 0 ? farmCount : null,
          badgeColor: 'slate',
        },
        {
          key: 'lots',
          label: 'Harvest Lots',
          icon: Wheat,
          badge: lotCount > 0 ? lotCount : null,
          badgeColor: 'emerald',
        },
      ],
    },
    {
      sectionTitle: 'Intelligence',
      items: [
        {
          key: 'decision-preview',
          label: 'Profit Engine',
          icon: Sparkles,
          badge: 'DECIDE',
          badgeColor: 'emerald',
        },
        {
          key: 'market-weather',
          label: 'Market & Weather',
          icon: CloudSun,
          badge: 'LIVE',
          badgeColor: 'blue',
        },
      ],
    },
    {
      sectionTitle: 'Execution Network',
      items: [
        {
          key: 'buyers',
          label: 'Buyer Network',
          icon: Users,
          badge: null,
        },
        {
          key: 'infrastructure',
          label: 'Logistics & Storage',
          icon: Truck,
          badge: null,
        },
        {
          key: 'execution',
          label: 'Execution Tracker',
          icon: FileText,
          badge: null,
        },
      ],
    },
    {
      sectionTitle: 'Protection & Safety',
      items: [
        {
          key: 'rescue',
          label: 'Crop Rescue Mode',
          icon: Flame,
          badge: urgentRescueCount > 0 ? 'ALERT' : null,
          badgeColor: 'rose',
        },
        {
          key: 'protection',
          label: 'Farmer Protection',
          icon: ShieldCheck,
          badge: 'TRUST',
          badgeColor: 'emerald',
        },
        {
          key: 'specs',
          label: 'Engine Specs',
          icon: FileCode2,
          badge: null,
        },
      ],
    },
    {
      sectionTitle: 'Telematics',
      items: [
        {
          key: 'iot-monitoring',
          label: 'IoT Monitoring',
          icon: Activity,
          badge: 'PREVIEW',
          badgeColor: 'amber',
        },
      ],
    },
  ];

  const handleSelect = (key: TabKey) => {
    onSelectTab(key);
    setIsMobileOpen(false);
  };

  const getBadgeClass = (color?: 'emerald' | 'amber' | 'rose' | 'blue' | 'slate', isActive?: boolean) => {
    if (isActive) {
      return 'bg-white/20 text-white border-white/30';
    }
    switch (color) {
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      {/* Mobile Top Toggle Button */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-13 h-13 rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          aria-label="Toggle Navigation"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed top-0 bottom-0 left-0 w-72 bg-white z-50 shadow-2xl flex flex-col p-4 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              A2V
            </div>
            <span className="font-extrabold text-slate-900">Agri2Value Menu</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                {group.sectionTitle}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelect(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeClass(item.badgeColor, isActive)}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Desktop Sidebar (JSPM Winners Inspired) */}
      <aside
        className={`hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200/80 transition-all duration-300 z-30 shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-5 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:scale-105 transition-all z-40 cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Navigation Groups Container */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed ? (
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
                  {group.sectionTitle}
                </p>
              ) : (
                <div className="w-full text-center my-2 text-slate-300 font-bold text-xs">•</div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelect(item.key)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2'
                    } rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group relative ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-bold'
                        : 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : item.key === 'rescue' ? 'text-rose-500' : 'text-slate-400 group-hover:text-emerald-600'
                        }`}
                      />
                      {!isCollapsed && <span className="tracking-tight">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${getBadgeClass(
                          item.badgeColor,
                          isActive
                        )}`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Farmer Support Banner (Inspired by JSPM PMFBY card) */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/70">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1">
                  🌾 Farmer Advisory
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
                  MAHA-AGRI
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-tight">
                APMC Pimpalgaon & Open-Meteo live sync active.
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-200/60">
                <button
                  onClick={() => handleSelect('specs')}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                >
                  Engine Rules <ArrowUpRight className="w-3 h-3" />
                </button>
                <Link
                  to="/"
                  className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                >
                  <Globe className="w-3 h-3" />
                  <span>Public Site</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar (JSPM Native App Feel) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-30 flex justify-around items-center px-1 py-1.5 shadow-lg pb-safe">
        {[
          { key: 'dashboard' as TabKey, label: 'Home', icon: LayoutDashboard },
          { key: 'lots' as TabKey, label: 'Lots', icon: Wheat },
          { key: 'decision-preview' as TabKey, label: 'Decision', icon: Sparkles },
          { key: 'execution' as TabKey, label: 'Execution', icon: FileText },
          { key: 'rescue' as TabKey, label: 'Rescue', icon: Flame },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleSelect(item.key)}
              className={`flex flex-col items-center justify-center p-1.5 w-full min-h-[44px] transition-colors ${
                isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-emerald-600' : ''}`} />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
