import React from 'react';
import type { VisualSettings } from '../../utils/settings';
import Logo from '../../assets/cervell.svg?react';
import { User } from 'lucide-react';
import NetworkBackground from '../NetworkBackground';

type Props = {
  settings: VisualSettings;
};

const previewStats = [
  { icon: "🎯", label: "Nivells", value: 11 },
  { icon: "🏆", label: "Estrelles", value: 22 },
  { icon: "⚡️", label: "Perfectes", value: 33 },
];

export default function HomeScreenPreview({ settings }: Props) {
  // Construïr els estils dinàmics basats en les settings rebudes
  const styles: Record<string, React.CSSProperties> = {
    // Aplicar el fons i el color de text rebuts
    pagePreview: {
      background: 'transparent', // remove static color
      color: settings.textColor,
      padding: '24px',
      borderRadius: '8px',
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      overflow: 'hidden',
      position: 'relative',
      isolation: 'isolate',
      boxSizing: 'border-box',
    },
    // Icona d'usuari
    userIconPreview: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: settings.surfaceColor,
      color: settings.subtextColor,
      borderRadius: '50%',
      width: '32px', height: '32px',
      display: 'grid', placeItems: 'center',
      border: `1px solid ${settings.borderColor}`,
    },
    logoWrapPreview: {
      // Aplicar el gradient del botó principal al logo
      background: `linear-gradient(135deg, ${settings.accentColor1}, ${settings.accentColor2 || settings.accentColor1})`,
      borderRadius: '16px',
      padding: '12px',
      display: 'grid', placeItems: 'center',
    },
    logoSvgPreview: { width: 40, height: 40, filter: 'brightness(0) invert(1)' },
    titlePreview: {
      fontSize: '24px',
      fontWeight: 900, margin: 0,
    },
    subtitlePreview: {
      fontSize: '12px',
      color: settings.subtextColor, margin: 0, maxWidth: '250px',
    },
    statsGridPreview: {
      display: 'flex',
      gap: '8px',
      marginTop: '8px',
    },
    statCardPreview: {
      // Aplicar surface i border
      background: settings.surfaceColor,
      border: `1px solid ${settings.borderColor}`,
      borderRadius: '8px',
      padding: '8px',
      textAlign: 'center',
      flex: 1,
    },
    statIconPreview: { fontSize: 14 },
    statValuePreview: { fontSize: 16, fontWeight: 700 },
    statLabelPreview: { fontSize: 10, color: settings.subtextColor },
    actionsColPreview: {
      display: 'flex', flexDirection: 'column', gap: '8px', width: '80%', marginTop: '8px',
    },
    playBtnPreview: {
      padding: '10px', borderRadius: '8px', border: 'none',
      background: `linear-gradient(90deg, ${settings.accentColor1}, ${settings.accentColor2 || settings.accentColor1})`,
      color: '#fff', fontSize: '14px', fontWeight: 700,
    },
    secondaryBtnPreview: {
      padding: '10px', borderRadius: '8px',
      border: `1px solid ${settings.borderColor}`,
      background: 'rgba(255,255,255,0.06)',
      color: settings.textColor, fontSize: '14px', fontWeight: 600,
    },
    multiplayerBtnPreview: {
      padding: '10px', borderRadius: '8px', border: 'none',
      background: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), linear-gradient(90deg, ${settings.accentColor1}, ${settings.accentColor2 || settings.accentColor1})`,
      color: '#fff', fontSize: '14px', fontWeight: 700,
    },
  };

  return (
    <div style={styles.pagePreview}>
      <NetworkBackground
        primaryColor={settings.accentColor1}
        backgroundColor={settings.backgroundColor}
        opacity={0.4}
      />
      {/* Icona usuari (només visual) */}
      <div style={styles.userIconPreview}><User size={16} /></div>

      {/* Logo */}
      <div style={styles.logoWrapPreview}>
        <Logo style={styles.logoSvgPreview} />
      </div>

      {/* Títol i Subtítol */}
      <h1 style={styles.titlePreview}>MazeMind</h1>
      <p style={styles.subtitlePreview}>
        Entrena la memòria visoespacial resolent laberints
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

      {/* Botons (només visuals) */}
      <div style={styles.actionsColPreview}>
        <div style={styles.playBtnPreview}>▶ Jugar</div>
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
        </svg>Multijugador</div>
        <div style={styles.secondaryBtnPreview}>⚙ Configuració</div>
      </div>
    </div>
  );
}