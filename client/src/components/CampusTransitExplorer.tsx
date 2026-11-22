import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  ArrowRightLeft,
  Bus,
  Car,
  Clock,
  Phone,
  ShieldCheck,
  Users,
  Compass,
  ArrowRight,
  ChevronRight,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Layers,
  Navigation,
  Fuel,
  CheckCircle2,
  X,
  Calendar,
  Check,
} from 'lucide-react';
import { CampusRoute, RouteStop, Vehicle } from '../types';
import { DEFAULT_CAMPUS_ROUTES } from '../data/defaultRoutes';

interface CampusTransitExplorerProps {
  routes?: CampusRoute[];
  vehicles?: Vehicle[];
  initialRouteId?: string;
  initialStopName?: string;
}

interface StopSuggestion {
  stopId: string;
  stopName: string;
  routeId: string;
  routeNumber: string;
  routeName: string;
  vehicleType: string;
  timeMorning: string;
  timeEvening: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  isCollege?: boolean;
}

export const CampusTransitExplorer: React.FC<CampusTransitExplorerProps> = ({
  routes = [],
  vehicles = [],
  initialRouteId,
  initialStopName,
}) => {
  const navigate = useNavigate();

  // Active pool of routes: prop routes if populated, otherwise default fallback
  const allRoutes = useMemo(() => {
    return routes && routes.length > 0 ? routes : DEFAULT_CAMPUS_ROUTES;
  }, [routes]);

  // Mode: 'transit' (Daily Bus Routes) vs 'charter' (Dedicated Fleet Booking)
  const [activeTab, setActiveTab] = useState<'transit' | 'charter'>('transit');

  // Vehicle filter: 'ALL' | 'BUS' | 'VAN' | 'CAR'
  const [vehicleFilter, setVehicleFilter] = useState<'ALL' | 'BUS' | 'VAN' | 'CAR'>('ALL');

  // Search State
  const [fromQuery, setFromQuery] = useState<string>(initialStopName || '');
  const [toQuery, setToQuery] = useState<string>('Sri Sairam College Campus Gate 1');
  const [timeShift, setTimeShift] = useState<'morning' | 'evening'>('morning');

  // Search Recommendation Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Active Selected Route for the Right-Side Google Map
  const [activeRouteId, setActiveRouteId] = useState<string>(
    initialRouteId || allRoutes[0]?.id || 'route-101'
  );
  const [activeStop, setActiveStop] = useState<RouteStop | null>(null);

  // Map Mode: 'google' (Iframe embed) vs 'schematic' (Interactive timeline)
  const [mapMode, setMapMode] = useState<'google' | 'schematic'>('google');

  // Charter Booking Quick State
  const [charterType, setCharterType] = useState('BUS');
  const [charterDate, setCharterDate] = useState('');
  const [charterPassengers, setCharterPassengers] = useState('50');

  // Active current route object for right pane
  const currentRoute = useMemo(() => {
    return allRoutes.find((r) => r.id === activeRouteId) || allRoutes[0];
  }, [allRoutes, activeRouteId]);

  // College Coordinates: Sri Sairam College of Engineering, Anekal, Bengaluru
  const COLLEGE_LAT = 12.7105;
  const COLLEGE_LNG = 77.6974;

  // Key pickup hubs across Greater Bengaluru & Hosur
  const POPULAR_HUBS = [
    'Silk Board',
    'Majestic',
    'Electronic City',
    'Banashankari',
    'Hosur',
    'BTM Layout',
    'Chandapura',
    'Whitefield',
  ];

  // Comprehensive catalog of all stoppages across all routes for Google Maps style autocomplete
  const allStoppageSuggestions: StopSuggestion[] = useMemo(() => {
    const list: StopSuggestion[] = [];
    const seen = new Set<string>();

    allRoutes.forEach((route) => {
      route.stops.forEach((stop) => {
        const key = `${stop.name.toLowerCase()}__${route.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            stopId: stop.id,
            stopName: stop.name,
            routeId: route.id,
            routeNumber: route.routeNumber,
            routeName: route.routeName,
            vehicleType: route.vehicleType,
            timeMorning: stop.timeMorning,
            timeEvening: stop.timeEvening,
            distanceKm: route.distanceKm,
            latitude: stop.latitude,
            longitude: stop.longitude,
            isCollege: stop.isCollege,
          });
        }
      });
    });

    return list;
  }, [allRoutes]);

  // Filtered recommendations based on user input
  const recommendedStoppages = useMemo(() => {
    const term = fromQuery.toLowerCase().trim();
    if (!term) {
      // Return top major transit hubs if search is empty
      return allStoppageSuggestions.filter((s) =>
        ['Silk Board Junction', 'Majestic TTMC', 'Electronic City Toll (Phase 1)', 'Banashankari TTMC', 'Hosur Central Bus Stand', 'Whitefield TTMC', 'Chandapura Junction'].some(
          (hub) => s.stopName.toLowerCase().includes(hub.toLowerCase())
        )
      );
    }

    return allStoppageSuggestions.filter(
      (s) =>
        s.stopName.toLowerCase().includes(term) ||
        s.routeName.toLowerCase().includes(term) ||
        s.routeNumber.toLowerCase().includes(term)
    );
  }, [allStoppageSuggestions, fromQuery]);

  // Filtered Route Results based on search query & vehicle filter
  const filteredRoutes = useMemo(() => {
    let list = allRoutes;

    if (vehicleFilter !== 'ALL') {
      list = list.filter((r) => r.vehicleType === vehicleFilter);
    }

    const term = fromQuery.toLowerCase().trim();
    if (!term) return list;

    return list.filter((r) => {
      const matchOrigin = r.origin.toLowerCase().includes(term);
      const matchStops = r.stops.some((s) => s.name.toLowerCase().includes(term));
      const matchName = r.routeName.toLowerCase().includes(term);
      const matchNumber = r.routeNumber.toLowerCase().includes(term);
      return matchOrigin || matchStops || matchName || matchNumber;
    });
  }, [allRoutes, vehicleFilter, fromQuery]);

  // Click outside listener to dismiss recommendations dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep active route valid if filter changes
  useEffect(() => {
    if (filteredRoutes.length > 0) {
      const exists = filteredRoutes.some((r) => r.id === activeRouteId);
      if (!exists) {
        setActiveRouteId(filteredRoutes[0].id);
        setActiveStop(null);
      }
    }
  }, [filteredRoutes, activeRouteId]);

  // Sync if initial props change
  useEffect(() => {
    if (initialRouteId) setActiveRouteId(initialRouteId);
    if (initialStopName) setFromQuery(initialStopName);
  }, [initialRouteId, initialStopName]);

  const handleClearSearch = () => {
    setFromQuery('');
    setActiveStop(null);
    setIsDropdownOpen(false);
  };

  const handleSwapLocations = () => {
    const temp = fromQuery;
    setFromQuery(toQuery);
    setToQuery(temp || 'Sri Sairam College Campus Gate 1');
    setTimeShift((prev) => (prev === 'morning' ? 'evening' : 'morning'));
    setIsDropdownOpen(false);
  };

  const handleSelectSuggestion = (suggestion: StopSuggestion) => {
    setFromQuery(suggestion.stopName);
    setActiveRouteId(suggestion.routeId);
    setActiveStop({
      id: suggestion.stopId,
      name: suggestion.stopName,
      timeMorning: suggestion.timeMorning,
      timeEvening: suggestion.timeEvening,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      isCollege: suggestion.isCollege,
    });
    setIsDropdownOpen(false);
  };

  const handleQuickHubClick = (hubName: string) => {
    setFromQuery(hubName);
    setIsDropdownOpen(false);
    const term = hubName.toLowerCase();
    const matched = allRoutes.filter(
      (r) =>
        r.origin.toLowerCase().includes(term) ||
        r.stops.some((s) => s.name.toLowerCase().includes(term))
    );
    if (matched.length > 0) {
      setActiveRouteId(matched[0].id);
      const foundStop = matched[0].stops.find((s) => s.name.toLowerCase().includes(term));
      if (foundStop) setActiveStop(foundStop);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown') {
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < recommendedStoppages.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : recommendedStoppages.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < recommendedStoppages.length) {
        handleSelectSuggestion(recommendedStoppages[highlightedIndex]);
      } else if (recommendedStoppages.length > 0) {
        handleSelectSuggestion(recommendedStoppages[0]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleSelectRoute = (route: CampusRoute) => {
    setActiveRouteId(route.id);
    if (fromQuery.trim()) {
      const matched = route.stops.find((s) =>
        s.name.toLowerCase().includes(fromQuery.toLowerCase().trim())
      );
      setActiveStop(matched || route.stops[0]);
    } else {
      setActiveStop(route.stops[0]);
    }
  };

  const handleSelectStopOnMap = (stop: RouteStop) => {
    setActiveStop(stop);
  };

  const handleProceedCharter = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/book?type=${charterType}&passengers=${charterPassengers}&date=${charterDate}`);
  };

  const convertTimeTo24h = (rawTime?: string): string => {
    if (!rawTime) return '08:30';
    const cleaned = rawTime.trim().toUpperCase();
    const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
    if (!match) return '08:30';
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const meridiem = match[3];
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const handleBookRouteVehicle = (route?: CampusRoute, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!route) return;

    // 1. Match the vehicle in vehicles list (by registration number, name, or vehicleType)
    const matchedVehicle = vehicles?.find(
      (v) =>
        (route.registrationNo && v.registrationNo?.toLowerCase() === route.registrationNo.toLowerCase()) ||
        (route.vehicleName && v.name.toLowerCase().includes(route.vehicleName.toLowerCase())) ||
        (v.vehicleType === route.vehicleType)
    );

    // 2. Determine pickup stop and drop point
    const matchedStop = fromQuery
      ? route.stops.find((s) => s.name.toLowerCase().includes(fromQuery.toLowerCase().trim()))
      : route.stops[0];
    const pickupLoc = matchedStop?.name || route.origin || 'Sri Sairam College Campus Main Gate 1';
    const dropLoc = toQuery || route.destination || 'Sri Sairam College Campus Gate 1';

    // 3. Determine departure time
    const rawTime =
      timeShift === 'morning'
        ? matchedStop?.timeMorning || route.stops[0]?.timeMorning
        : matchedStop?.timeEvening || route.stops[0]?.timeEvening;
    const cleanTime = convertTimeTo24h(rawTime);

    // 4. Construct Query Parameters for instant prefill on /book
    const params = new URLSearchParams();
    if (matchedVehicle) {
      params.set('vehicle', matchedVehicle.id);
    } else if (route.vehicleName) {
      params.set('vehicle', route.vehicleName);
    }
    params.set('pickup', pickupLoc);
    params.set('drop', dropLoc);
    params.set('departureTime', cleanTime);
    params.set('distance', String(route.distanceKm || 40));
    params.set('passengers', String(route.totalSeats || 50));
    params.set('type', route.vehicleType || 'BUS');
    params.set('title', `Transit Requisition - ${route.routeNumber} (${route.routeName})`);

    navigate(`/book?${params.toString()}`);
  };

  // Google Maps Coordinates Calculation
  const targetLat = activeStop
    ? activeStop.latitude
    : currentRoute?.stops[0]?.latitude || COLLEGE_LAT;
  const targetLng = activeStop
    ? activeStop.longitude
    : currentRoute?.stops[0]?.longitude || COLLEGE_LNG;

  // Google Maps Embed URL
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${targetLat},${targetLng}&t=m&z=13&ie=UTF8&iwloc=&output=embed`;

  // External Turn-by-Turn Navigation URL (Opens Google Maps App)
  const googleMapsDirectionsUrl = activeStop
    ? `https://www.google.com/maps/dir/?api=1&origin=${activeStop.latitude},${activeStop.longitude}&destination=${COLLEGE_LAT},${COLLEGE_LNG}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        'Sri Sairam College of Engineering, Sai Leo Nagar, Anekal, Bengaluru'
      )}`;

  // Available on-demand official fleet vehicles (Cars, Vans, Buses)
  const availableFleetVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    return vehicles.filter((v) => v.status === 'ACTIVE');
  }, [vehicles]);

  return (
    <div className="rounded-3xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden text-white">
      {/* Top Bar: Clean & Minimal Header */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src="/images/sairam-seal.png"
            alt="Sairam Seal"
            className="h-6 w-6 rounded-full bg-white object-contain p-[1px] shadow-xs"
          />
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">
              Campus Transit &amp; Route Navigator
            </h2>
            <span className="text-[11px] text-slate-400">
              Sri Sairam College of Engineering · Real-Time Google Maps Transit
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('transit')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'transit'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Bus className="h-3.5 w-3.5" />
            <span>Daily Campus Transit</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('charter')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'charter'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>Book Dedicated Fleet</span>
          </button>
        </div>
      </div>

      {/* Main Split-Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Transit Search & Routes (lg:col-span-5) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/95 flex flex-col justify-between p-4 sm:p-5 space-y-4 max-h-[780px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.25)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent pr-2">
          <div className="space-y-4">
            {activeTab === 'transit' ? (
              <>
                {/* Clean Google Maps Directions Search Box with Smart Recommendations */}
                <div
                  ref={searchContainerRef}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative"
                >
                  {/* From & To with Connected Path Line */}
                  <div className="relative space-y-2">
                    {/* Visual Connected Line */}
                    <div className="absolute left-[15px] top-[18px] bottom-[18px] w-0.5 border-l-2 border-dashed border-slate-600" />

                    {/* From Input with Google Maps Recommendation Autocomplete */}
                    <div className="relative flex items-center">
                      <div className="h-7 w-7 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center shrink-0 z-10 mr-2.5">
                        <span className="h-2 w-2 rounded-full bg-blue-400" />
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={fromQuery}
                          onFocus={() => {
                            setIsDropdownOpen(true);
                            setHighlightedIndex(-1);
                          }}
                          onChange={(e) => {
                            setFromQuery(e.target.value);
                            setIsDropdownOpen(true);
                            setHighlightedIndex(-1);
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="Search pickup stop, area, or landmark..."
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs font-medium focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                        {fromQuery && (
                          <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Google Maps Style Recommendation Dropdown */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 top-12 z-50 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl overflow-hidden backdrop-blur-xl">
                        <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <Compass className="h-3.5 w-3.5" />
                            {fromQuery ? 'Matching Stoppages' : 'Suggested Transit Hubs'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {recommendedStoppages.length} locations
                          </span>
                        </div>

                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/70 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.25)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700/60">
                          {recommendedStoppages.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                              <span>No scheduled stoppage found for &ldquo;{fromQuery}&rdquo;.</span>
                              <div className="mt-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuickHubClick('Silk Board')}
                                  className="text-amber-400 font-bold hover:underline text-[11px]"
                                >
                                  Try Silk Board Junction
                                </button>
                              </div>
                            </div>
                          ) : (
                            recommendedStoppages.slice(0, 7).map((item, index) => {
                              const isHighlighted = index === highlightedIndex;
                              const pickupTime =
                                timeShift === 'morning' ? item.timeMorning : item.timeEvening;

                              return (
                                <button
                                  key={`${item.routeId}-${item.stopId}`}
                                  type="button"
                                  onClick={() => handleSelectSuggestion(item)}
                                  className={`w-full p-2.5 text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                                    isHighlighted
                                      ? 'bg-amber-500/20 text-white'
                                      : 'hover:bg-slate-800/80 text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-7 w-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                                      <MapPin className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-white truncate">
                                        {item.stopName}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        <strong className="text-amber-300">{item.routeNumber}</strong> · {item.routeName}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-mono text-[11px] font-bold text-amber-400 block">
                                      {pickupTime}
                                    </span>
                                    <span className="text-[9px] text-slate-400 block">
                                      {item.distanceKm} KM Corridor
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* To Input */}
                    <div className="relative flex items-center">
                      <div className="h-7 w-7 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shrink-0 z-10 mr-2.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={toQuery}
                          onChange={(e) => setToQuery(e.target.value)}
                          placeholder="Sri Sairam College Campus Gate 1"
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs font-medium focus:outline-hidden focus:border-emerald-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSwapLocations}
                        className="ml-2 h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-400 flex items-center justify-center transition shrink-0 cursor-pointer"
                        title="Swap Direction"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Clean Shift & Vehicle Filters Row */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Shift Pill */}
                    <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setTimeShift('morning')}
                        className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                          timeShift === 'morning'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Morning Shift
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeShift('evening')}
                        className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                          timeShift === 'evening'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Evening Return
                      </button>
                    </div>

                    {/* Vehicle Filter */}
                    <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setVehicleFilter('ALL')}
                        className={`px-2 py-1 rounded-md transition cursor-pointer ${
                          vehicleFilter === 'ALL'
                            ? 'bg-white text-slate-950 font-bold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleFilter('BUS')}
                        className={`px-2 py-1 rounded-md transition cursor-pointer ${
                          vehicleFilter === 'BUS'
                            ? 'bg-white text-slate-950 font-bold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Buses
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleFilter('VAN')}
                        className={`px-2 py-1 rounded-md transition cursor-pointer ${
                          vehicleFilter === 'VAN'
                            ? 'bg-white text-slate-950 font-bold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Vans
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleFilter('CAR')}
                        className={`px-2 py-1 rounded-md transition cursor-pointer ${
                          vehicleFilter === 'CAR'
                            ? 'bg-white text-slate-950 font-bold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Cars
                      </button>
                    </div>
                  </div>

                  {/* Clean Flex-Wrap Popular Hubs (No ugly horizontal scrollbar) */}
                  <div className="pt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 mr-1">
                      Popular Hubs:
                    </span>
                    {POPULAR_HUBS.map((hub) => (
                      <button
                        key={hub}
                        type="button"
                        onClick={() => handleQuickHubClick(hub)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium ${
                          fromQuery.toLowerCase() === hub.toLowerCase()
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-xs'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
                        }`}
                      >
                        {hub}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corridor Results Header */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>
                    Available Corridors (
                    <strong className="text-amber-400">{filteredRoutes.length}</strong> routes):
                  </span>
                  {fromQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="text-amber-400 hover:underline text-[11px] font-semibold cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
                </div>

                {/* Corridor Cards List */}
                <div className="space-y-2.5">
                  {filteredRoutes.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-300 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            No direct route matches &ldquo;{fromQuery}&rdquo;
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Check <strong>Silk Board Junction</strong> or <strong>Chandapura</strong> for the closest connection.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('charter')}
                        className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer"
                      >
                        Reserve Dedicated Campus Vehicle
                      </button>
                    </div>
                  ) : (
                    filteredRoutes.map((route) => {
                      const isSelected = route.id === activeRouteId;
                      const matchedStop = fromQuery
                        ? route.stops.find((s) => s.name.toLowerCase().includes(fromQuery.toLowerCase().trim()))
                        : route.stops[0];
                      const pickupTime =
                        timeShift === 'morning'
                          ? matchedStop?.timeMorning || route.stops[0].timeMorning
                          : matchedStop?.timeEvening || route.stops[0].timeEvening;

                      return (
                        <div
                          key={route.id}
                          onClick={() => handleSelectRoute(route)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                              : 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-800'
                          }`}
                        >
                          {/* Top Row: Route Badge, Vehicle, and Seats */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
                                {route.routeNumber}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400">
                                {route.vehicleType} · {route.vehicleName.split(' ')[0]}
                              </span>
                            </div>

                            {/* Live Seat Pill */}
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span>{route.availableSeats} of {route.totalSeats} Free</span>
                            </span>
                          </div>

                          {/* Route Corridor Name */}
                          <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                            {route.routeName}
                          </h4>

                          {/* Visual Transit Metrics Bar */}
                          <div className="mt-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">
                                {matchedStop?.name || 'Pickup Point'}
                              </span>
                              <span className="font-mono font-bold text-amber-400 text-xs">
                                {pickupTime}
                              </span>
                            </div>

                            <div className="text-center">
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">
                                Distance
                              </span>
                              <span className="font-semibold text-white text-xs">
                                {route.distanceKm} KM
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">
                                Est. Duration
                              </span>
                              <span className="font-semibold text-emerald-400 text-xs">
                                {route.estimatedDurationMins} Mins
                              </span>
                            </div>
                          </div>

                          {/* Action Strip */}
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-400">
                              {route.stops.length} Stoppages along Corridor
                            </span>

                            <span
                              className={`text-[11px] font-bold flex items-center gap-1 ${
                                isSelected ? 'text-amber-400' : 'text-slate-300'
                              }`}
                            >
                              <span>{isSelected ? 'Focused on Map' : 'View on Map'}</span>
                              <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>

                          {/* Direct Book This Bus / Vehicle Button */}
                          <button
                            type="button"
                            onClick={(e) => handleBookRouteVehicle(route, e)}
                            className="mt-2.5 w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                            title={`Book this ${route.vehicleType === 'BUS' ? 'Bus' : route.vehicleType === 'VAN' ? 'Van' : 'Vehicle'} for official department requisition`}
                          >
                            <Car className="w-3.5 h-3.5" />
                            <span>Book This {route.vehicleType === 'BUS' ? 'Bus' : route.vehicleType === 'VAN' ? 'Van' : 'Vehicle'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              /* Dedicated Vehicle Charter Booking */
              <form onSubmit={handleProceedCharter} className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Institutional Requisition
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Book Dedicated Campus Vehicle (Cars / Vans / Buses)
                  </h4>
                  <p className="text-xs text-slate-400">
                    For departmental industrial visits, conferences, sports meets, and official faculty travel.
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">
                        Vehicle Category
                      </label>
                      <select
                        value={charterType}
                        onChange={(e) => setCharterType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                      >
                        <option value="BUS">College Bus (55-Seater Heavy Passenger)</option>
                        <option value="CAR">Official Staff Car (Toyota Innova 7-Seater)</option>
                        <option value="VAN">Academic Mid-Van (Force Traveller 18-Seater)</option>
                        <option value="AMBULANCE">Emergency Life Support Ambulance</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-300 block mb-1">
                          Date of Travel
                        </label>
                        <input
                          type="date"
                          value={charterDate}
                          onChange={(e) => setCharterDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-300 block mb-1">
                          Passengers
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={charterPassengers}
                          onChange={(e) => setCharterPassengers(e.target.value)}
                          placeholder="50"
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <span>Continue to Booking Form</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Available Fleet Units */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Available Campus Fleet:
                  </span>
                  <div className="space-y-2">
                    {availableFleetVehicles.slice(0, 3).map((v) => (
                      <div
                        key={v.id}
                        className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{v.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              {v.vehicleType}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {v.capacity} Seats · {v.registrationNo}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                          Available Today
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Institutional Security Notice */}
          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>QR Code Gate 1 Pass Issued</span>
            </span>
            <span className="text-amber-400 font-semibold">Free for Sairam Students</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Google Map & Active Corridor (lg:col-span-7) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 relative min-h-[520px]">
          {/* Top Corridor Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
                  {currentRoute?.routeNumber}
                </span>
                <h3 className="text-base font-bold text-white">
                  {currentRoute?.routeName}
                </h3>
              </div>

              {/* Transit Metrics Strip */}
              <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-slate-300">
                <span className="text-amber-300 font-semibold">
                  {currentRoute?.distanceKm} KM Corridor
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">
                  {currentRoute?.estimatedDurationMins} Mins Travel Time
                </span>
                <span>•</span>
                <span className="text-slate-300">
                  {currentRoute?.availableSeats} of {currentRoute?.totalSeats} Seats Free
                </span>
              </div>
            </div>

            {/* Actions: View Toggle & Directions */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Map Mode Toggle */}
              <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMapMode('google')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    mapMode === 'google'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Google Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('schematic')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    mapMode === 'schematic'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Stoppage Line
                </button>
              </div>

              {/* Turn-by-Turn Directions in Google Maps */}
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                title="Open turn-by-turn navigation in Google Maps app"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in Google Maps</span>
              </a>

              {/* Direct Requisition Button for Active Route */}
              <button
                type="button"
                onClick={() => handleBookRouteVehicle(currentRoute)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition cursor-pointer"
                title="Book this vehicle for official college requisition"
              >
                <Bus className="h-3.5 w-3.5" />
                <span>Book Route Vehicle</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Middle Map Area: Google Map Embed vs Schematic */}
          <div className="relative flex-1 min-h-[420px] bg-slate-950">
            {mapMode === 'google' ? (
              <iframe
                title={`Google Map - ${currentRoute?.routeName || 'Sri Sairam College Campus'}`}
                src={googleMapEmbedUrl}
                className="w-full h-full min-h-[420px] border-0"
                loading="lazy"
                allowFullScreen
              />
            ) : (
              /* Schematic Interactive Timeline View */
              <div className="p-6 h-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white select-none">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Corridor Stoppages Timeline
                    </span>
                    <span className="text-xs text-slate-400">
                      Live GPS Speed: <strong className="text-emerald-400">{currentRoute?.currentSpeedKmH || 48} km/h</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Click any stoppage below to center the Google Map on that location.
                  </p>
                </div>

                {/* Stoppage Dots Line */}
                <div className="relative my-6 px-4">
                  <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-500 rounded-full" />
                  <div className="relative flex justify-between items-center overflow-x-auto py-4 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {currentRoute?.stops.map((stop, idx) => {
                      const isSelected = activeStop?.id === stop.id;
                      const isFirst = idx === 0;
                      const isLast = idx === currentRoute.stops.length - 1;
                      return (
                        <button
                          key={stop.id}
                          type="button"
                          onClick={() => handleSelectStopOnMap(stop)}
                          className="group flex flex-col items-center focus:outline-hidden px-2 shrink-0 cursor-pointer"
                        >
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] transition transform group-hover:scale-125 ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/40 shadow-lg scale-110'
                                : isLast
                                ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                                : isFirst
                                ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                                : 'bg-slate-800 text-slate-300 border border-slate-600 group-hover:bg-slate-700'
                            }`}
                          >
                            {isLast ? '🎓' : idx + 1}
                          </div>
                          <span className="mt-2 text-[10px] font-semibold text-slate-300 max-w-[85px] text-center truncate group-hover:text-amber-300">
                            {stop.name}
                          </span>
                          <span className="text-[9px] font-mono text-amber-400 font-bold">
                            {timeShift === 'morning' ? stop.timeMorning : stop.timeEvening}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Fleet Spec Strip */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Fleet Category</span>
                    <span className="font-bold text-white mt-0.5 block">{currentRoute?.vehicleType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Available Seats</span>
                    <span className="font-bold text-amber-400 mt-0.5 block">
                      {currentRoute?.availableSeats} of {currentRoute?.totalSeats} Free
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Driver</span>
                    <span className="font-bold text-white mt-0.5 block truncate">{currentRoute?.driverName}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Stoppage Badge */}
            <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-400/30 text-white text-xs shadow-lg flex items-center gap-2 pointer-events-none">
              <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold">
                {activeStop
                  ? `Focus Stop: ${activeStop.name} (${timeShift === 'morning' ? activeStop.timeMorning : activeStop.timeEvening})`
                  : `Destination: Sri Sairam College Campus Gate 1`}
              </span>
            </div>
          </div>

          {/* Bottom Interactive Stoppage Bar & Driver Contact */}
          <div className="p-3.5 bg-slate-900 border-t border-slate-800 space-y-2.5">
            {/* Horizontal Scroll of Intermediate Stops */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Stop to Center Map ({currentRoute?.stops.length} Stops):
                </span>
                <span className="text-[10px] text-amber-400 font-semibold">
                  {timeShift === 'morning' ? 'Morning Shift' : 'Evening Return'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {currentRoute?.stops.map((stop, index) => {
                  const isSelected = activeStop?.id === stop.id;
                  const isCollege = stop.isCollege;
                  return (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={() => handleSelectStopOnMap(stop)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                          : isCollege
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-75">
                        {isCollege ? '★' : `${index + 1}.`}
                      </span>
                      <span>{stop.name}</span>
                      <span className="font-mono text-[10px] text-amber-300 font-bold">
                        {timeShift === 'morning' ? stop.timeMorning : stop.timeEvening}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Driver & Assigned Fleet Bar */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 shrink-0 text-xs">
                  {currentRoute?.driverName ? currentRoute.driverName.charAt(0) : 'D'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{currentRoute?.driverName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300">
                      Official Driver
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Vehicle: {currentRoute?.vehicleName} ({currentRoute?.registrationNo})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${currentRoute?.driverPhone?.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call Driver ({currentRoute?.driverPhone})</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusTransitExplorer;
