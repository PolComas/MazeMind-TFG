import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { generateLevel, type Level } from '../maze/maze_generator';
import LevelScreen from './LevelScreen';
import LobbyScreen from '../components/multiplayer/LobbyScreen';
import RoundResultOverlay from '../components/multiplayer/RoundResultOverlay';
import GameResultScreen from '../components/multiplayer/GameResultScreen';
import {
  advanceRoundIfCurrent,
  deleteMatch,
  getAllRoundResults,
  getMatch,
  getPlayers,
  getRoundResults,
  recordRoundResult,
  setPlayerStatus,
  setMatchStatus,
} from '../lib/multiplayer';
import type { MultiplayerMatch, MultiplayerPlayer, RoundResult } from '../lib/multiplayer';

type RoundOutcome = {
  winnerId: string | null;
  reason: string;
};

type ScoreRow = {
  user_id: string;
  display_name: string | null;
  rounds_won: number;
  total_time: number;
  total_points: number;
};

const ROUND_TIMEOUT_MS = 90_000;
const ROUND_ADVANCE_DELAY_MS = 3500;

const computeWinner = (
  results: Array<{ user_id: string; completed: boolean; time_seconds: number; finished_at: string; points: number }>,
  options?: { allowSingle?: boolean }
): RoundOutcome => {
  if (results.length === 0) return { winnerId: null, reason: 'pending' };
  if (results.length === 1) {
    if (!options?.allowSingle) return { winnerId: null, reason: 'pending' };
    const only = results[0];
    if (!only.completed) return { winnerId: null, reason: 'timeout' };
    return { winnerId: only.user_id, reason: 'timeout' };
  }

  const [a, b] = results;

  if (a.completed && !b.completed) return { winnerId: a.user_id, reason: 'completed' };
  if (!a.completed && b.completed) return { winnerId: b.user_id, reason: 'completed' };
  // If neither completed, logic might vary, but let's say tie or no winner yet
  if (!a.completed && !b.completed) return { winnerId: null, reason: 'no-completions' };

  if (a.points > b.points) return { winnerId: a.user_id, reason: 'points' };
  if (b.points > a.points) return { winnerId: b.user_id, reason: 'points' };
  return { winnerId: null, reason: 'tie' };
};

export default function MultiplayerMatchScreen({ matchId, onBack }: { matchId: string; onBack: () => void }) {
  const { user } = useUser();
  const { getVisualSettings } = useSettings();
  const screenSettings = getVisualSettings('levelScreen');
  const { t } = useLanguage();

  const [match, setMatch] = useState<MultiplayerMatch | null>(null);
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [roundResultsRound, setRoundResultsRound] = useState<number>(0);
  const [allResults, setAllResults] = useState<RoundResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedRounds, setResolvedRounds] = useState<Record<number, boolean>>({});
  const [cleanupQueued, setCleanupQueued] = useState(false);
  const [forcedOutcome, setForcedOutcome] = useState<(RoundOutcome & { round: number }) | null>(null);
  const [forfeitWinnerId, setForfeitWinnerId] = useState<string | null>(null);

  const lastRoundRef = useRef<number>(0);
  const roundTimeoutRef = useRef<number | null>(null);

  // Poll logic
  useEffect(() => {
    setResolvedRounds({});
    setCleanupQueued(false);
    setForcedOutcome(null);
    setForfeitWinnerId(null);
    lastRoundRef.current = 0;
  }, [matchId]);

  const pollMatch = useCallback(async () => {
    const m = await getMatch(matchId);
    if (!m) {
      setError(t('multiplayer.notFoundMatch'));
      return;
    }
    setMatch(m);
    const p = await getPlayers(matchId);
    setPlayers(p);

    if (lastRoundRef.current !== m.current_round) {
      setRoundResults([]);
      setRoundResultsRound(0);
      setForcedOutcome(null);
      lastRoundRef.current = m.current_round;
    }

    // Auto-start if waiting and 2 players (host only)
    const activePlayers = p.filter((player) => player.status === 'joined');
    if (m.status === 'waiting' && activePlayers.length >= 2 && user?.id === m.host_id) {
      await setMatchStatus(matchId, 'active', 1);
    }

    if (m.status === 'active' && m.current_round > 0) {
      const res = await getRoundResults(matchId, m.current_round);
      setRoundResults(res);
      setRoundResultsRound(m.current_round);
    }

    if (m.status !== 'waiting') {
      const resAll = await getAllRoundResults(matchId);
      setAllResults(resAll);
    } else {
      setAllResults([]);
    }
  }, [matchId, t, user?.id]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        await pollMatch();
        if (mounted) setLoading(false);
      } catch (e) {
        if (mounted) setError(t('multiplayer.notFoundMatch'));
      }
    };

    load();
    const id = window.setInterval(load, 2000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [pollMatch]);

  const currentRound = match?.current_round ?? 0;
  const seeds = match?.seeds ?? [];

  const level: Level | null = useMemo(() => {
    if (!match || currentRound <= 0) return null;
    const seed = seeds[currentRound - 1];
    if (!seed) return null;
    return generateLevel({
      levelNumber: currentRound,
      difficulty: match.config?.difficulty ?? 'normal',
      width: match.config?.width ?? 7,
      height: match.config?.height ?? 7,
      memorizeTime: match.config?.memorizeTime ?? 12,
      stars: [60, 45, 30],
      seed,
    });
  }, [match, currentRound, seeds]);

  const activePlayers = useMemo(() => players.filter((p) => p.status === 'joined'), [players]);
  const other = user?.id ? activePlayers.find((p) => p.user_id !== user.id) : null;
  const isHost = !!(user?.id && match?.host_id && user.id === match.host_id);

  const completedRounds = useMemo(() => {
    if (!match) return 0;
    if (match.status === 'finished') return Math.max(0, match.current_round ?? 0);
    return Math.max(0, (match.current_round ?? 0) - 1);
  }, [match]);

  const scoreRows = useMemo<ScoreRow[]>(() => {
    const rows = new Map<string, ScoreRow>();
    players.forEach((p) => {
      rows.set(p.user_id, {
        user_id: p.user_id,
        display_name: p.display_name,
        rounds_won: 0,
        total_time: 0,
        total_points: 0,
      });
    });

    if (!match || completedRounds <= 0) {
      return Array.from(rows.values());
    }

    const resultsByRound = new Map<number, RoundResult[]>();
    for (const r of allResults) {
      if (r.round_index > completedRounds) continue;
      const list = resultsByRound.get(r.round_index) ?? [];
      list.push(r);
      resultsByRound.set(r.round_index, list);

      const row = rows.get(r.user_id);
      if (row) {
        row.total_time += r.time_seconds;
        row.total_points += r.points;
      }
    }

    for (const list of resultsByRound.values()) {
      const outcome = computeWinner(list, { allowSingle: true });
      if (outcome.winnerId) {
        const row = rows.get(outcome.winnerId);
        if (row) row.rounds_won += 1;
      }
    }

    return Array.from(rows.values());
  }, [players, allResults, match, completedRounds]);

  const handleLeave = useCallback(async () => {
    if (!match || !user) {
      onBack();
      return;
    }

    if (match.status === 'waiting' && user.id === match.host_id) {
      try {
        await deleteMatch(match.id);
      } catch (err) {
        console.warn('No s\'ha pogut cancel·lar la partida:', err);
      }
      onBack();
      return;
    }

    try {
      await setPlayerStatus(match.id, user.id, 'left');
    } catch (err) {
      console.warn('No s\'ha pogut marcar la sortida del jugador:', err);
    }
    onBack();
  }, [match, user, onBack]);

  const handleGameEnd = useCallback(async (result: { completed: boolean; timeSeconds: number; points: number }, roundIndex: number) => {
    if (!user) return;
    if (roundIndex <= 0) return;

    try {
      await recordRoundResult({
        match_id: matchId,
        round_index: roundIndex,
        user_id: user.id,
        completed: result.completed,
        time_seconds: result.timeSeconds,
        points: result.points,
        finished_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error guardant resultats del round', e);
    }
  }, [user, matchId]);

  const handleRoundTimeout = useCallback(async () => {
    if (!isHost) return;
    if (currentRound <= 0) return;
    try {
      const latest = await getMatch(matchId);
      if (!latest || latest.status !== 'active' || latest.current_round !== currentRound) return;

      const results = await getRoundResults(matchId, currentRound);
      if (results.length >= 2) return;

      const outcome = computeWinner(results, { allowSingle: true });
      setForcedOutcome({ ...outcome, round: currentRound });
      setResolvedRounds((prev) => ({ ...prev, [currentRound]: true }));

      const isLast = currentRound >= (latest.rounds_count ?? 3);
      if (isLast) {
        await advanceRoundIfCurrent(matchId, currentRound, currentRound, 'finished');
      } else {
        await advanceRoundIfCurrent(matchId, currentRound, currentRound + 1);
      }
    } catch (err) {
      console.warn('No s\'ha pogut resoldre el round per timeout:', err);
    }
  }, [isHost, matchId, currentRound]);

  // Handle round completion logic
  useEffect(() => {
    if (!isHost) return;
    if (!match || currentRound <= 0) return;
    if (roundResultsRound !== currentRound) return;
    if (roundResults.length < 2) return;
    if (resolvedRounds[currentRound]) return;

    const isLast = currentRound >= (match.rounds_count ?? 3);

    setTimeout(() => {
      if (isLast) {
        advanceRoundIfCurrent(match.id, currentRound, currentRound, 'finished').catch(() => { });
      } else {
        advanceRoundIfCurrent(match.id, currentRound, currentRound + 1).catch(() => { });
      }
    }, ROUND_ADVANCE_DELAY_MS);

    setResolvedRounds((prev) => ({ ...prev, [currentRound]: true }));
  }, [isHost, roundResults, roundResultsRound, match?.id, match?.rounds_count, currentRound, resolvedRounds]);

  useEffect(() => {
    if (!isHost) return;
    if (!match || match.status !== 'active' || currentRound <= 0) return;
    if (roundTimeoutRef.current) window.clearTimeout(roundTimeoutRef.current);
    roundTimeoutRef.current = window.setTimeout(() => {
      handleRoundTimeout();
    }, ROUND_TIMEOUT_MS);
    return () => {
      if (roundTimeoutRef.current) window.clearTimeout(roundTimeoutRef.current);
    };
  }, [isHost, match?.id, match?.status, currentRound, handleRoundTimeout]);

  useEffect(() => {
    if (!match || match.status !== 'active' || !user) return;
    const opponentLeft = players.find((p) => p.user_id !== user.id && p.status === 'left');
    if (!opponentLeft) return;
    if (forfeitWinnerId) return;

    setForfeitWinnerId(user.id);
    setMatchStatus(match.id, 'finished', match.current_round).catch((err) => {
      console.warn('No s\'ha pogut finalitzar la partida per abandonament:', err);
    });
  }, [match, players, user, forfeitWinnerId]);

  // Clean up finished match
  useEffect(() => {
    if (!match || match.status !== 'finished') return;
    if (cleanupQueued) return;
    if (user?.id !== match.host_id) return;

    setCleanupQueued(true);
    const id = window.setTimeout(() => {
      deleteMatch(match.id).catch((err) => {
        console.warn("No s'ha pogut eliminar la partida:", err);
      });
    }, 10000); // Give plenty of time to see results
    return () => window.clearTimeout(id);
  }, [match, cleanupQueued, user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh', gap: 12 }}>
        <div className="spinner" style={{ width: 32, height: 32, border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div>{t('multiplayer.loadingMatch')}</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user || !match) {
    return (
      <div style={{ padding: 20 }}>
        <div>{error ?? t('multiplayer.notFoundMatch')}</div>
        <button onClick={handleLeave}>{t('common.exit')}</button>
      </div>
    );
  }

  // 1. Lobby
  if (match.status === 'waiting') {
    return (
      <LobbyScreen
        match={match}
        players={activePlayers}
        currentUserId={user.id}
        onLeave={handleLeave}
      />
    );
  }

  // 2. Game Result
  if (match.status === 'finished') {
    return (
      <GameResultScreen
        scoreRows={scoreRows}
        forfeitWinnerId={forfeitWinnerId}
        currentUserId={user.id}
        onExit={handleLeave}
      />
    );
  }

  // 3. Active Gameplay
  // Calculate round outcome if available
  const baseOutcome = roundResults.length >= 2 ? computeWinner(roundResults) : null;
  const outcome = forcedOutcome && forcedOutcome.round === currentRound ? forcedOutcome : baseOutcome;
  const myResult = roundResults.find(r => r.user_id === user.id);
  const oppResult = roundResults.find(r => r.user_id !== user.id);
  const myScore = scoreRows.find((row) => row.user_id === user.id);

  const roundIndex = currentRound;

  return (
    <div style={{ position: 'relative', height: '100svh', background: screenSettings.backgroundColor, overflow: 'hidden' }}>
      {/* Custom HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: 16, zIndex: 50, pointerEvents: 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: 20, color: 'white', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
          {t('multiplayer.roundLabel')} {match.current_round} / {match.rounds_count}
        </div>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: 20, color: 'white', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
          {t('multiplayer.pointsLabel')}: {myScore?.total_points ?? 0}
        </div>
      </div>

      {level ? (
        <LevelScreen
          key={`${match.id}-${currentRound}`}
          level={level}
          onBack={handleLeave}
          onRetry={() => { }} // No retry in MP
          isTutorialMode={false}
          onCompleteTutorial={() => { }}
          onLevelComplete={() => { }}
          isPracticeMode={true} // Reusing this for MP rendering
          progress={{ levels: {}, highestUnlocked: { easy: 1, normal: 1, hard: 1 } }}
          telemetryMode="other"
          suppressModals={true}
          onGameEnd={(result) => handleGameEnd(result, roundIndex)}
        />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          {t('common.loading')}
        </div>
      )}

      {/* Overlay for Round Result */}
      {outcome && outcome.reason !== 'pending' && (
        <RoundResultOverlay
          winnerId={outcome.winnerId}
          myId={user.id}
          opponentName={other?.display_name ?? t('multiplayer.opponent')}
          myStats={myResult ? { time: myResult.time_seconds, points: myResult.points } : undefined}
          opponentStats={oppResult ? { time: oppResult.time_seconds, points: oppResult.points } : undefined}
          reason={outcome.reason}
        />
      )}

      {/* Waiting modal when I finished but opponent hasn't */}
      {myResult && (!outcome || outcome.reason === 'pending') && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 80,
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20,
            padding: '24px 32px',
            minWidth: 280,
            maxWidth: '90%',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {t('multiplayer.waitOpponentTitle')}
            </div>
            <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 16 }}>
              {t('multiplayer.waitOpponentSubtitle')}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div className="spinner" style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <span style={{ fontSize: 14 }}>{t('multiplayer.waitOpponent')}</span>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
