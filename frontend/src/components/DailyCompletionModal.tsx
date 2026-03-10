import { useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, CheckCircle, Flame, RefreshCcw, Trophy } from 'lucide-react';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha, pickReadableTextColor } from '../utils/color';
import { useLanguage } from '../context/LanguageContext';
import { useFocusTrap } from '../utils/focusTrap';

type Props = {
    status: 'completed' | 'failed';
    time: number;
    streak: number;
    bestStreak: number;
    stars: number;
    onRetrySameMaze: () => void;
    onBackToDaily: () => void;
};

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60).toString();
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

const buildStyles = (visuals: VisualSettings) => {
    const accentGradient = `linear-gradient(90deg, ${visuals.accentColor1}, ${visuals.accentColor2})`;
    const subtleSurface = applyAlpha(visuals.textColor, 0.08);

    return {
        overlay: {
            position: 'fixed' as const, inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'grid', placeItems: 'center', zIndex: 50,
        },
        modal: {
            background: visuals.surfaceColor,
            border: `1px solid ${visuals.borderColor}`,
            borderRadius: 16, padding: 'clamp(24px, 5vw, 40px)',
            color: visuals.textColor, width: 'min(480px, 90vw)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.45)', textAlign: 'center' as const,
            display: 'flex', flexDirection: 'column' as const, gap: 20,
            alignItems: 'center',
        },
        icon: {
            color: visuals.easyColor,
            marginBottom: -8,
        },
        title: {
            margin: 0,
            fontSize: 'clamp(22px, 5vw, 30px)',
            fontWeight: 800,
            color: visuals.easyColor,
        },
        failTitle: {
            margin: 0,
            fontSize: 'clamp(22px, 5vw, 30px)',
            fontWeight: 800,
            color: visuals.hardColor,
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            width: '100%',
            borderTop: `1px solid ${visuals.borderColor}`,
            borderBottom: `1px solid ${visuals.borderColor}`,
            padding: '16px 0',
        },
        statBubble: {
            display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4,
        },
        statValue: {
            fontSize: 'clamp(18px, 3.5vw, 24px)', fontWeight: 800,
        },
        statLabel: {
            fontSize: 12, color: visuals.subtextColor, textTransform: 'uppercase' as const, fontWeight: 600,
        },
        streakRow: {
            display: 'flex', alignItems: 'center', gap: 10,
        },
        streakValue: {
            fontSize: '2rem', fontWeight: 900, color: visuals.accentColor1,
        },
        streakLabel: {
            fontSize: '0.85rem', color: visuals.subtextColor,
        },
        bestRow: {
            fontSize: '0.75rem', color: visuals.subtextColor,
        },
        actions: {
            display: 'flex', flexDirection: 'column' as const, gap: 10, width: '100%',
        },
        primaryBtn: {
            padding: 14, borderRadius: 10, border: 'none',
            background: accentGradient,
            color: pickReadableTextColor(visuals.accentColor1),
            fontSize: 17, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        },
        secondaryBtn: {
            padding: 14, borderRadius: 10,
            border: `1px solid ${visuals.borderColor}`,
            background: subtleSurface, color: visuals.textColor,
            fontSize: 17, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        },
    };
};

export default function DailyCompletionModal({
    status, time, streak, bestStreak, stars, onRetrySameMaze, onBackToDaily
}: Props) {
    const audio = useGameAudio();
    const { getVisualSettings, settings } = useSettings();
    const { t } = useLanguage();
    const visuals = getVisualSettings('levelScreen');
    const styles = useMemo(() => buildStyles(visuals), [visuals]);
    const modalRef = useRef<HTMLDivElement | null>(null);
    useFocusTrap(true, modalRef);

    const isCompleted = status === 'completed';

    useEffect(() => {
        const closeKey = (settings.game.keyCloseModal || '').toLowerCase();
        if (!closeKey) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === closeKey) {
                e.preventDefault();
                onBackToDaily();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [settings.game.keyCloseModal, onBackToDaily]);

    const starDisplay = '⭐'.repeat(stars);

    return (
        <div style={styles.overlay}>
            <div ref={modalRef} style={styles.modal} role="dialog" aria-modal="true">
                {isCompleted ? (
                    <>
                        <CheckCircle size={52} style={styles.icon} />
                        <h2 style={styles.title}>{t('daily.modal.win')}</h2>
                    </>
                ) : (
                    <>
                        <h2 style={styles.failTitle}>{t('daily.modal.loss')}</h2>
                    </>
                )}

                {/* Stats */}
                <div style={styles.statsGrid}>
                    <div style={styles.statBubble}>
                        <span style={styles.statValue}>{formatTime(time)}</span>
                        <span style={styles.statLabel}>{t('practiceComplete.result.time')}</span>
                    </div>
                    {isCompleted && (
                        <div style={styles.statBubble}>
                            <span style={styles.statValue}>{starDisplay || '—'}</span>
                            <span style={styles.statLabel}>{t('daily.modal.stars')}</span>
                        </div>
                    )}
                    <div style={styles.statBubble}>
                        <span style={{ ...styles.statValue, color: visuals.accentColor1 }}>{streak}</span>
                        <span style={styles.statLabel}>{t('daily.streak')}</span>
                    </div>
                </div>

                {/* Streak highlight */}
                {isCompleted && streak > 0 && (
                    <div style={styles.streakRow}>
                        <Flame size={26} color={visuals.accentColor1} />
                        <span style={styles.streakValue}>{streak}</span>
                        <span style={styles.streakLabel}>{t('daily.streak')}</span>
                    </div>
                )}
                {bestStreak > 0 && (
                    <div style={styles.bestRow}>
                        <Trophy size={12} style={{ verticalAlign: 'text-bottom' }} /> {t('daily.bestStreak')}: {bestStreak}
                    </div>
                )}

                {/* Actions */}
                <div style={styles.actions}>
                    <button onMouseEnter={() => audio.playHover()} style={styles.primaryBtn} onClick={onRetrySameMaze}>
                        <RefreshCcw size={18} /> {t('daily.modal.retry')}
                    </button>
                    <button onMouseEnter={() => audio.playHover()} style={styles.secondaryBtn} onClick={onBackToDaily}>
                        <ArrowLeft size={18} /> {t('daily.modal.back')}
                    </button>
                </div>
            </div>
        </div>
    );
}
