import React, { useState, useMemo } from "react";
import { User, LogOut } from 'lucide-react';
import Logo from "../assets/cervell.svg?react";
import { PALETTE } from './palette';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { getVisualSettings } = useSettings();
  const screenSettings = getVisualSettings('home');
  const { t, language, setLanguage } = useLanguage();

  const playerStats = useMemo(() => {
    return [
      {
        icon: "🎯",
        label: t('home.stats.completed'),
        value: getTotalCompletedLevels(progress)
      },
      {
        icon: "⚡️",
        label: t('home.stats.perfect'),
        value: getTotalPerfectLevels(progress)
      },
      {
        icon: "🏆",
        label: t('home.stats.stars'),
        value: getTotalStars(progress)
      },
    ];
  }, [progress, t]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const styles = useMemo<Record<string, React.CSSProperties>>(() => ({
    page: {
      minHeight: "100svh", width: "100%", margin: 0,
      color: screenSettings.textColor,
      display: "grid", placeItems: "center", padding: 24,
      boxSizing: "border-box",
      position: 'relative',
      isolation: 'isolate',
    },
    headerUtils: {
      position: 'absolute', top: 'clamp(16px, 3vw, 24px)', right: 'clamp(16px, 3vw, 24px)',
      display: 'flex', alignItems: 'center', gap: 16, zIndex: 10,
    },
    userButton: {
      background: screenSettings.surfaceColor,
      border: `1px solid ${screenSettings.borderColor}`,
      color: screenSettings.subtextColor,
      borderRadius: '50%', width: '48px', height: '48px',
      display: 'grid', placeItems: 'center', cursor: 'pointer',
      boxShadow: PALETTE.shadow, transition: 'background 0.2s ease',
      flexShrink: 0,
    },
    langSwitcher: {
      display: 'flex', gap: 4, background: screenSettings.surfaceColor,
      padding: '4px', borderRadius: 20,
      border: `1px solid ${screenSettings.borderColor}`,
      boxShadow: PALETTE.shadow,
    },
    langBtn: {
      background: 'transparent',
      border: 'none',
      color: screenSettings.subtextColor,
      fontSize: 12, fontWeight: 700,
      padding: '6px 10px',
      cursor: 'pointer',
      borderRadius: 16,
      transition: 'all 0.2s',
    },
    langBtnActive: {
      background: screenSettings.accentColor1,
      color: '#fff', // Always white for contrast on accent
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    container: {
      width: "min(1100px, 100%)",
      display: "grid",
      justifyItems: "center",
      textAlign: "center",
      gap: 24,
      paddingInline: "min(4vw, 40px)",
    },
    logoSvg: {
      width: 80,
      height: 80,
      filter: 'brightness(0) invert(1)',
    },
    logoWrap: {
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
    title: {
      fontSize: "clamp(42px, 6vw, 68px)",
      fontWeight: 900,
      margin: 0,
      letterSpacing: "-0.02em",
      textShadow: "0 2px 0 rgba(0,0,0,.25)",
      color: screenSettings.textColor,
    },
    subtitle: {
      fontSize: "clamp(16px, 1.6vw, 20px)",
      margin: 0,
      maxWidth: 760,
      color: screenSettings.subtextColor,
      marginInline: "auto",
    },
    statsGrid: {
      listStyle: "none",
      padding: 0,
      margin: "8px 0 0 0",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 16,
      width: "80%",
    },
    statCard: {
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
    actionsCol: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 12,
      width: "min(420px, 100%)",
      marginTop: 8,
    },
    playBtn: {
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
    multiplayerBtn: {
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
    },
    secondaryBtn: {
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
    footer: { // Added footer style
      position: 'absolute', bottom: 16,
      fontSize: 12, color: screenSettings.subtextColor, opacity: 0.6,
      pointerEvents: 'none'
    }
  }), [screenSettings]);

  return (
    <main role="main" style={styles.page}>
      <NetworkBackground
        primaryColor={screenSettings.accentColor1}
        backgroundColor={screenSettings.backgroundColor}
      />

      <div style={styles.headerUtils}>
        {/* Language Switcher */}
        <div style={styles.langSwitcher}>
          {(['ca', 'es', 'en'] as const).map((lang) => (
            <button
              key={lang}
              style={{ ...styles.langBtn, ...(language === lang ? styles.langBtnActive : {}) }}
              onClick={() => { audio.playHover(); setLanguage(lang); }}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Botó d'usuari */}
        <button
          style={styles.userButton}
          onClick={handleUserInteractionWithSound}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut ? 'true' : 'false'}
          onMouseEnter={() => audio.playHover()}
          aria-label={user ? `Compte de ${user.email}. ${t('home.logout')}.` : t('home.login')}
        >
          {user ? <LogOut size={24} /> : <User size={24} />}
        </button>
      </div>

      <div style={styles.container} aria-labelledby="title">
        <div style={styles.logoWrap} role="img" aria-label={t('home.logoAria')}>
          <Logo style={styles.logoSvg} />
        </div>

        <h1 id="title" style={styles.title}>{t('home.title')}</h1>
        <p style={styles.subtitle}>
          {t('home.subtitle')}
        </p>

        <ul style={styles.statsGrid} aria-label={t('home.stats.aria')}>
          {playerStats.map(s => (
            <li key={s.label} style={styles.statCard}>
              <div aria-hidden="true" style={styles.statIcon}>{s.icon}</div>
              <div style={styles.statValue} aria-live="polite">{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </li>
          ))}
        </ul>

        <nav id="actions" aria-label={t('home.actions.aria')} style={styles.actionsCol}>
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
            aria-label={t('home.play')}
          >
            <span aria-hidden="true">▶</span> {t('home.play')}
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
            aria-label={t('home.multiplayer')}
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
            </svg>{t('home.multiplayer')}
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
            aria-label={t('home.settings')}
          >
            <span aria-hidden="true">⚙</span> {t('home.settings')}
          </button>
        </nav>

        <div style={styles.footer}>
          {t('home.footer')}
        </div>
      </div>
    </main>
  );
}
