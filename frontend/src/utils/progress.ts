/**
 * Utilitats de progrés de campanya (singleplayer).
 *
 * Aquesta capa centralitza:
 * - lectura/escriptura de progrés a localStorage
 * - càlcul d'agregats per Home (nivells, estrelles, perfectes)
 * - actualització segura de millors marques per nivell
 */
export type LevelProgress = {
  stars: number;
  bestTime: number | null;
  bestPoints: number | null; 
};

/** Estat complet de progrés persistit al client. */
export type GameProgress = {
  /** Clau `difficulty-levelNumber` (p. ex. `easy-1`, `normal-15`). */
  levels: Record<string, LevelProgress>;
  /** Nivell màxim desbloquejat per dificultat. */
  highestUnlocked: {
    easy: number;
    normal: number;
    hard: number;
  };
};

const STORAGE_KEY = 'mazeMindProgress';

/** Valor inicial quan encara no hi ha progrés desat. */
const INITIAL_PROGRESS: GameProgress = {
  levels: {},
  highestUnlocked: { easy: 1, normal: 1, hard: 1 },
};

/** Nombre total de nivells superats (>= 1 estrella). */
export function getTotalCompletedLevels(progress: GameProgress): number {
  return Object.values(progress.levels).filter(level => level.stars > 0).length;
}

/** Suma total d'estrelles aconseguides. */
export function getTotalStars(progress: GameProgress): number {
  return Object.values(progress.levels).reduce((sum, level) => sum + level.stars, 0);
}

/** Nombre total de nivells perfectes (3 estrelles). */
export function getTotalPerfectLevels(progress: GameProgress): number {
  return Object.values(progress.levels).filter(level => level.stars === 3).length;
}

/**
 * Carrega el progrés des de localStorage.
 *
 * Si hi ha error de parseig, neteja la clau corrupta i retorna estat inicial.
 */
export function loadProgress(): GameProgress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        levels: parsed.levels || {},
        highestUnlocked: {
          easy: parsed.highestUnlocked?.easy || 1,
          normal: parsed.highestUnlocked?.normal || 1,
          hard: parsed.highestUnlocked?.hard || 1,
        },
      };
    }
  } catch (e) {
    console.error("Error al carregar progrés:", e);
    localStorage.removeItem(STORAGE_KEY);
  }

  return { ...INITIAL_PROGRESS };
}

export type SaveLevelCompletionOptions = {
  /** Permet injectar progrés base (evita rellegir localStorage). */
  baseProgress?: GameProgress;
  /** Controla si cal persistir el resultat a localStorage. */
  persist?: boolean;
};

/**
 * Desa el resultat d'un nivell i retorna el nou estat de progrés.
 *
 * Regles:
 * - conserva millor temps (mínim)
 * - conserva millor puntuació (màxim)
 * - conserva millor estrellat (màxim)
 * - desbloqueja el següent nivell dins límit [1..15]
 */
export function saveLevelCompletion(
  difficulty: 'easy' | 'normal' | 'hard',
  levelNumber: number,
  stars: number,
  time: number,
  points: number,
  options?: SaveLevelCompletionOptions
): GameProgress {
  const safeTime = Number.isFinite(time) ? Math.round(time) : 0;
  const safePoints = Number.isFinite(points) ? Math.round(points) : 0;
  const sourceProgress = options?.baseProgress ?? loadProgress();
  const nextProgress: GameProgress = {
    levels: { ...sourceProgress.levels },
    highestUnlocked: { ...sourceProgress.highestUnlocked },
  };
  const levelId = `${difficulty}-${levelNumber}`;

  // Dades anteriors del nivell (si existeixen)
  const previousBest = nextProgress.levels[levelId];

  const prevBestTime: number | null = previousBest?.bestTime ?? null;
  const prevBestPoints: number | null = previousBest?.bestPoints ?? null;
  const prevStars: number = previousBest?.stars ?? 0;

  // Calcula millors valors històrics
  const newBestTime = (prevBestTime === null || safeTime < prevBestTime) ? safeTime : prevBestTime;
  const newBestPoints = (prevBestPoints === null || safePoints > prevBestPoints) ? safePoints : prevBestPoints;
  const newBestStars = Math.max(prevStars, stars);

  // Guarda la millor versió del nivell
  nextProgress.levels[levelId] = {
    stars: newBestStars,
    bestTime: newBestTime,
    bestPoints: newBestPoints,
  };

  // Desbloqueja el següent nivell quan toca
  const nextLevelNumber = levelNumber + 1;
  if (nextLevelNumber <= 15 && nextLevelNumber > nextProgress.highestUnlocked[difficulty]) {
    nextProgress.highestUnlocked[difficulty] = nextLevelNumber;
  }

  // Persistència opcional
  const shouldPersist = options?.persist ?? true;
  if (shouldPersist) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
    } catch (e) {
      console.error("Error al guardar progrés:", e);
    }
  }

  return nextProgress;
}

/** Retorna estadístiques d'un nivell concret o `null` si no hi ha registre. */
export function getLevelStats(progress: GameProgress, difficulty: 'easy' | 'normal' | 'hard', levelNumber: number): LevelProgress | null {
    const levelId = `${difficulty}-${levelNumber}`;
    return progress.levels[levelId] || null;
}
