import React from 'react';
import type { VisualSettings } from '../../utils/settings';
import NetworkBackground from '../NetworkBackground';
import { useLanguage } from '../../context/LanguageContext';
import { applyAlpha, pickReadableTextColor } from '../../utils/color';

type Props = {
    settings: VisualSettings;
};

/**
 * Previsualitzacio de la pantalla de multijugador.
 */
export default function MultiplayerScreenPreview({ settings }: Props) {
    const { t } = useLanguage();
    const styles: Record<string, React.CSSProperties> = {
        pagePreview: {
            background: 'transparent',
            color: settings.textColor,
            padding: '14px',
            borderRadius: '8px',
            height: '100%',
            width: '100%',
            display: 'grid',
            alignContent: 'start',
            gap: 10,
            overflow: 'hidden',
            position: 'relative',
            isolation: 'isolate',
            boxSizing: 'border-box',
            fontFamily: '"Space Grotesk", sans-serif',
        },
        headerPreview: {
            display: 'grid',
            gridTemplateColumns: 'min-content 1fr min-content',
            alignItems: 'center',
            gap: 12,
        },
        backBtnPreview: {
            padding: '6px 10px',
            borderRadius: 8,
            border: `1px solid ${settings.borderColor}`,
            background: settings.surfaceColor,
            color: settings.textColor,
            fontSize: 11,
            fontWeight: 700,
        },
        titlePreview: {
            fontSize: '17px',
            fontWeight: 800,
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.08,
        },
        subtitlePreview: { fontSize: '9px', opacity: 0.8, margin: 0, textAlign: 'center' },
        noticePreview: {
            border: `1px solid ${applyAlpha('#3B82F6', 0.4)}`,
            background: applyAlpha('#3B82F6', 0.12),
            borderRadius: 9,
            padding: '7px 9px',
            fontSize: 10,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
        },
        noticeAction: {
            border: `1px solid ${settings.borderColor}`,
            borderRadius: 6,
            padding: '3px 6px',
            fontSize: 9,
            fontWeight: 700,
            background: applyAlpha(settings.surfaceColor, 0.85),
        },
        columnPreview: {
            display: 'grid',
            gap: 8,
            alignContent: 'start',
        },
        cardPreview: {
            background: applyAlpha(settings.surfaceColor, 0.95),
            border: `1px solid ${settings.borderColor}`,
            borderRadius: 12,
            padding: 10,
            display: 'grid',
            gap: 8,
        },
        cardHeaderPreview: {
            fontSize: 13,
            fontWeight: 800,
            margin: 0,
        },
        cardSub: {
            fontSize: 10,
            color: settings.subtextColor,
            margin: 0,
        },
        authGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 6,
        },
        authBtn: {
            borderRadius: 7,
            border: `1px solid ${settings.borderColor}`,
            padding: '6px 5px',
            fontSize: 9,
            fontWeight: 700,
            textAlign: 'center',
            background: applyAlpha(settings.surfaceColor, 0.85),
        },
        authBtnPrimary: {
            background: `linear-gradient(90deg, ${settings.accentColor1}, ${settings.accentColor2})`,
            color: pickReadableTextColor(settings.accentColor1),
            border: 'none',
        },
        labelPreview: {
            fontSize: 9,
            fontWeight: 700,
            color: settings.subtextColor,
            display: 'block',
        },
        inputRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 },
        inputPreview: {
            padding: '7px 8px',
            borderRadius: 7,
            border: `1px solid ${settings.borderColor}`,
            background: applyAlpha(settings.backgroundColor, 0.35),
            color: settings.textColor,
            fontSize: 10,
            width: '100%',
            boxSizing: 'border-box',
        },
        btnPreview: {
            padding: '7px 9px',
            borderRadius: 7,
            border: `none`,
            background: `linear-gradient(90deg, ${settings.accentColor1}, ${settings.accentColor2})`,
            color: pickReadableTextColor(settings.accentColor1),
            fontWeight: 800,
            fontSize: 9,
            textAlign: 'center',
            whiteSpace: 'nowrap',
        },
        listPreview: {
            display: 'grid',
            gap: 5,
        },
        matchRowPreview: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '7px 8px',
            borderRadius: 7,
            background: applyAlpha(settings.backgroundColor, 0.25),
            border: `1px solid ${settings.borderColor}`,
        },
        rowMeta: { fontSize: 8, opacity: 0.75 },
        createToggle: {
            border: `1px solid ${settings.borderColor}`,
            borderRadius: 7,
            padding: '6px 8px',
            fontSize: 10,
            fontWeight: 700,
            background: 'transparent',
            justifySelf: 'start',
        },
        helperRow: {
            fontSize: 9,
            color: settings.subtextColor,
            border: `1px solid ${settings.borderColor}`,
            borderRadius: 7,
            padding: '6px 8px',
            background: applyAlpha(settings.backgroundColor, 0.2),
        },
        segmentGroup: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 4,
            background: applyAlpha(settings.backgroundColor, 0.2),
            border: `1px solid ${settings.borderColor}`,
            borderRadius: 7,
            padding: 3,
        },
        segmentBtn: {
            padding: '5px 4px',
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: settings.subtextColor,
            fontSize: 8,
            fontWeight: 700,
            textAlign: 'center',
        },
        segmentBtnActive: {
            background: settings.surfaceColor,
            color: settings.textColor,
        },
    };

    return (
        <div style={styles.pagePreview}>
            <NetworkBackground
                primaryColor={settings.accentColor1}
                backgroundColor={settings.backgroundColor}
                opacity={0.4}
            />

            {/* Header */}
            <div style={styles.headerPreview}>
                <div style={styles.backBtnPreview}>←</div>
                <div>
                    <div style={styles.titlePreview}>{t('multiplayer.title')}</div>
                    <p style={styles.subtitlePreview}>{t('multiplayer.preview.subtitle')}</p>
                </div>
                <div style={{ width: 20 }}></div>
            </div>

            <div style={styles.noticePreview}>
                <span>ℹ {t('multiplayer.auth.requiredAction')}</span>
                <span style={styles.noticeAction}>{t('multiplayer.auth.action.login')}</span>
            </div>

            <div style={styles.columnPreview}>
                <div style={styles.cardPreview}>
                    <div style={styles.cardHeaderPreview}>{t('multiplayer.auth.title')}</div>
                    <p style={styles.cardSub}>{t('multiplayer.auth.subtitle')}</p>
                    <div style={styles.authGrid}>
                        <div style={{ ...styles.authBtn, ...styles.authBtnPrimary }}>{t('multiplayer.auth.login')}</div>
                        <div style={styles.authBtn}>{t('multiplayer.auth.register')}</div>
                        <div style={styles.authBtn}>{t('multiplayer.auth.guest')}</div>
                    </div>
                </div>

                {/* JOIN CARD */}
                <div style={styles.cardPreview}>
                    <div style={styles.cardHeaderPreview}>{t('multiplayer.join.title')}</div>
                    <p style={styles.cardSub}>{t('multiplayer.join.subtitle')}</p>

                    <div>
                        <span style={styles.labelPreview}>{t('multiplayer.join.code')}</span>
                        <div style={styles.inputRow}>
                            <input style={styles.inputPreview} placeholder={t('multiplayer.join.codePlaceholder')} disabled />
                            <div style={styles.btnPreview}>{t('multiplayer.join.cta')}</div>
                        </div>
                    </div>

                    <div>
                        <span style={styles.labelPreview}>{t('multiplayer.open.title')}</span>
                        <div style={styles.listPreview}>
                            <div style={styles.matchRowPreview}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 10 }}>{t('multiplayer.preview.sample1')}</div>
                                    <div style={styles.rowMeta}>{t('difficulty.normal')} · 3 {t('multiplayer.rounds')}</div>
                                </div>
                                <span style={styles.noticeAction}>{t('multiplayer.open.join')}</span>
                            </div>
                            <div style={styles.matchRowPreview}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 10 }}>{t('multiplayer.preview.sample2')}</div>
                                    <div style={styles.rowMeta}>{t('difficulty.hard')} · 5 {t('multiplayer.rounds')}</div>
                                </div>
                                <span style={styles.noticeAction}>{t('multiplayer.open.join')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CREATE CARD */}
                <div style={styles.cardPreview}>
                    <div style={styles.cardHeaderPreview}>{t('multiplayer.create.title')}</div>
                    <p style={styles.cardSub}>{t('multiplayer.create.subtitle')}</p>
                    <div style={styles.createToggle}>{t('multiplayer.create.configure')} ▾</div>
                    <div style={styles.helperRow}>
                        {t('multiplayer.create.public')} · {t('multiplayer.preview.public')}
                    </div>
                    <div>
                        <span style={styles.labelPreview}>{t('multiplayer.create.rounds')}</span>
                        <div style={styles.segmentGroup}>
                            <div style={{ ...styles.segmentBtn, ...styles.segmentBtnActive }}>3</div>
                            <div style={styles.segmentBtn}>5</div>
                            <div style={styles.segmentBtn}>7</div>
                        </div>
                    </div>
                    <div>
                        <span style={styles.labelPreview}>{t('multiplayer.create.difficulty')}</span>
                        <div style={styles.segmentGroup}>
                            <div style={styles.segmentBtn}>{t('difficulty.easy')}</div>
                            <div style={{ ...styles.segmentBtn, ...styles.segmentBtnActive }}>{t('difficulty.normal')}</div>
                            <div style={styles.segmentBtn}>{t('difficulty.hard')}</div>
                        </div>
                    </div>
                    <div style={styles.helperRow}>{t('multiplayer.create.size')}: 7x7 · {t('multiplayer.create.memorize')}: 8s</div>
                    <div style={{ ...styles.btnPreview, justifySelf: 'start' }}>{t('common.create')}</div>
                </div>
            </div>
        </div>
    );
}
