import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Hall } from '../../types';
import { Building2, Edit, Check, X, Users, MapPin, Plus } from 'lucide-react';

export const AdminHallsPage: React.FC = () => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Hall>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newHall, setNewHall] = useState({
    name: '',
    code: '',
    location: '',
    capacity: 100,
    description: '',
    facilities: ['Projector', 'Air Conditioning', 'Audio System'],
    status: 'ACTIVE',
  });

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHall.name || !newHall.code || !newHall.location) {
      alert('Name, Code, and Location are required');
      return;
    }
    try {
      await apiRequest('/halls', {
        method: 'POST',
        body: JSON.stringify(newHall),
      });
      setShowCreate(false);
      setNewHall({
        name: '',
        code: '',
        location: '',
        capacity: 100,
        description: '',
        facilities: ['Projector', 'Air Conditioning', 'Audio System'],
        status: 'ACTIVE',
      });
      loadHalls();
    } catch (err: any) {
      alert(err.message || 'Failed to create facility hall');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Facility Hall Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customize Seminar Hall and AV Hall details, location, facilities, and informational capacity.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showCreate ? 'Close Form' : 'Add New Hall'}</span>
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Facility Hall</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hall Name
              </label>
              <input
                type="text"
                placeholder="e.g. Conference Hall B"
                value={newHall.name}
                onChange={(e) => setNewHall({ ...newHall, name: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hall Code
              </label>
              <input
                type="text"
                placeholder="e.g. CONF-HALL-02"
                value={newHall.code}
                onChange={(e) => setNewHall({ ...newHall, code: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Capacity (Informational)
              </label>
              <input
                type="number"
                value={newHall.capacity}
                onChange={(e) => setNewHall({ ...newHall, capacity: parseInt(e.target.value, 10) || 0 })}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Campus Location
            </label>
            <input
              type="text"
              placeholder="e.g. Tech Block, 3rd Floor"
              value={newHall.location}
              onChange={(e) => setNewHall({ ...newHall, location: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              placeholder="Brief description of the facility"
              value={newHall.description}
              onChange={(e) => setNewHall({ ...newHall, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
            >
              Create Hall
            </button>
          </div>
        </form>
      )}

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
