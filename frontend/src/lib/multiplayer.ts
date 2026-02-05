import { supabase } from './supabase';

export type MatchStatus = 'waiting' | 'active' | 'finished' | 'cancelled';
export type MatchConfig = {
  difficulty: 'easy' | 'normal' | 'hard';
  width: number;
  height: number;
  memorizeTime: number;
};

export type MultiplayerMatch = {
  id: string;
  host_id: string;
  code: string;
  is_public: boolean;
  status: MatchStatus;
  rounds_count: number;
  current_round: number;
  seeds: string[];
  config: MatchConfig;
  created_at?: string;
  updated_at?: string;
};

export type MultiplayerPlayer = {
  match_id: string;
  user_id: string;
  display_name: string | null;
  joined_at?: string;
  ready: boolean;
  total_points: number;
  total_time: number;
  rounds_won: number;
  status: 'joined' | 'left' | 'finished';
};

export type RoundResult = {
  match_id: string;
  round_index: number;
  user_id: string;
  completed: boolean;
  time_seconds: number;
  points: number;
  finished_at: string;
};

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateJoinCode = (len = 6) => {
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
};

export const createSeeds = (count: number) =>
  Array.from({ length: count }, () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);

export async function createMatch(args: {
  hostId: string;
  isPublic: boolean;
  roundsCount: number;
  config: MatchConfig;
  displayName?: string | null;
}): Promise<MultiplayerMatch> {
  const code = generateJoinCode();
  const seeds = createSeeds(args.roundsCount);

  const { data: matchRow, error: matchErr } = await supabase
    .from('multiplayer_matches')
    .insert({
      host_id: args.hostId,
      code,
      is_public: args.isPublic,
      rounds_count: args.roundsCount,
      current_round: 0,
      status: 'waiting',
      seeds,
      config: args.config,
    })
    .select('*')
    .single();

  if (matchErr) throw matchErr;

  const { error: playerErr } = await supabase
    .from('multiplayer_players')
    .insert({
      match_id: matchRow.id,
      user_id: args.hostId,
      display_name: args.displayName ?? null,
      ready: false,
      total_points: 0,
      total_time: 0,
      rounds_won: 0,
      status: 'joined',
    });

  if (playerErr) throw playerErr;

  return matchRow as MultiplayerMatch;
}

export async function listOpenMatches(): Promise<MultiplayerMatch[]> {
  const { data, error } = await supabase
    .from('multiplayer_matches')
    .select('*')
    .eq('is_public', true)
    .eq('status', 'waiting')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as MultiplayerMatch[];
}

export async function getMatch(matchId: string): Promise<MultiplayerMatch | null> {
  const { data, error } = await supabase
    .from('multiplayer_matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle();

  if (error) throw error;
  return data as MultiplayerMatch | null;
}

export async function getMatchByCode(code: string): Promise<MultiplayerMatch | null> {
  const { data, error } = await supabase
    .from('multiplayer_matches')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data as MultiplayerMatch | null;
}

export async function getPlayers(matchId: string): Promise<MultiplayerPlayer[]> {
  const { data, error } = await supabase
    .from('multiplayer_players')
    .select('*')
    .eq('match_id', matchId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as MultiplayerPlayer[];
}

export async function joinMatch(matchId: string, userId: string, displayName?: string | null): Promise<void> {
  const { error } = await supabase
    .from('multiplayer_players')
    .insert({
      match_id: matchId,
      user_id: userId,
      display_name: displayName ?? null,
      ready: false,
      total_points: 0,
      total_time: 0,
      rounds_won: 0,
      status: 'joined',
    });

  if (error) throw error;
}

export async function setMatchStatus(matchId: string, status: MatchStatus, currentRound?: number): Promise<void> {
  const payload: Record<string, any> = { status };
  if (typeof currentRound === 'number') payload.current_round = currentRound;

  const { error } = await supabase
    .from('multiplayer_matches')
    .update(payload)
    .eq('id', matchId);

  if (error) throw error;
}

export async function advanceRoundIfCurrent(matchId: string, currentRound: number, nextRound: number, status?: MatchStatus): Promise<boolean> {
  const payload: Record<string, any> = { current_round: nextRound };
  if (status) payload.status = status;

  const { data, error } = await supabase
    .from('multiplayer_matches')
    .update(payload)
    .eq('id', matchId)
    .eq('current_round', currentRound)
    .select('id');

  if (error) throw error;
  return (data ?? []).length > 0;
}

export async function recordRoundResult(input: RoundResult): Promise<void> {
  const { error } = await supabase
    .from('multiplayer_round_results')
    .upsert(input, { onConflict: 'match_id,round_index,user_id' });
  if (error) throw error;
}

export async function getRoundResults(matchId: string, roundIndex: number): Promise<RoundResult[]> {
  const { data, error } = await supabase
    .from('multiplayer_round_results')
    .select('*')
    .eq('match_id', matchId)
    .eq('round_index', roundIndex);

  if (error) throw error;
  return (data ?? []) as RoundResult[];
}

export async function updatePlayerTotals(matchId: string, userId: string, totals: { points: number; time: number; roundsWon: number }) {
  const { error } = await supabase
    .from('multiplayer_players')
    .update({
      total_points: totals.points,
      total_time: totals.time,
      rounds_won: totals.roundsWon,
    })
    .eq('match_id', matchId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteMatch(matchId: string): Promise<void> {
  const { error } = await supabase
    .from('multiplayer_matches')
    .delete()
    .eq('id', matchId);
  if (error) throw error;
}
