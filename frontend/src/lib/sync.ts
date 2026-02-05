import { supabase } from './supabase';
import type { GameProgress } from '../utils/progress';

type Difficulty = 'easy' | 'normal' | 'hard';

export type CloudSnapshot = {
  progress: GameProgress;
  practiceBest: number;
};

const CAMPAIGN_MIN = 1;
const CAMPAIGN_MAX = 15;

const isCampaignKey = (key: string) => {
  const parts = key.split('-');
  if (parts.length !== 2) return false;
  const num = Number(parts[1]);
  return Number.isFinite(num) && num >= CAMPAIGN_MIN && num <= CAMPAIGN_MAX;
};

export async function getCloudSnapshot(userId: string): Promise<CloudSnapshot> {
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

export async function pushProgress(userId: string, progress: GameProgress): Promise<void> {
  if (!userId) {
    throw new Error('No s\'ha proporcionat cap usuari per sincronitzar el progrés.');
  }

  const levelRows = Object.entries(progress.levels)
    .filter(([key]) => isCampaignKey(key)).map(([key, stats]) => {
    const [difficulty, levelNumber] = key.split('-');
    const safeTime = Number.isFinite(stats.bestTime) ? Math.round(stats.bestTime as number) : null;
    const safePoints = Number.isFinite(stats.bestPoints) ? Math.round(stats.bestPoints as number) : null;
    return {
      user_id: userId,
      difficulty: difficulty as Difficulty,
      level_number: Number(levelNumber),
      stars: stats.stars,
      best_time: safeTime,
      best_points: safePoints,
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
