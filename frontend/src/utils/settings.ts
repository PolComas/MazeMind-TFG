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

  // Colors semàntics per dificultat
  easyColor: string;
  normalColor: string;
  hardColor: string;

  // Laberint
  mazePathColor?: string;
  mazeWallColor?: string;
  mazePlayerColor?: string;
  mazeExitColor?: string;
  mazeWallThickness?: number;

  // Colors per a les ajudes
  playerPathColor?: string;
  crashHelpColor?: string;
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
  // Tecles de moviment
  keyMoveUp: string;
  keyMoveDown: string;
  keyMoveLeft: string;
  keyMoveRight: string;
  // Tecles d'ajuda
  keyHelpReveal: string;
  keyHelpPath: string;
  keyHelpCrash: string;
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
    
    easyColor: ORIGINAL_PALETTE.easyGreen,
    normalColor: ORIGINAL_PALETTE.normalYellow,
    hardColor: ORIGINAL_PALETTE.hardRed,

    // Valors específics del laberint per defecte
    mazePathColor: '#EEF2FF',
    mazeWallColor: '#3B82F6', 
    mazePlayerColor: '#111',
    mazeExitColor: '#F59E0B',
    mazeWallThickness: 3,
    // Colors d'ajuda per defecte
    playerPathColor: 'rgba(0, 0, 0, 0.4)',
    crashHelpColor: '#E11D48',
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
    keyMoveUp: 'w',
    keyMoveDown: 's',
    keyMoveLeft: 'a',
    keyMoveRight: 'd',
    keyHelpReveal: 'h',
    keyHelpPath: 'j',
    keyHelpCrash: 'k',
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
    // Dificultats
    easyColor: ORIGINAL_PALETTE.easyGreen,
    normalColor: ORIGINAL_PALETTE.normalYellow,
    hardColor: ORIGINAL_PALETTE.hardRed,
    // Laberint
    mazePathColor: '#EEF2FF',
    mazeWallColor: '#3B82F6',
    mazePlayerColor: '#111',
    mazeExitColor: '#F59E0B',
    mazeWallThickness: 3,
    // Colors d'ajuda
    playerPathColor: 'rgba(0, 0, 0, 0.4)',
    crashHelpColor: '#E11D48',
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
    // Dificultats
    easyColor: '#34D399',
    normalColor: '#FBBF24',
    hardColor: '#F87171',
    // Laberint
    mazePathColor: '#EEF2FF',
    mazeWallColor: '#2D6CDF',
    mazePlayerColor: '#0B1021',
    mazeExitColor: '#F0B429',
    mazeWallThickness: 3,
    // Colors d'ajuda
    playerPathColor: '#22D3EE',
    crashHelpColor: '#E11D48',
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
    // Dificultats
    easyColor: '#22C55E',
    normalColor: '#F59E0B',
    hardColor: '#EF4444',
    // Laberint
    mazePathColor: '#FFFFFF',
    mazeWallColor: '#2F3A8A',
    mazePlayerColor: '#0B1021',
    mazeExitColor: '#D55E00', 
    mazeWallThickness: 3,
    // Colors d'ajuda
    playerPathColor: 'rgba(0, 0, 0, 0.4)',
    crashHelpColor: '#EF4444',
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
    // Dificultats
    easyColor: '#39FF14',
    normalColor: '#FFFF00',
    hardColor: '#FF3131',
    // Laberint
    mazePathColor: '#383838ff',
    mazeWallColor: '#FFFFFF',
    mazePlayerColor: '#2563eb',
    mazeExitColor: '#2563eb',
    mazeWallThickness: 4,
    // Colors d'ajuda
    playerPathColor: '#39FF14',
    crashHelpColor: '#FF3131',
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