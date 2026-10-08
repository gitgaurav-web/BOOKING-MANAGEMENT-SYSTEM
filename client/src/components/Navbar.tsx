import React, { useState, useEffect } from 'react';
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
import { apiRequest } from '../services/api';
import { NotificationItem } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await apiRequest<NotificationItem[]>('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
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
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="uppercase tracking-[.18em] text-amber-300/90 font-medium">Apex Institute of Technology & Sciences</span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300 font-normal">Autonomous Institution · NAAC A++ Accredited</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="hidden sm:inline">Central Facility Portal</span>
            <span className="text-amber-400/90 font-bold">2026-27 Academic Calendar</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.75rem]">
          {/* Logo with Collegiate Crest */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 text-amber-400 shadow-md border border-amber-500/30 transition-transform group-hover:scale-105">
              <Landmark className="h-6 w-6 stroke-[1.8]" />
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-slate-950">
                ★
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="block font-crest text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  CAMPUS FACILITIES
                </span>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/50">
                  PORTAL
                </span>
              </div>
              <span className="block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">
                Auditoriums &amp; Seminar Halls Reservation
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
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                        Notifications ({unreadCount})
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-[#315b48] dark:text-emerald-300 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl text-xs transition-colors ${
                              n.isRead
                                ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                                : 'bg-blue-50/70 dark:bg-blue-950/40 text-slate-800 dark:text-slate-200 font-medium'
                            }`}
                          >
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
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

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
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
