import React from "react";
import { Eye, Footprints } from "lucide-react";
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
  const screenSettings = getVisualSettings('levelScreen');
  const { game: gameSettings } = settings;
  const formatKey = (key: string) => {
    if (key === ' ') return t('keys.space');
    if (key.length === 1) return key.toUpperCase();
    return key;
  };

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
        <span style={styles.label}>🏆 {t('practiceHud.totalScore')}</span>
        <span style={styles.valueLarge}>{Math.round(totalScore)}</span>
      </div>

      {/* CARD 2: VIDES */}
      <div style={styles.card}>
        <span style={styles.label}>❤️ {t('hud.lives')}</span>
        <span style={styles.livesText} aria-label={`${lives} ${t('hud.livesRemaining')}`}>
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
          title={`${t('hud.help.reveal')} (${formatKey(gameSettings.keyHelpReveal)}) | ${t('hud.cost')}: 50 ${t('hud.pointsShort')}`}
        >
          <Eye size={18} />
          <span>{t('hud.help.reveal')} ({revealCharges})</span>
          <kbd>{formatKey(gameSettings.keyHelpReveal)}</kbd>
        </button>

        <button
          style={{...styles.helpButton, ...(isPathHelpActive ? styles.helpActive : {})}}
          onClick={onTogglePathHelp}
          title={`${t('hud.help.path')} (${formatKey(gameSettings.keyHelpPath)}) | ${t('hud.cost')}: -2 ${t('hud.pointsShort')}/${t('hud.perSecondShort')}`}
        >
          <Footprints size={18} />
          <span>{t('hud.help.path')}</span>
          <kbd>{formatKey(gameSettings.keyHelpPath)}</kbd>
        </button>
      </div>
    </div>
  );
}
