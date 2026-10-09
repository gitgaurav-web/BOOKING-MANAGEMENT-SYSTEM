import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { AvailabilityDayInfo } from '../types';

interface AvailabilityCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  availabilityData: Record<string, Record<string, AvailabilityDayInfo>>;
  halls: { id: string; name: string }[];
  selectedHallId: string; // 'ALL' or specific hall ID
  onDateClick: (dateStr: string, items: AvailabilityDayInfo[]) => void;
  viewMode?: 'month' | 'week' | 'list';
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  currentDate,
  onDateChange,
  availabilityData,
  halls: _halls,
  selectedHallId,
  onDateClick,
  viewMode: initialViewMode = 'month',
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>(initialViewMode);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // For week view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  const daysToRender =
    viewMode === 'week'
      ? eachDayOfInterval({ start: weekStart, end: weekEnd })
      : eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrev = () => {
    if (viewMode === 'week') {
      onDateChange(subWeeks(currentDate, 1));
    } else {
      onDateChange(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      onDateChange(addWeeks(currentDate, 1));
    } else {
      onDateChange(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Determine overall status of a day based on active hall filter
  const getDayItems = (dateStr: string): AvailabilityDayInfo[] => {
    const dayData = availabilityData[dateStr] || {};
    if (selectedHallId === 'ALL') {
      return Object.values(dayData);
    }
    const single = dayData[selectedHallId];
    return single ? [single] : [];
  };

  // Aggregated status for colored cell
  const getAggregateDayStatus = (items: AvailabilityDayInfo[]): string => {
    if (items.length === 0) return 'AVAILABLE';
    // If any is maintenance -> show maintenance
    if (items.some((i) => i.status === 'MAINTENANCE')) return 'MAINTENANCE';
    // If any is blocked -> show blocked
    if (items.some((i) => i.status === 'BLOCKED')) return 'BLOCKED';
    // If any holiday -> HOLIDAY
    if (items.some((i) => i.status === 'HOLIDAY')) return 'HOLIDAY';
    // If ALL are booked -> BOOKED
    if (items.every((i) => i.status === 'BOOKED')) return 'BOOKED';
    // If any is explicitly partial -> PARTIAL
    if (items.some((i) => i.status === 'PARTIAL')) return 'PARTIAL';
    // If some booked, some available -> PARTIAL
    if (items.some((i) => i.status === 'BOOKED')) return 'PARTIAL';
    // If any pending -> PENDING
    if (items.some((i) => i.status === 'PENDING')) return 'PENDING';
    // Otherwise available
    return 'AVAILABLE';
  };

  const getStatusColorClasses = (
    status: string,
    isCurrentMonth: boolean,
    isSelected: boolean,
    isPast: boolean = false
  ) => {
    if (isSelected) {
      return 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-md';
    }

    if (!isCurrentMonth && viewMode === 'month') {
      return 'opacity-35 bg-slate-50/50 dark:bg-slate-900/30 border-dashed';
    }

    const pastMuted = isPast ? 'opacity-80 hover:opacity-100 transition-opacity ' : '';

    switch (status) {
      case 'AVAILABLE':
        return pastMuted + 'bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100';
      case 'PARTIAL':
        return pastMuted + 'bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-100';
      case 'BOOKED':
        return pastMuted + 'bg-rose-50/80 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-100';
      case 'PENDING':
        return pastMuted + 'bg-sky-50/80 hover:bg-sky-100/90 dark:bg-sky-950/30 dark:hover:bg-sky-950/50 border-sky-200 dark:border-sky-800/60 text-sky-950 dark:text-sky-100';
      case 'BLOCKED':
      case 'MAINTENANCE':
        return pastMuted + 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200';
      case 'HOLIDAY':
        return pastMuted + 'bg-indigo-50/80 hover:bg-indigo-100/90 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-100';
      default:
        return 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Calendar Top Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs p-1">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
              title="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/10 flex flex-wrap items-center gap-4 text-xs font-medium">
        <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
          Legend:
        </span>
        <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" /> Partial (Slot Open)
        </span>
        <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" /> Booked
        </span>
        <span className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs" /> Pending
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shadow-xs" /> Blocked / Maintenance
        </span>
      </div>

      {/* Calendar Grid or List */}
      {viewMode === 'list' ? (
        <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
          {daysToRender.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const items = getDayItems(dateStr);
            const status = getAggregateDayStatus(items);

            return (
              <div
                key={dateStr}
                onClick={() => {
                  setSelectedDateStr(dateStr);
                  onDateClick(dateStr, items);
                }}
                className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center w-12">
                    <span className="text-xs uppercase text-slate-400 font-bold block">
                      {format(day, 'EEE')}
                    </span>
                    <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200">
                      {format(day, 'dd')}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {format(day, 'MMMM d, yyyy')}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {items.map((it) => (
                        <span key={it.hallId} className="text-xs text-slate-500">
                          {it.hallName}: <span className="font-medium">{it.status}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {dateStr < format(new Date(), 'yyyy-MM-dd') && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                      Closed
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : status === 'BOOKED'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 sm:p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month / Week Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {daysToRender.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const items = getDayItems(dateStr);
              const aggregateStatus = getAggregateDayStatus(items);
              const isCurrMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDateStr === dateStr;
              const isCurrent = isToday(day);
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              const isPast = dateStr < todayStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setSelectedDateStr(dateStr);
                    onDateClick(dateStr, items);
                  }}
                  className={`min-h-[75px] sm:min-h-[96px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${getStatusColorClasses(
                    aggregateStatus,
                    isCurrMonth,
                    isSelected,
                    isPast
                  )}`}
                >
                  {/* Top row: day number & today dot */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isPast
                          ? 'text-slate-400 dark:text-slate-500 font-medium'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {isPast && (
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight hidden sm:inline">
                        Past
                      </span>
                    )}

                    {/* Quick status pill for mobile / compact */}
                    <span className="sm:hidden w-2 h-2 rounded-full shrink-0" />
                  </div>

                  {/* Desktop detailed chips */}
                  <div className="mt-1 space-y-1 overflow-hidden hidden sm:block">
                    {items.map((it) => (
                      <div
                        key={it.hallId}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate flex items-center justify-between ${
                          it.status === 'AVAILABLE'
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                            : it.status === 'PARTIAL'
                            ? 'bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-300/50'
                            : it.status === 'BOOKED'
                            ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
                            : it.status === 'PENDING'
                            ? 'bg-sky-500/20 text-sky-800 dark:text-sky-300'
                            : 'bg-slate-500/20 text-slate-800 dark:text-slate-300'
                        }`}
                        title={`${it.hallName}: ${it.status}${it.freeSlots?.length ? ` (Free: ${it.freeSlots.join(', ')})` : ''}`}
                      >
                        <span className="truncate">
                          {selectedHallId === 'ALL'
                            ? `${it.hallName.split(' ')[0]}: ${it.status === 'PARTIAL' ? (it.freeSlots?.includes('AFTERNOON') ? 'Aft Free' : 'Morn Free') : it.status}`
                            : (it.status === 'PARTIAL' ? (it.freeSlots?.includes('AFTERNOON') ? 'Afternoon Open' : 'Morning Open') : it.status)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Mobile indicator text */}
                  <div className="sm:hidden mt-auto">
                    <span className="text-[9px] font-bold block truncate uppercase tracking-tighter">
                      {aggregateStatus.substring(0, 4)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
