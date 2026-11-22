import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin, ShieldCheck, ExternalLink, Calendar, Award } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const Footer: React.FC = () => {
  const { settings } = useSettings();

  return (
    <footer className="border-t border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Sairam Brand & Logistics Office */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/sairam-seal.png"
                alt="Sri Sairam Seal"
                className="h-10 w-10 object-contain p-0.5 rounded-full bg-white shadow-xs"
              />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                  Central Transport Desk
                </h3>
                <p className="text-[11px] text-slate-500">
                  Sri Sairam College of Engineering
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Official institutional vehicle and fleet requisition management portal. Providing safe, regulated, and verified transport logistics for academic industrial visits, student excursions, sports tours, and campus guest transfers.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Security Gate QR Pass Enabled</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Transport Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/vehicles" className="hover:text-blue-600 dark:hover:text-amber-400 transition">
                  Campus Fleet Directory
                </Link>
              </li>
              <li>
                <Link to="/availability" className="hover:text-blue-600 dark:hover:text-amber-400 transition">
                  Live Vehicle Availability
                </Link>
              </li>
              <li>
                <Link to="/calendar" className="hover:text-blue-600 dark:hover:text-amber-400 transition">
                  Fleet Schedule Calendar
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-blue-600 dark:hover:text-amber-400 transition">
                  Vehicle Requisition Form
                </Link>
              </li>
              <li>
                <Link to="/user/bookings" className="hover:text-blue-600 dark:hover:text-amber-400 transition">
                  My Trip Vouchers &amp; Passes
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-blue-600 dark:hover:text-amber-400 transition">
                  Requisition &amp; Approval Flow
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Institutional Fleet Guidelines */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Compliance &amp; Regulations
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-500">
                <span>• Strict Domain Lock: @sairamce.edu.in</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-500">
                <span>• Mandatory HOD Sanction Attachment</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-500">
                <span>• Speed Governor Compliance (RTO Norms)</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-500">
                <span>• Verified Gate Pass QR Check at Gate 1</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-500">
                <span>• Periodic Garage Fitness &amp; Pollution Check</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Campus Transport Desk Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Transport Helpdesk &amp; Security
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  {settings.address || 'Sai Leo Nagar, Guddanahalli Village, Anekal, Bengaluru, Karnataka - 562106'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{settings.contactPhone || '080-27830221'} / Gate 1: +91 98765 00019</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{settings.contactEmail || 'transport@sairamce.edu.in'}</span>
              </div>
              <a
                href="https://sairamce.edu.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-amber-400 font-semibold hover:underline mt-1"
              >
                <span>sairamce.edu.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} Sri Sairam College of Engineering. Central Transport &amp; Vehicle Portal. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>AICTE Approved</span>
            <span>•</span>
            <span>VTU Affiliated</span>
            <span>•</span>
            <span>NAAC Accredited</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
