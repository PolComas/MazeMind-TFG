import React, { useMemo, useState } from 'react';
import LevelCard from './LevelCard';
import { PALETTE } from './palette';

type Diff = 'easy' | 'normal' | 'hard';

const DIFF_LABEL: Record<Diff, string> = {
  easy: 'Fàcil',
  normal: 'Normal',
  hard: 'Difícil',
};

export default function LevelSelect({
  onPlayLevel,
  onBack, 
}: {
  onPlayLevel: (levelNumber: number, difficulty: Diff) => void;
  onBack: () => void;
}) {
  const [difficulty, setDifficulty] = useState<Diff>('easy');

  // Lògica de nivells desbloquejats
  const unlocked = useMemo(() => 1, []);
  const levels = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <button style={styles.backBtn} onClick={onBack} aria-label="Tornar a la pantalla d'inici">
            <span aria-hidden="true">←</span> Inici
          </button>
          <div style={{ textAlign: 'center' }}>
            <h1 style={styles.title}>Selecciona el Nivell</h1>
          </div>
          {/* Element buit per equilibrar el flexbox */}
          <div style={{ width: 100 }} /> 
        </header>

        {/* Barra de selecció de dificultat */}
        <div role="group" aria-label="Selector de dificultat" style={styles.diffBar}>
          {(['easy', 'normal', 'hard'] as Diff[]).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              aria-pressed={difficulty === d}
              style={{
                ...styles.diffBtn,
                ...(difficulty === d ? styles.diffBtnActive : {}),
              }}
            >
              {DIFF_LABEL[d]}
            </button>
          ))}
        </div>

        {/* Graella de nivells */}
        <section aria-label="Llista de nivells">
          <div style={styles.grid}>
            {levels.map(n => (
              <LevelCard
                key={n}
                index={n}
                unlocked={n <= unlocked}
                difficulty={DIFF_LABEL[difficulty]} 
                onPlay={() => onPlayLevel(n, difficulty)}
              />
            ))}
          </div>
        </section>

          {/* Peu de pàgina amb botó de mode pràctica */}
        <footer style={styles.footer}>
          <button style={styles.practiceBtn}>
            <span aria-hidden="true">🧠</span> Mode Pràctica
          </button>
        </footer>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    // Fons de pantalla completa amb padding responsiu
    background: PALETTE.bg,
    color: PALETTE.text,
    minHeight: '100svh',
    width: '100vw',
    padding: 'clamp(16px, 4vw, 32px)', 
    boxSizing: 'border-box',
  },
  container: {
    // Contenidor centrat amb amplada màxima
    maxWidth: 960,
    margin: '0 auto',
  },
  header: {
    // Capçalera amb flexbox per botó enrere, títol i espai buit
    display: 'flex', 
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  title: { 
    // Títol de la pàgina amb font responsiva
    margin: 0, fontSize: 'clamp(24px, 5vw, 32px)' 
  },
  backBtn: {
    // Botó per tornar enrere amb estil de superfície
    padding: '10px 14px',
    borderRadius: 12,
    border: PALETTE.borderColor,
    background: PALETTE.surface,
    color: PALETTE.text,
    cursor: 'pointer',
    fontSize: 16,
    width: 100,
  },
  diffBar: { 
    // Barra de botons per seleccionar dificultat
    display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 
  },
  diffBtn: {
    // Botó de dificultat base amb transició
    padding: '8px 16px',
    borderRadius: 999,
    border: PALETTE.borderColor,
    background: 'transparent',
    color: PALETTE.subtext,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  diffBtnActive: { 
    // Estils addicionals per al botó actiu (verd i escalat)
    background: PALETTE.accentGreen,
    color: PALETTE.bg, 
    borderColor: PALETTE.accentGreen,
    fontWeight: 800,
    transform: 'scale(1.05)',
   },
  grid: {
    // Graella responsiva per les targetes de nivell
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
    gap: 'clamp(12px, 2vw, 20px)',
  },
  footer: { 
    // Peu de pàgina centrat amb botó de pràctica
    display:'flex', 
    justifyContent:'center', 
    marginTop: 32,
  },
  practiceBtn: {
    // Botó de mode pràctica amb estil de superfície
    padding: '12px 20px',
    borderRadius: 12,
    border: PALETTE.borderColor,
    background: PALETTE.surface,
    color: PALETTE.text,
    fontSize: 16,
    cursor: 'pointer',
  },
}