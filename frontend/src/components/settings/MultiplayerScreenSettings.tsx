import React, { useState, useEffect, useCallback } from 'react';
import type { VisualSettings } from '../../utils/settings';
import { PALETTE } from '../palette';
import ColorPickerWithTextInput from './ColorPickerWithTextInput';

type Props = {
    settings: VisualSettings;
    onChange: (key: keyof VisualSettings, value: string | number) => void;
};

export default function MultiplayerScreenSettings({ settings, onChange }: Props) {
    return (
        <div style={styles.container}>
            {/* Graella de Dues Columnes */}
            <div style={styles.grid}>

                {/* --- Columna Esquerra --- */}
                <div style={styles.column}>
                    {/* Text Principal */}
                    <ColorPickerWithTextInput
                        label="Color de Text Principal"
                        value={settings.textColor}
                        onChange={(value) => onChange('textColor', value)}
                        inputId="multi-text-color"
                    />

                    {/* Accent Principal */}
                    <ColorPickerWithTextInput
                        label="Color d'Accent Principal"
                        value={settings.accentColor1}
                        onChange={(value) => onChange('accentColor1', value)}
                        inputId="multi-accent1-color"
                    />

                </div>

                {/* --- Columna Dreta --- */}
                <div style={styles.column}>
                    {/* Text Secundari */}
                    <ColorPickerWithTextInput
                        label="Color de Text Secundari"
                        value={settings.subtextColor}
                        onChange={(value) => onChange('subtextColor', value)}
                        inputId="multi-subtext-color"
                    />

                    {/* Accent Secundari */}
                    <ColorPickerWithTextInput
                        label="Color d'Accent Secundari"
                        value={settings.accentColor2}
                        onChange={(value) => onChange('accentColor2', value)}
                        inputId="multi-accent2-color"
                    />
                </div>

                {/* Fons */}
                <ColorPickerWithTextInput
                    label="Color de Fons"
                    value={settings.backgroundColor}
                    onChange={(value) => onChange('backgroundColor', value)}
                    inputId="multi-bg-color"
                />

                {/* Superfícies (Targetes) */}
                <ColorPickerWithTextInput
                    label="Color de les Targetes"
                    value={settings.surfaceColor.startsWith('rgba') ? '#ffffff' : settings.surfaceColor}
                    onChange={(value) => onChange('surfaceColor', value)}
                    inputId="multi-surface-color"
                />

                {/* Color de vora */}
                <ColorPickerWithTextInput
                    label="Color de Vora"
                    value={settings.borderColor}
                    onChange={(value) => onChange('borderColor', value)}
                    inputId="multi-border-color"
                />
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
    },
    column: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
};
