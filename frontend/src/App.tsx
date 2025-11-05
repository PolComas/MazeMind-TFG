import { useEffect, useState } from 'react';
import HomeScreen from './components/HomeScreen';
import LevelSelect from './components/LevelSelect';
import LevelScreen from './pages/LevelScreen';
import { generateLevel, type Level } from './maze/maze_generator';
import AuthModal from './components/AuthModal'; 
import SettingsScreen from './pages/SettingsScreen';
import { loadProgress, type GameProgress } from './utils/progress';
import type { Diff } from './maze/maze_generator';
import FreeModeScreen, { type CustomLevelConfig } from './pages/FreeModeScreen';

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

export default function App() {
  const [user, setUser] = useState<User | null>(null); 
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Estat per al mode tutorial
  const [isTutorialMode, setIsTutorialMode] = useState(false);

  // L'estat del progrés
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());

  // --- Lògica de Navegació ---
  const [path, setPath] = useState(window.location.pathname);
  const [navKey, setNavKey] = useState(0);

  // Estat per a la dificultat seleccionada
  const [selectedDifficulty, setSelectedDifficulty] = useState<Diff>('easy');

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const go = (p: string) => {
    // Qualsevol navegació normal desactiva el mode tutorial
    setIsTutorialMode(false);

    // Construïm la ruta per a pushState i per a l'estat intern
    const targetPath = base === '/' ? p : `${base.replace(/\/$/, '')}${p}`;
    window.history.pushState({}, '', targetPath);

    if (targetPath === path) {
      setNavKey((k) => k + 1);
    } else {
      setPath(targetPath);
      setNavKey(0);
    }
  };

  // Funció per iniciar el tutorial
  const startTutorial = () => {
    setIsTutorialMode(true);
    const tutorialLevelPath = fullPath('/level/easy/1');
    window.history.pushState({}, '', tutorialLevelPath);
    setPath(tutorialLevelPath);
    setNavKey(k => k + 1);
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

  // Helper per construir rutes completes
  const fullPath = (relativePath: string) => {
    if (base === '/') return relativePath;
    return `${base.replace(/\/$/, '')}${relativePath}`;
  }

  // Pantalla de Configuració
  if (path === fullPath('/settings')) {
    return <SettingsScreen onBack={() => go('/')} />;
  }

  // Pantalles de Pràctica
  if (path === fullPath('/practice/free')) {
    
    // Funció que construeix la URL i navega
    const handleStartCustomGame = (config: CustomLevelConfig) => {
      const params = new URLSearchParams();
      params.append('w', String(config.width));
      params.append('h', String(config.height));
      params.append('t', String(config.time));
      params.append('d', config.difficulty);
      
      // Naveguem a la nova URL personalitzada
      go(`/level/custom?${params.toString()}`);
    };

    return (
      <FreeModeScreen
        onBack={() => go('/levels')}
        onStartGame={handleStartCustomGame}
      />
    );
  }

  // Llegir la URL del Mode Lliure
  const customLevelPath = fullPath('/level/custom');
  if (path.startsWith(customLevelPath)) {
    
    // Paràmetres de la URL actual
    const params = new URLSearchParams(window.location.search);
    const w = parseInt(params.get('w') || '7');
    const h = parseInt(params.get('h') || '7');
    const t = parseInt(params.get('t') || '10');
    const d = (params.get('d') || 'normal') as 'normal' | 'hard';

    // Generar un nivell 100% personalitzat
    const level = generateLevel({
      levelNumber: 99,
      difficulty: d,
      width: w,
      height: h,
      memorizeTime: t,
      stars: [60, 45, 30],
    });

    return (
      <LevelScreen
        key={navKey} 
        level={level}
        onBack={() => go('/levels')}
        onRetry={() => go(path)} 
        isTutorialMode={false}
        onCompleteTutorial={() => {}}
        onLevelComplete={(newProgress) => setProgress(newProgress)}
      />
    );
  }

  // Pràctica Normal
  if (path === fullPath('/practice/normal')) {
    const level = generateLevel({
      levelNumber: 1,
      difficulty: 'normal',
      width: 10,
      height: 10,
      memorizeTime: 8,
      stars: [60, 45, 30],
    });
    return (
      <LevelScreen
        key={navKey}
        level={level}
        onBack={() => go('/levels')}
        onRetry={() => go('/practice/normal')}
        isTutorialMode={false}
        onCompleteTutorial={() => {}}
        onLevelComplete={(newProgress) => setProgress(newProgress)}
      />
    );
  }

  // Pràctica IA
  if (path === fullPath('/practice/ia')) {
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
      />
    );
  }

  // Pantalla de Selecció de Nivell
  if (path === fullPath('/levels')) {
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
  }

  // --- Pantalla de Nivell Individual ---
  const levelPathRegex = new RegExp(`^${fullPath('/level')}\/([a-z]+)\/(\\d+)$`);
  const match = path.match(levelPathRegex);

  if (match) {
    // match[1] és la dificultat (ex: "hard")
    // match[2] és el número (ex: "5")
    const difficulty = match[1] as 'easy' | 'normal' | 'hard';
    const numStr = match[2];
    const num = Number(numStr || 1);
    
    const levelKey = `${difficulty}-${num}`; 
    let level: Level;
    
    // Carregar nivell desat o generar-ne un de nou
    if (savedLevels[levelKey]) {
      level = savedLevels[levelKey];
    } else {
      level = generateLevel({
        levelNumber: num,
        difficulty: difficulty, 
        width: 7,
        height: 7,
        memorizeTime: 10,
        stars: [60, 45, 30], 
      }); 
    }
    return (
      <LevelScreen
        key={navKey} 
        level={level}
        onBack={() => go('/levels')}
        onRetry={() => go(`/level/${difficulty}/${num}`)}
        isTutorialMode={isTutorialMode}
        onCompleteTutorial={() => setIsTutorialMode(false)}
        onLevelComplete={(newProgress) => setProgress(newProgress)}
      />
    );
  }

  // --- Pantalla d'Inici ---
  if (path === base.replace(/\/$/, '') || path === base || path === fullPath('/')) {
     return (
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
  }

  // --- Fallback ---
  console.warn(`Ruta desconeguda: ${path}. Redirigint a HomeScreen.`);
   return (
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
}
