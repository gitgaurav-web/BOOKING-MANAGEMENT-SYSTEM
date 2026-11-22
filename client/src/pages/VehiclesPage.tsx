import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Vehicle } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Car,
  Bus,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Fuel,
  Shield,
  Gauge,
  Phone,
  MessageSquare,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  AlertCircle,
  Wind,
  X,
  ExternalLink,
  Clock,
  Building2,
  Navigation,
  Check,
} from 'lucide-react';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [capacityFilter, setCapacityFilter] = useState<string>('ALL');
  const [acOnly, setAcOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [selectedVehicleForSchedule, setSelectedVehicleForSchedule] = useState<Vehicle | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Vehicle[]>('/vehicles');
      setVehicles(data);
    } catch (err) {
      console.error('Error loading fleet vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageFallback = (type: string) => {
    switch (type) {
      case 'AMBULANCE':
        return 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1200&q=80';
      case 'BUS':
        return 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80';
      case 'VAN':
        return 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80';
      case 'CAR':
      default:
        return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';
    }
  };

  const getDriverWhatsAppUrl = (v: Vehicle) => {
    if (!v.driverPhone) return '#';
    const cleanPhone = v.driverPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `🚌 *SRI SAIRAM COLLEGE TRANSPORT DESK*\nHello Driver ${v.driverName || 'Sir'},\nRegarding campus vehicle *${v.name}* (${v.registrationNo}). Inquiring about trip readiness & duty schedule.`
    );
    return `https://wa.me/${phoneWithCountry}?text=${text}`;
  };

  // Filter logic
  const filtered = vehicles.filter((v) => {
    // 1. Type
    if (filterType !== 'ALL' && v.vehicleType !== filterType) return false;

    // 2. Capacity
    if (capacityFilter === '1-7' && v.capacity > 7) return false;
    if (capacityFilter === '8-20' && (v.capacity < 8 || v.capacity > 20)) return false;
    if (capacityFilter === '21+' && v.capacity <= 20) return false;

    // 3. AC
    if (acOnly && !v.acAvailable) return false;

    // 4. Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const inName = v.name?.toLowerCase().includes(q);
      const inReg = v.registrationNo?.toLowerCase().includes(q);
      const inCode = v.code?.toLowerCase().includes(q);
      const inDriver = v.driverName?.toLowerCase().includes(q);
      const inFeatures = v.features?.some((f) => f.toLowerCase().includes(q));
      if (!inName && !inReg && !inCode && !inDriver && !inFeatures) return false;
    }

    return true;
  });

  // KPI Calculations
  const totalFleetCount = vehicles.length;
  const availableCount = vehicles.filter((v) => (v.todayStatus || 'AVAILABLE') === 'AVAILABLE').length;
  const totalSeats = vehicles.reduce((acc, v) => acc + (v.capacity || 0), 0);
  const acCount = vehicles.filter((v) => v.acAvailable).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 1. Header & Institutional Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-amber-400 uppercase tracking-wider">
            <Car className="w-3.5 h-3.5" />
            <span>Sri Sairam College of Engineering • Campus Fleet Operations</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight">
            Institutional Vehicles &amp; Fleet Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Live directory of university buses, VIP staff sedans, department vans, and 24x7 emergency medical transport. Check live shift availability, passenger capacities, and assigned campus drivers.
          </p>
        </div>

        {/* View Switcher: Grid vs Table */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('GRID')}
              title="Card Grid View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'GRID'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              title="Enterprise Table View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'TABLE'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <Link
            to="/transit"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Track Live Map</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Fleet KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Campus Fleet</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalFleetCount}</span>
            <span className="text-xs text-slate-500">Active Units</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Available Right Now</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{availableCount}</span>
            <span className="text-xs text-emerald-600/80">Ready for Duty</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Seating Capacity</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalSeats}</span>
            <span className="text-xs text-slate-500">Passenger Seats</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Air-Conditioned Comfort</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{acCount}</span>
            <span className="text-xs text-slate-500">Climate Controlled</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Interactive Multi-Filters Bar */}
      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by bus name, plate (KA-51-E...), driver name, or amenity..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Dropdown: Capacity Filter */}
          <div className="flex items-center gap-2">
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Passenger Capacities</option>
              <option value="1-7">1 – 7 Seats (Cars / VIP)</option>
              <option value="8-20">8 – 20 Seats (Vans / Shuttles)</option>
              <option value="21+">21 – 60 Seats (Heavy Buses)</option>
            </select>

            {/* AC Only Toggle Button */}
            <button
              onClick={() => setAcOnly(!acOnly)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition ${
                acOnly
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>AC Only</span>
              {acOnly && <Check className="w-3 h-3 ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Vehicle Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Vehicle Type:</span>
          {[
            { id: 'ALL', label: 'All Fleet Units' },
            { id: 'BUS', label: 'College Buses' },
            { id: 'VAN', label: 'Department Vans' },
            { id: 'CAR', label: 'VIP Staff Cars' },
            { id: 'AMBULANCE', label: '🚑 Life Support Ambulance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === tab.id
                  ? 'bg-blue-600 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {(searchTerm || filterType !== 'ALL' || capacityFilter !== 'ALL' || acOnly) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('ALL');
                setCapacityFilter('ALL');
                setAcOnly(false);
              }}
              className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-600 underline flex items-center gap-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Fleet Content */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
            Loading Sri Sairam College fleet units...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching fleet vehicles found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, seat capacity filter, or resetting the AC filter to view available college vehicles.
          </p>
        </div>
      ) : viewMode === 'GRID' ? (
        /* ======================== MODE A: CARD GRID VIEW ======================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((vehicle) => {
            const fallbackImg = getImageFallback(vehicle.vehicleType);
            const todayStatus = vehicle.todayStatus || 'AVAILABLE';

            return (
              <div
                key={vehicle.id}
                className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-400/50 dark:hover:border-amber-400/40 transition duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Photo Container with Overlays */}
                  <div className="relative h-60 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={vehicle.image || fallbackImg}
                      alt={vehicle.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackImg;
                      }}
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                    />

                    {/* Top Left: Vehicle Code Badge */}
                    <div className="absolute top-3.5 left-3.5 bg-slate-900/85 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold border border-white/10">
                      {vehicle.code || vehicle.vehicleType}
                    </div>

                    {/* Top Right: Real-Time Availability Status Badge */}
                    <div className="absolute top-3.5 right-3.5 shadow-md">
                      <StatusBadge status={todayStatus} size="md" />
                    </div>

                    {/* Bottom Left: Indian IND Style Registration Plate */}
                    <div className="absolute bottom-3.5 left-3.5 flex items-center bg-white text-slate-900 border border-slate-300 shadow-md rounded-lg overflow-hidden text-xs font-bold">
                      <div className="bg-blue-700 text-white text-[9px] px-1.5 py-1 flex flex-col items-center justify-center font-bold">
                        <span>IND</span>
                      </div>
                      <div className="px-2.5 py-1 font-mono tracking-wider">
                        {vehicle.registrationNo}
                      </div>
                    </div>

                    {/* Bottom Right: Vehicle Type Tag */}
                    <div className="absolute bottom-3.5 right-3.5 bg-slate-900/90 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10">
                      {vehicle.vehicleType}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-amber-400 transition">
                        {vehicle.name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>{vehicle.capacity} Persons</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Fuel className="w-3.5 h-3.5 text-amber-500" />
                          <span>{vehicle.fuelType}</span>
                        </div>
                        {vehicle.acAvailable ? (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Wind className="w-3 h-3" /> AC
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">Non-AC</span>
                        )}
                      </div>
                    </div>

                    {/* Driver Information Card with 1-Click Call & WhatsApp */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Assigned Campus Driver
                        </span>
                        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                          {vehicle.location || 'Transport Bay 1'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                          {vehicle.driverName || 'Designated Fleet Driver'}
                        </span>

                        {vehicle.driverPhone ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Call Link */}
                            <a
                              href={`tel:${vehicle.driverPhone}`}
                              title={`Call ${vehicle.driverName || 'Driver'}`}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 transition border border-slate-200 dark:border-slate-600"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>

                            {/* WhatsApp Direct Chat */}
                            <a
                              href={getDriverWhatsAppUrl(vehicle)}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat with driver on WhatsApp"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-xs"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Central Desk Controlled</span>
                        )}
                      </div>
                    </div>

                    {/* Safety & Fleet Features */}
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Safety &amp; Fleet Amenities
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {vehicle.features?.map((fac, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200/50 dark:border-slate-700"
                          >
                            {fac}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons Footer */}
                <div className="p-6 pt-0 space-y-2">
                  <div className="flex items-center gap-2">
                    {/* View Schedule Modal Trigger */}
                    <button
                      onClick={() => setSelectedVehicleForSchedule(vehicle)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>7-Day Schedule</span>
                    </button>

                    {/* Track Live GPS */}
                    <Link
                      to="/transit"
                      title="View Transit Route & GPS"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition flex items-center justify-center"
                    >
                      <Navigation className="w-4 h-4 text-emerald-500" />
                    </Link>
                  </div>

                  {/* Primary Requisition Action */}
                  <Link
                    to={`/book?vehicle=${vehicle.id}`}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>Request Vehicle Requisition</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ======================== MODE B: ENTERPRISE TABLE VIEW ======================== */
        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">Fleet Unit</th>
                  <th className="py-4 px-4">Type &amp; Code</th>
                  <th className="py-4 px-4">Capacity &amp; Fuel</th>
                  <th className="py-4 px-4">Assigned Driver</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((vehicle) => {
                  const fallbackImg = getImageFallback(vehicle.vehicleType);
                  const todayStatus = vehicle.todayStatus || 'AVAILABLE';

                  return (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Vehicle Unit Name & Plate */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={vehicle.image || fallbackImg}
                            alt={vehicle.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackImg;
                            }}
                            className="w-12 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {vehicle.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {vehicle.registrationNo}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {vehicle.location || 'Main Bay'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type & Code */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {vehicle.vehicleType}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {vehicle.code || '-'}
                        </div>
                      </td>

                      {/* Capacity & Fuel */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {vehicle.capacity} Seats
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{vehicle.fuelType}</span>
                          {vehicle.acAvailable && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">• AC</span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Driver & Instant Reach */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {vehicle.driverName || 'Designated Driver'}
                        </div>
                        {vehicle.driverPhone ? (
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={`tel:${vehicle.driverPhone}`}
                              className="text-slate-500 hover:text-blue-600 font-mono text-[11px] flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-500" />
                              <span>{vehicle.driverPhone}</span>
                            </a>
                            <a
                              href={getDriverWhatsAppUrl(vehicle)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px] hover:bg-emerald-700 transition"
                            >
                              WhatsApp
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Central Control</span>
                        )}
                      </td>

                      {/* Live Today Status */}
                      <td className="py-4 px-4">
                        <StatusBadge status={todayStatus} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedVehicleForSchedule(vehicle)}
                            title="View Schedule"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          </button>

                          <Link
                            to={`/book?vehicle=${vehicle.id}`}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs"
                          >
                            <span>Book</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================== 5. 7-DAY SCHEDULE MODAL ======================== */}
      {selectedVehicleForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header Banner */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>Fleet Availability &amp; Shift Schedule</span>
                </div>
                <h2 className="text-xl font-bold mt-1 text-white">
                  {selectedVehicleForSchedule.name}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded">
                    {selectedVehicleForSchedule.registrationNo}
                  </span>
                  <span>{selectedVehicleForSchedule.capacity} Passenger Seats</span>
                  <span>Driver: {selectedVehicleForSchedule.driverName || 'Designated Driver'}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedVehicleForSchedule(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Today's Live Status Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Today's Operational Shift
                  </span>
                  <StatusBadge status={selectedVehicleForSchedule.todayStatus || 'AVAILABLE'} size="sm" />
                </div>

                {selectedVehicleForSchedule.todayBooking ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                    <div className="font-bold text-amber-900 dark:text-amber-200">
                      Reserved: {selectedVehicleForSchedule.todayBooking.eventName || 'Official Trip'}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {selectedVehicleForSchedule.todayBooking.startTime} - {selectedVehicleForSchedule.todayBooking.endTime}
                      </span>
                      <span>• Dept: {selectedVehicleForSchedule.todayBooking.department}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>This vehicle is fully available for institutional requisitions today.</span>
                  </div>
                )}
              </div>

              {/* Upcoming Scheduled Trips Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Upcoming Approved Requisitions
                </h4>

                {selectedVehicleForSchedule.upcomingBookings && selectedVehicleForSchedule.upcomingBookings.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedVehicleForSchedule.upcomingBookings.map((trip, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {trip.eventName}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-[11px]">
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              📅 {trip.bookingDate}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {trip.startTime} - {trip.endTime}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                            {trip.bookingId}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]">
                            {trip.department}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                    No conflicting requisitions booked in the upcoming calendar window. Vehicle is completely free.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <button
                onClick={() => setSelectedVehicleForSchedule(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>

              <Link
                to={`/book?vehicle=${selectedVehicleForSchedule.id}`}
                onClick={() => setSelectedVehicleForSchedule(null)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-white font-bold text-xs transition flex items-center gap-2 shadow-md"
              >
                <span>Book This Vehicle Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
