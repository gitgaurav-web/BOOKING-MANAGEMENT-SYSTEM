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
      if (targetHallParam && hallsData.length > 0) {
        const found = hallsData.find(
          (h) =>
            h.name.toLowerCase().includes(targetHallParam.toLowerCase()) ||
            h.id === targetHallParam
        );
        if (found) {
          setHallId(found.id);
        }
      }

      if (user?.departmentId && !departmentId) {
        setDepartmentId(user.departmentId);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      navigate('/login?redirect=/book');
      return;
    }

    if (!hallId || !bookingDate || !eventName || !purpose || !contactNumber || !email) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (isMultiDay && endDate && endDate < bookingDate) {
      setError('End Date cannot be before Start Date.');
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
        eventName,
        description,
        purpose,
        departmentId: departmentId || null,
        participantCount: Number(participantCount) || 0,
        coordinatorName,
        contactNumber,
        email,
        specialRequirements,
        attachmentUrl: attachmentUrl || null,
        additionalNotes,
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
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
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
                value={hallId}
                onChange={(e) => setHallId(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} (~{h.capacity} seats capacity)
                  </option>
                ))}
              </select>
              {selectedHallObj && (
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
                      if (!e.target.checked) setEndDate('');
                    }}
                    className="rounded text-blue-600 h-3.5 w-3.5"
                  />
                  <span>Multi-Day Event?</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                {isMultiDay && (
                  <input
                    type="date"
                    min={bookingDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    placeholder="End Date"
                    className="w-full px-4 py-2.5 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                )}
              </div>
              {isMultiDay && (
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
                  <label className="block text-xs text-slate-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
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
                type="text"
                placeholder="e.g. National Symposium on Deep Learning"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Host Department / Organization <span className="text-rose-500">*</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
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
                type="text"
                placeholder="e.g. Faculty Enrichment / Technical Workshop / Placement Drive"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
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
                Faculty / Coordinator Name
              </label>
              <input
                type="text"
                value={coordinatorName}
                onChange={(e) => setCoordinatorName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+91 98765 00000"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="faculty@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
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

          {/* Attachment / Permission Letter */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Attach Official Proposal / Permission Letter (Optional)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Upload signed approval letter from HOD, Dean, or Principal (PDF, JPG, PNG). Max 10MB.
            </p>
            <div className="flex items-center gap-3">
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
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Attached: {uploadedFileName}
                </span>
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
