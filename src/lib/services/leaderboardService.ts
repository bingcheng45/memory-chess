import type { PostgrestError } from '@supabase/supabase-js';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { LEADERBOARD_ROW_LIMIT } from '@/lib/reference/facts';
import { LeaderboardEntry, LeaderboardSubmission } from '@/types/leaderboard';

/**
 * What became of a submission, in terms the route can map to a status code.
 * `cause` is for the operator reading logs, never for the player.
 */
export type LeaderboardSubmitResult =
  | { status: 'stored'; entry: LeaderboardEntry }
  | { status: 'invalid'; message: string }
  | { status: 'unavailable'; cause: unknown }
  | { status: 'failed'; cause: unknown };

export async function getLeaderboard(difficulty: string = 'medium'): Promise<{data: LeaderboardEntry[], error?: string}> {
  try {
    // First check the Supabase connection
    const connectionStatus = await checkSupabaseConnection();
    if (!connectionStatus.connected) {
      console.error('Supabase connection failed:', connectionStatus.error);
      return { 
        data: [], 
        error: `Database connection issue: ${connectionStatus.error || 'Unable to connect to the database'}` 
      };
    }
    if (!supabase) {
      return {
        data: [],
        error: 'Database connection issue: Supabase is not configured'
      };
    }
    
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('difficulty', difficulty)
      .gt('correct_pieces', 0)
      .order('correct_pieces', { ascending: false })
      .order('total_wrong_pieces', { ascending: true, nullsFirst: false })
      .order('memorize_time', { ascending: true })
      .order('solution_time', { ascending: true })
      .limit(LEADERBOARD_ROW_LIMIT);
      
    if (error) {
      console.error('Supabase query error:', error);
      return { 
        data: [], 
        error: `Database query failed: ${error.message}` 
      };
    }
    
    return { data: data || [] };
  } catch (err) {
    console.error('Unexpected error in getLeaderboard:', err);
    return { 
      data: [], 
      error: err instanceof Error ? err.message : 'An unexpected error occurred while retrieving leaderboard data' 
    };
  }
}

/**
 * PostgREST reports a column its schema cache does not know as PGRST204, and
 * Postgres itself raises 42703 (undefined_column) when the request reaches the
 * database without that cache in front. Both codes are stable; the message
 * text is not, so it is never matched.
 */
const MISSING_COLUMN_CODES = ['PGRST204', '42703'];

function isMissingColumn(error: PostgrestError): boolean {
  return MISSING_COLUMN_CODES.includes(error.code);
}

type SubmissionRow = LeaderboardSubmission | Omit<LeaderboardSubmission, 'country_code'>;

export async function submitLeaderboardEntry(
  entry: LeaderboardSubmission,
): Promise<LeaderboardSubmitResult> {
  if (entry.player_name.length < 4 || entry.player_name.length > 16) {
    return { status: 'invalid', message: 'Player name must be between 4 and 16 characters' };
  }
  if (!supabase) {
    return { status: 'unavailable', cause: 'Supabase is not configured' };
  }

  const client = supabase;
  const insertRow = (row: SubmissionRow) =>
    client.from('leaderboard_entries').insert(row).select().single();

  const first = await insertRow(entry);
  if (!first.error) {
    return { status: 'stored', entry: first.data };
  }
  if (!isMissingColumn(first.error)) {
    return { status: 'failed', cause: first.error };
  }

  // Transition shim. Delete it, and this whole retry branch, once the
  // country_code migration is applied in every environment. A player's score
  // outlives their flag, so the score is kept and the country dropped.
  const { country_code: dropped, ...withoutCountry } = entry;
  console.warn(
    `Leaderboard insert rejected country_code ${dropped} (${first.error.code}); the country migration is outstanding. Retrying without it.`,
  );
  const retry = await insertRow(withoutCountry);
  if (retry.error) {
    return { status: 'unavailable', cause: retry.error };
  }
  return { status: 'stored', entry: retry.data };
}
