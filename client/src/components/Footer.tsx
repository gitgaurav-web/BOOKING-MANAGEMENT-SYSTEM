import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Calendar, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">CampusHalls</span>
                <span className="block text-xs text-slate-500">Facility Portal</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Official date-wise reservation system for Seminar Hall and AV Hall. Simplifying event coordination and preventing facility scheduling conflicts.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Hall Date Reservations (No Seats)</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/availability" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Check Hall Availability
                </Link>
              </li>
              <li>
                <Link to="/calendar" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Monthly Event Calendar
                </Link>
              </li>
              <li>
                <Link to="/halls" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Halls & Audio-Visual Specs
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Submit Booking Request
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  How Reservation Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Facility Specs */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Our Facilities</h4>
            <ul className="space-y-3 text-xs">
              <li className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Seminar Hall</span>
                <span className="text-slate-500 text-[11px]">Academic Block • Capacity 200 • Full Stage & Audio</span>
              </li>
              <li className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">AV Hall (Audio Visual)</span>
                <span className="text-slate-500 text-[11px]">Tech Block • Capacity 120 • Smartboard & Telepresence</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Campus Contact */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Campus Facilities Office</h4>
            <div className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Knowledge Park IV, Academic Campus, Building A</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>+91 98765 00001 (Facilities Desk)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>facilities@college.edu</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Campus Facilities Administration. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Link to="/login" className="hover:text-blue-600 transition">Staff Portal</Link>
            <span>•</span>
            <Link to="/admin" className="hover:text-blue-600 transition">Administrator Desk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
