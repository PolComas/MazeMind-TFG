/**
 * Repte Diari — generació de seed, paràmetres de nivell, ratxa i sincronització cloud.
 *
 * El repte diari utilitza una seed determinista (`daily-YYYY-MM-DD`) perquè
 * tots els jugadors juguin el mateix laberint cada dia.
 * La dificultat escala segons el dia de la setmana.
 *
 * L'estat de ratxa viu a `localStorage` per lectura immediata i es sincronitza
 * a Supabase (`daily_streak`) per usuaris autenticats.
 */

import { generateLevel, type Level } from '../maze/maze_generator';
import { supabase } from './supabase';

// ─── Helpers ────────────────────────────────────────────

/** Retorna la data d'avui en format YYYY-MM-DD (hora local). */
export function getTodayKey(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Seed determinista per una data concreta. */
export function getDailySeed(dateKey: string): string {
    return `daily-${dateKey}`;
}

/** Número de dia des de l'època fixa (2025-01-01), per mostrar "Dia #N". */
export function getDayNumber(dateKey: string): number {
    const epoch = new Date('2025-01-01T00:00:00');
    const target = new Date(`${dateKey}T00:00:00`);
    return Math.floor((target.getTime() - epoch.getTime()) / 86_400_000) + 1;
}

// ─── Generació de nivell ───────────────────────────────

type DailyDifficulty = 'easy' | 'normal' | 'hard';

interface DailyParams {
    width: number;
    height: number;
    difficulty: DailyDifficulty;
    memorizeTime: number;
}

/**
 * Retorna paràmetres de laberint segons el dia de la setmana.
 * Dilluns (1) = més fàcil, diumenge (0) = més difícil.
 */
export function getDailyParams(dateKey: string): DailyParams {
    const day = new Date(`${dateKey}T00:00:00`).getDay(); // 0=Sun … 6=Sat

    if (day === 1 || day === 2) {
        // Dl-Dm: fàcil (7x7)
        return { width: 7, height: 7, difficulty: 'easy', memorizeTime: 12 };
    }
    if (day === 3 || day === 4) {
        // Dc-Dj: normal (9x9)
        return { width: 9, height: 9, difficulty: 'normal', memorizeTime: 14 };
    }
    if (day === 5) {
        // Divendres: normal+ (11x11)
        return { width: 11, height: 11, difficulty: 'normal', memorizeTime: 16 };
    }
    // Ds-Dg: difícil (13x13)
    return { width: 13, height: 13, difficulty: 'hard', memorizeTime: 18 };
}

/** Genera el nivell del repte diari (avui, o data indicada). */
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

// ─── Estat local de ratxa (localStorage) ───────────────

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

/** Retorna `true` si el repte d'avui ja està completat. */
export function hasCompletedToday(state?: DailyState): boolean {
    const s = state ?? getLocalDailyState();
    return s.lastCompletedDate === getTodayKey();
}

/** Retorna la ratxa "viva", considerant si ahir es va completar. */
export function getLiveStreak(state?: DailyState): number {
    const s = state ?? getLocalDailyState();
    if (!s.lastCompletedDate) return 0;

    const today = getTodayKey();
    if (s.lastCompletedDate === today) return s.currentStreak;

    // Comprova si l'última compleció va ser ahir
    const last = new Date(`${s.lastCompletedDate}T00:00:00`);
    const now = new Date(`${today}T00:00:00`);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / 86_400_000);

    if (diffDays === 1) return s.currentStreak; // la ratxa continua viva
    return 0; // ratxa trencada
}

/**
 * Registra una compleció del repte diari, actualitza ratxa i desa resultat.
 * Retorna el nou estat.
 */
export function completeDailyChallenge(stars: number, timeSeconds: number): DailyState {
    const state = getLocalDailyState();
    const today = getTodayKey();

    // Si ja està completat avui, només actualitza millor resultat del dia
    if (state.lastCompletedDate === today) {
        if (stars > state.lastStars || (stars === state.lastStars && timeSeconds < (state.lastTimeSeconds ?? Infinity))) {
            state.lastStars = stars;
            state.lastTimeSeconds = timeSeconds;
        }
        saveLocalDailyState(state);
        return state;
    }

    // Compleció de dia nou
    const liveStreak = getLiveStreak(state);
    state.currentStreak = liveStreak + 1;
    state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
    state.lastCompletedDate = today;
    state.lastStars = stars;
    state.lastTimeSeconds = timeSeconds;

    saveLocalDailyState(state);
    return state;
}

// ─── Sync cloud (Supabase) ──────────────────────────────

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
        // Si falla el cloud, local continua sent font de veritat
    }
}

/**
 * Fusiona estat local + cloud mantenint els valors més recents/útils.
 * S'utilitza en login per reconciliar joc offline.
 */
export function mergeStreakStates(local: DailyState, cloud: DailyState | null): DailyState {
    if (!cloud) return local;

    // Prioritza l'estat amb data de compleció més recent
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
