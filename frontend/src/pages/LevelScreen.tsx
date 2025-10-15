import React, { useEffect, useMemo, useRef, useState } from "react";
import MazeCanvas from "../components/MazeCanvas";
import type { Level } from "../maze/maze_generator";
import { PALETTE } from "../components/palette";

type Phase = "memorize" | "playing";

export default function LevelScreen({
  level,
  onBack,
  onRetry,
}: {
  level: Level;
  onBack: () => void;
  onRetry: () => void;
}) {
  const memorizeDuration = level.memorizeTime;

  const [phase, setPhase] = useState<Phase>("memorize");
  const [remaining, setRemaining] = useState<number>(memorizeDuration);
  const total = useRef(memorizeDuration);

  // Posició del jugador, inicia a l'inici del laberint
  const [playerPos, setPlayerPos] = useState({ x: level.start.x, y: level.start.y });

  // Barra de progrés (0–100)
  const progressPct = useMemo(() => {
    const done = total.current - remaining;
    return Math.min(100, Math.max(0, (done / total.current) * 100));
  }, [remaining]);

  // Compte enrere
  useEffect(() => {
    if (phase !== "memorize") return;
    const tickMs = 1000;

    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setPhase("playing");
          // Reinicia la posició del jugador a l'inici quan comença el joc
          setPlayerPos({ x: level.start.x, y: level.start.y });
          return 0;
        }
        return r - 1;
      });
    }, tickMs);

    return () => clearInterval(id);
  }, [phase, level.start.x, level.start.y]);

  // Gestió del moviment del jugador amb tecles
  useEffect(() => {
    if (phase !== "playing") return;

    const handleKey = (e: KeyboardEvent) => {
      const { x, y } = playerPos;
      let newX = x;
      let newY = y;

      // Determina la nova posició basada en la tecla
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') newY -= 1;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') newY += 1;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') newX -= 1;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') newX += 1;
      else return; // Ignora altres tecles

      // Comprova si el moviment és vàlid (dins dels límits i sense paret)
      if (newX < 0 || newX >= level.width || newY < 0 || newY >= level.height) return;

      const cell = level.maze[y][x];
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (cell.walls.top) return;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (cell.walls.bottom) return;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (cell.walls.left) return;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (cell.walls.right) return;
      }

      // Mou el jugador
      setPlayerPos({ x: newX, y: newY });
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, playerPos, level]);

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.headerRow}>
        <button type="button" onClick={onBack} style={styles.ghostBtn} aria-label="Tornar a la selecció de nivell">
          <span aria-hidden="true">←</span> Nivells
        </button>
        <h1 style={styles.title}>Nivell {level.number}</h1>
        <button type="button" onClick={onRetry} style={{...styles.ghostBtn, justifySelf: 'end'}} aria-label="Reintentar el nivell">
          <span aria-hidden="true">↻</span> Reintentar
        </button>
      </header>

      <main style={styles.mainArea}>
        {/* PANELL DE MEMORITZACIÓ */}
        {phase === "memorize" && (
          <section aria-labelledby="memorizeTitle" style={styles.memorizePanel}>
            <h2 id="memorizeTitle" style={styles.memorizeHeading}>
              <span aria-hidden="true">👁️</span> Memoritza el Laberint!
            </h2>
            <div role="status" aria-live="polite" style={styles.memorizeCounter}>
              {remaining}
            </div>
            <div role="progressbar" aria-valuenow={Math.round(progressPct)} style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
            </div>
          </section>
        )}

        {/* TAULER DEL LABERINT */}
        <section aria-label="Tauler del laberint" style={styles.boardWrap}>
          <div style={styles.boardInner}>
            <MazeCanvas level={level} phase={phase} playerPos={playerPos} />
          </div>
        </section>
      </main>

      {/* FOOTER / TIP - Només visible durant el joc */}
      {phase === 'playing' && (
        <footer style={styles.footer}>
          <p style={styles.tip}>
            Utilitza les <kbd>Fletxes</kbd> o <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> per moure’t.
          </p>
        </footer>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100svh",
    width: "100%",
    margin: 0,
    background: PALETTE.bg,
    color: PALETTE.text,
    boxSizing: "border-box",
    padding: "clamp(16px, 3vw, 24px)",
    display: "flex",
    flexDirection: "column",
    gap: "clamp(12px, 2vw, 16px)",
    alignItems: "center", 
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexShrink: 0,
    width: "100%", 
    maxWidth: "980px", 
  },
  title: { margin: 0, fontSize: "clamp(22px, 4vw, 28px)", textAlign: "center" },
  ghostBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${PALETTE.borderColor || 'rgba(255,255,255,0.1)'}`, 
    background: PALETTE.surface,
    color: PALETTE.text,
    cursor: "pointer",
    fontSize: 16,
    whiteSpace: "nowrap",
  },
  mainArea: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    gap: "clamp(12px, 2vw, 16px)",
    minHeight: 0,
    width: "100%",
    maxWidth: "980px", 
  },
  memorizePanel: {
    background: `linear-gradient(90deg, ${PALETTE.accentBlue || '#5C6CFF'}, ${PALETTE.accentViolet || '#a78bfa'})`,
    borderRadius: 16,
    padding: "16px clamp(16px, 3vw, 24px) 20px",
    boxShadow: PALETTE.shadow,
    textAlign: "center",
    flexShrink: 0,
  },
  memorizeHeading: {
    margin: 0,
    fontSize: "clamp(16px, 2vw, 18px)",
    opacity: 0.95,
  },
  memorizeCounter: {
    fontSize: "clamp(40px, 6vw, 56px)",
    fontWeight: 800,
    marginTop: 6,
  },
  progressTrack: {
    marginTop: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,.35)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: PALETTE.surface,
    borderRadius: 999,
  },
  boardWrap: {
    flexGrow: 1,
    display: "grid",
    placeItems: "center",
    minHeight: 0,
  },
  boardInner: {
    width: '100%',
    height: '100%',
    aspectRatio: '1 / 1',
    maxWidth: 'calc(100vh - 250px)',
    maxHeight: '100%',
    background: '#EEF2FF',
    borderRadius: 16,
    boxShadow: "0 16px 48px rgba(0,0,0,.35), inset 0 0 0 3px rgba(0,0,0,.25)",
    overflow: "hidden",
  },
  footer: {
    textAlign: "center",
    flexShrink: 0,
    width: "100%",
    maxWidth: "980px",
  },
  tip: {
    display: 'inline-block',
    background: PALETTE.surface,
    border: `1px solid ${PALETTE.borderColor || 'rgba(255,255,255,0.1)'}`,
    padding: '10px 16px',
    borderRadius: 10,
    color: PALETTE.subtext,
    fontSize: 14,
  },
};