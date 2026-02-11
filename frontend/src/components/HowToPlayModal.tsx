import React, { useEffect, useMemo, useRef } from 'react';
import {
  X, Target, Trophy, Gamepad2, Star, Zap, Eye, Footprints, Skull,
  Dumbbell, Layers, Edit, GraduationCap, Info, ArrowUp, ArrowDown, ArrowLeft,
  ArrowRight, TrendingUp,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';
import { useLanguage } from '../context/LanguageContext';
import { useFocusTrap } from '../utils/focusTrap';

type Props = {
  open: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
};

const createStyles = (visuals: VisualSettings) => {
  const accentPrimary = visuals.accentColor1;
  const accentSecondary = visuals.accentColor2;
  const successColor = visuals.easyColor;
  const warningColor = visuals.normalColor;
  const dangerColor = visuals.hardColor;
  const cardBackground = applyAlpha(visuals.textColor, 0.06);
  const keyBackground = applyAlpha(visuals.textColor, 0.16);

  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)',
      display: 'grid', placeItems: 'center', zIndex: 50, padding: '16px',
      backdropFilter: 'blur(8px)',
    },
    modalContent: {
      background: visuals.surfaceColor,
      color: visuals.textColor,
      borderRadius: '16px', border: `1px solid ${visuals.borderColor}`,
      maxWidth: '700px', width: '100%',
      maxHeight: '90vh', overflowY: 'auto',
      boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
      position: 'relative',
    },
    header: {
      padding: '16px 24px', borderBottom: `1px solid ${visuals.borderColor}`,
      display: 'flex', alignItems: 'center', gap: '12px',
    },
    title: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },
    closeButton: {
      position: 'absolute', top: '12px', right: '12px',
      background: 'transparent', border: 'none', color: visuals.subtextColor,
      cursor: 'pointer', padding: '4px', borderRadius: '50%',
    },
    body: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
    section: { display: 'flex', flexDirection: 'column', gap: '12px' },
    sectionTitle: { fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: visuals.textColor },
    card: { background: cardBackground, borderRadius: '8px', padding: '16px', border: `1px solid ${visuals.borderColor}` },
    cardTitle: { fontWeight: 600, marginBottom: '8px', color: visuals.textColor },
    cardText: { fontSize: '0.9rem', color: visuals.subtextColor, margin: 0 },
    stepItem: { display: 'flex', alignItems: 'start', gap: '12px' },
    stepNumber: {
      width: '32px', height: '32px', background: applyAlpha(accentPrimary, 0.2),
      borderRadius: '50%', display: 'grid', placeItems: 'center',
      fontWeight: 700, color: accentPrimary, flexShrink: 0,
    },
    keyDisplay: {
      background: keyBackground, padding: '4px 8px',
      borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem',
    },
    starRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    controlsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
    },
    controlItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    tutorialCard: {
      background: `linear-gradient(100deg, ${applyAlpha(successColor, 0.15)}, ${applyAlpha(accentSecondary, 0.15)})`,
      border: `1px solid ${successColor}`,
      padding: '20px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      textAlign: 'left',
    },
    tutorialIconWrapper: {
      width: '64px',
      height: '64px',
      background: `linear-gradient(135deg, ${successColor}, ${accentSecondary})`,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
    },
    tutorialContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    tutorialButton: {
      background: `linear-gradient(90deg, ${successColor}, ${accentSecondary})`,
      color: '#0A192F',
      border: 'none',
      padding: '10px 16px',
      borderRadius: '8px',
      fontSize: '0.9rem',
      fontWeight: 700,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    },
    list: { paddingLeft: '20px', listStyle: 'disc', color: visuals.subtextColor, fontSize: '0.9rem', marginTop: '8px' },
  };

  return {
    styles,
    colors: {
      accentPrimary,
      accentSecondary,
      successColor,
      warningColor,
      dangerColor,
    },
  };
};

export default function HowToPlayModal({ open, onClose, onStartTutorial }: Props) {
  const { settings, getVisualSettings } = useSettings();
  const { t } = useLanguage();
  const gameSettings = settings.game;
  const visualSettings = getVisualSettings('levelSelect');
  const { styles, colors } = useMemo(() => createStyles(visualSettings), [visualSettings]);
  const modalRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, modalRef);
  const formatKey = (key: string) => {
    if (key === ' ') return t('keys.space');
    if (key.length === 1) return key.toUpperCase();
    return key;
  };

  useEffect(() => {
    if (!open) return;
    const closeKey = (settings.game.keyCloseModal || '').toLowerCase();
    if (!closeKey) return;

    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === settings.game.keyCloseModal || key === closeKey) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, settings.game.keyCloseModal, onClose]);

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div ref={modalRef} style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose} aria-label={t('common.close')}>
          <X size={24} />
        </button>
        <div style={styles.header}>
          <Target size={28} color={colors.accentSecondary} />
          <h2 style={styles.title}>{t('howto.title')}</h2>
        </div>
        <div style={styles.body}>
          {/* Objectiu */}
          <section style={styles.section}>
            <div style={styles.card}>
              <h3 style={{ ...styles.sectionTitle, color: colors.accentSecondary, marginBottom: '8px' }}><Trophy size={20} /> {t('howto.goal.title')}</h3>
              <p style={styles.cardText}>{t('howto.goal.body')}</p>
            </div>
          </section>

          {/* Com jugar */}
          <section style={styles.section}>
            <h3 style={{ ...styles.sectionTitle, color: colors.accentPrimary }}><Gamepad2 size={20} color={colors.accentPrimary} /> {t('howto.how.title')}</h3>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>1</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}> {t('howto.step1.title')}</h4>
                  <p style={styles.cardText}>
                    {t('howto.step1.body.before')}
                    <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keySkipMemorize)}</kbd>
                    {t('howto.step1.body.after')}
                  </p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>2</div>
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>{t('howto.step2.title')}</h4>
                  <p style={styles.cardText}>{t('howto.step2.body')}</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>3</div>
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>{t('howto.step3.title')}</h4>
                  <p style={styles.cardText}>
                    {t('howto.step3.body.before')}{' '}
                    <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveUp)}</kbd>{' '}
                    <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveLeft)}</kbd>{' '}
                    <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveDown)}</kbd>{' '}
                    <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveRight)}</kbd>{' '}
                    {t('howto.step3.body.after')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* NOU: Secció de Controls */}
          <section style={styles.section}>
            <h3 style={{ ...styles.sectionTitle, color: colors.successColor }}><Gamepad2 size={20} color={colors.successColor} /> {t('howto.controls.title')}</h3>
            <div style={styles.card}>
              <div style={styles.controlsGrid}>
                <div style={styles.controlItem}>
                  <kbd style={styles.keyDisplay}><ArrowUp size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveUp)}</kbd>
                  <span>{t('howto.controls.up')}</span>
                </div>
                <div style={styles.controlItem}>
                  <kbd style={styles.keyDisplay}><ArrowDown size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveDown)}</kbd>
                  <span>{t('howto.controls.down')}</span>
                </div>
                <div style={styles.controlItem}>
                  <kbd style={styles.keyDisplay}><ArrowLeft size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveLeft)}</kbd>
                  <span>{t('howto.controls.left')}</span>
                </div>
                <div style={styles.controlItem}>
                  <kbd style={styles.keyDisplay}><ArrowRight size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveRight)}</kbd>
                  <span>{t('howto.controls.right')}</span>
                </div>
                <div style={styles.controlItem}>
                  <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keySkipMemorize)}</kbd>
                  <span>{t('howto.controls.skip')}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Sistema d'estrelles */}
          <section style={styles.section}>
            <h3 style={{ ...styles.sectionTitle, color: colors.warningColor }}><Star size={20} color={colors.warningColor} /> {t('howto.stars.title')}</h3>
            <div style={styles.card}>
              <p style={styles.cardText}>{t('howto.stars.body')}</p>
              <ul style={styles.list}>
                <li>{t('howto.stars.line1')}</li>
                <li>{t('howto.stars.line2')}</li>
                <li>{t('howto.stars.line3')}</li>
              </ul>
            </div>
          </section>

          {/* Ajudes */}
          <section style={styles.section}>
            <h3 style={{ ...styles.sectionTitle, color: colors.accentPrimary }}><Zap size={20} color={colors.accentPrimary} /> {t('howto.help.title')}</h3>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Eye size={20} color={colors.accentPrimary} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    {t('howto.help.reveal.title')} (<kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyHelpReveal)}</kbd>)
                  </h4>
                  <p style={styles.cardText}>{t('howto.help.reveal.body')}</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Footprints size={20} color={colors.successColor} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    {t('howto.help.path.title')} (<kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyHelpPath)}</kbd>)
                  </h4>
                  <p style={styles.cardText}>{t('howto.help.path.body')}</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Skull size={20} color={colors.dangerColor} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    {t('howto.help.crash.title')} (<kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyHelpCrash)}</kbd>)
                  </h4>
                  <p style={styles.cardText}>{t('howto.help.crash.body')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Modes */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}><Layers size={20} /> {t('howto.modes.title')}</h3>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Target size={20} color={colors.accentPrimary} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>{t('howto.modes.classic.title')}</h4>
                  <p style={styles.cardText}>{t('howto.modes.classic.body')}</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Dumbbell size={20} color={colors.successColor} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>{t('howto.modes.ai.title')}</h4>
                  <p style={styles.cardText}>{t('howto.modes.ai.body')}</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <TrendingUp size={20} color={colors.warningColor} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>{t('howto.modes.score.title')}</h4>
                  <p style={styles.cardText}>{t('howto.modes.score.body')}</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Edit size={20} color={colors.accentSecondary} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>{t('howto.modes.free.title')}</h4>
                  <p style={styles.cardText}>{t('howto.modes.free.body')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Consells */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}><Info size={20} /> {t('howto.tips.title')}</h3>
            <div style={styles.card}>
              <ul style={styles.list}>
                <li>{t('howto.tips.line1')}</li>
                <li>{t('howto.tips.line2')}</li>
                <li>{t('howto.tips.line3')}</li>
              </ul>
            </div>
          </section>

          {/* Botó Tutorial */}
          <div style={styles.tutorialCard}>
            <div style={styles.tutorialIconWrapper}>
              <GraduationCap size={32} color="#fff" />
            </div>
            <div style={styles.tutorialContent}>
              <h3 style={{ ...styles.cardTitle, fontSize: '1.1rem', margin: 0 }}>{t('howto.tutorial.title')}</h3>
              <p style={{ ...styles.cardText, fontSize: '0.9rem', margin: '4px 0 0 0' }}>{t('howto.tutorial.body')}</p>
            </div>
            <button style={styles.tutorialButton} onClick={() => { onClose(); onStartTutorial(); }}>
              <GraduationCap size={18} /> {t('howto.tutorial.action')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
