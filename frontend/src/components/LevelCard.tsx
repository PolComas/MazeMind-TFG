import React from 'react';
import { PALETTE } from './palette'; 
import { Dumbbell, Zap, Flame, Lock, Play, Star, Clock } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useGameAudio } from '../audio/sound';

type Diff = 'easy' | 'normal' | 'hard';

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
  // Gestionar àudio
  const audio = useGameAudio();
  
  // Estil segons la dificultat
  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  
  // Obtenir configuració visual
  const { getVisualSettings } = useSettings();
  const screenSettings = getVisualSettings('levelSelect');

  const difficultyStyles: Record<Diff, { icon: React.ReactNode; accent: string; badgeBg: string }> = {
    easy: { 
      icon: <Dumbbell size={18} />, 
      accent: screenSettings.easyColor, 
      badgeBg: `${screenSettings.easyColor}26`
    },
    normal: { 
      icon: <Zap size={18} />, 
      accent: screenSettings.normalColor,
      badgeBg: `${screenSettings.normalColor}26`
    },
    hard: { 
      icon: <Flame size={18} />, 
      accent: screenSettings.hardColor,
      badgeBg: `${screenSettings.hardColor}26`
    },
  };

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

  const styles: Record<string, React.CSSProperties> = {
    cardBase: { // Targeta base amb fons, vora, radi i ombra
      background: screenSettings.surfaceColor,
      border: `1px solid ${screenSettings.borderColor}`,
      borderRadius: 16,
      padding: 8,
      width: '100%',
      aspectRatio: '1/1', 
      boxShadow: PALETTE.shadow,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
      display: 'flex',
    },
    cardLocked: { // Estils per a la targeta bloquejada: fons fosc i opacitat reduïda
      borderColor: screenSettings.borderColor,
      boxShadow: 'none',
      opacity: 0.6,
    },
    cardInner: { // Contenidor interior amb gradient i flexbox vertical
      flexGrow: 1,
      borderRadius: 12,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'clamp(8px, 2vw, 12px)',
    },
    badge: { // Insígnia decorativa amb fons translúcid i forma rodona
      background: 'rgba(255,255,255,.1)',
      borderRadius: '999px',
      padding: '4px 8px',
      fontSize: 16,
      lineHeight: 1,
    },
    levelNum: { // Número del nivell amb font gran i negreta
      fontSize: 32, fontWeight: 800, color: screenSettings.textColor 
    },
    stars: { // Estrelles decoratives amb color secundari
      color: screenSettings.subtextColor, fontSize: 14 
    },
    starsContainer: { // Contenidor per a les estrelles
      display: 'flex',
      gap: '2px', 
      margin: '4px 0', 
    },
    bestTime: {  // Estil pel millor temps
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: 12,
      color: screenSettings.subtextColor,
      margin: '0 0 8px 0', 
    },
    playBtnBase: { // Botó "Jugar" amb gradient i transició
      width: '100%',
      padding: '10px 12px',
      border: 'none',
      borderRadius: 10,
      color: screenSettings.textColor,
      fontWeight: 700,
      cursor: 'pointer',
      fontSize: 16,
      transition: 'transform 0.1s ease',
    },
    lockedIcon: { // Icona de bloqueig centrada amb flex-grow
      flexGrow: 1,
      display: 'grid',
      placeItems: 'center',
      fontSize: 28,
    },
  };

  return (
    <div
      style={{
        ...styles.cardBase,
        borderColor: unlocked ? difficultyStyles[difficulty].accent + '60' : screenSettings.borderColor,
        ...(!unlocked ? styles.cardLocked : {}),
      }}
      aria-label={unlocked ? `Nivell ${index}` : accessibleLockedLabel}
      aria-disabled={!unlocked}
    >
      <div style={styles.cardInner}>
        {/* Insígnia amb icona i fons específics de la dificultat */}
        <div style={{ ...styles.badge, background: difficultyStyles[difficulty].badgeBg, color: difficultyStyles[difficulty].accent }}>
          {difficultyStyles[difficulty].icon}
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
              style={{ ...styles.playBtnBase, background: difficultyStyles[difficulty].accent, color: PALETTE.bg }} 
              onClick={onPlay}
              onMouseEnter={() => audio.playHover()}
              aria-label={accessiblePlayLabel}
            >
              <Play size={16} /> Jugar
            </button>
          </>
        ) : (
          <div style={{ ...styles.lockedIcon, color: difficultyStyles[difficulty].accent + '90' }}>
            <Lock size={28} />
          </div>
        )}
      </div>
    </div>
  );
}
