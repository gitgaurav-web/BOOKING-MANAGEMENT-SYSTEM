import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Car,
  User,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  Shield,
  Layers,
  Lock,
  Calendar,
  Fuel,
  Compass,
  Home,
  FileText,
  Bus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { apiRequest } from '../services/api';
import { NotificationItem } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Close notifications on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        notificationRef.current &&
        !notificationRef.current.contains(target) &&
        (!mobileNotificationRef.current || !mobileNotificationRef.current.contains(target))
      ) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  // Close menus on route change
  useEffect(() => {
    setNotificationsOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const loadNotifications = async () => {
    try {
      const data = await apiRequest<NotificationItem[]>('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch {
      // Ignored
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignored
    }
  };

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignored
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    markSingleRead(n.id);
    setNotificationsOpen(false);

    const match = n.message.match(/(?:BUS|CAR|VAN|AMB|HB)-[A-Z0-9]+(?:-[A-Z0-9]+)*/i);
    const bookingId = match ? match[0] : '';
    const text = (n.title + ' ' + n.message).toLowerCase();

    if (text.includes('booking') || text.includes('requisition') || text.includes('trip') || bookingId) {
      if (isAdmin) {
        if (
          text.includes('new request') ||
          text.includes('new booking request') ||
          text.includes('awaiting approval') ||
          text.includes('pending')
        ) {
          navigate('/admin/pending');
        } else {
          navigate(bookingId ? `/admin/bookings?search=${encodeURIComponent(bookingId)}` : '/admin/bookings');
        }
      } else {
        navigate('/user/bookings');
      }
      return;
    }

    if (text.includes('maintenance') || text.includes('service')) {
      navigate(isAdmin ? '/admin/maintenance' : '/availability');
      return;
    }

    if (text.includes('holiday') || text.includes('blocked')) {
      navigate(isAdmin ? '/admin/blocked-dates' : '/calendar');
      return;
    }

    if (isAdmin) {
      navigate('/admin/bookings');
    } else {
      navigate('/user/bookings');
    }
  };

  const navLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Bus Routes', path: '/routes', icon: Compass },
    { label: 'Fleet', path: '/vehicles', icon: Bus },
    { label: 'Schedule', path: '/calendar', icon: Calendar },
    { label: 'Guidelines', path: '/how-it-works', icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shadow-xs">
      {/* Top Academic Banner */}
      <div className="border-b border-blue-950/40 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-[10px] font-semibold tracking-wider sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img src="/images/sairam-seal.png" alt="Sairam Seal" className="h-4 w-4 rounded-full bg-white object-contain p-[0.5px] shadow-xs" />
            <span className="uppercase tracking-[.18em] text-amber-300/90 font-medium">
              {settings.institutionName || 'Sri Sairam College of Engineering, Bengaluru'}
            </span>
            {settings.accreditationText && (
              <>
                <span className="hidden md:inline text-slate-400">|</span>
                <span className="hidden md:inline text-slate-300 font-normal">
                  {settings.accreditationText}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="hidden sm:inline">Central Transport Logistics Desk</span>
            <span className="text-amber-400/90 font-bold">
              {settings.academicSession || 'Academic Session 2026-27'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo with Authentic Sairam Branding */}
          <Link to={user ? '/' : '/login'} className="flex items-center gap-2.5 group shrink-0">
            <div className="flex items-center">
              <img
                src="/images/sairam-logo-light.png"
                alt="Sri Sairam College of Engineering"
                className="block dark:hidden h-9 sm:h-10 lg:h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <img
                src="/images/sairam-logo-dark.png"
                alt="Sri Sairam College of Engineering"
                className="hidden dark:block h-9 sm:h-10 lg:h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>
            <div className="hidden 2xl:flex flex-col justify-center border-l border-slate-200/80 dark:border-slate-800 pl-2.5">
              <div className="flex items-center gap-1">
                <span className="font-crest text-xs font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                  Transport Portal
                </span>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                Central Fleet Desk
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Only visible when logged in */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 shrink-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors select-none ${
                      active
                        ? 'bg-blue-900 text-white dark:bg-amber-400 dark:text-slate-950 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-blue-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-400 dark:text-slate-950' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Icons & Auth */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
                    title="Notifications"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </button>

                  {/* Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Notifications ({unreadCount} new)
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                                !n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                                {n.message}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* My Trips */}
                <Link
                  to="/user/bookings"
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition whitespace-nowrap shrink-0"
                >
                  My Trips
                </Link>

                {/* Admin Portal Button */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 transition shadow-2xs whitespace-nowrap shrink-0"
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span>Admin Desk</span>
                  </Link>
                )}

                {/* Book Vehicle CTA */}
                <Link
                  to="/book"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 shadow-sm transition active:scale-95 whitespace-nowrap shrink-0"
                >
                  Book Vehicle
                </Link>

                {/* Profile Pill & Logout */}
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium whitespace-nowrap shrink-0">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="max-w-[75px] truncate font-semibold">{user.name.split(' ')[0]}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase shrink-0">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition shrink-0"
                    title="Sign out"
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 shadow-sm transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Portal Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user && (
              <button
                ref={mobileNotificationRef}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-500 dark:text-slate-400 relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          {user ? (
            <>
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {user.role}
                </span>
              </div>

              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-blue-900 text-white dark:bg-amber-400 dark:text-slate-950 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-300 dark:text-slate-950' : 'text-slate-400'}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                <Link
                  to="/user/bookings"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <Car className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>My Vehicle Requisitions</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 rounded-lg text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40"
                  >
                    Transport Administration
                  </Link>
                )}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/book"
                  className="w-full text-center py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 dark:bg-amber-500 dark:text-slate-950 shadow-sm"
                >
                  Book Vehicle
                </Link>
                <button
                  onClick={logout}
                  className="w-full py-2 text-center text-xs font-semibold text-rose-600 dark:text-rose-400"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                className="w-full block text-center py-3 rounded-xl text-xs font-bold text-white bg-blue-900 dark:bg-amber-500 dark:text-slate-950"
              >
                Portal Login
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
