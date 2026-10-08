import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Landmark, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="border-t-4 border-[#a58b51] bg-[#17372e] text-white">
    <div className="mx-auto max-w-7xl px-4 py-11 sm:px-6 lg:px-8">
      <div className="grid gap-9 md:grid-cols-[1.3fr_.7fr_.7fr]">
        <div>
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center border border-white/25 text-[#e8dbb5]"><Landmark className="h-5 w-5" /></span><div><p className="font-serif text-lg font-bold">College Facilities</p><p className="text-[10px] uppercase tracking-[.16em] text-white/55">Campus booking portal</p></div></div>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/65">A central place to explore campus halls, check dates and send facility booking requests for review.</p>
          <div className="mt-4 inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-[11px] text-white/75"><ShieldCheck className="h-4 w-4 text-[#c5b783]" />Managed through the campus booking process</div>
        </div>
        <div><h2 className="text-xs font-bold uppercase tracking-[.17em] text-[#d8c995]">Explore</h2><ul className="mt-4 space-y-3 text-sm text-white/70"><li><Link className="hover:text-white" to="/halls">Facilities</Link></li><li><Link className="hover:text-white" to="/availability">Availability</Link></li><li><Link className="hover:text-white" to="/calendar">Campus calendar</Link></li><li><Link className="hover:text-white" to="/how-it-works">How it works</Link></li></ul></div>
        <div><h2 className="text-xs font-bold uppercase tracking-[.17em] text-[#d8c995]">Booking</h2><ul className="mt-4 space-y-3 text-sm text-white/70"><li><Link className="hover:text-white" to="/book">Submit a request</Link></li><li><Link className="hover:text-white" to="/login">Staff sign in</Link></li><li><Link className="hover:text-white" to="/user/bookings">My requests</Link></li></ul><Link to="/availability" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#e8dbb5] hover:text-white">Find a date <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
      </div>
      <div className="mt-9 flex flex-col gap-2 border-t border-white/15 pt-5 text-[11px] text-white/50 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} College Facilities Portal</span><span>For official institutional information, refer to your college administration.</span></div>
    </div>
  </footer>
);
