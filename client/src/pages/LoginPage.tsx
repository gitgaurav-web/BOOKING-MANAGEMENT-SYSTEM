import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Building,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, login, loginWithGoogle, loginDemo } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user) {
      navigate(redirect, { replace: true });
    }
  }, [user, navigate, redirect]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPersonaPicker, setShowPersonaPicker] = useState(true);

  const googleClientId =
    ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) ||
    '942810506433-51b9mhg7lkmp3cc6s9mseju5aiodnti2.apps.googleusercontent.com';

  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      setLoading(true);
      setError(null);
      const idToken = response.credential;
      if (!idToken) throw new Error('No credential received from Google.');

      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      await loginWithGoogle({
        email: payload.email,
        name: payload.name,
        token: idToken,
      });
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Google Institutional verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleSignIn = () => {
    setError(null);

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setError(`Google Sign-in: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              return;
            }
            if (tokenResponse.access_token) {
              try {
                setLoading(true);
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await res.json();
                if (!profile.email) {
                  throw new Error('Could not retrieve email from Google account.');
                }
                await loginWithGoogle({
                  email: profile.email,
                  name: profile.name,
                  token: tokenResponse.access_token,
                });
                navigate(redirect);
              } catch (err: any) {
                setError(err.message || 'Google Institutional verification failed.');
              } finally {
                setLoading(false);
              }
            }
          },
        });
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('OAuth2 client failed:', err);
      }
    }

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        (window as any).google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('Google GSI prompt failed:', err);
      }
    }

    setError('Google Sign-in is initializing. Please check connection and try again.');
  };

  const sairamPersonas = [
    {
      roleTitle: 'Transport Officer / Super Admin',
      name: 'Dr. B. Shadaksharappa (COO)',
      email: 'coo@sairamce.edu.in',
      roleBadge: 'SUPER ADMIN',
      badgeColor: 'bg-purple-900/50 text-purple-300 border-purple-700/60',
      icon: '👑',
      desc: 'Master fleet executive privileges, driver roster & policy management',
    },
    {
      roleTitle: 'Transport Logistics Admin',
      name: 'Campus Transport Manager',
      email: 'estate.admin@sairamce.edu.in',
      roleBadge: 'ADMIN',
      badgeColor: 'bg-blue-900/50 text-blue-300 border-blue-700/60',
      icon: '🚌',
      desc: 'Vehicle requisition approval, driver assignment & Gate Pass clearance',
    },
    {
      roleTitle: 'HOD / Faculty Traveling',
      name: 'Dr. C. Valarmathi (HOD CSE)',
      email: 'hod.cse@sairamce.edu.in',
      roleBadge: 'FACULTY',
      badgeColor: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/60',
      icon: '🎓',
      desc: 'Book campus buses/cars for industrial visits, hackathons & symposiums',
    },
    {
      roleTitle: 'Faculty Coordinator',
      name: 'Prof. R. Anand (ECE)',
      email: 'faculty.ece@sairamce.edu.in',
      roleBadge: 'FACULTY',
      badgeColor: 'bg-cyan-900/50 text-cyan-300 border-cyan-700/60',
      icon: '🚗',
      desc: 'Airport pickup & official faculty travel reservations',
    },
  ];

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = async (personaEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await loginDemo(personaEmail);
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Persona login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[92vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#060A12] text-white overflow-hidden">
      {/* Ambient Radial Dark Blue Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-sky-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[460px] space-y-6">
        {/* Top Branding Header */}
        <div className="text-center space-y-2">
          {/* Sairam College Emblem & Banner */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="/brand/sairam-emblem.png"
              alt="Sri Sairam College Seal"
              className="w-14 h-14 object-contain filter drop-shadow-[0_2px_8px_rgba(56,189,248,0.25)]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/sairam-seal.png';
              }}
            />
            <div className="text-left leading-tight">
              <span className="text-[11px] font-bold text-sky-400 italic tracking-wider block">Sri</span>
              <span className="text-2xl font-black text-sky-400 tracking-tight leading-none block uppercase">
                SAIRAM
              </span>
              <span className="text-[10px] font-bold text-sky-300 tracking-wider block uppercase">
                COLLEGE OF ENGINEERING
              </span>
              <span className="text-[9px] text-slate-400 font-medium block">
                Anekal, Bengaluru. www.sairamce.edu.in
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Institutional Portal Access
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            Authorized sign-in restricted to Sri Sairam College of Engineering faculty, HODs &amp; administrators.
          </p>
        </div>

        {/* Sleek Dark Login Card */}
        <div className="rounded-[28px] border border-slate-800/90 bg-[#0B132B]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-blue-950/40 space-y-5 ring-1 ring-white/5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {/* Field: Institutional Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Institutional Email (@sairamce.edu.in)
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 transition group-focus-within:text-blue-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty.dept@sairamce.edu.in"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-[#131E32] text-white text-xs font-medium placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 transition group-focus-within:text-blue-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700/80 bg-[#131E32] text-white text-xs font-medium placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-5 rounded-xl bg-[#1A66FF] hover:bg-[#1557E0] active:scale-[0.99] text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Verifying Access...' : 'Sign In with Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute px-3 bg-[#0B132B] text-[10px] font-bold uppercase tracking-widest text-slate-500">
              OR SIGN IN WITH GOOGLE
            </span>
          </div>

          {/* Google Institutional SSO Button */}
          <button
            type="button"
            onClick={triggerGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-700/80 hover:border-slate-600 bg-[#131D2E] hover:bg-[#18253A] text-white font-bold text-xs tracking-wide transition shadow-xs active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Sairam Google Account</span>
          </button>

          {/* Institutional Verification Active Notice */}
          <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] font-medium text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Strict @sairamce.edu.in Institutional Verification Active</span>
          </div>
        </div>

        {/* 1-Click Institutional Demo Personas (Collapsible Drawer for Testing/Evaluation) */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0B132B]/60 backdrop-blur-md p-4 space-y-3 ring-1 ring-white/5">
          <button
            type="button"
            onClick={() => setShowPersonaPicker(!showPersonaPicker)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick 1-Click Institutional Demo Personas</span>
            </div>
            {showPersonaPicker ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {showPersonaPicker && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-fadeIn">
              {sairamPersonas.map((persona) => (
                <button
                  key={persona.email}
                  type="button"
                  onClick={() => handleSelectPersona(persona.email)}
                  disabled={loading}
                  className="p-2.5 rounded-xl border border-slate-800/90 hover:border-blue-500/80 bg-[#131E32]/70 hover:bg-[#18263E] text-left transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{persona.icon}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${persona.badgeColor}`}>
                      {persona.roleBadge}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mt-1 group-hover:text-blue-400 transition truncate">
                    {persona.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{persona.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-[10px] text-slate-500">
          Sri Sairam College of Engineering • Central Fleet &amp; Transport Management
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
