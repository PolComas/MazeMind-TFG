import { createContext, useState, useContext, useCallback, useEffect, useMemo, useRef, } from 'react';
import type { ReactNode } from 'react';
import { loadSettings as loadLocalSettings, saveSettings as saveLocalSettings,
  type AppSettings, deepMerge, } from '../utils/settings';
import { fetchCloudSettings, upsertCloudSettings } from '../lib/cloudSettings';
import { useUser } from './UserContext';

type SettingsContextType = {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  getVisualSettings: (screen: keyof AppSettings['visuals']) => AppSettings['visuals'][keyof AppSettings['visuals']]; 
};

// Crear el context amb un valor inicial
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Crear el proveïdor del context
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
    if (!user?.id) {
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
          await upsertCloudSettings(user.id, localSettings);
          return;
        }

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
  }, [user?.id]);

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

  // Funció per actualitzar l'estat I guardar a localStorage
  const updateSettings = useCallback(
    (newSettings: AppSettings) => {
      setSettings(newSettings);
      saveLocalSettings(newSettings);
      if (user?.id) {
        debouncedCloudSave(user.id, newSettings);
      }
    },
    [debouncedCloudSave, user?.id]
  );

  // Funció per obtenir els estils d'una pantalla
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

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
