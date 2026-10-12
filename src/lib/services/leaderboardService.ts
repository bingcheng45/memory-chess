import type { PostgrestError } from '@supabase/supabase-js';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { LEADERBOARD_ROW_LIMIT } from '@/lib/reference/facts';
import { RANKING_ORDER, type BoardCutoff, type LeaderboardCutoffs } from '@/lib/leaderboard/ranking';
import { parseBoard } from '@/lib/leaderboard/board';
import { rankedAboveFilter, type Standing, type StandingScope } from '@/lib/leaderboard/standing';
import { WORLD_CODE } from '@/lib/leaderboard/countries';
import {
  DAILY_BOARD,
  LEADERBOARD_DIFFICULTIES,
  type LeaderboardBoard,
  type LeaderboardDifficulty,
  type LeaderboardEntry,
  type LeaderboardSubmission,
} from '@/types/leaderboard';

type SupabaseClient = NonNullable<typeof supabase>;

/**
 * Structural, rather than typed against PostgrestFilterBuilder, so this does
 * not have to name the five generic parameters that builder carries. `.order()`
 * returns `this`, so the chain keeps whatever builder type it started with.
 */
type OrderableQuery<T> = {
  order(column: string, options: { ascending: boolean; nullsFirst?: false }): T;
};

/**
 * `nullsFirst` is forwarded only for the keys that carry it. postgrest-js writes
 * `.nullslast` onto the column when the option is present and nothing when it is
 * absent, so handing it over unconditionally would rewrite the live request for
 * three columns that have never sent it.
 */
function orderByRanking<T extends OrderableQuery<T>>(query: T): T {
  return RANKING_ORDER.reduce<T>(
    (ordered, key) =>
      ordered.order(key.column, {
        ascending: key.ascending,
        ...(key.nullsFirst === undefined ? {} : { nullsFirst: key.nullsFirst }),
      }),
    query,
  );
}

/**
 * What became of a submission, in terms the route can map to a status code.
 * `cause` is for the operator reading logs, never for the player.
 */
export type LeaderboardSubmitResult =
  | { status: 'stored'; entry: LeaderboardEntry }
  | { status: 'invalid'; message: string }
  | { status: 'unavailable'; cause: unknown }
  | { status: 'failed'; cause: unknown };

export async function getLeaderboard(board: LeaderboardBoard): Promise<{data: LeaderboardEntry[], error?: string}> {
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
    
    const rows = supabase.from('leaderboard_entries').select('*').eq('difficulty', board.difficulty).gt('correct_pieces', 0);
    // A daily board is one UTC day. Filtering on both columns is also what lets the query read the partial daily index.
    const { data, error } = await orderByRanking(
      board.difficulty === DAILY_BOARD ? rows.eq('daily_day', board.daily_day) : rows,
    ).limit(LEADERBOARD_ROW_LIMIT);
      
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

type CutoffRow = {
  correct_pieces: number;
  total_wrong_pieces: number | null;
  memorize_time: number;
  solution_time: number;
};

async function readBoardCutoff(
  client: SupabaseClient,
  difficulty: LeaderboardDifficulty,
): Promise<BoardCutoff | null> {
  const ranked = orderByRanking(
    client
      .from('leaderboard_entries')
      .select('correct_pieces,total_wrong_pieces,memorize_time,solution_time')
      .eq('difficulty', difficulty)
      .gt('correct_pieces', 0),
  );

  // The board shows LEADERBOARD_ROW_LIMIT rows, so the last row it shows is the
  // score a newcomer has to beat. Reading only that row leaves the other 199 on
  // the server; a board with fewer rows returns nothing, which is the open case.
  const { data, error } = await ranked.range(LEADERBOARD_ROW_LIMIT - 1, LEADERBOARD_ROW_LIMIT - 1);

  if (error) {
    console.error(`Supabase cutoff query error for ${difficulty}:`, error);
    return null;
  }

  const rows: CutoffRow[] = data ?? [];
  const worst = rows[0];
  if (!worst) {
    return { kind: 'open' };
  }

  return {
    kind: 'full',
    worst: {
      correctPieces: worst.correct_pieces,
      totalWrongPieces: worst.total_wrong_pieces ?? null,
      memorizeTime: worst.memorize_time,
      solutionTime: worst.solution_time,
    },
  };
}

/**
 * `null` means "could not be determined", not "empty". The caller hides its
 * banner on `null` rather than telling a player something that might be wrong,
 * so every failure here collapses to it and nothing throws.
 */
export async function getLeaderboardCutoffs(): Promise<LeaderboardCutoffs | null> {
  try {
    const connectionStatus = await checkSupabaseConnection();
    if (!connectionStatus.connected) {
      console.error('Supabase connection failed:', connectionStatus.error);
      return null;
    }
    if (!supabase) {
      console.error('Supabase cutoffs unavailable: Supabase is not configured');
      return null;
    }

    const client = supabase;
    const readings = await Promise.all(
      LEADERBOARD_DIFFICULTIES.map(async (difficulty) => ({
        difficulty,
        cutoff: await readBoardCutoff(client, difficulty),
      })),
    );

    const cutoffs = {} as LeaderboardCutoffs;
    for (const { difficulty, cutoff } of readings) {
      if (cutoff === null) {
        return null;
      }
      cutoffs[difficulty] = cutoff;
    }
    return cutoffs;
  } catch (err) {
    console.error('Unexpected error in getLeaderboardCutoffs:', err);
    return null;
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

type BoardSubmission = Extract<LeaderboardSubmission, { difficulty: LeaderboardDifficulty }>;

const DROPPABLE_COLUMNS = [
  { column: 'skill_rating', migration: 'the rating and daily migration (0004)' },
  { column: 'country_code', migration: 'the country migration (0001)' },
] as const;
type Droppable = (typeof DROPPABLE_COLUMNS)[number];
type SubmissionRow = Omit<BoardSubmission, Droppable['column']> &
  Partial<Pick<BoardSubmission, Droppable['column']>>;

/** PGRST204 says "the 'x' column"; Postgres's 42703 says 'column "x"'. */
const NAMED_COLUMN = /the '(\w+)' column|column "(\w+)"/;

function columnNamedBy(error: PostgrestError): string | null {
  const named = NAMED_COLUMN.exec(error.message);
  return named?.[1] ?? named?.[2] ?? null;
}

function withoutColumn(row: SubmissionRow, column: Droppable['column']): SubmissionRow {
  const rest = { ...row };
  delete rest[column];
  return rest;
}

const INVALID_DIFFICULTY_OR_DAY = 'Invalid difficulty or daily day';

const DAILY_DAY_CHECK = 'check_daily_day_recent';

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
  const insertRow = (row: LeaderboardSubmission | SubmissionRow) =>
    client.from('leaderboard_entries').insert(row).select().single();

  const first = await insertRow(entry);
  if (!first.error) {
    return { status: 'stored', entry: first.data };
  }
  if (first.error.code === '23514' && first.error.message.includes(DAILY_DAY_CHECK)) {
    return { status: 'invalid', message: INVALID_DIFFICULTY_OR_DAY };
  }
  if (!isMissingColumn(first.error)) {
    return { status: 'failed', cause: first.error };
  }
  if (entry.difficulty === DAILY_BOARD) {
    return { status: 'unavailable', cause: first.error };
  }

  let row: SubmissionRow = entry;
  let rejection = first.error;
  let left: readonly Droppable[] = DROPPABLE_COLUMNS;
  for (;;) {
    const named = columnNamedBy(rejection);
    const drop = named === null ? left[0] : left.find(({ column }) => column === named);
    if (drop === undefined) {
      return { status: 'unavailable', cause: rejection };
    }
    console.warn(
      `Leaderboard insert rejected ${drop.column} ${row[drop.column]} (${rejection.code}: ${rejection.message}); ${drop.migration} is outstanding. Retrying without it.`,
    );
    row = withoutColumn(row, drop.column);
    left = left.filter((candidate) => candidate !== drop);

    const retry = await insertRow(row);
    if (!retry.error) {
      return { status: 'stored', entry: retry.data };
    }
    if (!isMissingColumn(retry.error)) {
      return { status: 'failed', cause: retry.error };
    }
    rejection = retry.error;
  }
}

export type StandingResult =
  | { status: 'ranked'; standing: Standing }
  | { status: 'missing' }
  | { status: 'noCountry' }
  | { status: 'unavailable'; cause: unknown };

export async function getStanding(id: string, scope: StandingScope): Promise<StandingResult> {
  if (!supabase) {
    return { status: 'unavailable', cause: 'Supabase is not configured' };
  }
  const client = supabase;
  // select('*'), not country_code by name: the column is absent where the country migration is outstanding.
  const found = await client.from('leaderboard_entries').select('*').eq('id', id).maybeSingle();
  if (found.error) {
    return { status: 'unavailable', cause: found.error };
  }
  const entry: LeaderboardEntry | null = found.data;
  if (entry === null) {
    return { status: 'missing' };
  }
  const board = parseBoard(entry.difficulty, entry.daily_day);
  if (board === null) {
    return { status: 'unavailable', cause: `entry ${id} names no board: ${entry.difficulty} ${entry.daily_day}` };
  }
  const country = scope === 'country' ? entry.country_code ?? WORLD_CODE : null;
  if (country === WORLD_CODE) {
    return { status: 'noCountry' };
  }

  const bucket = () => {
    const onDifficulty = client
      .from('leaderboard_entries')
      .select('id', { count: 'exact', head: true })
      .eq('difficulty', board.difficulty)
      .gt('correct_pieces', 0);
    const ranked = board.difficulty === DAILY_BOARD ? onDifficulty.eq('daily_day', board.daily_day) : onDifficulty;
    return country === null ? ranked : ranked.eq('country_code', country);
  };
  const score = {
    correctPieces: entry.correct_pieces,
    totalWrongPieces: entry.total_wrong_pieces ?? null,
    memorizeTime: entry.memorize_time,
    solutionTime: entry.solution_time,
  };
  const [above, total] = await Promise.all([bucket().or(rankedAboveFilter(score)), bucket()]);
  if (above.error || total.error || above.count === null || total.count === null) {
    return { status: 'unavailable', cause: above.error ?? total.error ?? 'no count returned' };
  }
  return {
    status: 'ranked',
    standing: { ...board, country, rank: above.count + 1, total: total.count },
  };
}
