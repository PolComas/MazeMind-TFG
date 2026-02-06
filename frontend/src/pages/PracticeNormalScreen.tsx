import React, { useEffect, useMemo, useRef, useState, useCallback, } from "react";
import MazeCanvas from "../components/MazeCanvas";
import NetworkBackground from "../components/NetworkBackground";
import { PALETTE } from "../components/palette";
import { useGameAudio } from "../audio/sound";
import { useSettings } from "../context/SettingsContext";
import GameOverModal from "../components/GameOverModal";
import PracticeHUD from "../components/PracticeHUD";
import PracticeScoreModal from "../components/PracticeScoreModal";
import { generateLevel, type Level } from "../maze/maze_generator";
import { savePracticeRun, loadPracticeBestScore } from "../utils/practiceProgress";
import { useUser } from "../context/UserContext";
import { pushPracticeBest } from "../lib/sync";
import { useLanguage } from "../context/LanguageContext";

type Phase = "memorize" | "playing" | "completed" | "failed";

const REVEAL_DURATION_MS = 500;
const LIVES = 3;

type LevelConfig = {
  width: number;
  height: number;
  memorizeTime: number;
};

type ScoreTuning = {
  baseScore: number;
  timeLossPerSecond: number;
  pathHelpLossPerSecond: number;
  revealCost: number;
};

// Taula de mides per rangs de nivells (clamp a 20x20)
const SIZE_TABLE: Array<{ w: number; h: number }> = [
  { w: 3, h: 3 },  // 1
  { w: 3, h: 4 },  // 2
  { w: 4, h: 4 },  // 3
  { w: 4, h: 5 },  // 4
  { w: 5, h: 5 },  // 5
  { w: 5, h: 6 },  // 6
  { w: 6, h: 6 },  // 7
  { w: 6, h: 7 },  // 8
  { w: 7, h: 7 },  // 9
  { w: 7, h: 8 },  // 10
  { w: 8, h: 8 },  // 11
  { w: 8, h: 9 },  // 12
  { w: 9, h: 9 },  // 13
  { w: 10, h: 10 }, // 14
  { w: 12, h: 12 }, // 15
  { w: 15, h: 15 }, // 16
  { w: 18, h: 18 }, // 17
  { w: 20, h: 20 }, // 18+ → clamp
];

function getLevelConfig(levelIndex: number): LevelConfig {
  const index = Math.min(levelIndex - 1, SIZE_TABLE.length - 1);
  const { w, h } = SIZE_TABLE[index];

  const cells = w * h;
  // Temps de memorització proporcional a les cel·les, amb límit
  const memorizeTime = Math.min(
    18,
    Math.max(5, Math.round(cells / 6))
  );

  return { width: w, height: h, memorizeTime };
}

// Paràmetres de puntuació per "tier" (cada 3 nivells puja una mica)
function getScoreTuning(levelIndex: number): ScoreTuning {
  const rawTier = Math.floor((levelIndex - 1) / 3); // 0 per nivells 1–3, 1 per 4–6...
  const tier = Math.min(rawTier, 6); // clamp perquè no es descontroli

  const baseScore = 400 + tier * 200;             // 400, 600, 800, ...
  const timeLossPerSecond = 0.4 + tier * 0.15;    // 0.4, 0.55, 0.7, ...
  const pathHelpLossPerSecond = 1 + tier * 0.5;   // 1, 1.5, 2, ...
  const revealCost = 25 + tier * 10;              // 25, 35, 45, ...

  return { baseScore, timeLossPerSecond, pathHelpLossPerSecond, revealCost };
}


type Pos = { x: number; y: number };

export default function PracticeNormalScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  const audio = useGameAudio();
  const { getVisualSettings, settings } = useSettings();
  const { user } = useUser();
  const { t } = useLanguage();
  const screenSettings = getVisualSettings("levelScreen");
  const { keyMoveUp, keyMoveDown, keyMoveLeft, keyMoveRight } = settings.game;
  const formatKey = (key: string) => {
    if (key === " ") return t('keys.space');
    if (key.length === 1) return key.toUpperCase();
    return key;
  };

  // Estat local de la RUN de Score
  const [currentLevel, setCurrentLevel] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => loadPracticeBestScore());

  // Nivell actual (laberint)
  const [level, setLevel] = useState<Level>(() => {
    const cfg = getLevelConfig(1);
    return generateLevel({
      levelNumber: 1,
      difficulty: "normal",
      width: cfg.width,
      height: cfg.height,
      memorizeTime: cfg.memorizeTime,
      stars: [60, 45, 30],
    });
  });

  // Punts aconseguits a l'últim laberint (per al modal)
  const [lastLevelScore, setLastLevelScore] = useState(0);
  // Referència no-op per evitar warning de "variable no usada" (es reserva per al modal)
  void lastLevelScore;

  // Tuning de puntuació segons el nivell actual
  const [scoreTuning, setScoreTuning] = useState<ScoreTuning>(() =>
    getScoreTuning(1)
  );

  const memorizeDuration = level.memorizeTime;

  const [phase, setPhase] = useState<Phase>("memorize");
  const [remaining, setRemaining] = useState<number>(memorizeDuration);
  const total = useRef(memorizeDuration);
  const memorizeTimerRef = useRef<number | null>(null);
  const [playerPos, setPlayerPos] = useState<Pos>({
    x: level.start.x,
    y: level.start.y,
  });
  const [playerPath, setPlayerPath] = useState<Pos[]>([
    { x: level.start.x, y: level.start.y },
  ]);

  const [gameTime, setGameTime] = useState(0);
  // Referència no-op per evitar warning de variable no usada
  void gameTime;
  const [points, setPoints] = useState(() => scoreTuning.baseScore);

  const [lives, setLives] = useState(LIVES); // sempre amb vides al mode score

  const [revealCharges, setRevealCharges] = useState(3);
  const [isPathHelpActive, setIsPathHelpActive] = useState(false);
  const [isCrashHelpActive, setIsCrashHelpActive] = useState(false);

  const [showReveal, setShowReveal] = useState(false);
  const [crashedAt, setCrashedAt] = useState<Pos | null>(null);

  const [showScoreModal, setShowScoreModal] = useState(false);

  const progressPct = useMemo(() => {
    const done = total.current - remaining;
    return Math.min(100, Math.max(0, (done / total.current) * 100));
  }, [remaining]);

  const startPlaying = useCallback(() => {
    audio.playStart();
    setPhase("playing");
    setPlayerPos({ x: level.start.x, y: level.start.y });
  }, [audio, level.start.x, level.start.y]);

  // Helpers per resetejar TOT quan canviem de laberint
  const resetForLevel = useCallback(
    (lvl: Level, tuning: ScoreTuning) => {
      setPhase("memorize");
      setRemaining(lvl.memorizeTime);
      total.current = lvl.memorizeTime;
      setPlayerPos({ x: lvl.start.x, y: lvl.start.y });
      setPlayerPath([{ x: lvl.start.x, y: lvl.start.y }]);
      setGameTime(0);
      setPoints(tuning.baseScore);
      setLives(LIVES);
      setRevealCharges(3);
      setIsPathHelpActive(false);
      setIsCrashHelpActive(false);
      setCrashedAt(null);
      setShowReveal(false);
    },
    []
  );

  // Compte enrere de memorització
  useEffect(() => {
    if (phase !== "memorize") return;
    const tickMs = 1000;
    memorizeTimerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (memorizeTimerRef.current) {
            clearInterval(memorizeTimerRef.current);
            memorizeTimerRef.current = null;
          }
          startPlaying();
          return 0;
        }
        if (r <= 4) audio.playTickFinal();
        else audio.playTick();
        return r - 1;
      });
    }, tickMs);
    return () => {
      if (memorizeTimerRef.current) {
        clearInterval(memorizeTimerRef.current);
        memorizeTimerRef.current = null;
      }
    };
  }, [phase, audio, startPlaying]);

  // Saltar memorització amb tecla
  useEffect(() => {
    if (phase !== "memorize") return;
    const { game: gameSettings } = settings;
    const skipKey = (gameSettings.keySkipMemorize || "").toLowerCase();
    if (!skipKey) return;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          (target as any).isContentEditable)
      )
        return;

      const key = e.key.toLowerCase();
      if (e.key === gameSettings.keySkipMemorize || key === skipKey) {
        e.preventDefault();
        if (memorizeTimerRef.current) {
          clearInterval(memorizeTimerRef.current);
          memorizeTimerRef.current = null;
        }
        setRemaining(0);
        startPlaying();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, settings, startPlaying]);

  const pathHelpRef = useRef(isPathHelpActive);
  useEffect(() => {
    pathHelpRef.current = isPathHelpActive;
  }, [isPathHelpActive]);

  const crashHelpRef = useRef(isCrashHelpActive);
  useEffect(() => {
    crashHelpRef.current = isCrashHelpActive;
  }, [isCrashHelpActive]);

  // Música
  useEffect(() => {
    if (phase === "playing") {
      audio.startMusic();
      return () => audio.stopMusic();
    }
    audio.stopMusic();
  }, [phase, audio]);

  // Temporitzador & pèrdua de punts
  useEffect(() => {
    if (phase !== "playing") return;

    const gameTick = setInterval(() => {
      setGameTime((t) => t + 1);
      setPoints((p) => {
        let loss = scoreTuning.timeLossPerSecond;
        if (pathHelpRef.current) loss += scoreTuning.pathHelpLossPerSecond;
        return Math.max(0, p - loss);
      });
    }, 1000);

    return () => clearInterval(gameTick);
  }, [phase, scoreTuning]);


  // Ajudes
  const onRevealHelp = useCallback(() => {
    if (phase !== "playing" || revealCharges <= 0 || showReveal) return;
    audio.playReveal();
    setRevealCharges((c) => c - 1);
    setPoints((p) => Math.max(0, p - scoreTuning.revealCost));
    setShowReveal(true);
    setTimeout(() => setShowReveal(false), REVEAL_DURATION_MS);
  }, [phase, revealCharges, showReveal, audio, scoreTuning]);


  const onTogglePathHelp = useCallback(() => {
    if (phase !== "playing") return;
    setIsPathHelpActive((active) => {
      active ? audio.playToggleOff() : audio.playToggleOn();
      return !active;
    });
  }, [phase, audio]);

  const onToggleCrashHelp = useCallback(() => {
    if (phase !== "playing") return;
    setIsCrashHelpActive((active) => {
      active ? audio.playToggleOff() : audio.playToggleOn();
      return !active;
    });
  }, [phase, audio]);

  const handleBackWithSound = useCallback(() => {
    audio.playFail();
    audio.stopMusic();
    onBack();
  }, [audio, onBack]);


  // Reiniciar la run completa (tornar a nivell 1, score 0)
  const handleRestartRun = useCallback(() => {
    audio.playFail();
    audio.stopMusic();

    setTotalScore(0);
    setCurrentLevel(1);
    setBestScore(loadPracticeBestScore());

    const cfg = getLevelConfig(1);
    const firstLevel = generateLevel({
      levelNumber: 1,
      difficulty: "normal",
      width: cfg.width,
      height: cfg.height,
      memorizeTime: cfg.memorizeTime,
      stars: [60, 45, 30],
    });
    const firstTuning = getScoreTuning(1);

    setLevel(firstLevel);
    setScoreTuning(firstTuning);
    resetForLevel(firstLevel, firstTuning);
  }, [audio, resetForLevel]);


  const handleNextLevel = useCallback(() => {
    audio.playBtnSound();
    audio.stopMusic();

    setCurrentLevel((prevLevel) => {
      const nextLevel = prevLevel + 1;

      const cfg = getLevelConfig(nextLevel);
      const newLevel = generateLevel({
        levelNumber: nextLevel,
        difficulty: "normal",
        width: cfg.width,
        height: cfg.height,
        memorizeTime: cfg.memorizeTime,
        stars: [60, 45, 30],
      });
      const newTuning = getScoreTuning(nextLevel);

      setLevel(newLevel);
      setScoreTuning(newTuning);
      resetForLevel(newLevel, newTuning);

      return nextLevel;
    });

    setShowScoreModal(false);
  }, [audio, resetForLevel]);


  // Quan completes un laberint, sumem punts i mostrem modal de score
  useEffect(() => {
    if (phase !== "completed") return;
    setLastLevelScore(points);
    setTotalScore((prev) => prev + points);
    setShowScoreModal(true);
  }, [phase, points]);


  // Moviment + teclat
  useEffect(() => {
    if (phase !== "playing") return;

    const { game: gameSettings } = settings;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          (target as any).isContentEditable)
      )
        return;

      if (showReveal) return;
      setCrashedAt(null);

      const key = e.key.toLowerCase();

      // Ajudes
      if (
        e.key === gameSettings.keyHelpReveal ||
        key === (gameSettings.keyHelpReveal || "").toLowerCase()
      ) {
        e.preventDefault();
        onRevealHelp();
        return;
      }
      if (key === (gameSettings.keyHelpPath || "").toLowerCase()) {
        e.preventDefault();
        onTogglePathHelp();
        return;
      }

      // Moviment
      const { x, y } = playerPos;
      let newX = x,
        newY = y;
      let didCrash = false;

      if (e.key === "ArrowUp" || key === (gameSettings.keyMoveUp || "").toLowerCase()) {
        e.preventDefault();
        if (level.maze[y][x].walls.top) didCrash = true;
        else newY -= 1;
      } else if (
        e.key === "ArrowDown" ||
        key === (gameSettings.keyMoveDown || "").toLowerCase()
      ) {
        e.preventDefault();
        if (level.maze[y][x].walls.bottom) didCrash = true;
        else newY += 1;
      } else if (
        e.key === "ArrowLeft" ||
        key === (gameSettings.keyMoveLeft || "").toLowerCase()
      ) {
        e.preventDefault();
        if (level.maze[y][x].walls.left) didCrash = true;
        else newX -= 1;
      } else if (
        e.key === "ArrowRight" ||
        key === (gameSettings.keyMoveRight || "").toLowerCase()
      ) {
        e.preventDefault();
        if (level.maze[y][x].walls.right) didCrash = true;
        else newX += 1;
      } else {
        return;
      }

      if (didCrash) {
        audio.playCrash();
        const newLives = lives - 1;
        if (newLives <= 0) {
          setLives(0);
          audio.stopMusic();
          setPhase("failed");
          // Guardar només el maxScore de la run actual
          const newBest = savePracticeRun(totalScore);
          setBestScore(newBest);
          if (user) {
            pushPracticeBest(user.id, newBest).catch((error) => {
              console.error('Error sincronitzant el millor score de pràctica:', error);
            });
          }
        } else {
          setLives(newLives);
          setPlayerPos({ x: level.start.x, y: level.start.y });
          setPlayerPath([{ x: level.start.x, y: level.start.y }]);
        }
        return;
      }

      if (
        newX >= 0 &&
        newX < level.width &&
        newY >= 0 &&
        newY < level.height
      ) {
        setPlayerPos({ x: newX, y: newY });
        setPlayerPath((prev) => [...prev, { x: newX, y: newY }]);
      }

      if (newX === level.exit.x && newY === level.exit.y) {
        audio.playWin();
        audio.stopMusic();
        setPhase("completed");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, settings, level, playerPos, lives, showReveal, audio,
    onRevealHelp, onTogglePathHelp, onToggleCrashHelp, totalScore, user]);

  const mazeSettings = useMemo(
    () => ({
      path_color: screenSettings.mazePathColor || "#EEF2FF",
      wall_color: screenSettings.mazeWallColor || "#3B82F6",
      wall_thickness: screenSettings.mazeWallThickness || 3,
      exit_color:
        screenSettings.mazeExitColor ||
        screenSettings.normalColor ||
        "#F59E0B",
      player_color: screenSettings.mazePlayerColor || "#111",
      player_path_color:
        screenSettings.playerPathColor || "rgba(0, 0, 0, 0.4)",
      crash_help_color: screenSettings.crashHelpColor || "#E11D48",
    }),
    [screenSettings]
  );

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100svh",
      width: "100%",
      margin: 0,
      background: 'transparent', // Removed static color
      color: screenSettings.textColor,
      boxSizing: "border-box",
      padding: "clamp(16px, 3vw, 24px)",
      display: "flex",
      flexDirection: "column",
      gap: "clamp(12px, 2vw, 16px)",
      alignItems: "center",
      position: 'relative',
      isolation: 'isolate',
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
      border: `1px solid ${screenSettings.borderColor}`,
      background: screenSettings.surfaceColor,
      color: screenSettings.textColor,
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
      background: `linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
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
      background: screenSettings.surfaceColor,
      borderRadius: 999,
    },
    memorizeHint: {
      margin: "8px 0 0 0",
      fontSize: "0.85rem",
      opacity: 0.9,
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
      background: screenSettings.mazePathColor,
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
      background: screenSettings.surfaceColor,
      border: `1px solid ${screenSettings.borderColor}`,
      padding: '10px 16px',
      borderRadius: 10,
      color: screenSettings.subtextColor,
      fontSize: 14,
    },
  };

  return (
    <div style={styles.page}>
      <NetworkBackground
        primaryColor={screenSettings.normalColor || '#60a5fa'}
        backgroundColor={screenSettings.backgroundColor}
        opacity={0.4}
      />
      {/* HEADER */}
      <header style={styles.headerRow}>
        <button
          type="button"
          onClick={handleBackWithSound}
          onMouseEnter={() => audio.playHover()}
          style={styles.ghostBtn}
        >
          <span aria-hidden="true">←</span> {t('common.back')}
        </button>
        <h1 style={styles.title}>{t('practiceScore.modeTitle')} {currentLevel}</h1>
        <div style={{ width: 100 }} />
      </header>

      <main style={styles.mainArea}>
        {/* Memorització o HUD */}
        {phase === "memorize" ? (
          <section
            aria-labelledby="memorizeTitle"
            style={styles.memorizePanel}
          >
            <h2 id="memorizeTitle" style={styles.memorizeHeading}>
              <span aria-hidden="true">👁️</span> {t('level.memorize.title')}
            </h2>
            <div
              role="status"
              aria-live="polite"
              style={styles.memorizeCounter}
            >
              {remaining}
            </div>
            <div
              role="progressbar"
              aria-valuenow={Math.round(progressPct)}
              style={styles.progressTrack}
            >
              <div
                style={{ ...styles.progressFill, width: `${progressPct}%` }}
              />
            </div>
            <p style={styles.memorizeHint}>
              {t('level.memorize.skip.before')} <kbd>{formatKey(settings.game.keySkipMemorize)}</kbd> {t('level.memorize.skip.after')}
            </p>
          </section>
        ) : (
          <PracticeHUD
            totalScore={totalScore}
            revealCharges={revealCharges}
            isPathHelpActive={isPathHelpActive}
            isCrashHelpActive={isCrashHelpActive}
            onRevealHelp={onRevealHelp}
            onTogglePathHelp={onTogglePathHelp}
            onToggleCrashHelp={onToggleCrashHelp}
            lives={lives}
          />
        )}

        {/* TAULER */}
        <section aria-label={t('level.aria.board')} style={styles.boardWrap}>
          <div style={styles.boardInner}>
            <MazeCanvas
              level={level}
              phase={phase}
              playerPos={playerPos}
              showReveal={showReveal}
              settings={mazeSettings}
              showPlayerPath={isPathHelpActive}
              crashPosition={crashedAt}
              forcePathHistory={playerPath}
            />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        {phase === "playing" ? (
          <p style={styles.tip}>
            {t('level.tip.move.before')} <kbd>{t('keys.arrows')}</kbd> {t('level.tip.move.middle')}
            <kbd> {formatKey(keyMoveUp)}</kbd>
            <kbd>{formatKey(keyMoveLeft)}</kbd>
            <kbd>{formatKey(keyMoveDown)}</kbd>
            <kbd>{formatKey(keyMoveRight)} </kbd>
            {t('level.tip.move.after')}
          </p>
        ) : phase === "memorize" ? (
          <p style={styles.tip}>
            {t('level.tip.memorize')}
          </p>
        ) : null}
      </footer>

      {/* MODALS */}
      {phase === "failed" && (
        <GameOverModal
          onRetry={handleRestartRun}
          onBack={handleBackWithSound}
          score={Math.round(totalScore)}
          bestScore={Math.round(bestScore)}
          isPracticeScoreMode={true}
        />
      )}

      {phase === "completed" && showScoreModal && (
        <PracticeScoreModal
          levelNumber={currentLevel - 1}
          pointsGained={points}
          totalScore={totalScore}
          onNextLevel={handleNextLevel}
          onBack={handleBackWithSound}
        />
      )}
    </div>
  );
}
