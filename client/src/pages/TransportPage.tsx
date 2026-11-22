import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bus, Car, Users, Fuel, ShieldCheck, MapPin, Phone, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Vehicle } from '../types';
import { apiRequest } from '../services/api';

export const TransportPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');

  useEffect(() => {
    apiRequest<Vehicle[]>('/vehicles')
      .then((data) => setVehicles(data))
      .catch((err) => console.error('Failed to load vehicles:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedType === 'ALL' ? vehicles : vehicles.filter((v) => v.vehicleType === selectedType);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30">
            <Bus className="h-3.5 w-3.5" />
            Central Transport &amp; Vehicle Reservation Portal (CTVRP)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Campus Fleet &amp; Vehicle Requisition
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            Official vehicle reservation system for Sri Sairam College of Engineering. Book College Buses, Executive Staff Cars, and Project Vans for academic industrial visits, sports events, conference transportation, and campus logistics.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/transport/book"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition-all shadow-md hover:scale-[1.02]"
            >
              Book a Vehicle Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/transport/trips"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xs transition-all border border-white/20"
            >
              My Trip Requisitions
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          {['ALL', 'BUS', 'CAR', 'VAN'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedType === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type === 'ALL' ? 'All Fleet' : type === 'BUS' ? 'Buses (50+ Seats)' : type === 'CAR' ? 'Staff Cars (7 Seats)' : 'Vans (14 Seats)'}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} active vehicle(s)
        </div>
      </div>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Car className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No vehicles found</h3>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different filter category above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((vehicle) => {
            const features = typeof vehicle.features === 'string' ? JSON.parse(vehicle.features || '[]') : vehicle.features || [];
            return (
              <div
                key={vehicle.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={vehicle.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'}
                      alt={vehicle.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="rounded-lg bg-blue-900/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                        {vehicle.vehicleType}
                      </span>
                      {vehicle.acAvailable && (
                        <span className="rounded-lg bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                          AC Available
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="rounded-lg bg-slate-900/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                        {vehicle.registrationNo}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                      {vehicle.name}
                    </h3>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>Capacity: <strong>{vehicle.capacity} Persons</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Fuel className="h-4 w-4 text-amber-500" />
                        <span>Fuel: <strong>{vehicle.fuelType}</strong></span>
                      </div>
                    </div>

                    {vehicle.driverName && (
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          <span>Driver: <strong>{vehicle.driverName}</strong></span>
                        </div>
                        {vehicle.driverPhone && (
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            {vehicle.driverPhone}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {features.slice(0, 3).map((f: string, i: number) => (
                        <span
                          key={i}
                          className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400"
                        >
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={`/transport/book?vehicleId=${vehicle.id}`}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
                  >
                    Reserve This Vehicle <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransportPage;
