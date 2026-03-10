/**
 * Persistència local de la millor puntuació de pràctica.
 *
 * Nota: es mantenen dues claus per compatibilitat:
 * - `mazeMindPracticeStats` (format antic objecte)
 * - `mazeMindPracticeBestScore` (format actual numèric)
 */
export type PracticeStats = {
  maxScore: number;
};

const STORAGE_KEY = 'mazeMindPracticeStats';
const BEST_SCORE_KEY = 'mazeMindPracticeBestScore';

const INITIAL_STATS: PracticeStats = {
  maxScore: 0,
};

/** Carrega l'estat antic de pràctica (`PracticeStats`) des de localStorage. */
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

/**
 * Desa la puntuació d'una run i retorna el millor històric resultant.
 */
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

/** Reinicia l'estructura antiga de pràctica a valors per defecte. */
export function resetPracticeStats(): PracticeStats {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATS));
  } catch (e) {
    console.error("Error al reiniciar maxScore de pràctica:", e);
  }
  return { ...INITIAL_STATS };
}

/** Llegeix la millor puntuació de pràctica (format actual). */
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
