// frontend/src/components/MobileNav.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  ShieldCheck,
  Radio,
  User,
  Truck
} from 'lucide-react';

import type { TabKey } from '../types';

interface MobileNavProps {
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
  urgentRescueCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  urgentRescueCount = 0
}) => {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    {
      to: '/app/dashboard',
      key: 'dashboard' as TabKey,
      label: 'Home',
      icon: LayoutDashboard,
      isActive: activeTab === 'dashboard' || path === '/app/dashboard' || path === '/app'
    },
    {
      to: '/app/decision',
      key: 'decision-preview' as TabKey,
      label: 'Profit',
      icon: Sparkles,
      isActive: activeTab === 'decision-preview' || path.includes('/app/decision'),
    },
    {
      to: '/app/protection',
      key: 'protection' as TabKey,
      label: 'Protection',
      icon: ShieldCheck,
      isActive: activeTab === 'protection' || path.includes('/app/protection')
    },
    {
      to: '/app/execution',
      key: 'execution' as TabKey,
      label: 'Tracker',
      icon: Truck,
      isActive: activeTab === 'execution' || path.includes('/app/execution')
    },
    {
      to: '/app/iot',
      key: 'iot-monitoring' as TabKey,
      label: 'Sensors',
      icon: Radio,
      isActive: activeTab === 'iot-monitoring' || path.includes('/app/iot'),
      badge: urgentRescueCount > 0 ? 'ALERT' : undefined
    },
    {
      to: '/app/profile',
      key: 'profile' as TabKey,
      label: 'Profile',
      icon: User,
      isActive: activeTab === 'profile' || path.includes('/app/profile')
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="flex items-center justify-around">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={idx}
              to={item.to}
              onClick={() => onSelectTab && onSelectTab(item.key)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all relative ${
                active
                  ? 'text-green-700 font-extrabold'
                  : 'text-slate-500 hover:text-green-600 font-medium'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all ${
                  active ? 'bg-green-100 text-green-700 scale-110 shadow-sm' : ''
                }`}
              >
                <Icon className="w-5 h-5" />

                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[8px] font-black px-1 py-0.2 rounded-full shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] mt-0.5 tracking-tight font-display whitespace-nowrap">
                {item.label}
              </span>

              {active && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-green-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
