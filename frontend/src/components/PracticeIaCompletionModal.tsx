import React, { useMemo } from 'react';
import { ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';

type Props = {
  onNextLevel?: () => void;
  onBack: () => void;
};

const buildStyles = (visuals: VisualSettings): Record<string, React.CSSProperties> => {
  const accentGradient = `linear-gradient(90deg, ${visuals.accentColor1}, ${visuals.accentColor2})`;
  const subtleSurface = applyAlpha(visuals.textColor, 0.08);

  return {
    overlay: {
      position: 'fixed', inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'grid', placeItems: 'center', zIndex: 60,
      padding: '16px',
    },
    modalContent: {
      background: visuals.surfaceColor,
      border: `1px solid ${visuals.borderColor}`,
      borderRadius: 16,
      padding: 'clamp(24px, 5vw, 40px)',
      color: visuals.textColor,
      width: 'min(520px, 92vw)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
    },
    iconWrap: {
      color: visuals.easyColor,
      marginBottom: '-6px',
    },
    title: {
      fontSize: 'clamp(24px, 5vw, 32px)',
      fontWeight: 700,
      margin: 0,
      color: visuals.easyColor,
    },
    subtitle: {
      fontSize: '0.95rem',
      color: visuals.subtextColor,
      margin: 0,
      lineHeight: 1.5,
    },
    actions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
      marginTop: '6px',
    },
    nextButton: {
      padding: '14px', borderRadius: '10px', border: 'none',
      background: accentGradient,
      color: '#0A192F', fontSize: '18px', fontWeight: 700, cursor: 'pointer',
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

export default function PracticeIaCompletionModal({ onNextLevel, onBack }: Props) {
  const audio = useGameAudio();
  const { getVisualSettings } = useSettings();
  const visualSettings = getVisualSettings('levelScreen');
  const styles = useMemo(() => buildStyles(visualSettings), [visualSettings]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContent} role="dialog" aria-modal="true">
        <div style={styles.iconWrap}>
          <CheckCircle size={56} />
        </div>
        <h2 style={styles.title}>Nivell adaptat superat</h2>
        <p style={styles.subtitle}>
          Vols continuar amb un altre nivell ajustat al teu rendiment?
        </p>
        <div style={styles.actions}>
          {onNextLevel && (
            <button onMouseEnter={() => audio.playHover()} style={styles.nextButton} onClick={onNextLevel}>
              <Sparkles size={18} /> Seguir Jugant
            </button>
          )}
          <button onMouseEnter={() => audio.playHover()} style={styles.backButton} onClick={onBack}>
            <ArrowLeft size={18} /> Tornar al menú
          </button>
        </div>
      </div>
    </div>
  );
}
