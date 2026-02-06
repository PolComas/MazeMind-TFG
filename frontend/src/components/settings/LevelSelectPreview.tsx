
import React, { useState, useCallback } from 'react';
import type { VisualSettings } from '../../utils/settings';
import { ArrowLeft, Dumbbell, Zap, Flame, Lock, Star, Clock } from 'lucide-react';
import { PALETTE } from '../palette';
import NetworkBackground from '../NetworkBackground';
import { useLanguage } from '../../context/LanguageContext';

type Props = {
  settings: VisualSettings;
};

export default function LevelSelectPreview({ settings }: Props) {
  const { t } = useLanguage();
  type Diff = 'easy' | 'normal' | 'hard';
  const [difficulty, setDifficulty] = useState<Diff>('easy');

  const getDiffColor = useCallback((d: Diff) => {
    // Intentar llegir colors específics de la configuració si estan presents, sinó utilitzar accents o PALETTE
    const s: any = settings as any;
    if (d === 'easy') return s.easyColor || s.accentColor1 || PALETTE.easyGreen;
    if (d === 'normal') return s.normalColor || s.accentColor2 || PALETTE.normalYellow;
    return s.hardColor || s.accentColor2 || PALETTE.hardRed;
  }, [settings]);

  const styles: Record<string, React.CSSProperties> = {
    pagePreview: {
      background: 'transparent',
      color: settings.textColor,
      padding: '16px',
      borderRadius: '8px',
      height: '100%', width: '100%',
      display: 'flex', flexDirection: 'column',
      gap: '12px',
      overflow: 'hidden',
      position: 'relative',
      isolation: 'isolate',
      boxSizing: 'border-box',
    },
    headerPreview: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    backBtnPreview: {
      background: settings.surfaceColor,
      color: settings.textColor,
      border: `1px solid ${settings.borderColor} `,
      borderRadius: '8px', padding: '4px 6px',
      fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px'
    },
    titlePreview: { fontSize: '14px', fontWeight: 700, margin: 0 },
    diffBarPreview: {
      display: 'flex',
      background: settings.surfaceColor,
      borderRadius: '99px', padding: '4px',
      position: 'relative',
    },
    diffIndicatorPreview: {
      position: 'absolute', top: '4px', left: '4px',
      width: 'calc(50% - 4px)', height: 'calc(100% - 8px)',
      background: settings.easyColor,
      borderRadius: '99px', zIndex: 1,
    },
    diffTabPreview: {
      flex: 1, padding: '4px', fontSize: '10px',
      borderRadius: '99px', zIndex: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
    },
    gridPreview: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
    },
    cardPreview: {
      background: settings.surfaceColor,
      border: `1px solid ${settings.borderColor} `,
      borderRadius: '12px', padding: '4px', aspectRatio: '1/1',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-around', fontSize: '10px',
      transition: 'opacity 0.2s ease',
    },
    cardLocked: {
      opacity: 0.6,
      borderColor: settings.borderColor,
    },
    levelNumPreview: { fontSize: '18px', fontWeight: 700 },
    starsPreview: { display: 'flex', gap: '2px' },
    timePreview: { display: 'flex', gap: '4px', alignItems: 'center', fontSize: '10px', color: settings.subtextColor },
    playBtnPreview: {
      background: settings.easyColor,
      color: '#0B1021',
      fontSize: '10px', fontWeight: 600,
      padding: '4px 8px', borderRadius: '6px',
    },
    footerPreview: {
      marginTop: 'auto',
      display: 'flex', justifyContent: 'center'
    },
    practiceBtnPreview: {
      background: settings.surfaceColor,
      color: settings.textColor,
      border: `1px solid ${settings.borderColor} `,
      borderRadius: '8px', padding: '6px 10px',
      fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px'
    }
  };

  return (
    <div style={styles.pagePreview}>
      <NetworkBackground
        primaryColor={getDiffColor(difficulty) || settings.accentColor1}
        backgroundColor={settings.backgroundColor}
        opacity={0.4}
      />
      {/* Capçalera */}
      <div style={styles.headerPreview}>
        <div style={styles.backBtnPreview}><ArrowLeft size={12} /> {t('common.home')}</div>
        <h1 style={styles.titlePreview}>{t('levelSelect.title')}</h1>
        <div style={{ width: 40 }} />
      </div>

      {/* Barra de dificultat */}
      <div style={styles.diffBarPreview}>
        <div
          style={{
            ...styles.diffIndicatorPreview,
            left: difficulty === 'easy' ? '4px' : difficulty === 'normal' ? 'calc(33.333% + 4px)' : 'calc(66.666% + 4px)',
            width: 'calc(33.333% - 8px)',
            background: getDiffColor(difficulty),
          }}
        />
        {(['easy', 'normal', 'hard'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            style={{ ...styles.diffTabPreview, color: difficulty === d ? settings.textColor : settings.subtextColor, background: 'transparent', border: 'none' }}
          >
            {d === 'easy' ? <Dumbbell size={10} /> : d === 'normal' ? <Zap size={10} /> : <Flame size={10} />} {t(`difficulty.${d}`)}
          </button>
        ))}
      </div>

      {/* Graella de nivells */}
      <div style={styles.gridPreview}>
        {/* Card 1: Completat */}
        <div style={{ ...styles.cardPreview, borderColor: (getDiffColor(difficulty) || PALETTE.easyGreen) + '60' }}>
          <div style={styles.levelNumPreview}>1</div>
          <div style={styles.starsPreview}>
            <Star size={10} fill={'#FBBF24'} color={'#FBBF24'} />
            <Star size={10} fill={'#FBBF24'} color={'#FBBF24'} />
            <Star size={10} fill={'none'} color={settings.subtextColor + '80'} />
          </div>
          <div style={styles.timePreview}><Clock size={10} /> 0:45</div>
          <div style={{ ...styles.playBtnPreview, background: getDiffColor(difficulty) }} >{t('common.play')}</div>
        </div>

        {/* Card 2: Completat */}
        <div style={{ ...styles.cardPreview, borderColor: (getDiffColor(difficulty) || PALETTE.easyGreen) + '60' }}>
          <div style={styles.levelNumPreview}>2</div>
          <div style={styles.starsPreview}>
            <Star size={10} fill={'#FBBF24'} color={'#FBBF24'} />
            <Star size={10} fill={'none'} color={'#FBBF24'} />
            <Star size={10} fill={'none'} color={'#FBBF24'} />
          </div>
          <div style={styles.timePreview}><Clock size={10} /> 1:12</div>
          <div style={{ ...styles.playBtnPreview, background: getDiffColor(difficulty) }} >{t('common.play')}</div>
        </div>

        {/* Card 3: Bloquejat */}
        <div style={{ ...styles.cardPreview, ...styles.cardLocked }}>
          <div style={styles.levelNumPreview}>3</div>
          <Lock size={16} color={settings.subtextColor} />
        </div>

        {/* Card 4: Bloquejat */}
        <div style={{ ...styles.cardPreview, ...styles.cardLocked }}>
          <div style={styles.levelNumPreview}>4</div>
          <Lock size={16} color={settings.subtextColor} />
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footerPreview}>
        <div style={styles.practiceBtnPreview}>
          <Dumbbell size={12} /> {t('levelSelect.practice')}
        </div>
      </footer>
    </div>
  );
}
