import React from 'react';
import type { VisualSettings } from '../../utils/settings'; 
import { PALETTE } from '../palette';

type Props = {
  settings: VisualSettings;
  onChange: (key: keyof VisualSettings, value: string | number) => void; 
};

export default function HomeScreenSettings({ settings, onChange }: Props) {
  // Helper per gestionar canvis als inputs de color
  const handleColorChange = (key: keyof VisualSettings, e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(key, e.target.value);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.sectionTitle}>Pantalla d'Inici</h3>
      
      {/* Grup per als colors de Fons */}
      <div style={styles.settingGroup}>
        <label htmlFor="home-bg-color" style={styles.label}>Color de Fons (Gradient)</label>
        <input 
          id="home-bg-color"
          type="text" 
          value={settings.backgroundColor} 
          onChange={(e) => onChange('backgroundColor', e.target.value)} 
          style={styles.input}
          aria-describedby="bg-description"
        />
        <small id="bg-description" style={styles.description}>Pots posar un color sòlid (#rrggbb) o un gradient CSS.</small>
      </div>

      {/* Grup per als colors de Text */}
      <div style={styles.settingGroup}>
        <label htmlFor="home-text-color" style={styles.label}>Color de Text Principal</label>
        <div style={styles.colorInputWrapper}>
          <input 
            id="home-text-color"
            type="color" 
            value={settings.textColor} 
            onChange={(e) => handleColorChange('textColor', e)} 
            style={styles.colorInput}
          />
          <span style={styles.colorValue}>{settings.textColor}</span>
        </div>
      </div>
      
      <div style={styles.settingGroup}>
        <label htmlFor="home-subtext-color" style={styles.label}>Color de Text Secundari</label>
         <div style={styles.colorInputWrapper}>
          <input 
            id="home-subtext-color"
            type="color" 
            value={settings.subtextColor} 
            onChange={(e) => handleColorChange('subtextColor', e)} 
            style={styles.colorInput}
          />
          <span style={styles.colorValue}>{settings.subtextColor}</span>
        </div>
      </div>

      {/* Grup per als colors de Superfícies (targetes) */}
      <div style={styles.settingGroup}>
        <label htmlFor="home-surface-color" style={styles.label}>Color de Superfícies (Targetes)</label>
        <div style={styles.colorInputWrapper}>
          <input 
            id="home-surface-color"
            type="color" 
            value={settings.surfaceColor.startsWith('rgba') ? '#ffffff' : settings.surfaceColor} // L'input color no accepta rgba bé
            onChange={(e) => handleColorChange('surfaceColor', e)} 
            style={styles.colorInput}
            aria-describedby='surface-alpha-info'
          />
          <span style={styles.colorValue}>{settings.surfaceColor}</span> 
        </div>
         <small id="surface-alpha-info" style={styles.description}>Nota: L'opacitat del fons de les targetes es manté (efecte vidre).</small>
      </div>
      
      {/* Grup per als colors d'Accent (botons, etc.) */}
      <div style={styles.settingGroup}>
        <label htmlFor="home-accent1-color" style={styles.label}>Color d'Accent Principal (Botó Jugar)</label>
        <div style={styles.colorInputWrapper}>
          <input 
            id="home-accent1-color"
            type="color" 
            value={settings.accentColor1} 
            onChange={(e) => handleColorChange('accentColor1', e)} 
            style={styles.colorInput}
          />
           <span style={styles.colorValue}>{settings.accentColor1}</span>
        </div>
      </div>

       <div style={styles.settingGroup}>
        <label htmlFor="home-accent2-color" style={styles.label}>Color d'Accent Secundari (Focus, etc.)</label>
        <div style={styles.colorInputWrapper}>
          <input 
            id="home-accent2-color"
            type="color" 
            value={settings.accentColor2} 
            onChange={(e) => handleColorChange('accentColor2', e)} 
            style={styles.colorInput}
          />
           <span style={styles.colorValue}>{settings.accentColor2}</span>
        </div>
      </div>

      {/* TODO: Afegir més opcions (vora, ombra, etc.) */}

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: PALETTE.accentCyan || '#67e8f9',
    margin: '0 0 8px 0',
    borderBottom: `1px solid ${PALETTE.borderColor || 'rgba(255, 255, 255, 0.1)'}`,
    paddingBottom: '8px',
  },
  settingGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
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
  colorValue: {
    fontSize: '0.875rem',
    color: PALETTE.subtext,
    fontFamily: 'monospace',
  },
  description: {
    fontSize: '0.75rem',
    color: PALETTE.subtext + '90',
    marginTop: '-2px',
  },
};