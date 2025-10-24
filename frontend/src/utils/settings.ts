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
  backgroundColor: "linear-gradient(145deg, #1e1b4b 0%, #0c0a1d 100%)", 
  textColor: "#f1f5f9",        
  subtextColor: "#a8b2d1",
  surfaceColor: "rgba(30, 41, 59, 0.5)",
  borderColor: "rgba(255, 255, 255, 0.1)",
  accentColor1: "#f472b6",
  accentColor2: "#67e8f9", 

  // Laberint
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