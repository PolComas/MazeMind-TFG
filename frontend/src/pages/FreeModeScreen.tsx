import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

export type CustomLevelConfig = {
  width: number;
  height: number;
  time: number;
  difficulty: 'normal' | 'hard';
};

type Props = {
  onBack: () => void;
  onStartGame: (config: CustomLevelConfig) => void;
};

const clamp = (val: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, val));
};

export default function FreeModeScreen({ onBack, onStartGame }: Props) {
  const { getVisualSettings } = useSettings();
  const screenSettings = getVisualSettings('levelSelect');

  const [width, setWidth] = useState(7);
  const [height, setHeight] = useState(7);
  const [time, setTime] = useState(10);
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');

  const handleStart = () => {
    // Validem i netegem els valors
    const config: CustomLevelConfig = {
      width: clamp(Math.round(width), 5, 25),
      height: clamp(Math.round(height), 5, 25),
      time: clamp(Math.round(time), 3, 60),
      difficulty: difficulty,
    };
    
    // Passem la configuració neta al pare (App.tsx)
    onStartGame(config);
  };

  const styles: Record<string, React.CSSProperties> = {
    page: {
      background: screenSettings.backgroundColor, color: screenSettings.textColor,
      minHeight: '100svh', width: '100vw',
      padding: 'clamp(16px, 4vw, 32px)', boxSizing: 'border-box',
    },
    container: { maxWidth: 600, margin: '0 auto' },
    header: {
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 24,
    },
    title: { margin: 0, fontSize: 'clamp(24px, 5vw, 32px)' },
    backBtn: {
      padding: '10px 14px', borderRadius: 12,
      border: `1px solid ${screenSettings.borderColor}`,
      background: screenSettings.surfaceColor,
      color: screenSettings.textColor, cursor: 'pointer', fontSize: 16,
    },
    form: {
        display: 'flex', flexDirection: 'column', gap: '16px',
        background: screenSettings.surfaceColor,
        padding: '24px', borderRadius: '16px',
        border: `1px solid ${screenSettings.borderColor}`,
    },
    label: { fontSize: 14, color: screenSettings.subtextColor, marginBottom: 4 },
    input: {
        background: 'rgba(0,0,0,0.2)', border: `1px solid ${screenSettings.borderColor}`,
        color: screenSettings.textColor, padding: '12px', borderRadius: '8px',
        fontSize: 16, width: '100%', boxSizing: 'border-box',
    },
    // NOU: Estil pel selector
    select: {
        background: 'rgba(0,0,0,0.2)', border: `1px solid ${screenSettings.borderColor}`,
        color: screenSettings.textColor, padding: '12px', borderRadius: '8px',
        fontSize: 16, width: '100%', boxSizing: 'border-box',
    },
    playBtn: {
        padding: '16px', borderRadius: 12, border: 'none',
        background: `linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
        color: screenSettings.textColor, fontSize: 18,
        fontWeight: 800, cursor: 'pointer', marginTop: '16px',
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <button style={styles.backBtn} onClick={onBack} aria-label="Tornar a selecció de nivell">
            <span aria-hidden="true">←</span> Tornar
          </button>
          <h1 style={styles.title}>Mode Lliure</h1>
          <div style={{ width: 100 }} /> 
        </header>

        {/* Formulari mida i temps */}
        <div style={styles.form}>
          <div>
            <label style={styles.label} htmlFor="width">Amplada (Min: 5, Max: 25)</label>
            <input 
              style={styles.input} type="number" id="width" 
              value={width} onChange={(e) => setWidth(Number(e.target.value))}
            />
          </div>
          <div>
            <label style={styles.label} htmlFor="height">Alçada (Min: 5, Max: 25)</label>
            <input 
              style={styles.input} type="number" id="height" 
              value={height} onChange={(e) => setHeight(Number(e.target.value))}
            />
          </div>
          <div>
            <label style={styles.label} htmlFor="time">Temps de Memorització (Min: 3, Max: 60)</label>
            <input 
              style={styles.input} type="number" id="time" 
              value={time} onChange={(e) => setTime(Number(e.target.value))}
            />
          </div>
          {/* Selector de dificultat (vides) */}
          <div>
            <label style={styles.label} htmlFor="difficulty">Dificultat</label>
            <select 
              id="difficulty" style={styles.select}
              value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'normal' | 'hard')}
            >
              <option value="normal">Normal (Sense vides)</option>
              <option value="hard">Difícil (Amb vides)</option>
            </select>
          </div>
          
          <button style={styles.playBtn} onClick={handleStart}>
            Jugar
          </button>
        </div>
      </div>
    </main>
  );
}