import type { PostgrestError } from '@supabase/supabase-js';
import { supabase, leaderboardWriter, SUPABASE_WRITES_OFF_REASON, checkSupabaseConnection } from '@/lib/supabase';
import { LEADERBOARD_ROW_LIMIT } from '@/lib/reference/facts';
import { reportServerError } from '@/lib/server/serverErrors';
import { RANKING_ORDER, type BoardCutoff, type LeaderboardCutoffs } from '@/lib/leaderboard/ranking';
import { parseBoard } from '@/lib/leaderboard/board';
import { blindfoldBoardOpen } from '@/lib/leaderboard/mode';
import { BOARD_PIECES, studyFloorSeconds } from '@/lib/leaderboard/studyFloor';
import { playerNameProblem } from '@/lib/leaderboard/playerName';
import { rankedAboveFilter, type Standing, type StandingScope } from '@/lib/leaderboard/standing';
import { WORLD_CODE } from '@/lib/leaderboard/countries';
import type { DailyResultRow } from '@/lib/daily/boardRating';
import {
  DAILY_BOARD,
  LEADERBOARD_DIFFICULTIES,
  LEADERBOARD_UNAVAILABLE,
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
 * Which mode's rows a ranked board reads. Before the blindfold board opens the column may not exist, and every row is
 * a board-study row, so the query names no mode at all, exactly as it did before.
 */
function modeOf(board: LeaderboardBoard): 'board' | 'blindfold' | null {
  if (board.difficulty === DAILY_BOARD) return null;
  if (board.mode) return board.mode;
  return blindfoldBoardOpen() ? 'board' : null;
}

/**
 * Filtering on both columns is what lets the query read the partial daily index, and the mode the partial blindfold one.
 * A ranked row studied under the study floor is hidden, not deleted: rows written before the route enforced it stay stored.
 */
function rankedRows<Columns extends '*' | 'id' | 'player_name'>(client: SupabaseClient, board: LeaderboardBoard, columns: Columns, options?: { count: 'exact'; head: true }) {
  const rows = client.from('leaderboard_entries').select(columns, options).eq('difficulty', board.difficulty).gt('correct_pieces', 0);
  if (board.difficulty === DAILY_BOARD) return rows.eq('daily_day', board.daily_day);
  const studied = rows.gte('memorize_time', studyFloorSeconds(BOARD_PIECES[board.difficulty]));
  const mode = modeOf(board);
  return mode === null ? studied : studied.eq('mode', mode);
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

const NAME_PAGE_ROWS = 1000;
const MAX_PAGES = 20;

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

function isShown(name: string): boolean {
  return playerNameProblem(name.trim()) !== 'blocked';
}

export async function getLeaderboard(board: LeaderboardBoard): Promise<{data: LeaderboardEntry[], error?: string}> {
  const unavailable = (what: string, cause: unknown) => {
    console.error(what, cause);
    reportServerError('leaderboard read', 'unavailable', cause, { board: board.difficulty });
    return { data: [], error: LEADERBOARD_UNAVAILABLE };
  };
  try {
    if (!supabase) return unavailable('Leaderboard read failed:', 'Supabase is not configured');

    const seen = new Set<string>();
    const entries: LeaderboardEntry[] = [];
    for (let page = 0; page < MAX_PAGES && entries.length < LEADERBOARD_ROW_LIMIT; page++) {
      const from = page * LEADERBOARD_ROW_LIMIT;
      const { data, error } = await orderByRanking(rankedRows(supabase, board, '*')).range(from, from + LEADERBOARD_ROW_LIMIT - 1);
      if (error) return unavailable('Supabase query error:', error);
      const rows: LeaderboardEntry[] = data ?? [];
      for (const row of rows) {
        const key = nameKey(row.player_name);
        if (entries.length < LEADERBOARD_ROW_LIMIT && !seen.has(key) && isShown(row.player_name)) {
          seen.add(key);
          entries.push(row);
        }
      }
      if (rows.length < LEADERBOARD_ROW_LIMIT) break;
    }

    return { data: entries };
  } catch (err) {
    return unavailable('Unexpected error in getLeaderboard:', err);
  }
}

/** Enough results to settle the estimate many times over; a busier day reads a sample. */
const DAILY_RESULTS_LIMIT = 1000;

/** Every result on a daily board, not only the ranked top, so the board's rating is not read from its best players. Null on failure. */
export async function getDailyResults(day: string): Promise<DailyResultRow[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('piece_count,correct_pieces,total_wrong_pieces,skill_rating')
      .eq('difficulty', DAILY_BOARD)
      .eq('daily_day', day)
      .gt('correct_pieces', 0)
      .order('created_at', { ascending: true })
      .limit(DAILY_RESULTS_LIMIT);
    if (error) {
      console.error('Daily results query error:', error);
      return null;
    }
    return data ?? [];
  } catch (err) {
    console.error('Unexpected error in getDailyResults:', err);
    return null;
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
  const board = client
    .from('leaderboard_entries')
    .select('correct_pieces,total_wrong_pieces,memorize_time,solution_time')
    .eq('difficulty', difficulty)
    .gt('correct_pieces', 0)
    .gte('memorize_time', studyFloorSeconds(BOARD_PIECES[difficulty]));
  const mode = modeOf({ difficulty });
  const ranked = orderByRanking(mode === null ? board : board.eq('mode', mode));

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
  const nameProblem = playerNameProblem(entry.player_name);
  if (nameProblem === 'blocked') {
    return { status: 'invalid', message: 'Please choose a different player name' };
  }
  if (nameProblem !== null) {
    return { status: 'invalid', message: 'Player name must be between 4 and 16 characters' };
  }
  const client = leaderboardWriter();
  if (!client) {
    return { status: 'unavailable', cause: SUPABASE_WRITES_OFF_REASON };
  }

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
  // A daily row needs 0004's columns and a blindfold row 0008's; neither is stored on a board it does not name.
  if (entry.difficulty === DAILY_BOARD || entry.mode) {
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
  const board = parseBoard(entry.difficulty, entry.daily_day, entry.mode);
  if (board === null) {
    return { status: 'unavailable', cause: `entry ${id} names no board: ${entry.difficulty} ${entry.daily_day}` };
  }
  if (board.difficulty !== DAILY_BOARD && entry.memorize_time < studyFloorSeconds(BOARD_PIECES[board.difficulty])) {
    return { status: 'missing' };
  }
  const country = scope === 'country' ? entry.country_code ?? WORLD_CODE : null;
  if (country === WORLD_CODE) {
    return { status: 'noCountry' };
  }

  if (!isShown(entry.player_name)) {
    return { status: 'missing' };
  }
  const own = nameKey(entry.player_name);
  const bucket = () => {
    const ranked = rankedRows(client, board, 'player_name');
    return country === null ? ranked : ranked.eq('country_code', country);
  };
  const score = {
    correctPieces: entry.correct_pieces,
    totalWrongPieces: entry.total_wrong_pieces ?? null,
    memorizeTime: entry.memorize_time,
    solutionTime: entry.solution_time,
  };
  const names = async (aboveOnly: boolean) => {
    const found = new Set<string>();
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * NAME_PAGE_ROWS;
      const rows = bucket();
      const { data, error } = await (aboveOnly ? rows.or(rankedAboveFilter(score)) : rows).order('id').range(from, from + NAME_PAGE_ROWS - 1);
      if (error) return error;
      const batch: { player_name: string }[] = data ?? [];
      for (const row of batch) if (isShown(row.player_name)) found.add(nameKey(row.player_name));
      if (batch.length < NAME_PAGE_ROWS) break;
    }
    return found;
  };
  const [above, total] = await Promise.all([names(true), names(false)]);
  if (!(above instanceof Set) || !(total instanceof Set)) {
    return { status: 'unavailable', cause: above instanceof Set ? total : above };
  }
  above.delete(own);
  return {
    status: 'ranked',
    standing: { ...board, country, rank: above.size + 1, total: total.size },
  };
}
