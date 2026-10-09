import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { DateDetailModal } from '../components/DateDetailModal';
import { AvailabilityDayInfo } from '../types';
import { Building2, Calendar as CalendarIcon, Filter, Layers, Info } from 'lucide-react';

export const AvailabilityPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialHallParam = searchParams.get('hall') || 'ALL';

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedHallId, setSelectedHallId] = useState<string>(initialHallParam);
  const [halls, setHalls] = useState<{ id: string; name: string }[]>([]);
  const [availabilityData, setAvailabilityData] = useState<Record<string, Record<string, AvailabilityDayInfo>>>({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalItems, setModalItems] = useState<AvailabilityDayInfo[]>([]);

  useEffect(() => {
    loadHalls();
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [currentDate, selectedHallId]);

  const loadHalls = async () => {
    try {
      const data = await apiRequest('/halls');
      setHalls(data.map((h: any) => ({ id: h.id, name: h.name })));
      // If param matches name or id, set it
      if (initialHallParam !== 'ALL') {
        const found = data.find((h: any) => h.id === initialHallParam || h.name.toLowerCase() === initialHallParam.toLowerCase());
        if (found) setSelectedHallId(found.id);
      }
    } catch (err) {
      console.error(err);
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
      // Fetch 2 months window around currentDate in local calendar dates
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = formatLocalDate(year, month - 1, 1);
      const endDate = formatLocalDate(year, month + 2, 0);

      const queryHall = selectedHallId === 'ALL' ? '' : `&hallId=${selectedHallId}`;
      const res = await apiRequest(`/availability?startDate=${startDate}&endDate=${endDate}${queryHall}`);
      setAvailabilityData(res.availability || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (dateStr: string, items: AvailabilityDayInfo[]) => {
    setModalDate(dateStr);
    setModalItems(items);
    setModalOpen(true);
  };

  const handleHallChange = (id: string) => {
    setSelectedHallId(id);
    if (id === 'ALL') {
      searchParams.delete('hall');
    } else {
      searchParams.set('hall', id);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Facility Availability Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Hall Availability
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Date-wise schedule for Seminar Hall and AV Hall. Click any date to view event details or request reservation.
          </p>
        </div>

        {/* Hall Selector Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
          <button
            onClick={() => handleHallChange('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedHallId === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Halls
          </button>
          {halls.map((h) => (
            <button
              key={h.id}
              onClick={() => handleHallChange(h.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedHallId === h.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick notice callout */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Whole Hall Reservation:</strong> When a hall is marked{' '}
          <span className="font-bold text-rose-600">BOOKED</span> or{' '}
          <span className="font-bold text-slate-700 dark:text-slate-300">BLOCKED</span>, the entire hall is reserved for that date. Dates marked{' '}
          <span className="font-bold text-emerald-600">AVAILABLE</span> (today or future) can be reserved by clicking on the date card. Past dates are displayed for historical records only.
        </p>
      </div>

      {/* Main Calendar View */}
      <AvailabilityCalendar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        availabilityData={availabilityData}
        halls={halls}
        selectedHallId={selectedHallId}
        onDateClick={handleDateClick}
        viewMode="month"
      />

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
