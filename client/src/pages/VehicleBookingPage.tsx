import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Bus,
  Car,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Fuel,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Vehicle } from '../types';
import { apiRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const VehicleBookingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialVehicleId = searchParams.get('vehicleId') || '';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId);

  // Form State
  const [tripTitle, setTripTitle] = useState('');
  const [tripPurpose, setTripPurpose] = useState('INDUSTRIAL_VISIT');
  const [pickupLocation, setPickupLocation] = useState('Campus Main Gate 1, Sri Sairam College of Engineering');
  const [dropLocation, setDropLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departureTime, setDepartureTime] = useState('08:30');
  const [returnTime, setReturnTime] = useState('17:30');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [coordinatorName, setCoordinatorName] = useState(user?.name || '');
  const [coordinatorPhone, setCoordinatorPhone] = useState(user?.phone || '+91 98450 00000');
  const [email, setEmail] = useState(user?.email || '');
  const [estimatedKilometers, setEstimatedKilometers] = useState<number>(50);
  const [tollPaymentRequired, setTollPaymentRequired] = useState(false);
  const [specialRequirements, setSpecialRequirements] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    apiRequest<Vehicle[]>('/vehicles')
      .then((data) => {
        setVehicles(data);
        if (!selectedVehicleId && data.length > 0) {
          setSelectedVehicleId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load vehicles:', err))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const handleRequirementToggle = (req: string) => {
    setSpecialRequirements((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedVehicle) {
      setErrorMessage('Please select a vehicle.');
      return;
    }

    if (!tripTitle.trim() || !pickupLocation.trim() || !dropLocation.trim() || !startDate) {
      setErrorMessage('Please fill in all mandatory fields (Trip Title, Locations, and Date).');
      return;
    }

    if (passengerCount > selectedVehicle.capacity) {
      setErrorMessage(
        `Passenger count (${passengerCount}) exceeds the vehicle capacity (${selectedVehicle.capacity} seats). Please select a larger vehicle or adjust count.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        vehicleId: selectedVehicle.id,
        tripTitle,
        tripPurpose,
        pickupLocation,
        dropLocation,
        startDate,
        endDate: endDate || startDate,
        departureTime,
        returnTime,
        passengerCount: Number(passengerCount),
        coordinatorName,
        coordinatorPhone,
        email,
        estimatedKilometers: Number(estimatedKilometers),
        tollPaymentRequired,
        specialRequirements,
        additionalNotes,
      };

      const res = await apiRequest<any>('/vehicles/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccessBooking(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit vehicle reservation request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-blue-600 transition">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/transport" className="hover:text-blue-600 transition">
          Central Transport (CTVRP)
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-slate-900 dark:text-white">New Vehicle Requisition</span>
      </div>

      {/* Success Modal / State */}
      {successBooking ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 border-2 border-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              REQUISITION SUBMITTED SUCCESSFULLY
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Trip Requisition Ref: {successBooking.bookingId}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              Your vehicle reservation for <strong>{selectedVehicle?.name}</strong> has been forwarded to the Central Transport Officer and Principal Office for approval.
            </p>
          </div>

          {/* QR Code Card */}
          <div className="mx-auto max-w-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 p-5 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-3">
            <QRCodeSVG value={`SSCE-CTVRP:${successBooking.bookingId}`} size={120} level="H" />
            <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
              {successBooking.bookingId}
            </span>
            <span className="text-[10px] text-slate-400">Scan at Transport Desk / Gate Security</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/transport/trips"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-md transition"
            >
              <FileCheck2 className="h-4 w-4" /> View My Trip Requisitions
            </Link>
            <button
              onClick={() => {
                setSuccessBooking(null);
                setTripTitle('');
                setDropLocation('');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              Book Another Vehicle
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Title Card */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 p-6 sm:p-8 text-white shadow-lg space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30">
              <Bus className="h-3.5 w-3.5" /> Official Transport Booking Requisition Form
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Reserve College Fleet Vehicle
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Submit your requisition for institutional academic visits, conferences, placement drives, and official transfers.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Vehicle Selection */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Bus className="h-4 w-4 text-blue-600" /> 1. Select Vehicle from Sairam Fleet
                </h3>

                {loadingVehicles ? (
                  <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {vehicles.map((v) => (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          selectedVehicleId === v.id
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                              {v.vehicleType}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {v.registrationNo}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {v.name}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{v.capacity} Seats</span>
                          <span className={v.acAvailable ? 'text-emerald-600 font-semibold' : ''}>
                            {v.acAvailable ? 'AC' : 'Non-AC'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Trip Itinerary */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" /> 2. Trip Details &amp; Destination
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Trip Title / Event Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={tripTitle}
                      onChange={(e) => setTripTitle(e.target.value)}
                      placeholder="e.g. Industrial Visit to ISRO Bengaluru / VTU Youth Fest Transfer"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Purpose of Requisition *
                      </label>
                      <select
                        value={tripPurpose}
                        onChange={(e) => setTripPurpose(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="INDUSTRIAL_VISIT">Academic / Industrial Visit</option>
                        <option value="CONFERENCE">National/International Conference</option>
                        <option value="SPORTS_MEET">Sports Meet / Tournament</option>
                        <option value="GUEST_TRANSFER">VIP / Chief Guest / Recruiter Transfer</option>
                        <option value="CAMPUS_LOGISTICS">College Logistics &amp; Transport</option>
                        <option value="OTHER">Other Official Purpose</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Number of Passengers *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={selectedVehicle?.capacity || 60}
                        required
                        value={passengerCount}
                        onChange={(e) => setPassengerCount(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Max capacity for selected vehicle is {selectedVehicle?.capacity || 0} passengers.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Pickup Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        placeholder="Campus Gate 1 / Faculty Hostel"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Drop / Destination Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={dropLocation}
                        onChange={(e) => setDropLocation(e.target.value)}
                        placeholder="e.g. HAL Aerospace Museum / Bengaluru Airport"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Date & Timing */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" /> 3. Schedule &amp; Timings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Departure Date *
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      required
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (!endDate || endDate < e.target.value) {
                          setEndDate(e.target.value);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Return Date (Optional, same day by default)
                    </label>
                    <input
                      type="date"
                      min={startDate || todayStr}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Departure Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expected Return Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Coordinator & Requirements */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" /> 4. Faculty Coordinator &amp; Options
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Faculty In-Charge Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={coordinatorName}
                      onChange={(e) => setCoordinatorName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Mobile Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={coordinatorPhone}
                      onChange={(e) => setCoordinatorPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Special Requisition Preferences:
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      'Luggage Space Required',
                      'First-Aid Kit Pre-Check',
                      'Multiple Pick-up Points',
                      'Toll/FASTag Clearance',
                    ].map((opt) => (
                      <label
                        key={opt}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                          specialRequirements.includes(opt)
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={specialRequirements.includes(opt)}
                          onChange={() => handleRequirementToggle(opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Additional Instructions / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Provide details about route stops, guest designations, or special instructions..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Right 1 Col: Summary & Actions */}
            <div className="space-y-6">
              {selectedVehicle && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 sticky top-24">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Vehicle Requisition Summary
                  </h4>

                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <img
                      src={
                        selectedVehicle.image ||
                        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={selectedVehicle.name}
                      className="h-32 w-full object-cover"
                    />
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {selectedVehicle.name}
                      </div>
                      <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                        {selectedVehicle.registrationNo}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <div className="flex justify-between">
                      <span>Vehicle Type:</span>
                      <strong className="text-slate-900 dark:text-white">{selectedVehicle.vehicleType}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Capacity:</span>
                      <strong className="text-slate-900 dark:text-white">{selectedVehicle.capacity} Persons</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Air Conditioning:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {selectedVehicle.acAvailable ? 'Equipped (AC)' : 'Non-AC'}
                      </strong>
                    </div>
                    {selectedVehicle.driverName && (
                      <div className="flex justify-between">
                        <span>Designated Driver:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedVehicle.driverName}</strong>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                    >
                      {submitting ? 'Submitting Requisition...' : 'Submit Trip Requisition'}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                      Approvals are processed by the Transport Office within 24 hours.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default VehicleBookingPage;
