import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LogOut, Loader2, MapPin, ThumbsUp, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const DEMO_FLAG = 'friction_demo_mode';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function readDemoFlag() {
  try {
    return sessionStorage.getItem(DEMO_FLAG) === '1';
  } catch {
    return false;
  }
}

function getInitials(fullName) {
  const parts = (fullName || '?').trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [demoMode, setDemoMode] = useState(!isSupabaseConfigured || readDemoFlag());
  const [authError, setAuthError] = useState('');

  // 1. Track the Supabase session (also picks up the OAuth redirect automatically)
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setIsLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setRole(null);
        setIsLoading(false);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // 2. Load the profile (role, strikes, restrictions). Re-checked whenever the tab regains focus,
  //    so a role changed in Supabase shows up without signing out.
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const loadProfile = useCallback(async () => {
    if (!supabase || !session) return;
    const columns = 'role,created_at,restricted_until,abuse_strikes';
    let { data, error } = await supabase.from('profiles').select(columns).eq('id', session.user.id).maybeSingle();
    if (!error && !data) {
      // Signed up before the profiles trigger existed: create the missing row, then read again
      await supabase.rpc('ensure_profile');
      ({ data, error } = await supabase.from('profiles').select(columns).eq('id', session.user.id).maybeSingle());
    }
    setProfileError(error ? error.message : !data ? 'No profile row was found for this account.' : '');
    setProfile(data);
    setRole(data?.role === 'admin' ? 'admin' : 'student');
    setIsLoading(false);
  }, [session]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  useEffect(() => {
    window.addEventListener('focus', loadProfile);
    return () => window.removeEventListener('focus', loadProfile);
  }, [loadProfile]);

  const authUser = useMemo(() => {
    if (!session || !role) return null;
    const meta = session.user.user_metadata || {};
    const displayName = meta.full_name || meta.name || session.user.email;
    return {
      id: session.user.id,
      name: displayName,
      email: session.user.email,
      avatarUrl: meta.avatar_url || meta.picture || '',
      initials: getInitials(displayName),
      role
    };
  }, [session, role]);

  const signInWithGoogle = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } }
    });
    if (error) setAuthError(error.message);
  };

  const signOut = async () => {
    try {
      sessionStorage.removeItem(DEMO_FLAG);
    } catch {}
    setDemoMode(!isSupabaseConfigured);
    if (supabase) await supabase.auth.signOut();
  };

  const enterDemoMode = () => {
    try {
      sessionStorage.setItem(DEMO_FLAG, '1');
    } catch {}
    setDemoMode(true);
  };

  return (
    <AuthContext.Provider
      value={{ authUser, isLoading, demoMode, authError, signInWithGoogle, signOut, enterDemoMode, profile, profileError, refreshProfile: loadProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthGate({ children }) {
  const { authUser, isLoading, demoMode } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="status">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" aria-label="Loading" />
      </div>
    );
  }
  if (!authUser && !demoMode) return <LoginScreen />;
  return children;
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function LoginScreen() {
  const { signInWithGoogle, enterDemoMode, authError } = useAuth();
  const highlights = [
    { icon: MapPin, text: 'Pin problems to the exact building and room' },
    { icon: ThumbsUp, text: 'Confirm issues other students have already reported' },
    { icon: ShieldCheck, text: 'Moderated, spam-resistant, tracked until resolved' }
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl shadow-teal-900/5 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white font-black text-xl flex items-center justify-center">
            F
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-slate-900 text-lg leading-none">FRICTION</div>
            <div className="text-xs text-slate-500 mt-1">Campus Issue Intelligence</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Sign in to continue</h1>
        <p className="text-sm text-slate-600 mt-1.5">
          Making everyday campus problems impossible to ignore.
        </p>

        <ul className="mt-5 space-y-2.5">
          {highlights.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <button
          onClick={signInWithGoogle}
          className="mt-7 w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-sm transition cursor-pointer"
        >
          <GoogleLogo />
          Continue with Google
        </button>

        {authError && (
          <p role="alert" className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {authError}
          </p>
        )}

        <button
          onClick={enterDemoMode}
          className="mt-4 w-full text-xs text-slate-500 hover:text-teal-700 transition cursor-pointer"
        >
          Or explore the demo without signing in
        </button>
      </div>
    </div>
  );
}

export function AccountMenu({ onOpenProfile }) {
  const { authUser, signOut } = useAuth();
  if (!authUser) return null;
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl pl-1.5 pr-1 py-1">
      <button onClick={onOpenProfile} aria-label="Open your profile" className="flex items-center gap-2 rounded-lg hover:bg-slate-50 pr-1 cursor-pointer text-left">
      {authUser.avatarUrl ? (
        <img src={authUser.avatarUrl} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-lg object-cover" />
      ) : (
        <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center justify-center">
          {authUser.initials}
        </div>
      )}
      <div className="hidden sm:block leading-tight pr-1">
        <div className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">{authUser.name}</div>
        <div className="text-[10px] text-slate-500">{authUser.role === 'admin' ? 'Administrator' : 'Student'}</div>
      </div>
      </button>
      <button
        onClick={signOut}
        aria-label="Sign out"
        title="Sign out"
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
