import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../services/api';
import { Vehicle } from '../../types';
import {
  Car,
  Bus,
  Edit,
  Check,
  X,
  Plus,
  Fuel,
  Users,
  Phone,
  Camera,
  Upload,
  Link as LinkIcon,
  Trash2,
  AlertCircle,
  Wind,
  Shield,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export const AdminVehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form States
  const [formData, setFormData] = useState<Partial<Vehicle>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoInputMode, setPhotoInputMode] = useState<'UPLOAD' | 'URL'>('UPLOAD');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultNewVehicle: Partial<Vehicle> = {
    name: '',
    code: '',
    registrationNo: '',
    vehicleType: 'BUS',
    location: 'Campus Main Gate 1 Transport Bay',
    capacity: 55,
    fuelType: 'DIESEL',
    acAvailable: true,
    image: '',
    driverName: '',
    driverPhone: '',
    features: ['GPS Speed Governor (60 km/h)', 'First Aid Kit', 'Fire Extinguisher'],
    status: 'ACTIVE',
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Vehicle[]>('/vehicles');
      setVehicles(data);
    } catch (err) {
      console.error('Error fetching fleet vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  // Handle Photo Upload via POST /api/upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    try {
      setUploadingImage(true);
      setUploadError(null);

      const form = new FormData();
      form.append('file', file);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload photo');

      // Update form image with uploaded URL
      setFormData((prev) => ({ ...prev, image: data.url }));
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Open Edit Modal
  const startEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({
      ...v,
      features: Array.isArray(v.features) ? v.features : [],
    });
    setUploadError(null);
    setPhotoInputMode(v.image?.startsWith('/uploads') ? 'UPLOAD' : 'URL');
  };

  // Open Create Modal
  const startCreate = () => {
    setShowCreateModal(true);
    setFormData(defaultNewVehicle);
    setUploadError(null);
    setPhotoInputMode('UPLOAD');
  };

  // Save Edit (PUT /api/vehicles/:id)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    try {
      await apiRequest(`/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setEditingVehicle(null);
      loadVehicles();
    } catch (err: any) {
      alert(err.message || 'Failed to update vehicle');
    }
  };

  // Submit Create (POST /api/vehicles)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.registrationNo) {
      alert('Vehicle Name and Registration Number are mandatory.');
      return;
    }

    try {
      await apiRequest('/vehicles', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowCreateModal(false);
      loadVehicles();
    } catch (err: any) {
      alert(err.message || 'Failed to register vehicle');
    }
  };

  // Delete / Archive Vehicle
  const handleDelete = async (v: Vehicle) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate vehicle "${v.name}" (${v.registrationNo})?`)) {
      return;
    }

    try {
      const res = await apiRequest<{ message: string; status?: string }>(`/vehicles/${v.id}`, {
        method: 'DELETE',
      });
      alert(res.message);
      loadVehicles();
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  const getImageFallback = (type?: string) => {
    switch (type) {
      case 'AMBULANCE':
        return 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1200&q=80';
      case 'BUS':
        return 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80';
      case 'VAN':
        return 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80';
      case 'CAR':
      default:
        return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Car className="w-3.5 h-3.5" />
            <span>Central Fleet Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Vehicle &amp; Bus Fleet Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Add new campus vehicles, update bus photos, edit seating capacities, and assign designated campus drivers.
          </p>
        </div>

        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle / Bus</span>
        </button>
      </div>

      {/* 2. Fleet Overview Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-4">Bus / Vehicle Photo</th>
                <th className="p-4">Vehicle Details</th>
                <th className="p-4">Registration No</th>
                <th className="p-4">Type &amp; Fuel</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Assigned Driver</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-slate-400">
                    Loading campus fleet inventory...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-slate-400">
                    No fleet vehicles registered. Click "Add New Vehicle / Bus" to register one.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => {
                  const fallbackImg = getImageFallback(v.vehicleType);

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      {/* Vehicle Photo with Quick Change Trigger */}
                      <td className="p-4">
                        <div
                          onClick={() => startEdit(v)}
                          title="Click to change photo / edit details"
                          className="relative w-16 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group cursor-pointer shadow-xs"
                        >
                          <img
                            src={v.image || fallbackImg}
                            alt={v.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackImg;
                            }}
                            className="w-full h-full object-cover transition group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Camera className="w-4 h-4" />
                          </div>
                        </div>
                      </td>

                      {/* Vehicle Details */}
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        <div className="font-extrabold text-sm">{v.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {v.location || 'Transport Bay'} {v.code && `• Code: ${v.code}`}
                        </div>
                      </td>

                      {/* Registration Plate */}
                      <td className="p-4 font-mono font-bold">
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs">
                          {v.registrationNo}
                        </span>
                      </td>

                      {/* Type & Fuel */}
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{v.vehicleType}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {v.fuelType} {v.acAvailable && '• AC'}
                        </div>
                      </td>

                      {/* Capacity */}
                      <td className="p-4 font-semibold">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{v.capacity}</span> Pax
                      </td>

                      {/* Assigned Driver */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {v.driverName || 'Designated Driver'}
                        </div>
                        {v.driverPhone && (
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <span>{v.driverPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            v.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : v.status === 'MAINTENANCE'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(v)}
                            title="Edit Vehicle & Change Photo"
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition border border-slate-200 dark:border-slate-700"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(v)}
                            title="Delete / Deactivate"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition border border-slate-200 dark:border-slate-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MODAL: Add or Edit Vehicle (With Photo Upload & URL support) */}
      {(showCreateModal || editingVehicle) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    {editingVehicle ? `Edit Vehicle: ${editingVehicle.name}` : 'Register New Campus Vehicle'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingVehicle
                      ? 'Update bus photo, seating capacity, driver, and safety amenities.'
                      : 'Add a new bus, van, car, or ambulance to the institutional fleet.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingVehicle(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form
              onSubmit={editingVehicle ? handleUpdate : handleCreate}
              className="p-6 overflow-y-auto space-y-6 flex-1 text-xs"
            >
              {/* PHOTO UPLOAD & PREVIEW SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-500" />
                    <span>Vehicle / Bus Photo</span>
                  </label>

                  {/* Mode Selector: Upload File vs Paste URL */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('UPLOAD')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        photoInputMode === 'UPLOAD'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Upload className="w-3 h-3 inline mr-1" />
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('URL')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        photoInputMode === 'URL'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3 inline mr-1" />
                      Paste Web URL
                    </button>
                  </div>
                </div>

                {/* Photo Preview & Controls */}
                <div className="flex items-center gap-4">
                  {/* Thumbnail Box */}
                  <div className="relative w-28 h-20 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-800 shrink-0 shadow-xs">
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Vehicle Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImageFallback(formData.vehicleType);
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px]">
                        <Car className="w-6 h-6 mb-1 opacity-50" />
                        <span>No Photo</span>
                      </div>
                    )}

                    {uploadingImage && (
                      <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center text-white text-[10px] font-bold">
                        Uploading...
                      </div>
                    )}
                  </div>

                  {/* Input field based on mode */}
                  <div className="flex-1 space-y-2">
                    {photoInputMode === 'UPLOAD' ? (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{uploadingImage ? 'Uploading Image...' : 'Choose Photo from Device (JPG / PNG)'}</span>
                        </button>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Photos are automatically saved to institutional secure storage.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          placeholder="https://example.com/bus-photo.jpg"
                          value={formData.image || ''}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Paste any high-resolution public vehicle photo URL.
                        </p>
                      </div>
                    )}

                    {uploadError && (
                      <div className="text-[11px] text-rose-500 font-semibold">{uploadError}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* CORE DETAILS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle / Bus Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ashok Leyland Viking College Bus 01"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Registration Number (Number Plate) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="KA-51-E-1001"
                    value={formData.registrationNo || ''}
                    onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicleType || 'BUS'}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="BUS">College Bus (Heavy / Deluxe)</option>
                    <option value="VAN">Departmental Van / Traveller</option>
                    <option value="CAR">Official VIP Staff Car (Innova / Sedan)</option>
                    <option value="AMBULANCE">Emergency Life Support Ambulance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Fleet Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BUS-01, VAN-02, AMB-01"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Passenger Seating Capacity *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={formData.capacity || 55}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={formData.fuelType || 'DIESEL'}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="EV">Electric (EV)</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parking / Transport Bay Location
                  </label>
                  <input
                    type="text"
                    placeholder="Campus Main Gate 1 Transport Bay"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fleet Operational Status
                  </label>
                  <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="ACTIVE">ACTIVE (Available for Requisition)</option>
                    <option value="MAINTENANCE">MAINTENANCE (In Workshop / Service)</option>
                    <option value="INACTIVE">INACTIVE (Decommissioned)</option>
                  </select>
                </div>
              </div>

              {/* DRIVER ASSIGNMENT */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>Assigned Campus Pilot / Driver Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Driver Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Muniswamy K."
                      value={formData.driverName || ''}
                      onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Driver Mobile Number (For WhatsApp &amp; Call)
                    </label>
                    <input
                      type="tel"
                      placeholder="9845012345"
                      value={formData.driverPhone || ''}
                      onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* AMENITIES & AIR CONDITIONING */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Air Conditioning (AC)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Does this vehicle feature climate control for passenger comfort?
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.acAvailable)}
                      onChange={(e) => setFormData({ ...formData, acAvailable: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Safety &amp; Fleet Amenities (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Air Suspension, GPS Speed Governor (60 km/h), First Aid Kit, PA Sound System"
                    value={Array.isArray(formData.features) ? formData.features.join(', ') : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        features: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Separate features with commas (e.g., Speed Governor, First Aid Box, Fastag, Fire Extinguisher).
                  </p>
                </div>
              </div>

              {/* MODAL ACTION BUTTONS */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingVehicle(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  {editingVehicle ? 'Save Vehicle & Photo' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
