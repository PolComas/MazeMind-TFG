import { PALETTE as ORIGINAL_PALETTE } from '../components/palette';

export type VisualSettings = {
  // Colors generals
  backgroundColor: string;
  textColor: string;
  subtextColor: string;
  surfaceColor: string;
  borderColor: string;

  // Accents (botons, focus, etc.)
  accentColor1: string; 
  accentColor2: string;

  // Laberint
  mazePathColor?: string;
  mazeWallColor?: string;
  mazePlayerColor?: string;
  mazeExitColor?: string;
  mazeWallThickness?: number;
};

// Configuració per a cada pantalla
export type ScreenSettings = {
  home: VisualSettings;
  levelSelect: VisualSettings;
  levelScreen: VisualSettings;
};

// Configuració global del joc (so, etc.)
export type GameSettings = {
  soundEffects: boolean;
  backgroundMusic: boolean;
};

// Tipus complet per a tota la configuració guardada
export type AppSettings = {
  visuals: ScreenSettings;
  game: GameSettings;
};

const STORAGE_KEY = 'mazeMindSettings';

// --- VALORS PER DEFECTE ---
const DEFAULT_VISUALS: VisualSettings = {
  backgroundColor: ORIGINAL_PALETTE.bg,
    textColor: ORIGINAL_PALETTE.text,
    subtextColor: ORIGINAL_PALETTE.subtext,
    surfaceColor: ORIGINAL_PALETTE.surface,
    borderColor: ORIGINAL_PALETTE.borderColor,
    accentColor1: ORIGINAL_PALETTE.playBtnFrom,
    accentColor2: ORIGINAL_PALETTE.playBtnTo,
    
    // Valors específics del laberint per defecte
    mazePathColor: '#EEF2FF',
    mazeWallColor: '#3B82F6', 
    mazePlayerColor: '#111',
    mazeExitColor: '#F59E0B',
    mazeWallThickness: 3,
};

const DEFAULT_SETTINGS: AppSettings = {
  visuals: {
    home: { ...DEFAULT_VISUALS },
    levelSelect: { ...DEFAULT_VISUALS },
    levelScreen: { ...DEFAULT_VISUALS },
  },
  game: {
    soundEffects: true,
    backgroundMusic: true,
  },
};

// Temes predefinits
export const PRESET_THEMES: Record<string, VisualSettings> = {
  'Per Defecte': {
    backgroundColor: ORIGINAL_PALETTE.bg,
    textColor: ORIGINAL_PALETTE.text,
    subtextColor: ORIGINAL_PALETTE.subtext,
    surfaceColor: ORIGINAL_PALETTE.surface,
    borderColor: ORIGINAL_PALETTE.borderColor,
    accentColor1: ORIGINAL_PALETTE.playBtnFrom,
    accentColor2: ORIGINAL_PALETTE.playBtnTo,

    mazePathColor: '#EEF2FF',
    mazeWallColor: '#3B82F6',
    mazePlayerColor: '#111',
    mazeExitColor: '#F59E0B',
    mazeWallThickness: 3,
  },
  // Tema Fosc
  'Fosc': {
    backgroundColor:
      'radial-gradient(1200px 600px at 20% 0%, rgba(86,180,233,0.12), transparent 60%), linear-gradient(145deg, #0B1021 0%, #141A32 100%)',
    textColor: '#FFFFFF',
    subtextColor: 'rgba(255,255,255,0.85)',
    surfaceColor: '#131A33',
    borderColor: 'rgba(255,255,255,0.18)',
    // Accents
    accentColor1: '#56B4E9',
    accentColor2: '#0072B2',
    // Laberint
    mazePathColor: '#EEF2FF',
    mazeWallColor: '#2D6CDF',
    mazePlayerColor: '#0B1021',
    mazeExitColor: '#F0B429',
    mazeWallThickness: 3,
  },
  // Tema Clar
  'Clar': {
    backgroundColor:
      'linear-gradient(180deg, #F7FAFF 0%, #EAF1FF 100%)',
    textColor: '#0B1021',
    subtextColor: '#334155',
    surfaceColor: '#FFFFFF',
    borderColor: 'rgba(2,6,23,0.12)',
    // Accents
    accentColor1: '#4C6FFF',
    accentColor2: '#CC79A7',
    // Laberint
    mazePathColor: '#FFFFFF',
    mazeWallColor: '#2F3A8A',
    mazePlayerColor: '#0B1021',
    mazeExitColor: '#D55E00', 
    mazeWallThickness: 3,
  },
  // Tema Alt Contrast
  'Alt Contrast': {
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    subtextColor: '#FFFFFF',
    surfaceColor: '#000000',
    borderColor: '#FFFFFF', 
    // Accents
    accentColor1: '#2563eb',
    accentColor2: '#2563eb',
    // Laberint
    mazePathColor: '#000000',
    mazeWallColor: '#FFFFFF',
    mazePlayerColor: '#2563eb',
    mazeExitColor: '#2563eb',
    mazeWallThickness: 4,
  },
};

// Carregar la configuració
export function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return deepMerge(DEFAULT_SETTINGS, parsed);
    }
  } catch (e) {
    console.error("Error al carregar configuració:", e);
    localStorage.removeItem(STORAGE_KEY);
  }
  return deepClone(DEFAULT_SETTINGS);
}

// Guardar la configuració
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Error al guardar configuració:", e);
  }
}

// Funcions auxiliars per a clonar i fusionar objectes
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function isObject(item: any): item is Record<string, any> {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  const output = deepClone(target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key as keyof T] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}