import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LogOut, Loader2, ChevronRight } from 'lucide-react';
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
  const { isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="status">
        <Loader2 className="w-6 h-6 text-brand-teal animate-spin" aria-label="Loading" />
      </div>
    );
  }
  return children;
}

export function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export function AccountMenu({ onOpenProfile }) {
  const { authUser, signOut } = useAuth();
  if (!authUser) return null;
  return (
    <div className="space-y-2 w-full">
      <button
        onClick={onOpenProfile}
        aria-label="Open your profile"
        className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl bg-white hover:bg-brand-navy-soft/50 border border-slate-200 transition cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {authUser.avatarUrl ? (
            <img
              src={authUser.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-brand-teal-soft text-brand-navy text-xs font-bold flex items-center justify-center shrink-0">
              {authUser.initials}
            </div>
          )}
          <div className="min-w-0 leading-tight">
            <div className="text-xs font-bold text-brand-navy truncate">{authUser.name}</div>
            <div className="text-[11px] text-slate-500">
              {authUser.role === 'admin' ? 'Administrator' : 'Student'}
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5 shrink-0" />
        <span>Sign out</span>
      </button>
    </div>
  );
}
