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
export function saveLevelCompletion(
  difficulty: 'easy' | 'normal' | 'hard',
  levelNumber: number,
  stars: number,
  time: number,
  points: number
): GameProgress {
  
  const currentProgress = loadProgress();
  const levelId = `${difficulty}-${levelNumber}`;

  // Obtenir les dades anteriors d'aquest nivell, si existeixen
  const previousBest = currentProgress.levels[levelId];

  const prevBestTime: number | null = previousBest?.bestTime ?? null;
  const prevBestPoints: number | null = previousBest?.bestPoints ?? null;
  const prevStars: number = previousBest?.stars ?? 0;

  // Actualitzar les millors puntuacions
  const newBestTime = (prevBestTime === null || time < prevBestTime) ? time : prevBestTime;
  const newBestPoints = (prevBestPoints === null || points > prevBestPoints) ? points : prevBestPoints;
  const newBestStars = Math.max(prevStars, stars);

  // Guardar les noves dades del nivell
  currentProgress.levels[levelId] = {
    stars: newBestStars,
    bestTime: newBestTime,
    bestPoints: newBestPoints,
  };

  // Desbloquejar el següent nivell
  const nextLevelNumber = levelNumber + 1;
  if (nextLevelNumber <= 15 && nextLevelNumber > currentProgress.highestUnlocked[difficulty]) {
    currentProgress.highestUnlocked[difficulty] = nextLevelNumber;
  }

  // Guardar tot a localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProgress));
  } catch (e) {
    console.error("Error al guardar progrés:", e);
  }

  return currentProgress;
}

// Obtenir les estadístiques d'un nivell específic
export function getLevelStats(progress: GameProgress, difficulty: 'easy' | 'normal' | 'hard', levelNumber: number): LevelProgress | null {
    const levelId = `${difficulty}-${levelNumber}`;
    return progress.levels[levelId] || null;
}