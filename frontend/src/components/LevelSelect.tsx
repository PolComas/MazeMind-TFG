import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import LevelCard from './LevelCard';
import { PALETTE } from './palette';
import { Dumbbell, Zap, Flame, CircleQuestionMarkIcon } from 'lucide-react';
import { getLevelStats, type GameProgress } from '../utils/progress';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import { useUser } from '../context/UserContext';
import HowToPlayModal from './HowToPlayModal';
import PracticeModeModal from './PracticeModeModal';
import PracticeIaLockedModal from './PracticeIaLockedModal';
import NetworkBackground from './NetworkBackground';

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

export default function LevelSelect({
  onPlayLevel: originalOnPlayLevel,
  onBack: originalOnBack,
  onStartTutorial,
  progress,
  selectedDifficulty,
  onDifficultyChange,
  onStartPracticeIA,
  onStartPracticeNormal,
  onStartPracticeFree,
  //onOpenGenerator,
}: {
  onPlayLevel: (levelNumber: number, difficulty: Diff) => void;
  onBack: () => void;
  onStartTutorial: () => void;
  progress: GameProgress;
  selectedDifficulty: Diff;
  onDifficultyChange: (d: Diff) => void;
  onStartPracticeIA: () => void;
  onStartPracticeNormal: () => void;
  onStartPracticeFree: () => void;
  //onOpenGenerator: () => void;
}) {
  const audio = useGameAudio();
  const { user } = useUser();

  // Obtenir configuració visual
  const { getVisualSettings } = useSettings();
  const screenSettings = getVisualSettings('levelSelect');

  // Colors per dificultat
  const difficultyColors = useMemo<Record<Diff, string>>(() => ({
    easy: screenSettings.easyColor,
    normal: screenSettings.normalColor,
    hard: screenSettings.hardColor,
  }), [screenSettings]);

  const difficulty = selectedDifficulty;

  // Estat per al modal "Com Jugar"
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showIaLockedModal, setShowIaLockedModal] = useState(false);

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
  }, [difficulty, difficultyColors]);

  // Lògica de nivells desbloquejats
  const levels = Array.from({ length: 15 }, (_, i) => i + 1);
  const unlockedCount = progress.highestUnlocked[difficulty] || 0;
  const maxLevel = levels.length;
  const recommendedLevelNumber = Math.max(1, Math.min(unlockedCount || 1, maxLevel));

  // Efectes de so per a les interaccions
  const onBackWithSound = useCallback(() => {
    audio.playFail();
    originalOnBack();
  }, [originalOnBack, audio]);

  const onPlayLevelWithSound = useCallback((levelNumber: number, difficulty: Diff) => {
    audio.playFail();
    originalOnPlayLevel(levelNumber, difficulty);
  }, [originalOnPlayLevel, audio]);

  const onPracticeClick = useCallback(() => {
    audio.playFail();
    setShowPracticeModal(true);
  }, [audio]);

  const handleStartPracticeIA = useCallback(() => {
    if (!user) {
      setShowIaLockedModal(true);
      return;
    }
    onStartPracticeIA();
  }, [user, onStartPracticeIA]);

  const styles = useMemo<Record<string, React.CSSProperties>>(() => ({
    page: { // Fons de pantalla completa amb padding responsiu
      // background: screenSettings.backgroundColor, // Removed
      color: screenSettings.textColor,
      minHeight: '100svh',
      width: '100vw',
      padding: 'clamp(16px, 4vw, 32px)',
      boxSizing: 'border-box',
      position: 'relative',
      isolation: 'isolate',
    },
    container: { // Contenidor centrat amb amplada màxima
      maxWidth: 960,
      margin: '0 auto',
    },
    header: { // Capçalera amb flexbox per botó enrere, títol i espai buit
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      gap: 16,
    },
    title: { // Títol de la pàgina amb font responsiva
      margin: 0, fontSize: 'clamp(24px, 5vw, 32px)'
    },
    backBtn: { // Botó per tornar enrere amb estil de superfície
      padding: '10px 14px',
      borderRadius: 12,
      border: `1px solid ${screenSettings.borderColor}`,
      background: screenSettings.surfaceColor,
      color: screenSettings.textColor,
      cursor: 'pointer',
      fontSize: 16,
      width: 100,
    },
    diffBarContainer: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      background: screenSettings.surfaceColor,
      borderRadius: 999,
      padding: '6px',
      marginBottom: 32,
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
    },
    diffTab: { // Estil dels botons de dificultat
      flexGrow: 1,
      padding: '10px 16px',
      borderRadius: 999,
      border: 'none',
      background: 'transparent',
      color: screenSettings.subtextColor,
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
      boxShadow: PALETTE.shadow, // Mantenim l'ombra de PALETTE
      transition: 'left 0.3s ease, width 0.3s ease, background 0.3s ease',
      zIndex: 1,
      opacity: 0,
    },
    primaryCta: {
      padding: '14px 20px',
      borderRadius: 12,
      border: 'none',
      background: `linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
      color: screenSettings.textColor,
      fontSize: 18,
      fontWeight: 800,
      cursor: 'pointer',
      boxShadow: PALETTE.shadow,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    grid: { // Graella responsiva per les targetes de nivell
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 'clamp(12px, 2vw, 20px)',
    },
    footer: { // Peu de pàgina centrat amb botó de pràctica
      display: 'flex',
      justifyContent: 'center',
      marginTop: 32,
    },
    practiceBtn: { // Botó de mode pràctica amb estil de superfície
      padding: '12px 20px',
      borderRadius: 12,
      border: `1px solid ${screenSettings.borderColor}`,
      background: screenSettings.surfaceColor,
      color: screenSettings.textColor,
      fontSize: 16,
      cursor: 'pointer',
    },
  }), [screenSettings]);

  return (
    <>
      <main style={styles.page}>
        <NetworkBackground
          primaryColor={difficultyColors[difficulty]}
          backgroundColor={screenSettings.backgroundColor}
          opacity={0.4}
        />
        <div style={styles.container}>
          <header style={styles.header}>
            <button style={styles.backBtn} onMouseEnter={() => audio.playHover()} onClick={onBackWithSound} aria-label="Tornar a la pantalla d'inici">
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
                onClick={() => { audio.playSlide(); onDifficultyChange(d); }}
                aria-selected={difficulty === d}
                style={{
                  ...styles.diffTab,
                  color: difficulty === d ? screenSettings.textColor : screenSettings.subtextColor,
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
              {levels.map(n => {
                const stats = getLevelStats(progress, difficulty, n);

                return (
                  <LevelCard
                    key={`${difficulty}-${n}`}
                    index={n}
                    unlocked={n <= unlockedCount}
                    difficulty={difficulty}
                    stars={stats?.stars ?? 0}
                    bestTime={stats?.bestTime ?? null}
                    isRecommended={n === recommendedLevelNumber && n <= unlockedCount}
                    onPlay={() => onPlayLevelWithSound(n, difficulty)}
                  />
                );
              })}
            </div>
          </section>

          {/* Peu de pàgina amb botó de mode pràctica */}
          <footer style={styles.footer}>
            <button style={styles.practiceBtn} onMouseEnter={() => audio.playHover()} onClick={onPracticeClick}>
              <Dumbbell size={18} style={{ marginBottom: -1 }} /> Mode Pràctica
            </button>

            <div style={{ width: 12 }} />

            {/* Botó "Com Jugar" */}
            <button style={styles.practiceBtn} onMouseEnter={() => audio.playHover()} onClick={() => { audio.playBtnSound(); setShowHowToPlay(true); }}>
              <CircleQuestionMarkIcon size={18} style={{ marginBottom: -2 }} /> Com Jugar
            </button>

            <div style={{ width: 12 }} />
          </footer>
        </div>
      </main>

      {/* Renderitzar el modal */}
      <HowToPlayModal
        open={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        onStartTutorial={onStartTutorial}
      />

      {/* Renderitzar el modal de Pràctica */}
      <PracticeModeModal
        open={showPracticeModal}
        onClose={() => setShowPracticeModal(false)}
        onStartIA={handleStartPracticeIA}
        onStartNormal={onStartPracticeNormal}
        onStartFree={onStartPracticeFree}
      />
      <PracticeIaLockedModal
        open={showIaLockedModal}
        visuals={screenSettings}
        onClose={() => setShowIaLockedModal(false)}
      />
    </>
  );
}
