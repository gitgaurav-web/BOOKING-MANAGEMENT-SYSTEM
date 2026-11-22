import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Bus,
  Clock,
  Phone,
  Users,
  ShieldCheck,
  ExternalLink,
  Layers,
  ChevronRight,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { CampusRoute, RouteStop } from '../types';

interface CampusGoogleMapProps {
  routes: CampusRoute[];
  selectedRouteId?: string;
  selectedStopName?: string;
  onSelectRoute?: (routeId: string) => void;
  onSelectStop?: (stop: RouteStop) => void;
}

export const CampusGoogleMap: React.FC<CampusGoogleMapProps> = ({
  routes,
  selectedRouteId,
  selectedStopName,
  onSelectRoute,
  onSelectStop,
}) => {
  const [activeRouteId, setActiveRouteId] = useState<string>(selectedRouteId || routes[0]?.id || 'route-101');
  const [activeStop, setActiveStop] = useState<RouteStop | null>(null);
  const [mapMode, setMapMode] = useState<'google' | 'schematic'>('google');
  const [timeShift, setTimeShift] = useState<'morning' | 'evening'>('morning');

  const currentRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

  // College Campus Coordinates: Sri Sairam College of Engineering, Anekal, Bengaluru
  const COLLEGE_LAT = 12.7105;
  const COLLEGE_LNG = 77.6974;

  const handleRouteChange = (id: string) => {
    setActiveRouteId(id);
    setActiveStop(null);
    if (onSelectRoute) onSelectRoute(id);
  };

  const handleStopClick = (stop: RouteStop) => {
    setActiveStop(stop);
    if (onSelectStop) onSelectStop(stop);
  };

  // Google Maps Embed URL for selected stop or college
  const targetLat = activeStop ? activeStop.latitude : (currentRoute?.stops[0]?.latitude || COLLEGE_LAT);
  const targetLng = activeStop ? activeStop.longitude : (currentRoute?.stops[0]?.longitude || COLLEGE_LNG);
  const targetLabel = activeStop ? encodeURIComponent(activeStop.name) : encodeURIComponent('Sri Sairam College of Engineering, Anekal');

  // Google Maps Embed with transit and satellite option
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${targetLat},${targetLng}&t=m&z=13&ie=UTF8&iwloc=&output=embed`;

  // External turn-by-turn Navigation URL to open in Google Maps app
  const googleMapsDirectionsUrl = activeStop
    ? `https://www.google.com/maps/dir/?api=1&origin=${activeStop.latitude},${activeStop.longitude}&destination=${COLLEGE_LAT},${COLLEGE_LNG}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Sri Sairam College of Engineering, Sai Leo Nagar, Anekal, Bengaluru')}`;

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xl">
      {/* Top Map Header & Controls */}
      <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <Compass className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Live Campus Transit Map
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                GPS Active
              </span>
            </div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {currentRoute ? `${currentRoute.routeNumber} — ${currentRoute.routeName}` : 'Campus Bus Network'}
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Shift Toggle */}
          <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTimeShift('morning')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeShift === 'morning'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Morning Pickup
            </button>
            <button
              type="button"
              onClick={() => setTimeShift('evening')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeShift === 'evening'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Evening Drop
            </button>
          </div>

          {/* Map View Toggle */}
          <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMapMode('google')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                mapMode === 'google'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Google Map</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('schematic')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                mapMode === 'schematic'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Route Stops</span>
            </button>
          </div>

          {/* Open Google Maps Directions */}
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
            title="Open turn-by-turn directions in Google Maps app"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in Google Maps</span>
          </a>
        </div>
      </div>

      {/* Route Quick Selector Pills */}
      <div className="bg-slate-950 px-4 py-2.5 overflow-x-auto flex items-center gap-2 border-b border-slate-800 scrollbar-thin">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Select Route:
        </span>
        {routes.map((r) => {
          const isSelected = r.id === activeRouteId;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRouteChange(r.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-300'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <Bus className="h-3 w-3" />
              <span>{r.routeNumber}</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">({r.vehicleType})</span>
            </button>
          );
        })}
      </div>

      {/* Main Map Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: Google Map Embed or Schematic View */}
        <div className="relative min-h-[380px] sm:min-h-[460px] bg-slate-950">
          {mapMode === 'google' ? (
            <iframe
              title={`Google Map - ${currentRoute?.routeName || 'Sri Sairam College'}`}
              src={googleMapEmbedUrl}
              className="w-full h-full min-h-[380px] sm:min-h-[460px] border-0"
              loading="lazy"
              allowFullScreen
            />
          ) : (
            /* Schematic Interactive Transit Stop Visualizer */
            <div className="p-6 h-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white select-none">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Schematic Bus Corridor
                  </span>
                  <span className="text-xs text-slate-400">
                    Total Distance: <strong className="text-white">{currentRoute?.distanceKm} KM</strong> · Est. Duration: <strong className="text-white">{currentRoute?.estimatedDurationMins} Mins</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Click on any stoppage node below to view pickup times and center on that location.
                </p>
              </div>

              {/* Connected Dots Transit Line */}
              <div className="relative my-6 px-4">
                <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-500 rounded-full" />
                <div className="relative flex justify-between items-center overflow-x-auto py-4">
                  {currentRoute?.stops.map((stop, idx) => {
                    const isSelected = activeStop?.id === stop.id;
                    const isFirst = idx === 0;
                    const isLast = idx === (currentRoute.stops.length - 1);
                    return (
                      <button
                        key={stop.id}
                        type="button"
                        onClick={() => handleStopClick(stop)}
                        className="group flex flex-col items-center focus:outline-hidden px-2 shrink-0"
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
                        <span className="mt-2 text-[10px] font-semibold text-slate-300 max-w-[80px] text-center truncate group-hover:text-amber-300">
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

              {/* Status footer inside schematic */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Current Bus Speed</span>
                  <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    {currentRoute?.currentSpeedKmH || 45} km/h (Live GPS)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Available Capacity</span>
                  <span className="font-bold text-amber-400 mt-0.5 block">
                    {currentRoute?.availableSeats} of {currentRoute?.totalSeats} Seats Free
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Assigned Driver</span>
                  <span className="font-bold text-white mt-0.5 block truncate">
                    {currentRoute?.driverName}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Floating Campus Badge over Map */}
          <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-400/30 text-white text-xs shadow-lg flex items-center gap-2 pointer-events-none">
            <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold">
              {activeStop ? `Selected Stop: ${activeStop.name}` : `Destination: Sri Sairam Campus Gate 1`}
            </span>
          </div>
        </div>

        {/* Right: Route Details & Stop Timetable Panel */}
        <div className="p-5 sm:p-6 flex flex-col justify-between bg-slate-50 dark:bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800">
          <div>
            {/* Vehicle Spec Strip */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-amber-400">
                    Assigned Fleet Unit
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {currentRoute?.vehicleName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {currentRoute?.registrationNo}
                    </span>
                    <span>·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {currentRoute?.acAvailable ? 'Air Conditioned' : 'Non-AC Standard'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Seats Left</span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {currentRoute?.availableSeats}
                  </span>
                  <span className="text-[10px] text-slate-400 block">/ {currentRoute?.totalSeats} total</span>
                </div>
              </div>

              {/* Driver Contact Box */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                    {currentRoute?.driverName ? currentRoute.driverName.charAt(0) : 'D'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {currentRoute?.driverName}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Official Campus Driver</span>
                  </div>
                </div>

                <a
                  href={`tel:${currentRoute?.driverPhone?.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call Driver</span>
                </a>
              </div>
            </div>

            {/* Stoppage Timeline Header */}
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Stops &amp; Scheduled Timings ({timeShift === 'morning' ? 'Morning Shift' : 'Evening Return'})
              </h5>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {currentRoute?.stops.length} Total Stops
              </span>
            </div>

            {/* Scrollable Stops List */}
            <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
              {currentRoute?.stops.map((stop, index) => {
                const isSelected = activeStop?.id === stop.id || selectedStopName?.toLowerCase() === stop.name.toLowerCase();
                const isDest = stop.isCollege;
                return (
                  <button
                    key={stop.id}
                    type="button"
                    onClick={() => handleStopClick(stop)}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between border ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/50 dark:bg-amber-400/10 dark:border-amber-400/40'
                        : isDest
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isDest
                            ? 'bg-emerald-600 text-white'
                            : isSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isDest ? '★' : index + 1}
                      </span>
                      <div className="min-w-0">
                        <span
                          className={`text-xs font-semibold block truncate ${
                            isSelected
                              ? 'text-amber-800 dark:text-amber-300 font-bold'
                              : isDest
                              ? 'text-emerald-800 dark:text-emerald-300 font-bold'
                              : 'text-slate-900 dark:text-slate-200'
                          }`}
                        >
                          {stop.name}
                        </span>
                        {isDest && (
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-medium">
                            College Main Transport Bay
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-amber-400 block">
                        {timeShift === 'morning' ? stop.timeMorning : stop.timeEvening}
                      </span>
                      <span className="text-[9px] text-slate-400 block">
                        {timeShift === 'morning' ? 'Pickup' : 'Drop'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Notice Card at Bottom */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Free for Sairam Students with ID Card</span>
            </span>
            <button
              type="button"
              onClick={() => handleRouteChange(currentRoute?.id || '')}
              className="text-blue-600 dark:text-amber-400 font-bold hover:underline"
            >
              Reset Focus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
