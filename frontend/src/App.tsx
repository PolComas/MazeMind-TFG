import { useEffect, useState } from 'react';
import HomeScreen from './components/HomeScreen';
import LevelSelect from './components/LevelSelect';
import LevelScreen from './pages/LevelScreen';
import { generateLevel } from './maze/maze_generator';

export default function App() {
  // --- Lògica de Navegació ---
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const go = (p: string) => {
    window.history.pushState({}, '', p);
    setPath(p);
  };

  // --- Selector de Pantalla ---
  // --- Pantalla de Selecció de Nivell ---
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
    const level = generateLevel({
      levelNumber: num,
      width: 7,
      height: 7,
      memorizeTime: 10,
      stars: [60, 45, 30], 
    }); 
    return (
      <LevelScreen
        level={level}
        onBack={() => go('/levels')}
        onRetry={() => go(`/level/${num}`)}
      />
    );
  }

  // --- Pantalla d'Inici ---
  return <HomeScreen onNavigate={() => go('/levels')} />;
}
