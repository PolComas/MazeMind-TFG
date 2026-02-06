import React, { useMemo } from 'react';
import type { VisualSettings } from '../../utils/settings';
import { Eye, Footprints, ArrowLeft, RefreshCw } from 'lucide-react';
import MazeCanvas from '../../components/MazeCanvas';
import NetworkBackground from '../NetworkBackground';
import type { Level } from '../../maze/maze_generator';
import previewLevelData from '../../levels/easy-level-1.json';
import { useLanguage } from '../../context/LanguageContext';

type Props = {
  settings: VisualSettings;
};

const previewLevel = previewLevelData as Level;

const previewPlayerPos = { x: 2, y: 2 };
const previewPath = [
  { x: 0, y: 0 }, // Inici
  { x: 1, y: 0 }, // dreta
  { x: 1, y: 1 }, // baix
  { x: 0, y: 1 }, // esquerra
  { x: 0, y: 2 }, // baix
  { x: 1, y: 2 }, // dreta
  { x: 2, y: 2 }, // dreta
];
export default function LevelScreenPreview({ settings }: Props) {
  const { t } = useLanguage();
  const styles: Record<string, React.CSSProperties> = useMemo(() => ({
    pagePreview: {
      background: 'transparent',
      color: settings.textColor,
      padding: '16px',
      borderRadius: '8px',
      height: '100%', width: '100%',
      display: 'flex', flexDirection: 'column',
      gap: '10px',
      overflow: 'hidden',
      position: 'relative',
      isolation: 'isolate',
      boxSizing: 'border-box',
    },
    // Capçalera
    headerPreview: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: '10px', flexShrink: 0,
    },
    headerBtn: {
      background: settings.surfaceColor,
      color: settings.textColor,
      border: `1px solid ${settings.borderColor}`,
      borderRadius: '6px', padding: '4px 6px',
      display: 'flex', alignItems: 'center', gap: '4px',
    },
    headerTitle: { fontSize: '14px', fontWeight: 700, margin: 0 },

    // Panell Memoritzar
    memorizePanel: {
      background: `linear-gradient(90deg, ${settings.accentColor1}, ${settings.accentColor2})`,
      borderRadius: '8px', padding: '8px 12px', textAlign: 'center',
      flexShrink: 0,
    },
    memorizeTitle: { fontSize: '12px', fontWeight: 600, margin: 0, opacity: 0.9 },
    memorizeTime: { fontSize: '24px', fontWeight: 800, margin: '2px 0' },

    // HUD
    hudPreview: { display: 'flex', gap: '6px', flexShrink: 0 },
    hudCard: {
      background: settings.surfaceColor,
      border: `1px solid ${settings.borderColor}`,
      borderRadius: '8px', padding: '6px 8px', flex: 1,
    },
    hudLabel: { fontSize: '10px', color: settings.subtextColor, marginBottom: '2px' },
    hudValue: { fontSize: '14px', fontWeight: 700 },
    helpButton: {
      background: 'rgba(255,255,255,0.1)',
      border: `1px solid ${settings.borderColor}`,
      color: settings.subtextColor,
      borderRadius: '6px', padding: '4px', fontSize: '10px',
      display: 'flex', gap: '4px', alignItems: 'center'
    },
    helpActive: {
      background: settings.easyColor,
      color: '#000',
      borderColor: 'transparent'
    },

    // Laberint
    mazeWrap: {
      flexGrow: 1, minHeight: 0,
      background: settings.mazePathColor,
      border: `1px solid ${settings.borderColor}`,
      borderRadius: '8px',
      position: 'relative',
      overflow: 'hidden',
    },
  }), [settings]);

  return (
    <div style={styles.pagePreview}>
      <NetworkBackground
        primaryColor={settings.accentColor1}
        backgroundColor={settings.backgroundColor}
        opacity={0.4}
      />
      {/* Capçalera */}
      <div style={styles.headerPreview}>
        <div style={styles.headerBtn}><ArrowLeft size={10} /> {t('home.levels')}</div>
        <h1 style={styles.headerTitle}>{t('common.level')} {previewLevel.number}</h1>
        <div style={styles.headerBtn}><RefreshCw size={10} /> {t('common.retry')}</div>
      </div>

      {/* Panell Memoritzar */}
      <div style={styles.memorizePanel}>
        <h2 style={styles.memorizeTitle}>👁️ {t('level.memorize.title')}</h2>
        <div style={styles.memorizeTime}>{previewLevel.memorizeTime}</div>
      </div>

      {/* HUD (mostrar només 2 targetes) */}
      <div style={styles.hudPreview}>
        <div style={styles.hudCard}>
          <div style={styles.hudLabel}>⏱ {t('hud.time')}</div>
          <div style={styles.hudValue}>0:00</div>
        </div>
        <div style={styles.hudCard}>
          <div style={styles.hudLabel}>⭐️ {t('hud.objective')}</div>
          <div style={styles.hudValue}>1000</div>
        </div>
        <div style={{ ...styles.hudCard, padding: '6px', display: 'flex', gap: '4px' }}>
          <div style={{ ...styles.helpButton, ...styles.helpActive }}><Eye size={10} /></div>
          <div style={styles.helpButton}><Footprints size={10} /></div>
        </div>
      </div>

      {/* Laberint real (preview no jugable) */}
      <div style={styles.mazeWrap}>
        <MazeCanvas
          level={previewLevel}
          phase={'playing'}
          playerPos={previewPlayerPos}
          showReveal={true}
          showPlayerPath={true}
          forcePathHistory={previewPath}
          settings={{
            path_color: settings.mazePathColor,
            wall_color: settings.mazeWallColor,
            wall_thickness: settings.mazeWallThickness,
            exit_color: settings.mazeExitColor,
            player_color: settings.mazePlayerColor,
            player_path_color: settings.playerPathColor,
            crash_help_color: settings.crashHelpColor,
          }}
        />
      </div>
    </div>
  );
}
