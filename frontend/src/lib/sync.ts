import { supabase } from './supabase';
import { loadProgress, type GameProgress } from '../utils/progress';
import { loadPracticeBestScore } from '../utils/practiceProgress';

type Difficulty = 'easy' | 'normal' | 'hard';

type ServerProgress = {
  progress: GameProgress;
  practiceBest: number;
};

const PROGRESS_STORAGE_KEY = 'mazeMindProgress';
const PRACTICE_BEST_STORAGE_KEY = 'mazeMindPracticeBestScore';

const CAMPAIGN_MIN = 1;
const CAMPAIGN_MAX = 15;
const isCampaignKey = (key: string) => {
  const parts = key.split('-');
  if (parts.length !== 2) return false;
  const num = Number(parts[1]);
  return Number.isFinite(num) && num >= CAMPAIGN_MIN && num <= CAMPAIGN_MAX;
};

export async function fetchServerProgress(userId: string): Promise<ServerProgress> {
  if (!userId) {
    throw new Error('No s\'ha proporcionat cap usuari per obtenir el progrés.');
  }

  const { data: levelRows, error: levelError } = await supabase
    .from('level_progress')
    .select('difficulty, level_number, stars, best_time, best_points')
    .eq('user_id', userId);

  if (levelError) {
    throw levelError;
  }

  const levels: GameProgress['levels'] = {};
  for (const row of levelRows ?? []) {
    if (!row.difficulty || typeof row.level_number !== 'number') {
      continue;
    }

    const levelKey = `${row.difficulty}-${row.level_number}`;
    levels[levelKey] = {
      stars: row.stars ?? 0,
      bestTime: row.best_time ?? null,
      bestPoints: row.best_points ?? null,
    };
  }

  const { data: userProgressRow, error: userProgressError } = await supabase
    .from('user_progress')
    .select('easy, normal, hard')
    .eq('user_id', userId)
    .maybeSingle();

  if (userProgressError) {
    throw userProgressError;
  }

  const highestUnlocked = {
    easy: userProgressRow?.easy ?? 1,
    normal: userProgressRow?.normal ?? 1,
    hard: userProgressRow?.hard ?? 1,
  };

  const { data: practiceRow, error: practiceError } = await supabase
    .from('practice_best')
    .select('max_score')
    .eq('user_id', userId)
    .maybeSingle();

  if (practiceError) {
    throw practiceError;
  }

  return {
    progress: { levels, highestUnlocked },
    practiceBest: practiceRow?.max_score ?? 0,
  };
}

export function mergeProgress(local: GameProgress, server: GameProgress): GameProgress {
  const mergedLevels: GameProgress['levels'] = {};
  const levelIds = new Set([...Object.keys(local.levels), ...Object.keys(server.levels)]);

  levelIds.forEach((levelId) => {
    if (!isCampaignKey(levelId)) return;
    const localLevel = local.levels[levelId];
    const serverLevel = server.levels[levelId];

    if (!localLevel && !serverLevel) {
      return;
    }

    mergedLevels[levelId] = {
      stars: Math.max(localLevel?.stars ?? 0, serverLevel?.stars ?? 0),
      bestTime: pickBestTime(localLevel?.bestTime ?? null, serverLevel?.bestTime ?? null),
      bestPoints: pickBestPoints(localLevel?.bestPoints ?? null, serverLevel?.bestPoints ?? null),
    };
  });

  return {
    levels: mergedLevels,
    highestUnlocked: {
      easy: Math.max(local.highestUnlocked.easy, server.highestUnlocked.easy),
      normal: Math.max(local.highestUnlocked.normal, server.highestUnlocked.normal),
      hard: Math.max(local.highestUnlocked.hard, server.highestUnlocked.hard),
    },
  };
}

const pickBestTime = (local: number | null, remote: number | null) => {
  if (local === null) return remote;
  if (remote === null) return local;
  return Math.min(local, remote);
};

const pickBestPoints = (local: number | null, remote: number | null) => {
  if (local === null) return remote;
  if (remote === null) return local;
  return Math.max(local, remote);
};

export async function pushProgress(userId: string, progress: GameProgress): Promise<void> {
  if (!userId) {
    throw new Error('No s\'ha proporcionat cap usuari per sincronitzar el progrés.');
  }

  const levelRows = Object.entries(progress.levels)
    .filter(([key]) => isCampaignKey(key)).map(([key, stats]) => {
    const [difficulty, levelNumber] = key.split('-');
    return {
      user_id: userId,
      difficulty: difficulty as Difficulty,
      level_number: Number(levelNumber),
      stars: stats.stars,
      best_time: stats.bestTime,
      best_points: stats.bestPoints,
    };
  }).filter((row) => Number.isFinite(row.level_number));

  if (levelRows.length > 0) {
    const { error: levelError } = await supabase
      .from('level_progress')
      .upsert(levelRows, { onConflict: 'user_id,difficulty,level_number' });
    if (levelError) {
      throw levelError;
    }
  }

  const { error: userProgressError } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      easy: progress.highestUnlocked.easy,
      normal: progress.highestUnlocked.normal,
      hard: progress.highestUnlocked.hard,
    }, { onConflict: 'user_id' });

  if (userProgressError) {
    throw userProgressError;
  }
}

export async function pushPracticeBest(userId: string, localBest: number): Promise<void> {
  if (!userId) {
    throw new Error('No s\'ha proporcionat cap usuari per sincronitzar practice_best.');
  }

  const safeBest = Number.isFinite(localBest) ? localBest : 0;
  const { error } = await supabase
    .from('practice_best')
    .upsert({ user_id: userId, max_score: safeBest }, { onConflict: 'user_id' });

  if (error) {
    throw error;
  }
}

export async function syncOnLogin(userId: string): Promise<GameProgress> {
  const localProgress = loadProgress();
  const localPracticeBest = loadPracticeBestScore();

  const server = await fetchServerProgress(userId);
  const mergedProgress = mergeProgress(localProgress, server.progress);

  await pushProgress(userId, mergedProgress);

  const mergedPracticeBest = Math.max(localPracticeBest, server.practiceBest ?? 0);
  if (mergedPracticeBest > (server.practiceBest ?? 0)) {
    await pushPracticeBest(userId, mergedPracticeBest);
  }

  persistLocalData(mergedProgress, mergedPracticeBest);
  return mergedProgress;
}

const persistLocalData = (progress: GameProgress, practiceBest: number) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    window.localStorage.setItem(PRACTICE_BEST_STORAGE_KEY, JSON.stringify(practiceBest));
  } catch (error) {
    console.error('No s\'ha pogut guardar el progrés unificat localment', error);
  }
};
