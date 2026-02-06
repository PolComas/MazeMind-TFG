import React, { useEffect, useMemo } from 'react';
import { RefreshCcw, ArrowLeft, XCircle } from 'lucide-react';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  onRetry: () => void;
  onBack: () => void;
  score?: number;
  bestScore?: number;
  isPracticeScoreMode?: boolean;
};

const buildStyles = (visuals: VisualSettings): Record<string, React.CSSProperties> => {
  const subtleSurface = applyAlpha(visuals.textColor, 0.08);
  const accentGradient = `linear-gradient(90deg, ${visuals.accentColor1}, ${visuals.accentColor2})`;

  return {
    overlay: {
      position: 'fixed', inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'grid', placeItems: 'center', zIndex: 50,
    },
    modalContent: {
      background: visuals.surfaceColor,
      border: `1px solid ${visuals.borderColor}`,
      borderRadius: 16,
      padding: 'clamp(24px, 5vw, 40px)',
      color: visuals.textColor,
      width: 'min(400px, 90vw)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    iconWrapper: {
      lineHeight: 1,
      marginTop: '8px',
      color: visuals.hardColor,
    },
    title: {
      fontSize: 'clamp(24px, 5vw, 32px)',
      fontWeight: 700,
      margin: 0,
      color: visuals.hardColor,
    },
    subtitle: {
      fontSize: 16,
      color: visuals.subtextColor,
      margin: '-8px 0 8px 0',
    },
    results: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      borderTop: `1px solid ${visuals.borderColor}`,
      borderBottom: `1px solid ${visuals.borderColor}`,
      padding: '16px 0',
      marginTop: 4,
    },
    resultItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
    },
    resultLabel: {
      fontSize: 12,
      color: visuals.subtextColor,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
    resultValue: {
      fontSize: 'clamp(18px, 4vw, 24px)',
      fontWeight: 600,
    },
    actions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
      marginTop: '8px',
    },
    retryButton: {
      padding: '14px', borderRadius: '10px', border: 'none',
      background: accentGradient,
      color: '#fff', fontSize: '18px', fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    },
    backButton: {
      padding: '14px', borderRadius: '10px', border: `1px solid ${visuals.borderColor}`,
      background: subtleSurface,
      color: visuals.textColor,
      fontSize: '18px', fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    },
  };
};

export default function GameOverModal({ onRetry, onBack, score, bestScore, isPracticeScoreMode, }: Props) {
  const audio = useGameAudio();
  const { getVisualSettings, settings } = useSettings();
  const { t } = useLanguage();
  const visualSettings = getVisualSettings('levelScreen');
  const styles = useMemo(() => buildStyles(visualSettings), [visualSettings]);
  const roundedScore = typeof score === 'number' ? Math.round(score) : undefined;
  const roundedBest = typeof bestScore === 'number' ? Math.round(bestScore) : undefined;

  useEffect(() => {
    const closeKey = (settings.game.keyCloseModal || '').toLowerCase();
    if (!closeKey) return;

    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === settings.game.keyCloseModal || key === closeKey) {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [settings.game.keyCloseModal, onBack]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContent} role="dialog" aria-modal="true" aria-labelledby="modalTitle">

        {/* Icona de "Game Over" */}
        <div style={styles.iconWrapper}>
          <XCircle size={64} />
        </div>

        <h2 id="modalTitle" style={styles.title}>
          {isPracticeScoreMode ? t('gameover.title.practice') : t('gameover.title.standard')}
        </h2>

        <p style={styles.subtitle}>{t('gameover.subtitle.noLives')}</p>

        {typeof roundedScore === 'number' && typeof roundedBest === 'number' && (
          <div style={styles.results}>
            <div style={styles.resultItem}>
              <span style={styles.resultLabel}>{t('gameover.score.current')}</span>
              <span style={styles.resultValue}>{roundedScore}</span>
            </div>
            <div style={styles.resultItem}>
              <span style={styles.resultLabel}>{t('gameover.score.best')}</span>
              <span style={styles.resultValue}>{roundedBest}</span>
            </div>
          </div>
        )}

        {/* Botons */}
        <div style={styles.actions}>
          <button onMouseEnter={() => audio.playHover()} style={styles.retryButton} onClick={onRetry}>
            <RefreshCcw size={18} /> {t('gameover.action.retry')}
          </button>
          <button onMouseEnter={() => audio.playHover()} style={styles.backButton} onClick={onBack}>
            <ArrowLeft size={18} /> {t('gameover.action.back')}
          </button>
        </div>
      </div>
    </div>
  );
}
