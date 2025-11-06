import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';

type User = { id: string, email: string };

// Props per al modal
type Props = {
  onClose: () => void;
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
};

const buildStyles = (visuals: VisualSettings) => {
  const accentGradient = `linear-gradient(90deg, ${visuals.accentColor1}, ${visuals.accentColor2})`;
  const inputBackground = applyAlpha(visuals.textColor, 0.08);
  const overlayColor = applyAlpha(visuals.textColor, 0.75);
  const errorBackground = applyAlpha(visuals.hardColor, 0.15);
  const errorBorder = applyAlpha(visuals.hardColor, 0.3);

  return {
    overlay: {
      position: 'fixed', inset: 0,
      background: overlayColor,
      backdropFilter: 'blur(8px)',
      display: 'grid', placeItems: 'center',
      zIndex: 100,
      padding: '1rem',
    },
    modalContent: {
      background: visuals.surfaceColor,
      border: `1px solid ${visuals.borderColor}`,
      borderRadius: '1rem',
      padding: '2rem',
      color: visuals.textColor,
      width: 'min(400px, 95vw)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      gap: '1.25rem',
    },
    closeButton: {
      position: 'absolute', top: '0.75rem', right: '0.75rem',
      background: 'none', border: 'none',
      color: visuals.subtextColor,
      cursor: 'pointer',
      padding: '0.25rem',
      lineHeight: 0,
      borderRadius: '50%',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 700,
      margin: 0,
      textAlign: 'center',
      color: visuals.textColor,
    },
    form: {
      display: 'flex', flexDirection: 'column',
      gap: '1rem',
    },
    label: {
      fontSize: '0.875rem',
      color: visuals.subtextColor,
      marginBottom: '-0.75rem',
      marginLeft: '0.25rem',
      textAlign: 'left',
    },
    input: {
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      border: `1px solid ${visuals.borderColor}`,
      background: inputBackground,
      color: visuals.textColor,
      fontSize: '1rem',
      outline: 'none',
    },
    submitButton: {
      padding: '0.875rem',
      borderRadius: '0.5rem',
      border: 'none',
      background: accentGradient,
      color: '#fff',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: '0.5rem',
      transition: 'opacity 0.2s ease',
    },
    toggleButton: {
      background: 'none', border: 'none',
      color: visuals.accentColor2,
      fontSize: '0.875rem',
      cursor: 'pointer',
      textDecoration: 'underline',
      marginTop: '0.75rem',
      alignSelf: 'center',
    },
    errorMessage: {
      color: visuals.hardColor,
      background: errorBackground,
      border: `1px solid ${errorBorder}`,
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      textAlign: 'center',
      margin: '-0.5rem 0 0.5rem 0',
    },
  } as const;
};

export default function AuthModal({ onClose, onLogin, onRegister }: Props) {
  // Gestionar àudio
  const audio = useGameAudio();
  const { getVisualSettings } = useSettings();
  const visualSettings = getVisualSettings('home');
  const styles = useMemo(() => buildStyles(visualSettings), [visualSettings]);

  const onCloseWithSound = () => {
    audio.playFail();
    onClose();
  };

  // Estats per als camps del formulari
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Estat per canviar entre els modes Iniciar Sessió / Registrar-se
  const [isRegistering, setIsRegistering] = useState(false);
  // Estat per mostrar missatges d'error
  const [error, setError] = useState<string | null>(null);

  // Enviament del formulari
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validacions Bàsiques
    if (!email || !password) {
      setError('El correu i la contrasenya són obligatoris.');
      return;
    }

    if (password.length < 6) {
      setError('La contrasenya ha de tenir com a mínim 6 caràcters.');
      return;
    }

    // Simular la creació/obtenció d'un usuari
    const fakeUser = { id: Date.now().toString(), email: email };
    console.log(`Simulant ${isRegistering ? 'registre' : 'inici de sessió'} per a:`, email);

    try {
      if (isRegistering) {
        onRegister(fakeUser);
      } else {
        onLogin(fakeUser);
      }
    } catch (apiError) {
      // TODO al fer el backend: Gestionar errors reals de l'API aquí
      console.error('Error de l\'API (simulat):', apiError);
      setError('Ha ocorregut un error. Torna a intentar-ho.');
    }
  };

  return (
    <div style={styles.overlay} onClick={onCloseWithSound} role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Botó per tancar el modal */}
        <button style={styles.closeButton} onClick={onCloseWithSound} aria-label="Tancar modal d'autenticació">
          <X size={20} />
        </button>

        {/* Títol segons si és registre o inici de sessió */}
        <h2 id="auth-title" style={styles.title}>
          {isRegistering ? 'Crear Compte' : 'Iniciar Sessió'}
        </h2>

        {/* Mostra missatges d'error si n'hi ha */}
        {error && <p style={styles.errorMessage}>{error}</p>}

        {/* Formulari */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label htmlFor="email-input" style={styles.label}>Correu electrònic</label>
          <input
            id="email-input"
            type="email"
            placeholder="el.teu@correu.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
            aria-required="true"
            autoComplete="email"
          />
          <label htmlFor="password-input" style={styles.label}>Contrasenya</label>
          <input
            id="password-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
            aria-required="true"
            minLength={6}
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
          />
          <button type="submit" style={styles.submitButton}>
            {isRegistering ? 'Registrar-se' : 'Entrar'}
          </button>
        </form>

        {/* Botó per canviar entre Iniciar Sessió / Registrar-se */}
        <button
          style={styles.toggleButton}
          onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
          type="button"
        >
          {isRegistering
            ? 'Ja tens compte? Inicia sessió'
            : 'No tens compte? Registra\'t'}
        </button>
      </div>
    </div>
  );
}
