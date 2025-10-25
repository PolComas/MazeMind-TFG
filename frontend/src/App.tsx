import { useEffect, useState } from 'react';
import HomeScreen from './components/HomeScreen';
import LevelSelect from './components/LevelSelect';
import LevelScreen from './pages/LevelScreen';
import { generateLevel, type Level } from './maze/maze_generator';
import AuthModal from './components/AuthModal'; 
import SettingsScreen from './pages/SettingsScreen';

// Nivells desats
import easyLevel1 from './levels/easy-level-1.json';

const savedLevels: Record<string, Level> = {
  'easy-1': easyLevel1 as Level,
};

type User = {
  id: string;
  email: string; 
};

export default function App() {
  const [user, setUser] = useState<User | null>(null); 
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- Lògica de Navegació ---
  const [path, setPath] = useState(window.location.pathname);
  const [navKey, setNavKey] = useState(0);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const go = (p: string) => {
    // Si naveguem a la mateixa ruta, incrementem navKey per forçar remuntatge (reiniciar nivell)
    window.history.pushState({}, '', p);
    if (p === path) {
      setNavKey((k) => k + 1);
      setPath(p);
    } else {
      setPath(p);
      setNavKey(0);
    }
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

  // Pantalla de Configuració
  if (path === '/settings') {
    return <SettingsScreen onBack={() => go('/')} />;
  }

  // Pantalla de Selecció de Nivell
  if (path === '/levels') {
    return (
      <LevelSelect 
        onPlayLevel={(n) => go(`/level/${n}`)} 
        onBack={() => go('/')}
      />
    );
  }

  // --- Pantalla de Nivell Individual ---
  if (path.startsWith('/level/')) {
    const num = Number(path.split('/').pop() || 1);
    
    const levelKey = `easy-${num}`; 
    let level: Level;
    
    // Carregar nivell desat o generar-ne un de nou
    if (savedLevels[levelKey]) {
      level = savedLevels[levelKey];
    } else {
      level = generateLevel({
        levelNumber: num,
        difficulty: 'easy',
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
        onRetry={() => go(`/level/${num}`)}
      />
    );
  }

  // --- Pantalla d'Inici ---
  return (
    <> 
      <HomeScreen 
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
