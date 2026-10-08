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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Reports & Facility Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detailed utilization metrics, actual hall-use hours, department allocations, and downloadable spreadsheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
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
              <Bar dataKey="seminarHall" name="Seminar Hall" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="avHall" name="AV Hall" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
    </div>
  );
};
