import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, CircleAlert, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import {
  createMatch,
  getPlayers,
  joinMatch,
  joinMatchByCode,
  listOpenMatches,
  type MultiplayerMatch,
} from '../lib/multiplayer';
import NetworkBackground from '../components/NetworkBackground';
import { applyAlpha, pickReadableTextColor } from '../utils/color';
import { useMediaQuery } from '../utils/useMediaQuery';

type Diff = 'easy' | 'normal' | 'hard';
type NoticeAction = 'login' | 'register' | 'guest';
type NoticeKind = 'error' | 'info' | 'success';

type Notice = {
  kind: NoticeKind;
  message: string;
  action?: NoticeAction;
};

const sizePreset = (difficulty: Diff) => {
  if (difficulty === 'easy') return 5;
  if (difficulty === 'hard') return 9;
  return 7;
};

const memorizeFromSize = (size: number) => Math.min(20, Math.max(8, Math.round((size * size) / 7)));

const resolvePlayerName = (user: { displayName: string; email: string; isGuest: boolean }) => {
  if (user.displayName) return user.displayName;
  if (user.email) return user.email.split('@')[0];
  return user.isGuest ? 'Guest' : 'Player';
};

export default function MultiplayerScreen({
  onBack,
  onOpenMatch,
  onOpenAuth,
}: {
  onBack: () => void;
  onOpenMatch: (matchId: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}) {
  const { user, signInAsGuest } = useUser();
  const audio = useGameAudio();
  const { getVisualSettings } = useSettings();
  const screenSettings = getVisualSettings('multiplayer');
  const { t } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 600px)');

  const [isPublic, setIsPublic] = useState(false);
  const [roundsCount, setRoundsCount] = useState(3);
  const [difficulty, setDifficulty] = useState<Diff>('normal');
  const [joinCode, setJoinCode] = useState('');
  const [openMatches, setOpenMatches] = useState<MultiplayerMatch[]>([]);
  const [busy, setBusy] = useState(false);
  const [showCreateConfig, setShowCreateConfig] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const size = sizePreset(difficulty);
  const memorizeTime = memorizeFromSize(size);
  const isGuest = Boolean(user?.isGuest);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await listOpenMatches();
        if (mounted) setOpenMatches(list);
      } catch {
        // silent: notice messages are only user-driven to keep UI predictable
      }
    };

    void load();
    const id = window.setInterval(load, 3000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 5500);
    return () => window.clearTimeout(id);
  }, [notice]);

  const pushNotice = useCallback((kind: NoticeKind, message: string, action?: NoticeAction) => {
    setNotice({ kind, message, action });
  }, []);

  const ensureIdentity = useCallback(() => {
    if (user) return true;
    pushNotice('info', t('multiplayer.auth.requiredAction'), 'guest');
    return false;
  }, [user, pushNotice, t]);

  const handleContinueAsGuest = useCallback(async () => {
    if (user) return;
    setBusy(true);
    try {
      await signInAsGuest();
      pushNotice('success', t('multiplayer.auth.guestSigned'));
    } catch (error: any) {
      const message = String(error?.message ?? '');
      if (message.toLowerCase().includes('anonymous')) {
        pushNotice('error', t('multiplayer.auth.guestDisabled'));
      } else {
        pushNotice('error', t('multiplayer.auth.guestError'));
      }
    } finally {
      setBusy(false);
    }
  }, [user, signInAsGuest, pushNotice, t]);

  const handleNoticeAction = useCallback(async () => {
    if (!notice?.action) return;
    if (notice.action === 'login') {
      onOpenAuth('login');
      return;
    }
    if (notice.action === 'register') {
      onOpenAuth('register');
      return;
    }
    await handleContinueAsGuest();
  }, [notice?.action, onOpenAuth, handleContinueAsGuest]);

  const handleCreate = useCallback(async () => {
    if (!ensureIdentity() || !user) return;
    if (isPublic && user.isGuest) {
      pushNotice('info', t('multiplayer.public.requiresAccount'), 'login');
      return;
    }

    setBusy(true);
    try {
      const match = await createMatch({
        hostId: user.id,
        isPublic,
        roundsCount,
        config: {
          difficulty,
          width: size,
          height: size,
          memorizeTime,
        },
        displayName: resolvePlayerName(user),
      });
      onOpenMatch(match.id);
    } catch {
      pushNotice('error', t('multiplayer.create.error'));
    } finally {
      setBusy(false);
    }
  }, [ensureIdentity, user, isPublic, roundsCount, difficulty, size, memorizeTime, onOpenMatch, pushNotice, t]);

  const handleJoinByCode = useCallback(async () => {
    if (!ensureIdentity() || !user) return;

    const code = joinCode.trim().toUpperCase();
    if (!code) {
      pushNotice('error', t('multiplayer.notFound'));
      return;
    }

    setBusy(true);
    try {
      const match = await joinMatchByCode(code, resolvePlayerName(user));
      onOpenMatch(match.id);
    } catch (e: any) {
      const message = typeof e?.message === 'string' ? e.message : '';
      if (message.includes('match_not_found')) {
        pushNotice('error', t('multiplayer.notFound'));
      } else if (message.includes('match_full')) {
        pushNotice('error', t('multiplayer.open.full'));
      } else if (message.includes('match_not_waiting')) {
        pushNotice('error', t('multiplayer.matchNotWaiting'));
      } else {
        pushNotice('error', t('multiplayer.join.error'));
      }
    } finally {
      setBusy(false);
    }
  }, [ensureIdentity, user, joinCode, onOpenMatch, pushNotice, t]);

  const handleJoinOpenMatch = useCallback(async (match: MultiplayerMatch) => {
    if (!ensureIdentity() || !user) return;
    if (user.isGuest) {
      pushNotice('info', t('multiplayer.public.requiresAccount'), 'login');
      return;
    }

    setBusy(true);
    try {
      const players = await getPlayers(match.id);
      const activePlayers = players.filter((p) => p.status === 'joined');
      const existing = players.find((p) => p.user_id === user.id);

      if (existing) {
        if (existing.status !== 'joined') {
          await joinMatch(match.id, user.id, resolvePlayerName(user));
        }
        onOpenMatch(match.id);
        return;
      }

      if (activePlayers.length >= 2) {
        pushNotice('error', t('multiplayer.open.full'));
        return;
      }

      await joinMatch(match.id, user.id, resolvePlayerName(user));
      onOpenMatch(match.id);
    } catch {
      pushNotice('error', t('multiplayer.join.error'));
    } finally {
      setBusy(false);
    }
  }, [ensureIdentity, user, onOpenMatch, pushNotice, t]);

  const noticeBg = useMemo(() => {
    if (!notice) return 'transparent';
    if (notice.kind === 'success') return 'rgba(16, 185, 129, 0.12)';
    if (notice.kind === 'error') return 'rgba(239, 68, 68, 0.12)';
    return 'rgba(59, 130, 246, 0.12)';
  }, [notice]);

  const noticeBorder = useMemo(() => {
    if (!notice) return 'transparent';
    if (notice.kind === 'success') return 'rgba(16, 185, 129, 0.45)';
    if (notice.kind === 'error') return 'rgba(239, 68, 68, 0.45)';
    return 'rgba(59, 130, 246, 0.45)';
  }, [notice]);

  const styles = useMemo<Record<string, React.CSSProperties>>(() => ({
    page: {
      minHeight: '100svh',
      padding: 'clamp(16px, 3vw, 28px)',
      color: screenSettings.textColor,
      fontFamily: '"Space Grotesk", "Sora", "Segoe UI", sans-serif',
      position: 'relative',
      isolation: 'isolate',
    },
    shell: {
      width: '100%',
      maxWidth: 900,
      marginInline: 'auto',
      display: 'grid',
      gap: 16,
    },
    header: {
      display: 'grid',
      gridTemplateColumns: 'min-content 1fr min-content',
      gap: 14,
      alignItems: 'center',
    },
    titleWrap: {
      textAlign: 'center',
    },
    title: {
      margin: 0,
      fontSize: 'clamp(24px, 4vw, 34px)',
      fontWeight: 800,
      lineHeight: 1.08,
    },
    subtitle: {
      margin: '6px 0 0 0',
      opacity: 0.82,
      fontSize: 'clamp(13px, 1.5vw, 15px)',
    },
    ghostBtn: {
      padding: '10px 14px',
      borderRadius: 10,
      border: `1px solid ${screenSettings.borderColor}`,
      background: screenSettings.surfaceColor,
      color: screenSettings.textColor,
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer',
      height: 'fit-content',
    },
    noticeWrap: {
      minHeight: 56,
    },
    notice: {
      border: `1px solid ${noticeBorder}`,
      background: noticeBg,
      borderRadius: 10,
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    noticeText: {
      display: 'inline-flex',
      gap: 8,
      alignItems: 'center',
      fontSize: 13,
      fontWeight: 600,
    },
    noticeAction: {
      border: `1px solid ${screenSettings.borderColor}`,
      background: applyAlpha(screenSettings.surfaceColor, 0.85),
      color: screenSettings.textColor,
      borderRadius: 8,
      padding: '6px 10px',
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    },
    card: {
      background: applyAlpha(screenSettings.surfaceColor, 0.95),
      border: `1px solid ${screenSettings.borderColor}`,
      borderRadius: 16,
      boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
      padding: 18,
      display: 'grid',
      gap: 14,
    },
    sectionTitle: {
      margin: 0,
      fontSize: 20,
      fontWeight: 800,
    },
    sectionSub: {
      margin: '2px 0 0 0',
      color: screenSettings.subtextColor,
      fontSize: 13,
    },
    authGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 10,
    },
    authButton: {
      borderRadius: 10,
      border: `1px solid ${screenSettings.borderColor}`,
      background: applyAlpha(screenSettings.surfaceColor, 0.85),
      color: screenSettings.textColor,
      padding: '10px 12px',
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer',
    },
    authButtonPrimary: {
      background: `linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
      color: pickReadableTextColor(screenSettings.accentColor1),
      border: 'none',
    },
    label: {
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: '0.02em',
      color: screenSettings.subtextColor,
      textTransform: 'uppercase',
      marginBottom: 6,
      display: 'block',
    },
    inputRow: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 10,
    },
    input: {
      padding: '11px 12px',
      borderRadius: 10,
      border: `1px solid ${screenSettings.borderColor}`,
      background: applyAlpha(screenSettings.backgroundColor, 0.4),
      color: screenSettings.textColor,
      fontSize: 14,
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
    },
    primaryBtn: {
      border: 'none',
      borderRadius: 10,
      padding: '11px 14px',
      background: `linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
      color: pickReadableTextColor(screenSettings.accentColor1),
      fontWeight: 800,
      fontSize: 14,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
    },
    list: {
      display: 'grid',
      gap: 8,
      maxHeight: 220,
      overflowY: 'auto',
      paddingRight: 4,
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      borderRadius: 10,
      border: `1px solid ${screenSettings.borderColor}`,
      padding: '10px 12px',
      background: applyAlpha(screenSettings.backgroundColor, 0.25),
    },
    rowTitle: {
      margin: 0,
      fontSize: 15,
      fontWeight: 700,
    },
    rowMeta: {
      margin: '2px 0 0 0',
      fontSize: 12,
      color: screenSettings.subtextColor,
    },
    empty: {
      border: `1px dashed ${screenSettings.borderColor}`,
      borderRadius: 10,
      padding: '12px 14px',
      color: screenSettings.subtextColor,
      fontSize: 13,
      textAlign: 'center',
    },
    toggleCreate: {
      border: `1px solid ${screenSettings.borderColor}`,
      background: 'transparent',
      color: screenSettings.textColor,
      borderRadius: 10,
      padding: '10px 12px',
      fontWeight: 700,
      fontSize: 14,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      justifySelf: 'start',
    },
    configGrid: {
      display: 'grid',
      gap: 14,
    },
    switchRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '8px 10px',
      border: `1px solid ${screenSettings.borderColor}`,
      borderRadius: 10,
      background: applyAlpha(screenSettings.backgroundColor, 0.2),
    },
    switchButton: {
      border: 'none',
      borderRadius: 999,
      width: 48,
      height: 26,
      position: 'relative',
      cursor: 'pointer',
      background: isPublic
        ? `linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`
        : applyAlpha(screenSettings.borderColor, 0.65),
      transition: 'background 0.2s ease',
    },
    switchThumb: {
      position: 'absolute',
      top: 3,
      left: isPublic ? 25 : 3,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: '#fff',
      transition: 'left 0.2s ease',
    },
    segment: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 6,
      background: applyAlpha(screenSettings.backgroundColor, 0.2),
      border: `1px solid ${screenSettings.borderColor}`,
      borderRadius: 10,
      padding: 4,
    },
    segmentBtn: {
      border: 'none',
      borderRadius: 8,
      padding: '9px 8px',
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      background: 'transparent',
      color: screenSettings.subtextColor,
    },
    helper: {
      fontSize: 12,
      color: screenSettings.subtextColor,
    },
  }), [screenSettings, noticeBg, noticeBorder, isPublic]);

  const getSegmentStyle = (active: boolean): React.CSSProperties => ({
    ...styles.segmentBtn,
    ...(active
      ? {
        background: screenSettings.surfaceColor,
        color: screenSettings.textColor,
        boxShadow: '0 1px 6px rgba(0,0,0,0.14)',
      }
      : null),
  });

  const actionLabel = notice?.action
    ? t(
      notice.action === 'login'
        ? 'multiplayer.auth.action.login'
        : notice.action === 'register'
          ? 'multiplayer.auth.action.register'
          : 'multiplayer.auth.action.guest',
    )
    : '';

  return (
    <main style={styles.page}>
      <NetworkBackground
        primaryColor={screenSettings.accentColor1}
        backgroundColor={screenSettings.backgroundColor}
        opacity={0.38}
      />

      <div style={styles.shell}>
        <header style={{ ...styles.header, ...(isMobile ? { gridTemplateColumns: '1fr', justifyItems: 'center', textAlign: 'center', gap: 10 } : {}) }}>
          {!isMobile && (
            <button type="button" style={styles.ghostBtn} onClick={onBack} onMouseEnter={() => audio.playHover()}>
              ← {t('common.back')}
            </button>
          )}
          <div style={styles.titleWrap}>
            {isMobile && (
              <button type="button" style={{ ...styles.ghostBtn, marginBottom: 8 }} onClick={onBack} onMouseEnter={() => audio.playHover()}>
                ← {t('common.back')}
              </button>
            )}
            <h1 style={styles.title}>{t('multiplayer.title')}</h1>
            <p style={styles.subtitle}>{t('multiplayer.subtitle')}</p>
          </div>
          {!isMobile && <div style={{ width: 90 }} />}
        </header>

        <div style={styles.noticeWrap}>
          {notice && (
            <div role="status" aria-live="polite" style={styles.notice}>
              <span style={styles.noticeText}>
                <CircleAlert size={16} />
                {notice.message}
              </span>
              {notice.action && (
                <button
                  type="button"
                  style={styles.noticeAction}
                  onClick={handleNoticeAction}
                  disabled={busy}
                >
                  {actionLabel}
                </button>
              )}
            </div>
          )}
        </div>

        {!user && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>{t('multiplayer.auth.title')}</h2>
            <p style={styles.sectionSub}>{t('multiplayer.auth.subtitle')}</p>
            <div style={styles.authGrid}>
              <button
                type="button"
                style={{ ...styles.authButton, ...styles.authButtonPrimary }}
                onClick={() => onOpenAuth('login')}
                disabled={busy}
              >
                {t('multiplayer.auth.login')}
              </button>
              <button
                type="button"
                style={styles.authButton}
                onClick={() => onOpenAuth('register')}
                disabled={busy}
              >
                {t('multiplayer.auth.register')}
              </button>
              <button
                type="button"
                style={styles.authButton}
                onClick={handleContinueAsGuest}
                disabled={busy}
              >
                {t('multiplayer.auth.guest')}
              </button>
            </div>
          </section>
        )}

        {user?.isGuest && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>{t('multiplayer.auth.guestTitle')}</h2>
            <p style={styles.sectionSub}>{t('multiplayer.auth.guestSubtitle')}</p>
            <div style={styles.authGrid}>
              <button
                type="button"
                style={{ ...styles.authButton, ...styles.authButtonPrimary }}
                onClick={() => onOpenAuth('login')}
              >
                {t('multiplayer.auth.login')}
              </button>
              <button
                type="button"
                style={styles.authButton}
                onClick={() => onOpenAuth('register')}
              >
                {t('multiplayer.auth.register')}
              </button>
            </div>
          </section>
        )}

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>{t('multiplayer.join.title')}</h2>
          <p style={styles.sectionSub}>{t('multiplayer.join.subtitle')}</p>

          <div>
            <label style={styles.label} htmlFor="mp-join-code">{t('multiplayer.join.code')}</label>
            <div style={styles.inputRow}>
              <input
                id="mp-join-code"
                style={styles.input}
                placeholder={t('multiplayer.join.codePlaceholder')}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
              <button type="button" style={styles.primaryBtn} onClick={handleJoinByCode} disabled={busy}>
                <ArrowRight size={16} />
                {t('multiplayer.join.cta')}
              </button>
            </div>
          </div>

          <div>
            <span style={styles.label}>{t('multiplayer.open.title')}</span>
            <div style={styles.list}>
              {openMatches.length === 0 && (
                <div style={styles.empty}>{t('multiplayer.open.empty')}</div>
              )}
              {openMatches.map((m) => (
                <div key={m.id} style={styles.row}>
                  <div>
                    <p style={styles.rowTitle}>{m.display_name ?? t('multiplayer.anonymous')}</p>
                    <p style={styles.rowMeta}>
                      {t('multiplayer.code')}: <strong>{m.code}</strong> · {m.rounds_count} {t('multiplayer.rounds')} · {m.config?.difficulty}
                    </p>
                  </div>
                  <button
                    type="button"
                    style={styles.ghostBtn}
                    onClick={() => void handleJoinOpenMatch(m)}
                    disabled={busy}
                  >
                    {t('multiplayer.open.join')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>{t('multiplayer.create.title')}</h2>
          <p style={styles.sectionSub}>{t('multiplayer.create.subtitle')}</p>

          <button
            type="button"
            style={styles.toggleCreate}
            onClick={() => setShowCreateConfig((prev) => !prev)}
          >
            <Sparkles size={16} />
            {showCreateConfig ? t('multiplayer.create.hideConfig') : t('multiplayer.create.configure')}
            {showCreateConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showCreateConfig && (
            <div style={styles.configGrid}>
              <div style={styles.switchRow}>
                <div>
                  <div style={{ fontWeight: 700 }}>{t('multiplayer.create.public')}</div>
                  <div style={styles.helper}>
                    {isGuest ? t('multiplayer.public.requiresAccount') : t('multiplayer.create.publicHint')}
                  </div>
                </div>
                <button
                  type="button"
                  style={styles.switchButton}
                  onClick={() => {
                    if (isGuest) {
                      pushNotice('info', t('multiplayer.public.requiresAccount'), 'login');
                      return;
                    }
                    setIsPublic((prev) => !prev);
                  }}
                  aria-pressed={isPublic}
                >
                  <span style={styles.switchThumb} />
                </button>
              </div>

              <div>
                <span style={styles.label}>{t('multiplayer.create.rounds')}</span>
                <div style={styles.segment}>
                  {[3, 5, 7].map((r) => (
                    <button
                      key={r}
                      type="button"
                      style={getSegmentStyle(roundsCount === r)}
                      onClick={() => setRoundsCount(r)}
                    >
                      {r} {t('multiplayer.rounds')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={styles.label}>{t('multiplayer.create.difficulty')}</span>
                <div style={styles.segment}>
                  {(['easy', 'normal', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      style={getSegmentStyle(difficulty === d)}
                      onClick={() => setDifficulty(d)}
                    >
                      {d === 'easy' ? t('difficulty.easy') : d === 'normal' ? t('difficulty.normal') : t('difficulty.hard')}
                    </button>
                  ))}
                </div>
              </div>

              <p style={styles.helper}>
                {t('multiplayer.create.size')}: <strong>{size}x{size}</strong> · {t('multiplayer.create.memorize')}:{' '}
                <strong>{memorizeTime}s</strong>
              </p>

              <button type="button" style={styles.primaryBtn} onClick={handleCreate} disabled={busy}>
                {t('common.create')}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
