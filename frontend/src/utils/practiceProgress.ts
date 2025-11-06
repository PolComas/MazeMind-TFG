// Gestionar l'storage del millor score de pràctica
export type PracticeStats = {
  maxScore: number;
};

const STORAGE_KEY = 'mazeMindPracticeStats';

const INITIAL_STATS: PracticeStats = {
  maxScore: 0,
};

// Carregar el millor score de pràctica
export function loadPracticeStats(): PracticeStats {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        maxScore: typeof parsed.maxScore === 'number' ? parsed.maxScore : 0,
      };
    }
  } catch (e) {
    console.error("Error al carregar maxScore de pràctica:", e);
    localStorage.removeItem(STORAGE_KEY);
  }

  return { ...INITIAL_STATS };
}

// Guardar el millor score DESPRÉS d'una run
export function savePracticeRun(finalScore: number): PracticeStats {
  const current = loadPracticeStats();

  const newStats: PracticeStats = {
    maxScore: Math.max(current.maxScore, finalScore),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  } catch (e) {
    console.error("Error al guardar maxScore de pràctica:", e);
  }

  return newStats;
}

// Reiniciar el millor score de pràctica
export function resetPracticeStats(): PracticeStats {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATS));
  } catch (e) {
    console.error("Error al reiniciar maxScore de pràctica:", e);
  }
  return { ...INITIAL_STATS };
}
