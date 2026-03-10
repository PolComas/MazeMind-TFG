import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Flame, Play, Trophy, CheckCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useGameAudio } from '../audio/sound';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import NetworkBackground from '../components/NetworkBackground';
import { applyAlpha } from '../utils/color';
import {
    getTodayKey,
    getDayNumber,
    getDailyParams,
    getLocalDailyState,
    getLiveStreak,
    hasCompletedToday,
    getCloudStreak,
    mergeStreakStates,
    syncStreakToCloud,
    type DailyState,
} from '../lib/dailyChallenge';

/**
 * Pantalla del repte diari.
 *
 * Responsabilitats principals:
 * - Mostrar els paràmetres del repte d'avui (seed implícita per data).
 * - Sincronitzar la ratxa local amb el núvol si l'usuari està autenticat.
 * - Permetre iniciar o repetir el repte del dia.
 */
type Props = {
    onBack: () => void;
    onPlay: () => void;
};

export default function DailyChallengeScreen({ onBack, onPlay }: Props) {
    const { getVisualSettings } = useSettings();
    const screenSettings = getVisualSettings('home');
    const audio = useGameAudio();
    const { t, language } = useLanguage();
    const { user } = useUser();

    const [dailyState, setDailyState] = useState<DailyState>(getLocalDailyState);

    const todayKey = getTodayKey();
    const dayNumber = getDayNumber(todayKey);
    const params = getDailyParams(todayKey);
    const completed = hasCompletedToday(dailyState);
    const streak = getLiveStreak(dailyState);

    // Sincronització inicial local <-> núvol (només usuaris autenticats).
    useEffect(() => {
        if (!user || user.isGuest) return;
        let cancelled = false;

        const sync = async () => {
            const cloud = await getCloudStreak(user.id);
            if (cancelled) return;
            const local = getLocalDailyState();
            const merged = mergeStreakStates(local, cloud);
            setDailyState(merged);
            // Persistim l'estat fusionat per deixar una sola "font de veritat".
            void syncStreakToCloud(user.id, merged);
        };
        void sync();

        return () => { cancelled = true; };
    }, [user]);

    const diffLabel = useMemo(() => {
        if (params.difficulty === 'easy') return t('difficulty.easy');
        if (params.difficulty === 'hard') return t('difficulty.hard');
        return t('difficulty.normal');
    }, [params.difficulty, t]);

    const dayOfWeekLabel = useMemo(() => {
        const d = new Date(`${todayKey}T00:00:00`);
        const localeMap: Record<string, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };
        return d.toLocaleDateString(localeMap[language] ?? 'ca-ES', { weekday: 'long' });
    }, [todayKey, language]);

    const handlePlay = useCallback(() => {
        audio.playFail();
        onPlay();
    }, [audio, onPlay]);

    const styles = useMemo<Record<string, React.CSSProperties>>(() => ({
        page: {
            minHeight: '100svh',
            width: '100%',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            boxSizing: 'border-box',
            position: 'relative',
            isolation: 'isolate',
            color: screenSettings.textColor,
        },
        shell: {
            width: 'min(520px, 100%)',
            display: 'grid',
            gap: 20,
            textAlign: 'center',
        },
        backBtn: {
            justifySelf: 'start',
            padding: '10px 14px',
            borderRadius: 12,
            border: `1px solid ${screenSettings.borderColor}`,
            background: screenSettings.surfaceColor,
            color: screenSettings.textColor,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 700,
        },
        card: {
            background: screenSettings.surfaceColor,
            border: `1px solid ${screenSettings.borderColor}`,
            borderRadius: 20,
            padding: 'clamp(24px, 5vw, 40px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
            display: 'grid',
            gap: 20,
            justifyItems: 'center',
        },
        dateRow: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.8rem',
            color: screenSettings.subtextColor,
            textTransform: 'capitalize',
        },
        title: {
            margin: 0,
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
        },
        dayBadge: {
            background: `linear-gradient(135deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
            color: '#fff',
            borderRadius: 999,
            padding: '6px 16px',
            fontWeight: 800,
            fontSize: '0.85rem',
        },
        infoGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            width: '100%',
        },
        infoBubble: {
            background: applyAlpha(screenSettings.textColor, 0.06),
            borderRadius: 14,
            padding: '14px 8px',
            display: 'grid',
            justifyItems: 'center',
            gap: 4,
        },
        infoValue: {
            fontSize: '1.3rem',
            fontWeight: 800,
        },
        infoLabel: {
            fontSize: '0.7rem',
            color: screenSettings.subtextColor,
            textTransform: 'uppercase',
            fontWeight: 600,
        },
        streakRow: {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'center',
        },
        streakValue: {
            fontSize: '2rem',
            fontWeight: 900,
            color: streak > 0 ? screenSettings.accentColor1 : screenSettings.subtextColor,
        },
        streakLabel: {
            fontSize: '0.85rem',
            color: screenSettings.subtextColor,
        },
        playBtn: {
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            border: 'none',
            background: completed
                ? applyAlpha(screenSettings.accentColor1, 0.2)
                : `linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
            color: completed ? screenSettings.subtextColor : '#fff',
            fontSize: 18,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: completed ? 'none' : '0 6px 20px rgba(0,0,0,0.25)',
        },
        completedBanner: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
            padding: '10px 16px',
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10B981',
            fontWeight: 700,
            fontSize: '0.85rem',
        },
        bestRow: {
            fontSize: '0.75rem',
            color: screenSettings.subtextColor,
        },
    }), [screenSettings, completed, streak]);

    const starDisplay = '⭐'.repeat(dailyState.lastStars || 0);
    const timeDisplay = dailyState.lastTimeSeconds
        ? `${dailyState.lastTimeSeconds.toFixed(1)}s`
        : '';

    return (
        <main style={styles.page}>
            <NetworkBackground
                primaryColor={screenSettings.accentColor1}
                backgroundColor={screenSettings.backgroundColor}
            />

            <div style={styles.shell}>
                <button
                    type="button"
                    style={styles.backBtn}
                    onClick={() => { audio.playFail(); onBack(); }}
                    onMouseEnter={() => audio.playHover()}
                >
                    <ArrowLeft size={18} /> {t('common.back')}
                </button>

                <div style={styles.card}>
                    {/* Informació de la data actual */}
                    <div style={styles.dateRow}>
                        <Calendar size={14} />
                        <span>{dayOfWeekLabel} · {todayKey}</span>
                    </div>

                    {/* Títol i identificador del dia */}
                    <h1 style={styles.title}>{t('daily.title')}</h1>
                    <span style={styles.dayBadge}>#{dayNumber}</span>

                    {/* Resum de configuració del repte d'avui */}
                    <div style={styles.infoGrid}>
                        <div style={styles.infoBubble}>
                            <span style={styles.infoValue}>{params.width}×{params.height}</span>
                            <span style={styles.infoLabel}>{t('daily.size')}</span>
                        </div>
                        <div style={styles.infoBubble}>
                            <span style={styles.infoValue}>{diffLabel}</span>
                            <span style={styles.infoLabel}>{t('daily.difficulty')}</span>
                        </div>
                        <div style={styles.infoBubble}>
                            <span style={styles.infoValue}>{params.memorizeTime}s</span>
                            <span style={styles.infoLabel}>{t('daily.memorize')}</span>
                        </div>
                    </div>

                    {/* Ratxa actual */}
                    <div style={styles.streakRow}>
                        <Flame size={28} color={streak > 0 ? screenSettings.accentColor1 : screenSettings.subtextColor} />
                        <span style={styles.streakValue}>{streak}</span>
                        <span style={styles.streakLabel}>{t('daily.streak')}</span>
                    </div>
                    {dailyState.bestStreak > 0 && (
                        <div style={styles.bestRow}>
                            <Trophy size={12} style={{ verticalAlign: 'text-bottom' }} /> {t('daily.bestStreak')}: {dailyState.bestStreak}
                        </div>
                    )}

                    {/* Estat de completat del dia */}
                    {completed && (
                        <div style={styles.completedBanner}>
                            <CheckCircle size={16} />
                            {t('daily.completed')} {starDisplay} {timeDisplay}
                        </div>
                    )}

                    {/* Acció principal: jugar o repetir el repte diari */}
                    <button
                        type="button"
                        style={styles.playBtn}
                        onClick={handlePlay}
                        onMouseEnter={() => audio.playHover()}
                    >
                        <Play size={20} />
                        {completed ? t('daily.playAgain') : t('daily.play')}
                    </button>
                </div>
            </div>
        </main>
    );
}
