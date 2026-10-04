import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ban,
  XCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
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
    return <div className="p-12 text-center text-slate-500 text-sm">Loading admin dashboard...</div>;
  }

  const { metrics, hallUsage, deptUsage, statusDistribution } = data;

  const statCards = [
    { label: 'Total Facilities', value: metrics.totalHalls, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/60' },
    { label: 'Available Today', value: metrics.availableToday, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/60' },
    { label: 'Booked Today', value: metrics.bookedToday, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/60' },
    { label: 'Pending Requests', value: metrics.pendingBookings, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/60', highlight: metrics.pendingBookings > 0 },
    { label: 'Upcoming Bookings', value: metrics.upcomingBookings, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/60' },
    { label: 'Blocked Periods', value: metrics.blockedDatesCount, icon: Ban, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
    { label: 'Cancelled Bookings', value: metrics.cancelledBookings, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/60' },
  ];

  const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#64748B'];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Administration Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time status of Seminar Hall & AV Hall bookings, upcoming requests, and hall utilization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/pending"
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Review Pending ({metrics.pendingBookings})</span>
          </Link>
          <Link
            to="/book"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </Link>
          <Link
            to="/admin/blocked-dates"
            className="px-3.5 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Block Date</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all ${
                card.highlight
                  ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hall Usage Comparison */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Hall Usage Comparison (Total Confirmed Bookings)
            </h3>
            <span className="text-xs text-slate-400">Lifetime</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hallUsage}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
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
                <Bar dataKey="bookingsCount" name="Approved Bookings" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Booking Status Distribution
            </h3>
            <span className="text-xs text-slate-400">All Time</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {statusDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            {statusDistribution.map((item: any, idx: number) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-slate-400">
                  {item.name}: <strong className="text-slate-900 dark:text-white">{item.count}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
