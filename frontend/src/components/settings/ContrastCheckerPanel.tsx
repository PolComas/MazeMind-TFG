import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import type { ScreenSettings } from '../../utils/settings';
import { getContrastRatio } from '../../utils/color';
import { PALETTE } from '../palette';
import { useLanguage } from '../../context/LanguageContext';

/** Claus de pantalla configurables dins l'editor visual. */
type ScreenKey = keyof ScreenSettings;

/** Propietats del panell de contrast. */
type Props = {
  screen: ScreenKey;
  settings: ScreenSettings;
};

/** Resultat d'una comprovació individual de contrast. */
type ContrastCheck = {
  id: string;
  labelKey: string;
  fgColor: string;
  bgColor: string;
  ratio: number;
  min: number;
  pass: boolean;
  /** 'text' = 4.5:1 body text, 'ui' = 3:1 non-text / decorative */
  level: 'text' | 'ui';
};

/** Etiqueta de traducció associada a cada pantalla configurable. */
const SCREEN_LABEL_KEY: Record<ScreenKey, string> = {
  home: 'settings.section.home',
  levelSelect: 'settings.section.levelSelect',
  levelScreen: 'settings.section.levelScreen',
  multiplayer: 'settings.section.multiplayer',
};

/** Extreu un color sòlid d'un valor que pot ser gradient o rgb(a). */
const extractSolidColor = (value: string): string | null => {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('#')) return value;
  if (value.startsWith('rgb(') || value.startsWith('rgba(')) return value;

  const hex = value.match(/#[0-9A-Fa-f]{3,8}/);
  if (hex) return hex[0];

  const rgb = value.match(/rgba?\([^)]+\)/);
  if (rgb) return rgb[0];

  return null;
};

/** Construeix una comprovació de contrast si els dos colors són resolubles. */
const buildCheck = (
  id: string,
  labelKey: string,
  fg: string | undefined,
  bg: string | undefined,
  min: number,
  level: 'text' | 'ui',
): ContrastCheck | null => {
  const fgSolid = fg ? extractSolidColor(fg) : null;
  const bgSolid = bg ? extractSolidColor(bg) : null;
  if (!fgSolid || !bgSolid) return null;

  const ratio = getContrastRatio(fgSolid, bgSolid);
  return {
    id,
    labelKey,
    fgColor: fgSolid,
    bgColor: bgSolid,
    ratio,
    min,
    pass: ratio >= min,
    level,
  };
};

/**
 * Panell minimalista de validació de contrast per la pantalla seleccionada.
 *
 * Mostra un resum (checks passats / totals) i, opcionalment, el detall per
 * cada parella color-text o color-UI rellevant.
 */
export default function ContrastCheckerPanel({ screen, settings }: Props) {
  const { t } = useLanguage();
  const visual = settings[screen];
  const [expanded, setExpanded] = useState(false);

  const checks = useMemo(() => {
    const list = [
      // Text → 4.5:1 (WCAG AA normal text)
      buildCheck(
        'text-surface',
        'settings.contrast.check.textSurface',
        visual.textColor,
        visual.surfaceColor,
        4.5,
        'text',
      ),
      buildCheck(
        'subtext-surface',
        'settings.contrast.check.subtextSurface',
        visual.subtextColor,
        visual.surfaceColor,
        4.5,
        'text',
      ),
      // Accents → 3:1 (WCAG AA non-text UI components)
      buildCheck(
        'accent1-surface',
        'settings.contrast.check.accent1Surface',
        visual.accentColor1,
        visual.surfaceColor,
        3,
        'ui',
      ),
      buildCheck(
        'accent2-surface',
        'settings.contrast.check.accent2Surface',
        visual.accentColor2,
        visual.surfaceColor,
        3,
        'ui',
      ),
      // Text on background → 3:1 (large decorative text / headlines)
      buildCheck(
        'text-background',
        'settings.contrast.check.textBackground',
        visual.textColor,
        visual.backgroundColor,
        3,
        'ui',
      ),
    ].filter((check): check is ContrastCheck => Boolean(check));

    return list;
  }, [visual]);

  const passCount = checks.filter((c) => c.pass).length;
  const total = checks.length;
  const allPass = passCount === total;

  const summaryColor = allPass ? '#10B981' : '#F59E0B';

  return (
    <section style={styles.panel} aria-label={t('settings.contrast.title')}>
      {/* Capçalera col·lapsable */}
      <button
        type="button"
        style={styles.headerButton}
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        <div style={styles.headerLeft}>
          <strong style={styles.title}>{t('settings.contrast.title')}</strong>
          <span style={{ ...styles.badge, background: allPass ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.14)', color: summaryColor }}>
            {passCount}/{total} ✓
          </span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.scope}>{t(SCREEN_LABEL_KEY[screen])}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Detall expandit */}
      {expanded && (
        <div style={styles.details}>
          <p style={styles.subtitle}>{t('settings.contrast.subtitle')}</p>
          <ul style={styles.list}>
            {checks.map((check) => (
              <li key={check.id} style={styles.listItem}>
                {/* Mostres de colors comparats */}
                <div style={styles.swatchPair}>
                  <span
                    style={{
                      ...styles.swatch,
                      background: check.fgColor,
                      border: `1px solid rgba(255,255,255,0.2)`,
                    }}
                    title={check.fgColor}
                  />
                  <span style={styles.swatchSep}>⁄</span>
                  <span
                    style={{
                      ...styles.swatch,
                      background: check.bgColor,
                      border: `1px solid rgba(255,255,255,0.2)`,
                    }}
                    title={check.bgColor}
                  />
                </div>

                {/* Etiqueta de la comprovació */}
                <span style={styles.checkLabel}>{t(check.labelKey)}</span>

                {/* Ratio de contrast i estat pass/fail */}
                <div style={styles.ratioGroup}>
                  <span
                    style={{
                      ...styles.ratioText,
                      color: check.pass ? '#6EE7B7' : check.level === 'text' ? '#FCA5A5' : '#FCD34D',
                    }}
                  >
                    {check.ratio.toFixed(1)}:1
                  </span>
                  {check.pass ? (
                    <Check size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                  ) : (
                    <X size={14} style={{ color: check.level === 'text' ? '#EF4444' : '#F59E0B', flexShrink: 0 }} />
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Recordatori de llindars mínims WCAG */}
          <p style={styles.note}>
            {t('settings.contrast.note')}
          </p>
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    border: `1px solid ${PALETTE.borderColor}`,
    background: 'rgba(10, 25, 47, 0.45)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  headerButton: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: 'none',
    border: 'none',
    color: PALETTE.text,
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: '0.875rem',
    color: PALETTE.text,
  },
  scope: {
    fontSize: '0.72rem',
    color: PALETTE.subtext,
    opacity: 0.9,
  },
  badge: {
    borderRadius: 999,
    padding: '2px 8px',
    fontSize: '0.72rem',
    fontWeight: 700,
    lineHeight: 1.6,
    whiteSpace: 'nowrap' as const,
  },
  details: {
    borderTop: `1px solid ${PALETTE.borderColor}`,
    padding: '10px 14px 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  subtitle: {
    margin: 0,
    fontSize: '0.72rem',
    color: PALETTE.subtext,
    opacity: 0.85,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '0.78rem',
    color: PALETTE.text,
  },
  swatchPair: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  swatch: {
    display: 'inline-block',
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  swatchSep: {
    fontSize: '0.65rem',
    color: PALETTE.subtext,
    opacity: 0.5,
    lineHeight: 1,
  },
  checkLabel: {
    color: PALETTE.subtext,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  ratioGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  ratioText: {
    fontSize: '0.72rem',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  note: {
    margin: '4px 0 0',
    fontSize: '0.68rem',
    color: PALETTE.subtext,
    opacity: 0.7,
    fontStyle: 'italic',
  },
};
