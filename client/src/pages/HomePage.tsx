import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  MapPin,
  Volume2,
  Wifi,
  ChevronRight,
  Sliders,
  Filter,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Hall, Booking } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const HomePage: React.FC = () => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [hallsData, bookingsData] = await Promise.all([
        apiRequest<Hall[]>('/halls'),
        apiRequest<Booking[]>('/bookings?dateRange=UPCOMING'),
      ]);
      setHalls(hallsData);
      setUpcomingBookings(bookingsData.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const seminarHall = halls.find((h) => h.name.toLowerCase().includes('seminar')) || halls[0];
  const avHall = halls.find((h) => h.name.toLowerCase().includes('av')) || halls[1];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-blue-50/50 via-white to-transparent dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Facility Availability System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Seminar Hall & AV Hall <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Booking Management System
              </span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Check hall availability, view upcoming bookings, and manage facility reservations with ease. Built specifically for institutional whole-hall date scheduling.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/availability"
                className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Check Hall Availability</span>
              </Link>
              <Link
                to="/calendar"
                className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-semibold text-sm border border-slate-200 dark:border-slate-700 shadow-xs transition"
              >
                <span>View Monthly Calendar</span>
              </Link>
              <Link
                to="/book"
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <span>Request Booking</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Informational Zero Seat Callout */}
            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Date-Wise Full Hall Reservation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>No Seat Reservation Complexity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Instant Conflict Detection</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Hall Status Live Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Status Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})</span>
              </div>
              <h2 className="text-2xl font-bold mt-1">Today's Hall Availability</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                Quick real-time snapshot of facility occupancy for today.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
              {/* Seminar Hall Today Box */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-100">Seminar Hall</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {seminarHall?.location || 'Academic Block'}
                  </p>
                </div>
                <StatusBadge status={seminarHall?.todayStatus || 'AVAILABLE'} size="md" />
              </div>

              {/* AV Hall Today Box */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-100">AV Hall</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {avHall?.location || 'Tech Block'}
                  </p>
                </div>
                <StatusBadge status={avHall?.todayStatus || 'AVAILABLE'} size="md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Large Hall Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Our Primary College Facilities
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            Both halls are equipped for academic gatherings, symposiums, and cultural interactions. Capacity is informational only.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Seminar Hall */}
          {seminarHall && (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={seminarHall.image || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80'}
                    alt="Seminar Hall"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <StatusBadge status={seminarHall.todayStatus || 'AVAILABLE'} size="md" />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl font-medium">
                    {seminarHall.code}
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {seminarHall.name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span>{seminarHall.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Capacity: ~{seminarHall.capacity} Attendees (Informational)</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {seminarHall.description}
                  </p>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Equipped Facilities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {seminarHall.facilities.map((fac, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                        >
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 pt-0 flex flex-wrap items-center gap-3">
                <Link
                  to={`/availability?hall=${seminarHall.id}`}
                  className="flex-1 text-center py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs transition"
                >
                  Check Availability
                </Link>
                <Link
                  to={`/book?hall=${encodeURIComponent(seminarHall.name)}`}
                  className="flex-1 text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition"
                >
                  Request Booking
                </Link>
              </div>
            </div>
          )}

          {/* Card 2: AV Hall */}
          {avHall && (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={avHall.image || 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80'}
                    alt="AV Hall"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <StatusBadge status={avHall.todayStatus || 'AVAILABLE'} size="md" />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl font-medium">
                    {avHall.code}
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {avHall.name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span>{avHall.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Capacity: ~{avHall.capacity} Attendees (Informational)</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {avHall.description}
                  </p>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Equipped Facilities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {avHall.facilities.map((fac, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                        >
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 pt-0 flex flex-wrap items-center gap-3">
                <Link
                  to={`/availability?hall=${avHall.id}`}
                  className="flex-1 text-center py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs transition"
                >
                  Check Availability
                </Link>
                <Link
                  to={`/book?hall=${encodeURIComponent(avHall.name)}`}
                  className="flex-1 text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition"
                >
                  Request Booking
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Bookings Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Upcoming Bookings
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Confirmed reservations taking place across Seminar Hall and AV Hall.
            </p>
          </div>
          <Link
            to="/calendar"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Full Calendar</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="p-10 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500">
            No upcoming bookings scheduled at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {b.bookingId}
                  </span>
                  <StatusBadge status={b.status} size="sm" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                    {b.eventName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {b.hall?.name} • {b.department?.name || 'Academic Dept'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>{b.bookingDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.startTime} - {b.endTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
