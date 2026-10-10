import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Booking } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Calendar,
  Clock,
  Building2,
  FileText,
  Printer,
  XCircle,
  Plus,
  Download,
  FileCheck2,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { AddToCalendarButton } from '../components/AddToCalendarButton';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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
    if (!window.confirm('Are you sure you want to cancel this booking request? The date will become available again.')) {
      return;
    }

    try {
      await apiRequest(`/bookings/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Cancelled by user' }),
      });
      loadMyBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const getBookingQrData = (b: Booking): string => {
    const dateStr = b.endDate && b.endDate !== b.bookingDate ? `${b.bookingDate} to ${b.endDate}` : b.bookingDate;
    const statusStr = b.status === 'APPROVED' ? 'CONFIRMED / BOOKED' : b.status;
    return `SRI SAIRAM COLLEGE OF ENGINEERING
OFFICIAL FACILITY BOOKING PASS
--------------------------------
Booking ID : ${b.bookingId}
Facility   : ${b.hall?.name || 'Seminar / AV Hall'}
Date       : ${dateStr}
Time Slot  : ${b.startTime} - ${b.endTime} (${b.bookingType.replace('_', ' ')})
Event      : ${b.eventName}
Department : ${b.department?.name || 'Academic Dept'}
Coordinator: ${b.coordinatorName} (${b.contactNumber})
Status     : ${statusStr}
--------------------------------
Authority: Facilities Committee & Dean Academics`;
  };

  const loadLogoAsDataUrl = async (src: string): Promise<string | null> => {
    try {
      const res = await fetch(src);
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const downloadPdf = async () => {
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

      const qrDataText = getBookingQrData(selectedBooking);
      const [qrDataUrl, logoDataUrl, sealDataUrl] = await Promise.all([
        QRCode.toDataURL(qrDataText, {
          width: 300,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        }),
        loadLogoAsDataUrl('/images/sairam-logo.png'),
        loadLogoAsDataUrl('/images/sairam-seal.png'),
      ]);

      let y = 16;

      // Outer Card Box
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(15, y, 180, 250, 4, 4, 'FD');

      // Top Header Accent Bar
      doc.setFillColor(30, 58, 138); // Deep Navy #1E3A8A
      doc.roundedRect(15, y, 180, 26, 4, 4, 'F');
      doc.rect(15, y + 20, 180, 6, 'F'); // square bottom of header bar

      if (logoDataUrl) {
        // White rounded container for the official logo
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(19, y + 3.5, 38, 19, 2, 2, 'F');
        doc.addImage(logoDataUrl, 'PNG', 20.5, y + 4.5, 35, 17);

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.5);
        doc.text('SRI SAIRAM COLLEGE OF ENGINEERING', 61, y + 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('CENTRAL FACILITIES OFFICE • OFFICIAL CONFIRMATION PASS', 61, y + 18);
      } else {
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('SRI SAIRAM COLLEGE OF ENGINEERING', 105, y + 11, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text('CENTRAL FACILITIES OFFICE • OFFICIAL CONFIRMATION PASS', 105, y + 19, { align: 'center' });
      }

      y += 34;

      // Status Badge
      const isApproved = selectedBooking.status === 'APPROVED';
      const statusText = isApproved ? 'CONFIRMED / BOOKED' : selectedBooking.status;
      if (isApproved) {
        doc.setFillColor(220, 252, 231); // emerald-100
        doc.setTextColor(22, 101, 52); // emerald-800
        doc.setDrawColor(134, 239, 172);
      } else {
        doc.setFillColor(254, 226, 226); // rose-100
        doc.setTextColor(153, 27, 27); // rose-800
        doc.setDrawColor(252, 165, 165);
      }
      doc.roundedRect(138, y - 4, 47, 8, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(statusText, 161.5, y + 1.5, { align: 'center' });

      // Booking ID Reference Box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, y + 7, 170, 36, 3, 3, 'FD');

      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('BOOKING ID REFERENCE', 26, y + 16);

      doc.setTextColor(37, 99, 235); // blue-600
      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.text(selectedBooking.bookingId, 26, y + 24);

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Scan QR code at the hall entrance to verify reservation details.', 26, y + 31);

      // Embed QR Code
      doc.addImage(qrDataUrl, 'PNG', 150, y + 9, 32, 32);

      y += 48;

      // Details Grid (2 Columns)
      const renderDetailBox = (
        bx: number,
        by: number,
        bw: number,
        bh: number,
        label: string,
        val: string,
        sub: string = ''
      ) => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(bx, by, bw, bh, 2, 2, 'FD');

        doc.setTextColor(148, 163, 184); // slate-400
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(label.toUpperCase(), bx + 4, by + 6);

        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        const safeVal = val.length > 34 ? val.substring(0, 32) + '...' : val;
        doc.text(safeVal, bx + 4, by + 12);

        if (sub) {
          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(sub.length > 38 ? sub.substring(0, 36) + '...' : sub, bx + 4, by + 17);
        }
      };

      // Row 1: Facility & Date
      renderDetailBox(
        20,
        y,
        82,
        21,
        'Reserved Facility',
        selectedBooking.hall?.name || 'Facility Hall',
        selectedBooking.hall?.location || 'Central Campus'
      );
      const dateText = `${selectedBooking.bookingDate}${selectedBooking.endDate && selectedBooking.endDate !== selectedBooking.bookingDate ? ` to ${selectedBooking.endDate}` : ''}`;
      renderDetailBox(
        108,
        y,
        82,
        21,
        'Event Date & Time',
        dateText,
        `${selectedBooking.startTime} - ${selectedBooking.endTime} (${selectedBooking.bookingType.replace('_', ' ')})`
      );

      y += 25;

      // Row 2: Event Title & Department
      renderDetailBox(
        20,
        y,
        82,
        21,
        'Event Title',
        selectedBooking.eventName,
        selectedBooking.purpose ? `Purpose: ${selectedBooking.purpose}` : ''
      );
      renderDetailBox(
        108,
        y,
        82,
        21,
        'Department / Host',
        selectedBooking.department?.name || 'Academic Dept',
        'Sri Sairam College of Engineering'
      );

      y += 25;

      // Row 3: Coordinator / Applicant Full Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, y, 170, 18, 2, 2, 'FD');

      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('COORDINATOR / APPLICANT', 24, y + 6);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(
        `${selectedBooking.coordinatorName} (${selectedBooking.contactNumber}) • ${selectedBooking.email}`,
        24,
        y + 12.5
      );

      y += 22;

      // Admin Notes (if any)
      if (selectedBooking.adminNotes) {
        doc.setFillColor(254, 243, 199); // amber-100
        doc.setDrawColor(251, 191, 36);
        doc.roundedRect(20, y, 170, 16, 2, 2, 'FD');

        doc.setTextColor(180, 83, 9); // amber-700
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('OFFICIAL ADMIN NOTICE / INSTRUCTION:', 24, y + 6);

        doc.setTextColor(146, 64, 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(selectedBooking.adminNotes.substring(0, 90), 24, y + 11.5);
        y += 20;
      }

      // Footer divider
      doc.setDrawColor(203, 213, 225);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(20, y + 10, 190, y + 10);
      doc.setLineDashPattern([], 0);

      y += 18;

      // Footer Text & Authority Stamp Box
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`System Generated on: ${new Date().toLocaleDateString()}`, 20, y + 2);
      doc.text('Authority: Facilities Committee & Dean Academics', 20, y + 6);

      if (sealDataUrl) {
        doc.addImage(sealDataUrl, 'PNG', 152, y - 10, 16, 16);
      }

      doc.setDrawColor(148, 163, 184);
      doc.line(135, y + 7, 185, y + 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('[ Official Stamp / Signature ]', 160, y + 11, { align: 'center' });

      // Save PDF
      doc.save(`Booking-Pass-${selectedBooking.bookingId}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF. Please try using "Print Slip".');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            My Facility Bookings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your submitted requests, approval updates, and download official confirmation slips.
          </p>
        </div>
        <Link
          to="/book"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation Request</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Loading your reservations...</div>
      ) : bookings.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">No bookings found</h3>
            <p className="text-xs text-slate-500 mt-1">
              You haven't requested any reservations for Seminar Hall or AV Hall yet.
            </p>
          </div>
          <Link
            to="/book"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-md"
          >
            Create Your First Booking
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Booking ID</th>
                    <th className="py-3.5 px-4">Facility</th>
                    <th className="py-3.5 px-4">Event & Department</th>
                    <th className="py-3.5 px-4">Reserved Date</th>
                    <th className="py-3.5 px-4">Time Slot</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {b.bookingId}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {b.hall?.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {b.eventName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {b.department?.name || 'Academic Dept'}
                        </div>
                        {b.adminNotes && (
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 shadow-2xs">
                            <MessageSquare className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Admin Notice: {b.adminNotes}</span>
                          </div>
                        )}
                        {b.rejectionReason && b.status === 'REJECTED' && (
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 shadow-2xs">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>Reason: {b.rejectionReason}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {b.endDate && b.endDate !== b.bookingDate ? (
                          <span>{b.bookingDate} to {b.endDate} <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">Multi-Day</span></span>
                        ) : (
                          b.bookingDate
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {b.startTime} - {b.endTime}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {b.status === 'APPROVED' && (
                          <AddToCalendarButton booking={b} size="xs" variant="compact" />
                        )}
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-[11px] transition"
                        >
                          View Voucher
                        </button>
                        {['PENDING', 'APPROVED'].includes(b.status) && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 font-medium text-[11px] transition"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details & Voucher Printable Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-6 my-8">
            <div id="printable-voucher" className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
              {/* College Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/sairam-logo.png"
                    alt="Sri Sairam College of Engineering"
                    className="h-12 sm:h-14 w-auto object-contain bg-white rounded-xl p-1 shadow-xs border border-slate-100"
                  />
                  <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white leading-tight">
                      Central Facilities Office
                    </h4>
                    <p className="text-[10px] text-slate-500">Official Confirmation Pass</p>
                  </div>
                </div>
                <StatusBadge status={selectedBooking.status} size="md" />
              </div>

              {/* QR Code & Booking Ref */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Booking ID Reference
                  </span>
                  <span className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                    {selectedBooking.bookingId}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Scan QR code at the hall entrance to verify reservation authenticity.
                  </p>
                </div>
                <div className="p-2 bg-white rounded-xl shadow-xs shrink-0">
                  <QRCodeSVG
                    value={getBookingQrData(selectedBooking)}
                    size={90}
                    level="M"
                  />
                </div>
              </div>

              {/* Event & Schedule Data */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Reserved Facility</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedBooking.hall?.name}
                  </span>
                  <span className="text-[11px] text-slate-500 block">{selectedBooking.hall?.location}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Event Date(s)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedBooking.bookingDate}
                    {selectedBooking.endDate && selectedBooking.endDate !== selectedBooking.bookingDate && ` to ${selectedBooking.endDate}`}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {selectedBooking.startTime} - {selectedBooking.endTime} ({selectedBooking.bookingType.replace('_', ' ')})
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Event Title</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBooking.eventName}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Department / Host</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBooking.department?.name || 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 col-span-2">
                  <span className="text-slate-400 block text-[10px]">Coordinator / Applicant</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBooking.coordinatorName} ({selectedBooking.contactNumber}) • {selectedBooking.email}
                  </span>
                </div>
              </div>

              {selectedBooking.attachmentUrl && (
                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    <span>Official Permission Letter Attached</span>
                  </div>
                  <a
                    href={selectedBooking.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                  >
                    View Document ↗
                  </a>
                </div>
              )}

              {/* Official Admin Notice / Instructions */}
              {selectedBooking.adminNotes && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 uppercase text-[10px] tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>Official Admin Notice / Instructions for Faculty</span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-300 font-medium whitespace-pre-wrap">
                    {selectedBooking.adminNotes}
                  </p>
                </div>
              )}

              {/* Official Rejection Reason if any */}
              {selectedBooking.rejectionReason && selectedBooking.status === 'REJECTED' && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-200 uppercase text-[10px] tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Administration Rejection Reason</span>
                  </div>
                  <p className="text-rose-800 dark:text-rose-300 font-medium whitespace-pre-wrap">
                    {selectedBooking.rejectionReason}
                  </p>
                </div>
              )}

              {/* Institutional Seal Footnote */}
              <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 flex items-end justify-between text-[11px] text-slate-400">
                <div>
                  <p>System Generated on: {new Date().toLocaleDateString()}</p>
                  <p>Authority: Facilities Committee & Dean Academics</p>
                </div>
                <div className="text-right">
                  <span className="border-b border-slate-400 pb-1 px-4 font-semibold text-slate-600 dark:text-slate-300">
                    [ Official Stamp / Signature ]
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={downloadPdf}
                  disabled={downloadingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingPdf ? 'Exporting PDF...' : 'Download PDF Voucher'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                {selectedBooking.status === 'APPROVED' && (
                  <AddToCalendarButton booking={selectedBooking} size="sm" variant="outline" />
                )}
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
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
