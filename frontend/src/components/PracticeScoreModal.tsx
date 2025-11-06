import React from 'react';
import { PALETTE } from './palette';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useGameAudio } from '../audio/sound';

type Props = {
  levelNumber: number;
  pointsGained: number;
  totalScore: number;
  onNextLevel: () => void;
  onBack: () => void;
};

export default function PracticeScoreModal({
  levelNumber,
  pointsGained,
  totalScore,
  onNextLevel,
  onBack
}: Props) {
  const audio = useGameAudio();

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContent} role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        {/* Nivell Superat */}
        <div style={{ color: PALETTE.accentGreen, marginBottom: '-16px' }}>
          <CheckCircle size={56} />
        </div>
        <h2 id="modalTitle" style={styles.title}>
          Nivell {levelNumber + 1} Superat!
        </h2>

        {/* Resultats */}
        <div style={styles.results}>
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Punts Aconseguits</span>
            <span style={styles.resultValue}>+{Math.round(pointsGained)}</span>
          </div>
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Puntuació Total</span>
            <span style={styles.resultValue}>{Math.round(totalScore)}</span>
          </div>
        </div>

        {/* Botons */}
        <div style={styles.actions}>
          <button onMouseEnter={() => audio.playHover()} style={styles.retryButton} onClick={onNextLevel}>
            Següent Nivell <ArrowRight size={18} />
          </button>
          <button onMouseEnter={() => audio.playHover()} style={styles.backButton} onClick={onBack}>
            <ArrowLeft size={18} /> Tornar al Menú
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
    borderRadius: 16, padding: 'clamp(24px, 5vw, 40px)',
    color: PALETTE.text, width: 'min(500px, 90vw)',
    boxShadow: PALETTE.shadow, textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: '24px',
  },
  title: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: 700, margin: 0,
    color: PALETTE.accentGreen,
  },
  results: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    borderTop: `1px solid ${PALETTE.borderColor || 'rgba(255,255,255,0.1)'}`,
    borderBottom: `1px solid ${PALETTE.borderColor || 'rgba(255,255,255,0.1)'}`,
    padding: '20px 0',
  },
  resultItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  resultLabel: { fontSize: 14, color: PALETTE.subtext, textTransform: 'uppercase' },
  resultValue: { fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 600 },
  actions: { display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' },
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