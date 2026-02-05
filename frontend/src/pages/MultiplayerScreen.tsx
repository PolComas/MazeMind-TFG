import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useGameAudio } from '../audio/sound';
import { useSettings } from '../context/SettingsContext';
import {
  createMatch,
  getMatchByCode,
  getPlayers,
  joinMatch,
  listOpenMatches,
  type MultiplayerMatch,
} from '../lib/multiplayer';
import NetworkBackground from '../components/NetworkBackground';

const sizePreset = (difficulty: 'easy' | 'normal' | 'hard') => {
  if (difficulty === 'easy') return 5;
  if (difficulty === 'hard') return 9;
  return 7;
};

const memorizeFromSize = (size: number) => Math.min(20, Math.max(8, Math.round((size * size) / 7)));

export default function MultiplayerScreen({ onBack, onOpenMatch }: { onBack: () => void; onOpenMatch: (matchId: string) => void }) {
  const { user } = useUser();
  const audio = useGameAudio();
  const { getVisualSettings } = useSettings();
  const screenSettings = getVisualSettings('levelSelect');

  const [isPublic, setIsPublic] = useState(false);
  const [roundsCount, setRoundsCount] = useState(3);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [joinCode, setJoinCode] = useState('');
  const [openMatches, setOpenMatches] = useState<MultiplayerMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const size = sizePreset(difficulty);
  const memorizeTime = memorizeFromSize(size);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await listOpenMatches();
        if (mounted) setOpenMatches(list);
      } catch (e) {
        // Silent error for now as per user request to not show "Unable to load open matches"
        // if (mounted) setError('No s\'han pogut carregar les partides obertes.');
      }
    };

    load();
    const id = window.setInterval(load, 3000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const handleCreate = useCallback(async () => {
    if (!user) {
      setError('Cal iniciar sessió per crear una partida.');
      return;
    }
    setBusy(true);
    setError(null);
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
        displayName: user.email?.split('@')[0] ?? null,
      });
      onOpenMatch(match.id);
    } catch (e) {
      setError('No s\'ha pogut crear la partida.');
    } finally {
      setBusy(false);
    }
  }, [user, isPublic, roundsCount, difficulty, size, memorizeTime, onOpenMatch]);

  const handleJoinByCode = useCallback(async () => {
    if (!user) {
      setError('Cal iniciar sessió per unir-se.');
      return;
    }
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError('Introdueix un codi vàlid.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const match = await getMatchByCode(code);
      if (!match) {
        setError('No s\'ha trobat cap partida amb aquest codi.');
        return;
      }
      const players = await getPlayers(match.id);
      if (players.find((p) => p.user_id === user.id)) {
        onOpenMatch(match.id);
        return;
      }
      if (players.length >= 2) {
        setError('La partida ja està plena.');
        return;
      }
      await joinMatch(match.id, user.id, user.email?.split('@')[0] ?? null);
      onOpenMatch(match.id);
    } catch (e) {
      setError('No s\'ha pogut unir a la partida.');
    } finally {
      setBusy(false);
    }
  }, [user, joinCode, onOpenMatch]);

  const styles = useMemo<Record<string, React.CSSProperties>>(() => ({
    page: {
      height: '100svh', // Fixed height
      padding: 'clamp(16px, 3vw, 32px)',
      // background: 'transparent',
      color: screenSettings.textColor,
      fontFamily: '"Space Grotesk", "Sora", "Segoe UI", sans-serif',
      position: 'relative',
      isolation: 'isolate',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden', // Prevent body scroll
    },
    header: {
      display: 'grid',
      gridTemplateColumns: 'min-content 1fr min-content',
      alignItems: 'center',
      marginBottom: 20, // Compact margin
      gap: 16,
      width: '100%',
      maxWidth: 1200,
      marginInline: 'auto',
      flexShrink: 0,
    },
    headerTitleCol: {
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    title: { fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, margin: 0, lineHeight: 1.1 },
    subtitle: { opacity: 0.8, maxWidth: 600, margin: '4px 0 0 0', fontSize: 'clamp(13px, 1.5vw, 15px)' },

    // Scrollable Grid Container
    gridContainer: {
      flex: 1,
      width: '100%',
      overflowY: 'auto',
      paddingBottom: 20,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
      gap: 20, // Compact gap
      width: '100%',
      maxWidth: 1200,
      marginInline: 'auto',
      alignItems: 'start',
    },
    card: {
      background: screenSettings.surfaceColor,
      border: `1px solid ${screenSettings.borderColor}`,
      borderRadius: 24,
      padding: 24, // Compact padding
      boxShadow: '0 16px 32px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16, // Compact gap
      boxSizing: 'border-box',
    },
    cardHeader: {
      fontSize: 22,
      fontWeight: 700,
      margin: 0,
      marginBottom: 4,
      borderBottom: `1px solid ${screenSettings.borderColor}`,
      paddingBottom: 12,
    },

    // Controls
    label: { fontWeight: 600, fontSize: 13, color: screenSettings.subtextColor, marginBottom: 6, display: 'block' },

    // Custom Toggle Switch
    switchRow: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' },
    switchTrack: {
      width: 44, height: 24, borderRadius: 999,
      background: isPublic ? `linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})` : 'rgba(255,255,255,0.1)',
      position: 'relative', transition: 'background 0.3s ease',
      border: `1px solid ${screenSettings.borderColor}`,
    },
    switchThumb: {
      width: 18, height: 18, borderRadius: '50%', background: '#fff',
      position: 'absolute', top: 2, left: isPublic ? 22 : 2,
      transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },

    // Segmented Controls
    segmentGroup: {
      display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 10, border: `1px solid ${screenSettings.borderColor}`,
    },
    segmentBtn: {
      flex: 1, padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease',
      textAlign: 'center',
    },

    // Inputs
    input: {
      padding: '10px 14px', borderRadius: 10,
      border: `1px solid ${screenSettings.borderColor}`,
      background: 'rgba(0,0,0,0.2)',
      color: screenSettings.textColor,
      fontSize: 15, width: '100%', boxSizing: 'border-box',
      outline: 'none',
      transition: 'border-color 0.2s',
    },

    button: {
      padding: '14px 20px', borderRadius: 14,
      border: `none`,
      background: `linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
      color: screenSettings.textColor,
      fontWeight: 800, fontSize: 16,
      cursor: 'pointer', width: '100%',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'transform 0.1s ease',
    },
    ghost: {
      padding: '10px 16px', borderRadius: 10,
      border: `1px solid ${screenSettings.borderColor}`,
      background: screenSettings.surfaceColor,
      color: screenSettings.textColor,
      cursor: 'pointer', fontWeight: 600, fontSize: 13,
    },

    // List
    list: {
      display: 'flex', flexDirection: 'column', gap: 8,
      overflowY: 'auto',
      height: 260, // Fixed height for scrolling
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 12,
      padding: 4,
    },
    matchRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${screenSettings.borderColor}`,
    },
    error: { color: '#fca5a5', background: 'rgba(252, 165, 165, 0.1)', padding: 10, borderRadius: 8, fontWeight: 600, marginBottom: 12, textAlign: 'center', fontSize: 14 },
  }), [screenSettings, isPublic]);

  const getSegmentStyle = (isActive: boolean) => ({
    ...styles.segmentBtn,
    background: isActive ? screenSettings.surfaceColor : 'transparent',
    color: isActive ? screenSettings.textColor : screenSettings.subtextColor,
    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
    transform: isActive ? 'scale(1.02)' : 'none',
  });

  return (
    <div style={styles.page}>
      <NetworkBackground
        primaryColor={screenSettings.accentColor1}
        backgroundColor={screenSettings.backgroundColor}
      />

      {/* Header Grid: Back | Title | Spacer */}
      <div style={styles.header}>
        <button style={styles.ghost} onClick={onBack} onMouseEnter={() => audio.playHover()}>
          ← Tornar
        </button>
        <div style={styles.headerTitleCol}>
          <h1 style={styles.title}>Multijugador</h1>
          <p style={styles.subtitle}>Desafia als teus amics en temps real</p>
        </div>
        <div style={{ width: 80 }}></div> {/* Spacer to balance Back button */}
      </div>

      <div style={styles.grid}>
        {/* CREATE CARD */}
        <section style={styles.card}>
          <h2 style={styles.cardHeader}>Crear partida</h2>

          {/* Custom Switch */}
          <div style={styles.switchRow} onClick={() => setIsPublic(!isPublic)}>
            <div style={styles.switchTrack}>
              <div style={styles.switchThumb} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Partida pública</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Qualsevol usuari s'hi podrà unir</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 24 }}>
            <div>
              <span style={styles.label}>Rondes</span>
              <div style={styles.segmentGroup}>
                {[3, 5, 7].map(r => (
                  <button
                    key={r}
                    style={getSegmentStyle(roundsCount === r)}
                    onClick={() => setRoundsCount(r)}
                  >
                    {r} Rondes
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span style={styles.label}>Dificultat</span>
              <div style={styles.segmentGroup}>
                {(['easy', 'normal', 'hard'] as const).map(d => (
                  <button
                    key={d}
                    style={getSegmentStyle(difficulty === d)}
                    onClick={() => setDifficulty(d)}
                  >
                    {d === 'easy' ? 'Fàcil' : d === 'normal' ? 'Normal' : 'Difícil'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            <div style={{ marginBottom: 16, fontSize: 13, textAlign: 'center', opacity: 0.6 }}>
              Mida: {size}x{size} · Memorització: {memorizeTime}s
            </div>
            <button style={styles.button} onClick={handleCreate} disabled={busy}>
              Crear partida
            </button>
          </div>
        </section>

        {/* JOIN CARD */}
        <section style={styles.card}>
          <h2 style={styles.cardHeader}>Unir-se</h2>

          {error && <div style={styles.error}>{error}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <input
              style={styles.input}
              placeholder="Codi de partida (ex: AB12)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button style={{ ...styles.button, width: 'auto' }} onClick={handleJoinByCode} disabled={busy}>
              →
            </button>
          </div>

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={styles.label}>Partides obertes</div>

            <div style={styles.list}>
              {openMatches.length === 0 && (
                <div style={{
                  flex: 1, display: 'grid', placeItems: 'center',
                  opacity: 0.5, fontStyle: 'italic', border: '2px dashed rgba(255,255,255,0.1)',
                  borderRadius: 16, margin: '8px 0'
                }}>
                  No hi ha partides obertes ara mateix.
                </div>
              )}

              {openMatches.map((m) => (
                <div key={m.id} style={styles.matchRow}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{m.display_name ?? 'Anònim'}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      Codi: <strong>{m.code}</strong> · {m.rounds_count} Rondes · {m.config?.difficulty}
                    </div>
                  </div>
                  <button
                    style={{ ...styles.ghost, padding: '8px 16px', fontSize: 13 }}
                    onClick={async () => {
                      try {
                        setBusy(true);
                        if (!user) {
                          setError('Cal iniciar sessió per unir-se.');
                          return;
                        }
                        const players = await getPlayers(m.id);
                        if (players.find((p) => p.user_id === user.id)) {
                          onOpenMatch(m.id);
                          return;
                        }
                        if (players.length >= 2) {
                          setError('La partida ja està plena.');
                          return;
                        }
                        await joinMatch(m.id, user.id, user.email?.split('@')[0] ?? null);
                        onOpenMatch(m.id);
                      } catch (e) {
                        setError("No s'ha pogut unir a la partida.");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Unir-me
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
