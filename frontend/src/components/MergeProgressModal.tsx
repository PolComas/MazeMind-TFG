import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { GameProgress } from '../utils/progress';

type Props = {
  cloudProgress: GameProgress;
  localProgress: GameProgress;
  cloudPracticeBest: number;
  localPracticeBest: number;
  onChooseCloudOnly: () => void;
  onChooseLocalOnly: () => void;
  onChooseSmartMerge: () => void;
  onCancel: () => void;
};

const CAMPAIGN_MIN_LEVEL = 1;
const CAMPAIGN_MAX_LEVEL = 15;

const isCampaignLevelKey = (key: string) => {
  const [, rawLevel] = key.split('-');
  if (!rawLevel) return false;
  const parsed = Number(rawLevel);
  return Number.isFinite(parsed) && parsed >= CAMPAIGN_MIN_LEVEL && parsed <= CAMPAIGN_MAX_LEVEL;
};

type DiffSummary = {
  totalDifferent: number;
  localBetterStars: number;
  localBetterTime: number;
  localBetterPoints: number;
};

const computeDiffSummary = (local: GameProgress, cloud: GameProgress): DiffSummary => {
  const summary: DiffSummary = {
    totalDifferent: 0,
    localBetterStars: 0,
    localBetterTime: 0,
    localBetterPoints: 0,
  };

  const levelIds = new Set([...Object.keys(local.levels), ...Object.keys(cloud.levels)]);
  levelIds.forEach((levelId) => {
    if (!isCampaignLevelKey(levelId)) {
      return;
    }
    const localLevel = local.levels[levelId];
    const cloudLevel = cloud.levels[levelId];
    if (!localLevel && !cloudLevel) {
      return;
    }

    const starsDiff = (localLevel?.stars ?? 0) - (cloudLevel?.stars ?? 0);
    const localTime = localLevel?.bestTime ?? null;
    const cloudTime = cloudLevel?.bestTime ?? null;
    const localPoints = localLevel?.bestPoints ?? null;
    const cloudPoints = cloudLevel?.bestPoints ?? null;

    if (starsDiff !== 0 || localTime !== cloudTime || localPoints !== cloudPoints) {
      summary.totalDifferent += 1;
    }

    if (starsDiff > 0) {
      summary.localBetterStars += 1;
    }

    if (
      localTime !== null &&
      (cloudTime === null || localTime < cloudTime)
    ) {
      summary.localBetterTime += 1;
    }

    if (
      localPoints !== null &&
      (cloudPoints === null || localPoints > cloudPoints)
    ) {
      summary.localBetterPoints += 1;
    }
  });

  return summary;
};

const numberFormatter = new Intl.NumberFormat('ca-ES');

export default function MergeProgressModal({
  cloudProgress,
  localProgress,
  cloudPracticeBest,
  localPracticeBest,
  onChooseCloudOnly,
  onChooseLocalOnly,
  onChooseSmartMerge,
  onCancel,
}: Props) {
  const summary = useMemo(
    () => computeDiffSummary(localProgress, cloudProgress),
    [cloudProgress, localProgress]
  );

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="merge-progress-title">
      <div style={styles.modal}>
        <h2 id="merge-progress-title" style={styles.title}>Sincronitza el teu progrés</h2>
        <p style={styles.body}>
          Hem detectat progrés diferent entre aquest dispositiu i el núvol. Tria com vols continuar:
        </p>

        <div style={styles.summaryGrid}>
          <SummaryCard label="Nivells amb diferències" value={summary.totalDifferent} />
          <SummaryCard label="Nivells on el local té més estrelles" value={summary.localBetterStars} />
          <SummaryCard label="Nivells on el local té millor temps" value={summary.localBetterTime} />
          <SummaryCard label="Nivells on el local té més punts" value={summary.localBetterPoints} />
        </div>

        <div style={styles.practiceRow}>
          <div>
            <p style={styles.practiceLabel}>Millor puntuació pràctica (local)</p>
            <p style={styles.practiceValue}>{numberFormatter.format(localPracticeBest ?? 0)}</p>
          </div>
          <div style={styles.practiceDivider} aria-hidden="true" />
          <div>
            <p style={styles.practiceLabel}>Millor puntuació pràctica (núvol)</p>
            <p style={styles.practiceValue}>{numberFormatter.format(cloudPracticeBest ?? 0)}</p>
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.secondaryButton} onClick={onChooseCloudOnly}>
            Fer servir només el núvol
          </button>
          <button style={styles.secondaryButton} onClick={onChooseLocalOnly}>
            Fer servir només el local
          </button>
          <button style={styles.primaryButton} onClick={onChooseSmartMerge}>
            Fusió intel·ligent
          </button>
        </div>

        <button style={styles.cancelButton} onClick={onCancel}>
          Cancel·la i torna enrere
        </button>
      </div>
    </div>
  );
}

const SummaryCard = ({ label, value }: { label: string; value: number }) => (
  <div style={styles.card}>
    <span style={styles.cardValue}>{value}</span>
    <span style={styles.cardLabel}>{label}</span>
  </div>
);

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(8, 15, 40, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1.5rem',
    zIndex: 110,
  },
  modal: {
    width: 'min(640px, 100%)',
    background: '#0f172a',
    color: '#f8fafc',
    borderRadius: '1.25rem',
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '2rem',
    boxShadow: '0 30px 80px rgba(2,6,23,0.8)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  title: {
    fontSize: '1.75rem',
    margin: 0,
  },
  body: {
    margin: 0,
    color: 'rgba(248,250,252,0.85)',
    lineHeight: 1.5,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.75rem',
  },
  card: {
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.75rem',
    padding: '0.75rem',
    textAlign: 'center',
  },
  cardValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    display: 'block',
  },
  cardLabel: {
    fontSize: '0.85rem',
    color: 'rgba(248,250,252,0.75)',
  },
  practiceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(15,23,42,0.45)',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  practiceLabel: {
    margin: 0,
    fontSize: '0.85rem',
    color: 'rgba(248,250,252,0.7)',
  },
  practiceValue: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: 700,
  },
  practiceDivider: {
    width: '1px',
    height: '2.5rem',
    background: 'rgba(248,250,252,0.15)',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.75rem',
  },
  primaryButton: {
    borderRadius: '0.75rem',
    border: 'none',
    padding: '0.9rem 1.2rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #34d399, #10b981)',
    color: '#041221',
    cursor: 'pointer',
  },
  secondaryButton: {
    borderRadius: '0.75rem',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '0.9rem 1.2rem',
    fontWeight: 600,
    background: 'rgba(15,23,42,0.2)',
    color: '#f8fafc',
    cursor: 'pointer',
  },
  cancelButton: {
    borderRadius: '0.75rem',
    border: 'none',
    padding: '0.75rem 1rem',
    fontWeight: 600,
    background: 'transparent',
    color: 'rgba(248,250,252,0.6)',
    cursor: 'pointer',
    textDecoration: 'underline',
    alignSelf: 'center',
  },
};
