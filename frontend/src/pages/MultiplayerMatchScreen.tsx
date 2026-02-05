import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { generateLevel, type Level } from '../maze/maze_generator';
import LevelScreen from './LevelScreen';
import LobbyScreen from '../components/multiplayer/LobbyScreen';
import RoundResultOverlay from '../components/multiplayer/RoundResultOverlay';
import GameResultScreen from '../components/multiplayer/GameResultScreen';
import {
  advanceRoundIfCurrent,
  deleteMatch,
  getMatch,
  getPlayers,
  getRoundResults,
  recordRoundResult,
  setMatchStatus,
  updatePlayerTotals,
} from '../lib/multiplayer';
import type { MultiplayerMatch, MultiplayerPlayer } from '../lib/multiplayer';

type RoundOutcome = {
  winnerId: string | null;
  reason: string;
};

const computeWinner = (results: Array<{ user_id: string; completed: boolean; time_seconds: number; finished_at: string }>): RoundOutcome => {
  if (results.length < 2) return { winnerId: null, reason: 'pending' };
  const [a, b] = results;

  if (a.completed && !b.completed) return { winnerId: a.user_id, reason: 'completed' };
  if (!a.completed && b.completed) return { winnerId: b.user_id, reason: 'completed' };
  // If neither completed, logic might vary, but let's say tie or no winner yet
  if (!a.completed && !b.completed) return { winnerId: null, reason: 'no-completions' };

  if (a.time_seconds < b.time_seconds) return { winnerId: a.user_id, reason: 'time' };
  if (b.time_seconds < a.time_seconds) return { winnerId: b.user_id, reason: 'time' };

  const aTime = new Date(a.finished_at).getTime();
  const bTime = new Date(b.finished_at).getTime();
  if (aTime < bTime) return { winnerId: a.user_id, reason: 'finish' };
  if (bTime < aTime) return { winnerId: b.user_id, reason: 'finish' };

  return { winnerId: null, reason: 'tie' };
};

export default function MultiplayerMatchScreen({ matchId, onBack }: { matchId: string; onBack: () => void }) {
  const { user } = useUser();
  const { getVisualSettings } = useSettings();
  const screenSettings = getVisualSettings('levelScreen');

  const [match, setMatch] = useState<MultiplayerMatch | null>(null);
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([]);
  const [roundResults, setRoundResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedRounds, setResolvedRounds] = useState<Record<number, boolean>>({});
  const [cleanupQueued, setCleanupQueued] = useState(false);

  // Poll logic
  useEffect(() => {
    setResolvedRounds({});
    setCleanupQueued(false);
  }, [matchId]);

  const pollMatch = useCallback(async () => {
    const m = await getMatch(matchId);
    if (!m) {
      setError('No s\'ha trobat la partida.');
      return;
    }
    setMatch(m);
    const p = await getPlayers(matchId);
    setPlayers(p);

    // Auto-start if waiting and 2 players
    if (m.status === 'waiting' && p.length >= 2) {
      await setMatchStatus(matchId, 'active', 1);
    }

    if (m.status === 'active' && m.current_round > 0) {
      const res = await getRoundResults(matchId, m.current_round);
      setRoundResults(res);
    }
  }, [matchId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        await pollMatch();
        if (mounted) setLoading(false);
      } catch (e) {
        if (mounted) setError('No s\'ha pogut carregar la partida.');
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

  const me = user?.id ? players.find((p) => p.user_id === user.id) : null;
  const other = user?.id ? players.find((p) => p.user_id !== user.id) : null;

  const handleLeave = useCallback(async () => {
    if (match && user?.id === match.host_id && match.status === 'waiting') {
      try {
        await deleteMatch(match.id);
      } catch (err) {
        console.warn('No s\'ha pogut cancel·lar la partida:', err);
      }
    }
    onBack();
  }, [match, user, onBack]);

  const handleGameEnd = useCallback(async (result: { completed: boolean; timeSeconds: number; points: number }) => {
    if (!user || !match) return;
    if (currentRound <= 0) return;

    try {
      await recordRoundResult({
        match_id: match.id,
        round_index: currentRound,
        user_id: user.id,
        completed: result.completed,
        time_seconds: result.timeSeconds,
        points: result.points,
        finished_at: new Date().toISOString(),
      });

      const meRow = players.find((p) => p.user_id === user.id);
      if (meRow) {
        await updatePlayerTotals(match.id, user.id, {
          points: (meRow.total_points ?? 0) + result.points,
          time: (meRow.total_time ?? 0) + result.timeSeconds,
          roundsWon: meRow.rounds_won ?? 0,
        });
      }
    } catch (e) {
      console.error('Error guardant resultats del round', e);
    }
  }, [user, match, currentRound, players]);

  // Handle round completion logic
  useEffect(() => {
    if (!match || currentRound <= 0) return;
    if (roundResults.length < 2) return;
    if (resolvedRounds[currentRound]) return;

    const outcome = computeWinner(roundResults);
    if (outcome.winnerId) {
      const winner = players.find((p) => p.user_id === outcome.winnerId);
      if (winner) {
        updatePlayerTotals(match.id, winner.user_id, {
          points: winner.total_points ?? 0,
          time: winner.total_time ?? 0,
          roundsWon: (winner.rounds_won ?? 0) + 1,
        }).catch(() => { });
      }
    }

    const isLast = currentRound >= (match.rounds_count ?? 3);
    // Delay slightly to let UI show
    const NEXT_DELAY = 4000;

    setTimeout(() => {
      if (isLast) {
        advanceRoundIfCurrent(match.id, currentRound, currentRound, 'finished').catch(() => { });
      } else {
        advanceRoundIfCurrent(match.id, currentRound, currentRound + 1).catch(() => { });
      }
    }, NEXT_DELAY);

    setResolvedRounds((prev) => ({ ...prev, [currentRound]: true }));
  }, [roundResults, match, currentRound, players, resolvedRounds]);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh' }}>
        <div className="spinner" style={{ width: 32, height: 32, border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user || !match) {
    return (
      <div style={{ padding: 20 }}>
        <div>{error ?? 'Error desconegut'}</div>
        <button onClick={handleLeave}>Sortir</button>
      </div>
    );
  }

  // 1. Lobby
  if (match.status === 'waiting') {
    return (
      <LobbyScreen
        match={match}
        players={players}
        currentUserId={user.id}
        onLeave={handleLeave}
      />
    );
  }

  // 2. Game Result
  if (match.status === 'finished') {
    return (
      <GameResultScreen
        players={players}
        currentUserId={user.id}
        onExit={handleLeave}
      />
    );
  }

  // 3. Active Gameplay
  // Calculate round outcome if available
  const outcome = roundResults.length >= 2 ? computeWinner(roundResults) : null;
  const myResult = roundResults.find(r => r.user_id === user.id);
  const oppResult = roundResults.find(r => r.user_id !== user.id);

  return (
    <div style={{ position: 'relative', height: '100svh', background: screenSettings.backgroundColor, overflow: 'hidden' }}>
      {/* Custom HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: 16, zIndex: 50, pointerEvents: 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: 20, color: 'white', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
          Ronda {match.current_round} / {match.rounds_count}
        </div>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: 20, color: 'white', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
          {me?.total_points ?? 0} pts
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
          onGameEnd={handleGameEnd}
        />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          Carregant nivell...
        </div>
      )}

      {/* Overlay for Round Result */}
      {outcome && outcome.winnerId !== null && (
        <RoundResultOverlay
          winnerId={outcome.winnerId}
          myId={user.id}
          opponentName={other?.display_name ?? 'Rival'}
          myStats={myResult ? { time: myResult.time_seconds, points: myResult.points } : undefined}
          opponentStats={oppResult ? { time: oppResult.time_seconds, points: oppResult.points } : undefined}
          reason={outcome.reason}
        />
      )}

      {/* Simple "Waiting for opponent" toast if I finished but they haven't */}
      {myResult && !outcome && (
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          padding: '12px 24px',
          borderRadius: 30,
          color: 'white',
          fontWeight: 600,
          zIndex: 40,
          animation: 'fadeIn 0.3s'
        }}>
          ⏳ Esperant al rival...
        </div>
      )}
    </div>
  );
}
