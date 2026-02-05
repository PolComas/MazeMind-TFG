import { supabase } from './supabase';
import type { Level } from '../maze/maze_generator';
import type { MazeAnalysis } from '../maze/maze_stats';

export type DdaMode = 'campaign' | 'practice_ia' | 'practice_free' | 'practice_normal' | 'other';
export type DdaDifficulty = 'easy' | 'normal' | 'hard';

export type AttemptMetrics = {
  startedAt: string; // ISO
  endedAt: string; // ISO
  completed: boolean;
  failReason: string | null;
  timeSeconds: number;
  pointsFinal: number;
  stars: number;
  moves: number;
  crashes: number;
  revisits: number;
  revealUsed: number;
  pathHelpSeconds: number;
  crashHelpUsed: number;
  skippedMemorize: boolean;
  memorizeTime: number;
};

export type RecordAttemptInput = {
  userId: string;
  mode: DdaMode;
  level: Level;
  analysis: MazeAnalysis;
  attempt: AttemptMetrics;
  settingsSnapshot?: Record<string, unknown>;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const isFiniteNumber = (v: any): v is number => typeof v === 'number' && Number.isFinite(v);

const SKILL_MODES: readonly DdaMode[] = ['campaign', 'practice_ia'];
const RECENCY_ALPHA = 0.85;

const DEFAULT_STAR_THRESHOLDS = [800, 400, 1] as const;

export type DdaTuning = {
  memorizeTime: number;
  revealCharges: number;
  pointsStart: number;
  pointsLossPerSecond: number;
  pointsLossPathHelp: number;
  pointsLossCrashHelp: number;
  pointsCostReveal: number;
  starThresholds: readonly number[];
};

export type UserSkillRow = {
  user_id: string;
  mode: DdaMode;
  difficulty: DdaDifficulty;
  skill_mu: number;
  skill_sigma: number;
  sample_count: number;
  last_success_rate: number | null;
  last_efficiency: number | null;
  last_crash_rate: number | null;
  last_help_rate: number | null;
  last_time_per_step: number | null;
  last_maze_rating: number | null;
  streak_signed: number | null;
  updated_at?: string | null;
};

export type MazeRatingConfig = {
  weights: {
    pathLen: number;
    turns: number;
    intersectionDensity: number;
    deadEnds: number;
  };
  scale: { min: number; max: number };
};

const DEFAULT_MAZE_RATING_CONFIG: MazeRatingConfig = {
  weights: {
    pathLen: 0.55,
    turns: 2.0,
    intersectionDensity: 40,
    deadEnds: 0.35,
  },
  scale: { min: 20, max: 140 },
};

let cachedMazeConfig: { value: MazeRatingConfig; loadedAt: number } | null = null;
const MAZE_CONFIG_TTL_MS = 60_000;

const isMissingRelation = (error: any) => {
  const msg = String(error?.message ?? '');
  return error?.code === '42P01' || msg.includes('relation') || msg.includes('does not exist');
};

const parseMazeRatingConfig = (raw: any): MazeRatingConfig => {
  const weights = raw?.weights ?? {};
  const scale = raw?.scale ?? {};
  const next: MazeRatingConfig = {
    weights: {
      pathLen: isFiniteNumber(weights.pathLen) ? weights.pathLen : DEFAULT_MAZE_RATING_CONFIG.weights.pathLen,
      turns: isFiniteNumber(weights.turns) ? weights.turns : DEFAULT_MAZE_RATING_CONFIG.weights.turns,
      intersectionDensity: isFiniteNumber(weights.intersectionDensity)
        ? weights.intersectionDensity
        : DEFAULT_MAZE_RATING_CONFIG.weights.intersectionDensity,
      deadEnds: isFiniteNumber(weights.deadEnds) ? weights.deadEnds : DEFAULT_MAZE_RATING_CONFIG.weights.deadEnds,
    },
    scale: {
      min: isFiniteNumber(scale.min) ? scale.min : DEFAULT_MAZE_RATING_CONFIG.scale.min,
      max: isFiniteNumber(scale.max) ? scale.max : DEFAULT_MAZE_RATING_CONFIG.scale.max,
    },
  };
  if (next.scale.max <= next.scale.min) {
    next.scale = { ...DEFAULT_MAZE_RATING_CONFIG.scale };
  }
  return next;
};

async function getMazeRatingConfig(): Promise<MazeRatingConfig> {
  const now = Date.now();
  if (cachedMazeConfig && now - cachedMazeConfig.loadedAt < MAZE_CONFIG_TTL_MS) {
    return cachedMazeConfig.value;
  }

  try {
    const { data, error } = await supabase
      .from('dda_config')
      .select('config')
      .eq('id', 'maze_rating')
      .maybeSingle();

    if (error) {
      if (!isMissingRelation(error)) {
        console.warn('Error llegint dda_config:', error);
      }
      cachedMazeConfig = { value: DEFAULT_MAZE_RATING_CONFIG, loadedAt: now };
      return DEFAULT_MAZE_RATING_CONFIG;
    }

    const config = parseMazeRatingConfig(data?.config ?? null);
    cachedMazeConfig = { value: config, loadedAt: now };
    return config;
  } catch (err) {
    console.warn('No s\'ha pogut carregar dda_config:', err);
    cachedMazeConfig = { value: DEFAULT_MAZE_RATING_CONFIG, loadedAt: now };
    return DEFAULT_MAZE_RATING_CONFIG;
  }
}

// Un rating simple de "dificultat objectiva" del laberint basat en features.
export function computeMazeRating(a: MazeAnalysis, config?: MazeRatingConfig): number {
  const cfg = config ?? DEFAULT_MAZE_RATING_CONFIG;
  const r =
    cfg.weights.pathLen * a.optimalPathLength +
    cfg.weights.turns * a.optimalPathTurns +
    cfg.weights.intersectionDensity * a.intersectionDensity +
    cfg.weights.deadEnds * a.deadEnds;
  return Number(r.toFixed(3));
}

export async function ensureLevelCatalogRow(level: Level, analysis: MazeAnalysis, mazeRating?: number): Promise<void> {
  const rating = isFiniteNumber(mazeRating) ? mazeRating : computeMazeRating(analysis);

  const payload = {
    level_id: level.id,
    difficulty: level.difficulty,
    level_number: level.number,
    width: level.width,
    height: level.height,
    memorize_time_default: level.memorizeTime,
    optimal_path_len: analysis.optimalPathLength,
    optimal_turns: analysis.optimalPathTurns,
    intersection_density: analysis.intersectionDensity,
    dead_ends: analysis.deadEnds,
    maze_rating: rating,
    analysis_json: analysis as unknown as Record<string, unknown>,
  };

  const { error } = await supabase
    .from('level_catalog')
    .upsert(payload, { onConflict: 'level_id' });

  if (error) throw error;
}

export async function recordAttemptAndUpdateSkill(input: RecordAttemptInput): Promise<void> {
  const mazeConfig = await getMazeRatingConfig();
  const mazeRating = computeMazeRating(input.analysis, mazeConfig);

  await ensureLevelCatalogRow(input.level, input.analysis, mazeRating);

  const attemptRow = {
    user_id: input.userId,
    mode: input.mode,
    level_id: input.level.id,
    difficulty: input.level.difficulty,
    level_number: input.level.number,
    width: input.level.width,
    height: input.level.height,
    memorize_time: input.attempt.memorizeTime,
    started_at: input.attempt.startedAt,
    ended_at: input.attempt.endedAt,
    completed: input.attempt.completed,
    fail_reason: input.attempt.failReason,
    time_seconds: input.attempt.timeSeconds,
    points_final: input.attempt.pointsFinal,
    stars: input.attempt.stars,
    moves: input.attempt.moves,
    crashes: input.attempt.crashes,
    revisits: input.attempt.revisits,
    reveal_used: input.attempt.revealUsed,
    path_help_seconds: input.attempt.pathHelpSeconds,
    crash_help_used: input.attempt.crashHelpUsed,
    skipped_memorize: input.attempt.skippedMemorize,
    optimal_path_len: input.analysis.optimalPathLength,
    optimal_turns: input.analysis.optimalPathTurns,
    maze_rating: mazeRating,
    settings_snapshot: input.settingsSnapshot ?? null,
  };

  const { error: insertError } = await supabase
    .from('level_attempts')
    .insert(attemptRow);

  if (insertError) throw insertError;

  if (SKILL_MODES.includes(input.mode)) {
    await refreshUserSkillContext(input.userId, {
      mode: input.mode,
      difficulty: input.level.difficulty as DdaDifficulty,
      windowSize: 12,
      recencyAlpha: RECENCY_ALPHA,
    });
  }
}

export async function getUserSkill(userId: string, mode: DdaMode, difficulty: DdaDifficulty): Promise<UserSkillRow | null> {
  try {
    const { data, error } = await supabase
      .from('user_skill_v2')
      .select('*')
      .eq('user_id', userId)
      .eq('mode', mode)
      .eq('difficulty', difficulty)
      .maybeSingle();
    if (error) {
      if (!isMissingRelation(error)) throw error;
      console.warn('user_skill_v2 no existeix encara:', error);
      return null;
    }
    return data as UserSkillRow | null;
  } catch (err) {
    console.warn('No s\'ha pogut obtenir user_skill_v2:', err);
    return null;
  }
}

const FLOW_TARGETS = {
  success: 0.7,
  crash: 0.2,
  help: 0.25,
  timePerStep: 1.4,
  perf: 0.65,
};

const flowDeltaFromSkill = (skill: any) => {
  const success = clamp(Number(skill?.last_success_rate ?? FLOW_TARGETS.success), 0, 1);
  const crashRate = clamp(Number(skill?.last_crash_rate ?? FLOW_TARGETS.crash), 0, 1);
  const helpRate = clamp(Number(skill?.last_help_rate ?? FLOW_TARGETS.help), 0, 1);
  const timePerStep = clamp(Number(skill?.last_time_per_step ?? FLOW_TARGETS.timePerStep), 0.4, 3.0);

  const successDelta = (success - FLOW_TARGETS.success) * 0.8;
  const crashDelta = (FLOW_TARGETS.crash - crashRate) * 0.6;
  const helpDelta = (FLOW_TARGETS.help - helpRate) * 0.45;
  const timeDelta = (FLOW_TARGETS.timePerStep - timePerStep) * 0.35;

  return clamp(successDelta + crashDelta + helpDelta + timeDelta, -0.3, 0.3);
};

const tuningFromSkill = (args: {
  skill: any;
  baseMemorizeTime: number;
  mazeRating: number;
  ratingScale: { min: number; max: number };
}): DdaTuning => {
  const { skill, baseMemorizeTime, mazeRating, ratingScale } = args;
  const mu = clamp(Number(skill?.skill_mu ?? 0.5), 0, 1);
  const sigma = clamp(Number(skill?.skill_sigma ?? 1), 0.08, 1);
  const flowDelta = flowDeltaFromSkill(skill);
  const streakSigned = clamp(Number(skill?.streak_signed ?? 0), -5, 5);

  const scaleDen = Math.max(1, ratingScale.max - ratingScale.min);
  const ratingNorm = clamp((mazeRating - ratingScale.min) / scaleDen, 0, 1);

  const muAdj = clamp(mu + flowDelta * 0.25, 0, 1);
  const basePressure = clamp(muAdj - ratingNorm, -0.6, 0.6);
  const perfDelta = clamp(mu - FLOW_TARGETS.perf, -0.35, 0.35);
  const stability = clamp(1 - sigma, 0.15, 0.85);

  const streakAdj =
    streakSigned >= 2
      ? 0.06 * Math.min(3, streakSigned - 1)
      : streakSigned <= -2
        ? -0.08 * Math.min(3, Math.abs(streakSigned) - 1)
        : 0;

  const pressure = clamp(
    (0.55 * basePressure + 0.25 * flowDelta + 0.2 * perfDelta) * stability + streakAdj,
    -0.45,
    0.45
  );

  const streakEase = streakSigned <= -2 ? Math.min(2, Math.abs(streakSigned) - 1) : 0;
  const streakHard = streakSigned >= 2 ? Math.min(1, streakSigned - 1) : 0;

  const memorizeTime = clamp(
    Math.round(baseMemorizeTime * (1 - pressure * 0.35) - flowDelta * 1.5 + streakEase - streakHard),
    3,
    30
  );

  const revealCharges = clamp(Math.round(3 - pressure * 2 - flowDelta + streakEase - streakHard), 1, 4);
  const pointsStart = 1000;
  const pointsLossPerSecond = clamp(1.4 + pressure * 1.1, 0.6, 3.2);
  const pointsLossPathHelp = clamp(2 + pressure * 1.3 + flowDelta * 0.6, 0.5, 4.5);
  const pointsLossCrashHelp = clamp(20 + pressure * 8, 10, 35);
  const pointsCostReveal = clamp(70 + pressure * 22, 30, 110);
  const starMultiplier = clamp(1 - pressure * 0.1, 0.85, 1.1);
  const starThresholds = DEFAULT_STAR_THRESHOLDS.map((v) => Math.max(1, Math.round(v * starMultiplier)));

  return {
    memorizeTime,
    revealCharges,
    pointsStart,
    pointsLossPerSecond,
    pointsLossPathHelp,
    pointsLossCrashHelp,
    pointsCostReveal,
    starThresholds,
  };
};

const buildRecencyWeights = (count: number, alpha: number) =>
  Array.from({ length: count }, (_, i) => Math.pow(alpha, i));

const weightedMean = (values: number[], weights: number[]) => {
  const totalW = weights.reduce((s, w) => s + w, 0) || 1;
  const sum = values.reduce((acc, v, i) => acc + v * weights[i], 0);
  return sum / totalW;
};

const weightedVariance = (values: number[], weights: number[], mean: number) => {
  const totalW = weights.reduce((s, w) => s + w, 0) || 1;
  const sum = values.reduce((acc, v, i) => acc + weights[i] * Math.pow(v - mean, 2), 0);
  return sum / totalW;
};

const computeStreakSigned = (attempts: any[]) => {
  if (!attempts.length) return 0;
  const firstSuccess = Boolean(attempts[0]?.completed);
  let count = 0;
  for (const a of attempts) {
    if (Boolean(a?.completed) === firstSuccess) count += 1;
    else break;
  }
  return firstSuccess ? count : -count;
};

export async function refreshUserSkillContext(
  userId: string,
  opts: { mode: DdaMode; difficulty: DdaDifficulty; windowSize: number; recencyAlpha: number }
): Promise<void> {
  const { data: rows, error } = await supabase
    .from('level_attempts')
    .select('completed,time_seconds,points_final,stars,moves,crashes,revisits,reveal_used,path_help_seconds,crash_help_used,optimal_path_len,maze_rating,ended_at')
    .eq('user_id', userId)
    .eq('mode', opts.mode)
    .eq('difficulty', opts.difficulty)
    .order('ended_at', { ascending: false })
    .limit(opts.windowSize);

  if (error) throw error;

  const attempts = rows ?? [];
  if (attempts.length === 0) {
    const { error: upErr } = await supabase
      .from('user_skill_v2')
      .upsert(
        {
          user_id: userId,
          mode: opts.mode,
          difficulty: opts.difficulty,
          skill_mu: 0.5,
          skill_sigma: 0.5,
          sample_count: 0,
          streak_signed: 0,
        },
        { onConflict: 'user_id,mode,difficulty' }
      );
    if (upErr) {
      if (isMissingRelation(upErr)) {
        console.warn('user_skill_v2 no existeix encara:', upErr);
        return;
      }
      throw upErr;
    }
    return;
  }

  const metrics = attempts.map((a: any) => {
    const moves = Math.max(1, Number(a.moves ?? 1));
    const opt = Math.max(1, Number(a.optimal_path_len ?? 1));
    const crashes = Math.max(0, Number(a.crashes ?? 0));
    const revisits = Math.max(0, Number(a.revisits ?? 0));
    const reveals = Math.max(0, Number(a.reveal_used ?? 0));
    const pathSec = Math.max(0, Number(a.path_help_seconds ?? 0));
    const crashHelp = Math.max(0, Number(a.crash_help_used ?? 0));
    const timeSec = Math.max(0, Number(a.time_seconds ?? 0));

    const success = a.completed ? 1 : 0;
    const efficiency = clamp(opt / moves, 0, 1);
    const crashRate = clamp(crashes / moves, 0, 1);
    const revisitRate = clamp(revisits / moves, 0, 1);
    const helpRate = clamp((reveals + pathSec / 10 + crashHelp / 2) / moves, 0, 1);
    const timePerStep = timeSec / opt; // segons per pas

    const crashPen = clamp(crashRate * 6, 0, 1);
    const helpPen = clamp(helpRate * 3, 0, 1);
    const revisitPen = clamp(revisitRate * 2, 0, 1);
    const timePen = clamp(timePerStep / 2.2, 0, 1); // >2.2s/pas penalitza molt

    const perf =
      0.4 * success +
      0.22 * efficiency +
      0.14 * (1 - crashPen) +
      0.1 * (1 - helpPen) +
      0.07 * (1 - revisitPen) +
      0.07 * (1 - timePen);

    return {
      success,
      efficiency,
      crashRate,
      helpRate,
      revisitRate,
      timePerStep,
      mazeRating: Number(a.maze_rating ?? 0),
      perf: clamp(perf, 0, 1),
    };
  });

  const weights = buildRecencyWeights(metrics.length, opts.recencyAlpha);
  const successRate = weightedMean(metrics.map((m) => m.success), weights);
  const avgEfficiency = weightedMean(metrics.map((m) => m.efficiency), weights);
  const avgCrashRate = weightedMean(metrics.map((m) => m.crashRate), weights);
  const avgHelpRate = weightedMean(metrics.map((m) => m.helpRate), weights);
  const avgTimePerStep = weightedMean(metrics.map((m) => m.timePerStep), weights);
  const avgMazeRating = weightedMean(metrics.map((m) => m.mazeRating), weights);
  const mu = weightedMean(metrics.map((m) => m.perf), weights);
  const variance = weightedVariance(metrics.map((m) => m.perf), weights, mu);
  const rawSigma = Math.sqrt(Math.max(variance, 1e-4));
  const coverage = clamp(metrics.length / opts.windowSize, 0, 1);
  const priorSigma = 0.45;
  const sigma = clamp(rawSigma * coverage + priorSigma * (1 - coverage), 0.12, 0.7);
  const streakSigned = computeStreakSigned(attempts);

  const { error: upsertError } = await supabase
    .from('user_skill_v2')
    .upsert(
      {
        user_id: userId,
        mode: opts.mode,
        difficulty: opts.difficulty,
        skill_mu: Number(mu.toFixed(4)),
        skill_sigma: Number(sigma.toFixed(4)),
        sample_count: metrics.length,
        last_success_rate: Number(successRate.toFixed(4)),
        last_efficiency: Number(avgEfficiency.toFixed(4)),
        last_crash_rate: Number(avgCrashRate.toFixed(4)),
        last_help_rate: Number(avgHelpRate.toFixed(4)),
        last_time_per_step: Number(avgTimePerStep.toFixed(4)),
        last_maze_rating: Number(avgMazeRating.toFixed(3)),
        streak_signed: streakSigned,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,mode,difficulty' }
    );

  if (upsertError) {
    if (isMissingRelation(upsertError)) {
      console.warn('user_skill_v2 no existeix encara:', upsertError);
      return;
    }
    throw upsertError;
  }
}

const aggregateSkillRows = (rows: UserSkillRow[]): UserSkillRow | null => {
  if (!rows.length) return null;
  const weights = rows.map((r) => Math.max(1, Number(r.sample_count ?? 1)));

  const mu = weightedMean(rows.map((r) => Number(r.skill_mu ?? 0.5)), weights);
  const sigma = weightedMean(rows.map((r) => Number(r.skill_sigma ?? 0.5)), weights);
  const lastSuccess = weightedMean(rows.map((r) => Number(r.last_success_rate ?? FLOW_TARGETS.success)), weights);
  const lastEfficiency = weightedMean(rows.map((r) => Number(r.last_efficiency ?? 0.6)), weights);
  const lastCrash = weightedMean(rows.map((r) => Number(r.last_crash_rate ?? FLOW_TARGETS.crash)), weights);
  const lastHelp = weightedMean(rows.map((r) => Number(r.last_help_rate ?? FLOW_TARGETS.help)), weights);
  const lastTime = weightedMean(rows.map((r) => Number(r.last_time_per_step ?? FLOW_TARGETS.timePerStep)), weights);
  const lastMazeRating = weightedMean(rows.map((r) => Number(r.last_maze_rating ?? 0)), weights);

  return {
    user_id: rows[0].user_id,
    mode: rows[0].mode,
    difficulty: rows[0].difficulty,
    skill_mu: Number(mu.toFixed(4)),
    skill_sigma: Number(sigma.toFixed(4)),
    sample_count: rows.reduce((s, r) => s + Number(r.sample_count ?? 0), 0),
    last_success_rate: Number(lastSuccess.toFixed(4)),
    last_efficiency: Number(lastEfficiency.toFixed(4)),
    last_crash_rate: Number(lastCrash.toFixed(4)),
    last_help_rate: Number(lastHelp.toFixed(4)),
    last_time_per_step: Number(lastTime.toFixed(4)),
    last_maze_rating: Number(lastMazeRating.toFixed(3)),
    streak_signed: 0,
  };
};

export async function getAggregatedSkillForMode(userId: string, mode: DdaMode): Promise<UserSkillRow | null> {
  try {
    const { data, error } = await supabase
      .from('user_skill_v2')
      .select('*')
      .eq('user_id', userId)
      .eq('mode', mode);
    if (error) {
      if (!isMissingRelation(error)) throw error;
      return null;
    }
    return aggregateSkillRows((data ?? []) as UserSkillRow[]);
  } catch (err) {
    console.warn('No s\'ha pogut obtenir skill agregat:', err);
    return null;
  }
}

export async function recommendDdaTuning(
  userId: string,
  mode: DdaMode,
  level: Level,
  analysis: MazeAnalysis
): Promise<DdaTuning> {
  const mazeConfig = await getMazeRatingConfig();
  const mazeRating = computeMazeRating(analysis, mazeConfig);
  const skill = await getUserSkill(userId, mode, level.difficulty as DdaDifficulty);
  return tuningFromSkill({
    skill,
    baseMemorizeTime: level.memorizeTime,
    mazeRating,
    ratingScale: mazeConfig.scale,
  });
}

// --- Recomanació (mode IA) ---
export type PracticeIaParams = {
  width: number;
  height: number;
  memorizeTime: number;
  difficulty: 'normal' | 'hard';
  seed: string;
};

export async function recommendPracticeIaParams(userId: string): Promise<PracticeIaParams> {
  const skill =
    (await getAggregatedSkillForMode(userId, 'practice_ia')) ??
    (await getAggregatedSkillForMode(userId, 'campaign'));
  const mu = clamp(Number(skill?.skill_mu ?? 0.5), 0, 1);
  const flowDelta = flowDeltaFromSkill(skill);
  const muAdj = clamp(mu + flowDelta * 0.2, 0, 1);

  const size = Math.round(5 + muAdj * 10);
  const width = clamp(size, 5, 18);
  const height = clamp(size, 5, 18);

  const baseMem = clamp(Math.round((width * height) / 7), 6, 20);
  const adjust = muAdj < 0.35 ? 4 : muAdj < 0.55 ? 2 : muAdj > 0.85 ? -3 : muAdj > 0.7 ? -1 : 0;
  const memorizeTime = clamp(baseMem + adjust, 4, 28);

  const difficulty: PracticeIaParams['difficulty'] = muAdj > 0.8 ? 'hard' : 'normal';

  const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return { width, height, memorizeTime, difficulty, seed };
}
