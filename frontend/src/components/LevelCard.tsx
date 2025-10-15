import React from 'react';
import { PALETTE } from './palette'; 

type Props = {
  index: number;
  unlocked: boolean;
  difficulty: string; 
  onPlay: () => void;
};

export default function LevelCard({ index, unlocked, difficulty, onPlay }: Props) {
  // Creem etiquetes descriptives per a lectors de pantalla
  const accessiblePlayLabel = `Jugar el nivell ${index} en dificultat ${difficulty}`;
  const accessibleLockedLabel = `Nivell ${index} (Bloquejat)`;

  return (
    // Apliquem estils i atributs segons l'estat 'unlocked'
    <div
      style={{
        ...styles.card,
        ...(!unlocked ? styles.cardLocked : {}),
      }}
      aria-label={unlocked ? `Nivell ${index}` : accessibleLockedLabel}
      aria-disabled={!unlocked}
    >
      <div style={styles.cardInner}>
        {/* Amaguem l'emoji decoratiu */}
        <div style={styles.badge} aria-hidden="true">🧩</div>
        <div style={styles.levelNum}>{index}</div>

        {unlocked ? (
          <>
            <div style={styles.stars} aria-hidden="true">☆ ☆ ☆</div>
            <button 
              style={styles.playBtn} 
              onClick={onPlay}
              aria-label={accessiblePlayLabel}
            >
              <span aria-hidden="true">▶</span> Jugar
            </button>
          </>
        ) : (
          <div style={styles.lockedIcon}>
            <span aria-hidden="true">🔒</span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    // Targeta base amb fons, vora, radi i ombra
    background: PALETTE.surface,
    border: PALETTE.borderColor,
    borderRadius: 16,
    padding: 8,
    width: '100%',
    aspectRatio: '1/1', 
    boxShadow: PALETTE.shadow,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardLocked: {
    // Estils per a la targeta bloquejada: fons fosc i opacitat reduïda
    background: 'rgba(0,0,0,0.2)',
    boxShadow: 'none',
    opacity: 0.6,
  },
  cardInner: {
    // Contenidor interior amb gradient i flexbox vertical
    height: '100%',
    borderRadius: 12,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'clamp(8px, 2vw, 12px)',
  },
  badge: {
    // Insígnia decorativa amb fons translúcid i forma rodona
    background: 'rgba(255,255,255,.1)',
    borderRadius: '999px',
    padding: '4px 8px',
    fontSize: 16,
    lineHeight: 1,
  },
  levelNum: { 
    // Número del nivell amb font gran i negreta
    fontSize: 32, fontWeight: 800, color: PALETTE.text 
  },
  stars: { 
    // Estrelles decoratives amb color secundari
    color: PALETTE.subtext, fontSize: 14 
  },
  playBtn: {
    // Botó "Jugar" amb gradient i transició
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    borderRadius: 10,
    background: `linear-gradient(90deg, ${PALETTE.accentBlue}, #844BFF)`,
    color: PALETTE.text,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 16,
    transition: 'transform 0.1s ease',
  },
  lockedIcon: {
    // Icona de bloqueig centrada amb flex-grow
    flexGrow: 1,
    display: 'grid',
    placeItems: 'center',
    fontSize: 28,
  },
};