import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Landmark, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevCredentials, setShowDevCredentials] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your college email and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  // Only render dev testing sandbox in development environment
  const isDev = import.meta.env.DEV;

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      {/* College Identity Header */}
      <div className="text-center space-y-3">
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 flex items-center justify-center text-amber-400 mx-auto shadow-md border border-amber-500/30">
          <Landmark className="w-7 h-7 stroke-[1.8]" />
          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-slate-950">
            ★
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-[.18em] text-amber-600 dark:text-amber-400 block mb-1">
            {settings.institutionName || 'Sri Sairam College of Engineering'}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sign In to Facility Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Authorized access for departmental faculty, seminar coordinators, and facility administrators.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Login Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Institutional Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={settings.contactEmail || 'faculty@sairamce.edu.in'}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>VTU Affiliated Institutional Facility Network</span>
          </p>
          <p>
            Need access or forgot credentials? Contact{' '}
            <a
              href={`mailto:${settings.contactEmail || 'info@sairamce.edu.in'}`}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {settings.contactEmail || 'Campus Helpdesk'}
            </a>
          </p>
        </div>
      </form>

      {/* Development Testing Sandbox (Collapsed, dev only) */}
      {isDev && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-3.5 text-xs bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setShowDevCredentials(!showDevCredentials)}
            className="w-full flex items-center justify-between text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium text-[11px] transition"
          >
            <span className="flex items-center gap-1.5">
              <span>🛠 Local Dev Testing Sandbox</span>
            </span>
            {showDevCredentials ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDevCredentials && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 block">
                Click to quick-fill local seeded development test accounts:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('superadmin@college.edu', 'superadmin123')}
                  className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-medium text-[10px] transition"
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('admin@college.edu', 'admin123')}
                  className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-[10px] transition"
                >
                  Campus Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('faculty@college.edu', 'faculty123')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-[10px] transition"
                >
                  Faculty Member
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
