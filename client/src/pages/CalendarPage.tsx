import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { DateDetailModal } from '../components/DateDetailModal';
import { AvailabilityDayInfo, Vehicle } from '../types';
import {
  Calendar as CalendarIcon,
  Car,
  Bus,
  Layers,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVehicleParam = searchParams.get('vehicle') || 'ALL';

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleParam);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availabilityData, setAvailabilityData] = useState<Record<string, Record<string, AvailabilityDayInfo>>>({});
  const [loading, setLoading] = useState(true);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<'ALL' | 'BUS' | 'VAN' | 'CAR'>('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalItems, setModalItems] = useState<AvailabilityDayInfo[]>([]);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [currentDate, selectedVehicleId]);

  const loadVehicles = async () => {
    try {
      const data = await apiRequest<Vehicle[]>('/vehicles');
      setVehicles(data);
      if (initialVehicleParam !== 'ALL') {
        const found = data.find(
          (v) => v.id === initialVehicleParam || v.name.toLowerCase().includes(initialVehicleParam.toLowerCase())
        );
        if (found) setSelectedVehicleId(found.id);
      }
    } catch (err) {
      console.error('Failed to load fleet:', err);
    }
  };

  const formatLocalDate = (year: number, month: number, day: number): string => {
    const d = new Date(year, month, day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = formatLocalDate(year, month - 1, 1);
      const endDate = formatLocalDate(year, month + 2, 0);

      const queryVehicle = selectedVehicleId === 'ALL' ? '' : `&vehicleId=${selectedVehicleId}`;
      const res = await apiRequest<{ availability: Record<string, Record<string, AvailabilityDayInfo>> }>(
        `/availability?startDate=${startDate}&endDate=${endDate}${queryVehicle}`
      );
      setAvailabilityData(res.availability || {});
    } catch (err) {
      console.error('Failed to load availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (dateStr: string, items: AvailabilityDayInfo[]) => {
    setModalDate(dateStr);
    setModalItems(items);
    setModalOpen(true);
  };

  const handleVehicleChange = (id: string) => {
    setSelectedVehicleId(id);
    if (id === 'ALL') {
      searchParams.delete('vehicle');
    } else {
      searchParams.set('vehicle', id);
    }
    setSearchParams(searchParams);
  };

  // Filtered vehicles for calendar display
  const displayedVehicles = vehicles.filter((v) => {
    if (vehicleTypeFilter === 'ALL') return true;
    return v.vehicleType === vehicleTypeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Academic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>Master Transport Schedule</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Fleet Schedule &amp; Availability Calendar
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl">
            Unified schedule for Sri Sairam College of Engineering buses, staff cars, and vans. Inspect confirmed bookings, pending reviews, and reserve official vehicles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-white font-bold text-xs shadow-md transition"
          >
            <Car className="w-4 h-4" />
            <span>Reserve Vehicle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter Toolbar: Category & Vehicle Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Category:
          </span>
          <button
            type="button"
            onClick={() => setVehicleTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              vehicleTypeFilter === 'ALL'
                ? 'bg-blue-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Categories
          </button>
          <button
            type="button"
            onClick={() => setVehicleTypeFilter('BUS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              vehicleTypeFilter === 'BUS'
                ? 'bg-blue-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Bus className="w-3 h-3" />
            <span>College Buses (55-Seater)</span>
          </button>
          <button
            type="button"
            onClick={() => setVehicleTypeFilter('CAR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              vehicleTypeFilter === 'CAR'
                ? 'bg-blue-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Car className="w-3 h-3" />
            <span>Staff Cars</span>
          </button>
          <button
            type="button"
            onClick={() => setVehicleTypeFilter('VAN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              vehicleTypeFilter === 'VAN'
                ? 'bg-blue-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Academic Vans</span>
          </button>
        </div>

        {/* Specific Fleet Unit Selector */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Focus Vehicle:
          </span>
          <select
            value={selectedVehicleId}
            onChange={(e) => handleVehicleChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Entire Campus Fleet (All 6 Units)</option>
            {displayedVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.registrationNo}) - {v.capacity} Seats
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Interactive Calendar */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <AvailabilityCalendar
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          availabilityData={availabilityData}
          halls={vehicles.map((v) => ({ id: v.id, name: `${v.name} (${v.registrationNo})` }))}
          selectedHallId={selectedVehicleId}
          onDateClick={handleDateClick}
          viewMode="month"
        />
      </div>

      {/* Date Detail Modal */}
      <DateDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dateStr={modalDate}
        items={modalItems}
      />
    </div>
  );
};

export default CalendarPage;
