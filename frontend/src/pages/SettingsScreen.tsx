import React, { useState, useCallback } from 'react';
import { PALETTE } from '../components/palette'; 
import { loadSettings, saveSettings, type AppSettings, type VisualSettings, type ScreenSettings, PRESET_THEMES } from '../utils/settings';
import { ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

import HomeScreenSettings from '../components/settings/HomeScreenSettings'; 
import HomeScreenPreview from '../components/settings/HomeScreenPreview';
import LevelSelectSettings from '../components/settings/LevelSelectSettings';
import LevelSelectPreview from '../components/settings/LevelSelectPreview';
import LevelScreenSettings from '../components/settings/LevelScreenSettings';
import LevelScreenPreview from '../components/settings/LevelScreenPreview';

type Props = {
  onBack: () => void;
};

// 'home', 'levelSelect', 'levelScreen', 'game'
type AccordionSection = keyof ScreenSettings | 'game';

export default function SettingsScreen({ onBack }: Props) {
  // Obtenir la configuració i la funció d'actualització del context
  const { settings: initialSettings, updateSettings: saveAndApplySettings } = useSettings();

  // Estat local per a la configuració que s'està editant
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(() => JSON.parse(JSON.stringify(initialSettings)));
  const [activeSection, setActiveSection] = useState<AccordionSection | null>(null);

  // Funció per desar els canvis
  const handleSave = useCallback(() => {
    saveAndApplySettings(currentSettings); 
    alert("Configuració desada i aplicada!"); 
  }, [currentSettings, saveAndApplySettings]);

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
    setActiveSection(prev => (prev === section ? null : section));
  };

  // Funció per passar els paràmetres correctes a cada component de configuració
  const handleVisualChange = (screen: keyof ScreenSettings, key: keyof VisualSettings, value: string | number) => {
    updateSetting(`visuals.${screen}.${key}`, value);
  };

  const handleGameChange = (key: keyof AppSettings['game'], value: boolean | number) => {
    updateSetting(`game.${key}`, value);
  };

  // Funció per aplicar un tema predefinit
  const applyPresetTheme = useCallback((themeName: keyof typeof PRESET_THEMES) => {
    const themeSettings = PRESET_THEMES[themeName];
    if (!themeSettings) return;

    // Actualitzar l'estat a totes les pantalles
    setCurrentSettings(prev => ({
      ...prev,
      visuals: {
        home: { ...prev.visuals.home, ...themeSettings },
        levelSelect: { ...prev.visuals.levelSelect, ...themeSettings },
        levelScreen: { ...prev.visuals.levelScreen, ...themeSettings },
      }
    }));
  }, []);

  return (
    <div style={styles.page}>
      {/* Capçalera */}
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton} aria-label="Tornar">
          <ArrowLeft size={20} /> Tornar
        </button>
        <h1 style={styles.title}>Configuració i Accessibilitat</h1>
        <div style={{ width: 100 }} /> 
      </header>

      <div style={styles.contentGrid}>
        {/* Columna Esquerra: Acordió */}
        <div style={styles.accordionColumn}>
          {/* Temes Predefinits */}
          <section style={styles.presetsSection}>
            <h3 style={styles.presetsTitle}>Temes Predefinits</h3>
            <div style={styles.presetsGrid}>
              {Object.keys(PRESET_THEMES).map(themeName => (
                <button
                  key={themeName}
                  style={styles.presetButton}
                  onClick={() => applyPresetTheme(themeName as keyof typeof PRESET_THEMES)}
                >
                  {themeName}
                </button>
              ))}
            </div>
          </section>

          {/* --- ACORDIÓ --- */}
          {/* Secció HomeScreen */}
          <div style={styles.accordionItem}>
            <button 
              style={styles.accordionHeader} 
              onClick={() => toggleSection('home')}
              aria-expanded={activeSection === 'home'}
            >
              <span>🖼️ Pantalla d'Inici</span>
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
              style={styles.accordionHeader} 
              onClick={() => toggleSection('levelSelect')}
              aria-expanded={activeSection === 'levelSelect'}
            >
              <span>🔢 Selecció de Nivell</span>
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
            style={styles.accordionHeader} 
            onClick={() => toggleSection('levelScreen')}
            aria-expanded={activeSection === 'levelScreen'}
          >
            <span>🕹️ Pantalla de Joc</span>
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

          {/* Secció Configuració de Joc */}
           <div style={styles.accordionItem}>
            <button 
              style={styles.accordionHeader} 
              onClick={() => toggleSection('game')}
              aria-expanded={activeSection === 'game'}
            >
              <span>🔊 Configuració de Joc</span>
               {activeSection === 'game' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {activeSection === 'game' && (
              <div style={styles.accordionContent}>
                <p>Controls de Joc (Properament)...</p>
                 {/* <GameSettingsComponent settings={currentSettings.game} onChange={handleGameChange} /> */}
              </div>
            )}
          </div>


          <button onClick={handleSave} style={styles.saveButton}>
            <Save size={18} /> Desar Configuració
          </button>
        </div>

        {/* Columna Dreta: Previsualització */}
        <aside style={styles.previewColumn} aria-label="Vista prèvia en temps real">
           <div style={styles.previewHeader}>
            <span>Vista Prèvia en Temps Real</span>
          </div>
          <div style={styles.previewContent}>
            {activeSection === 'home' && (
              <HomeScreenPreview settings={currentSettings.visuals.home} />
            )}

            {activeSection === 'levelSelect' && (
              <LevelSelectPreview settings={currentSettings.visuals.levelSelect} />
            )}

            {activeSection === 'levelScreen' && (
              <LevelScreenPreview settings={currentSettings.visuals.levelScreen} />
            )}

            {activeSection !== 'home' && activeSection !== 'levelSelect' && activeSection !== 'levelScreen' && (
                <p style={{ color: PALETTE.subtext, fontStyle: 'italic' }}>
                  {activeSection 
                    ? `Previsualització de "${activeSection}" (Properament)...`
                    : "Selecciona una secció per veure la previsualització."}
                </p>
            )}
          </div>
          <div style={styles.legend}>
            <p>Llegenda (Properament)...</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100svh", width: "100%", margin: 0, background: PALETTE.bg, color: PALETTE.text, padding: 'clamp(16px, 3vw, 24px)', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto 24px' },
  backButton: { padding: "10px 14px", borderRadius: 12, border: PALETTE.borderColor, background: PALETTE.surface, color: PALETTE.text, cursor: "pointer", fontSize: 16, display: 'flex', alignItems: 'center', gap: '6px', width: 100 },
  title: { margin: 0, fontSize: "clamp(22px, 4vw, 28px)", textAlign: "center" },
  contentGrid: { display: 'grid', gridTemplateColumns: 'minmax(400px, 3fr) minmax(300px, 2fr)', gap: 'clamp(24px, 4vw, 40px)', width: '100%', maxWidth: '1400px', margin: '0 auto' },
  presetsSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  presetsTitle: { fontSize: '1.125rem', fontWeight: 600, margin: 0, color: PALETTE.accentCyan || PALETTE.text },
  presetsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  presetButton: { padding: '12px', borderRadius: '8px', border: `1px solid ${PALETTE.borderColor}`, background: 'rgba(255, 255, 255, 0.06)', color: PALETTE.text, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', textAlign: 'center', transition: 'background 0.2s ease'},
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