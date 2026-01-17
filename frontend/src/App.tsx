import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import HomeScreen from './components/HomeScreen';
import LevelSelect from './components/LevelSelect';
import LevelScreen from './pages/LevelScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';
import { generateLevel, type Level } from './maze/maze_generator';
import AuthModal from './components/AuthModal'; 
import SettingsScreen from './pages/SettingsScreen';
import { loadProgress, type GameProgress } from './utils/progress';
import type { Diff } from './maze/maze_generator';
import FreeModeScreen, { type CustomLevelConfig } from './pages/FreeModeScreen';
import PracticeNormalScreen from './pages/PracticeNormalScreen';
//import MazeGeneratorScreen from './pages/MazeGeneratorScreen';
import { useUser } from './context/UserContext';
import { useSettings } from './context/SettingsContext';
import { getCloudSnapshot } from './lib/sync';

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
import tutorial from './levels/easy-level-0.json';
import easyLevel1 from './levels/easy-level-1.json';
import easyLevel2 from './levels/easy-level-2.json';
import easyLevel3 from './levels/easy-level-3.json';
import easyLevel4 from './levels/easy-level-4.json';
import easyLevel5 from './levels/easy-level-5.json';
import easyLevel6 from './levels/easy-level-6.json';
import easyLevel7 from './levels/easy-level-7.json';
import easyLevel8 from './levels/easy-level-8.json';
import easyLevel9 from './levels/easy-level-9.json';
import easyLevel10 from './levels/easy-level-10.json';
import easyLevel11 from './levels/easy-level-11.json';
import easyLevel12 from './levels/easy-level-12.json';
import easyLevel13 from './levels/easy-level-13.json';
import easyLevel14 from './levels/easy-level-14.json';
import easyLevel15 from './levels/easy-level-15.json';

import normalLevel1 from './levels/normal-level-1.json';
import normalLevel2 from './levels/normal-level-2.json';
import normalLevel3 from './levels/normal-level-3.json';
import normalLevel4 from './levels/normal-level-4.json';
import normalLevel5 from './levels/normal-level-5.json';
import normalLevel6 from './levels/normal-level-6.json';
import normalLevel7 from './levels/normal-level-7.json';
import normalLevel8 from './levels/normal-level-8.json';
import normalLevel9 from './levels/normal-level-9.json';
import normalLevel10 from './levels/normal-level-10.json';
import normalLevel11 from './levels/normal-level-11.json';
import normalLevel12 from './levels/normal-level-12.json';
import normalLevel13 from './levels/normal-level-13.json';
import normalLevel14 from './levels/normal-level-14.json';
import normalLevel15 from './levels/normal-level-15.json';

import hardLevel1 from './levels/hard-level-1.json';
import hardLevel2 from './levels/hard-level-2.json';
import hardLevel3 from './levels/hard-level-3.json';
import hardLevel4 from './levels/hard-level-4.json';
import hardLevel5 from './levels/hard-level-5.json';
import hardLevel6 from './levels/hard-level-6.json';
import hardLevel7 from './levels/hard-level-7.json';
import hardLevel8 from './levels/hard-level-8.json';
import hardLevel9 from './levels/hard-level-9.json';
import hardLevel10 from './levels/hard-level-10.json';
import hardLevel11 from './levels/hard-level-11.json';
import hardLevel12 from './levels/hard-level-12.json';
import hardLevel13 from './levels/hard-level-13.json';
import hardLevel14 from './levels/hard-level-14.json';
import hardLevel15 from './levels/hard-level-15.json';

const savedLevels: Record<string, Level> = {
  'easy-0': tutorial as Level,
  'easy-1': easyLevel1 as Level,
  'easy-2': easyLevel2 as Level,
  'easy-3': easyLevel3 as Level,
  'easy-4': easyLevel4 as Level,
  'easy-5': easyLevel5 as Level,
  'easy-6': easyLevel6 as Level,
  'easy-7': easyLevel7 as Level,
  'easy-8': easyLevel8 as Level,
  'easy-9': easyLevel9 as Level,
  'easy-10': easyLevel10 as Level,
  'easy-11': easyLevel11 as Level,
  'easy-12': easyLevel12 as Level,
  'easy-13': easyLevel13 as Level,
  'easy-14': easyLevel14 as Level,
  'easy-15': easyLevel15 as Level,
  'normal-1': normalLevel1 as Level,
  'normal-2': normalLevel2 as Level,
  'normal-3': normalLevel3 as Level,
  'normal-4': normalLevel4 as Level,
  'normal-5': normalLevel5 as Level,
  'normal-6': normalLevel6 as Level,
  'normal-7': normalLevel7 as Level,
  'normal-8': normalLevel8 as Level,
  'normal-9': normalLevel9 as Level,
  'normal-10': normalLevel10 as Level,
  'normal-11': normalLevel11 as Level,
  'normal-12': normalLevel12 as Level,
  'normal-13': normalLevel13 as Level,
  'normal-14': normalLevel14 as Level,
  'normal-15': normalLevel15 as Level,
  'hard-1': hardLevel1 as Level,
  'hard-2': hardLevel2 as Level,
  'hard-3': hardLevel3 as Level,
  'hard-4': hardLevel4 as Level,
  'hard-5': hardLevel5 as Level,
  'hard-6': hardLevel6 as Level,
  'hard-7': hardLevel7 as Level,
  'hard-8': hardLevel8 as Level,
  'hard-9': hardLevel9 as Level,
  'hard-10': hardLevel10 as Level,
  'hard-11': hardLevel11 as Level,
  'hard-12': hardLevel12 as Level,
  'hard-13': hardLevel13 as Level,
  'hard-14': hardLevel14 as Level,
  'hard-15': hardLevel15 as Level,
};

const base = import.meta.env.BASE_URL || '/';
const normalizedBase = normalizeBasePath(base);

type Route =
  | { type: 'settings' }
  | { type: 'practice-free' }
  | { type: 'practice-normal' }
  | { type: 'practice-ia' }
  | { type: 'maze-lab' }
  | { type: 'levels' }
  | { type: 'level'; difficulty: Diff; number: number }
  | { type: 'custom'; width: number; height: number; time: number; difficulty: Exclude<Diff, 'easy'> }
  | { type: 'home' }
  | { type: 'unknown'; path: string }
  | { type: 'auth-reset' };

 

 


export default function App() {
  const { user, logout } = useUser();
  const { settings } = useSettings();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Estat per al mode tutorial
  const [isTutorialMode, setIsTutorialMode] = useState(false);

  // L'estat del progrés
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());
  const previousUserIdRef = useRef<string | null>(null);

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
    go('/level/easy/0', { preserveTutorial: true });
  };

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (previousUserIdRef.current === currentUserId) {
      return;
    }
    previousUserIdRef.current = currentUserId;

    if (!currentUserId) {
      setProgress(loadProgress());
      return;
    }

    const hydrate = async () => {
      try {
        const cloudSnapshot = await getCloudSnapshot(currentUserId);
        setProgress(cloudSnapshot.progress);
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('mazeMindPracticeBestScore', JSON.stringify(cloudSnapshot.practiceBest ?? 0));
          } catch (storageError) {
            console.warn('No s\'ha pogut guardar el best score del núvol', storageError);
          }
        }
      } catch (error) {
        console.error('Error obtenint el progrés del núvol:', error);
      }
    };

    void hydrate();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error en tancar sessió:', error);
    } finally {
      if (typeof window !== 'undefined') {
        const keysToClear = [
          'mazeMindProgress',
          'mazeMindPracticeBestScore',
          'mazeMindPracticeStats',
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
      setShowAuthModal(false);
    }
  };

  const handleLogoutRequest = () => {
    void handleLogout();
  };


  const route = useMemo<Route>(() => {
    const [pathOnlyRaw, search = ''] = relativePath.split('?');
    const pathOnly = pathOnlyRaw || '/';

    if (pathOnly === '/settings') {
      return { type: 'settings' };
    }

    if (pathOnly === '/practice/free') {
      return { type: 'practice-free' };
    }

    if (pathOnly === '/practice/normal') {
      return { type: 'practice-normal' };
    }

    if (pathOnly === '/practice/ia') {
      return { type: 'practice-ia' };
    }

    if (pathOnly === '/dev/maze-lab') {
      return { type: 'maze-lab' };
    }

    if (pathOnly === '/levels') {
      return { type: 'levels' };
    }

    if (pathOnly === '/auth/reset') {
      return { type: 'auth-reset' };
    }

    if (pathOnly.startsWith('/level/custom')) {
      const params = new URLSearchParams(search);

      const width = parsePositiveIntParam(params.get('w'), 7);
      const height = parsePositiveIntParam(params.get('h'), 7);
      const time = parsePositiveIntParam(params.get('t'), 10);
      const rawDifficulty = params.get('d');
      const difficulty = rawDifficulty === 'hard' ? 'hard' : 'normal';

      return { type: 'custom', width, height, time, difficulty };
    }

    const levelMatch = pathOnly.match(/^\/level\/(easy|normal|hard)\/(\d+)$/);
    if (levelMatch) {
      const [, difficulty, number] = levelMatch;
      return { type: 'level', difficulty: difficulty as Diff, number: Number(number) };
    }

    if (pathOnly === '/' || pathOnly === '') {
      return { type: 'home' };
    }

    return { type: 'unknown', path: relativePath };
  }, [relativePath]);


  useEffect(() => {
    const isGameplayRoute =
      route.type === 'level' ||
      route.type === 'practice-normal' ||
      route.type === 'practice-ia' ||
      route.type === 'custom';

    const handleKey = (e: KeyboardEvent) => {
      if (isGameplayRoute) return;
      if (showAuthModal) return;
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
          (target as any).isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const openLevels = (settings.game.keyOpenLevels || '').toLowerCase();
      const openSettings = (settings.game.keyOpenSettings || '').toLowerCase();
      const openHome = (settings.game.keyOpenHome || '').toLowerCase();

      if (openLevels && (e.key === settings.game.keyOpenLevels || key === openLevels)) {
        e.preventDefault();
        go('/levels');
        return;
      }
      if (openSettings && (e.key === settings.game.keyOpenSettings || key === openSettings)) {
        e.preventDefault();
        go('/settings');
        return;
      }
      if (openHome && (e.key === settings.game.keyOpenHome || key === openHome)) {
        e.preventDefault();
        go('/');
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    settings.game.keyOpenLevels,
    settings.game.keyOpenSettings,
    settings.game.keyOpenHome,
    go,
    showAuthModal,
    route.type,
  ]);

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

    case 'auth-reset':
      screen = <ResetPasswordScreen onDone={() => go('/')} />;
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
//          onOpenGenerator={() => go('/dev/maze-lab')}
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
          key={`${difficulty}-${number}-${navKey}`}
          level={level}
          onBack={() => go('/levels')}
          onRetry={() => go(`/level/${difficulty}/${number}`)}
          onNextLevel={number < 15 ? () => go(`/level/${difficulty}/${number + 1}`) : undefined}
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

    // case 'maze-lab':
    //   screen = <MazeGeneratorScreen onBack={() => go('/levels')} />;
    //   break;

    case 'unknown':
    default:
      screen = renderHome();
      break;
  }

  return (
    <>
      {screen}
    </>
  );
}
