import React from 'react';
import type { VisualSettings } from '../../utils/settings';

type Props = {
  settings: VisualSettings;
};

export default function LevelScreenLegend({ settings }: Props) {
  const styles: Record<string, React.CSSProperties> = {
    container: { 
      width: '100%', 
      color: settings.textColor,
    },
    title: { 
      fontSize: '1rem', 
      fontWeight: 600, 
      margin: '0 0 12px 0', 
      color: settings.textColor,
    },
    list: { 
      listStyle: 'none', 
      padding: 0, 
      margin: 0, 
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px 16px',
      alignItems: 'start',
    },
    item: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      fontSize: '0.875rem', 
      color: settings.subtextColor,
    },
    swatch: {
      width: '24px',
      height: '24px',
      borderRadius: '4px',
      border: `1px solid ${settings.borderColor}`,
      flexShrink: 0,
      boxSizing: 'border-box',
    },
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Llegenda</h4>
      <ul style={styles.list}>
        
        {/* 1. Parets del laberint */}
        <li style={styles.item}>
          <div style={{
            ...styles.swatch,
            background: settings.mazePathColor,
            border: `${Math.max(2, (settings.mazeWallThickness || 3) / 1.5)}px solid ${settings.mazeWallColor}`,
          }} />
          <span>Parets del laberint</span>
        </li>
        
        {/* 2. Tu (jugador) */}
        <li style={styles.item}>
          <div style={{
            ...styles.swatch,
            backgroundColor: settings.mazePlayerColor,
            borderRadius: '50%', // Rodó
          }} />
          <span>Tu (jugador)</span>
        </li>

        {/* 3. Sortida del laberint */}
        <li style={styles.item}>
          <div style={{
            ...styles.swatch,
            backgroundColor: settings.mazeExitColor,
          }} />
          <span>Sortida del laberint</span>
        </li>
        
        {/* 4. Fons/camí del laberint */}
        <li style={styles.item}>
          <div style={{
            ...styles.swatch,
            backgroundColor: settings.mazePathColor,
          }} />
          <span>Fons/camí del laberint</span>
        </li>
      </ul>
    </div>
  );
}