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
  Car,
  Bus,
  Phone,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Select Fleet & Check Availability',
      desc: 'Browse the real-time schedule calendar to verify whether College Buses, Staff Cars, or Force Traveller Vans are free on your requested dates.',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      num: '02',
      title: 'Submit Vehicle Requisition',
      desc: 'Specify the pickup bay, destination address, departure & return timings, passenger headcount, and academic purpose with HOD authorization.',
      color: 'from-indigo-600 to-purple-600',
    },
    {
      num: '03',
      title: 'Automated Collision & Maintenance Check',
      desc: 'The availability engine automatically verifies against confirmed bookings, RTO periodic garage maintenance, and institutional holidays.',
      color: 'from-purple-600 to-pink-600',
    },
    {
      num: '04',
      title: 'Approval & Driver WhatsApp Dispatch',
      desc: 'Transport Desk confirms the booking, instantly dispatches the official WhatsApp/SMS trip duty slip to the driver, and issues a Gate Pass QR code.',
      color: 'from-emerald-600 to-teal-600',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <Car className="w-3.5 h-3.5" />
          <span>Sri Sairam College Institutional Fleet Regulations</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Vehicle Requisition &amp; Fleet Guidelines
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Our centralized transport desk manages safe, verified vehicle allocations for industrial visits, academic tours, and campus guest transfers.
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

      {/* Collegiate Fleet Security Guarantee Callout */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-xl font-bold">Collegiate Transport Security &amp; Compliance</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Mandatory standards governing Sri Sairam College of Engineering fleet operations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <strong className="text-white font-semibold block text-sm">Designated Driver Slip</strong>
            <p>
              Every confirmed requisition dispatches an official duty assignment slip via WhatsApp and SMS directly to the vehicle driver.
            </p>
          </div>
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <strong className="text-white font-semibold block text-sm">Gate 1 Security Pass</strong>
            <p>
              Vehicles cannot exit campus without a verified QR Security Gate Pass inspected and logged by campus security guards.
            </p>
          </div>
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <strong className="text-white font-semibold block text-sm">Speed Governor &amp; GPS</strong>
            <p>
              All college fleet buses and vans adhere to strict RTO speed governor limits and active GPS monitoring.
            </p>
          </div>
        </div>

        <div className="pt-2 text-center">
          <Link
            to="/book"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition"
          >
            <span>Reserve Campus Vehicle Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
