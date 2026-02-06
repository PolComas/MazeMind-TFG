import React, { useState, useEffect, useCallback } from 'react';
import type { VisualSettings } from '../../utils/settings'; 
import { PALETTE } from '../palette';
import ColorPickerWithTextInput from './ColorPickerWithTextInput';
import { useLanguage } from '../../context/LanguageContext';

type Props = {
  settings: VisualSettings;
  onChange: (key: keyof VisualSettings, value: string | number) => void; 
};

// Funció per extreure colors d'un gradient
const extractGradientColors = (gradient: string): [string, string] => {
  const hexColors = gradient.match(/#[0-9A-Fa-f]{6}/g);
  if (hexColors && hexColors.length >= 2) {
    return [hexColors[0], hexColors[1]]; 
  }
  // Valor per defecte si no es poden extreure
  return [PALETTE.playBtnFrom || '#5b21b6', PALETTE.playBtnTo || '#7e22ce']; 
};

export default function HomeScreenSettings({ settings, onChange }: Props) {
  const { t } = useLanguage();
  // Estats locals per als colors del gradient
  const [bgColor1, setBgColor1] = useState(() => extractGradientColors(settings.backgroundColor)[0]);
  const [bgColor2, setBgColor2] = useState(() => extractGradientColors(settings.backgroundColor)[1]);

  // Actualitzar l'estat intern si la configuració externa canvia
  useEffect(() => {
    const [color1, color2] = extractGradientColors(settings.backgroundColor);
    setBgColor1(color1);
    setBgColor2(color2);
  }, [settings.backgroundColor]);

  // Funció per reconstruir i notificar el canvi del gradient
  const updateGradient = useCallback((color1: string, color2: string) => {
    const newGradient = `linear-gradient(145deg, ${color1} 0%, ${color2} 100%)`;
    onChange('backgroundColor', newGradient);
  }, [onChange]);

  // Gestors de canvi per als colors del gradient
  const handleBgColor1Change = (value: string) => {
    setBgColor1(value);
    updateGradient(value, bgColor2);
  };

  const handleBgColor2Change = (value: string) => {
    setBgColor2(value);
    updateGradient(bgColor1, value);
  };

  return (
    <div style={styles.container}>    
      {/* Fons */}
      <div style={styles.gradientGroup}>
          <label style={styles.label}>{t('settings.home.gradient')}</label>
          <ColorPickerWithTextInput
            label={t('settings.home.color1')}
            value={bgColor1}
            onChange={handleBgColor1Change}
            inputId="home-bg-color1"
          />
          <ColorPickerWithTextInput
            label={t('settings.home.color2')}
            value={bgColor2}
            onChange={handleBgColor2Change}
            inputId="home-bg-color2"
          />
      </div>
      {/* --- Graella de Dues Columnes --- */}
      <div style={styles.grid}>

        {/* --- Columna Esquerra --- */}
        <div style={styles.column}>
          {/* Text Principal */}
          <ColorPickerWithTextInput
            label={t('settings.home.textPrimary')}
            value={settings.textColor}
            onChange={(value) => onChange('textColor', value)}
            inputId="home-text-color"
          />

          {/* Accent Principal */}
           <ColorPickerWithTextInput
            label={t('settings.home.accentPrimary')}
            value={settings.accentColor1}
            onChange={(value) => onChange('accentColor1', value)}
            inputId="home-accent1-color"
          />

        </div>

        {/* --- Columna Dreta --- */}
        <div style={styles.column}>
          {/* Text Secundari */}
           <ColorPickerWithTextInput
            label={t('settings.home.textSecondary')}
            value={settings.subtextColor}
            onChange={(value) => onChange('subtextColor', value)}
            inputId="home-subtext-color"
          /> 

           {/* Accent Secundari */}
           <ColorPickerWithTextInput
            label={t('settings.home.accentSecondary')}
            value={settings.accentColor2}
            onChange={(value) => onChange('accentColor2', value)}
            inputId="home-accent2-color"
          />
        </div>

        {/* Superfícies (Targetes) */}
          <ColorPickerWithTextInput
          label={t('settings.home.cards')}
          value={settings.surfaceColor.startsWith('rgba') ? '#ffffff' : settings.surfaceColor} 
          onChange={(value) => onChange('surfaceColor', value)}
          inputId="home-surface-color"
        />
      </div> 
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: PALETTE.subtext,
  },
  input: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${PALETTE.borderColor || 'rgba(255, 255, 255, 0.1)'}`,
    background: 'rgba(10, 25, 47, 0.7)',
    color: PALETTE.text,
    fontSize: '0.875rem',
  },
  colorInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(10, 25, 47, 0.7)',
    border: `1px solid ${PALETTE.borderColor || 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: '6px',
    padding: '4px 12px 4px 8px',
  },
  colorInput: {
    width: '28px',
    height: '28px',
    padding: 0,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: 'transparent',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  gradientGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      background: 'rgba(10, 25, 47, 0.7)',
      padding: '12px',
      borderRadius: '6px',
      border: `1px solid ${PALETTE.borderColor || 'rgba(255, 255, 255, 0.1)'}`,
  },
};
