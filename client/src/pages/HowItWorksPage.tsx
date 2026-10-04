import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCheck,
  Ban,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Check Date Availability',
      desc: 'Browse the real-time calendar to verify whether Seminar Hall or AV Hall is free on your requested date.',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      num: '02',
      title: 'Submit Reservation Request',
      desc: 'Select the hall, provide event particulars, host department, participant estimate (informational only), and required technical gear.',
      color: 'from-indigo-600 to-purple-600',
    },
    {
      num: '03',
      title: 'Instant Conflict Checking',
      desc: 'The availability engine automatically checks against existing confirmed bookings, maintenance windows, and college holidays.',
      color: 'from-purple-600 to-pink-600',
    },
    {
      num: '04',
      title: 'Admin Review & Confirmation',
      desc: 'Administrators review the event details, approve the request, and generate an official printable Confirmation Voucher.',
      color: 'from-emerald-600 to-teal-600',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Institutional Booking Workflow</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          How the Facility Booking Works
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Our system is designed strictly for whole-hall date scheduling. Here is the straightforward 4-step process.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((st) => (
          <div
            key={st.num}
            className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs relative overflow-hidden"
          >
            <span className="text-4xl font-black text-slate-100 dark:text-slate-800 absolute top-4 right-6 pointer-events-none">
              {st.num}
            </span>
            <div className="space-y-3 relative z-10">
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                {st.num}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{st.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {st.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Zero Seat Guarantee Callout */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-xl font-bold">Zero Seat Complexity Policy</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Why our facility booking is fundamentally different from cinema or theater ticketing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <strong className="text-white font-semibold block text-sm">Date-Level Reservation</strong>
            <p>
              When a booking is confirmed, the full hall is blocked exclusively for that event organizer.
            </p>
          </div>
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <strong className="text-white font-semibold block text-sm">No Individual Seats</strong>
            <p>
              There is no seat selection map, seat numbering, or row assignment. Capacity numbers are purely informative.
            </p>
          </div>
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <strong className="text-white font-semibold block text-sm">Double Booking Shield</strong>
            <p>
              Automated conflict checks ensure two departments can never accidentally hold conflicting reservations.
            </p>
          </div>
        </div>

        <div className="pt-2 text-center">
          <Link
            to="/book"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition"
          >
            <span>Reserve Seminar or AV Hall Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
