import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Building2, CalendarDays, Check, ChevronRight, Clock3,
  Landmark, MapPin, ShieldCheck, Users,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Hall, Booking } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const HomePage: React.FC = () => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const hallsData = await apiRequest<Hall[]>('/halls');
        setHalls(hallsData);
        try {
          const bookingsData = await apiRequest<Booking[]>('/bookings?dateRange=UPCOMING');
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
    <main className="pb-20">
      <section className="relative overflow-hidden bg-[#f4f2e9] dark:bg-slate-950">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(23,63,54,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(23,63,54,.06)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 border-b border-[#a58b51]/50 pb-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#52634f] dark:text-emerald-300">
              <Landmark className="h-4 w-4" /> Institutional Facilities Portal
            </div>
            <h1 className="font-serif text-5xl leading-[1.04] tracking-tight text-[#172f29] dark:text-white sm:text-6xl lg:text-[4.35rem]">
              A campus built for <span className="italic text-[#7e7449] dark:text-amber-200">gathering.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Find the right space for lectures, conferences and campus events. Check availability and submit a hall request through one clear, reliable portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/availability" className="inline-flex items-center gap-2 bg-[#1c493e] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1c493e]/15 transition hover:bg-[#14382f] focus:outline-none focus:ring-2 focus:ring-[#1c493e] focus:ring-offset-2">
                <CalendarDays className="h-4 w-4" /> Check availability <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/halls" className="inline-flex items-center gap-2 border border-[#c9c6b9] bg-white/70 px-5 py-3.5 text-sm font-semibold text-[#263d35] transition hover:border-[#1c493e] hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                Explore facilities
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#3c755d]" />Clear booking process</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#3c755d]" />Requests reviewed by staff</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
            <div className="absolute -right-4 -top-4 h-full w-full border border-[#a58b51]/55 sm:-right-5 sm:-top-5" />
            <div className="relative aspect-[4/3] overflow-hidden bg-[#d8d5c9]">
              <img className="h-full w-full object-cover" src={seminarHall?.image || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=85'} alt="College event hall" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10261f]/75 via-transparent to-[#10261f]/10" />
              <div className="absolute left-5 top-5 flex items-center gap-2 bg-white/95 px-3 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#294b3d] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#568265]" /> Campus spaces
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/75">Plan your next gathering</p>
                <p className="mt-2 font-serif text-3xl sm:text-4xl">Spaces that bring ideas together.</p>
                <Link to="/calendar" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold hover:text-amber-200">View campus calendar <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-4 hidden w-48 border border-[#e6e1d3] bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:block sm:-left-8">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Facilities listed</p>
              <p className="mt-1 font-serif text-3xl text-[#1c493e] dark:text-emerald-300">{halls.length.toString().padStart(2, '0')}</p>
              <p className="mt-1 text-xs text-slate-500">Spaces available to request</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e5e2d8] bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#e5e2d8] px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8 dark:divide-slate-800">
          {[
            { icon: CalendarDays, title: 'Check dates', copy: 'See facility status before planning your event.' },
            { icon: Building2, title: 'Choose a space', copy: 'Review hall details, location and available facilities.' },
            { icon: ShieldCheck, title: 'Send a request', copy: 'Submit your event details for an administrative review.' },
          ].map(({ icon: Icon, title, copy }, index) => (
            <div key={title} className="flex items-start gap-4 py-6 md:px-6 md:py-7 first:md:pl-0 last:md:pr-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#d9dfd5] bg-[#f4f6f1] text-[#315b48] dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300">{index + 1}. <Icon className="ml-1 h-4 w-4" /></span>
              <div><h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{copy}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="flex flex-col justify-between gap-4 border-b border-[#deddd5] pb-5 sm:flex-row sm:items-end dark:border-slate-800">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#697d65] dark:text-emerald-300">Campus resources</p><h2 className="mt-2 font-serif text-3xl text-[#1b332c] dark:text-white sm:text-4xl">Spaces for every occasion</h2><p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">Explore the facilities, review their details and choose a date that works.</p></div>
          <Link to="/halls" className="inline-flex items-center gap-1 text-sm font-semibold text-[#315b48] hover:text-[#173c30] dark:text-emerald-300">All facilities <ChevronRight className="h-4 w-4" /></Link>
        </div>

        {featuredHalls.length ? <div className="mt-7 grid gap-6 md:grid-cols-2">
          {featuredHalls.map((hall) => (
            <article key={hall.id} className="group overflow-hidden border border-[#e2e0d7] bg-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
              <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-800 sm:h-64">
                <img src={hall.image || (hall === seminarHall ? 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80' : 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80')} alt={hall.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-4 left-4 bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#294b3d]">{hall.code}</span>
                <span className="absolute right-4 top-4"><StatusBadge status={hall.todayStatus || 'AVAILABLE'} size="md" /></span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-serif text-2xl text-[#1b332c] dark:text-white">{hall.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{hall.location}</p></div><span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Users className="h-3.5 w-3.5" />{hall.capacity} seats</span></div>
                <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600 dark:text-slate-300">{hall.description}</p>
                {hall.facilities.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{hall.facilities.slice(0, 4).map((facility) => <span key={facility} className="border border-[#e6e5de] bg-[#f8f8f5] px-2.5 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{facility}</span>)}</div>}
                <div className="mt-6 flex gap-3 border-t border-[#ecebe6] pt-4 dark:border-slate-800"><Link to={`/availability?hall=${hall.id}`} className="flex-1 border border-[#c9d2c8] py-2.5 text-center text-xs font-semibold text-[#315b48] transition hover:bg-[#f3f6f1] dark:border-slate-700 dark:text-emerald-300 dark:hover:bg-slate-800">Check dates</Link><Link to={`/book?hall=${encodeURIComponent(hall.name)}`} className="flex-1 bg-[#1c493e] py-2.5 text-center text-xs font-semibold text-white transition hover:bg-[#14382f]">Request this hall</Link></div>
              </div>
            </article>
          ))}
        </div> : <div className="mt-7 border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">Facility listings will appear here once they are configured.</div>}
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <div className="bg-[#1d4035] p-7 text-white sm:p-9"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-200">Today on campus</p><h2 className="mt-3 font-serif text-3xl">Hall availability</h2><p className="mt-2 text-sm leading-6 text-white/65">A quick view of the current status for featured campus spaces.</p><p className="mt-6 text-xs text-white/60">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><Link to="/availability" className="mt-6 inline-flex items-center gap-2 border-b border-white/50 pb-1 text-sm font-semibold hover:border-white">Open availability <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="grid gap-px border border-[#e2e0d7] bg-[#e2e0d7] sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800">
            {(featuredHalls.length ? featuredHalls : [{ id: 'seminar', name: 'Seminar Hall', location: '—', todayStatus: 'AVAILABLE' as const }, { id: 'av', name: 'AV Hall', location: '—', todayStatus: 'AVAILABLE' as const }]).map((hall) => <div key={hall.id} className="flex min-h-36 flex-col justify-between bg-white p-6 dark:bg-slate-900"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">{hall.location || 'Campus facility'}</p><h3 className="mt-2 font-serif text-xl text-slate-900 dark:text-white">{hall.name}</h3></div><div className="mt-5 flex items-center justify-between"><span className="text-xs text-slate-500">Status today</span><StatusBadge status={hall.todayStatus || 'AVAILABLE'} size="sm" /></div></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 border-b border-[#deddd5] pb-5 dark:border-slate-800"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#697d65] dark:text-emerald-300">What's coming up</p><h2 className="mt-2 font-serif text-3xl text-[#1b332c] dark:text-white">Campus calendar</h2></div><Link to="/calendar" className="inline-flex items-center gap-1 text-sm font-semibold text-[#315b48] hover:text-[#173c30] dark:text-emerald-300">Full calendar <ChevronRight className="h-4 w-4" /></Link></div>
        {upcomingBookings.length ? <div className="mt-5 divide-y divide-[#e7e5de] border-y border-[#e7e5de] dark:divide-slate-800 dark:border-slate-800">{upcomingBookings.map((booking) => <article key={booking.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div className="flex items-start gap-4"><div className="min-w-14 border-r border-[#deddd5] pr-3 text-center dark:border-slate-700"><CalendarDays className="mx-auto h-4 w-4 text-[#52715b]" /><span className="mt-1 block text-[10px] font-bold text-slate-500">{booking.bookingDate}</span></div><div><p className="font-semibold text-slate-900 dark:text-white">{booking.eventName}</p><p className="mt-1 text-xs text-slate-500">{booking.hall?.name} · {booking.department?.name || 'Academic department'}</p></div></div><div className="flex items-center gap-4 sm:justify-end"><span className="inline-flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{booking.startTime}–{booking.endTime}</span><StatusBadge status={booking.status} size="sm" /></div></article>)}</div> : <div className="mt-5 flex items-center gap-3 border border-[#e6e4dc] bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900"><CalendarDays className="h-5 w-5 text-[#69806c]" />Upcoming approved events will be shown here.</div>}
      </section>
    </main>
  );
};
