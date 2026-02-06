import React, { useEffect, useMemo } from 'react';
import { RefreshCcw, ArrowLeft, Bot, CheckCircle, XCircle } from 'lucide-react';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  status: 'completed' | 'failed';
  time: number;

  onRetrySameMaze: () => void; // 1. Repetir el mateix laberint
  onRetryNewMaze: () => void;  // 2. Nou laberint, mateixos paràmetres
  onBackToSettings: () => void; // 3. Tornar a /practice/free
};

// Funció per formatar el temps
function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString();
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

type PracticeCompletionStyles = {
  overlay: React.CSSProperties;
  modalContent: React.CSSProperties;
  title: React.CSSProperties;
  results: React.CSSProperties;
  resultItem: React.CSSProperties;
  resultLabel: React.CSSProperties;
  resultValue: React.CSSProperties;
  actions: React.CSSProperties;
  retryButton: React.CSSProperties;
  newMazeButton: React.CSSProperties;
  backButton: React.CSSProperties;
  statusIcon: (isCompleted: boolean) => React.CSSProperties;
  statusTitle: (isCompleted: boolean) => React.CSSProperties;
};

const buildStyles = (visuals: VisualSettings): PracticeCompletionStyles => {
  const accentGradient = `linear-gradient(90deg, ${visuals.accentColor1}, ${visuals.accentColor2})`;
  const subtleSurface = applyAlpha(visuals.textColor, 0.08);
  const baseTitle: React.CSSProperties = {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: 700, margin: 0,
  };

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
    title: baseTitle,
    results: {
      display: 'grid', gridTemplateColumns: '1fr',
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
    newMazeButton: {
      padding: '14px', borderRadius: '10px', border: `1px solid ${visuals.borderColor}`,
      background: subtleSurface, color: visuals.textColor,
      fontSize: '18px', fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    },
    backButton: {
      padding: '14px', borderRadius: '10px', border: `1px solid ${visuals.borderColor}`,
      background: subtleSurface, color: visuals.textColor,
      fontSize: '18px', fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    },
    statusIcon: (isCompleted: boolean): React.CSSProperties => ({
      color: isCompleted ? visuals.easyColor : visuals.hardColor,
      marginBottom: '-16px',
    }),
    statusTitle: (isCompleted: boolean): React.CSSProperties => ({
      ...baseTitle,
      color: isCompleted ? visuals.easyColor : visuals.hardColor,
    }),
  };
};

export default function PracticeCompletionModal({
  status,
  time,
  onRetrySameMaze,
  onRetryNewMaze,
  onBackToSettings
}: Props) {
  const audio = useGameAudio();
  const { getVisualSettings, settings } = useSettings();
  const { t } = useLanguage();
  const visualSettings = getVisualSettings('levelScreen');
  const styles = useMemo(() => buildStyles(visualSettings), [visualSettings]);

  const isCompleted = status === 'completed';

  useEffect(() => {
    const closeKey = (settings.game.keyCloseModal || '').toLowerCase();
    if (!closeKey) return;

    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === settings.game.keyCloseModal || key === closeKey) {
        e.preventDefault();
        onBackToSettings();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [settings.game.keyCloseModal, onBackToSettings]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContent} role="dialog" aria-modal="true" aria-labelledby="modalTitle">

        {/* Icona i Títol Canviant */}
        <div style={styles.statusIcon(isCompleted)}>
          {isCompleted ? <CheckCircle size={56} /> : <XCircle size={56} />}
        </div>
        <h2 id="modalTitle" style={styles.statusTitle(isCompleted)}>
          {isCompleted ? t('practiceComplete.title.win') : t('practiceComplete.title.loss')}
        </h2>

        {/* Temps */}
        <div style={styles.results}>
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>{t('practiceComplete.result.time')}</span>
            <span style={styles.resultValue}>{formatTime(time)}</span>
          </div>
        </div>

        {/* Els 3 Botons Nous */}
        <div style={styles.actions}>
          {/* 1. Repetir mateix laberint */}
          <button onMouseEnter={() => audio.playHover()} style={styles.retryButton} onClick={onRetrySameMaze}>
            <RefreshCcw size={18} /> {t('practiceComplete.action.retrySame')}
          </button>

          {/* 2. Nou laberint */}
          <button onMouseEnter={() => audio.playHover()} style={styles.newMazeButton} onClick={onRetryNewMaze}>
            <Bot size={18} /> {t('practiceComplete.action.newMaze')}
          </button>

          {/* 3. Tornar */}
          <button onMouseEnter={() => audio.playHover()} style={styles.backButton} onClick={onBackToSettings}>
            <ArrowLeft size={18} /> {t('practiceComplete.action.change')}
          </button>
        </div>
      </div>
    </div>
  );
}
