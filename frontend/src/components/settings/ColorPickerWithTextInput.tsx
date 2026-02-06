import React, { useState, useEffect } from 'react';
import { PALETTE } from '../palette';
import { useLanguage } from '../../context/LanguageContext';

type Props = {
  label: string; // Etiqueta per al control
  value: string; // Valor actual del color 
  onChange: (value: string) => void;
  inputId: string;
};

// Funció per validar si és un color hexadecimal vàlid
const isValidHex = (color: string): boolean => /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(color);

export default function ColorPickerWithTextInput({ label, value, onChange, inputId }: Props) {
  const { t } = useLanguage();
  const [textValue, setTextValue] = useState(value);
  const [pickerValue, setPickerValue] = useState(() => 
    isValidHex(value) ? value : '#ffffff'
  );

  // Sincronitzar l'estat intern quan el valor extern canvia
  useEffect(() => {
    setTextValue(value);
    if (isValidHex(value)) {
      setPickerValue(value);
    }
    // Si no és hex, mantenir l'últim valor hex
  }, [value]);

  // Gestionar el canvi des del selector de color
  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPickerValue(newValue);
    setTextValue(newValue);
    onChange(newValue);
  };

  // Gestionar el canvi des de l'input de text
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    if (isValidHex(newValue)) {
      setPickerValue(newValue);
      onChange(newValue);
    }
  };

  // Gestionar quan es perd el focus del text input
  const handleTextBlur = () => {
    if (!isValidHex(textValue)) {
      setTextValue(value); 
    }
  };

  return (
    <div style={styles.settingGroup}>
      <label htmlFor={inputId} style={styles.label}>{label}</label>
      <div style={styles.colorInputWrapper}>
        {/* Input de color */}
        <input
          id={inputId}
          type="color"
          value={pickerValue}
          onChange={handlePickerChange}
          style={styles.colorInput}
          aria-label={`${label} ${t('settings.colorPicker.visualSuffix')}`}
        />
        {/* Input de text */}
        <input
          type="text"
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          style={styles.textInput}
          aria-label={`${label} ${t('settings.colorPicker.hexSuffix')}`}
          spellCheck="false"
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  settingGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.875rem', fontWeight: 500, color: PALETTE.subtext },
  colorInputWrapper: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(10, 25, 47, 0.7)',
    border: `1px solid ${PALETTE.borderColor || 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: '6px', padding: '4px',
  },
  colorInput: {
    width: '28px', height: '28px', padding: 0, border: 'none',
    borderRadius: '4px', cursor: 'pointer', background: 'transparent', flexShrink: 0,
  },
  textInput: {
    flexGrow: 1,
    background: 'transparent', border: 'none', color: PALETTE.text,
    fontSize: '0.875rem', fontFamily: 'monospace', outline: 'none', padding: '4px 8px',
  },
};
