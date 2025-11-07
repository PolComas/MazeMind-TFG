import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import HomeScreen from './components/HomeScreen';
import LevelSelect from './components/LevelSelect';
import LevelScreen from './pages/LevelScreen';
import { generateLevel, type Level } from './maze/maze_generator';
import AuthModal from './components/AuthModal'; 
import SettingsScreen from './pages/SettingsScreen';
import { loadProgress, type GameProgress } from './utils/progress';
import type { Diff } from './maze/maze_generator';
import FreeModeScreen, { type CustomLevelConfig } from './pages/FreeModeScreen';
import PracticeNormalScreen from './pages/PracticeNormalScreen';
import { useUser } from './context/UserContext';
import MergeProgressModal from './components/MergeProgressModal';
import { applyCloudOnly, applyLocalOnly, applySmartMerge, getCloudSnapshot, type CloudSnapshot } from './lib/sync';
import { supabase } from './lib/supabase';
import { loadPracticeBestScore } from './utils/practiceProgress';

const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

const normalizeBasePath = (value: string) => {
  if (!value || value === '/') {
    return '';
  }
  const trimmed = value.endsWith('/') ? value.slice(0, -1) : value;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const parsePositiveIntParam = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeRelativePath = (value: string) => {
  if (!value) {
    return '/';
  }
  const [pathname, search] = value.split('?');
  const trimmedPath = pathname ? pathname.replace(/\/+/g, '/') : '/';
  const cleanedPath = trimmedPath.endsWith('/') && trimmedPath !== '/' ? trimmedPath.slice(0, -1) : trimmedPath;
  const withLeadingSlash = ensureLeadingSlash(cleanedPath);
  return search ? `${withLeadingSlash}?${search}` : withLeadingSlash;
};

const getBrowserPath = () => {
  if (typeof window === 'undefined') {
    return '/';
  }
  const { pathname, search } = window.location;
  const pathWithSearch = `${pathname}${search}`;
  return pathWithSearch || '/';
};

// Nivells desats
import easyLevel1 from './levels/easy-level-1.json';

const savedLevels: Record<string, Level> = {
  'easy-1': easyLevel1 as Level,
};

const base = import.meta.env.BASE_URL || '/';
const normalizedBase = normalizeBasePath(base);

type Route =
  | { type: 'settings' }
  | { type: 'practice-free' }
  | { type: 'practice-normal' }
  | { type: 'practice-ia' }
  | { type: 'levels' }
  | { type: 'level'; difficulty: Diff; number: number }
  | { type: 'custom'; width: number; height: number; time: number; difficulty: Exclude<Diff, 'easy'> }
  | { type: 'home' }
  | { type: 'unknown'; path: string };

const CAMPAIGN_MIN_LEVEL = 1;
const CAMPAIGN_MAX_LEVEL = 15;
const isCampaignLevelKey = (key: string) => {
  const [difficulty, rawLevel] = key.split('-');
  if (!difficulty || !rawLevel) return false;
  const parsed = Number(rawLevel);
  return Number.isFinite(parsed) && parsed >= CAMPAIGN_MIN_LEVEL && parsed <= CAMPAIGN_MAX_LEVEL;
};

const filterCampaignProgress = (progress: GameProgress): GameProgress => ({
  levels: Object.fromEntries(
    Object.entries(progress.levels).filter(([key]) => isCampaignLevelKey(key))
  ),
  highestUnlocked: { ...progress.highestUnlocked },
});

const hasMeaningfulLocalProgress = (progress: GameProgress, practiceBest: number) => {
  if (practiceBest > 0) {
    return true;
  }
  if (
    progress.highestUnlocked.easy > 1 ||
    progress.highestUnlocked.normal > 1 ||
    progress.highestUnlocked.hard > 1
  ) {
    return true;
  }
  return Object.keys(progress.levels).some((key) => isCampaignLevelKey(key));
};

const progressDiffers = (local: GameProgress, cloud: GameProgress) => {
  const levelIds = new Set([...Object.keys(local.levels), ...Object.keys(cloud.levels)]);
  for (const levelId of levelIds) {
    if (!isCampaignLevelKey(levelId)) continue;
    const localLevel = local.levels[levelId];
    const cloudLevel = cloud.levels[levelId];

    if ((localLevel?.stars ?? 0) !== (cloudLevel?.stars ?? 0)) {
      return true;
    }
    if ((localLevel?.bestTime ?? null) !== (cloudLevel?.bestTime ?? null)) {
      return true;
    }
    if ((localLevel?.bestPoints ?? null) !== (cloudLevel?.bestPoints ?? null)) {
      return true;
    }
  }

  return (
    local.highestUnlocked.easy !== cloud.highestUnlocked.easy ||
    local.highestUnlocked.normal !== cloud.highestUnlocked.normal ||
    local.highestUnlocked.hard !== cloud.highestUnlocked.hard
  );
};

const shouldPromptMerge = (
  localProgress: GameProgress,
  localPracticeBest: number,
  cloudSnapshot: CloudSnapshot
) => {
  if (!hasMeaningfulLocalProgress(localProgress, localPracticeBest)) {
    return false;
  }

  if (progressDiffers(localProgress, cloudSnapshot.progress)) {
    return true;
  }

  return localPracticeBest > (cloudSnapshot.practiceBest ?? 0);
};

const LOCAL_PROGRESS_PENDING_KEY = 'mazeMindLocalProgressPending';

const hasPendingGuestProgress = () => {
  if (typeof window === 'undefined') {
    return true;
  }
  const flag = window.localStorage.getItem(LOCAL_PROGRESS_PENDING_KEY);
  return flag === null || flag === '1';
};

const markGuestProgressAsHandled = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(LOCAL_PROGRESS_PENDING_KEY, '0');
};

type MergeContext = {
  userId: string;
  cloud: CloudSnapshot;
  localProgress: GameProgress;
  localPracticeBest: number;
};

export default function App() {
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Estat per al mode tutorial
  const [isTutorialMode, setIsTutorialMode] = useState(false);

  // L'estat del progrés
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());
  const previousUserIdRef = useRef<string | null>(null);
  const [mergeContext, setMergeContext] = useState<MergeContext | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [isMergeBusy, setIsMergeBusy] = useState(false);

  // --- Lògica de Navegació ---
  const [path, setPath] = useState<string>(() => getBrowserPath());
  const [navKey, setNavKey] = useState(0);

  // Estat per a la dificultat seleccionada
  const [selectedDifficulty, setSelectedDifficulty] = useState<Diff>('easy');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const onPop = () => {
      setNavKey(0);
      setPath(getBrowserPath());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const toAbsolutePath = useCallback((relative: string) => {
    const relativeWithSlash = ensureLeadingSlash(relative);
    return normalizedBase ? `${normalizedBase}${relativeWithSlash}` : relativeWithSlash;
  }, []);

  const toRelativePath = useCallback((absolute: string) => {
    if (!absolute) {
      return '/';
    }
    if (!normalizedBase) {
      return normalizeRelativePath(absolute);
    }
    if (absolute.startsWith(normalizedBase)) {
      const remainder = absolute.slice(normalizedBase.length) || '/';
      return normalizeRelativePath(remainder);
    }
    return normalizeRelativePath(absolute);
  }, []);

  const relativePath = useMemo(() => toRelativePath(path), [path, toRelativePath]);

  const go = useCallback((relative: string, options?: { preserveTutorial?: boolean }) => {
    if (!options?.preserveTutorial) {
      setIsTutorialMode(false);
    }

    const targetPath = toAbsolutePath(relative);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetPath);
    }

    setPath((currentPath) => {
      if (currentPath === targetPath) {
        setNavKey((k) => k + 1);
        return currentPath;
      }
      setNavKey(0);
      return targetPath;
    });
  }, [toAbsolutePath]);

  // Funció per iniciar el tutorial
  const startTutorial = () => {
    setIsTutorialMode(true);
    go('/level/easy/1', { preserveTutorial: true });
  };

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (previousUserIdRef.current === currentUserId) {
      return;
    }
    previousUserIdRef.current = currentUserId;

    if (!currentUserId) {
      setMergeContext(null);
      setMergeError(null);
      setProgress(loadProgress());
      return;
    }

    const localProgress = loadProgress();
    const localPracticeBest = loadPracticeBestScore();
    const pendingGuestProgress = hasPendingGuestProgress();
    setMergeError(null);

    const hydrate = async () => {
      try {
        const cloudSnapshot = await getCloudSnapshot(currentUserId);
        if (!pendingGuestProgress) {
          markGuestProgressAsHandled();
          setProgress(cloudSnapshot.progress);
          return;
        }

        if (shouldPromptMerge(localProgress, localPracticeBest, cloudSnapshot)) {
          setMergeContext({
            userId: currentUserId,
            cloud: cloudSnapshot,
            localProgress,
            localPracticeBest,
          });
        } else {
          markGuestProgressAsHandled();
          setProgress(cloudSnapshot.progress);
        }
      } catch (error) {
        console.error('Error obtenint el progrés del núvol:', error);
      }
    };

    void hydrate();
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error en tancar sessió:', error);
    } finally {
      if (typeof window !== 'undefined') {
        const keysToClear = [
          'mazeMindProgress',
          'mazeMindPracticeBestScore',
          'mazeMindPracticeStats',
          LOCAL_PROGRESS_PENDING_KEY,
        ];
        keysToClear.forEach((key) => {
          try {
            window.localStorage.removeItem(key);
          } catch (storageError) {
            console.warn(`No s'ha pogut eliminar la clau ${key} de localStorage`, storageError);
          }
        });
      }
      setProgress(loadProgress());
      setMergeContext(null);
      setMergeError(null);
      setIsMergeBusy(false);
      setShowAuthModal(false);
    }
  };

  const handleLogoutRequest = () => {
    void handleLogout();
  };

  const handleChooseCloudOnly = async () => {
    const context = mergeContext;
    if (!context || isMergeBusy) {
      return;
    }
    setIsMergeBusy(true);
    setMergeError(null);
    try {
      const snapshot = await applyCloudOnly(context.userId);
      setProgress(snapshot.progress);
      markGuestProgressAsHandled();
      setMergeContext(null);
    } catch (error) {
      console.error('Error aplicant només el progrés del núvol:', error);
      setMergeError('No s\'ha pogut carregar el progrés del núvol. Torna-ho a intentar.');
    } finally {
      setIsMergeBusy(false);
    }
  };

  const handleChooseLocalOnly = async () => {
    const context = mergeContext;
    if (!context || isMergeBusy) {
      return;
    }
    setIsMergeBusy(true);
    setMergeError(null);
    try {
      await applyLocalOnly(context.userId);
      setProgress(filterCampaignProgress(context.localProgress));
      markGuestProgressAsHandled();
      setMergeContext(null);
    } catch (error) {
      console.error('Error pujant el progrés local:', error);
      setMergeError('No s\'ha pogut pujar el progrés local. Revisa la connexió i torna-ho a provar.');
    } finally {
      setIsMergeBusy(false);
    }
  };

  const handleChooseSmartMerge = async () => {
    const context = mergeContext;
    if (!context || isMergeBusy) {
      return;
    }
    setIsMergeBusy(true);
    setMergeError(null);
    try {
      await applySmartMerge(context.userId);
      const snapshot = await getCloudSnapshot(context.userId);
      setProgress(snapshot.progress);
      markGuestProgressAsHandled();
      setMergeContext(null);
    } catch (error) {
      console.error('Error aplicant la fusió intel·ligent:', error);
      setMergeError('No s\'ha pogut completar la fusió. Torna-ho a intentar.');
    } finally {
      setIsMergeBusy(false);
    }
  };

  const handleMergeCancel = () => {
    if (isMergeBusy) {
      return;
    }
    setMergeContext(null);
    void handleLogout();
  };

  const route = useMemo<Route>(() => {
    if (relativePath === '/settings') {
      return { type: 'settings' };
    }

    if (relativePath === '/practice/free') {
      return { type: 'practice-free' };
    }

    if (relativePath === '/practice/normal') {
      return { type: 'practice-normal' };
    }

    if (relativePath === '/practice/ia') {
      return { type: 'practice-ia' };
    }

    if (relativePath === '/levels') {
      return { type: 'levels' };
    }

    if (relativePath.startsWith('/level/custom')) {
      const [, search = ''] = relativePath.split('?');
      const params = new URLSearchParams(search);

      const width = parsePositiveIntParam(params.get('w'), 7);
      const height = parsePositiveIntParam(params.get('h'), 7);
      const time = parsePositiveIntParam(params.get('t'), 10);
      const rawDifficulty = params.get('d');
      const difficulty = rawDifficulty === 'hard' ? 'hard' : 'normal';

      return { type: 'custom', width, height, time, difficulty };
    }

    const levelMatch = relativePath.match(/^\/level\/(easy|normal|hard)\/(\d+)$/);
    if (levelMatch) {
      const [, difficulty, number] = levelMatch;
      return { type: 'level', difficulty: difficulty as Diff, number: Number(number) };
    }

    if (relativePath === '/' || relativePath === '') {
      return { type: 'home' };
    }

    return { type: 'unknown', path: relativePath };
  }, [relativePath]);

  useEffect(() => {
    if (route.type === 'unknown') {
      console.warn(`Ruta desconeguda: ${route.path}. Redirigint a HomeScreen.`);
    }
  }, [route]);

  const handleStartCustomGame = useCallback((config: CustomLevelConfig) => {
    const params = new URLSearchParams();
    params.set('w', String(config.width));
    params.set('h', String(config.height));
    params.set('t', String(config.time));
    params.set('d', config.difficulty);

    go(`/level/custom?${params.toString()}`);
  }, [go]);

  const renderHome = () => (
    <>
      <HomeScreen
        progress={progress}
        user={user}
        onNavigate={() => go('/levels')}
        onUserClick={() => setShowAuthModal(true)}
        onLogout={handleLogoutRequest}
        onSettingsClick={() => go('/settings')}
      />
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );

  let screen: ReactElement;

  switch (route.type) {
    case 'settings':
      screen = <SettingsScreen onBack={() => go('/')} />;
      break;

    case 'practice-free':
      screen = (
        <FreeModeScreen
          onBack={() => go('/levels')}
          onStartGame={handleStartCustomGame}
        />
      );
      break;

    case 'custom': {
      const level = generateLevel({
        levelNumber: 99,
        difficulty: route.difficulty,
        width: route.width,
        height: route.height,
        memorizeTime: route.time,
        stars: [60, 45, 30],
      });

      const retryParams = new URLSearchParams({
        w: String(route.width),
        h: String(route.height),
        t: String(route.time),
        d: route.difficulty,
      });

      screen = (
        <LevelScreen
          key={navKey}
          level={level}
          onBack={() => go('/practice/free')}
          onRetry={() => go(`/level/custom?${retryParams.toString()}`)}
          isTutorialMode={false}
          onCompleteTutorial={() => {}}
          onLevelComplete={(newProgress) => setProgress(newProgress)}
          isPracticeMode={true}
          progress={progress}
        />
      );
      break;
    }

    case 'practice-normal':
      screen = (
        <PracticeNormalScreen
          key={navKey}
          onBack={() => go('/levels')}
        />
      );
      break;

    case 'practice-ia': {
      const level = generateLevel({
        levelNumber: 1,
        difficulty: 'easy',
        width: 7,
        height: 7,
        memorizeTime: 12,
        stars: [60, 45, 30],
      });
      screen = (
        <LevelScreen
          key={navKey}
          level={level}
          onBack={() => go('/levels')}
          onRetry={() => go('/practice/ia')}
          isTutorialMode={false}
          onCompleteTutorial={() => {}}
          onLevelComplete={(newProgress) => setProgress(newProgress)}
          isPracticeMode={true}
          progress={progress}
        />
      );
      break;
    }

    case 'levels':
      screen = (
        <LevelSelect
          progress={progress}
          onPlayLevel={(n, diff) => go(`/level/${diff}/${n}`)}
          onBack={() => go('/')}
          onStartTutorial={startTutorial}
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={setSelectedDifficulty}
          onStartPracticeIA={() => go('/practice/ia')}
          onStartPracticeNormal={() => go('/practice/normal')}
          onStartPracticeFree={() => go('/practice/free')}
        />
      );
      break;

    case 'level': {
      const { difficulty, number } = route;
      const levelKey = `${difficulty}-${number}`;

      const level = savedLevels[levelKey] ?? generateLevel({
        levelNumber: number,
        difficulty,
        width: 7,
        height: 7,
        memorizeTime: 10,
        stars: [60, 45, 30],
      });

      screen = (
        <LevelScreen
          key={navKey}
          level={level}
          onBack={() => go('/levels')}
          onRetry={() => go(`/level/${difficulty}/${number}`)}
          isTutorialMode={isTutorialMode}
          onCompleteTutorial={() => setIsTutorialMode(false)}
          onLevelComplete={(newProgress) => setProgress(newProgress)}
          isPracticeMode={false}
          progress={progress}
        />
      );
      break;
    }

    case 'home':
      screen = renderHome();
      break;

    case 'unknown':
    default:
      screen = renderHome();
      break;
  }

  return (
    <>
      {screen}
      {mergeContext && (
        <MergeProgressModal
          cloudProgress={mergeContext.cloud.progress}
          localProgress={mergeContext.localProgress}
          cloudPracticeBest={mergeContext.cloud.practiceBest}
          localPracticeBest={mergeContext.localPracticeBest}
          onChooseCloudOnly={handleChooseCloudOnly}
          onChooseLocalOnly={handleChooseLocalOnly}
          onChooseSmartMerge={handleChooseSmartMerge}
          onCancel={handleMergeCancel}
        />
      )}
      {mergeError && mergeContext && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(220,38,38,0.9)',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: '999px',
            zIndex: 120,
            fontWeight: 600,
          }}
        >
          {mergeError}
        </div>
      )}
    </>
  );
}
