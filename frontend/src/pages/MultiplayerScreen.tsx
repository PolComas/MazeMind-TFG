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
      minHeight: '100svh',
      padding: 24,
      background: screenSettings.backgroundColor,
      color: screenSettings.textColor,
      fontFamily: '"Space Grotesk", "Sora", "Segoe UI", sans-serif',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    title: { fontSize: 32, fontWeight: 800, margin: 0 },
    subtitle: { opacity: 0.8, maxWidth: 520, margin: 0 },
    hero: {
      padding: 16,
      borderRadius: 18,
      background: `linear-gradient(135deg, ${screenSettings.accentColor1}22, ${screenSettings.accentColor2}22)`,
      border: `1px solid ${screenSettings.borderColor}`,
      marginBottom: 20,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 16,
    },
    card: {
      background: screenSettings.surfaceColor,
      border: `1px solid ${screenSettings.borderColor}`,
      borderRadius: 16,
      padding: 18,
      boxShadow: '0 16px 28px rgba(0,0,0,0.16)',
    },
    row: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
    label: { fontWeight: 700 },
    input: {
      padding: 10,
      borderRadius: 10,
      border: `1px solid ${screenSettings.borderColor}`,
      background: 'rgba(255,255,255,0.04)',
      color: screenSettings.textColor,
    },
    chip: {
      padding: '6px 10px',
      borderRadius: 999,
      background: 'rgba(255,255,255,0.06)',
      border: `1px solid ${screenSettings.borderColor}`,
      fontSize: 12,
      fontWeight: 700,
    },
    button: {
      padding: '12px 16px',
      borderRadius: 12,
      border: `2px solid ${screenSettings.borderColor}`,
      background: `linear-gradient(90deg, ${screenSettings.accentColor1}, ${screenSettings.accentColor2})`,
      color: screenSettings.textColor,
      fontWeight: 800,
      cursor: 'pointer',
    },
    ghost: {
      padding: '10px 14px',
      borderRadius: 10,
      border: `1px solid ${screenSettings.borderColor}`,
      background: 'transparent',
      color: screenSettings.textColor,
      cursor: 'pointer',
    },
    list: {
      display: 'grid',
      gap: 12,
      marginTop: 12,
    },
    matchRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 12,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${screenSettings.borderColor}`,
    },
    hint: { opacity: 0.75, fontSize: 14 },
    error: { color: '#fca5a5', fontWeight: 700, marginBottom: 12 },
  }), [screenSettings]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Multijugador</h1>
          <p style={styles.subtitle}>Crea una partida privada amb codi o obre una sala pública per jugar amb altres persones.</p>
        </div>
        <button style={styles.ghost} onClick={onBack} onMouseEnter={() => audio.playHover()}>Tornar</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={{ marginTop: 0 }}>Crear partida</h2>
          <div style={styles.row}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              &nbsp; Partida oberta
            </label>
          </div>
          <div style={{ ...styles.row, marginTop: 12 }}>
            <label style={styles.label}>Rondes</label>
            <select style={styles.input} value={roundsCount} onChange={(e) => setRoundsCount(Number(e.target.value))}>
              <option value={3}>3</option>
              <option value={5}>5</option>
            </select>
            <label style={styles.label}>Dificultat</label>
            <select style={styles.input} value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
              <option value="easy">Fàcil</option>
              <option value="normal">Normal</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
          <div style={{ marginTop: 8, ...styles.hint }}>Mida: {size}x{size} · Memorització: {memorizeTime}s</div>
          <div style={{ marginTop: 16 }}>
            <button style={styles.button} onClick={handleCreate} disabled={busy}>
              Crear partida
            </button>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={{ marginTop: 0 }}>Unir-se</h2>
          <div style={styles.row}>
            <input
              style={styles.input}
              placeholder="Codi de partida"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button style={styles.button} onClick={handleJoinByCode} disabled={busy}>
              Unir-me amb codi
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={styles.label}>Partides obertes</div>
            <div style={styles.list}>
              {openMatches.length === 0 && <div style={styles.hint}>No hi ha partides obertes ara mateix.</div>}
              {openMatches.map((m) => (
                <div key={m.id} style={styles.matchRow}>
                  <div>
                    <div><strong>Codi:</strong> {m.code}</div>
                    <div style={styles.hint}>Rondes: {m.rounds_count} · Dificultat: {m.config?.difficulty ?? 'normal'}</div>
                  </div>
                  <button
                    style={styles.ghost}
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
