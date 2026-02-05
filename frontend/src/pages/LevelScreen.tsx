import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import MazeCanvas from "../components/MazeCanvas";
import NetworkBackground from "../components/NetworkBackground";
import type { Level } from "../maze/maze_generator";
import { PALETTE } from "../components/palette";
import GameHUD from "../components/GameHUD";
import { useGameAudio } from "../audio/sound";
import CompletionModal from '../components/CompletionModal';
import GameOverModal from '../components/GameOverModal';
import PracticeCompletionModal from '../components/PracticeCompletionModal';
import PracticeIaCompletionModal from '../components/PracticeIaCompletionModal';
import { saveLevelCompletion, type GameProgress } from '../utils/progress';
import { useSettings } from '../context/SettingsContext';
import TutorialOverlay, { tutorialSteps } from "../components/TutorialOverlay";
import { useUser } from '../context/UserContext';
import { pushProgress } from '../lib/sync';
import { analyzeLevel } from '../maze/maze_stats';
import { recordAttemptAndUpdateSkill, recommendDdaTuning, type DdaTuning } from '../lib/dda';

type Phase = "memorize" | "playing" | "completed" | "failed";

// Constants del Joc
const POINTS_START = 1000;
const POINTS_LOSS_PER_SECOND = 1;
const POINTS_LOSS_PATH_HELP = 2; // Cost extra per segon
const POINTS_LOSS_CRASH_HELP = 20;
const POINTS_COST_REVEAL = 50;
const REVEAL_DURATION_MS = 500; // 0.5 segons
const LIVES = 3;

type Pos = { x: number; y: number };

// Helper per formatar tecles
const formatKey = (key: string) => {
  if (key === ' ') return 'Espai';
  if (key.length === 1) return key.toUpperCase();
  return key;
};

const countRevisits = (path: Pos[]) => {
  const seen = new Set<string>();
  let revisits = 0;
  for (const step of path) {
    const key = `${step.x},${step.y}`;
    if (seen.has(key)) revisits += 1;
    else seen.add(key);
  }
  return revisits;
};

// Helper per als títols de dificultat
const DIFF_LABEL: Record<string, string> = {
  easy: 'Fàcil',
  normal: 'Normal',
  hard: 'Difícil',
};

export default function LevelScreen({
  level,
  onBack: onBackOriginal,
  onRetry: originalOnRetry,
  isTutorialMode,
  onCompleteTutorial,
  onLevelComplete,
  onNextLevel,
  isPracticeMode,
  progress,
  telemetryMode,
  suppressModals,
  onGameEnd,
}: {
  level: Level;
  onBack: () => void;
  onRetry: () => void;
  isTutorialMode: boolean;
  onCompleteTutorial: () => void;
  onLevelComplete: (newProgress: GameProgress) => void;
  onNextLevel?: () => void;
  isPracticeMode: boolean;
  progress: GameProgress;
  telemetryMode?: 'campaign' | 'practice_ia' | 'practice_free' | 'practice_normal' | 'other';
  suppressModals?: boolean;
  onGameEnd?: (result: { completed: boolean; timeSeconds: number; points: number }) => void;
}) {
  const audio = useGameAudio();
  const { user } = useUser();

  // Obtenir configuració visual
  const { getVisualSettings, settings } = useSettings();
  const screenSettings = getVisualSettings('levelScreen');
  const { keyMoveUp, keyMoveDown, keyMoveLeft, keyMoveRight } = settings.game;

  const [ddaTuning, setDdaTuning] = useState<DdaTuning | null>(null);
  const defaultTuning = useMemo(() => ({
    memorizeTime: level.memorizeTime,
    revealCharges: 3,
    pointsStart: POINTS_START,
    pointsLossPerSecond: POINTS_LOSS_PER_SECOND,
    pointsLossPathHelp: POINTS_LOSS_PATH_HELP,
    pointsLossCrashHelp: POINTS_LOSS_CRASH_HELP,
    pointsCostReveal: POINTS_COST_REVEAL,
    starThresholds: [800, 400, 1],
  }), [level.memorizeTime]);
  const tuning = useMemo(() => {
    const merged = ddaTuning ? { ...defaultTuning, ...ddaTuning } : defaultTuning;
    if (telemetryMode === 'campaign') {
      return { ...merged, starThresholds: defaultTuning.starThresholds };
    }
    return merged;
  }, [ddaTuning, defaultTuning, telemetryMode]);

  const memorizeDuration = tuning.memorizeTime;

  const [phase, setPhase] = useState<Phase>("memorize");
  const [remaining, setRemaining] = useState<number>(memorizeDuration);
  const total = useRef(memorizeDuration);
  const memorizeTimerRef = useRef<number | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: level.start.x, y: level.start.y });

  const [playerPath, setPlayerPath] = useState<Pos[]>([{ x: level.start.x, y: level.start.y }]);

  // Estat per al pas del tutorial
  const [tutorialStep, setTutorialStep] = useState(isTutorialMode ? 0 : -1);

  // Estats per al Joc
  const [gameTime, setGameTime] = useState(0);
  const [points, setPoints] = useState(() => tuning.pointsStart);

  const levelAnalysis = useMemo(() => analyzeLevel(level), [level]);
  const [crashes, setCrashes] = useState(0);
  const [revealUsed, setRevealUsed] = useState(0);
  const [pathHelpSeconds, setPathHelpSeconds] = useState(0);
  const [crashHelpUsed, setCrashHelpUsed] = useState(0);
  const skippedMemorizeRef = useRef(false);
  const attemptStartRef = useRef<Date | null>(null);
  const attemptRecordedRef = useRef(false);
  const failReasonRef = useRef<string | null>(null);
  const progressSavedRef = useRef(false);
  const gameEndNotifiedRef = useRef(false);

  // Comprovar si estem en mode difícil
  const isHardMode = level.difficulty === 'hard';

  const difficultyColors = useMemo<Record<string, string>>(() => ({
    easy: screenSettings.easyColor || '#4ade80',
    normal: screenSettings.normalColor || '#60a5fa',
    hard: screenSettings.hardColor || '#f87171',
  }), [screenSettings]);

  // Estat per a les vides
  // -1 --> les vides no estan actives (no és mode difícil)
  const [lives, setLives] = useState(isHardMode ? LIVES : -1);

  // Sorolls Estrella
  const getStars = (p: number) => {
    const [three, two] = tuning.starThresholds;
    if (p >= three) return 3;
    if (p >= two) return 2;
    if (p > 0) return 1;
    return 0;
  };

  const currentStars = useMemo(() => getStars(points), [points]);
  const prevStarsRef = useRef(getStars(tuning.pointsStart));
  const latestProgressRef = useRef(progress);
  useEffect(() => {
    latestProgressRef.current = progress;
  }, [progress]);

  // Guardar el progrés quan es completa el nivell
  useEffect(() => {
    if (phase === "completed" && !isTutorialMode && !isPracticeMode) {
      if (progressSavedRef.current) return;
      progressSavedRef.current = true;
      const newProgress = saveLevelCompletion(
        level.difficulty as 'easy' | 'normal' | 'hard',
        level.number,
        currentStars,
        gameTime,
        points,
        { baseProgress: latestProgressRef.current, persist: !user }
      );
      onLevelComplete(newProgress);
      if (user) {
        pushProgress(user.id, newProgress).catch((error) => {
          console.error('Error enviant progrés a Supabase:', error);
        });
      }
    }
  }, [phase, isTutorialMode, level.difficulty, level.number, currentStars,
    gameTime, points, onLevelComplete, isPracticeMode, user]);

  useEffect(() => {
    if (currentStars < prevStarsRef.current) {
      audio.playStarLoss();
    }
    prevStarsRef.current = currentStars;
  }, [currentStars, audio.playStarLoss]);

  const [revealCharges, setRevealCharges] = useState(() => tuning.revealCharges);
  const [isPathHelpActive, setIsPathHelpActive] = useState(false);
  const [isCrashHelpActive, setIsCrashHelpActive] = useState(false);

  // Estats per passar al Canvas
  const [showReveal, setShowReveal] = useState(false);
  const [crashedAt, setCrashedAt] = useState<{ x: number, y: number } | null>(null);

  // Barra de progrés (0–100)
  const progressPct = useMemo(() => {
    const done = total.current - remaining;
    return Math.min(100, Math.max(0, (done / total.current) * 100));
  }, [remaining]);

  useEffect(() => {
    if (phase === 'memorize' && !attemptStartRef.current) {
      setRemaining(tuning.memorizeTime);
      total.current = tuning.memorizeTime;
      setRevealCharges(tuning.revealCharges);
      setPoints(tuning.pointsStart);
    }
  }, [phase, tuning.memorizeTime, tuning.revealCharges, tuning.pointsStart]);

  useEffect(() => {
    if (!user || !telemetryMode) {
      setDdaTuning(null);
      return;
    }
    if (telemetryMode !== 'campaign' && telemetryMode !== 'practice_ia') {
      setDdaTuning(null);
      return;
    }

    recommendDdaTuning(user.id, telemetryMode, level, levelAnalysis)
      .then((next) => setDdaTuning(next))
      .catch((error) => {
        console.warn('No s\'ha pogut calcular el tuning DDA:', error);
        setDdaTuning(null);
      });
  }, [user, telemetryMode, level, levelAnalysis]);

  const startPlaying = useCallback(() => {
    audio.playStart();
    setPhase("playing");
    setPlayerPos({ x: level.start.x, y: level.start.y });
    attemptStartRef.current = new Date();
    attemptRecordedRef.current = false;
    failReasonRef.current = null;
  }, [audio, level.start.x, level.start.y]);

  // Compte enrere (Memorize)
  useEffect(() => {
    if (phase !== "memorize" || isTutorialMode) return;
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
        // So de compte enrere
        if (r <= 4) {
          audio.playTickFinal();
        } else {
          audio.playTick();
        }

        return r - 1;
      });
    }, tickMs);
    return () => {
      if (memorizeTimerRef.current) {
        clearInterval(memorizeTimerRef.current);
        memorizeTimerRef.current = null;
      }
    };
  }, [phase, audio, isTutorialMode, startPlaying]);

  // Saltar memorització amb tecla
  useEffect(() => {
    if (phase !== "memorize" || isTutorialMode) return;
    const { game: gameSettings } = settings;
    const skipKey = (gameSettings.keySkipMemorize || "").toLowerCase();
    if (!skipKey) return;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || (target as any).isContentEditable)) return;

      const key = e.key.toLowerCase();
      if (e.key === gameSettings.keySkipMemorize || key === skipKey) {
        e.preventDefault();
        if (memorizeTimerRef.current) {
          clearInterval(memorizeTimerRef.current);
          memorizeTimerRef.current = null;
        }
        setRemaining(0);
        skippedMemorizeRef.current = true;
        startPlaying();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, isTutorialMode, settings, startPlaying]);

  // Refs per les ajudes
  const pathHelpRef = useRef(isPathHelpActive);
  useEffect(() => {
    pathHelpRef.current = isPathHelpActive;
  }, [isPathHelpActive]);

  const crashHelpRef = useRef(isCrashHelpActive);
  useEffect(() => {
    crashHelpRef.current = isCrashHelpActive;
  }, [isCrashHelpActive]);

  // Efecte només per a la música
  useEffect(() => {
    const shouldPlayMusic = phase === 'playing' && !(isTutorialMode && tutorialStep >= 0);

    if (shouldPlayMusic) {
      audio.startMusic();
      return () => audio.stopMusic();
    } else {
      audio.stopMusic();
    }
  }, [phase, isTutorialMode, tutorialStep, audio]);

  // Efecte del temporitzador
  useEffect(() => {
    if (phase !== 'playing' || (isTutorialMode && tutorialStep >= 0)) {
      return;
    }

    const gameTick = setInterval(() => {
      setGameTime(t => t + 1);

      setPoints(p => {
        let pointLoss = tuning.pointsLossPerSecond;
        if (pathHelpRef.current) pointLoss += tuning.pointsLossPathHelp;
        // if (crashHelpRef.current) pointLoss += POINTS_LOSS_CRASH_HELP;
        return Math.max(0, p - pointLoss);
      });

      if (pathHelpRef.current) setPathHelpSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(gameTick);
  }, [phase, isTutorialMode, tutorialStep]);

  useEffect(() => {
    setCrashes(0);
    setRevealUsed(0);
    setPathHelpSeconds(0);
    setCrashHelpUsed(0);
    skippedMemorizeRef.current = false;
    attemptStartRef.current = null;
    attemptRecordedRef.current = false;
    failReasonRef.current = null;
    progressSavedRef.current = false;
    gameEndNotifiedRef.current = false;
  }, [level.id]);

  useEffect(() => {
    if (!onGameEnd) return;
    if (gameEndNotifiedRef.current) return;
    if (phase !== 'completed' && phase !== 'failed') return;
    gameEndNotifiedRef.current = true;
    onGameEnd({
      completed: phase === 'completed',
      timeSeconds: gameTime,
      points: Math.round(points),
    });
  }, [phase, onGameEnd, gameTime, points]);

  // Registrar intent i actualitzar skill quan acaba el nivell
  useEffect(() => {
    if ((phase === 'completed' || phase === 'failed') && !attemptRecordedRef.current && attemptStartRef.current && telemetryMode && user) {
      attemptRecordedRef.current = true;

      const success = phase === 'completed';
      const durationMs = new Date().getTime() - attemptStartRef.current.getTime();
      const revisits = countRevisits(playerPath);
      const failReason = success ? null : (failReasonRef.current ?? 'failed');

      recordAttemptAndUpdateSkill({
        userId: user.id,
        level,
        attempt: {
          memorizeTime: memorizeDuration,
          startedAt: attemptStartRef.current.toISOString(),
          endedAt: new Date().toISOString(),
          completed: success,
          failReason,
          timeSeconds: Math.round(durationMs / 1000),
          pointsFinal: Math.round(points),
          stars: currentStars,
          moves: playerPath.length - 1,
          crashes,
          revisits,
          revealUsed,
          pathHelpSeconds,
          crashHelpUsed,
          skippedMemorize: skippedMemorizeRef.current,
        },
        analysis: levelAnalysis,
        mode: telemetryMode,
        settingsSnapshot: { dda: tuning },
      }).catch((error) => {
        console.error('Error registrant intent:', error);
      });
    }
  }, [
    phase,
    user,
    level,
    crashes,
    revealUsed,
    pathHelpSeconds,
    crashHelpUsed,
    levelAnalysis,
    telemetryMode,
    memorizeDuration,
    points,
    currentStars,
    tuning,
    playerPath,
  ]);


  // Lògica d'Ajudes
  const onRevealHelp = useCallback(() => {
    if (phase !== 'playing' || revealCharges <= 0 || showReveal) return;
    audio.playReveal();
    setRevealCharges(c => c - 1);
    setRevealUsed(c => c + 1);
    setPoints(p => Math.max(0, p - tuning.pointsCostReveal));
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

  const handleRetryNewMaze = useCallback(() => {
    audio.playFail();
    audio.stopMusic();
    originalOnRetry();
  }, [originalOnRetry, audio]);

  const handleBack = useCallback(() => {
    audio.playFail();
    audio.stopMusic();
    onBackOriginal();
  }, [onBackOriginal, audio]);


  const handleRetrySameMaze = useCallback(() => {
    audio.playFail();
    audio.stopMusic();

    // Resetejem tots els estats del joc al seu valor inicial
    setPhase("memorize");
    setRemaining(memorizeDuration);
    total.current = memorizeDuration;
    setPlayerPos({ x: level.start.x, y: level.start.y });
    setPlayerPath([{ x: level.start.x, y: level.start.y }]);
    setGameTime(0);
    setPoints(tuning.pointsStart);
    setLives(isHardMode ? LIVES : -1);
    setRevealCharges(tuning.revealCharges);
    setIsPathHelpActive(false);
    setIsCrashHelpActive(false);
    setCrashedAt(null);
  }, [
    memorizeDuration, level.start.x, level.start.y,
    isHardMode, audio, tuning.pointsStart, tuning.revealCharges
  ]);

  // Gestió de Teclat (Moviment + Ajudes)
  useEffect(() => {
    if (phase !== "playing") return;

    // Obtenir les tecles de la configuració
    const { game: gameSettings } = settings;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || (target as any).isContentEditable)) return;

      if (showReveal) return;
      setCrashedAt(null);

      const key = e.key.toLowerCase();

      // Ajudes
      if (e.key === gameSettings.keyHelpReveal || key === (gameSettings.keyHelpReveal || '').toLowerCase()) {
        e.preventDefault();
        onRevealHelp();
        return;
      }
      if (key === (gameSettings.keyHelpPath || '').toLowerCase()) {
        e.preventDefault();
        onTogglePathHelp();
        return;
      }

      // Ajuda de xoc: només si la tecla està definida i el nivell no és "hard"
      const crashKey = (gameSettings.keyHelpCrash || '').toLowerCase();
      if (crashKey && key === crashKey && level.difficulty !== 'hard') {
        e.preventDefault();
        onToggleCrashHelp();
        return;
      }

      // Moviment
      const { x, y } = playerPos;
      let newX = x, newY = y;
      let didCrash = false;

      if (e.key === 'ArrowUp' || key === (gameSettings.keyMoveUp || '').toLowerCase()) {
        e.preventDefault();
        if (level.maze[y][x].walls.top) { didCrash = true; } else { newY -= 1; }
      } else if (e.key === 'ArrowDown' || key === (gameSettings.keyMoveDown || '').toLowerCase()) {
        e.preventDefault();
        if (level.maze[y][x].walls.bottom) { didCrash = true; } else { newY += 1; }
      } else if (e.key === 'ArrowLeft' || key === (gameSettings.keyMoveLeft || '').toLowerCase()) {
        e.preventDefault();
        if (level.maze[y][x].walls.left) { didCrash = true; } else { newX -= 1; }
      } else if (e.key === 'ArrowRight' || key === (gameSettings.keyMoveRight || '').toLowerCase()) {
        e.preventDefault();
        if (level.maze[y][x].walls.right) { didCrash = true; } else { newX += 1; }
      } else {
        return;
      }

      if (didCrash) {
        setCrashes(c => c + 1);

        // Lògica de Vides
        if (isHardMode) {
          audio.playCrash();

          const newLives = lives - 1;

          if (newLives <= 0) {
            setLives(0);
            audio.stopMusic();
            failReasonRef.current = 'out_of_lives';
            setPhase("failed");
          } else {
            setLives(newLives);
            setPlayerPos({ x: level.start.x, y: level.start.y });
            setPlayerPath([{ x: level.start.x, y: level.start.y }]);
          }

          return;
        }

        if (isCrashHelpActive) {
          // Mostrar l'ajuda de xoc
          setCrashHelpUsed(c => c + 1);
          audio.playCrash();
          setCrashedAt({ x, y });
          const basePenalty = Math.round(tuning.pointsLossCrashHelp * 0.5);
          const extraPenalty = Math.max(0, tuning.pointsLossCrashHelp - basePenalty);
          setPoints(p => Math.max(0, p - basePenalty - extraPenalty));
          setTimeout(() => setCrashedAt(null), REVEAL_DURATION_MS);
        }
        if (!isCrashHelpActive) {
          const basePenalty = Math.round(tuning.pointsLossCrashHelp * 0.5);
          setPoints(p => Math.max(0, p - basePenalty));
        }
        return;
      }

      // Actualitzar la posició del jugador
      if (newX >= 0 && newX < level.width && newY >= 0 && newY < level.height) {
        setPlayerPos({ x: newX, y: newY });
        setPlayerPath(prev => [...prev, { x: newX, y: newY }]);
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
  }, [phase, playerPos, level, isCrashHelpActive, onRevealHelp,
    onTogglePathHelp, onToggleCrashHelp, showReveal, audio, points,
    settings, isHardMode, lives, onRetryWithSound, onBackWithSound]);

  // Funcions per controlar el tutorial
  const handleNextTutorialStep = () => {
    const nextStep = tutorialStep + 1;

    if (nextStep >= tutorialSteps.length) {
      setTutorialStep(-1);
      onCompleteTutorial();
      setRemaining(level.memorizeTime);
    } else {
      setTutorialStep(nextStep);
      if (phase !== 'memorize') setPhase('memorize');
      setRemaining(level.memorizeTime);
    }
  };

  const handleSkipTutorial = () => {
    setTutorialStep(-1);
    onCompleteTutorial();
    setPhase("memorize");
    setRemaining(level.memorizeTime);
    setPlayerPos({ x: level.start.x, y: level.start.y });
    setGameTime(0);
    setPoints(POINTS_START);
  };


  // Objecte de configuració per al MazeCanvas
  const mazeSettings = useMemo(() => ({
    path_color: screenSettings.mazePathColor || '#EEF2FF',
    wall_color: screenSettings.mazeWallColor || '#3B82F6',
    wall_thickness: screenSettings.mazeWallThickness || 3,
    exit_color: screenSettings.mazeExitColor || screenSettings.normalColor || '#F59E0B',
    player_color: screenSettings.mazePlayerColor || '#111',
    player_path_color: screenSettings.playerPathColor || 'rgba(0, 0, 0, 0.4)',
    crash_help_color: screenSettings.crashHelpColor || '#E11D48',
  }), [screenSettings]);

  const styles = useMemo<Record<string, React.CSSProperties>>(() => ({
    page: {
      minHeight: "100svh",
      width: "100%",
      margin: 0,
      background: 'transparent',
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
  }), [screenSettings]);

  const title = useMemo(() => {
    if (isPracticeMode) {
      // level.number === 99 mode lliure
      if (level.number === 99) return "Mode Lliure";
      // Per als modes "IA" i "Normal"
      return "Mode Pràctica";
    }
    // Títol normal per a la campanya
    return `Nivell ${level.number} - ${DIFF_LABEL[level.difficulty]}`;
  }, [isPracticeMode, level.number, level.difficulty]);

  return (
    <div style={styles.page}>
      <NetworkBackground primaryColor={difficultyColors[level.difficulty] || difficultyColors.normal} opacity={0.4} />
      {/* HEADER */}
      <header style={styles.headerRow}>
        <button type="button" onClick={onBackWithSound} onMouseEnter={() => audio.playHover()} style={styles.ghostBtn} aria-label="Tornar a la selecció de nivell">
          <span aria-hidden="true">←</span> Tornar
        </button>
        <h1 style={styles.title}>{title}</h1>
        <button type="button" onClick={onRetryWithSound} onMouseEnter={() => audio.playHover()} style={{ ...styles.ghostBtn, justifySelf: 'end' }} aria-label="Reintentar el nivell">
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
            {!isTutorialMode && (
              <p style={styles.memorizeHint}>
                Prem <kbd>{formatKey(settings.game.keySkipMemorize)}</kbd> per saltar.
              </p>
            )}
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
            lives={lives}
            difficulty={level.difficulty as 'easy' | 'normal' | 'hard'}
            starThresholds={tuning.starThresholds}
            revealCost={tuning.pointsCostReveal}
            pathHelpLoss={tuning.pointsLossPathHelp}
            crashHelpLoss={tuning.pointsLossCrashHelp}
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
        {phase === 'playing' ? (
          <p style={styles.tip}>
            Utilitza les <kbd>Fletxes</kbd> o
            <kbd> {formatKey(keyMoveUp)}</kbd>
            <kbd>{formatKey(keyMoveLeft)}</kbd>
            <kbd>{formatKey(keyMoveDown)}</kbd>
            <kbd>{formatKey(keyMoveRight)} </kbd>
            per moure’t.
          </p>
        ) : phase === 'memorize' ? (
          <p style={styles.tip}>
            Memoritza el camí des de l'inici (cercle) fins al final (quadrat).
          </p>
        ) : null}
      </footer>

      {/* Nivell completat */}
      {!suppressModals && phase === "completed" && !isTutorialMode && (
        <CompletionModal
          levelNumber={level.number}
          stars={currentStars}
          time={gameTime}
          points={points}
          onNextLevel={onNextLevel}
          onRetry={onRetryWithSound}
          onBack={onBackWithSound}
        />
      )}

      {/* Modal de Game Over */}
      {!suppressModals && phase === "failed" && (
        <GameOverModal
          onRetry={onRetryWithSound}
          onBack={onBackWithSound}
        />
      )}

      {/* Modal de Pràctica */}
      {!suppressModals && (phase === "completed" || phase === "failed") && isPracticeMode && telemetryMode !== 'practice_ia' && (
        <PracticeCompletionModal
          status={phase}
          time={gameTime}
          onRetrySameMaze={handleRetrySameMaze}
          onRetryNewMaze={handleRetryNewMaze}
          onBackToSettings={handleBack}
        />
      )}

      {!suppressModals && phase === "completed" && isPracticeMode && telemetryMode === 'practice_ia' && (
        <PracticeIaCompletionModal
          onNextLevel={onNextLevel}
          onBack={handleBack}
        />
      )}

      {/* Renderitzar l'overlay del tutorial */}
      {isTutorialMode && tutorialStep >= 0 && tutorialStep < tutorialSteps.length && (
        <TutorialOverlay
          step={tutorialStep}
          onNext={handleNextTutorialStep}
          onSkip={handleSkipTutorial}
        />
      )}
    </div>
  );
}
