import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { DateDetailModal } from '../components/DateDetailModal';
import { AvailabilityDayInfo } from '../types';
import { Calendar, Filter, Sparkles } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedHallId, setSelectedHallId] = useState<string>('ALL');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Campus Schedule</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Master Facility Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive calendar view showing confirmed events, pending reviews, institutional holidays, and maintenance blocks.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSelectedHallId('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedHallId === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Facilities
          </button>
          {halls.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHallId(h.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedHallId === h.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>

      <AvailabilityCalendar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        availabilityData={availabilityData}
        halls={halls}
        selectedHallId={selectedHallId}
        onDateClick={handleDateClick}
        viewMode="month"
      />

      <DateDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dateStr={modalDate}
        items={modalItems}
      />
    </div>
  );
};
