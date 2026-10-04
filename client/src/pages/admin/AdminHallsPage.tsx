import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Hall } from '../../types';
import { Building2, Edit, Check, X, Users, MapPin } from 'lucide-react';

export const AdminHallsPage: React.FC = () => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Hall>>({});

  useEffect(() => {
    loadHalls();
  }, []);

  const loadHalls = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Hall[]>('/halls');
      setHalls(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (hall: Hall) => {
    setEditingId(hall.id);
    setFormData({
      name: hall.name,
      code: hall.code,
      location: hall.location,
      capacity: hall.capacity,
      description: hall.description,
      status: hall.status,
    });
  };

  const handleSave = async (id: string) => {
    try {
      await apiRequest(`/halls/${id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setEditingId(null);
      loadHalls();
    } catch (err: any) {
      alert(err.message || 'Failed to update hall');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Facility Hall Management
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize Seminar Hall and AV Hall details, location, facilities, and informational capacity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {halls.map((hall) => {
          const isEditing = editingId === hall.id;
          return (
            <div
              key={hall.id}
              className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {hall.name}
                    </h3>
                    <span className="font-mono text-xs text-slate-400">{hall.code}</span>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => startEdit(hall)}
                    className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Hall Name
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Informational Capacity
                    </label>
                    <input
                      type="number"
                      value={formData.capacity || 0}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(hall.id)}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                  <p>{hall.description}</p>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                    <p>
                      <strong className="text-slate-800 dark:text-slate-200">Location:</strong>{' '}
                      {hall.location}
                    </p>
                    <p>
                      <strong className="text-slate-800 dark:text-slate-200">Capacity:</strong>{' '}
                      ~{hall.capacity} attendees (Informational Only)
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Facilities
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {hall.facilities.map((fac, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                        >
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
