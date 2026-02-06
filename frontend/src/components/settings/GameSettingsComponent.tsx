import React, { useMemo } from 'react';
import type { GameSettings } from '../../utils/settings';
import { PALETTE } from '../palette';
import KeybindingInput from './KeybindingInput';
import { useLanguage } from '../../context/LanguageContext';

type Props = {
  settings: GameSettings;
  onChange: (key: keyof GameSettings, value: boolean | string | number) => void;
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

// Component Slider
const SliderInput = ({ label, value, onChange }: any) => (
  <label style={styles.sliderContainer}>
    <span style={styles.sliderLabel}>{label} ({Math.round(value * 100)}%)</span>
    <input
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={styles.slider}
    />
  </label>
);

// Tecles a comprovar que no es repeteixin
const keybindingActions: (keyof GameSettings)[] = [
  'keyMoveUp', 'keyMoveDown', 'keyMoveLeft', 'keyMoveRight',
  'keyHelpReveal', 'keyHelpPath', 'keyHelpCrash', 'keySkipMemorize', 'keyCloseModal',
  'keyOpenLevels', 'keyOpenSettings', 'keyOpenHome'
];

export default function GameSettingsComponent({ settings, onChange }: Props) {
  const { t } = useLanguage();
  // NOU: Lògica per detectar duplicats
  const duplicateActions = useMemo(() => {
    // 1. Creem un mapa per comptar quantes accions utilitzen cada tecla
    //    Ex: { 'w': ['keyMoveUp'], 'a': ['keyMoveLeft', 'keyHelpReveal'] }
    const keyUsageMap = new Map<string, (keyof GameSettings)[]>();

    for (const action of keybindingActions) {
      const key = settings[action] as string; // Ex: 'w'
      if (!keyUsageMap.has(key)) {
        keyUsageMap.set(key, []);
      }
      keyUsageMap.get(key)!.push(action); // Ex: afegeix 'keyMoveUp' a la llista de 'w'
    }

    // 2. Creem un Set amb totes les accions que estan duplicades
    const duplicates = new Set<keyof GameSettings>();
    for (const actions of keyUsageMap.values()) {
      if (actions.length > 1) { // Si més d'una acció utilitza aquesta tecla...
        actions.forEach(action => duplicates.add(action)); // ...marca-les totes com a duplicades
      }
    }
    return duplicates;
  }, [settings]); // Es recalcula cada cop que 'settings' canvia
  return (
    <div style={styles.container}>

      {/* --- SECCIÓ DE SO --- */}
      <h4 style={styles.title}>{t('settings.game.audio.title')}</h4>
      <div style={styles.group}>
        <ToggleInput
          label={t('settings.game.audio.sfx')}
          checked={settings.soundEffects}
          onChange={(value: boolean) => onChange('soundEffects', value)}
        />
        {settings.soundEffects && (
          <SliderInput
            label={t('settings.game.audio.sfxVolume')}
            value={settings.soundVolume}
            onChange={(value: number) => onChange('soundVolume', value)}
          />
        )}

        <ToggleInput
          label={t('settings.game.audio.music')}
          checked={settings.backgroundMusic}
          onChange={(value: boolean) => onChange('backgroundMusic', value)}
        />
        {settings.backgroundMusic && (
          <SliderInput
            label={t('settings.game.audio.musicVolume')}
            value={settings.musicVolume}
            onChange={(value: number) => onChange('musicVolume', value)}
          />
        )}
      </div>

      {/* --- SECCIÓ DE TECLES --- */}
      <h4 style={styles.title}>{t('settings.game.controls.move.title')}</h4>
      <div style={styles.keyGrid}>
        <KeybindingInput
          label={t('settings.game.controls.move.up')}
          value={settings.keyMoveUp}
          onChange={(value: string) => onChange('keyMoveUp', value)}
          isError={duplicateActions.has('keyMoveUp')}
        />
        <KeybindingInput
          label={t('settings.game.controls.move.down')}
          value={settings.keyMoveDown}
          onChange={(value: string) => onChange('keyMoveDown', value)}
          isError={duplicateActions.has('keyMoveDown')}
        />
        <KeybindingInput
          label={t('settings.game.controls.move.left')}
          value={settings.keyMoveLeft}
          onChange={(value: string) => onChange('keyMoveLeft', value)}
          isError={duplicateActions.has('keyMoveLeft')}
        />
        <KeybindingInput
          label={t('settings.game.controls.move.right')}
          value={settings.keyMoveRight}
          onChange={(value: string) => onChange('keyMoveRight', value)}
          isError={duplicateActions.has('keyMoveRight')}
        />
      </div>
      <p style={styles.note}>{t('settings.game.controls.move.note')}</p>

      <h4 style={styles.title}>{t('settings.game.controls.help.title')}</h4>
      <div style={styles.keyGrid}>
        <KeybindingInput
          label={t('settings.game.controls.help.reveal')}
          value={settings.keyHelpReveal}
          onChange={(value: string) => onChange('keyHelpReveal', value)}
          isError={duplicateActions.has('keyHelpReveal')}
        />
        <KeybindingInput
          label={t('settings.game.controls.help.path')}
          value={settings.keyHelpPath}
          onChange={(value: string) => onChange('keyHelpPath', value)}
          isError={duplicateActions.has('keyHelpPath')}
        />
        <KeybindingInput
          label={t('settings.game.controls.help.crash')}
          value={settings.keyHelpCrash}
          onChange={(value: string) => onChange('keyHelpCrash', value)}
          isError={duplicateActions.has('keyHelpCrash')}
        />
        <KeybindingInput
          label={t('settings.game.controls.help.skip')}
          value={settings.keySkipMemorize}
          onChange={(value: string) => onChange('keySkipMemorize', value)}
          isError={duplicateActions.has('keySkipMemorize')}
        />
        <KeybindingInput
          label={t('settings.game.controls.help.closeModal')}
          value={settings.keyCloseModal}
          onChange={(value: string) => onChange('keyCloseModal', value)}
          isError={duplicateActions.has('keyCloseModal')}
        />
      </div>

      <h4 style={styles.title}>{t('settings.game.controls.global.title')}</h4>
      <div style={styles.keyGrid}>
        <KeybindingInput
          label={t('settings.game.controls.global.levels')}
          value={settings.keyOpenLevels}
          onChange={(value: string) => onChange('keyOpenLevels', value)}
          isError={duplicateActions.has('keyOpenLevels')}
        />
        <KeybindingInput
          label={t('settings.game.controls.global.settings')}
          value={settings.keyOpenSettings}
          onChange={(value: string) => onChange('keyOpenSettings', value)}
          isError={duplicateActions.has('keyOpenSettings')}
        />
        <KeybindingInput
          label={t('settings.game.controls.global.home')}
          value={settings.keyOpenHome}
          onChange={(value: string) => onChange('keyOpenHome', value)}
          isError={duplicateActions.has('keyOpenHome')}
        />
      </div>

      {/* Missatge d'error general */}
      {duplicateActions.size > 0 && (
        <p style={styles.errorText}>
          {t('settings.game.controls.errorDuplicate')}
        </p>
      )}
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

  // Estils del Slider
  sliderContainer: {
    display: 'flex', flexDirection: 'column', gap: '6px',
    padding: '0 4px',
  },
  sliderLabel: {
    fontSize: '0.8rem', color: PALETTE.subtext,
  },
  slider: {
    width: '100%', cursor: 'pointer', accentColor: PALETTE.playBtnFrom,
  },

  errorText: {
    color: PALETTE.hardRed,
    background: 'rgba(248, 113, 113, 0.1)',
    border: `1px solid ${PALETTE.hardRed}`,
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '0.875rem',
    fontWeight: 500,
    margin: '8px 0 0 0',
  },
};
