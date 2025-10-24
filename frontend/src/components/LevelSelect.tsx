import React, { useMemo, useState, useRef, useEffect } from 'react';
import LevelCard from './LevelCard';
import { PALETTE } from './palette';
import { Dumbbell, Zap, Flame } from 'lucide-react';

type Diff = 'easy' | 'normal' | 'hard';

const DIFF_LABEL: Record<Diff, string> = {
  easy: 'Fàcil',
  normal: 'Normal',
  hard: 'Difícil',
};

// Icones per dificultat
const difficultyIcons: Record<Diff, React.ReactNode> = {
  easy: <Dumbbell size={16} />,
  normal: <Zap size={16} />,
  hard: <Flame size={16} />,
};

// Mapar la dificultat a un color
const difficultyColors: Record<Diff, string> = {
  easy: PALETTE.easyGreen,
  normal: PALETTE.normalYellow,
  hard: PALETTE.hardRed,
};

export default function LevelSelect({
  onPlayLevel,
  onBack, 
}: {
  onPlayLevel: (levelNumber: number, difficulty: Diff) => void;
  onBack: () => void;
}) {
  const [difficulty, setDifficulty] = useState<Diff>('easy');

  // Indicador lliscant
  const diffBarRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  // Posició de l'indicador quan canvia la dificultat
  useEffect(() => {
    if (!diffBarRef.current) return;

    const buttons = diffBarRef.current.querySelectorAll('button');
    const difficulties: Diff[] = ['easy', 'normal', 'hard'];
    const activeIndex = difficulties.indexOf(difficulty);
    const activeButton = buttons[activeIndex] as HTMLElement | null;

    if (activeButton) {
      setIndicatorStyle({
        left: `${activeButton.offsetLeft}px`,
        width: `${activeButton.offsetWidth}px`,
        background: difficultyColors[difficulty], 
        opacity: 1,
      });
    } else {
      setIndicatorStyle({ opacity: 0 }); 
    }
  }, [difficulty]);

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
        <div role="tablist" aria-label="Selector de dificultat" style={styles.diffBarContainer} ref={diffBarRef} >
          <div style={{ ...styles.diffIndicator, ...indicatorStyle }} />

          {(['easy', 'normal', 'hard'] as Diff[]).map(d => (
            <button
              key={d}
              role="tab" 
              onClick={() => setDifficulty(d)}
              aria-selected={difficulty === d} 
              style={{
                ...styles.diffTab, 
                color: difficulty === d ? PALETTE.text : PALETTE.subtext, 
              }}
            >
              {difficultyIcons[d]} 
              {DIFF_LABEL[d]}
            </button>
          ))}
        </div>

        {/* Graella de nivells */}
        <section aria-label={`Nivells de dificultat ${DIFF_LABEL[difficulty]}`}>
          <div style={styles.grid}>
            {levels.map(n => (
              <LevelCard
                key={`${difficulty}-${n}`}
                index={n}
                unlocked={n <= unlocked}
                difficulty={difficulty} 
                onPlay={() => onPlayLevel(n, difficulty)}
              />
            ))}
          </div>
        </section>

          {/* Peu de pàgina amb botó de mode pràctica */}
        <footer style={styles.footer}>
          <button style={styles.practiceBtn}>
            <Dumbbell size={18} /> Mode Pràctica
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
  // --- Nous estils per a la barra de dificultat ---
  diffBarContainer: { 
    position: 'relative', // Conté l'indicador absolut
    display: 'flex', 
    justifyContent: 'center', 
    background: PALETTE.surface, // Fons del contenidor
    borderRadius: 999, // Arrodonit
    padding: '6px', // Espai interior
    marginBottom: 32, // Més separació
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)', // Ombra interior
  },
  diffTab: { // Estil dels botons de dificultat
    flexGrow: 1, 
    padding: '10px 16px',
    borderRadius: 999,
    border: 'none',
    background: 'transparent',
    color: PALETTE.subtext,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'color 0.3s ease',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  diffIndicator: { // Estil de l'indicador lliscant
    position: 'absolute',
    top: '6px',
    bottom: '6px',
    borderRadius: 999,
    boxShadow: PALETTE.shadow,
    transition: 'left 0.3s ease, width 0.3s ease, background 0.3s ease',
    zIndex: 1,
    opacity: 0,
  },
  diffBar: { 
    // Barra de botons per seleccionar dificultat
    display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 
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