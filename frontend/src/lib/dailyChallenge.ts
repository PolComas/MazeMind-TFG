/**
 * Daily Challenge — seed generation, level params, streak state, and cloud sync.
 *
 * The daily challenge uses a deterministic seed (`daily-YYYY-MM-DD`) so every
 * player gets the same maze each day. Difficulty scales with the day of week
 * (Mon ▸ easier, Sun ▸ harder).
 *
 * Streak state lives in localStorage for instant reads, and is synced to
 * Supabase (`daily_streak` table) for authenticated users.
 */

import { generateLevel, type Level } from '../maze/maze_generator';
import { supabase } from './supabase';

// ─── Helpers ────────────────────────────────────────────

/** Returns today's date string in YYYY-MM-DD, using local time. */
export function getTodayKey(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Deterministic seed for a given date. */
export function getDailySeed(dateKey: string): string {
    return `daily-${dateKey}`;
}

/** Day number since a fixed epoch (2025-01-01), used for the "Day #N" display. */
export function getDayNumber(dateKey: string): number {
    const epoch = new Date('2025-01-01T00:00:00');
    const target = new Date(`${dateKey}T00:00:00`);
    return Math.floor((target.getTime() - epoch.getTime()) / 86_400_000) + 1;
}

// ─── Level generation ───────────────────────────────────

type DailyDifficulty = 'easy' | 'normal' | 'hard';

interface DailyParams {
    width: number;
    height: number;
    difficulty: DailyDifficulty;
    memorizeTime: number;
}

/**
 * Returns maze parameters that scale with the day of the week.
 * Monday (1) = easiest, Sunday (0) = hardest.
 */
export function getDailyParams(dateKey: string): DailyParams {
    const day = new Date(`${dateKey}T00:00:00`).getDay(); // 0=Sun … 6=Sat

    if (day === 1 || day === 2) {
        // Mon–Tue: easy (7×7)
        return { width: 7, height: 7, difficulty: 'easy', memorizeTime: 12 };
    }
    if (day === 3 || day === 4) {
        // Wed–Thu: normal (9×9)
        return { width: 9, height: 9, difficulty: 'normal', memorizeTime: 14 };
    }
    if (day === 5) {
        // Fri: normal+ (11×11)
        return { width: 11, height: 11, difficulty: 'normal', memorizeTime: 16 };
    }
    // Sat–Sun: hard (13×13)
    return { width: 13, height: 13, difficulty: 'hard', memorizeTime: 18 };
}

/** Generates today's daily challenge level. */
export function generateDailyLevel(dateKey?: string): Level {
    const key = dateKey ?? getTodayKey();
    const params = getDailyParams(key);
    const seed = getDailySeed(key);

    return generateLevel({
        levelNumber: getDayNumber(key),
        difficulty: params.difficulty,
        width: params.width,
        height: params.height,
        memorizeTime: params.memorizeTime,
        stars: [60, 45, 30],
        seed,
    });
}

// ─── Local streak state (localStorage) ──────────────────

const STORAGE_KEY = 'mazeMindDailyStreak';

export interface DailyState {
    currentStreak: number;
    bestStreak: number;
    lastCompletedDate: string | null; // YYYY-MM-DD
    lastStars: number;
    lastTimeSeconds: number | null;
}

const DEFAULT_STATE: DailyState = {
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
    lastStars: 0,
    lastTimeSeconds: null,
};

export function getLocalDailyState(): DailyState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_STATE };
        return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch {
        return { ...DEFAULT_STATE };
    }
}

function saveLocalDailyState(state: DailyState): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // quota exceeded — silently ignore
    }
}

/** Returns true if the player already completed today's challenge. */
export function hasCompletedToday(state?: DailyState): boolean {
    const s = state ?? getLocalDailyState();
    return s.lastCompletedDate === getTodayKey();
}

/** Returns the "live" streak, accounting for whether yesterday was completed. */
export function getLiveStreak(state?: DailyState): number {
    const s = state ?? getLocalDailyState();
    if (!s.lastCompletedDate) return 0;

    const today = getTodayKey();
    if (s.lastCompletedDate === today) return s.currentStreak;

    // Check if last completion was yesterday
    const last = new Date(`${s.lastCompletedDate}T00:00:00`);
    const now = new Date(`${today}T00:00:00`);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / 86_400_000);

    if (diffDays === 1) return s.currentStreak; // streak still alive, not yet completed today
    return 0; // streak broken
}

/**
 * Records a daily challenge completion. Updates streak and stores results.
 * Returns the new state.
 */
export function completeDailyChallenge(stars: number, timeSeconds: number): DailyState {
    const state = getLocalDailyState();
    const today = getTodayKey();

    // Already completed today — just update best results
    if (state.lastCompletedDate === today) {
        if (stars > state.lastStars || (stars === state.lastStars && timeSeconds < (state.lastTimeSeconds ?? Infinity))) {
            state.lastStars = stars;
            state.lastTimeSeconds = timeSeconds;
        }
        saveLocalDailyState(state);
        return state;
    }

    // New day completion
    const liveStreak = getLiveStreak(state);
    state.currentStreak = liveStreak + 1;
    state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
    state.lastCompletedDate = today;
    state.lastStars = stars;
    state.lastTimeSeconds = timeSeconds;

    saveLocalDailyState(state);
    return state;
}

// ─── Cloud sync (Supabase) ──────────────────────────────

export async function getCloudStreak(userId: string): Promise<DailyState | null> {
    try {
        const { data, error } = await supabase
            .from('daily_streak')
            .select('current_streak, best_streak, last_completed_date, last_stars, last_time_seconds')
            .eq('user_id', userId)
            .maybeSingle();

        if (error || !data) return null;

        return {
            currentStreak: data.current_streak ?? 0,
            bestStreak: data.best_streak ?? 0,
            lastCompletedDate: data.last_completed_date ?? null,
            lastStars: data.last_stars ?? 0,
            lastTimeSeconds: data.last_time_seconds ?? null,
        };
    } catch {
        return null;
    }
}

export async function syncStreakToCloud(userId: string, state: DailyState): Promise<void> {
    try {
        await supabase
            .from('daily_streak')
            .upsert({
                user_id: userId,
                current_streak: state.currentStreak,
                best_streak: state.bestStreak,
                last_completed_date: state.lastCompletedDate,
                last_stars: state.lastStars,
                last_time_seconds: state.lastTimeSeconds,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
    } catch {
        // Silently fail — local state is the source of truth
    }
}

/**
 * Merges local + cloud state, keeping the better values.
 * Used on login to reconcile offline play.
 */
export function mergeStreakStates(local: DailyState, cloud: DailyState | null): DailyState {
    if (!cloud) return local;

    // Use whichever has the more recent completion
    const localDate = local.lastCompletedDate ?? '';
    const cloudDate = cloud.lastCompletedDate ?? '';

    if (cloudDate > localDate) {
        return {
            currentStreak: Math.max(cloud.currentStreak, local.currentStreak),
            bestStreak: Math.max(cloud.bestStreak, local.bestStreak),
            lastCompletedDate: cloud.lastCompletedDate,
            lastStars: cloud.lastStars,
            lastTimeSeconds: cloud.lastTimeSeconds,
        };
    }

    return {
        currentStreak: Math.max(local.currentStreak, cloud.currentStreak),
        bestStreak: Math.max(local.bestStreak, cloud.bestStreak),
        lastCompletedDate: local.lastCompletedDate,
        lastStars: local.lastStars,
        lastTimeSeconds: local.lastTimeSeconds,
    };
}
