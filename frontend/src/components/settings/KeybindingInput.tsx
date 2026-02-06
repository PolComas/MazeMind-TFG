import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PALETTE } from '../palette';
import { useLanguage } from '../../context/LanguageContext';

type Props = {
  label: string;
  value: string;
  onChange: (key: string) => void;
  isError?: boolean;
};

export default function KeybindingInput({ label, value, onChange, isError = false }: Props) {
  // Estat per saber si estem escoltant una nova tecla
  const [isListening, setIsListening] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t } = useLanguage();

  // Helper per formatar tecles
  const formatKey = useCallback((key: string) => {
    if (key === ' ') return t('keys.space');
    if (key.toLowerCase() === 'escape') return t('keys.escape');
    if (key.length === 1) return key.toUpperCase();
    return key;
  }, [t]);

  // Efecte per gestionar esdeveniments de teclat i clics fora del botó
  useEffect(() => {
    if (!isListening) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Cancel·la l'escolta amb Escape
      if (e.key === 'Escape') {
        setIsListening(false);
      } else {
        // Accepta
        
        if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') {
          onChange(e.key.toLowerCase());
          setIsListening(false);
        }
      }
    };

    // Gestió de clics fora del botó
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsListening(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isListening, onChange]);

  return (
    <div style={{
      ...styles.container,
      borderColor: isError ? PALETTE.hardRed : PALETTE.borderColor,
    }}>
      <label style={styles.label}>{label}</label>
      <button
        ref={buttonRef}
        onClick={() => setIsListening(true)}
        style={{
          ...styles.button,
          ...(isListening ? styles.buttonListening : {}),
          ...(isError ? styles.buttonError : {}),
        }}
      >
        {isListening ? t('settings.keybinding.listening') : formatKey(value)}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(10, 25, 47, 0.7)',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${PALETTE.borderColor}`,
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: PALETTE.subtext,
  },
  button: {
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    fontWeight: 700,
    color: PALETTE.text,
    background: PALETTE.surface,
    border: `1px solid ${PALETTE.borderColor}`,
    borderRadius: '4px',
    padding: '6px 12px',
    minWidth: '100px',
    textAlign: 'center',
    cursor: 'pointer',
  },
  buttonListening: {
    color: PALETTE.accentPink,
    borderColor: PALETTE.accentPink,
    outline: 'none',
  },
  buttonError: {
    color: PALETTE.hardRed,
    borderColor: PALETTE.hardRed,
  },
};
