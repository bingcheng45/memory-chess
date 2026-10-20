import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, submitLeaderboardEntry } from '@/lib/services/leaderboardService';
import { readDailyBoard } from '@/lib/daily/readDailyBoard';
import { checkSupabaseConnection } from '@/lib/supabase';
import { parseCountryCode, WORLD_CODE } from '@/lib/leaderboard/countries';
import { isSkillRating, MAX_SKILL_RATING, START_RATING } from '@/lib/game/rating';
import { joinableDays, readableDays, readBoard } from '@/lib/leaderboard/board';
import { playerNameProblem } from '@/lib/leaderboard/playerName';
import { utcDayOf } from '@/lib/lab/daily';
import { dailySettingOf } from '@/lib/daily/schedule';
import { DAILY_BOARD, LEADERBOARD_UNAVAILABLE, type LeaderboardBoard, type LeaderboardDifficulty } from '@/types/leaderboard';
import { GAME_CONFIG_RULES } from '@/lib/game/configPrefill';
import { MEMORIZE_SECONDS_RANGE } from '@/lib/reference/facts';
import { clientAddress, fixedWindowLimiter } from '@/lib/server/rateLimit';
import { reportServerError } from '@/lib/server/serverErrors';

const RANKED_CACHE = 'public, s-maxage=30, stale-while-revalidate=300';
const DAILY_DAY_CACHE = 'public, s-maxage=15, stale-while-revalidate=60';

const SUBMISSION_UNAVAILABLE = 'The leaderboard is being updated. Please try again shortly.';

/** A round takes longer than ten seconds to play, so more scores than this from one address are a script. */
const SCORES_PER_MINUTE = 5;
const allowScore = fixedWindowLimiter({ limit: SCORES_PER_MINUTE, windowMs: 60_000, maxKeys: 5_000 });

const SECONDS_PER_PIECE = 0.25;

const BOARD_PIECES = Object.fromEntries(GAME_CONFIG_RULES.presets.map(({ id, pieceCount }) => [id, pieceCount])) as Record<LeaderboardDifficulty, number>;

const LONGEST_STUDY_SECONDS = MEMORIZE_SECONDS_RANGE.max;

function rebuildTooFast(pieceCount: number, solutionTime: unknown): string | null {
  const floor = pieceCount * SECONDS_PER_PIECE;
  return typeof solutionTime === 'number' && Number.isFinite(solutionTime) && solutionTime >= floor ? null : `A rebuild of ${pieceCount} pieces takes at least ${floor} seconds`;
}

function boardRowMismatch(board: LeaderboardBoard, pieceCount: unknown, memorizeTime: unknown, solutionTime: unknown, country: unknown): string | null {
  if (board.difficulty !== DAILY_BOARD) {
    const pieces = BOARD_PIECES[board.difficulty];
    if (pieceCount !== pieces) return `The ${board.difficulty} board is ${pieces} pieces`;
    if (typeof memorizeTime !== 'number' || memorizeTime <= 0 || memorizeTime > LONGEST_STUDY_SECONDS) {
      return `A study lasts more than 0 and at most ${LONGEST_STUDY_SECONDS} seconds`;
    }
    return rebuildTooFast(pieces, solutionTime);
  }
  const code = parseCountryCode(country);
  if (code === null || code === WORLD_CODE) return 'A daily row needs a country';
  const setting = dailySettingOf(board.daily_day);
  if (pieceCount !== setting.pieceCount || memorizeTime !== setting.memorizeTime) {
    return `The daily board for ${board.daily_day} is ${setting.pieceCount} pieces and ${setting.memorizeTime} seconds`;
  }
  return rebuildTooFast(setting.pieceCount, solutionTime);
}

const BOARD_SQUARE_COUNT = 64;

/**
 * A round's counts as the scorer writes them: wrong is the pieces missed plus any extra placed, so it is at least
 * piece_count - correct and at most the squares left beside the correct ones. The board lists only rows with a
 * correct piece; accepting 0 would store a score nobody can see.
 */
function countsAreScored(pieceCount: unknown, correct: unknown, wrong: unknown): boolean {
  if (typeof pieceCount !== 'number' || typeof correct !== 'number' || typeof wrong !== 'number') return false;
  if (![pieceCount, correct, wrong].every(Number.isInteger)) return false;
  return correct >= 1 && correct <= pieceCount && wrong >= pieceCount - correct && wrong <= BOARD_SQUARE_COUNT - correct;
}

function parseSkillRating(value: unknown): number | null {
  if (value === undefined) return START_RATING;
  return isSkillRating(value) ? Math.min(value, MAX_SKILL_RATING) : null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const difficulty = searchParams.get('difficulty') || 'medium';
  const now = Date.now();
  const namedDay = searchParams.get('daily_day');
  const board = readBoard(difficulty, difficulty === DAILY_BOARD ? (namedDay ?? utcDayOf(now)) : null, readableDays(now), searchParams.get('mode'));

  if (board === null) {
    return NextResponse.json(
      { error: 'Invalid difficulty level' },
      { status: 400 }
    );
  }
  
  // getLeaderboard logs the cause of its own failures; a reader only learns the board is unavailable.
  const unavailable = () => NextResponse.json({ data: [], error: LEADERBOARD_UNAVAILABLE }, { status: 503 });
  try {
    if (board.difficulty !== DAILY_BOARD) {
      const result = await getLeaderboard(board);
      return result.error ? unavailable() : NextResponse.json({ data: result.data }, { headers: { 'Cache-Control': RANKED_CACHE } });
    }
    const read = await readDailyBoard(board.daily_day);
    if (read === null) return unavailable();
    return NextResponse.json({ data: read.rows, playedLike: read.playedLike }, namedDay === null ? undefined : { headers: { 'Cache-Control': DAILY_DAY_CACHE } });
  } catch (err) {
    console.error('Unexpected API error:', err);
    reportServerError('GET /api/leaderboard', 'unexpected', err, { board: board.difficulty });
    return unavailable();
  }
}

export async function POST(request: NextRequest) {
  const verdict = allowScore(clientAddress(request.headers), Date.now());
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: 'Too many scores submitted. Please wait a minute.' },
      { status: 429, headers: { 'Retry-After': String(verdict.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  try {
    // Validate request body
    const { player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time, total_wrong_pieces, country_code, skill_rating, daily_day, mode } = body ?? {};
    
    if (!player_name || !difficulty || !piece_count || correct_pieces === undefined || 
        !memorize_time || !solution_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (typeof player_name !== 'string') {
      return NextResponse.json({ error: 'Player name must be text' }, { status: 400 });
    }
    const playerName = player_name.trim();
    if (playerNameProblem(playerName) !== null) {
      return NextResponse.json(
        { error: 'Player name must be between 4 and 16 characters' },
        { status: 400 }
      );
    }
    
    const board = readBoard(difficulty, daily_day, joinableDays(Date.now()), mode);
    if (board === null) {
      return NextResponse.json({ error: 'Invalid difficulty or daily day' }, { status: 400 });
    }

    const mismatch = boardRowMismatch(board, piece_count, memorize_time, solution_time, country_code);
    if (mismatch !== null) {
      return NextResponse.json({ error: mismatch }, { status: 400 });
    }

    const parsedSkillRating = parseSkillRating(skill_rating);
    if (parsedSkillRating === null) {
      return NextResponse.json({ error: 'Invalid skill rating' }, { status: 400 });
    }

    const parsedCountryCode =
      country_code === undefined || country_code === null
        ? WORLD_CODE
        : parseCountryCode(country_code);

    if (parsedCountryCode === null) {
      return NextResponse.json(
        { error: 'Invalid country code' },
        { status: 400 }
      );
    }

    if (!countsAreScored(piece_count, correct_pieces, total_wrong_pieces)) {
      return NextResponse.json(
        { error: 'Invalid data values' },
        { status: 400 }
      );
    }

    // First check if Supabase is configured properly
    const connectionStatus = await checkSupabaseConnection();
    if (!connectionStatus.connected) {
      console.error('Leaderboard submission unavailable:', connectionStatus.error);
      reportServerError('POST /api/leaderboard', 'unavailable', connectionStatus.error, { board: board.difficulty });
      return NextResponse.json({ error: SUBMISSION_UNAVAILABLE }, { status: 503 });
    }
    
    const result = await submitLeaderboardEntry({
      player_name: playerName,
      ...board,
      piece_count,
      correct_pieces,
      memorize_time,
      solution_time,
      total_wrong_pieces,
      skill_rating: parsedSkillRating,
      country_code: parsedCountryCode
    });

    switch (result.status) {
      case 'stored':
        return NextResponse.json({ success: true, data: result.entry });
      case 'invalid':
        return NextResponse.json({ error: result.message }, { status: 400 });
      case 'unavailable':
        console.error('Leaderboard submission unavailable:', result.cause);
        reportServerError('POST /api/leaderboard', 'unavailable', result.cause, { board: board.difficulty });
        return NextResponse.json({ error: SUBMISSION_UNAVAILABLE }, { status: 503 });
      case 'failed':
        console.error('Leaderboard submission failed:', result.cause);
        reportServerError('POST /api/leaderboard', 'failed', result.cause, { board: board.difficulty });
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
      default: {
        const unhandled: never = result;
        throw new Error(`unhandled submission result ${JSON.stringify(unhandled)}`);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    reportServerError('POST /api/leaderboard', 'unexpected', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 