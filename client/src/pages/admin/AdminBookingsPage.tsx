import React, { useState, useEffect } from 'react';
import { apiRequest, downloadCsvFile } from '../../services/api';
import { Booking, Hall, Department } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Layers,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  MessageSquare,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
  Send,
  Building2,
  User,
  Calendar,
} from 'lucide-react';

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [hallFilter, setHallFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Action & Faculty Notice Modal state
  const [selectedBookingForAction, setSelectedBookingForAction] = useState<Booking | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [hallFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, hData, dData] = await Promise.all([
        apiRequest<Booking[]>(`/bookings?hallId=${hallFilter}&status=${statusFilter}`),
        apiRequest<Hall[]>('/halls'),
        apiRequest<Department[]>('/users/departments'),
      ]);
      setBookings(bData);
      setHalls(hData);
      setDepartments(dData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (booking: Booking) => {
    setSelectedBookingForAction(booking);
    setActionNotes(booking.adminNotes || '');
  };

  const closeActionModal = () => {
    setSelectedBookingForAction(null);
    setActionNotes('');
  };

  const handleSaveNoticeOnly = async () => {
    if (!selectedBookingForAction) return;
    try {
      setActionSubmitting(true);
      await apiRequest(`/bookings/${selectedBookingForAction.id}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ adminNotes: actionNotes }),
      });
      alert('Official notice updated and sent to faculty coordinator.');
      closeActionModal();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save notice');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleApproveWithNotice = async (bookingId?: string, notes?: string) => {
    const id = bookingId || selectedBookingForAction?.id;
    if (!id) return;
    const finalNotes = notes !== undefined ? notes : actionNotes;
    try {
      setActionSubmitting(true);
      await apiRequest(`/bookings/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ adminNotes: finalNotes }),
      });
      alert('Booking approved successfully! Faculty coordinator has been notified.');
      closeActionModal();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCancelWithNotice = async (bookingId?: string, notes?: string) => {
    const id = bookingId || selectedBookingForAction?.id;
    if (!id) return;
    const finalNotes = notes !== undefined ? notes : actionNotes;
    if (!window.confirm('Are you sure you want to cancel this booking reservation?')) return;
    try {
      setActionSubmitting(true);
      await apiRequest(`/bookings/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({
          reason: finalNotes || 'Admin cancelled reservation',
          adminNotes: finalNotes,
        }),
      });
      alert('Booking cancelled successfully.');
      closeActionModal();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleDelete = async (id: string, bookingId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete booking ${bookingId}?`)) return;
    try {
      await apiRequest(`/bookings/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const presetRemarks = [
    'Please collect room keys & AV remote from Central Facilities Office 15 mins prior to the event.',
    'Approved as per approval of Principal & Dean Academics.',
    'AV technician has been assigned for audio & projection assistance.',
    'Kindly ensure lights, AC, and equipment are switched off post program.',
    'Reservation cancelled due to unavoidable institutional scheduling conflict.',
  ];

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.eventName.toLowerCase().includes(q) ||
      b.bookingId.toLowerCase().includes(q) ||
      b.requestedBy.toLowerCase().includes(q) ||
      b.department?.name?.toLowerCase().includes(q) ||
      (b.adminNotes && b.adminNotes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            All Facility Bookings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage approvals, cancellations, and send official admin notices or instructions directly to faculty coordinators.
          </p>
        </div>

        <button
          onClick={async () => {
            try {
              await downloadCsvFile('/reports/export-csv', 'facility_bookings_report.csv');
            } catch (err: any) {
              alert(err.message || 'Failed to download CSV');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs transition cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export All Bookings CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search event, booking ID, coordinator, or admin notice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          />
        </div>

        <select
          value={hallFilter}
          onChange={(e) => setHallFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
        >
          <option value="ALL">All Halls</option>
          {halls.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="APPROVED">Approved / Booked</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 whitespace-nowrap">Booking ID</th>
                <th className="py-3 px-3 whitespace-nowrap">Hall</th>
                <th className="py-3 px-3">Event Details & Notice</th>
                <th className="py-3 px-3 whitespace-nowrap">Date & Slot</th>
                <th className="py-3 px-3">Department / Coordinator</th>
                <th className="py-3 px-2 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {b.bookingId}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {b.hall?.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]" title={b.eventName}>
                      {b.eventName}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate max-w-[200px]" title={b.purpose}>
                      {b.purpose}
                    </span>
                    {/* Admin Notice Pill if present */}
                    {b.adminNotes && (
                      <div className="mt-1 flex items-start gap-1 text-[10.5px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded px-1.5 py-0.5 max-w-[220px] shadow-2xs">
                        <MessageSquare className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span className="truncate" title={b.adminNotes}>
                          <strong className="font-semibold">Notice:</strong> {b.adminNotes}
                        </span>
                      </div>
                    )}
                    {b.rejectionReason && b.status === 'REJECTED' && (
                      <div className="mt-1 flex items-start gap-1 text-[10.5px] bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded px-1.5 py-0.5 max-w-[220px]">
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                        <span className="truncate" title={b.rejectionReason}>
                          <strong className="font-semibold">Reason:</strong> {b.rejectionReason}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {b.bookingDate}
                      {b.endDate && b.endDate !== b.bookingDate && (
                        <span className="ml-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1 py-0.2 rounded">
                          to {b.endDate}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {b.startTime} - {b.endTime}
                    </div>
                    {b.attachmentUrl && (
                      <a
                        href={b.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-[10.5px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold mt-0.5"
                      >
                        📎 Proposal ↗
                      </a>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]" title={b.department?.name || 'Academic Dept'}>
                      {b.department?.name || 'Academic Dept'}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                      <span>{b.requestedBy}</span>
                      <span>•</span>
                      <span>{b.contactNumber}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    <StatusBadge status={b.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1">
                      {/* Manage & Notice button (Primary Action) */}
                      <button
                        onClick={() => openActionModal(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 font-semibold text-[11px] transition border border-blue-200/50 dark:border-blue-900/60 cursor-pointer shadow-2xs"
                        title="Write notice or manage this booking"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Notice</span>
                      </button>

                      {/* Quick Approve button */}
                      {b.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApproveWithNotice(b.id, b.adminNotes || '')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 font-semibold text-[11px] transition border border-emerald-200/50 dark:border-emerald-900/60 cursor-pointer shadow-2xs"
                          title={b.status === 'PENDING' ? 'Approve Booking' : 'Re-Approve Booking'}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {/* Quick Cancel button */}
                      {b.status !== 'CANCELLED' && b.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleCancelWithNotice(b.id, b.adminNotes || 'Admin cancelled reservation')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 font-semibold text-[11px] transition border border-rose-200/50 dark:border-rose-900/60 cursor-pointer shadow-2xs"
                          title="Cancel Booking"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}

                      {/* Delete permanently */}
                      <button
                        onClick={() => handleDelete(b.id, b.bookingId)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action & Faculty Notice Modal */}
      {selectedBookingForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
                    {selectedBookingForAction.bookingId}
                  </span>
                  <StatusBadge status={selectedBookingForAction.status} size="sm" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Booking Actions & Faculty Notice
                </h3>
              </div>
              <button
                onClick={closeActionModal}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Details Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedBookingForAction.eventName}
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedBookingForAction.hall?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div>
                  <span className="text-slate-400 block text-[10px]">Date & Time</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedBookingForAction.bookingDate} ({selectedBookingForAction.startTime} - {selectedBookingForAction.endTime})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Faculty Coordinator</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedBookingForAction.requestedBy} • {selectedBookingForAction.contactNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Notice / Remarks Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Official Admin Notice / Instructions for Faculty</span>
                </label>
                <span className="text-[10px] text-slate-400">Visible on Faculty's Pass & Dashboard</span>
              </div>

              <textarea
                rows={4}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Write official notice, key pickup instructions, AV requirements, or cancellation notes for the faculty coordinator..."
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
              />

              {/* Quick Template Chips */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Quick Templates / Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {presetRemarks.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActionNotes(preset)}
                      className="text-[10.5px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-left transition cursor-pointer"
                    >
                      {preset.length > 40 ? `${preset.substring(0, 40)}...` : preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={actionSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* Save Notice Only */}
                <button
                  type="button"
                  onClick={handleSaveNoticeOnly}
                  disabled={actionSubmitting}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
                  title="Save notice without changing booking status"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save Notice Only</span>
                </button>

                {/* Cancel Booking */}
                {selectedBookingForAction.status !== 'CANCELLED' && selectedBookingForAction.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => handleCancelWithNotice()}
                    disabled={actionSubmitting}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Booking</span>
                  </button>
                )}

                {/* Approve Booking */}
                {selectedBookingForAction.status !== 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => handleApproveWithNotice()}
                    disabled={actionSubmitting}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Booking</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
