import React from 'react';
import type { VisualSettings } from '../../utils/settings';
import Logo from '../../assets/cervell.svg?react';
import { Flame, LogOut } from 'lucide-react';
import NetworkBackground from '../NetworkBackground';
import { useLanguage } from '../../context/LanguageContext';
import { applyAlpha, pickReadableTextColor } from '../../utils/color';

type Props = {
  settings: VisualSettings;
};

/**
 * Previsualitzacio de la Home dins la pantalla de configuracio.
 */
export default function HomeScreenPreview({ settings }: Props) {
  const { t } = useLanguage();
  const previewStats = [
    { icon: "🎯", label: t('home.stats.completed'), value: 11 },
    { icon: "⚡️", label: t('home.stats.perfect'), value: 4 },
    { icon: "🏆", label: t('home.stats.stars'), value: 22 },
  ];

  const styles: Record<string, React.CSSProperties> = {
    pagePreview: {
      background: 'transparent',
      color: settings.textColor,
      padding: '14px',
      borderRadius: '8px',
      height: '100%',
      width: '100%',
      display: 'grid',
      justifyItems: 'center',
      alignItems: 'center',
      alignContent: 'start',
      gap: 10,
      overflow: 'hidden',
      position: 'relative',
      isolation: 'isolate',
      boxSizing: 'border-box',
    },
    topUtilsPreview: {
      position: 'absolute',
      top: 10,
      right: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    langPreview: {
      display: 'flex',
      gap: 2,
      background: settings.surfaceColor,
      border: `1px solid ${settings.borderColor}`,
      borderRadius: 14,
      padding: '2px',
    },
    langItemActive: {
      background: settings.accentColor1,
      color: pickReadableTextColor(settings.accentColor1),
      borderRadius: 10,
      fontSize: 8,
      fontWeight: 800,
      padding: '3px 5px',
      lineHeight: 1,
    },
    langItem: {
      color: settings.subtextColor,
      borderRadius: 10,
      fontSize: 8,
      fontWeight: 700,
      padding: '3px 5px',
      lineHeight: 1,
    },
    userIconPreview: {
      background: settings.surfaceColor,
      color: settings.subtextColor,
      borderRadius: '50%',
      width: '26px', height: '26px',
      display: 'grid', placeItems: 'center',
      border: `1px solid ${settings.borderColor}`,
    },
    logoWrapPreview: {
      background: `linear-gradient(135deg, ${settings.accentColor1}, ${settings.accentColor2 || settings.accentColor1})`,
      borderRadius: '13px',
      width: 50,
      height: 50,
      display: 'grid',
      placeItems: 'center',
      marginTop: 10,
    },
    logoSvgPreview: { width: 30, height: 30, filter: 'brightness(0) invert(1)' },
    titlePreview: {
      fontSize: '28px',
      fontWeight: 900, margin: 0,
      textAlign: 'center',
    },
    subtitlePreview: {
      fontSize: '10px',
      color: settings.subtextColor, margin: 0, maxWidth: '250px',
      textAlign: 'center',
    },
    statsGridPreview: {
      display: 'grid',
      width: '90%',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 6,
      marginTop: 2,
    },
    statCardPreview: {
      background: settings.surfaceColor,
      border: `1px solid ${settings.borderColor}`,
      borderRadius: '8px',
      padding: '6px 4px',
      textAlign: 'center',
      flex: 1,
    },
    statIconPreview: { fontSize: 12 },
    statValuePreview: { fontSize: 14, fontWeight: 700 },
    statLabelPreview: { fontSize: 8, color: settings.subtextColor },
    dailyPreview: {
      width: '62%',
      borderRadius: 8,
      border: `1px solid ${applyAlpha(settings.accentColor1, 0.38)}`,
      background: `linear-gradient(180deg, ${applyAlpha(settings.accentColor1, 0.16)}, ${applyAlpha(settings.accentColor1, 0.1)})`,
      color: settings.textColor,
      padding: '6px 10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      position: 'relative',
      minHeight: 28,
      boxSizing: 'border-box',
    },
    dailyStreakPreview: {
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: 'translateY(-50%)',
      borderRadius: 999,
      fontSize: 10,
      fontWeight: 800,
      padding: '1px 6px',
      background: settings.accentColor1,
      color: pickReadableTextColor(settings.accentColor1),
      border: `1px solid ${applyAlpha(settings.textColor, 0.22)}`,
      lineHeight: 1.2,
    },
    actionsColPreview: {
      display: 'grid', gap: 7, width: '62%', marginTop: 0,
    },
    playBtnPreview: {
      padding: '9px', borderRadius: '8px', border: 'none',
      background: `linear-gradient(90deg, ${settings.accentColor1}, ${settings.accentColor2 || settings.accentColor1})`,
      color: settings.textColor, fontSize: '13px', fontWeight: 800,
      textAlign: 'center',
    },
    secondaryBtnPreview: {
      padding: '9px', borderRadius: '8px',
      border: `1px solid ${settings.borderColor}`,
      background: 'rgba(255,255,255,0.06)',
      color: settings.textColor, fontSize: '13px', fontWeight: 700,
      textAlign: 'center',
    },
    multiplayerBtnPreview: {
      padding: '9px', borderRadius: '8px', border: 'none',
      background: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), linear-gradient(90deg, ${settings.accentColor1}, ${settings.accentColor2 || settings.accentColor1})`,
      color: settings.textColor, fontSize: '13px', fontWeight: 800,
      textAlign: 'center',
    },
    footerPreview: {
      marginTop: 2,
      fontSize: 8,
      fontWeight: 700,
      color: settings.textColor,
      background: applyAlpha(settings.backgroundColor, 0.78),
      border: `1px solid ${applyAlpha(settings.borderColor, 0.9)}`,
      borderRadius: 999,
      padding: '3px 8px',
      width: 'fit-content',
    },
  };

  return (
    <div style={styles.pagePreview}>
      <NetworkBackground
        primaryColor={settings.accentColor1}
        backgroundColor={settings.backgroundColor}
        opacity={0.4}
      />

      <div style={styles.topUtilsPreview}>
        <div style={styles.langPreview}>
          <span style={styles.langItemActive}>CA</span>
          <span style={styles.langItem}>ES</span>
          <span style={styles.langItem}>EN</span>
        </div>
        <div style={styles.userIconPreview}><LogOut size={12} /></div>
      </div>

      {/* Logo */}
      <div style={styles.logoWrapPreview}>
        <Logo style={styles.logoSvgPreview} />
      </div>

      {/* Títol i Subtítol */}
      <div style={styles.titlePreview}>{t('home.title')}</div>
      <p style={styles.subtitlePreview}>
        {t('home.subtitle')}
      </p>

      {/* Estadístiques (versió simplificada) */}
      <div style={styles.statsGridPreview}>
        {previewStats.map(s => (
          <div key={s.label} style={styles.statCardPreview}>
            <div style={styles.statIconPreview}>{s.icon}</div>
            <div style={styles.statValuePreview}>{s.value}</div>
            <div style={styles.statLabelPreview}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.dailyPreview}>
        <Flame size={13} aria-hidden="true" />
        <span style={{ fontSize: 11, fontWeight: 800 }}>{t('daily.title')}</span>
        <span style={styles.dailyStreakPreview}>3 🔥</span>
      </div>

      <div style={styles.actionsColPreview}>
        <div style={styles.playBtnPreview}>▶ {t('home.play')}</div>
        <div style={styles.multiplayerBtnPreview}><svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8, marginBottom: 2 }}
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>{t('home.multiplayer')}</div>
        <div style={styles.secondaryBtnPreview}>⚙ {t('home.settings')}</div>
      </div>

      <div style={styles.footerPreview}>{t('home.footer')}</div>
    </div>
  );
}
