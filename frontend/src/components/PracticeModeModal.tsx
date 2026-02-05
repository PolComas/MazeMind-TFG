import React, { useEffect, useMemo, useState } from 'react';
import { X, BrainCircuit, TrendingUp, Edit } from 'lucide-react';
import { useGameAudio } from '../audio/sound';
import { loadPracticeBestScore } from '../utils/practiceProgress';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';

type Props = {
  open: boolean;
  onClose: () => void;
  onStartIA: () => void;
  onStartNormal: () => void;
  onStartFree: () => void;
};

const buildStyles = (visuals: VisualSettings): Record<string, React.CSSProperties> => {
  const overlayColor = applyAlpha(visuals.textColor, 0.7);
  const cardBackground = applyAlpha(visuals.textColor, 0.06);

  return {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center',
      zIndex: 60, padding: '16px',
    },
    modalContent: {
      background: visuals.surfaceColor, color: visuals.textColor,
      borderRadius: '16px', border: `1px solid ${visuals.borderColor}`,
      maxWidth: '500px', width: '100%',
      boxShadow: '0 10px 30px rgba(0,0,0,0.45)', position: 'relative',
    },
    header: {
      padding: '16px 24px', borderBottom: `1px solid ${visuals.borderColor}`,
      display: 'flex', alignItems: 'center', gap: '12px',
    },
    title: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },
    closeButton: {
      position: 'absolute', top: '12px', right: '12px',
      background: 'transparent', border: 'none', color: visuals.subtextColor,
      cursor: 'pointer', padding: '4px', borderRadius: '50%',
    },
    body: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
    card: {
      background: cardBackground,
      border: `1px solid ${visuals.borderColor}`,
      borderRadius: '12px', padding: '20px',
      display: 'flex', alignItems: 'center', gap: '16px',
      cursor: 'pointer', transition: 'all 0.2s ease',
    },
    cardIcon: {
      width: '48px', height: '48px', borderRadius: '50%',
      display: 'grid', placeItems: 'center', flexShrink: 0,
    },
    cardTitle: { fontWeight: 600, fontSize: '1.1rem', margin: 0 },
    cardText: { fontSize: '0.9rem', color: visuals.subtextColor, margin: '4px 0 0 0' },
    bestScoreText: { fontSize: '0.8rem', opacity: 0.9 },
  };
};

export default function PracticeModeModal({ open, onClose, onStartIA, onStartNormal, onStartFree }: Props) {
  const audio = useGameAudio();
  const { getVisualSettings, settings } = useSettings();
  const visualSettings = getVisualSettings('levelSelect');
  const styles = useMemo(() => buildStyles(visualSettings), [visualSettings]);

  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    if (open) {
      setBestScore(loadPracticeBestScore());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeKey = (settings.game.keyCloseModal || '').toLowerCase();
    if (!closeKey) return;

    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === settings.game.keyCloseModal || key === closeKey) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, settings.game.keyCloseModal, onClose]);

  if (!open) return null;

  const handleSelect = (action: () => void) => {
    audio.playBtnSound();
    action();
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose} aria-label="Tancar">
          <X size={24} />
        </button>
        <div style={styles.header}>
          <h2 style={styles.title}>Modes de Pràctica</h2>
        </div>
        <div style={styles.body}>
          {/* Opció 1: Pràctica IA */}
          <div style={styles.card} onClick={() => handleSelect(onStartIA)} onMouseEnter={() => audio.playHover()}>
            <div style={{ ...styles.cardIcon, background: applyAlpha(visualSettings.accentColor2, 0.2) }}>
              <BrainCircuit size={24} color={visualSettings.accentColor2} />
            </div>
            <div>
              <h3 style={styles.cardTitle}>Pràctica IA</h3>
              <p style={styles.cardText}>Juga laberints aleatoris adaptats al teu nivell.</p>
            </div>
          </div>

          {/* Opció 2: Pràctica Normal/Score */}
          <div style={styles.card} onClick={() => handleSelect(onStartNormal)} onMouseEnter={() => audio.playHover()}>
            <div style={{ ...styles.cardIcon, background: applyAlpha(visualSettings.normalColor, 0.2) }}>
              <TrendingUp size={24} color={visualSettings.normalColor} />
            </div>
            <div>
              <h3 style={styles.cardTitle}>Pràctica Score</h3>
              <p style={styles.cardText}>
                Juga laberints aleatoris que pugen de dificultat.
                <br />
                <span style={styles.bestScoreText}>
                  Millor puntuació: <strong>{Math.round(bestScore)}</strong>
                </span>
              </p>
            </div>
          </div>

          {/* Opció 3: Mode Lliure */}
          <div style={styles.card} onClick={() => handleSelect(onStartFree)} onMouseEnter={() => audio.playHover()}>
            <div style={{ ...styles.cardIcon, background: applyAlpha(visualSettings.easyColor, 0.2) }}>
              <Edit size={24} color={visualSettings.easyColor} />
            </div>
            <div>
              <h3 style={styles.cardTitle}>Mode Lliure / Creació</h3>
              <p style={styles.cardText}>Defineix la mida, temps i dificultat al teu gust.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
