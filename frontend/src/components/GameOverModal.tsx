import React from 'react';
import { PALETTE } from './palette';
import { RefreshCcw, ArrowLeft, XCircle } from 'lucide-react'; 
import { useGameAudio } from '../audio/sound';

type Props = {
  onRetry: () => void;
  onBack: () => void;
};

export default function GameOverModal({ onRetry, onBack }: Props) {
  const audio = useGameAudio();

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContent} role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        
        {/* Icona de "Game Over" */}
        <div style={styles.iconWrapper}>
          <XCircle size={64} color={PALETTE.accentRed || '#FF4D4D'} />
        </div>

        <h2 id="modalTitle" style={styles.title}>Has Perdut!</h2>

        <p style={styles.subtitle}>T'has quedat sense vides.</p>
        
        {/* Botons */}
        <div style={styles.actions}>
          <button onMouseEnter={() => audio.playHover()} style={styles.retryButton} onClick={onRetry}>
            <RefreshCcw size={18} /> Tornar a Intentar
          </button>
          <button onMouseEnter={() => audio.playHover()} style={styles.backButton} onClick={onBack}>
            <ArrowLeft size={18} /> Tornar als Nivells
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(10, 25, 47, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'grid', placeItems: 'center', zIndex: 50,
  },
  modalContent: {
    background: PALETTE.surface,
    border: `1px solid ${PALETTE.borderColor || 'rgba(255,255,255,0.1)'}`,
    borderRadius: 16,
    padding: 'clamp(24px, 5vw, 40px)',
    color: PALETTE.text,
    width: 'min(400px, 90vw)',
    boxShadow: PALETTE.shadow,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  iconWrapper: {
    lineHeight: 1,
    marginTop: '8px',
  },
  title: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: 700,
    margin: 0,
    color: PALETTE.accentRed || '#FF4D4D',
  },
  subtitle: {
    fontSize: 16,
    color: PALETTE.subtext,
    margin: '-8px 0 8px 0',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    marginTop: '8px',
  },
  retryButton: {
    padding: "14px", borderRadius: '10px', border: "none",
    background: `linear-gradient(90deg, ${PALETTE.playBtnFrom || '#FFCA86'}, ${PALETTE.playBtnTo || '#FFA94D'})`,
    color: "#fff", fontSize: '18px', fontWeight: 700, cursor: "pointer",
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  },
  backButton: {
    padding: "14px", borderRadius: '10px', border: `1px solid ${PALETTE.borderColor || 'rgba(255,255,255,0.1)'}`,
    background: "rgba(255,255,255,0.06)", color: PALETTE.text,
    fontSize: '18px', fontWeight: 600, cursor: "pointer",
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  },
};
