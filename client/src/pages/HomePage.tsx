import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Building2, CalendarDays, Check, ChevronRight, Clock3,
  Landmark, MapPin, ShieldCheck, Users,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Hall, Booking } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AddToCalendarButton } from '../components/AddToCalendarButton';

export const HomePage: React.FC = () => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [heroImage, setHeroImage] = useState<string>('/images/seminar-hall-stage.jpg');

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const hallsData = await apiRequest<Hall[]>('/halls');
        setHalls(hallsData);
        try {
          const bookingsData = await apiRequest<Booking[]>('/bookings/upcoming');
          setUpcomingBookings(bookingsData.slice(0, 5));
        } catch {
          setUpcomingBookings([]);
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadHomeData();
  }, []);

  const seminarHall = halls.find((hall) => hall.name.toLowerCase().includes('seminar')) || halls[0];
  const avHall = halls.find((hall) => hall.name.toLowerCase().includes('av')) || halls[1];
  const featuredHalls = [seminarHall, avHall].filter((hall): hall is Hall => Boolean(hall));

  return (
    <main className="pb-24">
      {/* Grand Collegiate Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white">
        {/* Subtle Academic Grid Pattern */}
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(255,255,255,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.15)_1px,transparent_1px)] [background-size:48px_48px]" />
        
        {/* Subtle Ambient Light Glows */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            {/* College Accreditation Badge */}
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-amber-300 backdrop-blur-sm">
              <img src="/images/sairam-seal.png" alt="Sairam Seal" className="h-4 w-4 rounded-full bg-white object-contain p-[0.5px] shadow-xs" />
              <span>Sri Sairam College of Engineering · Bengaluru</span>
            </div>

            <h1 className="font-serif-college text-4xl leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              World-Class Venues for <br />
              <span className="italic text-amber-400">Academic &amp; Research Excellence.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Official facility reservation desk for Sri Sairam College of Engineering. Reserve Leo Muthu Central Seminar Hall, Sir M. Visvesvaraya AV Hall, and auditoriums for conferences, symposiums, and placement drives.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/availability"
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500 hover:shadow-amber-500/30 transform active:scale-95"
              >
                <CalendarDays className="h-4 w-4" /> Check Live Availability <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/halls"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-white/10 px-6 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 hover:border-slate-500"
              >
                Browse All Venues
              </Link>
            </div>

            {/* University Key Highlights */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-white/15 pt-6 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Zero Double-Booking Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Single &amp; Multi-Day Bookings</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Users className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Up to 500+ Seating Capacity</span>
              </div>
            </div>
          </div>

          {/* Hero Feature Showcase Card */}
          <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
            {/* Elegant Golden Double-Border Offset */}
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-amber-400/40 via-blue-500/20 to-transparent blur-sm" />
            <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-slate-900 shadow-2xl">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                <img
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  src={heroImage}
                  alt="Sri Sairam Leo Muthu Seminar Hall"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Status Pill Badge */}
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-slate-950/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 border border-amber-400/40 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Main Campus Venue</span>
                </div>

                {/* Multiple Views Toggle for Seminar Hall */}
                <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-xl bg-slate-950/85 p-1 border border-amber-400/30 backdrop-blur-md z-10 shadow-lg">
                  <button
                    type="button"
                    onClick={() => setHeroImage('/images/seminar-hall-stage.jpg')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      heroImage.includes('stage')
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Stage View
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroImage('/images/seminar-hall-seating.jpg')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      heroImage.includes('seating')
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Seating View
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[.2em] text-amber-400">Institutional Centerpiece</p>
                  <p className="mt-1 font-serif-college text-2xl sm:text-3xl font-bold text-white leading-snug">
                    Leo Muthu Central Seminar Hall
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-300">Well-Acoustic Auditorium &amp; HD Projection</span>
                    <Link
                      to="/calendar"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
                    >
                      View Schedule <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Facility Stat Strip */}
              <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-slate-900/90 py-3.5 px-4 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Capacity</p>
                  <p className="text-sm font-bold text-amber-400">350 Seats</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Smart AV</p>
                  <p className="text-sm font-bold text-emerald-400">Enabled</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Central AC</p>
                  <p className="text-sm font-bold text-blue-400">24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Institutional Reservation Workflow */}
      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 shadow-xs">
        <div className="mx-auto grid max-w-7xl divide-y divide-slate-200 px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8 dark:divide-slate-800">
          {[
            {
              icon: CalendarDays,
              title: '1. Verify Slot Availability',
              copy: 'Check live color-coded calendar for whole-day or slot availability across all campus halls.',
            },
            {
              icon: Building2,
              title: '2. Submit Booking Requisition',
              copy: 'Specify event details, department, technical requirements, and optional approval letter.',
            },
            {
              icon: ShieldCheck,
              title: '3. Administrative Approval',
              copy: 'Authority verifies event priority, issues automated conflict-free confirmation and pass.',
            },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex items-start gap-4 py-8 md:px-8">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-900/20 bg-blue-50 text-blue-900 dark:border-blue-700/30 dark:bg-blue-950/60 dark:text-amber-400 shadow-xs">
                <Icon className="h-6 w-6 stroke-[1.8]" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Campus Halls Directory */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-blue-900 dark:text-amber-400">
              <Building2 className="h-3.5 w-3.5" /> Institutional Facilities
            </div>
            <h2 className="mt-2 font-serif-college text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Featured Venues &amp; Auditoriums
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              State-of-the-art halls equipped with digital presentation systems, stage lighting, and central climate control.
            </p>
          </div>
          <Link
            to="/halls"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-900 hover:text-blue-950 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <span>Explore All Halls</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {featuredHalls.length ? (
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {featuredHalls.map((hall) => (
              <article
                key={hall.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative h-60 overflow-hidden bg-slate-100 dark:bg-slate-800 sm:h-64">
                  <img
                    src={
                      (hall.code === 'SEMINAR-HALL-01' || hall === seminarHall)
                        ? '/images/seminar-hall-stage.jpg'
                        : (hall.image || 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80')
                    }
                    alt={hall.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  {/* Hall Code Badge */}
                  <span className="absolute bottom-4 left-4 rounded-lg bg-blue-950/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-400/30 backdrop-blur-md">
                    {hall.code}
                  </span>
                  
                  {/* Status Badge */}
                  <span className="absolute right-4 top-4">
                    <StatusBadge status={hall.todayStatus || 'AVAILABLE'} size="md" />
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif-college text-2xl font-bold text-slate-900 dark:text-white">
                        {hall.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-blue-900 dark:text-amber-400" />
                        {hall.location}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Users className="h-3.5 w-3.5 text-blue-900 dark:text-amber-400" />
                      {hall.capacity} Seats
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {hall.description}
                  </p>

                  {hall.facilities.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {hall.facilities.slice(0, 4).map((facility) => (
                        <span
                          key={facility}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                    <Link
                      to={`/availability?hall=${hall.id}`}
                      className="flex-1 rounded-xl border border-blue-900/30 py-2.5 text-center text-xs font-bold text-blue-900 transition hover:bg-blue-50 dark:border-amber-400/30 dark:text-amber-400 dark:hover:bg-amber-950/20"
                    >
                      View Availability
                    </Link>
                    <Link
                      to={`/book?hall=${encodeURIComponent(hall.name)}`}
                      className="flex-1 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 py-2.5 text-center text-xs font-bold text-amber-300 transition hover:from-blue-950 hover:to-blue-900 shadow-sm border border-amber-400/30"
                    >
                      Reserve This Hall
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
            Facility listings will appear here once they are configured in the administrative catalog.
          </div>
        )}
      </section>

      {/* Sri Sairam Engineering Campus Showcase */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="grid lg:grid-cols-2">
            <div className="relative min-h-[320px] lg:min-h-[420px] overflow-hidden bg-slate-950">
              <img
                src="/images/campus-building.png"
                alt="Sri Sairam College of Engineering Campus Academic Complex"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                <div>
                  <span className="inline-block rounded-md bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                    Main Academic Block
                  </span>
                  <p className="mt-1 font-serif-college text-xl font-bold">
                    Sri Sairam College of Engineering
                  </p>
                  <p className="text-xs text-slate-300">
                    Sai Leo Nagar, Anekal, Bengaluru - 562106
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-12">
              <div className="mb-4">
                <img
                  src="/images/sairam-logo.png"
                  alt="Sri Sairam College of Engineering"
                  className="h-11 sm:h-13 w-auto object-contain dark:bg-white dark:px-3 dark:py-1 dark:rounded-xl dark:shadow-xs"
                />
              </div>
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-blue-900 dark:text-amber-400">
                <Landmark className="h-4 w-4" /> Academic Infrastructure &amp; Environment
              </div>
              <h2 className="mt-3 font-serif-college text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                A Sprawling, Modern Campus Built for Academic Excellence
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Located amidst lush, serene greenery in Anekal, Bengaluru, Sri Sairam College of Engineering provides an ideal academic ambience. Equipped with state-of-the-art auditoriums, smart ICT-enabled seminar halls, advanced computing laboratories, and comprehensive central facilities supporting university convocations, national conferences, technical symposiums, and placement drives.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 dark:border-slate-800">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Wi-Fi Smart Campus</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">High-speed connectivity across venues</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Leo Muthu Seminar Hall</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Central stage &amp; 300+ cushioned seating</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Sir M.V. AV Hall</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Digital projection &amp; acoustic audio</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Central Coordination</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Zero-conflict institutional booking</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/halls"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-3 text-xs font-bold text-amber-300 shadow-md transition hover:from-blue-950 hover:to-blue-900 border border-amber-400/30"
                >
                  <Building2 className="h-4 w-4" /> Explore Campus Venues
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  How Reservation Works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Daily Schedule & Upcoming Approved Events */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          {/* Today's Campus Status Card */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 p-8 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Landmark className="h-40 w-40 text-amber-400" />
            </div>
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Campus Status</p>
              <h2 className="mt-2 font-serif-college text-3xl font-bold">Hall Occupation Today</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Live institutional overview of venue utilization for today's ongoing academic sessions.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-1.5 text-xs text-amber-300 backdrop-blur-sm border border-white/10">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="mt-8">
                <Link
                  to="/availability"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  Open Full Facility Grid <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Hall Status Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {(featuredHalls.length
              ? featuredHalls
              : [
                  { id: 'seminar', name: 'Seminar Hall', location: 'Academic Block A', todayStatus: 'AVAILABLE' as const },
                  { id: 'av', name: 'AV Hall', location: 'Media Center Block B', todayStatus: 'AVAILABLE' as const },
                ]
            ).map((hall) => (
              <div
                key={hall.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {hall.location || 'Campus Facility'}
                  </span>
                  <h3 className="mt-2 font-serif-college text-xl font-bold text-slate-900 dark:text-white">
                    {hall.name}
                  </h3>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500">Status Today:</span>
                  <StatusBadge status={hall.todayStatus || 'AVAILABLE'} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Campus Calendar Events */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-blue-900 dark:text-amber-400">
              Institutional Schedules
            </p>
            <h2 className="mt-2 font-serif-college text-3xl font-bold text-slate-900 dark:text-white">
              Upcoming Approved Bookings
            </h2>
          </div>
          <Link
            to="/calendar"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-900 hover:text-blue-950 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <span>Full Monthly Calendar</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {upcomingBookings.length ? (
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {upcomingBookings.map((booking) => (
              <article key={booking.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex items-start gap-4">
                  <div className="min-w-16 rounded-xl border border-blue-900/20 bg-blue-50/70 p-2.5 text-center dark:border-blue-700/30 dark:bg-blue-950/50">
                    <CalendarDays className="mx-auto h-4 w-4 text-blue-900 dark:text-amber-400" />
                    <span className="mt-1 block text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {booking.bookingDate}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-base">
                      {booking.eventName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {booking.hall?.name}{booking.department?.name ? ` · ${booking.department.name}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <Clock3 className="h-3.5 w-3.5 text-blue-900 dark:text-amber-400" />
                    {booking.startTime} – {booking.endTime}
                  </span>
                  <StatusBadge status={booking.status} size="sm" />
                  <AddToCalendarButton booking={booking} size="xs" variant="outline" />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            <CalendarDays className="h-5 w-5 text-blue-900 dark:text-amber-400" />
            <span>No upcoming reservations scheduled for this week. Halls are currently free for booking.</span>
          </div>
        )}
      </section>
    </main>
  );
};
