// frontend/src/components/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  LogOut,
  Bell,
  HelpCircle,
  Globe,
  Menu,
  X,
  CheckCheck,
  AlertTriangle,
  Truck,
  Wheat,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';
import { api } from '../api';
import type { User, NotificationItem } from '../types';

interface HeaderProps {
  user: User | null;
  backendOnline: boolean;
  onLogout: () => void;
  onOpenInfo: () => void;
  onOpenProfile?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  backendOnline,
  onLogout,
  onOpenInfo,
  onOpenProfile,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Notification Center State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications when user is present
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      const res = await api.getNotifications(15);
      setNotifications(res.items || []);
      setUnreadCount(res.unread_count || 0);
    } catch {
      // Graceful fallback
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 60 seconds if active
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotifOpen]);

  // Mark single notification as read and route
  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    }
    if (notif.action_route) {
      setIsNotifOpen(false);
      navigate(notif.action_route);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  // Format relative timestamp
  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date().getTime();
      const past = new Date(dateStr).getTime();
      const diffSecs = Math.floor((now - past) / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  // Category Icon & Styling Helper
  const getCategoryDetails = (cat: string, sev: string) => {
    switch (cat) {
      case 'RISK_ALERT':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
          bg: 'bg-rose-50 border-rose-200',
        };
      case 'EXECUTION':
        return {
          icon: <Truck className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-200',
        };
      case 'HARVEST':
        return {
          icon: <Wheat className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-200',
        };
      case 'IOT':
        return {
          icon: <Activity className="w-4 h-4 text-indigo-600" />,
          bg: 'bg-indigo-50 border-indigo-200',
        };
      default:
        return {
          icon: sev === 'WARNING' || sev === 'CRITICAL' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ),
          bg: 'bg-slate-50 border-slate-200',
        };
    }
  };

  return (
    <header className="shrink-0 sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left Side: Brand & Mobile Menu Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Hamburger (Opens App Drawer) */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open all modules menu"}
              title="All Modules Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-emerald-600" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Brand & Tagline - Clickable redirect to Dashboard / Home */}
          <Link
            to={user ? "/app/dashboard" : "/"}
            className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer"
            title="Agri2Value Dashboard"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white transition-transform group-hover:scale-105 shrink-0">
              <Sprout className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 font-display">
                  Agri<span className="text-emerald-600">2Value</span>
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                {t('common.appTagline')}
              </p>
            </div>
          </Link>
        </div>

        {/* Center Indicator (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
            backendOnline 
              ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800' 
              : 'bg-amber-50/80 border-amber-200/80 text-amber-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{backendOnline ? t('common.networkLive') : t('common.offlineMode')}</span>
          </div>
        </div>

        {/* User Profile & Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Language Selector Pill */}
          <LanguageSelector variant="dark" />

          {/* Public Website Link */}
          <Link
            to="/"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Return to Public Website"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('common.publicSite')}</span>
          </Link>

          {/* Architecture / Specs Button */}
          <button
            onClick={onOpenInfo}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all cursor-pointer"
            title="System Specifications & Architecture"
          >
            <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            <span className="hidden lg:inline">{t('common.architecture')}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5 sm:pl-2 sm:border-l sm:border-slate-200">
              {/* Notification Center Popover */}
              <div className="relative" ref={notifDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  className={`relative p-2 rounded-xl transition-all cursor-pointer ${
                    isNotifOpen
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                  aria-label="Toggle notifications menu"
                  aria-expanded={isNotifOpen}
                  title={t('common.notifications')}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-xs ring-2 ring-white animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {isNotifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 tracking-tight font-display">
                          {t('common.notifications')}
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                      {loadingNotifs && notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          Loading alerts...
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notif) => {
                          const { icon, bg } = getCategoryDetails(
                            notif.category,
                            notif.severity
                          );
                          return (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                                !notif.is_read
                                  ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${bg}`}
                              >
                                {icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <h4
                                    className={`text-xs font-bold truncate ${
                                      !notif.is_read
                                        ? 'text-slate-900 font-extrabold'
                                        : 'text-slate-700'
                                    }`}
                                  >
                                    {notif.title}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap flex items-center gap-1 shrink-0">
                                    <Clock className="w-2.5 h-2.5" />
                                    {formatTimeAgo(notif.created_at)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>
                                {notif.action_label && (
                                  <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800">
                                    <span>{notif.action_label}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-2" />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                          <div className="text-xs font-bold text-slate-800">
                            No New Notifications
                          </div>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                            All your farm management, mandi prices, and execution updates are current.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 bg-slate-50/90 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate('/app/protection');
                        }}
                        className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 transition-colors"
                      >
                        Open Farmer Protection & Trust Ledger →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Farmer Profile Chip */}
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs cursor-pointer text-left"
                title="View Farmer Profile & Settings"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  👨‍🌾
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.full_name || 'Ramesh Patil'}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold leading-tight truncate max-w-[120px]">
                    {user.role} • Patil Krishi Farm
                  </div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title={t('common.signOut')}
                className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                aria-label={t('common.signOut')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-primary text-xs py-1.5 px-3 sm:py-2 sm:px-4 shadow-sm"
            >
              {t('common.signIn')}
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};
