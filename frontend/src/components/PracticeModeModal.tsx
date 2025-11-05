import React from 'react';
import { X, BrainCircuit, TrendingUp, Edit } from 'lucide-react';
import { PALETTE } from './palette';
import { useGameAudio } from '../audio/sound';

type Props = {
  open: boolean;
  onClose: () => void;
  onStartIA: () => void;
  onStartNormal: () => void;
  onStartFree: () => void;
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(10, 25, 47, 0.8)',
    backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center',
    zIndex: 60, padding: '16px',
  },
  modalContent: {
    background: 'rgba(30, 41, 59, 1)', color: PALETTE.text,
    borderRadius: '16px', border: `1px solid ${PALETTE.borderColor}`,
    maxWidth: '500px', width: '100%',
    boxShadow: PALETTE.shadow, position: 'relative',
  },
  header: {
    padding: '16px 24px', borderBottom: `1px solid ${PALETTE.borderColor}`,
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  title: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },
  closeButton: {
    position: 'absolute', top: '12px', right: '12px',
    background: 'transparent', border: 'none', color: PALETTE.subtext,
    cursor: 'pointer', padding: '4px', borderRadius: '50%',
  },
  body: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${PALETTE.borderColor}`,
    borderRadius: '12px', padding: '20px',
    display: 'flex', alignItems: 'center', gap: '16px',
    cursor: 'pointer', transition: 'all 0.2s ease',
  },
  cardIcon: {
    width: '48px', height: '48px', borderRadius: '50%',
    display: 'grid', placeItems: 'center', flexShrink: 0,
  },
  cardTitle: { fontWeight: 600, fontSize: '1.1rem', margin: 0 },
  cardText: { fontSize: '0.9rem', color: PALETTE.subtext, margin: '4px 0 0 0' },
};

export default function PracticeModeModal({ open, onClose, onStartIA, onStartNormal, onStartFree }: Props) {
  const audio = useGameAudio();

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
            <div style={{...styles.cardIcon, background: PALETTE.accentViolet + '30'}}>
              <BrainCircuit size={24} color={PALETTE.accentViolet} />
            </div>
            <div>
              <h3 style={styles.cardTitle}>Pràctica IA</h3>
              <p style={styles.cardText}>Juga laberints aleatoris adaptats al teu nivell.</p>
            </div>
          </div>
          
          {/* Opció 2: Pràctica Normal/Score */}
          <div style={styles.card} onClick={() => handleSelect(onStartNormal)} onMouseEnter={() => audio.playHover()}>
            <div style={{...styles.cardIcon, background: PALETTE.normalYellow + '30'}}>
              <TrendingUp size={24} color={PALETTE.normalYellow} />
            </div>
            <div>
              <h3 style={styles.cardTitle}>Pràctica Score</h3>
              <p style={styles.cardText}>Juga laberints aleatoris que pugen de dificultat.</p>
            </div>
          </div>

          {/* Opció 3: Mode Lliure */}
          <div style={styles.card} onClick={() => handleSelect(onStartFree)} onMouseEnter={() => audio.playHover()}>
            <div style={{...styles.cardIcon, background: PALETTE.easyGreen + '30'}}>
              <Edit size={24} color={PALETTE.easyGreen} />
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