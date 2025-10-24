import React from 'react';
import { PALETTE } from './palette'; 
import { Dumbbell, Zap, Flame, Lock, Play } from 'lucide-react';

type Diff = 'easy' | 'normal' | 'hard';

// Dificultat icones i colors
const difficultyStyles: Record<Diff, { icon: React.ReactNode; accent: string; badgeBg: string }> = {
  easy: { 
    icon: <Dumbbell size={18} />, 
    accent: PALETTE.easyGreen, 
    badgeBg: 'rgba(52, 211, 153, 0.15)' 
  },
  normal: { 
    icon: <Zap size={18} />, 
    accent: PALETTE.normalYellow, 
    badgeBg: 'rgba(251, 191, 36, 0.15)' 
  },
  hard: { 
    icon: <Flame size={18} />, 
    accent: PALETTE.hardRed, 
    badgeBg: 'rgba(248, 113, 113, 0.15)' 
  },
};

type Props = {
  index: number;
  unlocked: boolean;
  difficulty: Diff; 
  onPlay: () => void;
};

export default function LevelCard({ index, unlocked, difficulty, onPlay }: Props) {
  // Estil segons la dificultat
  const diffStyle = difficultyStyles[difficulty];
  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  
  // Creem etiquetes descriptives per a lectors de pantalla
  const accessiblePlayLabel = `Jugar el nivell ${index} en dificultat ${difficultyLabel}`;
  const accessibleLockedLabel = `Nivell ${index} (Bloquejat)`;

  return (
    <div
      style={{
        ...styles.cardBase,
        borderColor: unlocked ? diffStyle.accent + '60' : PALETTE.borderColor,
        ...(!unlocked ? styles.cardLocked : {}),
      }}
      aria-label={unlocked ? `Nivell ${index}` : accessibleLockedLabel}
      aria-disabled={!unlocked}
    >
      <div style={styles.cardInner}>
        {/* Insígnia amb icona i fons específics de la dificultat */}
        <div style={{ ...styles.badge, background: diffStyle.badgeBg, color: diffStyle.accent }}>
          {diffStyle.icon}
        </div>
        
        <div style={styles.levelNum}>{index}</div>

        {unlocked ? (
          <>
            {/* TODO: Mostrar les estrelles de l'usuari */}
            <div style={styles.stars} aria-label="Puntuació: 0 de 3 estrelles">☆☆☆</div> 
            
            <button 
              style={{ 
                ...styles.playBtnBase, 
                background: diffStyle.accent, 
                color: PALETTE.bg
              }} 
              onClick={onPlay}
              aria-label={accessiblePlayLabel}
            >
              <Play size={16} /> Jugar
            </button>
          </>
        ) : (
          // Icona de bloqueig
          <div style={{ ...styles.lockedIcon, color: diffStyle.accent + '90' }}>
            <Lock size={28} />
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  cardBase: {
    // Targeta base amb fons, vora, radi i ombra
    background: PALETTE.surface,
    border: PALETTE.borderColor,
    borderRadius: 16,
    padding: 8,
    width: '100%',
    aspectRatio: '1/1', 
    boxShadow: PALETTE.shadow,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    display: 'flex',
  },
  cardLocked: {
    // Estils per a la targeta bloquejada: fons fosc i opacitat reduïda
    background: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.05)',
    boxShadow: 'none',
    opacity: 0.7,
  },
  cardInner: {
    // Contenidor interior amb gradient i flexbox vertical
    flexGrow: 1,
    borderRadius: 12,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'clamp(8px, 2vw, 12px)',
  },
  badge: {
    // Insígnia decorativa amb fons translúcid i forma rodona
    background: 'rgba(255,255,255,.1)',
    borderRadius: '999px',
    padding: '4px 8px',
    fontSize: 16,
    lineHeight: 1,
  },
  levelNum: { 
    // Número del nivell amb font gran i negreta
    fontSize: 32, fontWeight: 800, color: PALETTE.text 
  },
  stars: { 
    // Estrelles decoratives amb color secundari
    color: PALETTE.subtext, fontSize: 14 
  },
  playBtnBase: {
    // Botó "Jugar" amb gradient i transició
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    borderRadius: 10,
    background: `linear-gradient(90deg, ${PALETTE.accentBlue}, #844BFF)`,
    color: PALETTE.text,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 16,
    transition: 'transform 0.1s ease',
  },
  lockedIcon: {
    // Icona de bloqueig centrada amb flex-grow
    flexGrow: 1,
    display: 'grid',
    placeItems: 'center',
    fontSize: 28,
  },
};