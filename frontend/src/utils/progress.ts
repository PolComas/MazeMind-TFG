export type LevelProgress = {
  stars: number;
  bestTime: number | null;
  bestPoints: number | null; 
};

// Defineix el tipus per a totes les dades de progrés
export type GameProgress = {
  // Clau: 'difficulty-levelNumber', ex: 'easy-1', 'normal-15'
  levels: Record<string, LevelProgress>;
  // Emmagatzema el número més alt desbloquejat per cada dificultat
  highestUnlocked: {
    easy: number;
    normal: number;
    hard: number;
  };
};

const STORAGE_KEY = 'mazeMindProgress';

// Valor inicial per si no hi ha res guardat
const INITIAL_PROGRESS: GameProgress = {
  levels: {},
  highestUnlocked: { easy: 1, normal: 1, hard: 1 },
};

// Calcula el nombre total de nivells superats (amb almenys 1 estrella)
export function getTotalCompletedLevels(progress: GameProgress): number {
  return Object.values(progress.levels).filter(level => level.stars > 0).length;
}

// Calcula el nombre total d'estrelles aconseguides
export function getTotalStars(progress: GameProgress): number {
  return Object.values(progress.levels).reduce((sum, level) => sum + level.stars, 0);
}

// Calcula el nombre total de nivells perfectes (amb 3 estrelles)
export function getTotalPerfectLevels(progress: GameProgress): number {
  return Object.values(progress.levels).filter(level => level.stars === 3).length;
}

// Carregar el progrés des de localStorage
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

// Guardar el progrés d'un nivell completat
export type SaveLevelCompletionOptions = {
  baseProgress?: GameProgress;
  persist?: boolean;
};

export function saveLevelCompletion(
  difficulty: 'easy' | 'normal' | 'hard',
  levelNumber: number,
  stars: number,
  time: number,
  points: number,
  options?: SaveLevelCompletionOptions
): GameProgress {
  const sourceProgress = options?.baseProgress ?? loadProgress();
  const nextProgress: GameProgress = {
    levels: { ...sourceProgress.levels },
    highestUnlocked: { ...sourceProgress.highestUnlocked },
  };
  const levelId = `${difficulty}-${levelNumber}`;

  // Obtenir les dades anteriors d'aquest nivell, si existeixen
  const previousBest = nextProgress.levels[levelId];

  const prevBestTime: number | null = previousBest?.bestTime ?? null;
  const prevBestPoints: number | null = previousBest?.bestPoints ?? null;
  const prevStars: number = previousBest?.stars ?? 0;

  // Actualitzar les millors puntuacions
  const newBestTime = (prevBestTime === null || time < prevBestTime) ? time : prevBestTime;
  const newBestPoints = (prevBestPoints === null || points > prevBestPoints) ? points : prevBestPoints;
  const newBestStars = Math.max(prevStars, stars);

  // Guardar les noves dades del nivell
  nextProgress.levels[levelId] = {
    stars: newBestStars,
    bestTime: newBestTime,
    bestPoints: newBestPoints,
  };

  // Desbloquejar el següent nivell
  const nextLevelNumber = levelNumber + 1;
  if (nextLevelNumber <= 15 && nextLevelNumber > nextProgress.highestUnlocked[difficulty]) {
    nextProgress.highestUnlocked[difficulty] = nextLevelNumber;
  }

  // Guardar tot a localStorage
  const shouldPersist = options?.persist ?? true;
  if (shouldPersist) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
      localStorage.setItem('mazeMindLocalProgressPending', '1');
    } catch (e) {
      console.error("Error al guardar progrés:", e);
    }
  }

  return nextProgress;
}

// Obtenir les estadístiques d'un nivell específic
export function getLevelStats(progress: GameProgress, difficulty: 'easy' | 'normal' | 'hard', levelNumber: number): LevelProgress | null {
    const levelId = `${difficulty}-${levelNumber}`;
    return progress.levels[levelId] || null;
}
