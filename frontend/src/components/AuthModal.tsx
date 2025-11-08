import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

// Props per al modal
type Props = {
  onClose: () => void;
};

const buildStyles = (visuals: VisualSettings) => {
  const accentGradient = `linear-gradient(90deg, ${visuals.accentColor1}, ${visuals.accentColor2})`;
  const inputBackground = applyAlpha(visuals.textColor, 0.08);
  const overlayColor = applyAlpha(visuals.textColor, 0.75);
  const errorBackground = applyAlpha(visuals.hardColor, 0.15);
  const errorBorder = applyAlpha(visuals.hardColor, 0.3);
  const successBackground = applyAlpha(visuals.accentColor1, 0.18);
  const successBorder = applyAlpha(visuals.accentColor1, 0.35);

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
    successMessage: {
      color: visuals.accentColor1,
      background: successBackground,
      border: `1px solid ${successBorder}`,
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      fontSize: '0.9rem',
      textAlign: 'center',
      margin: '0 0 0.75rem 0',
    },
    successActions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    },
  } as const;
};

export default function AuthModal({ onClose }: Props) {
  // Gestionar àudio
  const audio = useGameAudio();
  const { getVisualSettings } = useSettings();
  const visualSettings = getVisualSettings('home');
  const styles = useMemo(() => buildStyles(visualSettings), [visualSettings]);
  const { user } = useUser();

  const onCloseWithSound = () => {
    audio.playFail();
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  // Estats per als camps del formulari
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetSending, setIsResetSending] = useState(false);

  // Estat per canviar entre els modes Iniciar Sessió / Registrar-se
  const [isRegistering, setIsRegistering] = useState(false);
  // Estat per mostrar missatges d'error
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setSuccessMessage(null);
      onClose();
    }
  }, [user, onClose]);

  const getEmailRedirectUrl = () => {
    if (typeof window === 'undefined') {
      return '';
    }
    const base = import.meta.env.BASE_URL ?? '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    const relativePath = `${normalizedBase}auth/callback`.replace(/\/{2,}/g, '/');
    return `${window.location.origin}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  };

  const getResetRedirectUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = import.meta.env.BASE_URL ?? '/';
    const normalized = base.endsWith('/') ? base : `${base}/`;
    const relative = `${normalized}auth/reset`.replace(/\/{2,}/g, '/');
    return `${window.location.origin}${relative.startsWith('/') ? '' : '/'}${relative}`;
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccessMessage(null);
    if (!email) {
      setError('Introdueix el correu per enviar l’enllaç de restabliment.');
      return;
    }
    setIsResetSending(true);
    try {
      const redirectTo = getResetRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      setSuccessMessage('T’hem enviat un correu per restablir la contrasenya.');
    } catch (_e) {
      setError('No s’ha pogut enviar el correu de restabliment. Torna-ho a provar.');
    } finally {
      setIsResetSending(false);
    }
  };

  // Enviament del formulari
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validacions Bàsiques
    if (!email || !password) {
      setError('El correu i la contrasenya són obligatoris.');
      return;
    }

    if (password.length < 6) {
      setError('La contrasenya ha de tenir com a mínim 6 caràcters.');
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError('Les contrasenyes no coincideixen.');
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegistering) {
        const redirectTo = getEmailRedirectUrl();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
        });

        // Gestió d'errors específics
        if (signUpError) {
          const msg = signUpError.message?.toLowerCase() ?? '';
          if (msg.includes('registered') || msg.includes('already')) {
            setError('Aquest correu ja està registrat. Inicia sessió o recupera la contrasenya.');
          } else if (msg.includes('rate') || msg.includes('too many')) {
            setError('Has fet massa intents. Espera uns minuts i torna-ho a provar.');
          } else {
            setError('No s’ha pogut completar el registre. Torna-ho a provar.');
          }
          return;
        }

        // Cas fantasma de Supabase: usuari ja existeix -> identities buides
        if (data?.user && Array.isArray((data.user as any).identities) && (data.user as any).identities.length === 0) {
          setError('Aquest correu ja està registrat. Inicia sessió o recupera la contrasenya.');
          return;
        }

        // Demanar verificació per correu
        if (!data.session) {
          setSuccessMessage('Hem enviat un correu de verificació. Revisa la safata d\'entrada per completar el registre.');
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw signInError;
        }
      }
    } catch (apiError) {
      console.error('Error en autenticació Supabase:', apiError);
      setError(apiError instanceof Error ? apiError.message : 'Ha ocorregut un error. Torna a intentar-ho.');
    } finally {
      setIsSubmitting(false);
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

        {successMessage ? (
          <div style={styles.successActions}>
            <p style={styles.successMessage}>{successMessage}</p>
            <button
              style={styles.submitButton}
              type="button"
              onClick={onCloseWithSound}
            >
              Entesos
            </button>
          </div>
        ) : (
          <>
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
              {isRegistering && (
                <>
                  <label htmlFor="password2-input" style={styles.label}>Repeteix la contrasenya</label>
                  <input
                    id="password2-input"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={styles.input}
                    required
                    aria-required="true"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </>
              )}

              <button
                type="submit"
                style={{ ...styles.submitButton, opacity: isSubmitting ? 0.7 : 1 }}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Enviant...'
                  : isRegistering
                    ? 'Registrar-se'
                    : 'Entrar'}
              </button>

              {!isRegistering && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  style={styles.toggleButton}
                  disabled={isSubmitting || isResetSending}
                >
                  {isResetSending ? 'Enviant...' : 'He oblidat la contrasenya'}
                </button>
              )}
            </form>

            {/* Botó per canviar entre Iniciar Sessió / Registrar-se */}
            <button
              style={styles.toggleButton}
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setSuccessMessage(null);
              }}
              type="button"
              disabled={isSubmitting}
            >
              {isRegistering
                ? 'Ja tens compte? Inicia sessió'
                : 'No tens compte? Registra\'t'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
