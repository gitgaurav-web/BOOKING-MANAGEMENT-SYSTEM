import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Department } from '../../types';
import { Building, Plus, Trash2, Edit2, AlertTriangle, RefreshCw } from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  // Delete modal state
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; code: string; description: string }>({
    name: '',
    code: '',
    description: '',
  });

  const handleStartEdit = (d: Department) => {
    setEditingId(d.id);
    setEditForm({
      name: d.name,
      code: d.code,
      description: d.description || '',
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      await apiRequest(`/users/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      loadDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to update department');
    }
  };

  const handleDelete = async (dept: Department) => {
    try {
      setIsDeleting(true);
      await apiRequest(`/users/departments/${dept.id}`, {
        method: 'DELETE',
      });
      setDeletingDept(null);
      loadDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete department');
    } finally {
      setIsDeleting(false);
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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs shadow-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              Save Department
            </button>
          </div>
        </form>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => {
          const isEditing = editingId === d.id;
          return (
            <div
              key={d.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              {isEditing ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Code</label>
                    <input
                      type="text"
                      value={editForm.code}
                      onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Description</label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setDeletingDept(d);
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(d.id)}
                        className="px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                      {d.code}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(d)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                        title="Edit Department"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingDept(d)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete / Cut Department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{d.name}</h3>
                  {d.description && <p className="text-xs text-slate-500 dark:text-slate-400">{d.description}</p>}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Permanent Delete / Cut */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Department?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This department will be permanently removed.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <p>Are you sure you want to permanently delete:</p>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {deletingDept.name} <span className="text-blue-600 dark:text-blue-400 font-mono">({deletingDept.code})</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                🛡️ <strong>Safe System Handshake:</strong> All faculty accounts and past bookings from this department will be cleanly unassigned to <strong>General / Campus Wide</strong> so no data is corrupted or lost.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingDept(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deletingDept)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Department'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
