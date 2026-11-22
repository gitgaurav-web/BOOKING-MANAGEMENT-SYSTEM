import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  Car,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  XCircle,
  FileCheck2,
  Printer,
  X,
  Phone,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { VehicleBooking } from '../types';
import { apiRequest } from '../services/api';

export const VehicleTripsPage: React.FC = () => {
  const [trips, setTrips] = useState<VehicleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTrip, setSelectedTrip] = useState<VehicleBooking | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<VehicleBooking[]>('/vehicles/bookings/all');
      setTrips(data);
    } catch (err) {
      console.error('Failed to load vehicle trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrip = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this trip requisition?')) {
      return;
    }
    try {
      await apiRequest(`/vehicles/bookings/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Cancelled by requester' }),
      });
      loadTrips();
      if (selectedTrip?.id === id) {
        setSelectedTrip(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel trip.');
    }
  };

  const filteredTrips = statusFilter === 'ALL' ? trips : trips.filter((t) => t.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock3 className="h-3 w-3" /> Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Cancelled
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            Completed
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 mb-2">
            <Bus className="h-3.5 w-3.5" />
            Central Transport &amp; Vehicle Reservation Portal (CTVRP)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            My Vehicle Trip Requisitions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track status of official college vehicle requisitions, driver assignments, and download approved trip sheets.
          </p>
        </div>

        <Link
          to="/transport/book"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> New Trip Requisition
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {st === 'ALL' ? 'All Requisitions' : st}
          </button>
        ))}
      </div>

      {/* Content List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <Bus className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No vehicle requisitions found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not submitted any vehicle trip requests matching this filter.
          </p>
          <Link
            to="/transport/book"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition"
          >
            Book a Fleet Vehicle Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {trip.bookingId}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                      {trip.tripTitle}
                    </h3>
                  </div>
                  <div>{getStatusBadge(trip.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Bus className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{trip.vehicle?.name || 'Assigned Vehicle'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>{trip.startDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>{trip.departureTime} - {trip.returnTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>{trip.passengerCount} Passengers</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {trip.dropLocation}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">From: {trip.pickupLocation}</div>
                  </div>
                </div>

                {trip.status === 'APPROVED' && trip.assignedDriverName && (
                  <div className="text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Driver: <strong>{trip.assignedDriverName}</strong></span>
                    </div>
                    {trip.assignedDriverPhone && (
                      <span className="font-mono text-[11px]">{trip.assignedDriverPhone}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedTrip(trip)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 py-1"
                >
                  <Printer className="h-3.5 w-3.5" /> View Trip Pass &amp; Details
                </button>

                {trip.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancelTrip(trip.id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-500 py-1"
                  >
                    Cancel Requisition
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Trip Sheet Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <button
              onClick={() => setSelectedTrip(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Official Header */}
            <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400">
                SRI SAIRAM COLLEGE OF ENGINEERING · BENGALURU
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Official Vehicle Trip &amp; Requisition Sheet
              </h2>
              <div className="text-xs text-slate-500">
                Central Transport &amp; Vehicle Reservation Portal (CTVRP)
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[11px] text-slate-500">Requisition Pass Reference</span>
                <div className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                  {selectedTrip.bookingId}
                </div>
                <div>{getStatusBadge(selectedTrip.status)}</div>
              </div>
              <QRCodeSVG value={`SSCE-CTVRP:${selectedTrip.bookingId}`} size={85} level="H" />
            </div>

            {/* Itinerary Matrix */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400">Trip Purpose:</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedTrip.tripPurpose}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Vehicle Allocated:</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedTrip.vehicle?.name} ({selectedTrip.vehicle?.registrationNo})
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Date of Travel:</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedTrip.startDate} {selectedTrip.endDate && selectedTrip.endDate !== selectedTrip.startDate ? `to ${selectedTrip.endDate}` : ''}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Schedule:</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Departure {selectedTrip.departureTime} · Return {selectedTrip.returnTime}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Pickup Point:</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedTrip.pickupLocation}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Destination:</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedTrip.dropLocation}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Faculty Coordinator:</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedTrip.coordinatorName} ({selectedTrip.coordinatorPhone})
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Assigned Driver:</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedTrip.assignedDriverName || 'To be allocated at departure'}
                  {selectedTrip.assignedDriverPhone && ` (${selectedTrip.assignedDriverPhone})`}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition"
              >
                <Printer className="h-4 w-4" /> Print Trip Slip
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleTripsPage;
