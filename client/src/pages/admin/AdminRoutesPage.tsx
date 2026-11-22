import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { CampusRoute, RouteStop } from '../../types';
import {
  Compass,
  Bus,
  Car,
  Clock,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  MapPin,
  Users,
  Phone,
  Sparkles,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AdminRoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<CampusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUS' | 'VAN' | 'CAR'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Expanded stops accordion by route ID
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Active form state
  const [routeNumber, setRouteNumber] = useState('');
  const [routeName, setRouteName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('Sri Sairam College Campus Gate 1');
  const [vehicleType, setVehicleType] = useState<'BUS' | 'VAN' | 'CAR'>('BUS');
  const [vehicleName, setVehicleName] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [acAvailable, setAcAvailable] = useState(false);
  const [totalSeats, setTotalSeats] = useState<number>(55);
  const [availableSeats, setAvailableSeats] = useState<number>(15);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [status, setStatus] = useState<'ON_TIME' | 'DELAYED_10M' | 'BOARDING' | 'MAINTENANCE'>('ON_TIME');
  const [distanceKm, setDistanceKm] = useState<number>(40);
  const [estimatedDurationMins, setEstimatedDurationMins] = useState<number>(90);

  // Stops list in modal
  const [stopsList, setStopsList] = useState<RouteStop[]>([]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<CampusRoute[]>('/routes');
      setRoutes(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch campus transit routes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const openCreateModal = () => {
    setEditingRouteId(null);
    setRouteNumber(`Route ${routes.length + 101}`);
    setRouteName('');
    setOrigin('');
    setDestination('Sri Sairam College Campus Gate 1');
    setVehicleType('BUS');
    setVehicleName('Ashok Leyland Viking College Bus');
    setRegistrationNo('');
    setAcAvailable(false);
    setTotalSeats(55);
    setAvailableSeats(15);
    setDriverName('');
    setDriverPhone('+91 ');
    setStatus('ON_TIME');
    setDistanceKm(40);
    setEstimatedDurationMins(90);
    setStopsList([
      { id: 'new-1', name: 'Starting Hub', timeMorning: '06:45 AM', timeEvening: '06:30 PM', latitude: 12.9716, longitude: 77.5946 },
      { id: 'new-2', name: 'Intermediate Hub', timeMorning: '07:30 AM', timeEvening: '05:45 PM', latitude: 12.8399, longitude: 77.6770 },
      { id: 'new-3', name: 'Sri Sairam College Campus Gate 1', timeMorning: '08:25 AM', timeEvening: '04:45 PM', latitude: 12.7105, longitude: 77.6974, isCollege: true },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (route: CampusRoute) => {
    setEditingRouteId(route.id);
    setRouteNumber(route.routeNumber);
    setRouteName(route.routeName);
    setOrigin(route.origin);
    setDestination(route.destination);
    setVehicleType(route.vehicleType);
    setVehicleName(route.vehicleName || '');
    setRegistrationNo(route.registrationNo || '');
    setAcAvailable(route.acAvailable);
    setTotalSeats(route.totalSeats);
    setAvailableSeats(route.availableSeats);
    setDriverName(route.driverName || '');
    setDriverPhone(route.driverPhone || '');
    setStatus(route.status);
    setDistanceKm(route.distanceKm);
    setEstimatedDurationMins(route.estimatedDurationMins);
    setStopsList(route.stops ? [...route.stops] : []);
    setIsModalOpen(true);
  };

  const handleAddStop = () => {
    setStopsList((prev) => [
      ...prev,
      {
        id: `stop-${Date.now()}`,
        name: 'New Stoppage Hub',
        timeMorning: '07:45 AM',
        timeEvening: '05:30 PM',
        latitude: 12.7937,
        longitude: 77.7027,
      },
    ]);
  };

  const handleUpdateStop = (index: number, key: keyof RouteStop, value: any) => {
    setStopsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleRemoveStop = (index: number) => {
    setStopsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeNumber.trim() || !routeName.trim() || !origin.trim()) {
      alert('Route Number, Corridor Name, and Origin are required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        routeNumber: routeNumber.trim(),
        routeName: routeName.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        vehicleType,
        vehicleName: vehicleName.trim() || null,
        registrationNo: registrationNo.trim() || null,
        acAvailable,
        totalSeats: Number(totalSeats) || 55,
        availableSeats: Number(availableSeats) || 15,
        driverName: driverName.trim() || null,
        driverPhone: driverPhone.trim() || null,
        status,
        distanceKm: Number(distanceKm) || 40,
        estimatedDurationMins: Number(estimatedDurationMins) || 90,
        stops: stopsList.map((s, idx) => ({
          name: s.name.trim(),
          timeMorning: s.timeMorning,
          timeEvening: s.timeEvening,
          latitude: Number(s.latitude) || 12.7105,
          longitude: Number(s.longitude) || 77.6974,
          stopOrder: idx,
          isCollege: Boolean(s.isCollege),
        })),
      };

      if (editingRouteId) {
        await apiRequest(`/routes/${editingRouteId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Route "${routeNumber}" updated successfully.`);
      } else {
        await apiRequest('/routes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`New route "${routeNumber}" added successfully.`);
      }

      setIsModalOpen(false);
      loadRoutes();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save campus route.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoute = async (route: CampusRoute) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${route.routeNumber} - ${route.routeName}"?`)) {
      return;
    }

    try {
      await apiRequest(`/routes/${route.id}`, { method: 'DELETE' });
      setSuccessMsg(`Route "${route.routeNumber}" deleted successfully.`);
      loadRoutes();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete route.');
    }
  };

  const handleQuickStatusChange = async (routeId: string, newStatus: string) => {
    try {
      await apiRequest(`/routes/${routeId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setRoutes((prev) =>
        prev.map((r) => (r.id === routeId ? { ...r, status: newStatus as any } : r))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update route status.');
    }
  };

  // Filter routes
  const filteredRoutes = routes.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.routeNumber.toLowerCase().includes(q) ||
      r.routeName.toLowerCase().includes(q) ||
      r.origin.toLowerCase().includes(q) ||
      r.driverName?.toLowerCase().includes(q) ||
      r.stops?.some((s) => s.name.toLowerCase().includes(q));

    const matchType = typeFilter === 'ALL' || r.vehicleType === typeFilter;
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;

    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-amber-400 uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Campus Transit Logistics</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Bus Routes &amp; Stoppage Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure institutional commuter corridors, stoppage schedules, assigned drivers, and live delay statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bus Route</span>
        </button>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by route number, corridor name, stoppage, or driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3.5 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Vehicle Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {(['ALL', 'BUS', 'VAN', 'CAR'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  typeFilter === t
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="ON_TIME">On Time</option>
            <option value="DELAYED_10M">Delayed (10m+)</option>
            <option value="BOARDING">Boarding</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Routes Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-medium">
          Loading institutional routes...
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <Compass className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">No bus routes match your search filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRoutes.map((route) => {
            const isExpanded = expandedRouteId === route.id;

            return (
              <div
                key={route.id}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition overflow-hidden"
              >
                {/* Main Route Card Header */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black text-xs">
                        {route.routeNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                        {route.vehicleType}
                      </span>
                      {route.acAvailable && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                          AC Deluxe
                        </span>
                      )}
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {route.stops?.length || 0} Designated Stoppages
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {route.routeName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        <span>Origin: {route.origin}</span>
                      </span>
                      <span>➔</span>
                      <span>Distance: {route.distanceKm} KM ({route.estimatedDurationMins} Mins)</span>
                    </div>
                  </div>

                  {/* Driver & Status & Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Driver Card */}
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[11px]">
                        {route.driverName ? route.driverName[0] : 'D'}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Assigned Driver:
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {route.driverName || 'Unassigned'}
                        </span>
                        {route.driverPhone && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500">{route.driverPhone}</span>
                            <a
                              href={`https://wa.me/${route.driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Sri Sairam College Central Transport Notice for ${route.routeNumber}: Good day Driver ${route.driverName}.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold flex items-center gap-0.5"
                              title="Chat with driver on WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Live Status Dropdown */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Transit Status:
                      </span>
                      <select
                        value={route.status}
                        onChange={(e) => handleQuickStatusChange(route.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          route.status === 'ON_TIME'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            : route.status === 'DELAYED_10M'
                            ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                            : route.status === 'BOARDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <option value="ON_TIME">✓ On Time</option>
                        <option value="DELAYED_10M">⚠ Delayed (10m+)</option>
                        <option value="BOARDING">⏳ Boarding Now</option>
                        <option value="MAINTENANCE">⚙ Maintenance</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-4 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(route)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Route & Stoppages"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoute(route)}
                        className="p-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete Route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="View Stoppages Timeline"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stoppages Timeline Drawer */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Stoppage Schedule &amp; Turn-by-Turn Timings ({route.stops?.length || 0} stops):
                      </h4>
                      <button
                        type="button"
                        onClick={() => openEditModal(route)}
                        className="text-xs text-blue-600 dark:text-amber-400 font-bold hover:underline"
                      >
                        Modify Stoppages
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {route.stops?.map((stop, sIdx) => (
                        <div
                          key={stop.id || sIdx}
                          className={`p-3 rounded-2xl border text-xs space-y-1 ${
                            stop.isCollege
                              ? 'border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                            <span>Stop #{sIdx + 1}</span>
                            {stop.isCollege && <span className="text-amber-600 dark:text-amber-400 font-bold">College Bay</span>}
                          </div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">
                            {stop.name}
                          </p>
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-300">
                            <span>🌅 {stop.timeMorning}</span>
                            <span>🌇 {stop.timeEvening}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT ROUTE MODAL */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-amber-400 uppercase tracking-wider block">
                  {editingRouteId ? 'Update Existing Corridor' : 'Register New Bus Corridor'}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {editingRouteId ? `Edit ${routeNumber}` : 'New Campus Route'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-6">
              {/* Basic Route Logistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Route Code / Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeNumber}
                    onChange={(e) => setRouteNumber(e.target.value)}
                    placeholder="e.g. Route 107"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Corridor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="e.g. Yelahanka & Hebbal Express"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Origin Terminal Hub *
                  </label>
                  <input
                    type="text"
                    required
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="e.g. Yelahanka NES Bus Stand"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Destination Terminal
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium outline-hidden"
                  >
                    <option value="BUS">College Bus (Heavy Vehicle)</option>
                    <option value="VAN">Staff Van / Force Traveller</option>
                    <option value="CAR">Official Staff Car</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Vehicle Make &amp; Reg No
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Ashok Leyland"
                      value={vehicleName}
                      onChange={(e) => setVehicleName(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs outline-hidden"
                    />
                    <input
                      type="text"
                      placeholder="KA-51-E-1234"
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Assigned Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Driver Mobile Number (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Distance (KM)
                    </label>
                    <input
                      type="number"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Duration (Mins)
                    </label>
                    <input
                      type="number"
                      value={estimatedDurationMins}
                      onChange={(e) => setEstimatedDurationMins(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Total Seats
                    </label>
                    <input
                      type="number"
                      value={totalSeats}
                      onChange={(e) => setTotalSeats(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Available Seats
                    </label>
                    <input
                      type="number"
                      value={availableSeats}
                      onChange={(e) => setAvailableSeats(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Stoppages Builder */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Route Stoppages &amp; Pick-up Timings ({stopsList.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stoppage</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {stopsList.map((stop, index) => (
                    <div
                      key={stop.id || index}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs"
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {index + 1}
                      </span>

                      <input
                        type="text"
                        placeholder="Stop Name (e.g. Silk Board Junction)"
                        value={stop.name}
                        onChange={(e) => handleUpdateStop(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-hidden"
                      />

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Morning (07:15 AM)"
                          value={stop.timeMorning}
                          onChange={(e) => handleUpdateStop(index, 'timeMorning', e.target.value)}
                          className="w-28 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono outline-hidden"
                        />
                        <input
                          type="text"
                          placeholder="Evening (05:45 PM)"
                          value={stop.timeEvening}
                          onChange={(e) => handleUpdateStop(index, 'timeEvening', e.target.value)}
                          className="w-28 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(index)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving Route...' : editingRouteId ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoutesPage;
