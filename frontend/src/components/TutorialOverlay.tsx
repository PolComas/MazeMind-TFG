import React from 'react';
import { ArrowRight, CheckCircle, Target, Eye, Gamepad2, Zap } from 'lucide-react';
import { PALETTE } from './palette';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  step: number;
  onNext: () => void;
  onSkip: () => void;
};

// Passos del tutorial
export const tutorialSteps = [
  {
    titleKey: 'tutorial.step1.title',
    descriptionKey: 'tutorial.step1.body',
    icon: Target,
  },
  {
    titleKey: 'tutorial.step2.title',
    descriptionKey: 'tutorial.step2.body',
    icon: Eye,
  },
  {
    titleKey: 'tutorial.step3.title',
    descriptionKey: 'tutorial.step3.body',
    icon: Eye,
  },
  {
    titleKey: 'tutorial.step4.title',
    descriptionKey: 'tutorial.step4.body',
    icon: Gamepad2,
  },
  {
    titleKey: 'tutorial.step5.title',
    descriptionKey: 'tutorial.step5.body',
    icon: Zap,
  },
  {
    titleKey: 'tutorial.step6.title',
    descriptionKey: 'tutorial.step6.body',
    icon: CheckCircle,
  }
];

export default function TutorialOverlay({ step, onNext, onSkip }: Props) {
  const { t } = useLanguage();
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
            <div style={styles.stepCounter}>
              {t('tutorial.stepCounter.before')} {step + 1} {t('tutorial.stepCounter.middle')} {tutorialSteps.length}
            </div>
            <h2 style={styles.title}>{t(currentStep.titleKey)}</h2>
            <p style={styles.description}>{t(currentStep.descriptionKey)}</p>
          </div>
        </div>

        <div style={styles.progressBarTrack}>
          <div style={{ ...styles.progressBarFill, width: `${((step + 1) / tutorialSteps.length) * 100}%` }} />
        </div>

        <div style={styles.footer}>
          <button style={styles.skipButton} onClick={onSkip}>{t('tutorial.action.skip')}</button>
          <button style={styles.nextButton} onClick={onNext}>
            {isLastStep ? t('tutorial.action.start') : t('common.next')}
            {!isLastStep && <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
