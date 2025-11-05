import React from 'react';
import { X, Target, Trophy, Gamepad2, Star, Zap, Eye, Footprints, Skull, Dumbbell, Layers, Edit, GraduationCap, Info, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import { PALETTE } from './palette';
import { useSettings } from '../context/SettingsContext';

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

export default function HowToPlayModal({ open, onClose, onStartTutorial }: Props) {
  const { settings } = useSettings();
  const gameSettings = settings.game;

  if (!open) return null;

  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)',
      display: 'grid', placeItems: 'center', zIndex: 50, padding: '16px',
    },
    modalContent: {
      background: 'rgba(30, 41, 59, 1)',
      color: PALETTE.text,
      borderRadius: '16px', border: `1px solid ${PALETTE.borderColor}`,
      maxWidth: '700px', width: '100%',
      maxHeight: '90vh', overflowY: 'auto',
      boxShadow: PALETTE.shadow,
      position: 'relative',
    },
    header: {
      padding: '16px 24px', borderBottom: `1px solid ${PALETTE.borderColor}`,
      display: 'flex', alignItems: 'center', gap: '12px',
    },
    title: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },
    closeButton: {
      position: 'absolute', top: '12px', right: '12px',
      background: 'transparent', border: 'none', color: PALETTE.subtext,
      cursor: 'pointer', padding: '4px', borderRadius: '50%',
    },
    body: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
    section: { display: 'flex', flexDirection: 'column', gap: '12px' },
    sectionTitle: { fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
    card: { background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '16px', border: `1px solid ${PALETTE.borderColor}` },
    cardTitle: { fontWeight: 600, marginBottom: '8px' },
    cardText: { fontSize: '0.9rem', color: PALETTE.subtext, margin: 0 },
    stepItem: { display: 'flex', alignItems: 'start', gap: '12px' },
    stepNumber: {
        width: '32px', height: '32px', background: PALETTE.accentBlue + '30',
        borderRadius: '50%', display: 'grid', placeItems: 'center',
        fontWeight: 700, color: PALETTE.accentBlue, flexShrink: 0,
    },
    keyDisplay: {
        background: 'rgba(255, 255, 255, 0.1)', padding: '4px 8px',
        borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem',
    },
    starRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    controlsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
    },
    tutorialCard: {
        background: `linear-gradient(100deg, rgba(52, 211, 153, 0.1), rgba(103, 232, 249, 0.1))`,
        border: `1px solid ${PALETTE.easyGreen}`,
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
        background: `linear-gradient(135deg, ${PALETTE.easyGreen}, ${PALETTE.accentCyan})`,
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
        background: `linear-gradient(90deg, ${PALETTE.easyGreen}, ${PALETTE.accentCyan})`,
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
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose} aria-label="Tancar">
          <X size={24} />
        </button>
        <div style={styles.header}>
          <Target size={28} color={PALETTE.accentViolet} />
          <h2 style={styles.title}>Com Jugar a MazeMind</h2>
        </div>
        <div style={styles.body}>
          {/* Objectiu */}
          <section style={styles.section}>
            <div style={styles.card}>
                <h3 style={{...styles.sectionTitle, color: PALETTE.accentViolet, marginBottom: '8px'}}><Trophy size={20}/> Objectiu</h3>
                <p style={styles.cardText}>Entrena la teva memòria visoespacial navegant per laberints invisibles. Memoritza el camí, després troba la sortida sense veure les parets!</p>
            </div>
          </section>

          {/* Com jugar */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}><Gamepad2 size={20} color={PALETTE.accentBlue}/> Com Jugar</h3>
            <div style={styles.card}>
                <div style={styles.stepItem}>
                    <div style={styles.stepNumber}>1</div>
                    <div style={{flex: 1}}>
                        <h4 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}> Fase de Memorització</h4>
                        <p style={styles.cardText}>Veuràs el laberint complet durant uns segons. Memoritza el camí des de l'inici (cercle) fins a la sortida (quadrat).</p>
                    </div>
                </div>
            </div>
            <div style={styles.card}>
                <div style={styles.stepItem}>
                    <div style={styles.stepNumber}>2</div>
                    <div>
                        <h4 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>Les Parets Desapareixen</h4>
                        <p style={styles.cardText}>Quan acabi el temps, les parets es tornaran invisibles. Ara has de recordar el camí!</p>
                    </div>
                </div>
            </div>
             <div style={styles.card}>
                <div style={styles.stepItem}>
                    <div style={styles.stepNumber}>3</div>
                    <div>
                        <h4 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>Navega fins la Sortida</h4>
                        <p style={styles.cardText}>Usa les Fletxes o les tecles <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveUp)}</kbd> <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveLeft)}</kbd> <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveDown)}</kbd> <kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyMoveRight)}</kbd> per moure't.</p>
                    </div>
                </div>
            </div>
          </section>

          {/* NOU: Secció de Controls */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}><Gamepad2 size={20} color={PALETTE.easyGreen}/> Controls</h3>
            <div style={styles.card}>
                <div style={styles.controlsGrid}>
                    <div style={styles.controlItem}>
                        <kbd style={styles.keyDisplay}><ArrowUp size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveUp)}</kbd>
                        <span>  Amunt</span>
                    </div>
                    <div style={styles.controlItem}>
                        <kbd style={styles.keyDisplay}><ArrowDown size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveDown)}</kbd>
                        <span>  Avall</span>
                    </div>
                    <div style={styles.controlItem}>
                        <kbd style={styles.keyDisplay}><ArrowLeft size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveLeft)}</kbd>
                        <span>  Esquerra</span>
                    </div>
                    <div style={styles.controlItem}>
                        <kbd style={styles.keyDisplay}><ArrowRight size={12} style={{ marginBottom: -1 }} /> {formatKey(gameSettings.keyMoveRight)}</kbd>
                        <span>  Dreta</span>
                    </div>
                </div>
            </div>
          </section>

          {/* Sistema d'estrelles */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}><Star size={20} color={PALETTE.normalYellow}/> Sistema d'Estrelles</h3>
             <div style={styles.card}>
                <p style={styles.cardText}>Comences amb 1000 punts. Els punts disminueixen amb el temps i si uses ajudes. Les estrelles es basen en els punts finals:</p>
                <ul style={{ paddingLeft: '20px', listStyle: 'disc', color: PALETTE.subtext, fontSize: '0.9rem', marginTop: '8px' }}>
                    <li>★★★: 800+ punts</li>
                    <li>★★☆: 400-799 punts</li>
                    <li>★☆☆: 1-399 punts</li>
                </ul>
            </div>
          </section>

          {/* Ajudes */}
          <section style={styles.section}>
             <h3 style={styles.sectionTitle}><Zap size={20} color={PALETTE.accentPink}/> Ajudes Disponibles</h3>
             <div style={styles.card}>
                <div style={styles.stepItem}>
                    <Eye size={20} color={PALETTE.accentBlue} style={{flexShrink: 0}}/>
                    <div>
                        <h4 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>Revelar (<kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyHelpReveal)}</kbd>)</h4>
                        <p style={styles.cardText}>Mostra el laberint durant 0.5 segons. 3 usos per nivell. Cost: 50 punts.</p>
                    </div>
                </div>
             </div>
             <div style={styles.card}>
                <div style={styles.stepItem}>
                    <Footprints size={20} color={PALETTE.easyGreen} style={{flexShrink: 0}}/>
                    <div>
                        <h4 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>Mostrar Camí (<kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyHelpPath)}</kbd>)</h4>
                        <p style={styles.cardText}>Mostra el camí que has recorregut. Activable/desactivable. Cost: +2 punts/segon mentre està activat.</p>
                    </div>
                </div>
             </div>
             <div style={styles.card}>
                <div style={styles.stepItem}>
                    <Skull size={20} color={PALETTE.hardRed} style={{flexShrink: 0}}/>
                    <div>
                        <h4 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>Ajuda Xoc (<kbd style={styles.keyDisplay}>{formatKey(gameSettings.keyHelpCrash)}</kbd>)</h4>
                        <p style={styles.cardText}>Si xoques, mostra les parets properes. Activable/desactivable. Cost: 20 punts per xoc.</p>
                    </div>
                </div>
             </div>
          </section>

          {/* Modes */}
          <section style={styles.section}>
             <h3 style={styles.sectionTitle}><Layers size={20} /> Modes de Joc</h3>
             {/* Mode Clàssic */}
             <div style={styles.card}>
                <div style={styles.stepItem}>
                    <Target size={20} color={PALETTE.accentBlue} style={{flexShrink: 0}}/>
                    <div>
                        <h4 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>Clàssic</h4>
                        <p style={styles.cardText}>Supera els nivells predefinits en dificultats Fàcil, Normal i Difícil. Guanya estrelles i desbloqueja el següent nivell.</p>
                    </div>
                </div>
             </div>
             {/* Mode Pràctica */}
             <div style={styles.card}>
                <div style={styles.stepItem}>
                    <Dumbbell size={20} color={PALETTE.easyGreen} style={{flexShrink: 0}}/>
                    <div>
                        <h4 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>Pràctica IA</h4>
                        <p style={styles.cardText}>Entrena sense pressió. Juga laberints aleatoris adaptats al teu nivell a partir de la IA.</p>
                    </div>
                </div>
             </div>

             {/* Pràctica Normal/Score */}
             <div style={styles.card}>
                <div style={styles.stepItem}>
                    <TrendingUp size={20} color={PALETTE.normalYellow} style={{flexShrink: 0}}/>
                    <div>
                        <h4 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>Pràctica Score</h4>
                        <p style={styles.cardText}>Juga laberints aleatoris que van pujant de dificultat i consegueix la puntuació més alta (mida, temps).</p>
                    </div>
                </div>
             </div>

             {/* Mode Lliure */}
             <div style={styles.card}>
                <div style={styles.stepItem}>
                    <Edit size={20} color={PALETTE.normalYellow} style={{flexShrink: 0}}/>
                    <div>
                        <h4 style={{...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>Lliure / Creador</h4>
                        <p style={styles.cardText}>Defineix la mida del laberint, el temps de memorització, mode de dificultat i juga al teu gust.</p>
                    </div>
                </div>
             </div>
          </section>

          {/* Consells */}
           <section style={styles.section}>
             <h3 style={styles.sectionTitle}><Info size={20}/> Consells</h3>
             <div style={styles.card}>
                 <ul style={{ paddingLeft: '20px', listStyle: 'disc', color: PALETTE.subtext, fontSize: '0.9rem' }}>
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
            <div style={{flex: 1}}>
                <h3 style={{...styles.cardTitle, color: PALETTE.text, fontSize: '1.1rem', margin: 0}}>Primera vegada jugant?</h3>
                <p style={{...styles.cardText, color: PALETTE.subtext, fontSize: '0.9rem', margin: '4px 0 0 0'}}>Comença amb el següent tutorial guiat pas a pas i aprèn jugant.</p>
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