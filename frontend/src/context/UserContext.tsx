import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Context d'identitat/autenticació de l'aplicació.
 *
 * Responsabilitats:
 * - exposar usuari actual (auth + guest)
 * - hidratar sessió de Supabase en arrencada
 * - persistir usuari simplificat a localStorage per UX ràpida
 * - gestionar logout, delete account i login anònim
 * - detectar sessions de recuperació de contrasenya
 */
export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  isGuest: boolean;
};

type UserContextValue = {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  signInAsGuest: () => Promise<AuthUser | null>;
  isRecoverySession: boolean;
};

const USER_STORAGE_KEY = 'mazeMindUser';

/**
 * Llegeix i valida l'usuari simplificat guardat al localStorage.
 *
 * Si el payload és invàlid, es neteja per evitar estats trencats.
 */
const parseStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed?.id) return null;
    const fallbackDisplay =
      parsed.displayName ||
      (parsed.email ? parsed.email.split('@')[0] : `Guest-${parsed.id.slice(0, 4)}`);
    return {
      id: parsed.id,
      email: parsed.email ?? '',
      displayName: fallbackDisplay,
      isGuest: Boolean(parsed.isGuest),
    };
  } catch (error) {
    console.error('Error parsing stored user', error);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

/** Converteix l'usuari de Supabase a la forma `AuthUser` utilitzada al frontend. */
const toAuthUser = (sessionUser: SupabaseUser | null): AuthUser | null => {
  if (!sessionUser) {
    return null;
  }

  const provider = sessionUser.app_metadata?.provider ?? '';
  const explicitAnonymous = Boolean((sessionUser as any).is_anonymous);
  const isGuest = explicitAnonymous || provider === 'anonymous';
  const userMeta = (sessionUser.user_metadata ?? {}) as Record<string, unknown>;
  const metadataDisplayName =
    (typeof userMeta.guest_name === 'string' && userMeta.guest_name.trim()) ||
    (typeof userMeta.display_name === 'string' && userMeta.display_name.trim()) ||
    null;
  const email = sessionUser.email ?? '';
  const fallbackDisplayName = email
    ? email.split('@')[0]
    : `Guest-${sessionUser.id.slice(0, 4)}`;

  return {
    id: sessionUser.id,
    email,
    displayName: metadataDisplayName ?? fallbackDisplayName,
    isGuest,
  };
};

/**
 * Detecta si la URL actual correspon a un flux de recuperació de contrasenya.
 *
 * Supabase pot passar `type=recovery` tant a querystring com a hash.
 */
const readRecoveryFlagFromUrl = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const search = window.location.search ?? '';
  if (search) {
    const qs = new URLSearchParams(search);
    if (qs.get('type') === 'recovery') {
      return true;
    }
  }

  const hash = window.location.hash ?? '';
  if (!hash) {
    return false;
  }
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const hashParams = new URLSearchParams(normalizedHash);
  return hashParams.get('type') === 'recovery';
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

/** Proveïdor global d'usuari i autenticació. */
export function UserProvider({ children }: { children: ReactNode }) {
  const initialAuthState = useMemo(() => {
    // Si venim d'un link de recovery, no mostrem cap usuari "persistit"
    // per evitar incoherències de flux.
    const isRecovery = readRecoveryFlagFromUrl();
    return {
      isRecovery,
      user: isRecovery ? null : parseStoredUser(),
    };
  }, []);

  const [isRecoverySession, setIsRecoverySession] = useState(initialAuthState.isRecovery);
  const [user, setUser] = useState<AuthUser | null>(initialAuthState.user);
  const recoverySessionRef = useRef(isRecoverySession);

  const logout = async () => {
    // Optimització UX: primer neteja local, després intenta tancar sessió remota.
    setUser(null);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('mazeMindUser');
      }
    } catch {}

    const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
      new Promise<T | null>((resolve) => {
        const id = window.setTimeout(() => resolve(null), ms);
        promise
          .then((val) => {
            window.clearTimeout(id);
            resolve(val);
          })
          .catch(() => {
            window.clearTimeout(id);
            resolve(null);
          });
      });

    try {
      const result = await withTimeout(supabase.auth.signOut({ scope: 'global' }), 1500);
      if (!result) {
        // Fallback local per assegurar logout encara amb incidències de xarxa.
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (e) {
      console.warn('signOut failed, continuing with local cleanup', e);
    }
  };

  /** Elimina el compte autenticat via RPC i força neteja completa de sessió local. */
  const deleteAccount = async () => {
    if (!user?.id) return;
    try {
      await supabase.rpc('delete_user');
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    } finally {
      setUser(null);
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch {}
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {}
    }
  };

  /** Inicia sessió anònima (guest) i retorna l'usuari resultant. */
  const signInAsGuest = async (): Promise<AuthUser | null> => {
    const alreadyAuthenticated = await supabase.auth.getUser();
    if (alreadyAuthenticated.data.user) {
      return toAuthUser(alreadyAuthenticated.data.user);
    }

    const guestName = `Guest-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          guest_name: guestName,
        },
      },
    });

    if (error) {
      throw error;
    }

    const nextUser = toAuthUser(data.user ?? null);
    setUser(nextUser);
    return nextUser;
  };

  useEffect(() => {
    recoverySessionRef.current = isRecoverySession;
  }, [isRecoverySession]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (user) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  /**
   * Garanteix que existeix fila a `profiles` per usuaris no anònims.
   * No aplica a convidats.
   */
  const ensureProfile = async (u: SupabaseUser) => {
    if ((u.app_metadata?.provider ?? '') === 'anonymous' || (u as any).is_anonymous) {
      return;
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: u.id, email: u.email ?? '' }, { onConflict: 'id' });
      if (error) {
        console.error('Error upserting profile:', error);
      }
    } catch (err) {
      console.error('Unexpected error upserting profile:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Bootstrap inicial de sessió per hidratar estat.
    const bootstrapSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting Supabase session', error);
          return;
        }
        if (!isMounted) {
          return;
        }

        const sessionUser = data.session?.user ?? null;

        if (!sessionUser) {
          if (recoverySessionRef.current) {
            setIsRecoverySession(false);
          }
          setUser(null);
          return;
        }

        if (recoverySessionRef.current) {
          setUser(null);
          return;
        }

        const nextUser = toAuthUser(sessionUser);
        setUser(nextUser);
        if (sessionUser) {
          await ensureProfile(sessionUser);
        }
      } catch (err) {
        console.error('Unexpected Supabase session error', err);
      }
    };

    void bootstrapSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;

      if (_event === 'PASSWORD_RECOVERY') {
        // Durant recovery, ocultem usuari per forçar flux dedicat de reset.
        setIsRecoverySession(true);
        setUser(null);
        return;
      }

      if (_event === 'SIGNED_OUT') {
        setIsRecoverySession(false);
        setUser(null);
        return;
      }

      if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
        setIsRecoverySession(false);
      }

      if (recoverySessionRef.current) {
        setUser(null);
        return;
      }

      setUser(toAuthUser(sessionUser));
      if (sessionUser && _event === 'SIGNED_IN') {
        await ensureProfile(sessionUser);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ user, setUser, logout, deleteAccount, signInAsGuest, isRecoverySession }),
    [user, setUser, logout, deleteAccount, signInAsGuest, isRecoverySession]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/** Hook d'accés segur al context d'usuari. */
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
