import React from 'react';
import { ArrowRight, CheckCircle, Target, Eye, Gamepad2, Zap } from 'lucide-react';
import { PALETTE } from './palette';

type Props = {
  step: number;
  onNext: () => void;
  onSkip: () => void;
};

// Passos del tutorial
export const tutorialSteps = [
  {
    title: "Benvingut al Tutorial!",
    description: "Aprendrem junts com jugar a MazeMind. Prem 'Següent' per començar.",
    icon: Target,
  },
  {
    title: "Memoritza el Laberint",
    description: "Fixa't bé en el laberint. Les línies són parets que no pots travessar. Tu ets el cercle i el quadrat és la sortida.",
    icon: Eye,
  },
  {
    title: "Prepara't!",
    description: "En uns segons, les parets desapareixeran i hauràs de recordar el camí. Intenta visualitzar mentalment la ruta.",
    icon: Eye,
  },
  {
    title: "Ara et toca!",
    description: "Usa les Fletxes o les tecles WASD configurades per moure't. Les parets són invisibles però encara estan allà! Intenta arribar a la sortida.",
    icon: Gamepad2,
  },
  {
    title: "Ajudes Disponibles",
    description: "Si et perds, pots usar les ajudes del HUD: 'Revelar' (costa punts), 'Mostrar Camí' o 'Ajuda Xoc' (costen punts per temps/ús).",
    icon: Zap,
  },
  {
    title: "Tutorial Completat!",
    description: "Ja saps com jugar! Recorda que la pràctica fa el mestre. Prem 'Començar a Jugar!' per sortir del tutorial.",
    icon: CheckCircle,
  }
];

export default function TutorialOverlay({ step, onNext, onSkip }: Props) {
  const currentStep = tutorialSteps[step] || tutorialSteps[0];
  const Icon = currentStep.icon;
  const isLastStep = step === tutorialSteps.length - 1;

  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 100, display: 'grid', placeItems: 'center', padding: '16px',
    },
    card: {
      background: PALETTE.surface, color: PALETTE.text, borderRadius: '16px',
      border: `1px solid ${PALETTE.borderColor}`, maxWidth: '500px', width: '100%',
      padding: '24px', boxShadow: PALETTE.shadow,
    },
    header: { display: 'flex', alignItems: 'start', gap: '16px', marginBottom: '20px' },
    iconWrapper: {
      width: '50px', height: '50px',
      background: `linear-gradient(135deg, ${PALETTE.accentViolet}, ${PALETTE.accentBlue})`,
      borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
    },
    title: { fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0' },
    stepCounter: { fontSize: '0.8rem', color: PALETTE.subtext, marginBottom: '8px' },
    description: { fontSize: '1rem', color: PALETTE.subtext, margin: 0, lineHeight: 1.6 },
    progressBarTrack: { height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' },
    progressBarFill: {
        height: '100%',
        background: `linear-gradient(90deg, ${PALETTE.accentViolet}, ${PALETTE.accentBlue})`,
        transition: 'width 0.3s ease',
    },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    skipButton: { background: 'transparent', border: 'none', color: PALETTE.subtext, cursor: 'pointer', fontSize: '0.9rem' },
    nextButton: {
        background: `linear-gradient(90deg, ${PALETTE.accentViolet}, ${PALETTE.accentBlue})`,
        color: PALETTE.text, border: 'none', padding: '10px 16px', borderRadius: '8px',
        fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <Icon size={28} color="#fff" />
          </div>
          <div>
            <div style={styles.stepCounter}>Pas {step + 1} de {tutorialSteps.length}</div>
            <h2 style={styles.title}>{currentStep.title}</h2>
            <p style={styles.description}>{currentStep.description}</p>
          </div>
        </div>

        <div style={styles.progressBarTrack}>
          <div style={{ ...styles.progressBarFill, width: `${((step + 1) / tutorialSteps.length) * 100}%` }} />
        </div>

        <div style={styles.footer}>
          <button style={styles.skipButton} onClick={onSkip}>Saltar Tutorial</button>
          <button style={styles.nextButton} onClick={onNext}>
            {isLastStep ? 'Començar a Jugar!' : 'Següent'}
            {!isLastStep && <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}