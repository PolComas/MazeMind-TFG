import React, { useMemo } from 'react';
import { Lock, LogIn } from 'lucide-react';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  open: boolean;
  onClose: () => void;
  onLogin?: () => void;
  visuals: VisualSettings;
};

const buildStyles = (visuals: VisualSettings): Record<string, React.CSSProperties> => {
  const overlayColor = applyAlpha(visuals.textColor, 0.7);
  const panelBackground = applyAlpha(visuals.surfaceColor, 0.95);
  const accentGradient = `linear-gradient(90deg, ${visuals.accentColor1}, ${visuals.accentColor2})`;

  return {
    overlay: {
      position: 'fixed',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 80,
      padding: '16px',
    },
    panel: {
      background: panelBackground,
      color: visuals.textColor,
      borderRadius: 16,
      border: `1px solid ${visuals.borderColor}`,
      width: 'min(520px, 92vw)',
      boxShadow: '0 18px 42px rgba(0,0,0,0.45)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      textAlign: 'left',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: applyAlpha(visuals.accentColor1, 0.2),
      display: 'grid',
      placeItems: 'center',
      color: visuals.accentColor1,
      flexShrink: 0,
    },
    title: {
      margin: 0,
      fontSize: '1.35rem',
      fontWeight: 700,
    },
    body: {
      margin: 0,
      color: visuals.subtextColor,
      lineHeight: 1.5,
      fontSize: '0.95rem',
    },
    actions: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      marginTop: '4px',
    },
    primaryBtn: {
      padding: '10px 16px',
      borderRadius: 10,
      border: 'none',
      background: accentGradient,
      color: '#0A192F',
      fontWeight: 700,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    ghostBtn: {
      padding: '10px 16px',
      borderRadius: 10,
      border: `1px solid ${visuals.borderColor}`,
      background: 'transparent',
      color: visuals.textColor,
      fontWeight: 600,
      cursor: 'pointer',
    },
  };
};

export default function PracticeIaLockedModal({ open, onClose, onLogin, visuals }: Props) {
  const styles = useMemo(() => buildStyles(visuals), [visuals]);
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <Lock size={20} />
          </div>
          <h2 style={styles.title}>{t('practiceIaLocked.title')}</h2>
        </div>
        <p style={styles.body}>
          {t('practiceIaLocked.body')}
        </p>
        <div style={styles.actions}>
          <button style={styles.ghostBtn} onClick={onClose}>{t('common.back')}</button>
          {onLogin && (
            <button style={styles.primaryBtn} onClick={onLogin}>
              <LogIn size={16} /> {t('auth.signin')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
