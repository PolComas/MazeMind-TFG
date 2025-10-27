import React from 'react';
import type { GameSettings } from '../../utils/settings';
import { PALETTE } from '../palette';
import KeybindingInput from './KeybindingInput';

type Props = {
  settings: GameSettings;
  onChange: (key: keyof GameSettings, value: boolean | string) => void;
};

// Component Toggle simple
const ToggleInput = ({ label, checked, onChange }: any) => (
  <label style={styles.toggleContainer}>
    <span style={styles.toggleLabel}>{label}</span>
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{ ...styles.toggleSwitch, ...(checked ? styles.toggleOn : styles.toggleOff) }}
    >
      <span style={{ ...styles.toggleKnob, ...(checked ? styles.knobOn : styles.knobOff) }} />
    </button>
  </label>
);

export default function GameSettingsComponent({ settings, onChange }: Props) {
  return (
    <div style={styles.container}>
      
      {/* --- SECCIÓ DE SO --- */}
      <h4 style={styles.title}>Configuració de So</h4>
      <div style={styles.group}>
        <ToggleInput
          label="Efectes de So (SFX)"
          checked={settings.soundEffects}
          onChange={(value: boolean) => onChange('soundEffects', value)}
        />
        <ToggleInput
          label="Música de Fons"
          checked={settings.backgroundMusic}
          onChange={(value: boolean) => onChange('backgroundMusic', value)}
        />
      </div>

      {/* --- SECCIÓ DE TECLES --- */}
      <h4 style={styles.title}>Controls de Moviment (Lletres)</h4>
      <div style={styles.keyGrid}>
        <KeybindingInput
          label="Amunt"
          value={settings.keyMoveUp}
          onChange={(value: string) => onChange('keyMoveUp', value)}
        />
        <KeybindingInput
          label="Avall"
          value={settings.keyMoveDown}
          onChange={(value: string) => onChange('keyMoveDown', value)}
        />
        <KeybindingInput
          label="Esquerra"
          value={settings.keyMoveLeft}
          onChange={(value: string) => onChange('keyMoveLeft', value)}
        />
        <KeybindingInput
          label="Dreta"
          value={settings.keyMoveRight}
          onChange={(value: string) => onChange('keyMoveRight', value)}
        />
      </div>
      <p style={styles.note}>Nota: Les tecles de fletxa (↑, ↓, ←, →) sempre funcionaran a més d'aquestes.</p>

      <h4 style={styles.title}>Controls d'Ajuda</h4>
      <div style={styles.keyGrid}>
        <KeybindingInput
          label="Revelar Laberint"
          value={settings.keyHelpReveal}
          onChange={(value: string) => onChange('keyHelpReveal', value)}
        />
        <KeybindingInput
          label="Mostrar Camí"
          value={settings.keyHelpPath}
          onChange={(value: string) => onChange('keyHelpPath', value)}
        />
        <KeybindingInput
          label="Ajuda Xoc"
          value={settings.keyHelpCrash}
          onChange={(value: string) => onChange('keyHelpCrash', value)}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  title: {
    fontSize: '1rem', fontWeight: 600, color: PALETTE.text,
    margin: '8px 0 0 0', borderTop: `1px solid ${PALETTE.borderColor}`,
    paddingTop: '16px',
  },
  group: { display: 'flex', flexDirection: 'column', gap: '12px' },
  keyGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
  },
  note: {
    fontSize: '0.8rem', color: PALETTE.subtext, margin: '0 0 8px 0',
    fontStyle: 'italic',
  },
  // Estils del Toggle
  toggleContainer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(10, 25, 47, 0.7)', padding: '12px',
    borderRadius: '6px', border: `1px solid ${PALETTE.borderColor}`,
  },
  toggleLabel: {
    fontSize: '0.875rem', fontWeight: 500, color: PALETTE.text,
  },
  toggleSwitch: {
    position: 'relative', width: '44px', height: '24px',
    borderRadius: '99px', border: 'none', cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  toggleOn: { background: PALETTE.easyGreen },
  toggleOff: { background: PALETTE.surface },
  toggleKnob: {
    position: 'absolute', top: '2px', width: '20px', height: '20px',
    background: 'white', borderRadius: '50%',
    transition: 'transform 0.2s ease',
  },
  knobOn: { transform: 'translateX(2px)' },
  knobOff: { transform: 'translateX(-20px)' },
};