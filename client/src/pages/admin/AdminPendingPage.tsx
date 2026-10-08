import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Booking } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  AlertCircle,
  User,
  Phone,
  Mail,
} from 'lucide-react';

export const AdminPendingPage: React.FC = () => {
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectionModal, setRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Booking[]>('/bookings?status=PENDING');
      setPendingBookings(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      await apiRequest(`/bookings/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ adminNotes }),
      });
      alert('Booking successfully confirmed and marked as BOOKED on calendar.');
      setSelectedBooking(null);
      loadPending();
    } catch (err: any) {
      alert(err.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      await apiRequest(`/bookings/${selectedBooking.id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason, adminNotes }),
      });
      alert('Booking request rejected.');
      setRejectionModal(false);
      setSelectedBooking(null);
      setRejectionReason('');
      loadPending();
    } catch (err: any) {
      alert(err.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Pending Reservation Requests
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review, approve, or reject whole-hall booking requests submitted by faculty and coordinators.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Loading pending requests...</div>
      ) : pendingBookings.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <Clock className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No Pending Requests</h3>
          <p className="text-xs text-slate-500">
            All submitted reservation requests have been processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingBookings.map((b) => (
            <div
              key={b.id}
              className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {b.bookingId}
                  </span>
                  <StatusBadge status={b.status} size="sm" />
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {b.eventName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {b.hall?.name}
                    </span>
                    <span>•</span>
                    <span>{b.department?.name || 'Department'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Requested Date(s)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {b.bookingDate}
                      {b.endDate && b.endDate !== b.bookingDate && (
                        <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                          to {b.endDate} (Multi-Day)
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Duration / Slot</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {b.startTime} - {b.endTime} ({b.bookingType.replace('_', ' ')})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Coordinator</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {b.coordinatorName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {b.contactNumber}
                    </span>
                  </div>
                </div>

                {b.purpose && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-200">Purpose:</strong> {b.purpose}
                  </p>
                )}

                {b.attachmentUrl && (
                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-xs flex items-center justify-between">
                    <span className="font-medium text-blue-900 dark:text-blue-200 text-[11px]">
                      📄 Attached Permission / Proposal Letter
                    </span>
                    <a
                      href={b.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                    >
                      Open Document ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedBooking(b);
                    setRejectionModal(true);
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 font-semibold text-xs transition"
                >
                  Reject
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleApprove(b.id)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Book Date</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectionModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Reject Booking {selectedBooking.bookingId}
            </h3>
            <p className="text-xs text-slate-500">
              Provide a valid reason for declining this request. The applicant will receive an immediate notification.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Facility required for urgent university council meeting..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
