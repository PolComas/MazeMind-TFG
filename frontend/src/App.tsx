import { useCallback, useEffect, useMemo, useState } from 'react';
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

type User = {
  id: string;
  email: string;
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Estat per al mode tutorial
  const [isTutorialMode, setIsTutorialMode] = useState(false);

  // L'estat del progrés
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());

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
    const savedUser = localStorage.getItem('mazeMindUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        console.log("Sessió recuperada:", JSON.parse(savedUser));
      } catch (e) {
        console.error("Error al parsejar l'usuari guardat:", e);
        localStorage.removeItem('mazeMindUser'); 
      }
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('mazeMindUser', JSON.stringify(userData)); 
    setShowAuthModal(false); 
    console.log("Usuari connectat:", userData);
  };

  const handleRegister = (userData: User) => {
    // De moment, fem el mateix que al login
    setUser(userData);
    localStorage.setItem('mazeMindUser', JSON.stringify(userData));
    setShowAuthModal(false);
    console.log("Usuari registrat i connectat:", userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mazeMindUser'); 
    console.log("Usuari desconnectat");
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
        onLogout={handleLogout}
        onSettingsClick={() => go('/settings')}
      />
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}
    </>
  );

  switch (route.type) {
    case 'settings':
      return <SettingsScreen onBack={() => go('/')} />;

    case 'practice-free':
      return (
        <FreeModeScreen
          onBack={() => go('/levels')}
          onStartGame={handleStartCustomGame}
        />
      );

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

      return (
        <LevelScreen
          key={navKey}
          level={level}
          onBack={() => go('/practice/free')}
          onRetry={() => go(`/level/custom?${retryParams.toString()}`)}
          isTutorialMode={false}
          onCompleteTutorial={() => {}}
          onLevelComplete={(newProgress) => setProgress(newProgress)}
          isPracticeMode={true}
        />
      );
    }

    case 'practice-normal':
      return (
        <PracticeNormalScreen
          key={navKey}
          onBack={() => go('/levels')}
        />
      );

    case 'practice-ia': {
      const level = generateLevel({
        levelNumber: 1,
        difficulty: 'easy',
        width: 7,
        height: 7,
        memorizeTime: 12,
        stars: [60, 45, 30],
      });
      return (
        <LevelScreen
          key={navKey}
          level={level}
          onBack={() => go('/levels')}
          onRetry={() => go('/practice/ia')}
          isTutorialMode={false}
          onCompleteTutorial={() => {}}
          onLevelComplete={(newProgress) => setProgress(newProgress)}
          isPracticeMode={true}
        />
      );
    }

    case 'levels':
      return (
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

      return (
        <LevelScreen
          key={navKey}
          level={level}
          onBack={() => go('/levels')}
          onRetry={() => go(`/level/${difficulty}/${number}`)}
          isTutorialMode={isTutorialMode}
          onCompleteTutorial={() => setIsTutorialMode(false)}
          onLevelComplete={(newProgress) => setProgress(newProgress)}
          isPracticeMode={false}
        />
      );
    }

    case 'home':
      return renderHome();

    case 'unknown':
    default:
      return renderHome();
  }
}
