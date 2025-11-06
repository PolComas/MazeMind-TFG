import React from "react";
import { Eye, Footprints } from "lucide-react";
import { useSettings } from '../context/SettingsContext';

// Helper per formatar la tecla
const formatKey = (key: string) => {
  if (key === ' ') return 'Espai';
  if (key.length === 1) return key.toUpperCase();
  return key;
};

// Props que el component rebrà
type Props = {
  totalScore: number;
  revealCharges: number;
  isPathHelpActive: boolean;
  isCrashHelpActive: boolean;
  onRevealHelp: () => void;
  onTogglePathHelp: () => void;
  onToggleCrashHelp: () => void;
  lives: number;
};

export default function PracticeHUD({
  totalScore,
  revealCharges,
  isPathHelpActive,
  onRevealHelp,
  onTogglePathHelp,
  lives,
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
    livesText: {
      fontSize: 'clamp(20px, 4vw, 28px)',
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: '0.1em',
    },
  };
  return (
    <div style={styles.container}>
      {/* CARD 1: PUNTUACIÓ TOTAL */}
      <div style={styles.card}>
        <span style={styles.label}>🏆 Puntuació Total</span>
        <span style={styles.valueLarge}>{Math.round(totalScore)}</span>
      </div>

      {/* CARD 2: VIDES */}
      <div style={styles.card}>
        <span style={styles.label}>❤️ Vides</span>
        <span style={styles.livesText} aria-label={`${lives} vides restants`}>
        {'❤️'.repeat(lives)}
        {'🖤'.repeat(Math.max(0, 3 - lives))}
        </span>
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
      </div>
    </div>
  );
}
