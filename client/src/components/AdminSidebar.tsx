import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Car,
  Clock,
  Layers,
  Ban,
  Wrench,
  CalendarDays,
  Users,
  Building,
  BarChart3,
  ScrollText,
  Settings,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const links = [
    { label: 'Transport Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Trip Management', path: '/admin/bookings', icon: Layers },
    { label: 'Pending Requisitions', path: '/admin/pending', icon: Clock },
    { label: 'Fleet Schedule Calendar', path: '/admin/calendar', icon: Calendar },
    { label: 'Bus Routes & Stops', path: '/admin/routes', icon: Compass },
    { label: 'Vehicle Management', path: '/admin/vehicles', icon: Car },
    { label: 'Campus Blocked Dates', path: '/admin/blocked-dates', icon: Ban },
    { label: 'Garage & RTO Maintenance', path: '/admin/maintenance', icon: Wrench },
    { label: 'Academic Holidays', path: '/admin/holidays', icon: CalendarDays },
    { label: 'Users & Drivers', path: '/admin/users', icon: Users },
    { label: 'Departments', path: '/admin/departments', icon: Building },
    { label: 'Fleet Utilization Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Security & Audit Logs', path: '/admin/logs', icon: ScrollText },
    { label: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 p-4 space-y-1">
      <div className="px-3 py-2 mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Transport Control Center
        </span>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
