// Gestionar l'storage del millor score de pràctica
export type PracticeStats = {
  maxScore: number;
};

const STORAGE_KEY = 'mazeMindPracticeStats';
const BEST_SCORE_KEY = 'mazeMindPracticeBestScore';

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
export function savePracticeRun(totalScore: number): number {
  const prev = loadPracticeBestScore();
  const nextBest = Math.max(prev, totalScore);
  try {
    localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(nextBest));
  } catch (e) {
    console.error("Error guardant best practice score:", e);
  }
  return nextBest;
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

// Obtenir el millor score de pràctica
export function loadPracticeBestScore(): number {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'number' && !Number.isNaN(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}
