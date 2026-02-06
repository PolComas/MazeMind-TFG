import { useMemo, useState } from 'react';
import MazeCanvas from '../components/MazeCanvas';
import { downloadJSON } from '../maze/save_maze';
import { generateLevel, type Diff, type Level } from '../maze/maze_generator';
import { analyzeLevel, type MazeAnalysis, getTurnPositions } from '../maze/maze_stats';
import { useSettings } from '../context/SettingsContext';
import { PALETTE } from '../components/palette';
import { useLanguage } from '../context/LanguageContext';

type FormState = {
  width: number;
  height: number;
  difficulty: Diff;
  memorizeTime: number;
  levelNumber: number;
};

const sanitizeInt = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

const createLevelFromForm = (form: FormState) =>
  generateLevel({
    levelNumber: sanitizeInt(form.levelNumber, 1, 999),
    difficulty: form.difficulty,
    width: sanitizeInt(form.width, 3, 50),
    height: sanitizeInt(form.height, 3, 50),
    memorizeTime: sanitizeInt(form.memorizeTime, 1, 120),
    stars: [60, 45, 30],
  });

const cleanLevel = (level: Level) => ({
  ...level,
  maze: level.maze.map((row) => row.map((cell) => ({ walls: cell.walls }))),
});

export default function MazeGeneratorScreen({ onBack }: { onBack: () => void }) {
  const { getVisualSettings } = useSettings();
  const { t } = useLanguage();
  const visuals = getVisualSettings('levelSelect');

  const [form, setForm] = useState<FormState>({
    width: 7,
    height: 7,
    difficulty: 'easy',
    memorizeTime: 10,
    levelNumber: 1,
  });

  const [level, setLevel] = useState<Level>(() => createLevelFromForm({
    width: 7,
    height: 7,
    difficulty: 'easy',
    memorizeTime: 10,
    levelNumber: 1,
  }));

  const analysis = useMemo<MazeAnalysis>(() => analyzeLevel(level), [level]);
  const turnPositions = useMemo(() => getTurnPositions(analysis.pathCells), [analysis]);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const regenerate = () => {
    setForm((prev) => {
      const normalized: FormState = {
        width: sanitizeInt(prev.width, 3, 50),
        height: sanitizeInt(prev.height, 3, 50),
        difficulty: prev.difficulty,
        memorizeTime: sanitizeInt(prev.memorizeTime, 1, 120),
        levelNumber: sanitizeInt(prev.levelNumber, 1, 999),
      };
      setLevel(createLevelFromForm(normalized));
      return normalized;
    });
  };

  const handleDownload = () => {
    const filename = `${level.difficulty}-lab-${level.number}-${level.width}x${level.height}.json`;
    downloadJSON(cleanLevel(level), filename);
  };

  const stats = [
    { label: t('mazeLab.stats.size'), value: `${analysis.width} x ${analysis.height} (${analysis.totalCells} ${t('mazeLab.stats.cells')})` },
    { label: t('mazeLab.stats.optimalPath'), value: `${analysis.optimalPathLength} ${t('mazeLab.stats.steps')}` },
    { label: t('mazeLab.stats.turns'), value: analysis.optimalPathTurns },
    {
      label: t('mazeLab.stats.intersections'),
      value: `${analysis.intersections} (${(analysis.intersectionDensity * 100).toFixed(1)}% ${t('mazeLab.stats.density')})`,
    },
    { label: t('mazeLab.stats.deadEnds'), value: analysis.deadEnds },
    { label: t('mazeLab.stats.pathCells'), value: `${analysis.pathCells.length} ${t('mazeLab.stats.cells')}` },
  ];

  const styles = useMemo(() => ({
    page: {
      minHeight: '100svh',
      background: visuals.backgroundColor,
      color: visuals.textColor,
      padding: 'clamp(16px, 4vw, 32px)',
      boxSizing: 'border-box' as const,
    },
    container: {
      maxWidth: 1100,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 20,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap' as const,
    },
    title: {
      margin: 0,
      fontSize: 'clamp(22px, 4vw, 30px)',
    },
    backBtn: {
      padding: '10px 14px',
      borderRadius: 12,
      border: `1px solid ${visuals.borderColor}`,
      background: visuals.surfaceColor,
      color: visuals.textColor,
      cursor: 'pointer',
      minWidth: 96,
    },
    actions: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap' as const,
    },
    primaryBtn: {
      padding: '10px 14px',
      borderRadius: 10,
      border: 'none',
      background: `linear-gradient(90deg, ${visuals.accentColor1}, ${visuals.accentColor2})`,
      color: '#0B1021',
      fontWeight: 700,
      cursor: 'pointer',
    },
    surface: {
      background: visuals.surfaceColor,
      border: `1px solid ${visuals.borderColor}`,
      borderRadius: 16,
      padding: '16px',
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 12,
    },
    label: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 6,
      fontWeight: 600,
      color: visuals.subtextColor,
      fontSize: 14,
    },
    input: {
      padding: '10px 12px',
      borderRadius: 10,
      border: `1px solid ${visuals.borderColor}`,
      background: 'rgba(255,255,255,0.04)',
      color: visuals.textColor,
      fontSize: 15,
    },
    canvasWrapper: {
      display: 'grid',
      gridTemplateColumns: 'minmax(280px, 1.1fr) minmax(240px, 0.9fr)',
      gap: 16,
      alignItems: 'stretch',
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 12,
    },
    statCard: {
      background: visuals.surfaceColor,
      border: `1px solid ${visuals.borderColor}`,
      borderRadius: 12,
      padding: '12px 14px',
    },
    pathPreview: {
      background: visuals.surfaceColor,
      border: `1px solid ${visuals.borderColor}`,
      borderRadius: 12,
      padding: 12,
      maxHeight: 180,
      overflow: 'auto',
      fontFamily: 'monospace',
      fontSize: 12,
      lineHeight: 1.4,
      whiteSpace: 'pre-wrap' as const,
    },
  }), [visuals]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <button style={styles.backBtn} onClick={onBack}>
            ← {t('common.back')}
          </button>
          <h1 style={styles.title}>{t('mazeLab.title')}</h1>
          <div style={styles.actions}>
            <button style={styles.primaryBtn} onClick={regenerate}>
              {t('mazeLab.generate')}
            </button>
            <button style={{ ...styles.primaryBtn, background: PALETTE.normalYellow, color: '#0B1021' }} onClick={handleDownload}>
              {t('mazeLab.download')}
            </button>
          </div>
        </header>

        <section style={styles.surface}>
          <div style={styles.formRow}>
            <label style={styles.label}>
              {t('mazeLab.form.width')}
              <input
                style={styles.input}
                type="number"
                min={3}
                max={50}
                value={form.width}
                onChange={(e) => handleChange('width', Number(e.target.value))}
              />
            </label>
            <label style={styles.label}>
              {t('mazeLab.form.height')}
              <input
                style={styles.input}
                type="number"
                min={3}
                max={50}
                value={form.height}
                onChange={(e) => handleChange('height', Number(e.target.value))}
              />
            </label>
            <label style={styles.label}>
              {t('mazeLab.form.difficulty')}
              <select
                style={styles.input}
                value={form.difficulty}
                onChange={(e) => handleChange('difficulty', e.target.value as Diff)}
              >
                <option value="easy">{t('difficulty.easy')}</option>
                <option value="normal">{t('difficulty.normal')}</option>
                <option value="hard">{t('difficulty.hard')}</option>
              </select>
            </label>
            <label style={styles.label}>
              {t('mazeLab.form.memorize')}
              <input
                style={styles.input}
                type="number"
                min={1}
                max={120}
                value={form.memorizeTime}
                onChange={(e) => handleChange('memorizeTime', Number(e.target.value))}
              />
            </label>
            <label style={styles.label}>
              {t('mazeLab.form.levelNumber')}
              <input
                style={styles.input}
                type="number"
                min={1}
                max={999}
                value={form.levelNumber}
                onChange={(e) => handleChange('levelNumber', Number(e.target.value))}
              />
            </label>
          </div>
        </section>

        <div style={styles.canvasWrapper}>
          <div style={{ ...styles.surface, minHeight: 420 }}>
            <MazeCanvas
              level={level}
              phase="playing"
              showReveal
              showPlayerPath
              forcePathHistory={analysis.pathCells}
              settings={{
                path_color: visuals.mazePathColor,
                wall_color: visuals.mazeWallColor,
                wall_thickness: visuals.mazeWallThickness,
                exit_color: visuals.mazeExitColor,
                player_color: visuals.mazePlayerColor,
                player_path_color: visuals.playerPathColor,
                crash_help_color: visuals.crashHelpColor,
              }}
            />
          </div>

          <div style={{ ...styles.surface, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{t('mazeLab.stats.title')}</h2>
            <div style={styles.statGrid}>
              {stats.map((s) => (
                <div key={s.label} style={styles.statCard}>
                  <div style={{ fontSize: 12, color: visuals.subtextColor, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, color: visuals.subtextColor, marginBottom: 4 }}>
                {t('mazeLab.pathCellsLabel')}
              </div>
              <div style={styles.pathPreview}>
                {analysis.pathCells.map((p) => `(${p.x},${p.y})`).join(' → ')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: visuals.subtextColor, marginBottom: 4 }}>
                {t('mazeLab.turnPositions')} ({turnPositions.length} {t('mazeLab.stats.turnsShort')})
              </div>
              <div style={styles.pathPreview}>
                {turnPositions.map((p) => `(${p.x},${p.y})`).join(' → ')}
            </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
