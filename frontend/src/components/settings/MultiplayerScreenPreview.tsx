import React from 'react';
import type { VisualSettings } from '../../utils/settings';
import NetworkBackground from '../NetworkBackground';

type Props = {
    settings: VisualSettings;
};

export default function MultiplayerScreenPreview({ settings }: Props) {
    const styles: Record<string, React.CSSProperties> = {
        pagePreview: {
            background: 'transparent',
            color: settings.textColor,
            padding: '24px',
            borderRadius: '8px',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflow: 'hidden',
            position: 'relative',
            isolation: 'isolate',
            boxSizing: 'border-box',
            fontFamily: '"Space Grotesk", sans-serif',
        },
        headerPreview: {
            display: 'grid', gridTemplateColumns: 'min-content 1fr min-content', alignItems: 'center', gap: 16,
        },
        backBtnPreview: {
            padding: '6px 10px', borderRadius: 8, border: `1px solid ${settings.borderColor}`,
            background: settings.surfaceColor, color: settings.textColor, fontSize: 12, fontWeight: 600,
        },
        titlePreview: { fontSize: '20px', fontWeight: 800, margin: 0, textAlign: 'center', lineHeight: 1 },
        subtitlePreview: { fontSize: '10px', opacity: 0.8, margin: 0, textAlign: 'center' },

        gridPreview: {
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, alignItems: 'start',
        },
        cardPreview: {
            background: settings.surfaceColor,
            border: `1px solid ${settings.borderColor}`,
            borderRadius: 16,
            padding: 16,
            display: 'flex', flexDirection: 'column', gap: 12,
        },
        cardHeaderPreview: {
            fontSize: 16, fontWeight: 700, margin: 0,
            borderBottom: `1px solid ${settings.borderColor}`,
            paddingBottom: 8,
        },
        labelPreview: { fontSize: 10, fontWeight: 600, color: settings.subtextColor, marginBottom: 4, display: 'block' },

        // Switch
        switchRow: { display: 'flex', alignItems: 'center', gap: 8 },
        switchTrack: {
            width: 32, height: 18, borderRadius: 999,
            background: `linear-gradient(90deg, ${settings.accentColor1}, ${settings.accentColor2})`,
            position: 'relative', border: `1px solid ${settings.borderColor}`,
        },
        switchThumb: {
            width: 14, height: 14, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 1, right: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        },

        // Segments
        segmentGroup: {
            display: 'flex', gap: 2, background: 'rgba(0,0,0,0.2)', padding: 2, borderRadius: 8, border: `1px solid ${settings.borderColor}`,
        },
        segmentBtn: {
            flex: 1, padding: '4px', borderRadius: 6, border: 'none', background: 'transparent',
            color: settings.subtextColor, fontSize: 10, fontWeight: 600, textAlign: 'center',
        },
        segmentBtnActive: {
            background: settings.surfaceColor, color: settings.textColor, boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        },

        // Input
        inputPreview: {
            padding: '8px', borderRadius: 8, border: `1px solid ${settings.borderColor}`,
            background: 'rgba(0,0,0,0.2)', color: settings.textColor, fontSize: 12, width: '100%', boxSizing: 'border-box',
        },

        btnPreview: {
            padding: '10px', borderRadius: 10, border: `none`,
            background: `linear-gradient(90deg, ${settings.accentColor1}, ${settings.accentColor2})`,
            color: settings.textColor, fontWeight: 800, fontSize: 13, textAlign: 'center',
            width: '100%', marginTop: 'auto',
        },

        // List
        listPreview: {
            display: 'flex', flexDirection: 'column', gap: 6,
            height: 120, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 4,
        },
        matchRowPreview: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${settings.borderColor}`,
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
                    <div style={styles.titlePreview}>Multijugador</div>
                    <p style={styles.subtitlePreview}>Desafia amics</p>
                </div>
                <div style={{ width: 20 }}></div>
            </div>

            <div style={styles.gridPreview}>
                {/* CREATE CARD */}
                <div style={styles.cardPreview}>
                    <div style={styles.cardHeaderPreview}>Crear</div>

                    {/* Switch */}
                    <div style={styles.switchRow}>
                        <div style={styles.switchTrack}><div style={styles.switchThumb} /></div>
                        <div style={{ fontSize: 10, fontWeight: 700 }}>Pública</div>
                    </div>

                    {/* Rounds */}
                    <div>
                        <span style={styles.labelPreview}>Rondes</span>
                        <div style={styles.segmentGroup}>
                            <div style={styles.segmentBtn}>3</div>
                            <div style={{ ...styles.segmentBtn, ...styles.segmentBtnActive }}>5</div>
                            <div style={styles.segmentBtn}>7</div>
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                        <span style={styles.labelPreview}>Dificultat</span>
                        <div style={styles.segmentGroup}>
                            <div style={styles.segmentBtn}>Fàcil</div>
                            <div style={{ ...styles.segmentBtn, ...styles.segmentBtnActive }}>Normal</div>
                            <div style={styles.segmentBtn}>Difícil</div>
                        </div>
                    </div>

                    <div style={styles.btnPreview}>Crear</div>
                </div>

                {/* JOIN CARD */}
                <div style={styles.cardPreview}>
                    <div style={styles.cardHeaderPreview}>Unir-se</div>

                    <div style={{ display: 'flex', gap: 4 }}>
                        <input style={styles.inputPreview} placeholder="Codi..." disabled />
                        <div style={{ ...styles.btnPreview, width: 'auto', padding: '0 10px', display: 'grid', placeItems: 'center' }}>→</div>
                    </div>

                    <div>
                        <span style={styles.labelPreview}>Partides obertes</span>
                        <div style={styles.listPreview}>
                            <div style={styles.matchRowPreview}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 11 }}>Usuari123</div>
                                    <div style={{ fontSize: 9, opacity: 0.7 }}>Normal · 5R</div>
                                </div>
                                <div style={{ fontSize: 14 }}>➜</div>
                            </div>
                            <div style={styles.matchRowPreview}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 11 }}>PlayerOne</div>
                                    <div style={{ fontSize: 9, opacity: 0.7 }}>Difícil · 3R</div>
                                </div>
                                <div style={{ fontSize: 14 }}>➜</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
