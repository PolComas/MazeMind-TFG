// src/components/CompletionModal.tsx
import React from 'react';
import { PALETTE } from './palette';
import { RefreshCcw, ArrowLeft } from 'lucide-react'; // Icones pels botons

// Props que rep el modal
type Props = {
  levelNumber: number;
  stars: number;
  time: number; // Temps en segons
  points: number;
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

export default function CompletionModal({ levelNumber, stars, time, points, onRetry, onBack }: Props) {
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
            <span style={{ ...styles.resultValue, color: PALETTE.focus || '#F0E442' }}>{displayStars(stars)}</span>
          </div>
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Temps</span>
            <span style={styles.resultValue}>{formatTime(time)}</span>
          </div>
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Punts</span>
            <span style={styles.resultValue}>{points}</span>
          </div>
        </div>

        {/* Botons */}
        <div style={styles.actions}>
          <button style={styles.retryButton} onClick={onRetry}>
            <RefreshCcw size={18} /> Tornar a Jugar
          </button>
          <button style={styles.backButton} onClick={onBack}>
            <ArrowLeft size={18} /> Tornar als Nivells
          </button>
        </div>
      </div>
    </div>
  );
}

// Estils pel modal
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', // Fixa a la pantalla
    inset: 0, // Cobreix tot (top, right, bottom, left = 0)
    background: 'rgba(10, 25, 47, 0.8)', // Fons fosc semitransparent
    backdropFilter: 'blur(8px)', // Efecte vidre
    display: 'grid',
    placeItems: 'center',
    zIndex: 50, // Per sobre de la resta
  },
  modalContent: {
    background: PALETTE.surface,
    border: `1px solid ${PALETTE.borderColor || 'rgba(255,255,255,0.1)'}`,
    borderRadius: 16,
    padding: 'clamp(24px, 5vw, 40px)',
    color: PALETTE.text,
    width: 'min(500px, 90vw)', // Amplada màxima o 90% de la finestra
    boxShadow: PALETTE.shadow,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  title: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: 700,
    margin: 0,
    color: PALETTE.accentGreen || '#64FFDA', // Un color destacat
  },
  results: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', // Columnes adaptables
    gap: '16px',
    borderTop: `1px solid ${PALETTE.borderColor || 'rgba(255,255,255,0.1)'}`,
    borderBottom: `1px solid ${PALETTE.borderColor || 'rgba(255,255,255,0.1)'}`,
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
    color: PALETTE.subtext,
    textTransform: 'uppercase',
  },
  resultValue: {
    fontSize: 'clamp(20px, 4vw, 26px)',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column', // Botons un sota l'altre
    gap: '12px',
    width: '100%',
  },
  retryButton: { // Estil similar al botó "Jugar"
    padding: "14px", borderRadius: '10px', border: "none",
    background: `linear-gradient(90deg, ${PALETTE.playBtnFrom || '#FFCA86'}, ${PALETTE.playBtnTo || '#FFA94D'})`,
    color: "#fff", fontSize: '18px', fontWeight: 700, cursor: "pointer",
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  },
  backButton: { // Estil similar al botó "Configuració"
    padding: "14px", borderRadius: '10px', border: `1px solid ${PALETTE.borderColor || 'rgba(255,255,255,0.1)'}`,
    background: "rgba(255,255,255,0.06)", color: PALETTE.text,
    fontSize: '18px', fontWeight: 600, cursor: "pointer",
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  },
};