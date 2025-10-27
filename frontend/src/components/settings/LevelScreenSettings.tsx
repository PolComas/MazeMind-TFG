import React, { useState, useEffect } from 'react';
import type { VisualSettings } from '../../utils/settings'; 
import { PALETTE } from '../palette';
import ColorPickerWithTextInput from './ColorPickerWithTextInput';

type Props = {
  settings: VisualSettings;
  onChange: (key: keyof VisualSettings, value: string | number) => void; 
};

// Component local per a l'input numèric
const NumberInput = ({ label, value, onChange, inputId, min, max, step }: any) => (
  <div style={styles.settingGroup}>
    <label htmlFor={inputId} style={styles.label}>{label}</label>
    <input
      id={inputId}
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      min={min} max={max} step={step}
      style={styles.numberInput}
    />
  </div>
);

export default function LevelScreenSettings({ settings, onChange }: Props) {
  // Nota: 'backgroundColor' en aquesta pantalla no és un gradient, 
  // però ho mantenim per consistència amb els temes.
  const [bgColor, setBgColor] = useState(settings.backgroundColor);

  useEffect(() => {
    // Si el fons és un gradient, agafa el primer color. Si no, agafa el color.
    const match = settings.backgroundColor.match(/#[0-9A-Fa-f]{6}/g);
    setBgColor(match ? match[0] : settings.backgroundColor);
  }, [settings.backgroundColor]);

  const handleBgColorChange = (value: string) => {
    setBgColor(value);
    // Guardem un gradient simple per mantenir la compatibilitat del tipus
    onChange('backgroundColor', `linear-gradient(145deg, ${value} 0%, ${value} 100%)`);
  };

  return (
    <div style={styles.container}>    
      
      {/* --- Secció 1: Fons i Text --- */}
      <div style={styles.grid}>
        <div style={styles.column}>
          <ColorPickerWithTextInput
            label="Color de Fons"
            value={bgColor}
            onChange={handleBgColorChange}
            inputId="levelscreen-bg-color"
          />
          <ColorPickerWithTextInput
            label="Color de Text Principal"
            value={settings.textColor}
            onChange={(value) => onChange('textColor', value)}
            inputId="levelscreen-text-color"
          />
          <ColorPickerWithTextInput
            label="Color de Text Secundari"
            value={settings.subtextColor}
            onChange={(value) => onChange('subtextColor', value)}
            inputId="levelscreen-subtext-color"
          />
        </div>
        <div style={styles.column}>
          <ColorPickerWithTextInput
            label="Color de Targetes (HUD)"
            value={settings.surfaceColor} 
            onChange={(value) => onChange('surfaceColor', value)}
            inputId="levelscreen-surface-color"
          />
          <ColorPickerWithTextInput
            label="Color de Vores"
            value={settings.borderColor}
            onChange={(value) => onChange('borderColor', value)}
            inputId="levelscreen-border-color"
          />
        </div>
      </div>

      {/* --- Secció 2: Panell "Memoritzar" --- */}
      <div style={styles.gradientGroup}>
          <label style={styles.label}>Gradient Panell "Memoritzar"</label>
          <ColorPickerWithTextInput
            label="Accent 1"
            value={settings.accentColor1}
            onChange={(value) => onChange('accentColor1', value)}
            inputId="levelscreen-accent1-color"
          />
          <ColorPickerWithTextInput
            label="Accent 2"
            value={settings.accentColor2}
            onChange={(value) => onChange('accentColor2', value)}
            inputId="levelscreen-accent2-color"
          />
      </div>

      {/* --- Secció 3: Colors del Laberint --- */}
      <div style={styles.mazeGroup}>
        <ColorPickerWithTextInput
          label="Color Camí (Fons Laberint)"
          value={settings.mazePathColor || ''}
          onChange={(value) => onChange('mazePathColor', value)}
          inputId="levelscreen-maze-path"
        />
        <ColorPickerWithTextInput
          label="Color Parets"
          value={settings.mazeWallColor || ''}
          onChange={(value) => onChange('mazeWallColor', value)}
          inputId="levelscreen-maze-wall"
        />
        <ColorPickerWithTextInput
          label="Color Jugador"
          value={settings.mazePlayerColor || ''}
          onChange={(value) => onChange('mazePlayerColor', value)}
          inputId="levelscreen-maze-player"
        />
        <ColorPickerWithTextInput
          label="Color Sortida"
          value={settings.mazeExitColor || ''}
          onChange={(value) => onChange('mazeExitColor', value)}
          inputId="levelscreen-maze-exit"
        />
        <ColorPickerWithTextInput
          label="Color Camí Recorregut"
          value={settings.playerPathColor || ''}
          onChange={(value) => onChange('playerPathColor', value)}
          inputId="levelscreen-maze-path-help"
        />
        <ColorPickerWithTextInput
          label="Color Ajuda Xoc"
          value={settings.crashHelpColor || ''}
          onChange={(value) => onChange('crashHelpColor', value)}
          inputId="levelscreen-maze-crash-help"
        />
        <NumberInput
          label="Gruix de la Paret (px)"
          value={settings.mazeWallThickness || 3}
          onChange={(value: number) => onChange('mazeWallThickness', value)}
          inputId="levelscreen-maze-thickness"
          min={1} max={10} step={0.5}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  label: { fontSize: '0.875rem', fontWeight: 500, color: PALETTE.subtext },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  column: { display: 'flex', flexDirection: 'column', gap: '16px' },
  settingGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  gradientGroup: {
      display: 'flex', flexDirection: 'column', gap: '10px',
      background: 'rgba(10, 25, 47, 0.7)', padding: '12px',
      borderRadius: '6px',
      border: `1px solid ${PALETTE.borderColor || 'rgba(255, 255, 255, 0.1)'}`,
  },
  mazeGroup: {
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px',
      background: 'rgba(10, 25, 47, 0.7)', padding: '12px',
      borderRadius: '6px',
      border: `1px solid ${PALETTE.borderColor || 'rgba(255, 255, 255, 0.1)'}`,
      alignItems: 'flex-end'
  },
  numberInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${PALETTE.borderColor || 'rgba(255, 255, 255, 0.1)'}`,
    background: 'rgba(10, 25, 47, 0.7)',
    color: PALETTE.text,
    fontSize: '0.875rem',
    width: '100%',
    boxSizing: 'border-box'
  }
};