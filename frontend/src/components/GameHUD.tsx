import React from "react";
import { Eye, Footprints, Skull } from "lucide-react";
import { useSettings } from '../context/SettingsContext';

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString();
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function getStars(points: number) {
  if (points >= 800) return '★★★';
  if (points >= 400) return '★★☆';
  if (points > 0) return '★☆☆';
  return '☆☆☆';
}

// Helper per formatar la tecla
const formatKey = (key: string) => {
  if (key === ' ') return 'Espai';
  if (key.length === 1) return key.toUpperCase();
  return key;
};

// Props que el component rebrà
type Props = {
  gameTime: number;
  points: number;
  revealCharges: number;
  isPathHelpActive: boolean;
  isCrashHelpActive: boolean;
  onRevealHelp: () => void;
  onTogglePathHelp: () => void;
  onToggleCrashHelp: () => void;
};

export default function GameHUD({
  gameTime,
  points,
  revealCharges,
  isPathHelpActive,
  isCrashHelpActive,
  onRevealHelp,
  onTogglePathHelp,
  onToggleCrashHelp
}: Props) {
  // Obtenir configuració visual
  const { getVisualSettings, settings } = useSettings();
  const screenSettings = getVisualSettings('levelScreen');
  const { game: gameSettings } = settings;

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      width: '100%',
      alignItems: 'stretch',
    },
    card: {
      background: screenSettings.surfaceColor,
      border: `1px solid ${screenSettings.borderColor}`,
      borderRadius: 14,
      padding: '12px 16px',
      color: screenSettings.textColor,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      flexGrow: 1,
      flexBasis: '180px', 
    },
    helpsCard: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '8px',
      flexBasis: '300px', 
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      fontSize: 14,
      color: screenSettings.subtextColor,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontWeight: 500,
    },
    valueLarge: {
      fontSize: 'clamp(24px, 4vw, 32px)',
      fontWeight: 700,
      lineHeight: 1,
    },
    valueSmall: {
      fontSize: 'clamp(18px, 3vw, 22px)',
      fontWeight: 700,
      lineHeight: 1,
    },
    pointsStars: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: '8px',
    },
    stars: {
      fontSize: 18,
      color: screenSettings.normalColor,
      lineHeight: 1.2,
    },
    helpButton: {
      background: 'rgba(255,255,255,0.08)',
      border: `1px solid ${screenSettings.borderColor}`,
      color: screenSettings.subtextColor,
      padding: '8px 10px',
      borderRadius: 8,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: 13,
      fontWeight: 600,
      flexGrow: 1,
    },
    helpActive: {
      background: screenSettings.easyColor,
      color: '#000',
      borderColor: 'transparent',
    },
  };
  return (
    <div style={styles.container}>
      {/* CARD 1: TEMPS */}
      <div style={styles.card}>
        <span style={styles.label}>⏱ Temps</span>
        <span style={styles.valueLarge}>{formatTime(gameTime)}</span>
      </div>

      {/* CARD 2: OBJECTIU */}
      <div style={styles.card}>
        <span style={styles.label}>⭐️ Objectiu</span>
        <div style={styles.pointsStars}>
          <span style={styles.valueSmall}>{points} pts</span>
          <span style={styles.stars}>{getStars(points)}</span>
        </div>
      </div>

      {/* CARD 3: AJUDES */}
      <div style={{ ...styles.card, ...styles.helpsCard }}>
        <button
          style={styles.helpButton}
          onClick={onRevealHelp}
          disabled={revealCharges === 0}
          title={`Mostra el laberint (${formatKey(gameSettings.keyHelpReveal)}) | Cost: 50 pts`}
        >
          <Eye size={18} />
          <span>Revelar ({revealCharges})</span>
          <kbd>{formatKey(gameSettings.keyHelpReveal)}</kbd>
        </button>

        <button
          style={{...styles.helpButton, ...(isPathHelpActive ? styles.helpActive : {})}}
          onClick={onTogglePathHelp}
          title={`Mostra el camí recorregut (${formatKey(gameSettings.keyHelpPath)}) | Cost: -2 pts/s`}
        >
          <Footprints size={18} />
          <span>Camí</span>
          <kbd>{formatKey(gameSettings.keyHelpPath)}</kbd>
        </button>

        <button
          style={{...styles.helpButton, ...(isCrashHelpActive ? styles.helpActive : {})}}
          onClick={onToggleCrashHelp}
          title={`Mostra parets properes al xocar (${formatKey(gameSettings.keyHelpCrash)}) | Cost: -20 pts`}
        >
          <Skull size={18} />
          <span>Ajuda Xoc</span>
          <kbd>{formatKey(gameSettings.keyHelpCrash)}</kbd>
        </button>
      </div>
    </div>
  );
}
