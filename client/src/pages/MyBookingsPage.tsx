import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Booking } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Calendar,
  Clock,
  Car,
  Bus,
  FileText,
  Printer,
  XCircle,
  Plus,
  Download,
  FileCheck2,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Users,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    loadMyBookings();
  }, []);

  const loadMyBookings = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Booking[]>('/bookings/my-bookings');
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this vehicle requisition? The vehicle will be released to the fleet.')) {
      return;
    }

    try {
      await apiRequest(`/bookings/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Cancelled by requester' }),
      });
      loadMyBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel requisition');
    }
  };

  const downloadGatePassPdf = async () => {
    if (!selectedBooking) return;
    try {
      setDownloadingPdf(true);
      const { jsPDF } = await import('jspdf');
      const QRCode = (await import('qrcode')).default;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const resolvedTitle = selectedBooking.tripTitle || selectedBooking.eventName || 'Institutional Trip';
      const resolvedDate = selectedBooking.startDate || selectedBooking.bookingDate;
      const resolvedTime = selectedBooking.departureTime || selectedBooking.startTime || '08:30';
      const resolvedPhone = selectedBooking.coordinatorPhone || selectedBooking.contactNumber || 'N/A';
      const resolvedDriver = selectedBooking.assignedDriverName || selectedBooking.vehicle?.driverName || 'Designated Driver';

      const qrPayload = [
        `PASS ID: ${selectedBooking.bookingId}`,
        `STATUS: ${selectedBooking.status}`,
        `VEHICLE: ${selectedBooking.vehicle?.name || 'College Vehicle'} (${selectedBooking.vehicle?.registrationNo || 'KA-51'})`,
        `DRIVER: ${resolvedDriver}`,
        `DEPARTURE: ${resolvedDate} ${resolvedTime}`,
        `DESTINATION: ${selectedBooking.dropLocation || 'Campus Event'}`,
        `COORDINATOR: ${selectedBooking.coordinatorName || selectedBooking.requestedBy} (${resolvedPhone})`,
        `COLLEGE: Sri Sairam College of Engineering`,
      ].join('\n');

      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 350,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      let y = 16;
      // Outer Pass Box
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(15, y, 180, 266, 4, 4, 'FD');

      // Top Navy Header
      doc.setFillColor(15, 43, 92);
      doc.roundedRect(15, y, 180, 26, 4, 4, 'F');
      doc.rect(15, y + 20, 180, 6, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('SRI SAIRAM COLLEGE OF ENGINEERING', 105, y + 11, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('CENTRAL TRANSPORT DESK • OFFICIAL GATE PASS & DRIVER TRIP SHEET', 105, y + 18, { align: 'center' });

      y += 32;

      // Gate Pass Ticket Strip
      doc.setFillColor(248, 250, 252);
      doc.rect(18, y, 174, 34, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`PASS ID: ${selectedBooking.bookingId}`, 22, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Status: ${selectedBooking.status}`, 22, y + 15);
      doc.text(`Vehicle: ${selectedBooking.vehicle?.name} (${selectedBooking.vehicle?.registrationNo})`, 22, y + 21);
      doc.text(`Driver: ${selectedBooking.assignedDriverName || selectedBooking.vehicle?.driverName || 'Designated Driver'} (${selectedBooking.assignedDriverPhone || selectedBooking.vehicle?.driverPhone || 'N/A'})`, 22, y + 27);

      doc.addImage(qrDataUrl, 'PNG', 156, y + 2, 30, 30);

      y += 42;

      // Trip Information
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('1. ITINERARY & TRIP LOGISTICS', 20, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Trip Title: ${resolvedTitle}`, 22, y);
      y += 5;
      doc.text(`Purpose Category: ${selectedBooking.tripPurpose || selectedBooking.purpose || 'Official Institutional Transport'}`, 22, y);
      y += 5;
      doc.text(`Pickup Point: ${selectedBooking.pickupLocation || 'College Campus Gate 1'}`, 22, y);
      y += 5;
      doc.text(`Destination / Drop: ${selectedBooking.dropLocation || 'Campus Duty'}`, 22, y);
      y += 5;
      doc.text(`Passenger Count: ${selectedBooking.passengerCount || selectedBooking.participantCount || 1} Persons`, 22, y);
      y += 5;
      doc.text(`Departure Schedule: ${resolvedDate} at ${resolvedTime}`, 22, y);
      y += 5;
      doc.text(`Expected Return: ${selectedBooking.endDate || resolvedDate} at ${selectedBooking.returnTime || selectedBooking.endTime || '17:30'}`, 22, y);

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('2. TRAVELING FACULTY COORDINATOR', 20, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Coordinator Name: ${selectedBooking.coordinatorName || selectedBooking.requestedBy}`, 22, y);
      y += 5;
      doc.text(`Mobile: ${resolvedPhone}  |  Email: ${selectedBooking.email}`, 22, y);
      y += 5;
      doc.text(`Department: ${selectedBooking.department?.name || 'Institutional'}`, 22, y);

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('3. DRIVER ODOMETER & GATE SECURITY LOG', 20, y);
      y += 6;

      // Table for Odometer
      doc.rect(20, y, 170, 16);
      doc.line(75, y, 75, y + 16);
      doc.line(130, y, 130, y + 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('START ODOMETER (KM)', 24, y + 5);
      doc.text('CLOSING ODOMETER (KM)', 79, y + 5);
      doc.text('TOTAL KMS RUN', 134, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.text('Recorded at Gate 1: ______', 24, y + 12);
      doc.text('Recorded at Return: ______', 79, y + 12);
      doc.text('Net Distance: ______ KM', 134, y + 12);

      y += 24;

      // Transport Instructions
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      doc.text('MANDATORY TRANSPORT REGULATIONS (SRI SAIRAM COLLEGE OF ENGINEERING):', 20, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const rules = [
        '1. Present this QR Gate Pass at College Gate 1 before vehicle departure.',
        '2. Strictly adhere to state speed governor limits (Max 40-60 km/h).',
        '3. Faculty coordinator must verify passenger count and student nominal roll.',
        '4. Alcohol, hazardous substances, and smoking inside college vehicles are strictly banned.',
        '5. Toll/Parking receipts must be countersigned and submitted to Accounts within 48 hours.',
      ];
      rules.forEach((r) => {
        doc.text(r, 22, y);
        y += 4.5;
      });

      y += 8;
      // Signature box
      doc.line(20, y, 190, y);
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Faculty Coordinator Signature', 25, y);
      doc.text('Gate Security Clearance Stamp', 95, y);
      doc.text('Transport Officer Signature', 150, y);

      doc.save(`Gate_Pass_${selectedBooking.bookingId}.pdf`);
    } catch (err: any) {
      alert(err.message || 'Failed to download Gate Pass PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Car className="w-3.5 h-3.5" />
            <span>Transport Logistics Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            My Vehicle Requisitions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track status, download Security Gate Passes, and access driver trip sheets.
          </p>
        </div>

        <Link
          to="/book"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Vehicle Requisition</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          Loading your vehicle requisitions...
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Car className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            No Vehicle Requisitions Found
          </h3>
          <p className="text-xs text-slate-500">
            You have not submitted any vehicle booking requests yet.
          </p>
          <Link
            to="/book"
            className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs mt-2"
          >
            Submit Requisition
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requisitions List */}
          <div className="lg:col-span-2 space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className={`p-6 rounded-3xl border transition cursor-pointer ${
                  selectedBooking?.id === b.id
                    ? 'border-blue-600 dark:border-amber-400 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs font-black text-blue-600 dark:text-amber-400">
                      {b.bookingId}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {b.tripTitle || b.eventName || 'Institutional Fleet Requisition'}
                    </h3>
                  </div>
                  <StatusBadge status={b.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300 py-3">
                  <div className="flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-blue-500" />
                    <span className="truncate">{b.vehicle?.name || b.hall?.name || 'Campus Vehicle'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{b.startDate || b.bookingDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{b.departureTime || b.startTime} - {b.returnTime || b.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">Drop: {b.dropLocation || 'Campus Gate 1'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{b.passengerCount || b.participantCount || 1} Passengers</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Coordinator: {b.coordinatorName || b.requestedBy}
                  </span>
                  {b.status === 'PENDING' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(b.id);
                      }}
                      className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Booking Gate Pass & Details */}
          <div className="lg:col-span-1">
            {selectedBooking ? (
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-24 space-y-6 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Transport Gate Pass
                  </span>
                  <StatusBadge status={selectedBooking.status} size="sm" />
                </div>

                <div className="text-center space-y-2">
                  <div className="inline-block p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <QRCodeSVG
                      value={`PASS:${selectedBooking.bookingId}|VEHICLE:${selectedBooking.vehicle?.registrationNo}|DRIVER:${selectedBooking.assignedDriverName || 'DESIGNATED'}|STATUS:${selectedBooking.status}`}
                      size={140}
                      level="M"
                    />
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {selectedBooking.bookingId}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Present this QR code to Security at Campus Gate 1 for vehicle dispatch clearance.
                  </p>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Assigned Driver:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedBooking.assignedDriverName || selectedBooking.vehicle?.driverName || 'Will be assigned'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Driver Phone:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedBooking.assignedDriverPhone || selectedBooking.vehicle?.driverPhone || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Registration No:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedBooking.vehicle?.registrationNo || 'KA-51-E-XXXX'}
                    </span>
                  </div>
                  {selectedBooking.adminNotes && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-[11px] mt-2">
                      <span className="font-bold block">Transport Admin Note:</span>
                      <span>{selectedBooking.adminNotes}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={downloadGatePassPdf}
                    disabled={downloadingPdf}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingPdf ? 'Generating PDF...' : 'Download Gate Pass & Trip Sheet'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-400">
                Select a trip requisition from the list to preview the Security Gate Pass and driver voucher.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
