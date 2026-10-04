import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Booking } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Calendar,
  Clock,
  Building2,
  FileText,
  Printer,
  XCircle,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadMyBookings();
  }, []);

  const loadMyBookings = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Booking[]>('/bookings/my-bookings');
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking request? The date will become available again.')) {
      return;
    }

    try {
      await apiRequest(`/bookings/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Cancelled by user' }),
      });
      loadMyBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            My Facility Bookings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your submitted requests, approval updates, and download official confirmation slips.
          </p>
        </div>
        <Link
          to="/book"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation Request</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Loading your reservations...</div>
      ) : bookings.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">No bookings found</h3>
            <p className="text-xs text-slate-500 mt-1">
              You haven't requested any reservations for Seminar Hall or AV Hall yet.
            </p>
          </div>
          <Link
            to="/book"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-md"
          >
            Create Your First Booking
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Booking ID</th>
                    <th className="py-3.5 px-4">Facility</th>
                    <th className="py-3.5 px-4">Event & Department</th>
                    <th className="py-3.5 px-4">Reserved Date</th>
                    <th className="py-3.5 px-4">Time Slot</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {b.bookingId}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {b.hall?.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {b.eventName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {b.department?.name || 'Academic Dept'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {b.bookingDate}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {b.startTime} - {b.endTime}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-[11px] transition"
                        >
                          View Details
                        </button>
                        {['PENDING', 'APPROVED'].includes(b.status) && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 font-medium text-[11px] transition"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details & Voucher Printable Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Reservation Voucher
                </span>
                <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  {selectedBooking.bookingId}
                </h3>
              </div>
              <StatusBadge status={selectedBooking.status} size="md" />
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reserved Hall:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedBooking.hall?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedBooking.bookingDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Slot:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedBooking.startTime} - {selectedBooking.endTime} (
                    {selectedBooking.bookingType.replace('_', ' ')})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Event Title:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBooking.eventName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBooking.department?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coordinator:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBooking.coordinatorName} ({selectedBooking.contactNumber})
                  </span>
                </div>
              </div>

              {selectedBooking.adminNotes && (
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs">
                  <strong>Administrator Note:</strong> {selectedBooking.adminNotes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
