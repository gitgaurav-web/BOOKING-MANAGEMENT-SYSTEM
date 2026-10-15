import React, { useState, useEffect } from 'react';
import { apiRequest, downloadCsvFile } from '../../services/api';
import { BarChart3, FileSpreadsheet, Printer, Download, TrendingUp } from 'lucide-react';
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

export const AdminReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/reports/summary');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div className="p-12 text-center text-slate-500 text-sm">Generating reports...</div>;
  }

  const { metrics, deptUsage, monthlyTrends, hallUsage = [] } = data;

  return (
    <div id="printable-report" className="space-y-8">
      {/* Official Sri Sairam Institutional Header (Appears only on printed report) */}
      <div className="hidden print:flex items-center justify-between pb-6 border-b-2 border-slate-900 mb-6">
        <div className="flex items-center gap-4">
          <img
            src="/images/sairam-logo-light.png"
            alt="Sri Sairam College"
            className="h-16 w-auto object-contain"
          />
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
              Sri Sairam College of Engineering
            </h2>
            <p className="text-xs font-bold text-slate-700">
              Campus Facility Booking Portal • Central Management Information Systems (MIS)
            </p>
            <p className="text-[11px] text-slate-500">
              Anekal, Bengaluru - 562106, Karnataka, India
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 rounded bg-slate-100 border border-slate-300 text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
            Official Audit Report
          </span>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">
            Date: {new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-[10px] text-slate-500">
            Time: {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Reports &amp; Facility Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detailed utilization metrics, actual hall-use hours, department allocations, and downloadable spreadsheets.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={async () => {
              try {
                await downloadCsvFile('/reports/export-csv', 'facility_bookings_report.csv');
              } catch (err: any) {
                alert(err.message || 'Failed to download CSV');
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Hall Utilization & Duration Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Today Available</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {metrics.availableToday} / {metrics.totalHalls}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Halls free today</span>
        </div>
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active / Upcoming</span>
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
            {metrics.upcomingBookings}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Confirmed reservations</span>
        </div>
        {hallUsage.map((h: any) => (
          <div key={h.id} className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block truncate">{h.name}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{h.totalHours || 0} hrs</span>
              <span className="text-xs text-slate-500">({h.bookingsCount} events)</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Cumulative utilized duration</span>
          </div>
        ))}
      </div>

      {/* Monthly Trends Chart */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          Monthly Facility Utilization Trend
        </h3>

        <div className="h-72 w-full">
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
              <Bar dataKey="seminarHall" name="Seminar Hall" fill="#3B82F6" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="avHall" name="AV Hall" fill="#10B981" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Print-Only Monthly Trend Data Table (Guarantees crisp figures on paper) */}
        <div className="hidden print:block pt-3 border-t border-slate-200">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="py-2 px-3">Month</th>
                <th className="py-2 px-3 text-right">Seminar Hall (Bookings)</th>
                <th className="py-2 px-3 text-right">AV Hall (Bookings)</th>
                <th className="py-2 px-3 text-right">Total Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {monthlyTrends.map((m: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-2 px-3 font-semibold">{m.month}</td>
                  <td className="py-2 px-3 text-right">{m.seminarHall || 0}</td>
                  <td className="py-2 px-3 text-right">{m.avHall || 0}</td>
                  <td className="py-2 px-3 text-right font-bold">{(m.seminarHall || 0) + (m.avHall || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Usage Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Department-Wise Facility Allocation
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Department Code</th>
                <th className="py-3 px-4">Department Name</th>
                <th className="py-3 px-4 text-right">Confirmed Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {deptUsage.map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {d.code}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {d.name}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {d.bookingsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Institutional Verification & Signatures (Print Only) */}
      <div className="hidden print:grid grid-cols-3 gap-8 pt-10 mt-10 border-t-2 border-slate-300 text-center text-xs">
        <div>
          <div className="h-12 border-b border-dashed border-slate-400 mb-2"></div>
          <p className="font-bold text-slate-900">Estate Admin / Facility In-Charge</p>
          <p className="text-[10px] text-slate-500">Sri Sairam College of Engineering</p>
        </div>
        <div>
          <div className="h-12 border-b border-dashed border-slate-400 mb-2"></div>
          <p className="font-bold text-slate-900">Administrative Officer / Dean</p>
          <p className="text-[10px] text-slate-500">Verified &amp; Audited</p>
        </div>
        <div>
          <div className="h-12 border-b border-dashed border-slate-400 mb-2"></div>
          <p className="font-bold text-slate-900">Principal / Chief Operating Officer</p>
          <p className="text-[10px] text-slate-500">Executive Approval Stamp</p>
        </div>
      </div>
    </div>
  );
};
