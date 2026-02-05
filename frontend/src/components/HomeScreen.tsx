import React, { useState, useMemo } from "react";
import { User, LogOut } from 'lucide-react';
import Logo from "../assets/cervell.svg?react";
import { PALETTE } from './palette';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import { getTotalCompletedLevels, getTotalStars, getTotalPerfectLevels, type GameProgress } from '../utils/progress';
import NetworkBackground from './NetworkBackground';

type UserType = { id: string; email: string; };

type Props = {
  user: UserType | null;
  onNavigate: () => void;
  onMultiplayer: () => void;
  onUserClick: () => void;
  onLogout: () => Promise<void> | void;
  onSettingsClick: () => void;
  progress: GameProgress;
};

export default function HomeScreen({ user, onNavigate, onMultiplayer, onUserClick, onLogout, onSettingsClick, progress }: Props) {
  // Obtenir la configuració específica per home
  const { getVisualSettings } = useSettings();
  const screenSettings = getVisualSettings('home');

  // Calcular les estadístiques dinàmicament
  const playerStats = useMemo(() => {
    return [
      {
        icon: "🎯",
        label: "Nivells Superats",
        value: getTotalCompletedLevels(progress)
      },
      {
        icon: "⚡️",
        label: "Nivells Perfectes",
        value: getTotalPerfectLevels(progress)
      },
      {
        icon: "🏆",
        label: "Estrelles",
        value: getTotalStars(progress)
      },
    ];
  }, [progress]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Gestionar clic a botó usuari
  const handleUserInteraction = async () => {
    if (user) {
      if (isLoggingOut) return;
      setIsLoggingOut(true);
      try { await onLogout(); } finally { setIsLoggingOut(false); }
    } else {
      onUserClick();
    }
  };

  const audio = useGameAudio();

  const [playFocused, setPlayFocused] = useState(false);
  const [multiFocused, setMultiFocused] = useState(false);
  const [settingsFocused, setSettingsFocused] = useState(false);

  const onNavigateWithSound = () => {
    audio.playFail();
    onNavigate();
  };

  const onSettingsWithSound = () => {
    audio.playFail();
    onSettingsClick();
  };

  const onMultiplayerWithSound = () => {
    audio.playFail();
    onMultiplayer();
  };

  const handleUserInteractionWithSound = () => {
    audio.playFail();
    handleUserInteraction();
  };

  // Estils dinàmics utilitzant 'screenSettings'
  const styles = useMemo<Record<string, React.CSSProperties>>(() => ({
    page: { // Omple tota la pantalla amb gradients i fons base, elements centrats
      minHeight: "100svh", width: "100vw", margin: 0,
      // background: screenSettings.backgroundColor, // Removed static background
      color: screenSettings.textColor,
      display: "grid", placeItems: "center", padding: 24,
      boxSizing: "border-box",
      position: 'relative',
      isolation: 'isolate',
    },
    userButton: { // Botó d'usuari a la cantonada superior dreta
      position: 'absolute', top: 'clamp(16px, 3vw, 24px)', right: 'clamp(16px, 3vw, 24px)',
      background: screenSettings.surfaceColor,
      border: `1px solid ${screenSettings.borderColor}`,
      color: screenSettings.subtextColor,
      borderRadius: '50%', width: '48px', height: '48px',
      display: 'grid', placeItems: 'center', cursor: 'pointer',
      boxShadow: PALETTE.shadow, zIndex: 10, transition: 'background 0.2s ease',
    },
    // Contenidor principal centrat amb amplada màxima i gap
    container: {
      width: "min(1100px, 100%)",
      display: "grid",
      justifyItems: "center",
      textAlign: "center",
      gap: 24,
      paddingInline: "min(4vw, 40px)",
    },
    logoSvg: { // SVG del logo amb mida fixa i filtre per fer-lo blanc
      width: 80,
      height: 80,
      filter: 'brightness(0) invert(1)',
    },
    logoWrap: {
      // Gradient dinàmic segons la configuració visual
      background: `linear-gradient(135deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
      borderRadius: 32,
      padding: 24,
      marginBottom: 16,
      boxShadow: PALETTE.shadow,
      fontSize: 40,
      lineHeight: 1,
      display: "grid",
      placeItems: "center",
    },
    title: { // Títol principal amb font gran i ombra
      fontSize: "clamp(42px, 6vw, 68px)",
      fontWeight: 900,
      margin: 0,
      letterSpacing: "-0.02em",
      textShadow: "0 2px 0 rgba(0,0,0,.25)",
      color: screenSettings.textColor,
    },
    subtitle: { // Subtítol amb font mitjana i color secundari
      fontSize: "clamp(16px, 1.6vw, 20px)",
      margin: 0,
      maxWidth: 760,
      color: screenSettings.subtextColor,
      marginInline: "auto",
    },
    statsGrid: { // Graella responsiva per les estadístiques
      listStyle: "none",
      padding: 0,
      margin: "8px 0 0 0",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 16,
      width: "80%",
    },
    statCard: { // Targeta per cada estadística amb fons i ombra
      background: screenSettings.surfaceColor,
      border: `1px solid ${screenSettings.borderColor}`,
      borderRadius: 16,
      padding: "16px 20px",
      display: "grid",
      justifyItems: "center",
      alignContent: "center",
      gap: 8,
      boxShadow: PALETTE.shadow,
    },
    statIcon: { fontSize: 22, lineHeight: 1 },
    statValue: { fontSize: 28, fontWeight: 800, letterSpacing: "0.02em", color: screenSettings.textColor },
    statLabel: { fontSize: 14, color: screenSettings.subtextColor },
    actionsCol: { // Columna per als botons d'acció
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 12,
      width: "min(420px, 100%)",
      marginTop: 8,
    },
    playBtn: { // Botó principal "Jugar" amb gradient i ombra
      padding: "16px",
      borderRadius: 12,
      border: "2px solid transparent",
      background: `linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
      color: screenSettings.textColor,
      fontSize: 18,
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: PALETTE.shadow,
      transition: "transform .05s ease",
      outline: "3px solid transparent",
    },
    multiplayerBtn: { // Botó Multijugador (Segon nivell d'importància)
      padding: "16px",
      borderRadius: 12,
      border: "2px solid transparent",
      background: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
      color: screenSettings.textColor,
      fontSize: 18,
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: PALETTE.shadow,
      transition: "transform .05s ease",
      outline: "3px solid transparent",
      // filter removed to keep text bright
    },
    secondaryBtn: { // Botó secundari "Configuració" amb fons translúcid
      padding: "16px",
      borderRadius: 12,
      border: `2px solid ${screenSettings.borderColor}`,
      background: 'rgba(255,255,255,0.06)',
      color: screenSettings.textColor,
      fontSize: 18,
      fontWeight: 700,
      cursor: "pointer",
      transition: "transform .05s ease",
      outline: "3px solid transparent",
    },
    welcomeMessage: {
      color: screenSettings.subtextColor,
      fontSize: 16,
      marginBottom: 8,
    },
  }), [screenSettings]);

  return (
    <main role="main" style={styles.page}>
      <NetworkBackground
        primaryColor={screenSettings.accentColor1}
        backgroundColor={screenSettings.backgroundColor}
      />

      {/* Botó d'usuari */}
      <button
        style={styles.userButton}
        onClick={handleUserInteractionWithSound}
        disabled={isLoggingOut}
        aria-busy={isLoggingOut ? 'true' : 'false'}
        onMouseEnter={() => audio.playHover()}
        aria-label={user ? `Compte de ${user.email}. Tancar sessió.` : "Iniciar sessió o registrar-se"}
      >
        {/* Icona condicional */}
        {user ? <LogOut size={24} /> : <User size={24} />}
      </button>

      <div style={styles.container} aria-labelledby="title">
        {/* LOGO */}
        <div style={styles.logoWrap} role="img" aria-label="Logotip de MazeMind">
          <Logo style={styles.logoSvg} />
        </div>

        {/* Títol i subtítol*/}
        <h1 id="title" style={styles.title}>MazeMind</h1>
        <p style={styles.subtitle}>
          Entrena la teva memòria visoespacial resolent laberints
        </p>

        {/* Estadístiques */}
        <ul style={styles.statsGrid} aria-label="Estadístiques de progrés">
          {playerStats.map(s => (
            <li key={s.label} style={styles.statCard}>
              <div aria-hidden="true" style={styles.statIcon}>{s.icon}</div>
              <div style={styles.statValue} aria-live="polite">{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </li>
          ))}
        </ul>

        {/* Navegació principal --> Play i Config */}
        <nav id="actions" aria-label="Accions" style={styles.actionsCol}>
          <button
            type="button"
            style={{
              ...styles.playBtn,
              ...(playFocused ? { outline: `3px solid ${screenSettings.accentColor1}`, transform: 'translateY(-1px) scale(1.01)' } : {}),
            }}
            onClick={onNavigateWithSound}
            onMouseEnter={() => audio.playHover()}
            onFocus={() => { setPlayFocused(true); audio.playHover(); }}
            onBlur={() => setPlayFocused(false)}
            aria-label="Jugar a MazeMind"
          >
            <span aria-hidden="true">▶</span> Jugar
          </button>

          <button
            type="button"
            style={{
              ...styles.multiplayerBtn,
              ...(multiFocused ? { outline: `3px solid ${screenSettings.accentColor1}`, transform: 'translateY(-1px) scale(1.01)' } : {}),
            }}
            onClick={onMultiplayerWithSound}
            onMouseEnter={() => audio.playHover()}
            onFocus={() => { setMultiFocused(true); audio.playHover(); }}
            onBlur={() => setMultiFocused(false)}
            aria-label="Obrir multijugador"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8, marginBottom: 2 }}
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>Multijugador
          </button>

          <button
            type="button"
            style={{
              ...styles.secondaryBtn,
              ...(settingsFocused ? { outline: `3px solid ${screenSettings.accentColor2}`, transform: 'translateY(-1px) scale(1.01)' } : {}),
            }}
            onClick={onSettingsWithSound}
            onMouseEnter={() => audio.playHover()}
            onFocus={() => { setSettingsFocused(true); audio.playHover(); }}
            onBlur={() => setSettingsFocused(false)}
            aria-label="Obrir configuració"
          >
            <span aria-hidden="true">⚙</span> Configuració
          </button>
        </nav>
      </div>
    </main>
  );
}
