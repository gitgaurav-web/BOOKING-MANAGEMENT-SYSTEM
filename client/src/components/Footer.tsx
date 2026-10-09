import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Landmark, ShieldCheck, Mail, Phone, MapPin, Award } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const Footer: React.FC = () => {
  const { settings } = useSettings();

  return (
    <footer className="border-t-4 border-amber-500 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 text-white">
      {/* Academic Institutional Banner Bar */}
      <div className="border-b border-white/10 bg-black/20 py-4 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4 text-xs text-amber-200/90 font-medium">
          <div className="flex items-center gap-3">
            <Award className="h-4 w-4 text-amber-400" />
            <span>
              {settings.institutionName || 'Sri Sairam College of Engineering, Bengaluru'}
              {settings.accreditationText ? ` · ${settings.accreditationText}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-amber-400" /> {settings.contactPhone || '080-27830221'}</span>
            <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-amber-400" /> {settings.contactEmail || 'info@sairamce.edu.in'}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_.8fr_.8fr]">
          <div>
            <div className="flex items-center gap-3.5">
              <img
                src="/images/sairam-seal.png"
                alt="Sri Sairam College Emblem"
                className="h-14 w-14 shrink-0 rounded-full border-2 border-amber-400/60 bg-white p-0.5 shadow-md object-contain"
              />
              <div>
                <p className="font-crest text-xl font-bold tracking-tight text-white leading-tight">
                  {settings.institutionName || 'Sri Sairam College of Engineering'}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-300/80">
                  {settings.siteName || 'Campus Facility Management System'}
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
              Official centralized booking platform for campus auditoriums, seminar halls, and ICT smart facilities. Facilitating university events, conferences, and student symposiums.
            </p>
            <div className="mt-5 flex flex-col gap-2 text-xs text-slate-300">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{settings.address || 'Sai Leo Nagar, Guddanahalli Village, Samandur Post, Anekal, Bengaluru - 562106'}</span>
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" /> Verified Faculty &amp; Institutional Authority Access
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Quick Navigation</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li><Link className="transition hover:text-amber-300 flex items-center gap-1.5" to="/halls"><span>Facility Directory</span></Link></li>
              <li><Link className="transition hover:text-amber-300 flex items-center gap-1.5" to="/availability"><span>Real-time Availability</span></Link></li>
              <li><Link className="transition hover:text-amber-300 flex items-center gap-1.5" to="/calendar"><span>Official Campus Calendar</span></Link></li>
              <li><Link className="transition hover:text-amber-300 flex items-center gap-1.5" to="/how-it-works"><span>Booking Guidelines &amp; Rules</span></Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Staff &amp; Faculty</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li><Link className="transition hover:text-amber-300" to="/book">Submit Hall Reservation</Link></li>
              <li><Link className="transition hover:text-amber-300" to="/login">Faculty / Admin Login</Link></li>
              <li><Link className="transition hover:text-amber-300" to="/user/bookings">Track My Requisitions</Link></li>
            </ul>
            <Link
              to="/availability"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-400/30 px-3.5 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
            >
              Check Slot Availability <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {settings.institutionName || 'Sri Sairam College of Engineering, Bengaluru'}. All Rights Reserved.</span>
          <span>Internal Campus Facility Management Portal</span>
        </div>
      </div>
    </footer>
  );
};
