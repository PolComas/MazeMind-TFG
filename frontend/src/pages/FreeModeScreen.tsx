import React, { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';

export type CustomLevelConfig = {
  width: number;
  height: number;
  time: number;
  difficulty: 'normal' | 'hard';
  seed?: string;
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

  // Mantenir les entrades com a cadenes per permetre l'edició lliure (esborrar, valors parcials)
  const [width, setWidth] = useState('7');
  const [height, setHeight] = useState('7');
  const [time, setTime] = useState('10');
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');
  const [seed, setSeed] = useState('');

  const handleStart = () => {
    const parsedWidth = parseInt(width, 10);
    const parsedHeight = parseInt(height, 10);
    const parsedTime = parseInt(time, 10);

    const widthValid = !Number.isNaN(parsedWidth) && parsedWidth >= 5 && parsedWidth <= 25;
    const heightValid = !Number.isNaN(parsedHeight) && parsedHeight >= 5 && parsedHeight <= 25;
    const timeValid = !Number.isNaN(parsedTime) && parsedTime >= 3 && parsedTime <= 60;

    if (!widthValid || !heightValid || !timeValid) return;

    // Valors vàlids i ajustats
    const config: CustomLevelConfig = {
      width: clamp(parsedWidth, 5, 25),
      height: clamp(parsedHeight, 5, 25),
      time: clamp(parsedTime, 3, 60),
      difficulty: difficulty,
      seed: seed.trim() || undefined,
    };

    // Passem la configuració neta al pare (App.tsx)
    onStartGame(config);
  };

  const styles = useMemo<Record<string, React.CSSProperties>>(() => ({
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
  }), [screenSettings]);

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
            {(() => {
              const parsed = parseInt(width, 10);
              const valid = !Number.isNaN(parsed) && parsed >= 5 && parsed <= 25;
              const showError = width.trim() !== '' && !valid;
              const inputStyle = { ...styles.input, border: `1px solid ${showError ? '#ef4444' : screenSettings.borderColor}` };
              return (
                <>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-invalid={showError}
                    aria-describedby={showError ? 'width-error' : undefined}
                    style={inputStyle} type="text" id="width"
                    value={width} onChange={(e) => setWidth(e.target.value)}
                  />
                  {showError && (
                    <div id="width-error" style={{ marginTop: 6, color: '#ef4444', fontSize: 13 }}>
                      Amplada invàlida — ha de ser entre 5 i 25.
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <div>
            <label style={styles.label} htmlFor="height">Alçada (Min: 5, Max: 25)</label>
            {(() => {
              const parsed = parseInt(height, 10);
              const valid = !Number.isNaN(parsed) && parsed >= 5 && parsed <= 25;
              const showError = height.trim() !== '' && !valid;
              const inputStyle = { ...styles.input, border: `1px solid ${showError ? '#ef4444' : screenSettings.borderColor}` };
              return (
                <>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-invalid={showError}
                    aria-describedby={showError ? 'height-error' : undefined}
                    style={inputStyle} type="text" id="height"
                    value={height} onChange={(e) => setHeight(e.target.value)}
                  />
                  {showError && (
                    <div id="height-error" style={{ marginTop: 6, color: '#ef4444', fontSize: 13 }}>
                      Alçada invàlida — ha de ser entre 5 i 25.
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <div>
            <label style={styles.label} htmlFor="time">Temps de Memorització (Min: 3, Max: 60)</label>
            {(() => {
              const parsed = parseInt(time, 10);
              const valid = !Number.isNaN(parsed) && parsed >= 3 && parsed <= 60;
              const showError = time.trim() !== '' && !valid;
              const inputStyle = { ...styles.input, border: `1px solid ${showError ? '#ef4444' : screenSettings.borderColor}` };
              return (
                <>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-invalid={showError}
                    aria-describedby={showError ? 'time-error' : undefined}
                    style={inputStyle} type="text" id="time"
                    value={time} onChange={(e) => setTime(e.target.value)}
                  />
                  {showError && (
                    <div id="time-error" style={{ marginTop: 6, color: '#ef4444', fontSize: 13 }}>
                      Temps invàlid — ha de ser entre 3 i 60 segons.
                    </div>
                  )}
                </>
              );
            })()}
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

          {/* Input per a Seed */}
          <div>
            <label style={styles.label} htmlFor="seed">Seed (Opcional - Repta als teus amics!)</label>
            <input
              style={styles.input}
              type="text"
              id="seed"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Ex: REPTEDIARI"
            />
          </div>

          {(() => {
            const parsedWidth = parseInt(width, 10);
            const parsedHeight = parseInt(height, 10);
            const parsedTime = parseInt(time, 10);
            const widthValid = !Number.isNaN(parsedWidth) && parsedWidth >= 5 && parsedWidth <= 25;
            const heightValid = !Number.isNaN(parsedHeight) && parsedHeight >= 5 && parsedHeight <= 25;
            const timeValid = !Number.isNaN(parsedTime) && parsedTime >= 3 && parsedTime <= 60;
            const allValid = width.trim() !== '' && height.trim() !== '' && time.trim() !== '' && widthValid && heightValid && timeValid;
            return (
              <button
                style={{ ...styles.playBtn, opacity: allValid ? 1 : 0.5, cursor: allValid ? 'pointer' : 'not-allowed' }}
                onClick={handleStart}
                disabled={!allValid}
                aria-disabled={!allValid}
                title={allValid ? 'Jugar' : 'Corregeix valors invàlids abans de jugar'}
              >
                Jugar
              </button>
            );
          })()}
        </div>
      </div>
    </main>
  );
}