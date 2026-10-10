import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Landmark,
  User,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  Shield,
  Layers,
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

  // Close notifications when clicking outside or pressing Escape
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

  // Close notifications and mobile menu on route change
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

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Halls', path: '/halls' },
    { label: 'Availability', path: '/availability' },
    { label: 'Calendar', path: '/calendar' },
    { label: 'How It Works', path: '/how-it-works' },
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
            <span className="hidden sm:inline">Central Campus Facility Portal</span>
            <span className="text-amber-400/90 font-bold">
              {settings.academicSession || 'Academic Session 2026-27'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.75rem]">
          {/* Logo with Authentic Sairam Branding */}
          <Link to="/" className="flex items-center gap-3.5 group shrink-0">
            <div className="flex items-center">
              <img
                src="/images/sairam-logo-light.png"
                alt="Sri Sairam College of Engineering"
                className="block dark:hidden h-11 sm:h-12 lg:h-13 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <img
                src="/images/sairam-logo-dark.png"
                alt="Sri Sairam College of Engineering"
                className="hidden dark:block h-11 sm:h-12 lg:h-13 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>
            <div className="hidden xl:flex flex-col justify-center border-l border-slate-200/80 dark:border-slate-800 pl-3.5">
              <div className="flex items-center gap-1.5">
                <span className="font-crest text-xs font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                  Facility Portal
                </span>
                </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                Auditoriums &amp; Seminar Halls
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive(link.path)
                    ? 'text-blue-900 dark:text-amber-300 bg-blue-50/80 dark:bg-blue-950/50 shadow-xs border border-blue-200/50 dark:border-blue-800/50'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="hidden md:flex items-center gap-2">
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Dropdown (If Logged In) */}
            {user && (
              <div ref={notificationRef} className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                      </span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Close notifications"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markSingleRead(n.id)}
                            className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                              n.isRead
                                ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                                : 'bg-blue-50/70 dark:bg-blue-950/40 text-slate-800 dark:text-slate-200 font-medium hover:bg-blue-100/70 dark:hover:bg-blue-900/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                              {!n.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                              )}
                            </div>
                            <p className="mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                  </Link>
                ) : (
                  <Link
                    to="/user/bookings"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>My Bookings</span>
                  </Link>
                )}

                <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-900 dark:hover:text-white"
                >
                  Faculty Login
                </Link>
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-950 hover:to-blue-900 text-amber-300 font-semibold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95 border border-amber-400/30"
                >
                  <span>Book Hall</span>
                  <span className="text-amber-400 font-black">→</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex items-center gap-1.5 md:hidden">
            {user && (
              <button
                ref={mobileNotificationRef}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                )}
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 rounded-lg"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(link.path)
                  ? 'bg-[#edf2eb] dark:bg-emerald-950/50 text-[#1c493e] dark:text-emerald-300'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {user ? (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-slate-500">
                  Signed in as <span className="text-slate-900 dark:text-white">{user.name}</span> ({user.role})
                </div>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
                  >
                    Go to Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/user/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2.5 rounded-xl bg-[#edf2eb] dark:bg-emerald-950/50 text-[#315b48] dark:text-emerald-300 font-semibold text-sm"
                  >
                    My Bookings
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="block w-full text-center px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 font-semibold text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/book"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 text-amber-300 font-bold text-sm shadow-md border border-amber-400/30"
                >
                  Request Hall Booking
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
