import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      if (newStatus === 'APPROVED') {
        await apiRequest(`/bookings/${id}/approve`, { method: 'PATCH', body: JSON.stringify({}) });
      } else if (newStatus === 'CANCELLED') {
        await apiRequest(`/bookings/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason: 'Admin cancelled' }) });
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Status change failed');
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

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.eventName.toLowerCase().includes(q) ||
      b.bookingId.toLowerCase().includes(q) ||
      b.requestedBy.toLowerCase().includes(q) ||
      b.department?.name?.toLowerCase().includes(q)
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
            Search, filter, edit, reschedule, or cancel all Seminar Hall and AV Hall reservations.
          </p>
        </div>

        <a
          href="/api/reports/export-csv"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-semibold text-xs transition"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export All Bookings CSV</span>
        </a>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search event, booking ID, coordinator..."
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Hall</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-4">Date & Slot</th>
                <th className="py-3 px-4">Department / Coordinator</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {b.bookingId}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {b.hall?.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {b.eventName}
                    </span>
                    <span className="text-[11px] text-slate-400">{b.purpose}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {b.bookingDate}
                      {b.endDate && b.endDate !== b.bookingDate && (
                        <span className="block text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                          to {b.endDate} (Multi-Day)
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {b.startTime} - {b.endTime}
                    </span>
                    {b.attachmentUrl && (
                      <a
                        href={b.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold mt-0.5"
                      >
                        📎 Letter / Proposal ↗
                      </a>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-700 dark:text-slate-300 block">
                      {b.department?.name || 'Academic Dept'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {b.requestedBy} ({b.contactNumber})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={b.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    {b.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusChange(b.id, 'APPROVED')}
                        className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-semibold text-[11px]"
                        title="Approve"
                      >
                        Approve
                      </button>
                    )}
                    {b.status === 'APPROVED' && (
                      <button
                        onClick={() => handleStatusChange(b.id, 'CANCELLED')}
                        className="px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-[11px]"
                        title="Cancel Booking"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(b.id, b.bookingId)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
