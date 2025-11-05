import React from 'react';
import { PALETTE } from './palette';
import { RefreshCcw, ArrowLeft, Bot, CheckCircle, XCircle } from 'lucide-react';
import { useGameAudio } from '../audio/sound';

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

export default function PracticeCompletionModal({
  status,
  time,
  onRetrySameMaze,
  onRetryNewMaze,
  onBackToSettings
}: Props) {
  const audio = useGameAudio();

  const isCompleted = status === 'completed';

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContent} role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        
        {/* Icona i Títol Canviant */}
        <div style={{ color: isCompleted ? PALETTE.accentGreen : PALETTE.accentRed, marginBottom: '-16px' }}>
          {isCompleted ? <CheckCircle size={56} /> : <XCircle size={56} />}
        </div>
        <h2 id="modalTitle" style={{ ...styles.title, color: isCompleted ? PALETTE.accentGreen : PALETTE.accentRed }}>
          {isCompleted ? "Laberint Superat" : "Derrota"}
        </h2>

        {/* Temps */}
        <div style={styles.results}>
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Temps Final</span>
            <span style={styles.resultValue}>{formatTime(time)}</span>
          </div>
        </div>

        {/* Els 3 Botons Nous */}
        <div style={styles.actions}>
          {/* 1. Repetir mateix laberint */}
          <button onMouseEnter={() => audio.playHover()} style={styles.retryButton} onClick={onRetrySameMaze}>
            <RefreshCcw size={18} /> Repetir Laberint
          </button>
          
          {/* 2. Nou laberint */}
          <button onMouseEnter={() => audio.playHover()} style={styles.newMazeButton} onClick={onRetryNewMaze}>
            <Bot size={18} /> Nou Laberint (Mateixos Paràmetres)
          </button>
          
          {/* 3. Tornar */}
          <button onMouseEnter={() => audio.playHover()} style={styles.backButton} onClick={onBackToSettings}>
            <ArrowLeft size={18} /> Canviar Paràmetres
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
  },
  results: {
    display: 'grid', gridTemplateColumns: '1fr',
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
  newMazeButton: {
    padding: "14px", borderRadius: '10px', border: `1px solid ${PALETTE.borderColor}`,
    background: "rgba(255,255,255,0.15)", color: PALETTE.text,
    fontSize: '18px', fontWeight: 600, cursor: "pointer",
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  },
  backButton: {
    padding: "14px", borderRadius: '10px', border: `1px solid ${PALETTE.borderColor || 'rgba(255,255,255,0.1)'}`,
    background: "rgba(255,255,255,0.06)", color: PALETTE.text,
    fontSize: '18px', fontWeight: 600, cursor: "pointer",
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  },
};