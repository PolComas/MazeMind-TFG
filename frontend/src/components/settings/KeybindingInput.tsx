import React, { useState, useRef, useEffect } from 'react';
import { PALETTE } from '../palette';

type Props = {
  label: string;
  value: string;
  onChange: (key: string) => void;
  isError?: boolean;
};

// Helper per formatar tecles
const formatKey = (key: string) => {
  if (key === ' ') return 'Espai';
  if (key.toLowerCase() === 'escape') return 'Esc';
  if (key.length === 1) return key.toUpperCase();
  return key;
};

export default function KeybindingInput({ label, value, onChange, isError = false }: Props) {
  // Estat per saber si estem escoltant una nova tecla
  const [isListening, setIsListening] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        {isListening ? 'Prement una tecla...' : formatKey(value)}
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
