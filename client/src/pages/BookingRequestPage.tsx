import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Car,
  Bus,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  ArrowLeft,
  FileCheck,
  FileText,
  X,
  ShieldCheck,
  MapPin,
  Clock,
  Compass,
  FileUp,
  Fuel,
  Check,
  ArrowRight,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Vehicle, Department, AvailabilityDayInfo } from '../types';

export const BookingRequestPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  // Field display labels for missing requirements banner
  const FIELD_LABELS: Record<string, string> = {
    pickupLocation: 'Pickup Location',
    dropLocation: 'Destination / Drop Location',
    tripTitle: 'Trip Title / Purpose',
    tripPurpose: 'Purpose Category',
    departmentId: 'Hosting Department',
    startDate: 'Trip Departure Date',
    endDate: 'Return Date',
    departureTime: 'Departure Time',
    returnTime: 'Expected Return Time',
    vehicleId: 'Vehicle Selection',
    coordinatorName: 'Coordinator Name',
    coordinatorPhone: 'Coordinator Mobile Number',
    email: 'Notification Email',
    acceptedTerms: 'Institutional Undertaking',
  };

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const getInputClass = (fieldName: string, extraClasses = 'px-4') => {
    const isInvalid = !!fieldErrors[fieldName];
    return `w-full ${extraClasses} py-2.5 rounded-xl text-xs font-medium outline-hidden transition ${
      isInvalid
        ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 placeholder:text-rose-400'
        : 'border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500'
    }`;
  };

  const scrollToField = (fieldKey: string) => {
    const el = document.getElementById(`field-${fieldKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
      ) {
        el.focus();
      }
    }
  };

  // Live availability data mapped by date -> vehicleId -> AvailabilityDayInfo
  const [liveAvailability, setLiveAvailability] = useState<Record<string, Record<string, AvailabilityDayInfo>>>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [vehicleCategoryFilter, setVehicleCategoryFilter] = useState<'ALL' | 'BUS' | 'CAR' | 'VAN'>('ALL');

  const todayIso = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const initialDateParam = searchParams.get('date');
  const safeInitialDate = initialDateParam && initialDateParam >= todayIso ? initialDateParam : todayIso;

  const initialPickup = searchParams.get('pickup') || 'Sri Sairam College Campus Main Gate 1';
  const initialDrop = searchParams.get('drop') || searchParams.get('destination') || '';
  const initialTitle = searchParams.get('title') || searchParams.get('tripTitle') || '';
  const initialDepTime = searchParams.get('departureTime') || searchParams.get('time') || '08:30';
  const initialKm = searchParams.get('distance') || searchParams.get('km');
  const initialPax = searchParams.get('passengers');

  // Step 1: Trip Route & Logistics Form State
  const [pickupLocation, setPickupLocation] = useState<string>(initialPickup);
  const [dropLocation, setDropLocation] = useState<string>(initialDrop);
  const [tripTitle, setTripTitle] = useState<string>(initialTitle);
  const [tripPurpose, setTripPurpose] = useState<string>('INDUSTRIAL_VISIT');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [passengerCount, setPassengerCount] = useState<number>(initialPax ? (parseInt(initialPax, 10) || 15) : 15);
  const [estimatedKilometers, setEstimatedKilometers] = useState<number | ''>(initialKm ? (parseInt(initialKm, 10) || 60) : 60);
  const [tollPaymentRequired, setTollPaymentRequired] = useState<boolean>(true);

  // Schedule State
  const [startDate, setStartDate] = useState<string>(safeInitialDate);
  const [isMultiDay, setIsMultiDay] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>(initialDepTime);
  const [returnTime, setReturnTime] = useState<string>('17:30');

  // Step 2: Selected Vehicle State
  const [vehicleId, setVehicleId] = useState<string>('');

  // Step 3: Traveling Faculty Coordinator
  const [coordinatorName, setCoordinatorName] = useState<string>(user?.name || '');
  const [coordinatorPhone, setCoordinatorPhone] = useState<string>(user?.phone || '');
  const [email, setEmail] = useState<string>(user?.email || '');

  // Step 4: Special Requirements & Attachments
  const [specialRequirements, setSpecialRequirements] = useState<string[]>(['FASTag / Toll Pass Required']);
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  // Common Institutional Destination Hubs
  const COMMON_DESTINATIONS = [
    'ISRO Satellite Centre, Bengaluru',
    'Kempegowda International Airport (BLR) T2',
    'HAL Aerospace Heritage Centre',
    'Electronic City IT Park, Phase 1',
    'VTU Regional Centre, Nagarbhavi',
    'Bengaluru City Railway Station (SBC)',
  ];

  const loadFormData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, deptsData] = await Promise.all([
        apiRequest<Vehicle[]>('/vehicles'),
        apiRequest<Department[]>('/users/departments'),
      ]);
      setVehicles(vehiclesData);
      setDepartments(deptsData);

      const targetVehicleParam = searchParams.get('vehicle') || searchParams.get('hall') || searchParams.get('vehicleId');
      const targetTypeParam = searchParams.get('type');
      const targetPaxParam = searchParams.get('passengers');
      const targetPickup = searchParams.get('pickup');
      const targetDrop = searchParams.get('drop') || searchParams.get('destination');
      const targetTitle = searchParams.get('title') || searchParams.get('tripTitle');
      const targetTime = searchParams.get('departureTime') || searchParams.get('time');
      const targetKm = searchParams.get('distance') || searchParams.get('km');

      if (targetPickup) setPickupLocation(targetPickup);
      if (targetDrop) setDropLocation(targetDrop);
      if (targetTitle) setTripTitle(targetTitle);
      if (targetTime) setDepartureTime(targetTime);
      if (targetKm) {
        const kmNum = parseInt(targetKm, 10);
        if (!isNaN(kmNum)) setEstimatedKilometers(kmNum);
      }
      if (targetPaxParam) {
        const paxNum = parseInt(targetPaxParam, 10);
        if (!isNaN(paxNum) && paxNum > 0) setPassengerCount(paxNum);
      }

      let chosenVehicleId = '';
      if (targetVehicleParam && vehiclesData.length > 0) {
        const queryLower = targetVehicleParam.toLowerCase();
        const found = vehiclesData.find(
          (v: Vehicle) =>
            v.id.toLowerCase() === queryLower ||
            v.name.toLowerCase().includes(queryLower) ||
            (v.code && v.code.toLowerCase() === queryLower) ||
            (v.registrationNo && v.registrationNo.toLowerCase() === queryLower)
        );
        if (found) chosenVehicleId = found.id;
      }

      if (!chosenVehicleId && targetTypeParam && vehiclesData.length > 0) {
        const foundByType = vehiclesData.find((v) => v.vehicleType === targetTypeParam);
        if (foundByType) chosenVehicleId = foundByType.id;
      }

      if (!chosenVehicleId && vehiclesData.length > 0) {
        chosenVehicleId = vehiclesData[0].id;
      }
      setVehicleId(chosenVehicleId);

      const defaultDept = user?.departmentId || (deptsData.length > 0 ? deptsData[0].id : '');
      setDepartmentId(defaultDept);

      if (user?.name && !coordinatorName) setCoordinatorName(user.name);
      if (user?.phone && !coordinatorPhone) setCoordinatorPhone(user.phone);
      if (user?.email && !email) setEmail(user.email);
    } catch (err: any) {
      setError(err.message || 'Failed to load fleet form data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFormData();
  }, []);

  // Real-time Vehicle Availability & Conflict Check on Date/Time Change
  useEffect(() => {
    const checkLiveFleetAvailability = async () => {
      if (!startDate) return;
      try {
        setCheckingAvailability(true);
        const endQuery = isMultiDay && endDate ? endDate : startDate;
        const res = await apiRequest<{ availability: Record<string, Record<string, AvailabilityDayInfo>> }>(
          `/availability?startDate=${startDate}&endDate=${endQuery}`
        );
        setLiveAvailability(res.availability || {});
      } catch (err) {
        console.warn('Real-time availability check error:', err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkLiveFleetAvailability();
  }, [startDate, endDate, isMultiDay, departureTime, returnTime]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds maximum 10MB limit.');
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setAttachmentUrl(data.url);
      setUploadedFileName(data.originalName || file.name);
    } catch (err: any) {
      alert(err.message || 'Failed to upload sanction document.');
    } finally {
      setUploadingFile(false);
    }
  };

  const toggleReq = (reqLabel: string) => {
    setSpecialRequirements((prev) =>
      prev.includes(reqLabel) ? prev.filter((r) => r !== reqLabel) : [...prev, reqLabel]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationErrors: Record<string, string> = {};

    if (!pickupLocation.trim()) {
      validationErrors.pickupLocation = 'Pickup location / Starting bay is required.';
    }
    if (!dropLocation.trim()) {
      validationErrors.dropLocation = 'Destination address / Drop location is required.';
    }
    if (!tripTitle.trim()) {
      validationErrors.tripTitle = 'Trip title / Academic purpose is required.';
    }
    if (!tripPurpose.trim()) {
      validationErrors.tripPurpose = 'Trip purpose category is required.';
    }
    if (!departmentId) {
      validationErrors.departmentId = 'Hosting department is required.';
    }
    if (!startDate) {
      validationErrors.startDate = 'Trip departure date is required.';
    }
    if (isMultiDay && !endDate) {
      validationErrors.endDate = 'Return date is required for multi-day trips.';
    }
    if (!departureTime) {
      validationErrors.departureTime = 'Departure time is required.';
    }
    if (!returnTime) {
      validationErrors.returnTime = 'Expected return time is required.';
    }
    if (!vehicleId) {
      validationErrors.vehicleId = 'Please select an available campus vehicle from the fleet below.';
    } else {
      // Check if the selected vehicle is currently booked
      const dayData = liveAvailability[startDate]?.[vehicleId];
      const isBooked = dayData?.status === 'BOOKED' || dayData?.hasApproved;
      if (isBooked) {
        validationErrors.vehicleId = 'The chosen vehicle is already reserved for another official booking on this schedule. Please select another available vehicle.';
      }
    }

    if (!coordinatorName.trim()) {
      validationErrors.coordinatorName = 'Coordinator faculty name is required.';
    }
    const cleanPhone = coordinatorPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      validationErrors.coordinatorPhone = 'Please enter a valid 10-digit coordinator mobile phone number.';
    }
    if (!email.trim() || !email.includes('@')) {
      validationErrors.email = 'Valid institutional notification email is required.';
    }
    if (!acceptedTerms) {
      validationErrors.acceptedTerms = 'You must accept the institutional transport regulations to submit.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      const count = Object.keys(validationErrors).length;
      setError(`Please complete all ${count} required field${count > 1 ? 's' : ''} highlighted in red below.`);

      const firstKey = Object.keys(validationErrors)[0];
      scrollToField(firstKey);
      return;
    }

    setFieldErrors({});

    try {
      setSubmitting(true);
      const payload = {
        vehicleId,
        hallId: vehicleId,
        tripTitle: tripTitle.trim(),
        eventName: tripTitle.trim(),
        tripPurpose,
        purpose: tripPurpose,
        pickupLocation: pickupLocation.trim(),
        dropLocation: dropLocation.trim(),
        departmentId: departmentId || null,
        startDate,
        bookingDate: startDate,
        endDate: isMultiDay && endDate ? endDate : null,
        departureTime,
        startTime: departureTime,
        returnTime,
        endTime: returnTime,
        passengerCount: Number(passengerCount) || 1,
        participantCount: Number(passengerCount) || 1,
        estimatedKilometers: Number(estimatedKilometers) || 0,
        tollPaymentRequired,
        coordinatorName: coordinatorName.trim(),
        coordinatorPhone: coordinatorPhone.trim(),
        contactNumber: coordinatorPhone.trim(),
        phone: coordinatorPhone.trim(),
        email: email.trim(),
        specialRequirements,
        attachmentUrl: attachmentUrl || null,
        additionalNotes: additionalNotes.trim() || null,
      };

      const res = await apiRequest<{ booking: any; bookingId?: string }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const confirmedId = res.bookingId || res.booking?.bookingId;
      setSuccessBookingId(confirmedId);

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      if (err.fieldErrors && typeof err.fieldErrors === 'object') {
        setFieldErrors(err.fieldErrors);
        const firstKey = Object.keys(err.fieldErrors)[0];
        scrollToField(firstKey);
      }
      setError(err.message || 'Failed to submit transport requisition.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVehicleObj = vehicles.find((v) => v.id === vehicleId);

  // Compute live vehicle statistics for current route & schedule
  const fleetAvailabilityList = vehicles.map((v) => {
    const dayData = liveAvailability[startDate]?.[v.id];
    const isBooked = dayData?.status === 'BOOKED' || dayData?.hasApproved;
    const isPending = dayData?.status === 'PENDING' || dayData?.hasPending;
    const isMaintenance = dayData?.status === 'MAINTENANCE';
    const isHoliday = dayData?.status === 'HOLIDAY';

    let availabilityState: 'AVAILABLE' | 'BOOKED' | 'PENDING' | 'MAINTENANCE' = 'AVAILABLE';
    let statusLabel = 'Available / Free';
    let conflictDetails = '';

    if (isBooked) {
      availabilityState = 'BOOKED';
      statusLabel = 'Already Booked';
      conflictDetails = dayData?.tripTitle || dayData?.eventName || 'Official Department Tour';
    } else if (isPending) {
      availabilityState = 'PENDING';
      statusLabel = 'Pending Review';
      conflictDetails = dayData?.tripTitle || dayData?.eventName || 'Awaiting Requisition Approval';
    } else if (isMaintenance) {
      availabilityState = 'MAINTENANCE';
      statusLabel = 'In Garage / Maintenance';
      conflictDetails = dayData?.reason || 'Scheduled Inspection';
    }

    return {
      vehicle: v,
      state: availabilityState,
      statusLabel,
      conflictDetails,
      dayData,
    };
  });

  const availableCount = fleetAvailabilityList.filter((item) => item.state === 'AVAILABLE').length;
  const bookedCount = fleetAvailabilityList.filter((item) => item.state === 'BOOKED').length;

  // Filtered by vehicle category
  const filteredFleetList = fleetAvailabilityList.filter((item) => {
    if (vehicleCategoryFilter === 'ALL') return true;
    return item.vehicle.vehicleType === vehicleCategoryFilter;
  });

  if (successBookingId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Requisition Submitted Successfully
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Vehicle Booking Registered
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your trip requisition has been recorded and submitted to the Transport Logistics Desk.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-3">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
            Official Requisition Voucher ID
          </span>
          <span className="font-mono text-2xl font-black text-blue-600 dark:text-amber-400 block">
            {successBookingId}
          </span>
          <p className="text-xs text-slate-500">
            Route: <strong>{pickupLocation}</strong> ➔ <strong>{dropLocation}</strong> on <strong>{startDate}</strong>.
            Upon review, your Transport Security Gate Pass with QR verification will be generated.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <button
            onClick={() => navigate('/user/bookings')}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
          >
            Track My Requisitions
          </button>
          <button
            onClick={() => {
              setSuccessBookingId(null);
              setTripTitle('');
              setDropLocation('');
            }}
            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs transition"
          >
            Submit Another Requisition
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <Car className="w-3.5 h-3.5" />
          <span>Institutional Mobility &amp; Charter Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Vehicle Requisition &amp; Live Availability Checker
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Reserve Sri Sairam College of Engineering staff cars, buses, or vans. Enter your route locations to inspect real-time fleet availability.
        </p>
      </div>

      {error && (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 shadow-md space-y-3 animate-fadeIn">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-100">
                  Missing Required Information
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  {error}
                </p>
              </div>
            </div>
            {Object.keys(fieldErrors).length > 0 && (
              <button
                type="button"
                onClick={() => scrollToField(Object.keys(fieldErrors)[0])}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition shrink-0 cursor-pointer"
              >
                Go to Missing Field ↓
              </button>
            )}
          </div>

          {Object.keys(fieldErrors).length > 0 && (
            <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mr-1">
                Please complete:
              </span>
              {Object.keys(fieldErrors).map((fKey) => (
                <button
                  key={fKey}
                  type="button"
                  onClick={() => scrollToField(fKey)}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 transition flex items-center gap-1 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>{FIELD_LABELS[fKey] || fKey}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* ======================================================== */}
        {/* STEP 1: Route Corridor & Travel Schedule */}
        {/* ======================================================== */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Trip Route &amp; Travel Schedule (Where to Where)</span>
            </h2>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Live Fleet Checker Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pickup Location */}
            <div id="field-pickupLocation">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                From: Pickup Point / Starting Bay *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => {
                    setPickupLocation(e.target.value);
                    clearFieldError('pickupLocation');
                  }}
                  placeholder="e.g. Sri Sairam College Campus Main Gate 1"
                  className={getInputClass('pickupLocation', 'pl-10 pr-4')}
                />
              </div>
              {fieldErrors.pickupLocation && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.pickupLocation}</span>
                </p>
              )}
            </div>

            {/* Drop Location */}
            <div id="field-dropLocation">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                To: Destination Address / Drop Location *
              </label>
              <div className="relative">
                <Compass className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={dropLocation}
                  onChange={(e) => {
                    setDropLocation(e.target.value);
                    clearFieldError('dropLocation');
                  }}
                  placeholder="e.g. ISRO Satellite Centre, Old Airport Road, Bengaluru"
                  className={getInputClass('dropLocation', 'pl-10 pr-4')}
                />
              </div>
              {fieldErrors.dropLocation && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.dropLocation}</span>
                </p>
              )}
            </div>

            {/* Quick Common Destinations */}
            <div className="sm:col-span-2 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Quick Destination Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_DESTINATIONS.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => {
                      setDropLocation(dest);
                      clearFieldError('dropLocation');
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-medium cursor-pointer ${
                      dropLocation.toLowerCase() === dest.toLowerCase()
                        ? 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>

            {/* Trip Title */}
            <div id="field-tripTitle" className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Trip Title / Academic Purpose *
              </label>
              <input
                type="text"
                value={tripTitle}
                onChange={(e) => {
                  setTripTitle(e.target.value);
                  clearFieldError('tripTitle');
                }}
                placeholder="e.g. Department of Mechanical Engineering - Industrial Visit to ISRO"
                className={getInputClass('tripTitle', 'px-4')}
              />
              {fieldErrors.tripTitle && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.tripTitle}</span>
                </p>
              )}
            </div>

            {/* Purpose & Hosting Department */}
            <div id="field-tripPurpose">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Purpose Category *
              </label>
              <select
                value={tripPurpose}
                onChange={(e) => {
                  setTripPurpose(e.target.value);
                  clearFieldError('tripPurpose');
                }}
                className={getInputClass('tripPurpose', 'px-4')}
              >
                <option value="INDUSTRIAL_VISIT">Industrial Visit / Study Tour</option>
                <option value="GUEST_TRANSFER">VIP / Guest Speaker Pick &amp; Drop</option>
                <option value="SPORTS_MEET">VTU Sports Meet / Athletics Tournament</option>
                <option value="CONFERENCE">National Conference / Symposium</option>
                <option value="EXCURSION">Student Excursion / Campus Tour</option>
                <option value="OFFICIAL_DUTY">University Official Examination Duty</option>
                <option value="EMERGENCY">Emergency / Hospital Transfer</option>
              </select>
              {fieldErrors.tripPurpose && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.tripPurpose}</span>
                </p>
              )}
            </div>

            <div id="field-departmentId">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Hosting Department *
              </label>
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  clearFieldError('departmentId');
                }}
                className={getInputClass('departmentId', 'px-4')}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              {fieldErrors.departmentId && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.departmentId}</span>
                </p>
              )}
            </div>

            {/* Date & Shift Times */}
            <div id="field-startDate">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Trip Date *
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMultiDay}
                    onChange={(e) => setIsMultiDay(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Multi-Day</span>
                </label>
              </div>
              <input
                type="date"
                min={todayIso}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  clearFieldError('startDate');
                }}
                className={getInputClass('startDate', 'px-4')}
              />
              {fieldErrors.startDate && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.startDate}</span>
                </p>
              )}
            </div>

            {isMultiDay && (
              <div id="field-endDate">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Return Date *
                </label>
                <input
                  type="date"
                  min={startDate || todayIso}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    clearFieldError('endDate');
                  }}
                  className={getInputClass('endDate', 'px-4')}
                />
                {fieldErrors.endDate && (
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.endDate}</span>
                  </p>
                )}
              </div>
            )}

            <div id="field-departureTime">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Departure Time *
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => {
                  setDepartureTime(e.target.value);
                  clearFieldError('departureTime');
                }}
                className={getInputClass('departureTime', 'px-4')}
              />
              {fieldErrors.departureTime && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.departureTime}</span>
                </p>
              )}
            </div>

            <div id="field-returnTime">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Expected Return Time *
              </label>
              <input
                type="time"
                value={returnTime}
                onChange={(e) => {
                  setReturnTime(e.target.value);
                  clearFieldError('returnTime');
                }}
                className={getInputClass('returnTime', 'px-4')}
              />
              {fieldErrors.returnTime && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.returnTime}</span>
                </p>
              )}
            </div>

            {/* Passenger Count & Distance */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Passengers
              </label>
              <input
                type="number"
                min={1}
                max={selectedVehicleObj?.capacity || 60}
                value={passengerCount}
                onChange={(e) => setPassengerCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Est. Round-Trip Distance (KM)
              </label>
              <input
                type="number"
                value={estimatedKilometers}
                onChange={(e) => setEstimatedKilometers(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 60"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* STEP 2: Real-Time Fleet Availability Checker & Selection */}
        {/* ======================================================== */}
        <div
          id="field-vehicleId"
          className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all ${
            fieldErrors.vehicleId
              ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10'
              : 'border-slate-200 dark:border-slate-800 shadow-xs'
          } space-y-5`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>Select Available Vehicle (Live Fleet Status)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Shows which campus buses, vans, and cars are already booked vs. free for your route on <strong>{startDate}</strong>.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setVehicleCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  vehicleCategoryFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All Fleet ({fleetAvailabilityList.length})
              </button>
              <button
                type="button"
                onClick={() => setVehicleCategoryFilter('BUS')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  vehicleCategoryFilter === 'BUS'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Buses
              </button>
              <button
                type="button"
                onClick={() => setVehicleCategoryFilter('CAR')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  vehicleCategoryFilter === 'CAR'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Cars
              </button>
              <button
                type="button"
                onClick={() => setVehicleCategoryFilter('VAN')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  vehicleCategoryFilter === 'VAN'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Vans
              </button>
            </div>
          </div>

          {/* Missing Vehicle Warning Alert Banner */}
          {fieldErrors.vehicleId && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-bounce">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{fieldErrors.vehicleId}</span>
            </div>
          )}

          {/* Real-Time Route & Availability Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Route Corridor &amp; Window:
                </span>
                <span className="font-semibold text-white">
                  {pickupLocation || 'Campus Gate 1'} ➔ {dropLocation || 'Destination'} ({startDate}, {departureTime} - {returnTime})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{availableCount} Vehicles Free</span>
              </span>
              {bookedCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  <span>{bookedCount} Booked</span>
                </span>
              )}
            </div>
          </div>

          {/* Vehicle Cards Grid with Live Status Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFleetList.map(({ vehicle: v, state, statusLabel, conflictDetails }) => {
              const isSelected = vehicleId === v.id;
              const isBooked = state === 'BOOKED';
              const isPending = state === 'PENDING';
              const isMaintenance = state === 'MAINTENANCE';
              const isAvailable = state === 'AVAILABLE';

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    if (isBooked) {
                      alert(`Notice: ${v.name} is already booked on ${startDate} for: "${conflictDetails}". Please choose an available vehicle.`);
                      return;
                    }
                    setVehicleId(v.id);
                    clearFieldError('vehicleId');
                  }}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-2.5 relative cursor-pointer ${
                    isBooked
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 opacity-80'
                      : isSelected
                      ? 'border-blue-600 dark:border-amber-400 ring-2 ring-blue-600/30 dark:ring-amber-400/30 bg-blue-50/60 dark:bg-blue-950/40 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800/70'
                  }`}
                >
                  <div>
                    {/* Top Status Badge */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {v.vehicleType}
                      </span>

                      {isAvailable && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <Check className="w-3 h-3" />
                          <span>AVAILABLE (FREE)</span>
                        </span>
                      )}

                      {isBooked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3" />
                          <span>ALREADY BOOKED</span>
                        </span>
                      )}

                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>PENDING REVIEW</span>
                        </span>
                      )}

                      {isMaintenance && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          <span>MAINTENANCE</span>
                        </span>
                      )}
                    </div>

                    {/* Vehicle Title & Reg */}
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                      {v.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{v.registrationNo}</p>

                    {/* Conflict Explanation if Booked */}
                    {isBooked && (
                      <div className="mt-2 p-2 rounded-xl bg-rose-100/70 dark:bg-rose-900/40 text-[10px] text-rose-800 dark:text-rose-200">
                        <strong>Reserved:</strong> {conflictDetails}
                      </div>
                    )}
                  </div>

                  {/* Footer Specs & Driver */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-500" />
                      <span>{v.capacity} Seats</span>
                    </span>

                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {isSelected ? '✓ Selected' : isBooked ? 'Unavailable' : 'Click to Pick'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* STEP 3: Traveling Faculty Coordinator Credentials */}
        {/* ======================================================== */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
              3
            </span>
            <span>Traveling Faculty Coordinator</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div id="field-coordinatorName">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Coordinator Name *
              </label>
              <input
                type="text"
                value={coordinatorName}
                onChange={(e) => {
                  setCoordinatorName(e.target.value);
                  clearFieldError('coordinatorName');
                }}
                placeholder="Dr. / Prof. Full Name"
                className={getInputClass('coordinatorName', 'px-4')}
              />
              {fieldErrors.coordinatorName && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.coordinatorName}</span>
                </p>
              )}
            </div>

            <div id="field-coordinatorPhone">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={coordinatorPhone}
                onChange={(e) => {
                  setCoordinatorPhone(e.target.value);
                  clearFieldError('coordinatorPhone');
                }}
                placeholder="+91 98765 43210"
                className={getInputClass('coordinatorPhone', 'px-4')}
              />
              {fieldErrors.coordinatorPhone && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.coordinatorPhone}</span>
                </p>
              )}
            </div>

            <div id="field-email">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Notification Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                placeholder="coordinator@sairam.edu.in"
                className={getInputClass('email', 'px-4')}
              />
              {fieldErrors.email && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* STEP 4: Special Requirements & Sanction Letter */}
        {/* ======================================================== */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
              4
            </span>
            <span>Special Requirements &amp; Sanction Letter</span>
          </h2>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Fleet Options &amp; Requisitions
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'FASTag / Toll Pass Required',
                'Extra Luggage Space',
                'Night Halt Sanctioned',
                'Air Conditioning Mandatory',
                'Student Name List Attached',
                'First Aid Box Required',
              ].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleReq(opt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                    specialRequirements.includes(opt)
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Upload HOD / Principal Sanction Letter (PDF or Image, Max 10MB)
            </label>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 cursor-pointer text-xs font-semibold flex items-center gap-2 bg-slate-50 dark:bg-slate-800">
                <FileUp className="w-4 h-4 text-blue-500" />
                <span>{uploadingFile ? 'Uploading...' : 'Choose Sanction Document'}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {uploadedFileName && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{uploadedFileName}</span>
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Additional Route Notes / Waypoints
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Pickup 10 students at Electronic City toll gate on route"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* STEP 5: Undertaking & Submission */}
        {/* ======================================================== */}
        <div
          id="field-acceptedTerms"
          className={`p-6 rounded-3xl border transition-all ${
            fieldErrors.acceptedTerms
              ? 'border-2 border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 shadow-md shadow-rose-500/10'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
          } space-y-4`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (e.target.checked) clearFieldError('acceptedTerms');
              }}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              I hereby certify that this vehicle requisition is for authorized academic/institutional purposes of Sri Sairam College of Engineering. As faculty coordinator, I will oversee passenger decorum, verify gate departure headcount, and certify the driver trip sheet upon return.
            </span>
          </label>
          {fieldErrors.acceptedTerms && (
            <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.acceptedTerms}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting Requisition...' : 'Submit Vehicle Requisition'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingRequestPage;
