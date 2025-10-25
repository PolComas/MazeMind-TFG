import { createContext, useState, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { loadSettings, saveSettings, type AppSettings } from '../utils/settings';

type SettingsContextType = {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  getVisualSettings: (screen: keyof AppSettings['visuals']) => AppSettings['visuals'][keyof AppSettings['visuals']]; 
};

// Crear el context amb un valor inicial
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Crear el proveïdor del context
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Funció per actualitzar l'estat I guardar a localStorage
  const updateSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  // Funció per obtenir els estils d'una pantalla
  const getVisualSettings = useCallback((screen: keyof AppSettings['visuals']) => {
    return settings.visuals[screen] || settings.visuals.home; 
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, getVisualSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
