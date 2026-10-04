import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Holiday } from '../../types';
import { CalendarDays, Trash2, Plus } from 'lucide-react';

export const AdminHolidaysPage: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [hallScope, setHallScope] = useState('ALL');

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Holiday[]>('/holidays');
      setHolidays(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/holidays', {
        method: 'POST',
        body: JSON.stringify({ name, date, description, hallScope }),
      });
      setShowAdd(false);
      setName('');
      setDate('');
      setDescription('');
      loadHolidays();
    } catch (err: any) {
      alert(err.message || 'Failed to add holiday');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this institutional holiday?')) return;
    try {
      await apiRequest(`/holidays/${id}`, { method: 'DELETE' });
      loadHolidays();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Institutional Holidays
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define official college holidays that automatically prevent conflicting hall bookings.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAdd ? 'Close' : 'Add Holiday'}</span>
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">New Holiday</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Holiday Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. National Science Day"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hall Scope
              </label>
              <select
                value={hallScope}
                onChange={(e) => setHallScope(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="ALL">All Facilities</option>
                <option value="Seminar Hall">Seminar Hall Only</option>
                <option value="AV Hall">AV Hall Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Institutional holiday observed across college campus"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
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
              Save Holiday
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Holiday Name</th>
                <th className="py-3 px-4">Hall Scope</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No holidays registered.
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {h.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {h.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{h.hallScope}</td>
                    <td className="py-3 px-4 text-slate-500">{h.description || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
