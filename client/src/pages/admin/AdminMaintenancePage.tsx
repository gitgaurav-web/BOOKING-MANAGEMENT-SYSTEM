import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Maintenance, Hall } from '../../types';
import { Wrench, Trash2, Plus, Calendar } from 'lucide-react';

export const AdminMaintenancePage: React.FC = () => {
  const [items, setItems] = useState<Maintenance[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [hallId, setHallId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mData, hData] = await Promise.all([
        apiRequest<Maintenance[]>('/maintenance'),
        apiRequest<Hall[]>('/halls'),
      ]);
      setItems(mData);
      setHalls(hData);
      if (hData.length > 0) setHallId(hData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          hallId,
          startDate,
          endDate,
          reason,
          notes,
          responsiblePerson,
        }),
      });
      setShowAdd(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setNotes('');
      setResponsiblePerson('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule maintenance');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this maintenance record?')) return;
    try {
      await apiRequest(`/maintenance/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Maintenance Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Schedule acoustic, audiovisual, projector, or air conditioning maintenance downtime.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAdd ? 'Close' : 'Schedule Maintenance'}</span>
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            New Maintenance Window
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hall Facility
              </label>
              <select
                value={hallId}
                onChange={(e) => setHallId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
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
                Maintenance Reason / Job
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Projector Lamp Replacement & Audio Calibration"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Responsible Technician / Engineer
              </label>
              <input
                type="text"
                placeholder="e.g. Mr. Arvind Gupta (Head AV Technician)"
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
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
              Schedule Downtime
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
                <th className="py-3 px-4">Hall</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Responsible Person</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No scheduled maintenance.
                  </td>
                </tr>
              ) : (
                items.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {m.hall?.name}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {m.startDate} to {m.endDate}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{m.reason}</td>
                    <td className="py-3 px-4 text-slate-500">{m.responsiblePerson || 'AV Tech'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(m.id)}
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
