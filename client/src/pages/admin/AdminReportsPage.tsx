import React, { useState, useEffect } from 'react';
import { apiRequest, downloadCsvFile } from '../../services/api';
import { Booking } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Search,
  Building2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
  ShieldCheck,
  Phone,
  Mail,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DataArchivalManager } from '../../components/admin/DataArchivalManager';

export const AdminReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for ledger & print report
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [hallFilter, setHallFilter] = useState<string>('ALL');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [summaryRes, bookingsRes] = await Promise.all([
        apiRequest('/reports/summary'),
        apiRequest<Booking[]>('/bookings'),
      ]);
      setData(summaryRes);
      setBookings(bookingsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (hallFilter !== 'ALL' && b.hallId !== hallFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesId = b.bookingId.toLowerCase().includes(q);
      const matchesEvent = b.eventName.toLowerCase().includes(q);
      const matchesFaculty = b.requestedBy.toLowerCase().includes(q);
      const matchesDept = b.department?.name?.toLowerCase().includes(q);
      const matchesHall = b.hall?.name?.toLowerCase().includes(q);
      return matchesId || matchesEvent || matchesFaculty || matchesDept || matchesHall;
    }
    return true;
  });

  if (loading || !data) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-xs font-semibold">Generating institutional reports &amp; facility ledger...</p>
      </div>
    );
  }

  const { metrics, deptUsage, monthlyTrends, hallUsage = [] } = data;

  return (
    <div id="printable-report" className="space-y-8">
      {/* =========================================================================
          PRINT ONLY: Official Institutional Document Header & Letterhead
      ========================================================================= */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/images/sairam-seal.png"
              alt="Sairam Seal"
              className="h-16 w-16 object-contain"
            />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                Sri Sairam College of Engineering
              </h1>
              <p className="text-[10px] text-slate-600 font-medium">
                An Autonomous Institution • Affiliated to VTU, Belagavi • Approved by AICTE, New Delhi
              </p>
              <p className="text-[10px] text-slate-500">
                Anekal, Bengaluru - 562106 • Central Facilities Directorate
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-900 uppercase tracking-widest border border-blue-300">
              Audit Document
            </span>
            <p className="text-[10px] text-slate-500 mt-1">
              Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Campus Facility Requisition &amp; Utilization Audit Ledger
            </h2>
            <p className="text-[10px] text-slate-500">
              Complete official log of hall reservations matching Excel/CSV database export
            </p>
          </div>
          <div className="text-right text-[10px] text-slate-600 font-semibold">
            <span>Filter: {statusFilter === 'ALL' ? 'All Lifecycle Stages' : statusFilter}</span> •{' '}
            <span>Total Records: {filteredBookings.length}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SCREEN HEADER (Hidden in Print)
      ========================================================================= */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Administrative Intelligence</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            Reports &amp; Facility Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detailed utilization metrics, actual hall-use hours, department allocations, and official audit printout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Print Report</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await downloadCsvFile('/reports/export-csv', 'facility_bookings_report.csv');
              } catch (err: any) {
                alert(err.message || 'Failed to download CSV');
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          EXECUTIVE KPI SUMMARY METRICS
      ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:grid-cols-4 print:gap-2">
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs print:border-slate-300 print:p-3">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Today Available
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {metrics.availableToday} / {metrics.totalHalls}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block">Halls free today</span>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs print:border-slate-300 print:p-3">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Active / Upcoming
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
            {metrics.upcomingBookings}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block">Confirmed reservations</span>
        </div>
        {hallUsage.map((h: any) => (
          <div
            key={h.id}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs print:border-slate-300 print:p-3"
          >
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block truncate">
              {h.name}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {h.totalHours || 0} hrs
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500">({h.bookingsCount} events)</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block">Cumulative utilization</span>
          </div>
        ))}
      </div>

      {/* =========================================================================
          SCREEN ONLY: Visual Charts & Department Allocation
      ========================================================================= */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Monthly Facility Utilization Trend</span>
            </h3>
            <span className="text-[11px] text-slate-400">Total Approved Events</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="seminarHall" name="Seminar Hall" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="avHall" name="AV Hall" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Usage Table */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Department Allocation</span>
            </h3>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Approved</span>
          </div>
          <div className="overflow-y-auto max-h-64 flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Dept</th>
                  <th className="py-2.5 px-3">Department Name</th>
                  <th className="py-2.5 px-3 text-right">Bookings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {deptUsage.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 text-xs">
                      No department data logged yet.
                    </td>
                  </tr>
                ) : (
                  deptUsage.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {d.code}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                        {d.name}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {d.bookingsCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SUPER ADMIN EXCLUSIVE: Institutional Data Archival & Storage Manager
      ========================================================================= */}
      <DataArchivalManager onDataPurged={loadReports} />

      {/* =========================================================================
          MASTER BOOKINGS AUDIT LEDGER (Exact Data Matching Excel/CSV Export)
      ========================================================================= */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs print:rounded-none print:border-0 print:shadow-none">
        {/* Table Controls (Hidden in Print) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Institutional Facility Bookings Ledger</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Exact dataset exported to Excel (.csv) with comprehensive coordinator details and booking statuses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search booking, event, faculty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden w-56 sm:w-64"
              />
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl flex items-center text-xs font-semibold">
              {['ALL', 'APPROVED', 'PENDING', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? `All (${bookings.length})` : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* The Complete Ledger Table (Rendered on Screen & Printed on Paper) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse print:text-[9.5px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:text-black">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Booking ID</th>
                <th className="py-3 px-3">Facility / Hall</th>
                <th className="py-3 px-3">Event Name &amp; Purpose</th>
                <th className="py-3 px-3">Date &amp; Time Slot</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Faculty Coordinator</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-300">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No bookings found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b, idx) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 print:hover:bg-transparent transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] print:text-slate-700">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 print:text-black text-[11px] block">
                        {b.bookingId}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(b.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 print:text-black">
                      {b.hall?.name || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px]">
                      <span className="font-bold text-slate-900 dark:text-white print:text-black block truncate">
                        {b.eventName}
                      </span>
                      {b.purpose && (
                        <span className="text-[10px] text-slate-500 block truncate">
                          {b.purpose}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200 print:text-black">
                        {b.bookingDate}
                        {b.endDate && b.endDate !== b.bookingDate && ` to ${b.endDate}`}
                      </div>
                      <div className="text-[10px] text-slate-500 print:text-slate-700 font-mono">
                        {b.startTime} - {b.endTime} ({b.bookingType})
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 print:text-black">
                      {b.department?.name || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 print:text-black block">
                        {b.requestedBy}
                      </span>
                      <span className="text-[10px] text-slate-500 print:text-slate-700 block font-mono">
                        {b.contactNumber || b.email}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          b.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : b.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Ledger Bottom Summary Bar */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 no-print">
          <span>Showing {filteredBookings.length} of {bookings.length} reservations</span>
          <button
            type="button"
            onClick={handlePrint}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print this table on paper &rarr;</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PRINT ONLY: Institutional Sign-off & Stamp Verification Footer
      ========================================================================= */}
      <div className="hidden print:block pt-12 mt-12 border-t border-slate-400">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="space-y-12">
            <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-900">Prepared By</p>
              <p className="text-[10px] text-slate-500">Central Facilities Officer</p>
            </div>
          </div>
          <div className="space-y-12">
            <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-900">Verified By</p>
              <p className="text-[10px] text-slate-500">Campus Estate &amp; Maintenance Admin</p>
            </div>
          </div>
          <div className="space-y-12">
            <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-900">Approved &amp; Authorized By</p>
              <p className="text-[10px] text-slate-500">Principal / Chief Operating Officer (COO)</p>
            </div>
          </div>
        </div>
        <p className="text-[9px] text-slate-400 text-center mt-8">
          This is an official computer-generated institutional audit document from Sri Sairam College of Engineering Campus Facility Management System.
        </p>
      </div>
    </div>
  );
};
