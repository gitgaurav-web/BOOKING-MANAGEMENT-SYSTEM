import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Hall } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Building2,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const HallsPage: React.FC = () => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHalls();
  }, []);

  const loadHalls = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Hall[]>('/halls');
      setHalls(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5" />
          <span>Campus Facilities</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Seminar Hall & AV Hall
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Explore specifications, audio-visual technical setups, and availability calendars for our primary institutional event halls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {halls.map((hall) => (
          <div
            key={hall.id}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="relative h-64 bg-slate-100 dark:bg-slate-800">
                <img
                  src={
                    hall.image ||
                    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80'
                  }
                  alt={hall.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <StatusBadge status={hall.todayStatus || 'AVAILABLE'} size="md" />
                </div>
                <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl font-medium">
                  {hall.code}
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {hall.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>{hall.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Capacity: ~{hall.capacity} (Informational only)</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {hall.description}
                </p>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Key Facilities & Gear
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {hall.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                      >
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 pt-0 flex flex-wrap items-center gap-3">
              <Link
                to={`/availability?hall=${hall.id}`}
                className="flex-1 text-center py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs transition"
              >
                View Availability Schedule
              </Link>
              <Link
                to={`/book?hall=${encodeURIComponent(hall.name)}`}
                className="flex-1 text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <span>Request Booking</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
