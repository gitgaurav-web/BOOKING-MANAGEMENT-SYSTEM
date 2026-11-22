import React, { useState, useEffect } from 'react';
import {
  Bus,
  Car,
  CheckCircle2,
  Clock3,
  XCircle,
  Users,
  Calendar,
  MapPin,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  X,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { VehicleBooking, Vehicle } from '../../types';
import { apiRequest } from '../../services/api';

export const AdminTransportPage: React.FC = () => {
  const [trips, setTrips] = useState<VehicleBooking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Approval / Rejection Modal State
  const [activeModalTrip, setActiveModalTrip] = useState<VehicleBooking | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'COMPLETE' | null>(null);
  const [assignedDriverName, setAssignedDriverName] = useState('');
  const [assignedDriverPhone, setAssignedDriverPhone] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New Vehicle Modal State
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [vName, setVName] = useState('');
  const [vRegNo, setVRegNo] = useState('');
  const [vType, setVType] = useState('BUS');
  const [vCapacity, setVCapacity] = useState(50);
  const [vFuel, setVFuel] = useState('DIESEL');
  const [vAc, setVAc] = useState(true);
  const [vDriver, setVDriver] = useState('');
  const [vDriverPhone, setVDriverPhone] = useState('');
  const [vImage, setVImage] = useState('');
  const [addVehicleLoading, setAddVehicleLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tripsData, vehiclesData] = await Promise.all([
        apiRequest<VehicleBooking[]>('/vehicles/bookings/all'),
        apiRequest<Vehicle[]>('/vehicles'),
      ]);
      setTrips(tripsData);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error('Failed to load transport admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (trip: VehicleBooking, type: 'APPROVE' | 'REJECT' | 'COMPLETE') => {
    setActiveModalTrip(trip);
    setActionType(type);
    setAssignedDriverName(trip.assignedDriverName || trip.vehicle?.driverName || '');
    setAssignedDriverPhone(trip.assignedDriverPhone || trip.vehicle?.driverPhone || '');
    setAdminNotes(trip.adminNotes || '');
    setRejectionReason('');
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalTrip || !actionType) return;

    setActionLoading(true);
    try {
      const status = actionType === 'APPROVE' ? 'APPROVED' : actionType === 'REJECT' ? 'REJECTED' : 'COMPLETED';
      await apiRequest(`/vehicles/bookings/${activeModalTrip.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          adminNotes,
          rejectionReason: actionType === 'REJECT' ? rejectionReason : undefined,
          assignedDriverName: actionType === 'APPROVE' ? assignedDriverName : undefined,
          assignedDriverPhone: actionType === 'APPROVE' ? assignedDriverPhone : undefined,
        }),
      });
      setActiveModalTrip(null);
      setActionType(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddVehicleLoading(true);
    try {
      await apiRequest('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          name: vName,
          registrationNo: vRegNo,
          vehicleType: vType,
          capacity: Number(vCapacity),
          fuelType: vFuel,
          acAvailable: vAc,
          image: vImage || undefined,
          driverName: vDriver || undefined,
          driverPhone: vDriverPhone || undefined,
          features: ['GPS Tracker', 'Speed Governor', 'First-Aid Kit'],
        }),
      });
      setShowAddVehicleModal(false);
      setVName('');
      setVRegNo('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add vehicle.');
    } finally {
      setAddVehicleLoading(false);
    }
  };

  const filteredTrips = trips.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.bookingId.toLowerCase().includes(q) ||
      t.tripTitle.toLowerCase().includes(q) ||
      t.dropLocation.toLowerCase().includes(q) ||
      t.coordinatorName.toLowerCase().includes(q) ||
      (t.vehicle?.name && t.vehicle.name.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = trips.filter((t) => t.status === 'PENDING').length;
  const approvedCount = trips.filter((t) => t.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 mb-1">
            <Bus className="h-3.5 w-3.5" /> Central Transport Desk
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Vehicle &amp; Fleet Requisition Management
          </h1>
          <p className="text-xs text-slate-500">
            Process institutional trip requisitions, assign fleet drivers, and oversee college transport assets.
          </p>
        </div>

        <button
          onClick={() => setShowAddVehicleModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
        >
          <Plus className="h-4 w-4" /> Add Fleet Vehicle
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Campus Vehicles</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {vehicles.length}
          </div>
        </div>
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 shadow-xs">
          <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">Pending Requisitions</div>
          <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
            {pendingCount}
          </div>
        </div>
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 shadow-xs">
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Approved / Active Trips</div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
            {approvedCount}
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Lifetime Trips</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {trips.length}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'ALL' ? 'All Trips' : st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search booking ID, destination, faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Trips Table */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading trip requisitions...</div>
        ) : filteredTrips.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No transport trip requisitions found matching current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Booking ID &amp; Purpose</th>
                  <th className="py-3 px-4 font-bold">Vehicle</th>
                  <th className="py-3 px-4 font-bold">Faculty Coordinator</th>
                  <th className="py-3 px-4 font-bold">Date &amp; Schedule</th>
                  <th className="py-3 px-4 font-bold">Route &amp; Destination</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {trip.bookingId}
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white mt-0.5 line-clamp-1 max-w-[180px]">
                        {trip.tripTitle}
                      </div>
                      <div className="text-[10px] text-slate-400">{trip.tripPurpose}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {trip.vehicle?.name}
                      </div>
                      <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                        {trip.vehicle?.registrationNo} ({trip.passengerCount} pax)
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {trip.coordinatorName}
                      </div>
                      <div className="text-[11px] text-slate-500">{trip.coordinatorPhone}</div>
                      {trip.department && (
                        <div className="text-[10px] text-slate-400">{trip.department.code}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{trip.startDate}</div>
                      <div className="text-[11px] text-slate-500">
                        {trip.departureTime} - {trip.returnTime}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-[180px]">
                      <div className="truncate font-medium text-slate-900 dark:text-white">
                        {trip.dropLocation}
                      </div>
                      <div className="truncate text-[10px] text-slate-400">From: {trip.pickupLocation}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          trip.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : trip.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : trip.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {trip.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      {trip.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleOpenActionModal(trip, 'APPROVE')}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(trip, 'REJECT')}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {trip.status === 'APPROVED' && (
                        <button
                          onClick={() => handleOpenActionModal(trip, 'COMPLETE')}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition"
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal (Approve / Reject / Complete) */}
      {activeModalTrip && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitAction}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {actionType === 'APPROVE' && 'Approve Vehicle Requisition'}
                {actionType === 'REJECT' && 'Reject Vehicle Requisition'}
                {actionType === 'COMPLETE' && 'Complete Vehicle Trip'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveModalTrip(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
              <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {activeModalTrip.bookingId} - {activeModalTrip.tripTitle}
              </div>
              <div className="text-slate-500">
                Vehicle: <strong>{activeModalTrip.vehicle?.name}</strong> | Date: <strong>{activeModalTrip.startDate}</strong>
              </div>
            </div>

            {actionType === 'APPROVE' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Driver Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={assignedDriverName}
                    onChange={(e) => setAssignedDriverName(e.target.value)}
                    placeholder="e.g. Murugan R"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={assignedDriverPhone}
                    onChange={(e) => setAssignedDriverPhone(e.target.value)}
                    placeholder="+91 98451 XXXXX"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Administrative Notes / FASTag Toll Info
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Approval remarks..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {actionType === 'REJECT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify reason for decline (e.g. Vehicle scheduled for routine maintenance)..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            )}

            {actionType === 'COMPLETE' && (
              <p className="text-xs text-slate-500">
                Confirm that this vehicle trip has completed safely and returned to campus.
              </p>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModalTrip(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm disabled:opacity-50 ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : actionType === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {actionLoading ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleCreateVehicle}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bus className="h-5 w-5 text-blue-600" /> Register New Fleet Vehicle
              </h3>
              <button
                type="button"
                onClick={() => setShowAddVehicleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Name / Model *
                </label>
                <input
                  type="text"
                  required
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="e.g. Ashok Leyland Deluxe Campus Bus 08"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={vRegNo}
                    onChange={(e) => setVRegNo(e.target.value)}
                    placeholder="KA-51-E-7708"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="BUS">Bus (50+ Seats)</option>
                    <option value="CAR">Staff Car (7 Seats)</option>
                    <option value="VAN">Project Van (14 Seats)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Seating Capacity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={vCapacity}
                    onChange={(e) => setVCapacity(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={vFuel}
                    onChange={(e) => setVFuel(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="EV">Electric (EV)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vAc}
                      onChange={(e) => setVAc(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>AC Available</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={vDriver}
                    onChange={(e) => setVDriver(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Phone
                  </label>
                  <input
                    type="text"
                    value={vDriverPhone}
                    onChange={(e) => setVDriverPhone(e.target.value)}
                    placeholder="+91 98450 XXXXX"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={vImage}
                  onChange={(e) => setVImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddVehicleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addVehicleLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm disabled:opacity-50"
              >
                {addVehicleLoading ? 'Registering...' : 'Add Vehicle to Fleet'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminTransportPage;
