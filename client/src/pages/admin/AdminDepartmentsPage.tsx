import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Department } from '../../types';
import { Building, Plus } from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Department[]>('/users/departments');
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/users/departments', {
        method: 'POST',
        body: JSON.stringify({ name, code, description }),
      });
      setShowAdd(false);
      setName('');
      setCode('');
      setDescription('');
      loadDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to add department');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Department Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Academic departments and organizational units hosting events.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAdd ? 'Close' : 'Add Department'}</span>
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">New Academic Department</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Department of Biotechnology"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BT"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="Short description..."
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
              Save Department
            </button>
          </div>
        </form>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div
            key={d.id}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                {d.code}
              </span>
              <span className="text-[11px] text-slate-400">
                {d._count?.bookings || 0} reservations
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">{d.name}</h3>
            {d.description && <p className="text-xs text-slate-500">{d.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
