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
              )}

              {item.status === 'BOOKED' && (
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
                </div>
              )}

              {item.status === 'PENDING' && (
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
