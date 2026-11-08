// frontend/src/components/Sidebar.tsx
import React, { useState, useEffect } from 'react';
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
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
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
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

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
          badge: null,
        },
        {
          key: 'market-weather',
          label: 'Market & Weather',
          icon: CloudSun,
          badge: null,
        },
      ],
    },
    {
      sectionTitle: 'Marketplace & Execution',
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
      sectionTitle: 'Protection',
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
          badge: null,
        },
      ],
    },
    {
      sectionTitle: 'Smart Farming',
      items: [
        {
          key: 'iot-monitoring',
          label: 'IoT Monitoring',
          icon: Activity,
          badge: null,
        },
      ],
    },
    {
      sectionTitle: 'Technical',
      items: [
        {
          key: 'specs',
          label: 'Engine Specs',
          icon: FileCode2,
          badge: null,
        },
      ],
    },
  ];

  const handleSelect = (key: TabKey) => {
    onSelectTab(key);
    if (onCloseMobile) {
      onCloseMobile();
    }
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
      {/* ─── MOBILE DRAWER & BACKDROP ─── */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`md:hidden fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col p-4 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              A2V
            </div>
            <span className="font-extrabold text-slate-900 font-display text-sm">All Platform Modules</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            aria-label="Close Navigation"
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getBadgeClass(item.badgeColor, isActive)}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Mobile Drawer Bottom Info */}
        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="font-medium text-slate-600">Agri2Value Platform</span>
          <span className="font-medium text-[10px] text-slate-400">Enterprise</span>
        </div>
      </aside>

      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out shrink-0 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Collapse Toggle Header */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-slate-100">
          {!isCollapsed && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Navigation
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors mx-auto cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Item Groups */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.sectionTitle}
                </div>
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
                        ? 'bg-emerald-600 text-white shadow-sm font-bold'
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

        {/* Bottom Farmer Support Banner */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/70">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1 font-display">
                  🌾 Field Sync Active
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
                  NASHIK
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-tight">
                APMC Pimpalgaon & Open-Meteo feeds synchronized.
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-200/60">
                <button
                  onClick={() => handleSelect('specs')}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                >
                  Engine Specs <ArrowUpRight className="w-3 h-3" />
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
    </>
  );
};
