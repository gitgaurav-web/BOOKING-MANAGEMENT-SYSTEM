import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { BlockedDate, Hall } from '../../types';
import { Ban, Trash2, Plus, Calendar } from 'lucide-react';

export const AdminBlockedDatesPage: React.FC = () => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);

  // New Block Form
  const [showAdd, setShowAdd] = useState(false);
  const [hallId, setHallId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('MAINTENANCE');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, hData] = await Promise.all([
        apiRequest<BlockedDate[]>('/blocked-dates'),
        apiRequest<Hall[]>('/halls'),
      ]);
      setBlockedDates(bData);
      setHalls(hData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/blocked-dates', {
        method: 'POST',
        body: JSON.stringify({
          hallId: hallId || null,
          startDate,
          endDate,
          reason,
          description,
        }),
      });
      setShowAdd(false);
      setStartDate('');
      setEndDate('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to block date');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to unblock this date range?')) return;
    try {
      await apiRequest(`/blocked-dates/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to unblock');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Blocked Facility Dates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Restrict Seminar Hall or AV Hall for institutional examinations, renovations, or emergencies.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 font-semibold text-xs shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAdd ? 'Close Form' : 'Block New Date Range'}</span>
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Schedule Date Blackout / Block
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Applicable Hall
              </label>
              <select
                value={hallId}
                onChange={(e) => setHallId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="">All Facilities (Seminar Hall & AV Hall)</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="EXAMINATION">Central Examination</option>
                <option value="MAINTENANCE">Scheduled Maintenance</option>
                <option value="OFFICIAL_EVENT">Official Institutional Event</option>
                <option value="HOLIDAY">Campus Holiday</option>
                <option value="EMERGENCY">Emergency / Sanitization</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Memo Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Mid-semester central evaluation"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-xl border text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              Save Block Period
            </button>
          </div>
        </form>
      )}

      {/* Blocked Dates List */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Hall</th>
                <th className="py-3 px-4">Date Range</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {blockedDates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No active blocked dates.
                  </td>
                </tr>
              ) : (
                blockedDates.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {b.hall?.name || 'All Facilities'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {b.startDate} to {b.endDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                        {b.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{b.description || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Unblock date"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
