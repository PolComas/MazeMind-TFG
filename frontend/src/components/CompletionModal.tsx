// src/components/CompletionModal.tsx
import React, { useEffect, useMemo } from 'react';
import { RefreshCcw, ArrowLeft, ArrowRight } from 'lucide-react'; // Icones pels botons
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';

// Props que rep el modal
type Props = {
  levelNumber: number;
  stars: number;
  time: number; // Temps en segons
  points: number;
  onNextLevel?: () => void; // Funció per jugar el següent nivell
  onRetry: () => void; // Funció per tornar a jugar
  onBack: () => void; // Funció per tornar al menú
};

// Funció per formatar el temps (la mateixa que a GameHUD)
function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString();
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// Funció per mostrar les estrelles visualment
function displayStars(count: number) {
  return '★'.repeat(count) + '☆'.repeat(3 - count);
}

const buildStyles = (visuals: VisualSettings): Record<string, React.CSSProperties> => {
  const accentGradient = `linear-gradient(90deg, ${visuals.accentColor1}, ${visuals.accentColor2})`;
  const translucentSurface = applyAlpha(visuals.textColor, 0.08);

  return {
    overlay: {
      position: 'fixed', // Fixa a la pantalla
      inset: 0, // Cobreix tot (top, right, bottom, left = 0)
      background: applyAlpha(visuals.surfaceColor, 0.75), // Fons fosc semitransparent
      backdropFilter: 'blur(8px)', // Efecte vidre
      display: 'grid',
      placeItems: 'center',
      zIndex: 50, // Per sobre de la resta
    },
    modalContent: {
      background: visuals.surfaceColor,
      border: `1px solid ${visuals.borderColor}`,
      borderRadius: 16,
      padding: 'clamp(24px, 5vw, 40px)',
      color: visuals.textColor,
      width: 'min(500px, 90vw)', // Amplada màxima o 90% de la finestra
      boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    title: {
      fontSize: 'clamp(24px, 5vw, 32px)',
      fontWeight: 700,
      margin: 0,
      color: visuals.easyColor, // Un color destacat
    },
    results: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', // Columnes adaptables
      gap: '16px',
      borderTop: `1px solid ${visuals.borderColor}`,
      borderBottom: `1px solid ${visuals.borderColor}`,
      padding: '20px 0',
    },
    resultItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
    },
    resultLabel: {
      fontSize: 14,
      color: visuals.subtextColor,
      textTransform: 'uppercase',
    },
    resultValue: {
      fontSize: 'clamp(20px, 4vw, 26px)',
      fontWeight: 600,
      color: visuals.textColor,
    },
    starsValue: {
      color: visuals.normalColor,
    },
    actions: {
      display: 'flex',
      flexDirection: 'column', // Botons un sota l'altre
      gap: '12px',
      width: '100%',
    },
    nextButton: {
      padding: '14px', borderRadius: '10px', border: 'none',
      background: accentGradient,
      color: '#fff', fontSize: '18px', fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    },
    retryButton: { // Estil similar al botó "Jugar"
      padding: '14px', borderRadius: '10px', border: `1px solid ${visuals.borderColor}`,
      background: translucentSurface,
      color: visuals.textColor, fontSize: '18px', fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    },
    backButton: { // Estil similar al botó "Configuració"
      padding: '14px', borderRadius: '10px', border: `1px solid ${visuals.borderColor}`,
      background: translucentSurface, color: visuals.textColor,
      fontSize: '18px', fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    },
  };
};

export default function CompletionModal({ levelNumber, stars, time, points, onNextLevel, onRetry, onBack }: Props) {
  // Gestionar àudio
  const audio = useGameAudio();
  const { getVisualSettings, settings } = useSettings();
  const visualSettings = getVisualSettings('levelScreen');
  const styles = useMemo(() => buildStyles(visualSettings), [visualSettings]);

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
    // Fons semitransparent que cobreix tota la pantalla
    <div style={styles.overlay}>
      {/* El contingut del modal */}
      <div style={styles.modalContent} role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <h2 id="modalTitle" style={styles.title}>¡Nivell {levelNumber} Superat!</h2>

        {/* Resultats */}
        <div style={styles.results}>
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Estrelles</span>
            <span style={{ ...styles.resultValue, ...styles.starsValue }}>{displayStars(stars)}</span>
          </div>
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Temps</span>
            <span style={styles.resultValue}>{formatTime(time)}</span>
          </div>
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Punts</span>
            <span style={styles.resultValue}>{Math.round(points)}</span>
          </div>
        </div>

        {/* Botons */}
        <div style={styles.actions}>
          {onNextLevel && (
            <button onMouseEnter={() => audio.playHover()} style={styles.nextButton} onClick={onNextLevel}>
              Següent Nivell <ArrowRight size={18} />
            </button>
          )}
          <button onMouseEnter={() => audio.playHover()} style={styles.retryButton} onClick={onRetry}>
            <RefreshCcw size={18} /> Tornar a Jugar
          </button>
          <button onMouseEnter={() => audio.playHover()} style={styles.backButton} onClick={onBack}>
            <ArrowLeft size={18} /> Tornar als Nivells
          </button>
        </div>
      </div>
    </div>
  );
}
