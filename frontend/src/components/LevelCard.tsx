import React from 'react';
import { PALETTE } from './palette'; 
import { Dumbbell, Zap, Flame, Lock, Play, Star, Clock } from 'lucide-react';

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
  stars: number;
  bestTime: number | null;
  onPlay: () => void;
};

// Helper per formatar temps
function formatTime(seconds: number | null): string | null {
  if (seconds === null) return null;
  const mins = Math.floor(seconds / 60).toString();
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function LevelCard({ index, unlocked, difficulty, stars, bestTime, onPlay }: Props) {
  // Estil segons la dificultat
  const diffStyle = difficultyStyles[difficulty];
  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  
  // Creem etiquetes descriptives per a lectors de pantalla
  const accessiblePlayLabel = `Jugar el nivell ${index} en dificultat ${difficultyLabel}`;
  const accessibleLockedLabel = `Nivell ${index} (Bloquejat)`;

  // Mostrar les estrelles
  const renderStars = () => {
    const starArray = [];
    for (let i = 0; i < 3; i++) {
      starArray.push(
        <Star 
          key={i} 
          size={14} 
          fill={i < stars ? PALETTE.normalYellow : 'none'} 
          color={i < stars ? PALETTE.normalYellow : PALETTE.subtext + '80'} 
        />
      );
    }
    return starArray;
  };

  const formattedBestTime = formatTime(bestTime);

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
            {/* Mostrar les estrelles reals */}
            <div style={styles.starsContainer} aria-label={`Puntuació: ${stars} de 3 estrelles`}>
              {renderStars()}
            </div> 
            
            {/* Mostrar el millor temps */}
            {formattedBestTime && (
              <div style={styles.bestTime} aria-label={`Millor temps: ${formattedBestTime}`}>
                <Clock size={12} /> {formattedBestTime}
              </div>
            )}
            
            <button 
              style={{ ...styles.playBtnBase, background: diffStyle.accent, color: PALETTE.bg }} 
              onClick={onPlay}
              aria-label={accessiblePlayLabel}
            >
              <Play size={16} /> Jugar
            </button>
          </>
        ) : (
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
  starsContainer: { // Contenidor per a les estrelles
    display: 'flex',
    gap: '2px', 
    margin: '4px 0', 
  },
  bestTime: { // Estil pel millor temps
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: 12,
    color: PALETTE.subtext,
    margin: '0 0 8px 0', 
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