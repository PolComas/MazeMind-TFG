import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import type { VisualSettings } from '../utils/settings';
import { applyAlpha } from '../utils/color';
import { useLanguage } from '../context/LanguageContext';

const buildStyles = (v: VisualSettings) => {
  const cardBg = v.surfaceColor;
  const border = v.borderColor;
  const inputBg = applyAlpha(v.textColor, 0.08);
  const accent = `linear-gradient(90deg, ${v.accentColor1}, ${v.accentColor2})`;
  const errorBg = applyAlpha(v.hardColor, 0.15);
  const errorBorder = applyAlpha(v.hardColor, 0.3);
  const okBg = applyAlpha(v.accentColor1, 0.18);
  const okBorder = applyAlpha(v.accentColor1, 0.35);

  return {
    wrap: { minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '1rem' },
    card: { width: 'min(420px, 95vw)', background: cardBg, border: `1px solid ${border}`, borderRadius: '1rem', padding: '2rem', color: v.textColor, display: 'grid', gap: '1rem' },
    title: { margin: 0, fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' },
    label: { fontSize: '0.9rem', color: v.subtextColor, marginBottom: '-0.5rem', marginLeft: '0.25rem' },
    input: { padding: '0.75rem 1rem', borderRadius: '0.5rem', border: `1px solid ${border}`, background: inputBg, color: v.textColor },
    btn: { padding: '0.85rem', borderRadius: '0.5rem', border: 'none', background: accent, color: '#fff', fontWeight: 700, cursor: 'pointer' },
    btnGhost: { padding: '0.85rem', borderRadius: '0.5rem', border: `1px solid ${border}`, background: 'transparent', color: v.textColor, fontWeight: 600, cursor: 'pointer' },
    error: { color: v.hardColor, background: errorBg, border: `1px solid ${errorBorder}`, borderRadius: '0.5rem', padding: '0.75rem 1rem', textAlign: 'center' },
    ok: { color: v.accentColor1, background: okBg, border: `1px solid ${okBorder}`, borderRadius: '0.5rem', padding: '0.75rem 1rem', textAlign: 'center' },
  } as const;
};

export default function ResetPasswordScreen({ onDone }: { onDone?: () => void }) {
  const { getVisualSettings } = useSettings();
  const { t } = useLanguage();
  const styles = useMemo(() => buildStyles(getVisualSettings('home')), [getVisualSettings]);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setOk(null);

    if (p1.length < 6) { setError(t('auth.validation.passwordMin')); return; }
    if (p1 !== p2) { setError(t('auth.validation.passwordMismatch')); return; }

    setBusy(true);
    try {
      // Actualitzar la contrasenya a Supabase
      const { error: updateError } = await supabase.auth.updateUser({ password: p1 });
     
      // Gestionar errors
      if (updateError) {
        setError(t('resetPassword.error.update'));
        return;
      }

      setOk(t('resetPassword.success'));
      setFinished(true);

      // Tancar sessió en aquesta pestanya per no forçar la sessió a la resta de pestanyes
      setTimeout(async () => {
        try {
            const signOutRes = await supabase.auth.signOut();
            console.debug('[ResetPassword] signOut result', signOutRes);
        } catch (e) {
            console.debug('[ResetPassword] signOut error', e);
        }
      }, 500);
    } catch (_e) {
      setError(t('resetPassword.error.update'));
    } finally {
      setBusy(false);
    }
  };

  const goHome = () => {
    onDone?.();
  };

  return (
    <div style={styles.wrap}>
      <form style={styles.card} onSubmit={submit}>
        <h2 style={styles.title}>{t('resetPassword.title')}</h2>
        {error && <div style={styles.error}>{error}</div>}
        {ok && <div style={styles.ok}>{ok}</div>}

        {!finished ? (
          <>
            <label htmlFor="np1" style={styles.label}>{t('resetPassword.new')}</label>
            <input id="np1" type="password" style={styles.input}
                   value={p1} onChange={e => setP1(e.target.value)}
                   minLength={6} required autoComplete="new-password" />

            <label htmlFor="np2" style={styles.label}>{t('auth.passwordRepeat')}</label>
            <input id="np2" type="password" style={styles.input}
                   value={p2} onChange={e => setP2(e.target.value)}
                   minLength={6} required autoComplete="new-password" />

            <button type="submit" style={styles.btn} disabled={busy}>
              {busy ? t('resetPassword.saving') : t('resetPassword.update')}
            </button>
          </>
        ) : (
          <>
            <button type="button" style={styles.btn} onClick={goHome}>{t('resetPassword.backHome')}</button>
          </>
        )}
      </form>
    </div>
  );
}
