import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Car,
  Bus,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  ShieldCheck,
  Users,
  Fuel,
  Compass,
  Navigation,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Vehicle, Booking, CampusRoute } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CampusTransitExplorer } from '../components/CampusTransitExplorer';

export const HomePage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<CampusRoute[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Booking[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-101');
  const [selectedStopName, setSelectedStopName] = useState<string>('');

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [vehiclesData, routesData, tripsData] = await Promise.all([
          apiRequest<Vehicle[]>('/vehicles').catch(() => []),
          apiRequest<CampusRoute[]>('/routes').catch(() => []),
          apiRequest<Booking[]>('/bookings/upcoming').catch(() => []),
        ]);
        setVehicles(vehiclesData);
        setRoutes(routesData);
        setUpcomingTrips(tripsData.slice(0, 5));
        if (routesData.length > 0) {
          setSelectedRouteId(routesData[0].id);
        }
      } catch (error) {
        console.error('Home data load error:', error);
      }
    };
    loadHomeData();
  }, []);

  const handleSelectRouteForMap = (routeId: string, stopName?: string) => {
    setSelectedRouteId(routeId);
    if (stopName) setSelectedStopName(stopName);
  };

  return (
    <main className="pb-24">
      {/* Grand Collegiate Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white">
        {/* Academic Grid Pattern */}
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(255,255,255,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.15)_1px,transparent_1px)] [background-size:48px_48px]" />

        {/* Ambient Light Glows */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8 space-y-10">
          {/* Top Headline Strip */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              {/* College Accreditation Badge */}
              <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-amber-300 backdrop-blur-sm">
                <img
                  src="/images/sairam-seal.png"
                  alt="Sairam Seal"
                  className="h-4 w-4 rounded-full bg-white object-contain p-[0.5px] shadow-xs"
                />
                <span>Sri Sairam College of Engineering · Bengaluru</span>
              </div>

              <h1 className="font-serif-college text-4xl leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Central Transport &amp; <br />
                <span className="italic text-amber-400">Campus Route Network.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-slate-300">
                Integrated institutional mobility hub: Search daily college bus routes &amp; stoppage schedules with Google Maps, or reserve official staff cars, buses, and vans for department industrial visits.
              </p>
            </div>

            {/* Quick Link Buttons */}
            <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
              <Link
                to="/routes"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
              >
                <Compass className="h-4 w-4" />
                <span>All Bus Routes</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to="/calendar"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-700 bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-sm transition"
              >
                <CalendarDays className="h-4 w-4" />
                <span>Schedule &amp; Availability</span>
              </Link>
            </div>
          </div>

          {/* Google Maps Split-Screen Transit Explorer: Left Search & Right Map */}
          <div className="relative z-10">
            <CampusTransitExplorer
              routes={routes}
              vehicles={vehicles}
              initialRouteId={selectedRouteId}
              initialStopName={selectedStopName}
            />
          </div>

          {/* Key Security Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/15 pt-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Real-Time Seat Availability</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span>QR Code Gate 1 Pass</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Google Maps Turn-by-Turn</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Direct Driver Verification</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vehicles Grid (Charter & Official Booking) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-amber-400">
              Institutional Fleet
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              Campus Vehicles for Reservation
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select an official vehicle to review seating capacity, driver credentials, and schedule availability.
            </p>
          </div>
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-amber-400 hover:underline self-start sm:self-auto"
          >
            <span>View All Fleet Categories</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.slice(0, 3).map((v) => (
            <div
              key={v.id}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={v.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
                    alt={v.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={v.todayStatus || 'AVAILABLE'} size="sm" />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    {v.registrationNo}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {v.vehicleType}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      {v.name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>{v.capacity} Seats</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-amber-500" />
                      <span>{v.fuelType}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {v.features?.slice(0, 3).map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={`/book?vehicle=${v.id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <span>Book This Vehicle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Institutional Protocol Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900 p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Campus Security Protocol
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Verified Digital Gate Pass &amp; Driver Trip Sheet
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every confirmed vehicle booking generates a tamper-evident Transport Security Gate Pass with scannable QR verification. Gate Security at College Main Gate 1 scans this voucher before vehicle clearance.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/how-it-works"
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                View Transport Guidelines
              </Link>
              <Link
                to="/user/bookings"
                className="px-5 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-sm transition"
              >
                My Trip Passes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
