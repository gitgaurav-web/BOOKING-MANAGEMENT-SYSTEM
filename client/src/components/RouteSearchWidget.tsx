import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  ArrowRightLeft,
  Bus,
  Car,
  Calendar,
  Clock,
  Phone,
  ShieldCheck,
  Users,
  Compass,
  ArrowRight,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { CampusRoute, RouteStop, Vehicle } from '../types';
import { DEFAULT_CAMPUS_ROUTES } from '../data/defaultRoutes';

interface RouteSearchWidgetProps {
  routes: CampusRoute[];
  vehicles: Vehicle[];
  onSelectRouteForMap?: (routeId: string, stopName?: string) => void;
}

export const RouteSearchWidget: React.FC<RouteSearchWidgetProps> = ({
  routes,
  vehicles,
  onSelectRouteForMap,
}) => {
  const navigate = useNavigate();

  // Mode: 'route' (Daily Bus Finder) vs 'charter' (Dedicated Fleet Booking)
  const [activeTab, setActiveTab] = useState<'route' | 'charter'>('route');

  // Active pool of routes: prop routes if populated, otherwise default fallback
  const allRoutes = (routes && routes.length > 0) ? routes : DEFAULT_CAMPUS_ROUTES;

  // Route Search State
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('Sri Sairam College Campus Gate 1');
  const [timeShift, setTimeShift] = useState<'morning' | 'evening'>('morning');
  const [searchResults, setSearchResults] = useState<CampusRoute[]>(allRoutes);
  const [hasSearched, setHasSearched] = useState(false);

  // Charter Booking Quick Form State
  const [charterType, setCharterType] = useState('BUS');
  const [charterDate, setCharterDate] = useState('');
  const [charterPassengers, setCharterPassengers] = useState('50');

  // Keep searchResults synchronized when routes prop arrives
  useEffect(() => {
    if (routes && routes.length > 0) {
      if (!fromQuery.trim()) {
        setSearchResults(routes);
      } else {
        const term = fromQuery.toLowerCase().trim();
        const matched = routes.filter((r) =>
          r.origin.toLowerCase().includes(term) ||
          r.stops.some((s) => s.name.toLowerCase().includes(term)) ||
          r.routeName.toLowerCase().includes(term) ||
          r.routeNumber.toLowerCase().includes(term)
        );
        setSearchResults(matched);
      }
    }
  }, [routes]);

  // Major pickup stop hubs across Greater Bengaluru & Hosur
  const POPULAR_STOPS = [
    'Silk Board',
    'Majestic',
    'Electronic City',
    'Banashankari',
    'Hosur',
    'BTM Layout',
    'Chandapura',
    'Jigani',
    'Whitefield',
  ];

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const term = fromQuery.toLowerCase().trim();

    if (!term) {
      setSearchResults(allRoutes);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const matched = allRoutes.filter((r) => {
      const matchOrigin = r.origin.toLowerCase().includes(term);
      const matchStops = r.stops.some((s) => s.name.toLowerCase().includes(term));
      const matchRoute = r.routeName.toLowerCase().includes(term) || r.routeNumber.toLowerCase().includes(term);
      return matchOrigin || matchStops || matchRoute;
    });

    setSearchResults(matched);

    if (matched.length > 0 && onSelectRouteForMap) {
      onSelectRouteForMap(matched[0].id, fromQuery);
    }
  };

  const handleClearSearch = () => {
    setFromQuery('');
    setSearchResults(allRoutes);
    setHasSearched(false);
  };

  const handleSwapLocations = () => {
    const temp = fromQuery;
    setFromQuery(toQuery);
    setToQuery(temp || 'Sri Sairam College Campus Gate 1');
    setTimeShift((prev) => (prev === 'morning' ? 'evening' : 'morning'));
  };

  const handleQuickStopClick = (stopName: string) => {
    setFromQuery(stopName);
    setHasSearched(true);
    const term = stopName.toLowerCase().trim();
    const matched = allRoutes.filter((r) =>
      r.origin.toLowerCase().includes(term) ||
      r.stops.some((s) => s.name.toLowerCase().includes(term))
    );
    setSearchResults(matched);
    if (matched.length > 0 && onSelectRouteForMap) {
      onSelectRouteForMap(matched[0].id, stopName);
    }
  };

  const handleProceedCharter = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/book?type=${charterType}&passengers=${charterPassengers}&date=${charterDate}`);
  };

  return (
    <div className="rounded-3xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-xl p-4 sm:p-6 shadow-2xl text-white">
      {/* Tab Switcher: Route Search vs Dedicated Booking */}
      <div className="flex border-b border-slate-800 pb-3 mb-6 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('route')}
          className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition transform active:scale-95 ${
            activeTab === 'route'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
          }`}
        >
          <Bus className="h-4 w-4" />
          <span>Daily Campus Bus Route Finder</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('charter')}
          className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition transform active:scale-95 ${
            activeTab === 'charter'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
          }`}
        >
          <Car className="h-4 w-4" />
          <span>Book Dedicated Vehicle (Charter / Event)</span>
        </button>
      </div>

      {/* TAB 1: Daily Route Finder (Strict Formal English) */}
      {activeTab === 'route' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Campus Transit Search
              </span>
              <h3 className="text-xl font-bold text-white leading-tight">
                Daily Campus Bus Route &amp; Transit Finder
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Search pickup stop schedules, arrival times, and real-time seat availability.
              </p>
            </div>

            {/* Shift Pill */}
            <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTimeShift('morning')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeShift === 'morning' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Morning Pickup
              </button>
              <button
                type="button"
                onClick={() => setTimeShift('evening')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeShift === 'evening' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Evening Drop
              </button>
            </div>
          </div>

          {/* Search Inputs */}
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-[1.2fr_auto_1.2fr_auto] gap-3 items-center">
            {/* From Input */}
            <div className="relative">
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                From: Pickup Stop / Area
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                <input
                  type="text"
                  value={fromQuery}
                  onChange={(e) => {
                    setFromQuery(e.target.value);
                    if (!e.target.value.trim()) {
                      setSearchResults(allRoutes);
                      setHasSearched(false);
                    }
                  }}
                  placeholder="e.g. Silk Board, Majestic, Electronic City..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium"
                />
                {fromQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1 md:my-0 pt-4">
              <button
                type="button"
                onClick={handleSwapLocations}
                className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-400 flex items-center justify-center transition shadow-xs"
                title="Swap Direction"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>

            {/* To Input */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                To: Destination
              </label>
              <div className="relative">
                <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="text"
                  value={toQuery}
                  onChange={(e) => setToQuery(e.target.value)}
                  placeholder="Sri Sairam College Campus Gate 1"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Search Buses</span>
              </button>
            </div>
          </form>

          {/* Quick Click Stop Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Popular College Transit Hubs:
            </span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_STOPS.map((stop) => (
                <button
                  key={stop}
                  type="button"
                  onClick={() => handleQuickStopClick(stop)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium cursor-pointer ${
                    fromQuery.toLowerCase() === stop.toLowerCase()
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-xs'
                      : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {stop}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results Cards */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {hasSearched ? (
                  <>
                    Showing <strong className="text-amber-400">{searchResults.length}</strong> matching campus buses for &ldquo;{fromQuery}&rdquo;:
                  </>
                ) : (
                  <>
                    All Scheduled Campus Routes (<strong className="text-amber-400">{searchResults.length} active</strong>):
                  </>
                )}
              </span>
              {hasSearched && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-amber-400 hover:underline font-semibold cursor-pointer"
                >
                  Reset / View All Routes
                </button>
              )}
            </div>

            {searchResults.length === 0 ? (
              /* No Direct Bus Notice */
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      No direct scheduled route found for &ldquo;{fromQuery}&rdquo;
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Our closest major campus transit corridor is <strong>Silk Board Junction (Route 101)</strong> or <strong>Chandapura Junction</strong>.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-amber-300 font-medium">
                    Need transport for an official department event or academic tour?
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('charter')}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-xs transition cursor-pointer"
                  >
                    Book Dedicated Campus Vehicle
                  </button>
                </div>
              </div>
            ) : (
              /* Matching Bus Result Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((route) => {
                  const matchedStop = fromQuery
                    ? route.stops.find((s) => s.name.toLowerCase().includes(fromQuery.toLowerCase()))
                    : route.stops[0];
                  const pickupTime = timeShift === 'morning'
                    ? (matchedStop?.timeMorning || route.stops[0].timeMorning)
                    : (matchedStop?.timeEvening || route.stops[0].timeEvening);
                  const campusArrival = timeShift === 'morning' ? '08:25 AM' : '04:45 PM';

                  return (
                    <div
                      key={route.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition p-4 flex flex-col justify-between space-y-3 shadow-md"
                    >
                      <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                              {route.routeNumber}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {route.vehicleType}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{route.availableSeats} of {route.totalSeats} Seats Free</span>
                          </div>
                        </div>

                        {/* Route Title */}
                        <h4 className="text-base font-bold text-white mt-1.5">
                          {route.routeName}
                        </h4>
                        <p className="text-xs text-slate-400">
                          Assigned Fleet: <strong className="text-slate-200">{route.vehicleName}</strong> ({route.registrationNo})
                        </p>

                        {/* Timing Block */}
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">
                              {matchedStop?.name || 'Origin'} ({timeShift === 'morning' ? 'Pickup' : 'Drop'})
                            </span>
                            <span className="font-mono font-bold text-amber-400 text-sm">
                              {pickupTime}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">
                              Campus Gate 1
                            </span>
                            <span className="font-mono font-bold text-emerald-400 text-sm">
                              {campusArrival}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <a
                          href={`tel:${route.driverPhone.replace(/\s+/g, '')}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                          title={`Call Driver ${route.driverName}`}
                        >
                          <Phone className="h-3 w-3 text-emerald-400" />
                          <span>{route.driverName}</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => onSelectRouteForMap && onSelectRouteForMap(route.id, fromQuery)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                          <span>View on Google Map</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Charter & Special Event Fleet Reservation */}
      {activeTab === 'charter' && (
        <form onSubmit={handleProceedCharter} className="space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Departmental Requisition
            </span>
            <h3 className="text-xl font-bold text-white leading-tight">
              Reserve an Official Campus Vehicle (Industrial Visit, Conference, Tour)
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Select your vehicle category, schedule date, and passenger capacity for official institutional transit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Vehicle Type */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Vehicle Category
              </label>
              <select
                value={charterType}
                onChange={(e) => setCharterType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-amber-400"
              >
                <option value="BUS">College Bus (55-Seater)</option>
                <option value="CAR">Official Staff Car (Innova 7-Seater)</option>
                <option value="VAN">Academic Van (18-Seater)</option>
                <option value="AMBULANCE">Emergency Campus Ambulance</option>
              </select>
            </div>

            {/* Travel Date */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Trip Start Date
              </label>
              <input
                type="date"
                value={charterDate}
                onChange={(e) => setCharterDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-amber-400"
              />
            </div>

            {/* Passenger Count */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Estimated Passengers
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={charterPassengers}
                onChange={(e) => setCharterPassengers(e.target.value)}
                placeholder="50"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/20 text-xs text-slate-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0" />
              <span>
                Generates a verified <strong>Transport Security Gate Pass &amp; Driver Trip Sheet</strong> with QR validation for Gate 1 clearance.
              </span>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Continue to Booking Form</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
