import { useCallback, useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { generateLevel, type Level } from '../maze/maze_generator';
import LevelScreen from './LevelScreen';
import { recommendPracticeIaParams } from '../lib/dda';
import type { GameProgress } from '../utils/progress';
import NetworkBackground from '../components/NetworkBackground';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

export default function PracticeIAScreen({
  onBack,
  progress,
}: {
  onBack: () => void;
  progress: GameProgress;
}) {
  const { user } = useUser();
  const { getVisualSettings } = useSettings();
  const { t } = useLanguage();
  const screenSettings = getVisualSettings('levelSelect');
  const [level, setLevel] = useState<Level | null>(null);
  const [run, setRun] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setRetryCount(0);
  }, [run]);

  useEffect(() => {
    setError(null);
    setLevel(null);
    if (!user) {
      return;
    }
    let cancelled = false;
    let resolved = false;
    const markResolved = () => { resolved = true; };

    const retryTimer = retryCount === 0
      ? window.setTimeout(() => {
        if (resolved || cancelled) return;
        setError(t('practiceIa.error.retry'));
        setRetryCount((c) => c + 1);
      }, 10_000)
      : null;

    const fallbackTimer = retryCount > 0
      ? window.setTimeout(() => {
        if (resolved || cancelled) return;
        const seed = `${Date.now().toString(36)}-${run}-fallback`;
        const fallback = generateLevel({
          levelNumber: run + 1,
          difficulty: 'normal',
          width: 7,
          height: 7,
          memorizeTime: 12,
          stars: [60, 45, 30],
          seed,
        });
        fallback.id = `practice-ia-${seed}`;
        setLevel(fallback);
        setError(t('practiceIa.error.fallback'));
        markResolved();
      }, 5_000)
      : null;

    (async () => {
      let params: Awaited<ReturnType<typeof recommendPracticeIaParams>> | null = null;
      try {
        params = await recommendPracticeIaParams(user.id);
      } catch (err) {
        console.warn('No s\'ha pogut obtenir paràmetres IA, usant defaults', err);
        setError(t('practiceIa.error.defaults'));
      }

      const seed = params?.seed ?? `${Date.now().toString(36)}-${run}`;
      const next = generateLevel({
        levelNumber: run + 1,
        difficulty: params?.difficulty ?? 'normal',
        width: params?.width ?? 7,
        height: params?.height ?? 7,
        memorizeTime: params?.memorizeTime ?? 12,
        stars: [60, 45, 30],
        seed,
      });
      next.id = `practice-ia-${seed}`;
      setLevel(next);
      markResolved();
      if (retryTimer) window.clearTimeout(retryTimer);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    })().catch((err) => {
      console.error('Error generant nivell IA:', err);
      setError(t('practiceIa.error.generate'));
      setLevel(null);
    });
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, [user, run, retryCount]);

  const handleNext = useCallback(() => {
    setRun((r) => r + 1);
  }, []);

  if (!user) {
    return (
      <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', isolation: 'isolate' }}>
        <NetworkBackground
          primaryColor={screenSettings.normalColor || '#60a5fa'}
          backgroundColor={screenSettings.backgroundColor}
          opacity={0.4}
        />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p>{t('practiceIa.authRequired')}</p>
          <button onClick={onBack}>{t('common.back')}</button>
        </div>
      </div>
    );
  }

  if (!level) {
    return (
      <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', isolation: 'isolate' }}>
        <NetworkBackground
          primaryColor={screenSettings.normalColor || '#60a5fa'}
          backgroundColor={screenSettings.backgroundColor}
          opacity={0.4}
        />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p>{t('practiceIa.loading')}</p>
          {error && <p style={{ opacity: 0.8 }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <LevelScreen
      key={`${level.id}-${run}`}
      level={level}
      onBack={onBack}
      onRetry={() => setRun((r) => r + 1)}
      onNextLevel={handleNext}
      isTutorialMode={false}
      onCompleteTutorial={() => { }}
      onLevelComplete={() => { }}
      isPracticeMode={true}
      telemetryMode="practice_ia"
      progress={progress}
    />
  );
}
