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

  const downloadPdf = async () => {
    const voucherElement = document.getElementById('printable-voucher');
    if (!voucherElement) return;

    try {
      setDownloadingPdf(true);
      const [html2canvasModule, jsPdfModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const jsPDF = jsPdfModule.default || jsPdfModule;

      const canvas = await html2canvas(voucherElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 15, imgWidth, imgHeight);
      pdf.save(`Booking-Voucher-${selectedBooking?.bookingId || 'Slip'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
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
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                      Campus Facilities Office
                    </h4>
                    <p className="text-[11px] text-slate-500">Official Facility Reservation Slip</p>
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
                    value={`https://campushalls.college.edu/verify/${selectedBooking.bookingId}?hall=${encodeURIComponent(selectedBooking.hall?.name || '')}&date=${selectedBooking.bookingDate}&status=${selectedBooking.status}`}
                    size={80}
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
