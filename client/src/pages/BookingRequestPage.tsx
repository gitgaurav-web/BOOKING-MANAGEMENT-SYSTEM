import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  ArrowLeft,
  FileCheck,
  FileText,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Hall, Department } from '../types';

export const BookingRequestPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [halls, setHalls] = useState<Hall[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  // Form State
  const [hallId, setHallId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>(searchParams.get('date') || '');
  const [isMultiDay, setIsMultiDay] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<string>('');
  const initialSlot = searchParams.get('slot') || 'FULL_DAY';
  const [bookingType, setBookingType] = useState<string>(initialSlot);
  const [startTime, setStartTime] = useState<string>(
    initialSlot === 'MORNING' ? '09:00' : initialSlot === 'AFTERNOON' ? '13:00' : '09:00'
  );
  const [endTime, setEndTime] = useState<string>(
    initialSlot === 'MORNING' ? '13:00' : initialSlot === 'AFTERNOON' ? '17:00' : '17:00'
  );
  const [eventName, setEventName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [participantCount, setParticipantCount] = useState<number>(100);
  const [coordinatorName, setCoordinatorName] = useState<string>(user?.name || '');
  const [contactNumber, setContactNumber] = useState<string>(user?.phone || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [specialRequirements, setSpecialRequirements] = useState<string[]>([
    'Projector',
    'Microphone',
    'AC',
  ]);
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  const clearFieldError = (fieldKey: string) => {
    if (fieldErrors[fieldKey]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
    if (error) {
      setError(null);
    }
  };

  const loadFormData = async () => {
    try {
      setLoading(true);
      const [hallsData, deptsData] = await Promise.all([
        apiRequest<Hall[]>('/halls'),
        apiRequest<Department[]>('/users/departments'),
      ]);
      setHalls(hallsData);
      setDepartments(deptsData);

      const targetHallParam = searchParams.get('hall');
      let chosenHallId = '';
      if (targetHallParam && hallsData.length > 0) {
        const found = hallsData.find(
          (h) =>
            h.name.toLowerCase().includes(targetHallParam.toLowerCase()) ||
            h.id === targetHallParam
        );
        if (found) {
          chosenHallId = found.id;
        }
      }
      if (!chosenHallId && hallsData.length > 0) {
        chosenHallId = hallsData[0].id;
      }
      setHallId(chosenHallId);

      const defaultDept = user?.departmentId || (deptsData.length > 0 ? deptsData[0].id : '');
      setDepartmentId(defaultDept);

      if (user?.name && !coordinatorName) setCoordinatorName(user.name);
      if (user?.phone && !contactNumber) setContactNumber(user.phone);
      if (user?.email && !email) setEmail(user.email);
    } catch (err: any) {
      setError(err.message || 'Failed to load form dependencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFormData();
  }, []);

  const handleBookingTypeChange = (type: string) => {
    setBookingType(type);
    clearFieldError('bookingType');
    clearFieldError('startTime');
    clearFieldError('endTime');
    if (type === 'FULL_DAY') {
      setStartTime('09:00');
      setEndTime('17:00');
    } else if (type === 'MORNING') {
      setStartTime('09:00');
      setEndTime('13:00');
    } else if (type === 'AFTERNOON') {
      setStartTime('13:00');
      setEndTime('17:00');
    }
  };

  const toggleRequirement = (req: string) => {
    if (specialRequirements.includes(req)) {
      setSpecialRequirements(specialRequirements.filter((r) => r !== req));
    } else {
      setSpecialRequirements([...specialRequirements, req]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      setAttachmentUrl(data.url);
      setUploadedFileName(data.originalName || file.name);
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!hallId) {
      errors.hallId = 'Please select a facility hall.';
    }

    if (!bookingDate) {
      errors.bookingDate = 'Reservation date is required.';
    }

    if (isMultiDay) {
      if (!endDate) {
        errors.endDate = 'End date is required for multi-day events.';
      } else if (endDate < bookingDate) {
        errors.endDate = 'End date cannot be earlier than start date.';
      }
    }

    if (bookingType === 'CUSTOM') {
      if (!startTime) {
        errors.startTime = 'Start time is required for custom times.';
      }
      if (!endTime) {
        errors.endTime = 'End time is required for custom times.';
      }
      if (startTime && endTime && startTime >= endTime) {
        errors.endTime = 'End time must be after start time.';
      }
    }

    if (!eventName.trim()) {
      errors.eventName = 'Event Name / Title is required.';
    }

    if (!departmentId) {
      errors.departmentId = 'Host department is required.';
    }

    if (!purpose.trim()) {
      errors.purpose = 'Purpose of reservation is required.';
    }

    if (!coordinatorName.trim()) {
      errors.coordinatorName = 'Coordinator name is required.';
    }

    if (!contactNumber.trim()) {
      errors.contactNumber = 'Contact phone number is required.';
    } else if (!/^[0-9+\s-]{8,15}$/.test(contactNumber.trim())) {
      errors.contactNumber = 'Please provide a valid contact number (8 to 15 digits).';
    }

    if (!email.trim()) {
      errors.email = 'Official email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid institutional email address.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const fieldLabels: Record<string, string> = {
        hallId: 'Facility Hall',
        bookingDate: 'Reservation Date',
        endDate: 'Multi-Day End Date',
        startTime: 'Start Time',
        endTime: 'End Time',
        eventName: 'Event Name / Title',
        departmentId: 'Host Department',
        purpose: 'Purpose of Reservation',
        coordinatorName: 'Coordinator Name',
        contactNumber: 'Contact Phone Number',
        email: 'Official Email Address',
      };

      const missingList = Object.keys(errors)
        .map((k) => fieldLabels[k] || k)
        .join(', ');

      setError(`Please complete the following required fields: ${missingList}.`);

      // Automatically scroll to the first invalid field
      const firstFieldKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstFieldKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }

      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      navigate('/login?redirect=/book');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        hallId,
        bookingDate,
        endDate: isMultiDay && endDate ? endDate : null,
        bookingType,
        startTime,
        endTime,
        eventName: eventName.trim(),
        description: description.trim(),
        purpose: purpose.trim(),
        departmentId: departmentId || null,
        participantCount: Number(participantCount) > 0 ? Number(participantCount) : 50,
        coordinatorName: coordinatorName.trim(),
        contactNumber: contactNumber.trim(),
        email: email.trim(),
        specialRequirements,
        attachmentUrl: attachmentUrl || null,
        additionalNotes: additionalNotes.trim(),
      };

      const res = await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccessBookingId(res.bookingId);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successBookingId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Booking Request Submitted!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Your reservation request has been registered and is waiting for administrator approval.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto text-left space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-semibold uppercase">Booking ID</span>
            <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">
              {successBookingId}
            </span>
          </div>
          <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
            <p>
              <strong className="text-slate-800 dark:text-slate-200">Hall:</strong>{' '}
              {halls.find((h) => h.id === hallId)?.name}
            </p>
            <p>
              <strong className="text-slate-800 dark:text-slate-200">Date:</strong> {bookingDate}
            </p>
            <p>
              <strong className="text-slate-800 dark:text-slate-200">Slot:</strong> {startTime} -{' '}
              {endTime} ({bookingType.replace('_', ' ')})
            </p>
            <p>
              <strong className="text-slate-800 dark:text-slate-200">Event:</strong> {eventName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => navigate('/user/bookings')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-md"
          >
            Track in My Bookings
          </button>
          <button
            onClick={() => navigate('/availability')}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
          >
            Check Calendar
          </button>
        </div>
      </div>
    );
  }

  const selectedHallObj = halls.find((h) => h.id === hallId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Request Facility Booking
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Reserve Seminar Hall or AV Hall for institutional programs. Capacity is purely informational—the entire facility is booked for your approved date.
        </p>
      </div>

      {error && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs shadow-sm space-y-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-sm text-rose-900 dark:text-rose-100">
                Action Required: Incomplete Booking Details
              </p>
              <p className="text-slate-600 dark:text-slate-300">{error}</p>
            </div>
          </div>
          {Object.keys(fieldErrors).length > 0 && (
            <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 pl-8">
              <span className="font-semibold text-rose-900 dark:text-rose-200 block mb-1">
                Click below to jump directly to the missing fields:
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(fieldErrors).map(([key, msg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`field-${key}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.focus();
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-800 text-rose-900 dark:text-rose-100 font-semibold text-[11px] border border-rose-300 dark:border-rose-700 transition cursor-pointer"
                  >
                    <span>👉 {msg}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8"
      >
        {/* Step 1: Hall & Date Selection */}
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>1. Facility & Schedule</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Hall Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Facility <span className="text-rose-500">*</span>
              </label>
              <select
                id="field-hallId"
                value={hallId}
                onChange={(e) => {
                  setHallId(e.target.value);
                  clearFieldError('hallId');
                }}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:outline-hidden transition ${
                  fieldErrors.hallId
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                }`}
              >
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} (~{h.capacity} seats capacity)
                  </option>
                ))}
              </select>
              {fieldErrors.hallId && (
                <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.hallId}</span>
                </p>
              )}
              {selectedHallObj && !fieldErrors.hallId && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Location: {selectedHallObj.location}
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isMultiDay ? 'Start Date' : 'Reservation Date'} <span className="text-rose-500">*</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMultiDay}
                    onChange={(e) => {
                      setIsMultiDay(e.target.checked);
                      if (!e.target.checked) {
                        setEndDate('');
                        clearFieldError('endDate');
                      }
                    }}
                    className="rounded text-blue-600 h-3.5 w-3.5"
                  />
                  <span>Multi-Day Event?</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <input
                    id="field-bookingDate"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      clearFieldError('bookingDate');
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:outline-hidden transition ${
                      fieldErrors.bookingDate
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                    }`}
                  />
                  {fieldErrors.bookingDate && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.bookingDate}</span>
                    </p>
                  )}
                </div>

                {isMultiDay && (
                  <div>
                    <input
                      id="field-endDate"
                      type="date"
                      min={bookingDate}
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        clearFieldError('endDate');
                      }}
                      placeholder="End Date"
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:outline-hidden transition ${
                        fieldErrors.endDate
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                          : 'border-blue-400 dark:border-blue-600 focus:ring-blue-500'
                      }`}
                    />
                    {fieldErrors.endDate && (
                      <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.endDate}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
              {isMultiDay && !fieldErrors.endDate && (
                <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                  Full hall will be booked consecutively across all dates in this range.
                </p>
              )}
            </div>
          </div>

          {/* Time Slot Type */}
          <div className="mt-5 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Booking Duration & Slot
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'FULL_DAY', label: 'Full Day', sub: '09:00 - 17:00' },
                { id: 'MORNING', label: 'Morning Slot', sub: '09:00 - 13:00' },
                { id: 'AFTERNOON', label: 'Afternoon Slot', sub: '13:00 - 17:00' },
                { id: 'CUSTOM', label: 'Custom Times', sub: 'Specify hours' },
              ].map((slot) => (
                <button
                  type="button"
                  key={slot.id}
                  onClick={() => handleBookingTypeChange(slot.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    bookingType === slot.id
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs block">{slot.label}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {slot.sub}
                  </span>
                </button>
              ))}
            </div>

            {bookingType === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="field-startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      clearFieldError('startTime');
                    }}
                    className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 text-sm ${
                      fieldErrors.startTime
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                  {fieldErrors.startTime && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      {fieldErrors.startTime}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="field-endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      clearFieldError('endTime');
                    }}
                    className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 text-sm ${
                      fieldErrors.endTime
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                  {fieldErrors.endTime && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      {fieldErrors.endTime}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Event Details */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>2. Event Particulars</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Event Name / Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-eventName"
                type="text"
                placeholder="e.g. National Symposium on Deep Learning"
                value={eventName}
                onChange={(e) => {
                  setEventName(e.target.value);
                  clearFieldError('eventName');
                }}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:outline-hidden transition ${
                  fieldErrors.eventName
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.eventName && (
                <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.eventName}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Host Department / Organization <span className="text-rose-500">*</span>
                </label>
                <select
                  id="field-departmentId"
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    clearFieldError('departmentId');
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:outline-hidden transition ${
                    fieldErrors.departmentId
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                  }`}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
                {fieldErrors.departmentId && (
                  <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.departmentId}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Expected Attendees (Informational Only)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={participantCount}
                  onChange={(e) => setParticipantCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used solely for ventilation & security sizing; no seat assignment.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Purpose of Reservation <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-purpose"
                type="text"
                placeholder="e.g. Faculty Enrichment / Technical Workshop / Placement Drive"
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  clearFieldError('purpose');
                }}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:outline-hidden transition ${
                  fieldErrors.purpose
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.purpose && (
                <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.purpose}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Event Description / Agenda
              </label>
              <textarea
                rows={3}
                placeholder="Provide a brief synopsis of the scheduled agenda and guest speakers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Contact & Coordination */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>3. Coordinator & Contact Info</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Faculty / Coordinator Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-coordinatorName"
                type="text"
                value={coordinatorName}
                onChange={(e) => {
                  setCoordinatorName(e.target.value);
                  clearFieldError('coordinatorName');
                }}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:outline-hidden transition ${
                  fieldErrors.coordinatorName
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.coordinatorName && (
                <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.coordinatorName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-contactNumber"
                type="tel"
                placeholder="+91 98765 00000"
                value={contactNumber}
                onChange={(e) => {
                  setContactNumber(e.target.value);
                  clearFieldError('contactNumber');
                }}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:outline-hidden transition ${
                  fieldErrors.contactNumber
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.contactNumber && (
                <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.contactNumber}</span>
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-email"
                type="email"
                placeholder="faculty@college.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:outline-hidden transition ${
                  fieldErrors.email
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step 4: Special Requirements Checkboxes */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Special Technical / Facility Requirements
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              'Projector',
              'Microphone',
              'Audio System',
              'AC',
              'Internet',
              'Recording',
              'Stage Lighting',
              'Other',
            ].map((req) => (
              <label
                key={req}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={specialRequirements.includes(req)}
                  onChange={() => toggleRequirement(req)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>{req}</span>
              </label>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Additional Notes or Logistical Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. VIP guest seating on stage, special podium banner setup"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Attachment / Permission Letter (Optional) */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Attach Official Proposal / Permission Letter</span>
              </label>
              </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Upload signed approval letter from HOD, Dean, or Principal if available (PDF, JPG, PNG, DOC up to 10MB). <span className="font-medium text-slate-700 dark:text-slate-300">Aap bina letter upload kiye bhi form submit kar sakte hain.</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              {uploadingFile && (
                <span className="text-xs text-blue-600 animate-pulse">Uploading file...</span>
              )}
              {uploadedFileName && !uploadingFile && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl">
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>✓ {uploadedFileName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentUrl('');
                      setUploadedFileName('');
                    }}
                    title="Remove attached document"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting Request...' : 'Submit Booking Request'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
