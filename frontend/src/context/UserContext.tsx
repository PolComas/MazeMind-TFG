import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthUser = {
  id: string;
  email: string;
};

type UserContextValue = {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
};

const USER_STORAGE_KEY = 'mazeMindUser';

const parseStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error parsing stored user', error);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

const toAuthUser = (sessionUser: SupabaseUser | null): AuthUser | null => {
  if (!sessionUser) {
    return null;
  }

  return {
    id: sessionUser.id,
    email: sessionUser.email ?? '',
  };
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => parseStoredUser());

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

  // Upsert del perfil quan JA hi ha sessió
  const ensureProfile = async (u: SupabaseUser) => {
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

    const bootstrapSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting Supabase session', error);
          return;
        }
        const sessionUser = data.session?.user ?? null;
        const nextUser = toAuthUser(sessionUser);
        if (isMounted) {
          setUser(nextUser);
        }
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
      setUser(toAuthUser(sessionUser));
      if (sessionUser) {
        await ensureProfile(sessionUser);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<UserContextValue>(() => ({ user, setUser }), [user]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
