import React from 'react';
import { AvailabilityDayInfo } from '../types';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Calendar,
  Clock,
  Building2,
  User,
  Phone,
  Mail,
  Info,
  CheckCircle2,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AddToCalendarButton } from './AddToCalendarButton';

interface DateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  items: AvailabilityDayInfo[];
  selectedHallName?: string;
}

export const DateDetailModal: React.FC<DateDetailModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  items,
  selectedHallName,
}) => {
  if (!isOpen) return null;

  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const isPastDate = dateStr < todayStr;

  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>Facility Date Schedule</span>
              {isPastDate && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Past Date
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {formattedDate}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {items.map((item) => (
            <div
              key={item.hallId}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {item.hallName}
                  </h4>
                </div>
                <StatusBadge status={item.status} size="md" />
              </div>

              {/* Status details */}
              {item.status === 'AVAILABLE' && (
                !isPastDate ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs text-emerald-800 dark:text-emerald-300">
                      <p className="font-semibold text-sm">Hall is Completely Free</p>
                      <p className="mt-0.5">Ready for reservations on this date.</p>
                    </div>
                    <Link
                      to={`/book?hall=${encodeURIComponent(item.hallName)}&date=${dateStr}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition shrink-0"
                    >
                      <span>Request Booking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Hall Was Available</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">No event was scheduled on this date.</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold shrink-0">
                      <Ban className="w-3.5 h-3.5 text-slate-500" />
                      <span>Booking Closed</span>
                    </span>
                  </div>
                )
              )}

              {/* Free Slots Available (Partial day opening) */}
              {item.freeSlots && item.freeSlots.length > 0 && item.status !== 'AVAILABLE' && (
                !isPastDate ? (
                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                        🟢 Free Slots Open for Booking
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Partial Day Available
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {item.freeSlots.map((slot) => {
                        const slotLabel =
                          slot === 'MORNING'
                            ? 'Morning (09:00 - 13:00)'
                            : slot === 'AFTERNOON'
                            ? 'Afternoon (13:00 - 17:00)'
                            : slot;
                        return (
                          <Link
                            key={slot}
                            to={`/book?hall=${encodeURIComponent(item.hallName)}&date=${dateStr}&slot=${slot}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                          >
                            <span>Book {slotLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        );
                      })}
                    </div>
                    {item.freeWindows && item.freeWindows.length > 0 && (
                      <div className="pt-1 text-[11px] text-emerald-800 dark:text-emerald-300">
                        <span className="font-semibold">Remaining Free Windows: </span>
                        {item.freeWindows.map((w) => `${w.start} - ${w.end}`).join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Unreserved Slots on this Day
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Past Date (Closed)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Unreserved slots: {item.freeSlots.map((s) => s.replace('_', ' ')).join(', ')}
                    </p>
                  </div>
                )
              )}

              {/* Multi-slot day schedule */}
              {item.events && item.events.length > 1 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Daily Schedule ({item.events.length} Slots)</span>
                    <span className="text-[10px] lowercase text-slate-400">Multiple sessions</span>
                  </div>
                  <div className="space-y-2">
                    {item.events.map((evt, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          evt.status === 'APPROVED'
                            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{evt.eventName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              evt.status === 'APPROVED' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                            }`}
                          >
                            {evt.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 text-[11px] text-slate-600 dark:text-slate-300">
                          <span>⏱ {evt.startTime} - {evt.endTime}</span>
                          <span>🏛 {evt.department}</span>
                          <span className="font-mono">{evt.bookingId}</span>
                        </div>
                        {evt.purpose && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Purpose: {evt.purpose}
                          </p>
                        )}
                        {evt.status === 'APPROVED' && (
                          <div className="flex justify-end pt-1">
                            <AddToCalendarButton
                              eventPayload={{
                                eventName: evt.eventName,
                                hallName: item.hallName,
                                bookingDate: dateStr,
                                startTime: evt.startTime,
                                endTime: evt.endTime,
                                bookingId: evt.bookingId,
                                departmentName: evt.department,
                                purpose: evt.purpose,
                              }}
                              size="xs"
                              variant="compact"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!item.events || item.events.length <= 1) && item.status === 'BOOKED' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Event Name</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.eventName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Time Slot</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.startTime} - {item.endTime} ({item.bookingType?.replace('_', ' ') || 'Full Day'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Department / Host</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.department || 'Academic Department'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Booking ID</span>
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {item.bookingId}
                      </span>
                    </div>
                  </div>
                  {item.purpose && (
                    <div className="px-1 text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Purpose: </span>
                      {item.purpose}
                    </div>
                  )}
                  <div className="flex justify-end pt-1">
                    <AddToCalendarButton
                      eventPayload={{
                        eventName: item.eventName || 'Approved Event',
                        hallName: item.hallName,
                        bookingDate: dateStr,
                        startTime: item.startTime || '09:00',
                        endTime: item.endTime || '17:00',
                        bookingId: item.bookingId,
                        departmentName: item.department,
                        purpose: item.purpose,
                      }}
                      size="xs"
                      variant="compact"
                    />
                  </div>
                </div>
              )}

              {(!item.events || item.events.length <= 1) && item.status === 'PENDING' && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-semibold">Booking Request Under Review</p>
                  <p>
                    {item.eventName} ({item.department || 'Department'}) • {item.startTime} - {item.endTime}
                  </p>
                  <p className="text-[11px] opacity-80">
                    Booking ID: {item.bookingId} • Awaiting administrator approval.
                  </p>
                </div>
              )}

              {(item.status === 'BLOCKED' || item.status === 'MAINTENANCE' || item.status === 'HOLIDAY') && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold">
                    <Ban className="w-4 h-4 text-slate-500" />
                    <span>Unavailable: {item.reason || item.status}</span>
                  </div>
                  {item.details?.description && (
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.details.description}
                    </p>
                  )}
                  {item.details?.notes && (
                    <p className="text-slate-500 dark:text-slate-400">Notes: {item.details.notes}</p>
                  )}
                  {item.details?.responsiblePerson && (
                    <p className="text-slate-500 dark:text-slate-400">
                      In-charge: {item.details.responsiblePerson}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium text-xs transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
