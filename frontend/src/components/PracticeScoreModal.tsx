import React, { useEffect, useMemo, useRef } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';
import { useLanguage } from '../context/LanguageContext';
import { useFocusTrap } from '../utils/focusTrap';

type Props = {
  levelNumber: number;
  pointsGained: number;
  totalScore: number;
  onNextLevel: () => void;
  onBack: () => void;
};

const buildStyles = (visuals: VisualSettings): Record<string, React.CSSProperties> => {
  const accentGradient = `linear-gradient(90deg, ${visuals.accentColor1}, ${visuals.accentColor2})`;
  const translucentSurface = applyAlpha(visuals.textColor, 0.08);

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
      borderRadius: 16, padding: 'clamp(24px, 5vw, 40px)',
      color: visuals.textColor, width: 'min(500px, 90vw)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.45)', textAlign: 'center',
      display: 'flex', flexDirection: 'column', gap: '24px',
    },
    successIcon: {
      color: visuals.easyColor,
      marginBottom: '-16px',
    },
    title: {
      fontSize: 'clamp(24px, 5vw, 32px)',
      fontWeight: 700, margin: 0,
      color: visuals.easyColor,
    },
    results: {
      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      borderTop: `1px solid ${visuals.borderColor}`,
      borderBottom: `1px solid ${visuals.borderColor}`,
      padding: '20px 0',
    },
    resultItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
    resultLabel: { fontSize: 14, color: visuals.subtextColor, textTransform: 'uppercase' },
    resultValue: { fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 600 },
    actions: { display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' },
    retryButton: {
      padding: '14px', borderRadius: '10px', border: 'none',
      background: accentGradient,
      color: '#fff', fontSize: '18px', fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    },
    backButton: {
      padding: '14px', borderRadius: '10px', border: `1px solid ${visuals.borderColor}`,
      background: translucentSurface, color: visuals.textColor,
      fontSize: '18px', fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    },
  };
};

export default function PracticeScoreModal({
  levelNumber,
  pointsGained,
  totalScore,
  onNextLevel,
  onBack
}: Props) {
  const audio = useGameAudio();
  const { getVisualSettings, settings } = useSettings();
  const { t } = useLanguage();
  const visualSettings = getVisualSettings('levelScreen');
  const styles = useMemo(() => buildStyles(visualSettings), [visualSettings]);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useFocusTrap(true, modalRef);

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
      <div ref={modalRef} style={styles.modalContent} role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        {/* Nivell Superat */}
        <div style={styles.successIcon}>
          <CheckCircle size={56} />
        </div>
        <h2 id="modalTitle" style={styles.title}>
          {t('practiceScore.title.before')} {levelNumber + 1} {t('practiceScore.title.after')}
        </h2>

        {/* Resultats */}
        <div style={styles.results}>
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>{t('practiceScore.result.pointsGained')}</span>
            <span style={styles.resultValue}>+{Math.round(pointsGained)}</span>
          </div>
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>{t('practiceScore.result.total')}</span>
            <span style={styles.resultValue}>{Math.round(totalScore)}</span>
          </div>
        </div>

        {/* Botons */}
        <div style={styles.actions}>
          <button onMouseEnter={() => audio.playHover()} style={styles.retryButton} onClick={onNextLevel}>
            {t('practiceScore.action.next')} <ArrowRight size={18} />
          </button>
          <button onMouseEnter={() => audio.playHover()} style={styles.backButton} onClick={onBack}>
            <ArrowLeft size={18} /> {t('practiceScore.action.back')}
          </button>
        </div>
      </div>
    </div>
  );
}
