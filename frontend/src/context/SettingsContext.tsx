import { createContext, useState, useContext, useCallback, useEffect, useMemo, useRef, } from 'react';
import type { ReactNode } from 'react';
import { loadSettings as loadLocalSettings, saveSettings as saveLocalSettings,
  type AppSettings, deepMerge, } from '../utils/settings';
import { fetchCloudSettings, upsertCloudSettings } from '../lib/cloudSettings';
import { useUser } from './UserContext';

/**
 * Context de configuració global del joc.
 *
 * Responsabilitats:
 * - carregar i servir settings actius de la sessió
 * - persistir canvis a localStorage
 * - hidratar/sincronitzar amb cloud en usuaris autenticats
 */
type SettingsContextType = {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  getVisualSettings: (screen: keyof AppSettings['visuals']) => AppSettings['visuals'][keyof AppSettings['visuals']]; 
};

// Context amb inicialització diferida: es valida via `useSettings()`.
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/** Proveïdor de settings amb persistència local + cloud. */
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [settings, setSettings] = useState<AppSettings>(() => loadLocalSettings());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSettingsRef = useRef(settings);

  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user?.id || user.isGuest) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      return;
    }

    let canceled = false;

    const hydrate = async () => {
      try {
        const localSettings = latestSettingsRef.current;
        const { settings: cloudSettings } = await fetchCloudSettings(user.id);
        if (canceled) return;

        if (!cloudSettings) {
          // Primer login sense configuració al núvol: publiquem estat local.
          await upsertCloudSettings(user.id, localSettings);
          return;
        }

        // Fusionem per mantenir compatibilitat cap enrere amb claus noves.
        const merged = deepMerge(localSettings, cloudSettings);
        setSettings(merged);
        saveLocalSettings(merged);
      } catch (error) {
        console.warn("No s'ha pogut hidratar settings del núvol", error);
      }
    };

    void hydrate();

    return () => {
      canceled = true;
    };
  }, [user?.id, user?.isGuest]);

  /**
   * Debounce de persistència cloud per evitar un `upsert` per cada input.
   */
  const debouncedCloudSave = useCallback((userId: string, next: AppSettings) => {
    const persist = () => {
      upsertCloudSettings(userId, next).catch(err =>
        console.warn('upsertCloudSettings failed', err)
      );
      saveTimerRef.current = null;
    };

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    if (typeof window === 'undefined') {
      persist();
      return;
    }

    saveTimerRef.current = window.setTimeout(persist, 400);
  }, []);

  /**
   * Actualitza settings actius i persisteix.
   * - sempre local
   * - cloud només per usuaris autenticats no guest
   */
  const updateSettings = useCallback(
    (newSettings: AppSettings) => {
      setSettings(newSettings);
      saveLocalSettings(newSettings);
      if (user?.id && !user.isGuest) {
        debouncedCloudSave(user.id, newSettings);
      }
    },
    [debouncedCloudSave, user?.id, user?.isGuest]
  );

  /** Retorna la configuració visual d'una pantalla (amb fallback a Home). */
  const getVisualSettings = useCallback((screen: keyof AppSettings['visuals']) => {
    return settings.visuals[screen] || settings.visuals.home; 
  }, [settings]);

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      updateSettings,
      getVisualSettings,
    }),
    [settings, updateSettings, getVisualSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

/** Hook d'accés segur al context de settings. */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
