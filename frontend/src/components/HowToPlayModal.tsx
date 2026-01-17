import React, { useMemo } from 'react';
import { X, Target, Trophy, Gamepad2, Star, Zap, Eye, Footprints, Skull,
  Dumbbell, Layers, Edit, GraduationCap, Info, ArrowUp, ArrowDown, ArrowLeft,
  ArrowRight, TrendingUp,} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';

type Props = {
  open: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
};

// Helper per formatar tecles
const formatKey = (key: string) => {
  if (key === ' ') return 'Espai';
  if (key.length === 1) return key.toUpperCase();
  return key;
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
      position: 'fixed', inset: 0, background: applyAlpha(visuals.textColor, 0.75),
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
  const gameSettings = settings.game;
  const visualSettings = getVisualSettings('levelSelect');
  const { styles, colors } = useMemo(() => createStyles(visualSettings), [visualSettings]);

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose} aria-label="Tancar">
          <X size={24} />
        </button>
        <div style={styles.header}>
          <Target size={28} color={colors.accentSecondary} />
          <h2 style={styles.title}>Com Jugar a MazeMind</h2>
        </div>
        <div style={styles.body}>
          {/* Objectiu */}
          <section style={styles.section}>
            <div style={styles.card}>
              <h3 style={{ ...styles.sectionTitle, color: colors.accentSecondary, marginBottom: '8px' }}><Trophy size={20} /> Objectiu</h3>
              <p style={styles.cardText}>Entrena la teva memòria visoespacial navegant per laberints invisibles. Memoritza el camí, després troba la sortida sense veure les parets!</p>
            </div>
          </section>

          {/* Com jugar */}
          <section style={styles.section}>
            <h3 style={{ ...styles.sectionTitle, color: colors.accentPrimary }}><Gamepad2 size={20} color={colors.accentPrimary} /> Com Jugar</h3>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>1</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}> Fase de Memorització</h4>
                  <p style={styles.cardText}>
                    Veuràs el laberint complet durant uns segons. Memoritza el camí des de l'inici (cercle) fins a la sortida (quadrat).
                    Pots saltar aquesta fase amb <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keySkipMemorize)}</kbd>.
                  </p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>2</div>
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>Les Parets Desapareixen</h4>
                  <p style={styles.cardText}>Quan acabi el temps, les parets es tornaran invisibles. Ara has de recordar el camí!</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>3</div>
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>Navega fins la Sortida</h4>
                  <p style={styles.cardText}>
                    Usa les Fletxes o les tecles {' '}
                    <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveUp)}</kbd>{' '}
                    <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveLeft)}</kbd>{' '}
                    <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveDown)}</kbd>{' '}
                    <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveRight)}</kbd> per moure't.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* NOU: Secció de Controls */}
          <section style={styles.section}>
            <h3 style={{ ...styles.sectionTitle, color: colors.successColor }}><Gamepad2 size={20} color={colors.successColor} /> Controls</h3>
            <div style={styles.card}>
              <div style={styles.controlsGrid}>
                <div style={styles.controlItem}>
                  <kbd style={styles.keyDisplay}><ArrowUp size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveUp)}</kbd>
                  <span>Amunt</span>
                </div>
                <div style={styles.controlItem}>
                  <kbd style={styles.keyDisplay}><ArrowDown size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveDown)}</kbd>
                  <span>Avall</span>
                </div>
                <div style={styles.controlItem}>
                  <kbd style={styles.keyDisplay}><ArrowLeft size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveLeft)}</kbd>
                  <span>Esquerra</span>
                </div>
                <div style={styles.controlItem}>
                  <kbd style={styles.keyDisplay}><ArrowRight size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveRight)}</kbd>
                  <span>Dreta</span>
                </div>
                <div style={styles.controlItem}>
                  <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keySkipMemorize)}</kbd>
                  <span>Saltar memorització</span>
                </div>
              </div>
            </div>
          </section>

          {/* Sistema d'estrelles */}
          <section style={styles.section}>
            <h3 style={{ ...styles.sectionTitle, color: colors.warningColor }}><Star size={20} color={colors.warningColor} /> Sistema d'Estrelles</h3>
            <div style={styles.card}>
              <p style={styles.cardText}>Comences amb 1000 punts. Els punts disminueixen amb el temps i si uses ajudes. Les estrelles es basen en els punts finals:</p>
              <ul style={styles.list}>
                <li>★★★: 800+ punts</li>
                <li>★★☆: 400-799 punts</li>
                <li>★☆☆: 1-399 punts</li>
              </ul>
            </div>
          </section>

          {/* Ajudes */}
          <section style={styles.section}>
            <h3 style={{ ...styles.sectionTitle, color: colors.accentPrimary }}><Zap size={20} color={colors.accentPrimary} /> Ajudes Disponibles</h3>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Eye size={20} color={colors.accentPrimary} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    Revelar (<kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyHelpReveal)}</kbd>)
                  </h4>
                  <p style={styles.cardText}>Mostra el laberint durant 0.5 segons. 3 usos per nivell. Cost: 50 punts.</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Footprints size={20} color={colors.successColor} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    Mostrar Camí (<kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyHelpPath)}</kbd>)
                  </h4>
                  <p style={styles.cardText}>Mostra el camí que has recorregut. Activable/desactivable. Cost: +2 punts/segon mentre està activat.</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Skull size={20} color={colors.dangerColor} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    Ajuda Xoc (<kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyHelpCrash)}</kbd>)
                  </h4>
                  <p style={styles.cardText}>Si xoques, mostra les parets properes. Activable/desactivable. Cost: 20 punts per xoc.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Modes */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}><Layers size={20} /> Modes de Joc</h3>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Target size={20} color={colors.accentPrimary} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>Clàssic</h4>
                  <p style={styles.cardText}>Supera els nivells predefinits en dificultats Fàcil, Normal i Difícil. Guanya estrelles i desbloqueja el següent nivell.</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Dumbbell size={20} color={colors.successColor} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>Pràctica IA</h4>
                  <p style={styles.cardText}>Entrena sense pressió. Juga laberints aleatoris adaptats al teu nivell a partir de la IA.</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <TrendingUp size={20} color={colors.warningColor} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>Pràctica Score</h4>
                  <p style={styles.cardText}>Juga laberints aleatoris que van pujant de dificultat i consegueix la puntuació més alta (mida, temps).</p>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.stepItem}>
                <Edit size={20} color={colors.accentSecondary} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>Lliure / Creador</h4>
                  <p style={styles.cardText}>Defineix la mida del laberint, el temps de memorització, mode de dificultat i juga al teu gust.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Consells */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}><Info size={20} /> Consells</h3>
            <div style={styles.card}>
              <ul style={styles.list}>
                <li>Centra't en recordar els girs principals.</li>
                <li>Visualitza mentalment el recorregut mentre memoritzes.</li>
                <li>No tinguis por d'utilitzar les ajudes al principi.</li>
              </ul>
            </div>
          </section>

          {/* Botó Tutorial */}
          <div style={styles.tutorialCard}>
            <div style={styles.tutorialIconWrapper}>
              <GraduationCap size={32} color="#fff" />
            </div>
            <div style={styles.tutorialContent}>
              <h3 style={{ ...styles.cardTitle, fontSize: '1.1rem', margin: 0 }}>Primera vegada jugant?</h3>
              <p style={{ ...styles.cardText, fontSize: '0.9rem', margin: '4px 0 0 0' }}>Comença amb el següent tutorial guiat pas a pas i aprèn jugant.</p>
            </div>
            <button style={styles.tutorialButton} onClick={() => { onClose(); onStartTutorial(); }}>
              <GraduationCap size={18} /> Començar Tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
