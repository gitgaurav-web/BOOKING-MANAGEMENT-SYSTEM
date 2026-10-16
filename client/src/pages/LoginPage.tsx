import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  Building2,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, loginDemo } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPersonaPicker, setShowPersonaPicker] = useState(true);

  const isDev = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_PERSONAS === 'true';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '942810506433-51b9mhg7lkmp3cc6s9mseju5aiodnti2.apps.googleusercontent.com';

  // Decode Google JWT Credential Response
  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      setLoading(true);
      setError(null);
      const idToken = response.credential;
      if (!idToken) throw new Error('No credential received from Google.');

      // Decode JWT payload without external library
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

  // Launch Real Google Sign-In Account Chooser Prompt
  const triggerGoogleSignIn = () => {
    setError(null);

    // 1. Direct Google OAuth2 Account Chooser (prompts real Google login every time)
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
        console.warn('OAuth2 token client init failed, trying Google ID prompt:', err);
      }
    }

    // 2. Fallback: Google GSI One Tap / Account Picker
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

    setError('Google Sign-in SDK is still loading. Please check your internet connection and try again.');
  };

  // Sri Sairam Institutional Personas for instant demo verification
  const sairamPersonas = [
    {
      roleTitle: 'IQAC / Super Admin',
      name: 'IQAC',
      email: 'iqac@sairamce.edu.in',
      roleBadge: 'SUPER ADMIN',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200',
      icon: '👑',
      desc: 'Master executive privileges, IQAC governance, analytics & policy management',
    },
    {
      roleTitle: 'Campus Administrator',
      name: 'Dr. R. Arun Kumar',
      email: 'coo@sairamce.edu.in',
      roleBadge: 'ADMIN',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200',
      icon: '🏛️',
      desc: 'Campus administration, hall allocation & executive operations',
    },
    {
      roleTitle: 'Head of Department (CSE)',
      name: 'Dr.Smitha J A',
      email: 'hod.cse@sairamce.edu.in',
      roleBadge: 'HOD / FACULTY',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200',
      icon: '🎓',
      desc: 'Computer Science & Engineering venue requisition & department events',
    },
    {
      roleTitle: 'Head of Department (AIML)',
      name: 'Dr. Ananya Sen',
      email: 'aiml.hod@sairamce.edu.in',
      roleBadge: 'HOD / FACULTY',
      badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200',
      icon: '🤖',
      desc: 'AI & Machine Learning technical workshops & symposium bookings',
    },
  ];

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const allowedDomain = (settings.allowedEmailDomain || 'sairamce.edu.in').trim().toLowerCase().replace(/^@/, '');
    const isSystemAdmin = ['iqac@sairamce.edu.in', 'coo@sairamce.edu.in'].includes(cleanEmail);

    if (allowedDomain && !cleanEmail.endsWith(`@${allowedDomain}`) && !isSystemAdmin) {
      setError(`Access Restricted: Only official accounts ending with @${allowedDomain} are permitted.`);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPersonaLogin = async (ssoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await loginDemo(ssoEmail);
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Demo persona authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* College Identity Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Link to="/" className="inline-block transition-transform hover:scale-[1.02]">
            <img
              src="/images/sairam-logo-light.png"
              alt="Sri Sairam College of Engineering"
              className="block dark:hidden h-16 sm:h-20 w-auto object-contain mx-auto"
            />
            <img
              src="/images/sairam-logo-dark.png"
              alt="Sri Sairam College of Engineering"
              className="hidden dark:block h-16 sm:h-20 w-auto object-contain mx-auto"
            />
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Institutional Portal Access
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Authorized sign-in restricted to Sri Sairam College of Engineering faculty, HODs & administrators.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Login Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Standard Password Form (Primary / Top) */}
        <form onSubmit={handleStandardSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Institutional Email (@sairamce.edu.in)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty.dept@sairamce.edu.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
            <span>{loading ? 'Authenticating...' : 'Sign In with Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center gap-3 pt-2">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] uppercase font-bold text-slate-400">or sign in with google</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Secondary: Google Institutional SSO Button (Bottom) */}
        <div>
          <button
            type="button"
            disabled={loading}
            onClick={triggerGoogleSignIn}
            className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 bg-slate-50/70 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            {/* Official Google G Logo */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {loading ? 'Authenticating with Google...' : 'Sign in with Sairam Google Account'}
            </span>
          </button>
        </div>

        <div className="pt-1 text-center text-[11px] text-slate-500 dark:text-slate-400">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Strict @sairamce.edu.in Institutional Verification Active</span>
          </p>
        </div>
      </div>

      {/* Institutional Demo Personas (Development & Testing only - stripped in production) */}
      {isDev && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowPersonaPicker(!showPersonaPicker)}
            className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Instant 1-Click Institutional Demo Personas
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-300">
                  Click any role to test with official Sri Sairam college credentials (Dev Only)
                </span>
              </div>
            </div>
            {showPersonaPicker ? (
              <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            )}
          </button>

          {showPersonaPicker && (
            <div className="p-4 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
              {sairamPersonas.map((persona) => (
                <div
                  key={persona.email}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span>{persona.icon}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {persona.name}
                      </span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${persona.badgeColor}`}>
                        {persona.roleBadge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {persona.email}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {persona.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoPersonaLogin(persona.email)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/60 dark:hover:bg-blue-600 dark:text-blue-300 dark:hover:text-white border border-blue-200 dark:border-blue-800 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Login As</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

