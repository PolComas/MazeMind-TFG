import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import MazeCanvas from "../components/MazeCanvas";
import type { Level } from "../maze/maze_generator";
import { PALETTE } from "../components/palette";
import GameHUD from "../components/GameHUD";
import { useGameAudio } from "../audio/sound";
import CompletionModal from '../components/CompletionModal';

type Phase = "memorize" | "playing" | "completed";

// Constants del Joc
const POINTS_START = 1000;
const POINTS_LOSS_PER_SECOND = 1;
const POINTS_LOSS_PATH_HELP = 2; // Cost extra per segon
const POINTS_LOSS_CRASH_HELP = 20; 
const POINTS_COST_REVEAL = 50;
const REVEAL_DURATION_MS = 500; // 0.5 segons

export default function LevelScreen({
  level,
  onBack: onBackOriginal,
  onRetry: originalOnRetry,
}: {
  level: Level;
  onBack: () => void;
  onRetry: () => void;
}) {
  const audio = useGameAudio();
  const memorizeDuration = level.memorizeTime;

  const [phase, setPhase] = useState<Phase>("memorize");
  const [remaining, setRemaining] = useState<number>(memorizeDuration);
  const total = useRef(memorizeDuration);
  const [playerPos, setPlayerPos] = useState({ x: level.start.x, y: level.start.y });

  // Estats per al Joc
  const [gameTime, setGameTime] = useState(0);
  const [points, setPoints] = useState(POINTS_START);

  // Sorolls Estrella
  const getStars = (p: number) => {
    if (p >= 800) return 3;
    if (p >= 400) return 2;
    if (p > 0) return 1;
    return 0;
  };

  const currentStars = useMemo(() => getStars(points), [points]);
  const prevStarsRef = useRef(getStars(POINTS_START));

  useEffect(() => {
    if (currentStars < prevStarsRef.current) {
      audio.playStarLoss(); 
    }
    prevStarsRef.current = currentStars;
  }, [currentStars, audio.playStarLoss]);

  const [revealCharges, setRevealCharges] = useState(3);
  const [isPathHelpActive, setIsPathHelpActive] = useState(false);
  const [isCrashHelpActive, setIsCrashHelpActive] = useState(false);

  // Estats per passar al Canvas
  const [showReveal, setShowReveal] = useState(false);
  const [crashedAt, setCrashedAt] = useState<{x: number, y: number} | null>(null);

  // Barra de progrés (0–100)
  const progressPct = useMemo(() => {
    const done = total.current - remaining;
    return Math.min(100, Math.max(0, (done / total.current) * 100));
  }, [remaining]);

  // Compte enrere (Memorize)
  useEffect(() => {
    if (phase !== "memorize") return;
    const tickMs = 1000;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          audio.playStart();
          setPhase("playing");
          setPlayerPos({ x: level.start.x, y: level.start.y });
          return 0;
        }
        // So de compte enrere
        if (r <= 4) { 
          audio.playTickFinal(); 
        } else {
          audio.playTick(); 
        }

        return r - 1;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [phase, level.start.x, level.start.y, audio]);

  // Efectes pel Joc (Temps i Punts)
  useEffect(() => {
    if (phase !== 'playing'){
      audio.stopMusic();
      return;
    }

    audio.startMusic();

    const gameTick = setInterval(() => {
      setGameTime(t => t + 1);

    let pointLoss = POINTS_LOSS_PER_SECOND;
    if (isPathHelpActive) pointLoss += POINTS_LOSS_PATH_HELP;


    setPoints(p => Math.max(0, p - pointLoss));
      }, 1000);

    return () => {
      clearInterval(gameTick);
      audio.stopMusic();
    };
  }, [phase, isPathHelpActive, isCrashHelpActive, audio]);

  
  // Lògica d'Ajudes
  const onRevealHelp = useCallback(() => {
    if (phase !== 'playing' || revealCharges <= 0 || showReveal) return;
    audio.playReveal();
    setRevealCharges(c => c - 1);
    setPoints(p => Math.max(0, p - POINTS_COST_REVEAL));
    setShowReveal(true);
    setTimeout(() => setShowReveal(false), REVEAL_DURATION_MS);
  }, [phase, revealCharges, showReveal, audio]);

  const onTogglePathHelp = useCallback(() => {
    if (phase !== 'playing') return;
    setIsPathHelpActive(active => {
      active ? audio.playToggleOff() : audio.playToggleOn(); 
      return !active;
    });
  }, [phase, audio]);

  const onToggleCrashHelp = useCallback(() => {
    if (phase !== 'playing') return;
    setIsCrashHelpActive(active => {
      active ? audio.playToggleOff() : audio.playToggleOn(); 
      return !active;
    });
  }, [phase, audio]);

  const onRetryWithSound = useCallback(() => {
    audio.playFail(); 
    audio.stopMusic();
    originalOnRetry(); 
  }, [originalOnRetry, audio]);

  const onBackWithSound = useCallback(() => {
    audio.playFail(); 
    onBackOriginal();
  }, [onBackOriginal, audio]);

  // Gestió de Teclat (Moviment + Ajudes)
  useEffect(() => {
    if (phase !== "playing") return;

    const handleKey = (e: KeyboardEvent) => {
      if (showReveal) return;
      setCrashedAt(null);

      // Ajudes
      if (e.key === 'h' || e.key === 'H') { onRevealHelp(); return; }
      if (e.key === 'j' || e.key === 'J') { onTogglePathHelp(); return; }
      if (e.key === 'k' || e.key === 'K') { onToggleCrashHelp(); return; }

      // Moviment
      const { x, y } = playerPos;
      let newX = x, newY = y;
      let didCrash = false;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (level.maze[y][x].walls.top) { didCrash = true; } else { newY -= 1; }
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (level.maze[y][x].walls.bottom) { didCrash = true; } else { newY += 1; }
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (level.maze[y][x].walls.left) { didCrash = true; } else { newX -= 1; }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (level.maze[y][x].walls.right) { didCrash = true; } else { newX += 1; }
      } else {
        return;
      }

      if (didCrash) {
        if (isCrashHelpActive) {
          // Mostrar l'ajuda de xoc
          audio.playCrash();
          setCrashedAt({ x, y });
          setPoints(p => Math.max(0, p - POINTS_LOSS_CRASH_HELP));
          setTimeout(() => setCrashedAt(null), REVEAL_DURATION_MS);
        }
        return; 
      }

      // Actualitzar la posició del jugador
      if (newX >= 0 && newX < level.width && newY >= 0 && newY < level.height) {
        setPlayerPos({ x: newX, y: newY });
      }

      // Lògica de Victòria
      if (newX === level.exit.x && newY === level.exit.y) {
        audio.playWin(); 
        audio.stopMusic();
        setPhase("completed");
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, playerPos, level, isCrashHelpActive, onRevealHelp, onTogglePathHelp, onToggleCrashHelp, showReveal, audio, points]);

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.headerRow}>
        <button type="button" onClick={onBackWithSound} style={styles.ghostBtn} aria-label="Tornar a la selecció de nivell">
          <span aria-hidden="true">←</span> Nivells
        </button>
        <h1 style={styles.title}>Nivell {level.number}</h1>
        <button type="button" onClick={onRetryWithSound} style={{...styles.ghostBtn, justifySelf: 'end'}} aria-label="Reintentar el nivell">
          <span aria-hidden="true">↻</span> Reintentar
        </button>
      </header>

      <main style={styles.mainArea}>

        {/* Mostrar el panell de memorització O el HUD del joc */}        
        {phase === "memorize" ? (
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
        ) : (
          // Mostrar el HUD quan la fase no sigui memorize
          <GameHUD
            gameTime={gameTime}
            points={points}
            revealCharges={revealCharges}
            isPathHelpActive={isPathHelpActive}
            isCrashHelpActive={isCrashHelpActive}
            onRevealHelp={onRevealHelp}
            onTogglePathHelp={onTogglePathHelp}
            onToggleCrashHelp={onToggleCrashHelp}
          />
        )}


        {/* TAULER DEL LABERINT */}
        <section aria-label="Tauler del laberint" style={styles.boardWrap}>
          <div style={styles.boardInner}>
            <MazeCanvas 
              level={level} 
              phase={phase} 
              playerPos={playerPos} 
              showReveal={showReveal}
              showPlayerPath={isPathHelpActive}
              crashPosition={crashedAt}
            />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        {phase === 'playing' ? (
          <p style={styles.tip}>
            Utilitza les <kbd>Fletxes</kbd> o <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> per moure’t.
          </p>
        ) : phase === 'memorize' ? (
          <p style={styles.tip}>
            Memoritza el camí des de l'inici (negre) fins al final (taronja).
          </p>
        ) : null }
      </footer>

      {/* Nivell completat */}
      {phase === "completed" && (
        <CompletionModal
          levelNumber={level.number}
          stars={currentStars} 
          time={gameTime}
          points={points}
          onRetry={onRetryWithSound} 
          onBack={onBackWithSound}
        />
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
    maxWidth: 'calc(100vh - 300px)',
    maxHeight: '100%',
    background: '#EEF2FF',
    borderRadius: 16,
    boxShadow: "0 16px 48px rgba(0,0,0,.35), inset 0 0 0 3px rgba(0,0,0,.25)",
    overflow: "hidden",
    position: 'relative', 
  },
  footer: { 
    flexShrink: 0,
    width: "100%",
    maxWidth: "980px",
    textAlign: "center",
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