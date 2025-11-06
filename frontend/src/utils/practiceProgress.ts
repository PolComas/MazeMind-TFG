// Tipus per al progrés del mode Score
export type PracticeProgress = {
  totalScore: number;
  currentLevel: number;
};

const STORAGE_KEY = 'mazeMindPracticeProgress';

// Valor inicial per si no hi ha res guardat
const INITIAL_PROGRESS: PracticeProgress = {
  totalScore: 0,
  currentLevel: 1,
};

// Carregar el progrés des de localStorage
export function loadPracticeProgress(): PracticeProgress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        totalScore: parsed.totalScore || 0,
        currentLevel: parsed.currentLevel || 1,
      };
    }
  } catch (e) {
    console.error("Error al carregar progrés de pràctica:", e);
    localStorage.removeItem(STORAGE_KEY);
  }

  return { ...INITIAL_PROGRESS };
}

// Guardar el progrés DESPRÉS de completar un nivell
export function savePracticeCompletion(pointsGained: number): PracticeProgress {
  
  const currentProgress = loadPracticeProgress();

  const newProgress: PracticeProgress = {
    totalScore: currentProgress.totalScore + pointsGained,
    currentLevel: currentProgress.currentLevel + 1,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
  } catch (e) {
    console.error("Error al guardar progrés de pràctica:", e);
  }

  return newProgress;
}

// Funció per reiniciar el progrés (per si es vol afegir un botó)
export function resetPracticeProgress(): PracticeProgress {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROGRESS));
  } catch (e) {
    console.error("Error al reiniciar progrés de pràctica:", e);
  }
  return { ...INITIAL_PROGRESS };
}