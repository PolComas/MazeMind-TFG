// components/settings/LevelSelectSettings.tsx (FITXER COMPLET)

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
  return [PALETTE.playBtnFrom || '#5b21b6', PALETTE.playBtnTo || '#7e22ce']; 
};

export default function LevelSelectSettings({ settings, onChange }: Props) {
  const { t } = useLanguage();
  const [bgColor1, setBgColor1] = useState(() => extractGradientColors(settings.backgroundColor)[0]);
  const [bgColor2, setBgColor2] = useState(() => extractGradientColors(settings.backgroundColor)[1]);

  useEffect(() => {
    const [color1, color2] = extractGradientColors(settings.backgroundColor);
    setBgColor1(color1);
    setBgColor2(color2);
  }, [settings.backgroundColor]);

  const updateGradient = useCallback((color1: string, color2: string) => {
    const newGradient = `linear-gradient(145deg, ${color1} 0%, ${color2} 100%)`;
    onChange('backgroundColor', newGradient);
  }, [onChange]);

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
          <label style={styles.label}>{t('settings.levelSelect.gradient')}</label>
          <ColorPickerWithTextInput
            label={t('settings.levelSelect.color1')}
            value={bgColor1}
            onChange={handleBgColor1Change}
            inputId="levelselect-bg-color1"
          />
          <ColorPickerWithTextInput
            label={t('settings.levelSelect.color2')}
            value={bgColor2}
            onChange={handleBgColor2Change}
            inputId="levelselect-bg-color2"
          />
      </div>

      {/* --- Secció de Dificultat (NOU) --- */}
      <div style={styles.difficultyGroup}>
          <ColorPickerWithTextInput
            label={t('settings.levelSelect.easyButtons')}
            value={settings.easyColor}
            onChange={(value) => onChange('easyColor', value)}
            inputId="levelselect-easy-color"
          />
          <ColorPickerWithTextInput
            label={t('settings.levelSelect.normalButtons')}
            value={settings.normalColor}
            onChange={(value) => onChange('normalColor', value)}
            inputId="levelselect-normal-color"
          />
          <ColorPickerWithTextInput
            label={t('settings.levelSelect.hardButtons')}
            value={settings.hardColor}
            onChange={(value) => onChange('hardColor', value)}
            inputId="levelselect-hard-color"
          />
      </div>

      {/* --- Graella de Dues Columnes --- */}
      <div style={styles.grid}>
        <div style={styles.column}>
          {/* Text Principal */}
          <ColorPickerWithTextInput
            label={t('settings.levelSelect.textPrimary')}
            value={settings.textColor}
            onChange={(value) => onChange('textColor', value)}
            inputId="levelselect-text-color"
          />
          {/* Superfícies (Targetes) */}
          <ColorPickerWithTextInput
            label={t('settings.levelSelect.cards')}
            value={settings.surfaceColor.startsWith('rgba') ? '#ffffff' : settings.surfaceColor} 
            onChange={(value) => onChange('surfaceColor', value)}
            inputId="levelselect-surface-color"
          />
        </div>

        <div style={styles.column}>
          {/* Text Secundari */}
           <ColorPickerWithTextInput
            label={t('settings.levelSelect.textSecondary')}
            value={settings.subtextColor}
            onChange={(value) => onChange('subtextColor', value)}
            inputId="levelselect-subtext-color"
          /> 
           {/* Vora */}
           <ColorPickerWithTextInput
            label={t('settings.levelSelect.border')}
            value={settings.borderColor}
            onChange={(value) => onChange('borderColor', value)}
            inputId="levelselect-border-color"
          />
        </div>
      </div> 
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  label: { fontSize: '0.875rem', fontWeight: 500, color: PALETTE.subtext },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  column: { display: 'flex', flexDirection: 'column', gap: '16px' },
  gradientGroup: {
      display: 'flex', flexDirection: 'column', gap: '10px',
      background: 'rgba(10, 25, 47, 0.7)', padding: '12px',
      borderRadius: '6px',
      border: `1px solid ${PALETTE.borderColor || 'rgba(255, 255, 255, 0.1)'}`,
  },
  // NOU ESTIL
  difficultyGroup: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px',
    background: 'rgba(10, 25, 47, 0.7)', padding: '12px',
    borderRadius: '6px',
    border: `1px solid ${PALETTE.borderColor || 'rgba(255, 255, 255, 0.1)'}`,
  }
};
