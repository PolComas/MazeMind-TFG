import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PALETTE } from '../components/palette';
import { type AppSettings, type VisualSettings, type ScreenSettings, PRESET_THEMES, type PresetThemeKey } from '../utils/settings';
import { ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useGameAudio } from '../audio/sound';
import NetworkBackground from '../components/NetworkBackground';
import { useLanguage } from '../context/LanguageContext';
import { useFocusTrap } from '../utils/focusTrap';


import HomeScreenSettings from '../components/settings/HomeScreenSettings';
import HomeScreenPreview from '../components/settings/HomeScreenPreview';
import LevelSelectSettings from '../components/settings/LevelSelectSettings';
import LevelSelectPreview from '../components/settings/LevelSelectPreview';
import LevelScreenSettings from '../components/settings/LevelScreenSettings';
import LevelScreenPreview from '../components/settings/LevelScreenPreview';
import LevelScreenLegend from '../components/settings/LevelScreenLegend';
import MultiplayerScreenSettings from '../components/settings/MultiplayerScreenSettings';
import MultiplayerScreenPreview from '../components/settings/MultiplayerScreenPreview';
import GameSettingsComponent from '../components/settings/GameSettingsComponent';
import ContrastCheckerPanel from '../components/settings/ContrastCheckerPanel';
import type { GameSettings } from '../utils/settings';

type Props = {
  onBack: () => void;
};

// 'home', 'levelSelect', 'levelScreen', 'multiplayer', 'game'
type AccordionSection = keyof ScreenSettings | 'game';

// Tecles a comprovar que no es repeteixin
const keybindingActions: (keyof GameSettings)[] = [
  'keyMoveUp', 'keyMoveDown', 'keyMoveLeft', 'keyMoveRight',
  'keyHelpReveal', 'keyHelpPath', 'keyHelpCrash', 'keySkipMemorize', 'keyCloseModal',
  'keyOpenLevels', 'keyOpenSettings', 'keyOpenHome'
];

const PRESET_LABELS: Record<PresetThemeKey, string> = {
  default: 'settings.presets.default',
  dark: 'settings.presets.dark',
  light: 'settings.presets.light',
  high_contrast: 'settings.presets.highContrast',
};

export default function SettingsScreen({ onBack }: Props) {
  // Obtenir so de joc
  const audio = useGameAudio();
  const { t } = useLanguage();

  // Obtenir la configuració i la funció d'actualització del context
  const { settings: initialSettings, updateSettings: saveAndApplySettings } = useSettings();

  // Estat local per a la configuració que s'està editant
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(() => JSON.parse(JSON.stringify(initialSettings)));
  // Quina secció de l'acordió està oberta
  const [activeSection, setActiveSection] = useState<AccordionSection | null>(null);
  // Quina secció es mostra a la previsualització (manté l'última seleccionada)
  const [previewSection, setPreviewSection] = useState<AccordionSection | 'home'>('home');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const saveTimeoutRef = React.useRef<number | null>(null);

  // Mostrar modal si l'usuari intenta sortir amb canvis no desats
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const unsavedModalRef = useRef<HTMLDivElement | null>(null);

  useFocusTrap(showUnsavedModal, unsavedModalRef);

  // Indicador si hi ha canvis entre l'estat original i l'estat local
  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(initialSettings) !== JSON.stringify(currentSettings);
    } catch (e) {
      return false;
    }
  }, [initialSettings, currentSettings]);

  useEffect(() => {
    if (!showUnsavedModal) return;
    const closeKey = (currentSettings.game.keyCloseModal || '').toLowerCase();
    if (!closeKey) return;

    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === currentSettings.game.keyCloseModal || key === closeKey) {
        e.preventDefault();
        setShowUnsavedModal(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showUnsavedModal, currentSettings.game.keyCloseModal]);

  const onBackWithSound = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
      return;
    }
    audio.playFail();
    onBack();
  }

  // Actions per al modal d'avís
  const handleSaveAndExit = () => {
    handleSave();
    setShowUnsavedModal(false);
    setTimeout(() => onBack(), 180);
  };

  const handleDiscardAndExit = () => {
    setShowUnsavedModal(false);
    setCurrentSettings(JSON.parse(JSON.stringify(initialSettings)));
    setTimeout(() => onBack(), 60);
  };

  // Funció per detectar duplicats
  const duplicateActions = useMemo(() => {
    const keyUsageMap = new Map<string, (keyof GameSettings)[]>();
    for (const action of keybindingActions) {
      const key = currentSettings.game[action] as string;
      if (!keyUsageMap.has(key)) {
        keyUsageMap.set(key, []);
      }
      keyUsageMap.get(key)!.push(action);
    }
    const duplicates = new Set<keyof GameSettings>();
    for (const actions of keyUsageMap.values()) {
      if (actions.length > 1) {
        actions.forEach(action => duplicates.add(action));
      }
    }
    return duplicates;
  }, [currentSettings.game]);

  // Funció per desar els canvis
  const handleSave = useCallback(() => {
    //  Comprovació tecles abans de desar
    if (duplicateActions.size > 0) {
      setActiveSection('game');
      setPreviewSection('game');
      return;
    }

    saveAndApplySettings(currentSettings);
    audio.playFail();
    setSaveSuccess(true);

    // Netejar qualsevol timeout anterior
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    // Amagar el missatge després de 1,5 segons
    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveSuccess(false);
      saveTimeoutRef.current = null;
    }, 1500);
  }, [currentSettings, saveAndApplySettings, audio]);

  // Netejar timeout al desmontar
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Funció per actualitzar un valor a l'estat actual
  const updateSetting = useCallback((keyPath: string, value: any) => {
    setCurrentSettings(prevSettings => {
      const keys = keyPath.split('.');
      const newSettings = JSON.parse(JSON.stringify(prevSettings));

      let currentLevel = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        currentLevel = currentLevel[keys[i]];
        if (!currentLevel) return prevSettings;
      }

      currentLevel[keys[keys.length - 1]] = value;

      return newSettings;
    });
  }, []);

  // Obrir/tancar secció de l'acordió
  const toggleSection = (section: AccordionSection) => {
    setActiveSection(prev => {
      const next = (prev === section ? null : section);
      // Si s'està obrint la secció, fem que la previsualització canviï a aquesta.
      if (next === section) setPreviewSection(section);
      // Si s'està tancant (next === null) no canviem previewSection: volem mantenir
      // l'última vista seleccionada.
      return next;
    });
    audio.playSlide();
  };

  // Funció per passar els paràmetres correctes a cada component de configuració
  const handleVisualChange = (screen: keyof ScreenSettings, key: keyof VisualSettings, value: string | number) => {
    updateSetting(`visuals.${screen}.${key}`, value);
  };

  const handleGameChange = (key: keyof GameSettings, value: boolean | string | number) => {
    updateSetting(`game.${key}`, value);
  };

  // Funció per aplicar un tema predefinit
  const applyPresetTheme = useCallback((themeName: PresetThemeKey) => {
    audio.playBtnSound();
    const themeSettings = PRESET_THEMES[themeName];
    if (!themeSettings) return;

    // Actualitzar l'estat a totes les pantalles
    setCurrentSettings(prev => ({
      ...prev,
      visuals: {
        home: { ...prev.visuals.home, ...themeSettings },
        levelSelect: { ...prev.visuals.levelSelect, ...themeSettings },
        levelScreen: { ...prev.visuals.levelScreen, ...themeSettings },
        multiplayer: { ...prev.visuals.multiplayer, ...themeSettings },
      }
    }));
  }, []);



  const contrastScreen: keyof ScreenSettings = previewSection === 'game' ? 'levelScreen' : previewSection;

  return (
    <div style={styles.page}>
      <NetworkBackground
        primaryColor={initialSettings.visuals.home.accentColor1}
        backgroundColor={initialSettings.visuals.home.backgroundColor}
        opacity={0.4}
      />
      {/* Capçalera */}
      <header style={styles.header}>
        <button type="button" onClick={onBackWithSound} style={styles.backButton} aria-label={t('common.back')} onMouseEnter={() => audio.playHover()}>
          <ArrowLeft size={20} /> {t('common.back')}
        </button>
        <h1 style={styles.title}>{t('settings.title')}</h1>
        <div style={{ width: 100 }} />
      </header>

      <div style={styles.contentGrid}>
        {/* Columna Esquerra: Acordió */}
        <div style={styles.accordionColumn}>
          {/* Temes Predefinits */}
          <section style={styles.presetsSection}>
            <h2 style={styles.presetsTitle}>{t('settings.presets.title')}</h2>
            <div style={styles.presetsGrid}>
              {Object.keys(PRESET_THEMES).map(themeName => (
                <button
                  type="button"
                  key={themeName}
                  style={styles.presetButton}
                  onClick={() => applyPresetTheme(themeName as PresetThemeKey)}
                  onMouseEnter={() => audio.playHover()}
                >
                  {t(PRESET_LABELS[themeName as PresetThemeKey])}
                </button>
              ))}
            </div>
          </section>

          <ContrastCheckerPanel
            screen={contrastScreen}
            settings={currentSettings.visuals}
          />

          {/* --- ACORDIÓ --- */}
          {/* Secció HomeScreen */}
          <div style={styles.accordionItem}>
            <button
              type="button"
              style={styles.accordionHeader}
              onClick={() => toggleSection('home')}
              aria-expanded={activeSection === 'home'}
            >
              <span>🖼️ {t('settings.section.home')}</span>
              {activeSection === 'home' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {/* Contingut que es mostra si la secció està activa */}
            {activeSection === 'home' && (
              <div style={styles.accordionContent}>
                <HomeScreenSettings
                  settings={currentSettings.visuals.home}
                  onChange={(key, value) => handleVisualChange('home', key, value)}
                />
              </div>
            )}
          </div>

          {/* Secció LevelSelect */}
          <div style={styles.accordionItem}>
            <button
              type="button"
              style={styles.accordionHeader}
              onClick={() => toggleSection('levelSelect')}
              aria-expanded={activeSection === 'levelSelect'}
            >
              <span>🔢 {t('settings.section.levelSelect')}</span>
              {activeSection === 'levelSelect' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {activeSection === 'levelSelect' && (
              <div style={styles.accordionContent}>
                <LevelSelectSettings
                  settings={currentSettings.visuals.levelSelect}
                  onChange={(key, value) => handleVisualChange('levelSelect', key, value)}
                />
              </div>
            )}
          </div>

          {/* Secció LevelScreen */}
          <div style={styles.accordionItem}>
            <button
              type="button"
              style={styles.accordionHeader}
              onClick={() => toggleSection('levelScreen')}
              aria-expanded={activeSection === 'levelScreen'}
            >
              <span>🕹️ {t('settings.section.levelScreen')}</span>
              {activeSection === 'levelScreen' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {activeSection === 'levelScreen' && (
              <div style={styles.accordionContent}>
                <LevelScreenSettings
                  settings={currentSettings.visuals.levelScreen}
                  onChange={(key, value) => handleVisualChange('levelScreen', key, value)}
                />
              </div>
            )}
          </div>

          {/* Secció Multiplayer */}
          <div style={styles.accordionItem}>
            <button
              type="button"
              style={styles.accordionHeader}
              onClick={() => toggleSection('multiplayer')}
              aria-expanded={activeSection === 'multiplayer'}
            >
              <span>👥 {t('settings.section.multiplayer')}</span>
              {activeSection === 'multiplayer' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {activeSection === 'multiplayer' && (
              <div style={styles.accordionContent}>
                <MultiplayerScreenSettings
                  settings={currentSettings.visuals.multiplayer}
                  onChange={(key, value) => handleVisualChange('multiplayer', key, value)}
                />
              </div>
            )}
          </div>

          {/* Secció Configuració de Joc */}
          <div style={styles.accordionItem}>
            <button
              type="button"
              style={styles.accordionHeader}
              onClick={() => toggleSection('game')}
              aria-expanded={activeSection === 'game'}
            >
              <span>🔊 {t('settings.section.game')}</span>
              {activeSection === 'game' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {activeSection === 'game' && (
              <div style={styles.accordionContent}>
                <GameSettingsComponent
                  settings={currentSettings.game}
                  onChange={handleGameChange}
                />
              </div>
            )}
          </div>


          <button type="button" onClick={handleSave} style={styles.saveButton} onMouseEnter={() => audio.playHover()}>
            <Save size={18} /> {t('settings.save')}
          </button>
          {saveSuccess && (
            <div role="status" aria-live="polite" style={{ textAlign: 'center', color: '#059669', marginTop: 8, fontWeight: 700 }}>
              {t('settings.saveSuccess')}
            </div>
          )}
        </div>

        {/* Columna Dreta: Previsualització */}
        <aside style={styles.previewColumn} aria-label={t('settings.preview.aria')}>
          <div style={styles.previewHeader}>
            <span>{t('settings.preview.title')}</span>
          </div>
          <div style={styles.previewContent}>
            {previewSection === 'home' && (
              <HomeScreenPreview settings={currentSettings.visuals.home} />
            )}

            {previewSection === 'levelSelect' && (
              <LevelSelectPreview settings={currentSettings.visuals.levelSelect} />
            )}

            {previewSection === 'levelScreen' && (
              <LevelScreenPreview settings={currentSettings.visuals.levelScreen} />
            )}

            {previewSection === 'multiplayer' && (
              <MultiplayerScreenPreview settings={currentSettings.visuals.multiplayer} />
            )}

            {previewSection === 'game' && (
              <LevelScreenPreview settings={currentSettings.visuals.levelScreen} />
            )}

            {!previewSection && (
              <p style={{ color: PALETTE.subtext, fontStyle: 'italic' }}>
                {t('settings.preview.empty')}
              </p>
            )}
          </div>
          {/* Llegenda */}
          <div style={styles.legend}>
            {previewSection === 'levelScreen' || previewSection === 'game' ? (
              <LevelScreenLegend settings={currentSettings.visuals.levelScreen} />
            ) : (
              <p>{t('settings.preview.noLegend')}</p>
            )}
          </div>
        </aside>
      </div>

      {/* Modal d'avís per canvis no desats */}
      {showUnsavedModal && (
        <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.66)', zIndex: 60 }}>
          <div ref={unsavedModalRef} style={{ width: 'min(560px, 92%)', background: PALETTE.surface, border: `1px solid ${PALETTE.borderColor}`, borderRadius: 12, padding: 20, boxShadow: PALETTE.shadow }} role="dialog" aria-modal="true">
            <h2 style={{ margin: 0, marginBottom: 8, fontSize: '1.125rem' }}>{t('settings.unsaved.title')}</h2>
            <p style={{ marginTop: 0, color: PALETTE.subtext }}>{t('settings.unsaved.body')}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" aria-label={t('common.cancel')} onClick={() => setShowUnsavedModal(false)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${PALETTE.borderColor}`, background: 'transparent', color: PALETTE.text }}>{t('common.cancel')}</button>
              <button type="button" aria-label={t('settings.unsaved.discard')} onClick={handleDiscardAndExit} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${PALETTE.borderColor}`, background: 'transparent', color: PALETTE.text }}>{t('settings.unsaved.discard')}</button>
              <button type="button" aria-label={t('settings.unsaved.saveExit')} onClick={handleSaveAndExit} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: PALETTE.easyGreen, color: '#0A192F', fontWeight: 700 }}>{t('settings.unsaved.saveExit')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100svh", width: "100%", margin: 0, background: 'transparent', position: 'relative', isolation: 'isolate', overflow: 'hidden', color: PALETTE.text, padding: 'clamp(16px, 3vw, 24px)', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto 24px' },
  backButton: { padding: "10px 14px", borderRadius: 12, border: PALETTE.borderColor, background: PALETTE.surface, color: PALETTE.text, cursor: "pointer", fontSize: 16, display: 'flex', alignItems: 'center', gap: '6px', width: 100 },
  title: { margin: 0, fontSize: "clamp(22px, 4vw, 28px)", textAlign: "center" },
  contentGrid: { display: 'grid', gridTemplateColumns: 'minmax(400px, 3fr) minmax(300px, 2fr)', gap: 'clamp(24px, 4vw, 40px)', width: '100%', maxWidth: '1400px', margin: '0 auto' },
  presetsSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  presetsTitle: { fontSize: '1.125rem', fontWeight: 600, margin: 0, color: PALETTE.accentCyan || PALETTE.text },
  presetsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  presetButton: { padding: '12px', borderRadius: '8px', border: `1px solid ${PALETTE.borderColor}`, background: 'rgba(255, 255, 255, 0.06)', color: PALETTE.text, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', textAlign: 'center', transition: 'background 0.2s ease' },
  separator: { border: 'none', borderTop: `1px solid ${PALETTE.borderColor}`, margin: '16px 0 8px 0' },
  accordionMainTitle: { fontSize: '1.125rem', fontWeight: 600, margin: '0 0 8px 0', color: PALETTE.accentCyan || PALETTE.text },
  accordionColumn: { background: PALETTE.surface, border: `1px solid ${PALETTE.borderColor}`, borderRadius: 16, padding: 'clamp(16px, 3vw, 24px)', boxShadow: PALETTE.shadow, display: 'flex', flexDirection: 'column', gap: '12px' },
  accordionItem: { borderBottom: `1px solid ${PALETTE.borderColor}`, paddingBottom: '12px' },
  accordionHeader: { background: 'none', border: 'none', color: PALETTE.text, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', padding: '8px 0', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' },
  accordionContent: { padding: '16px 4px 4px 4px', borderTop: `1px dashed ${PALETTE.borderColor}`, marginTop: '8px' },
  previewColumn: { borderRadius: 16, display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 48px)', overflow: 'hidden' },
  previewHeader: { background: `linear-gradient(90deg, ${PALETTE.accentPink}, ${PALETTE.accentViolet})`, color: '#fff', padding: '12px 16px', borderRadius: '12px 12px 0 0', fontWeight: 600 },
  previewContent: { flexGrow: 1, background: PALETTE.surface, border: `1px solid ${PALETTE.borderColor}`, borderRadius: '0 0 12px 12px', display: 'grid', placeItems: 'center', padding: '16px', minHeight: '300px' },
  legend: { background: PALETTE.surface, border: `1px solid ${PALETTE.borderColor}`, borderRadius: 12, padding: '16px', fontSize: 14, color: PALETTE.subtext },
  saveButton: { padding: "14px", borderRadius: 10, border: "none", background: PALETTE.easyGreen, color: '#0A192F', fontSize: 16, fontWeight: 700, cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'auto' },
};
