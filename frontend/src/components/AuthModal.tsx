import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { useFocusTrap } from '../utils/focusTrap';

// Props per al modal
type Props = {
  onClose: () => void;
};

const buildStyles = (visuals: VisualSettings) => {
  const accentGradient = `linear-gradient(90deg, ${visuals.accentColor1}, ${visuals.accentColor2})`;
  const inputBackground = applyAlpha(visuals.textColor, 0.08);
  const errorBackground = applyAlpha(visuals.hardColor, 0.15);
  const errorBorder = applyAlpha(visuals.hardColor, 0.3);
  const successBackground = applyAlpha(visuals.accentColor1, 0.18);
  const successBorder = applyAlpha(visuals.accentColor1, 0.35);

  return {
    overlay: {
      position: 'fixed', inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
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
  const { getVisualSettings, settings } = useSettings();
  const visualSettings = getVisualSettings('home');
  const styles = useMemo(() => buildStyles(visualSettings), [visualSettings]);
  const { user } = useUser();
  const { t } = useLanguage();

  const onCloseWithSound = () => {
    audio.playFail();
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  useEffect(() => {
    const closeKey = (settings.game.keyCloseModal || '').toLowerCase();
    if (!closeKey) return;

    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isEscape = key === 'escape';
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
          (target as any).isContentEditable)
      ) {
        if (!isEscape && closeKey !== 'escape') {
          return;
        }
      }

      if (e.key === settings.game.keyCloseModal || key === closeKey) {
        e.preventDefault();
        onCloseWithSound();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [settings.game.keyCloseModal, onCloseWithSound]);

  // Estats per als camps del formulari
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetSending, setIsResetSending] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useFocusTrap(true, modalRef);

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
      setError(t('auth.reset.prompt'));
      return;
    }
    setIsResetSending(true);
    try {
      const redirectTo = getResetRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      setSuccessMessage(t('auth.reset.success'));
    } catch (_e) {
      setError(t('auth.reset.error'));
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
      setError(t('auth.validation.required'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.validation.passwordMin'));
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError(t('auth.validation.passwordMismatch'));
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
            setError(t('auth.error.emailExists'));
          } else if (msg.includes('rate') || msg.includes('too many')) {
            setError(t('auth.rateLimit'));
          } else {
            setError(t('auth.error.signupFailed'));
          }
          return;
        }

        // Cas fantasma de Supabase: usuari ja existeix -> identities buides
        if (data?.user && Array.isArray((data.user as any).identities) && (data.user as any).identities.length === 0) {
          setError(t('auth.error.emailExists'));
          return;
        }

        // Demanar verificació per correu
        if (!data.session) {
          setSuccessMessage(t('auth.verify.sent'));
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
      setError(apiError instanceof Error ? apiError.message : t('auth.error.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onCloseWithSound} role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div ref={modalRef} style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Botó per tancar el modal */}
        <button style={styles.closeButton} onClick={onCloseWithSound} aria-label={t('auth.modal.closeLabel')}>
          <X size={20} />
        </button>

        {/* Títol segons si és registre o inici de sessió */}
        <h2 id="auth-title" style={styles.title}>
          {isRegistering ? t('auth.create.title') : t('auth.login.title')}
        </h2>

        {successMessage ? (
          <div style={styles.successActions}>
            <p style={styles.successMessage}>{successMessage}</p>
            <button
              style={styles.submitButton}
              type="button"
              onClick={onCloseWithSound}
            >
              {t('common.ok')}
            </button>
          </div>
        ) : (
          <>
            {/* Mostra missatges d'error si n'hi ha */}
            {error && <p style={styles.errorMessage}>{error}</p>}

            {/* Formulari */}
            <form onSubmit={handleSubmit} style={styles.form}>
              <label htmlFor="email-input" style={styles.label}>{t('auth.email')}</label>
              <input
                id="email-input"
                type="email"
                placeholder={t('auth.email.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
                aria-required="true"
                autoComplete="email"
              />
              <label htmlFor="password-input" style={styles.label}>{t('auth.password')}</label>
              <input
                id="password-input"
                type="password"
                placeholder={t('auth.password.placeholder')}
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
                  <label htmlFor="password2-input" style={styles.label}>{t('auth.passwordRepeat')}</label>
                  <input
                    id="password2-input"
                    type="password"
                    placeholder={t('auth.password.placeholder')}
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
                  ? t('common.sending')
                  : isRegistering
                    ? t('auth.signup')
                    : t('auth.signin')}
              </button>

              {!isRegistering && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  style={styles.toggleButton}
                  disabled={isSubmitting || isResetSending}
                >
                  {isResetSending ? t('common.sending') : t('auth.reset.cta')}
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
                ? t('auth.haveAccount')
                : t('auth.needAccount')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
