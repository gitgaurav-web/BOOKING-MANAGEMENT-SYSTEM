import React, { useEffect, useState } from 'react';
import {
  Bus,
  Compass,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { CampusRoute, Vehicle, RouteStop } from '../types';
import { CampusTransitExplorer } from '../components/CampusTransitExplorer';

export const CampusRoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<CampusRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-101');
  const [selectedStopName, setSelectedStopName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        setLoading(true);
        const [routesData, vehiclesData] = await Promise.all([
          apiRequest<CampusRoute[]>('/routes').catch(() => []),
          apiRequest<Vehicle[]>('/vehicles').catch(() => []),
        ]);
        setRoutes(routesData);
        setVehicles(vehiclesData);
        if (routesData.length > 0) {
          setSelectedRouteId(routesData[0].id);
        }
      } catch (err) {
        console.error('Error fetching campus routes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRouteData();
  }, []);

  const handleSelectRouteFromSearch = (routeId: string, stopName?: string) => {
    setSelectedRouteId(routeId);
    if (stopName) setSelectedStopName(stopName);

    // Smooth scroll down to map
    const mapElement = document.getElementById('interactive-campus-map');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="h-3.5 w-3.5 text-blue-500 animate-spin-slow" />
            <span>Campus Transit Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Daily Campus Bus Routes &amp; Live Map
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl">
            Real-time route timetables, stoppage timings, seat availability, and interactive Google Map for Sri Sairam College of Engineering daily commuters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://maps.google.com/?q=Sri+Sairam+College+of+Engineering+Anekal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Campus Location</span>
          </a>
        </div>
      </div>

      {/* Google Maps Split-Screen Transit Explorer: Left Search & Right Map */}
      <div id="interactive-campus-map" className="scroll-mt-6">
        <CampusTransitExplorer
          routes={routes}
          vehicles={vehicles}
          initialRouteId={selectedRouteId}
          initialStopName={selectedStopName}
        />
      </div>

      {/* Grid of All Campus Routes with Full Stoppage Timetables */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-amber-400">
            Route Directory
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            All Official Campus Bus Routes &amp; Drivers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click any route below to inspect intermediate stop timings, driver credentials, and GPS route path.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId;
            return (
              <div
                key={route.id}
                className={`rounded-3xl border transition flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-500/5 dark:bg-amber-400/5'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-xs">
                      {route.routeNumber}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {route.availableSeats} of {route.totalSeats} Seats Free
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {route.routeName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      From: <strong className="text-slate-800 dark:text-slate-200">{route.origin}</strong>
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">First Stop Time:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {route.stops[0]?.timeMorning}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Campus Arrival:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        08:25 AM
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Assigned Driver:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {route.driverName}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Via Key Stops:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {route.stops.slice(1, 5).map((s: RouteStop) => (
                        <span
                          key={s.id}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {s.name}
                        </span>
                      ))}
                      {route.stops.length > 5 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-slate-400">
                          +{route.stops.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center gap-2">
                  <a
                    href={`tel:${route.driverPhone.replace(/\s+/g, '')}`}
                    className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
                    title={`Call Driver ${route.driverName}`}
                  >
                    <Phone className="h-4 w-4 text-emerald-500" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleSelectRouteFromSearch(route.id)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View on Google Map</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transit Safety & Helpdesk Protocol */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Central Transport Helpdesk</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">
            Need Route Assistance or Lost &amp; Found in Bus?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Contact College Transport Officer at College Campus Main Gate 1. In emergency, drivers can be contacted directly via the mobile numbers listed above.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <a
            href="tel:+919876500011"
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Call Transport Desk</span>
          </a>
        </div>
      </div>
    </div>
  );
};
