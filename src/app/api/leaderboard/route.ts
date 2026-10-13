import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, submitLeaderboardEntry } from '@/lib/services/leaderboardService';
import { checkSupabaseConnection } from '@/lib/supabase';
import { parseCountryCode, WORLD_CODE } from '@/lib/leaderboard/countries';
import { isSkillRating, MAX_SKILL_RATING, START_RATING } from '@/lib/game/rating';
import { joinableDays, readableDays, readBoard } from '@/lib/leaderboard/board';
import { playerNameProblem } from '@/lib/leaderboard/playerName';
import { utcDayOf } from '@/lib/lab/daily';
import { dailySettingOf } from '@/lib/daily/schedule';
import { DAILY_BOARD, type LeaderboardBoard } from '@/types/leaderboard';
import { clientAddress, fixedWindowLimiter } from '@/lib/server/rateLimit';

const LEADERBOARD_UNAVAILABLE = 'The leaderboard is being updated. Please try again shortly.';

/** A round takes longer than ten seconds to play, so more scores than this from one address are a script. */
const SCORES_PER_MINUTE = 5;
const allowScore = fixedWindowLimiter({ limit: SCORES_PER_MINUTE, windowMs: 60_000, maxKeys: 5_000 });

/** The board is public in the repo, so a script could post a perfect row; no person rebuilds a piece faster than this. */
const DAILY_SECONDS_PER_PIECE = 0.25;

function dailyRowMismatch(board: LeaderboardBoard, pieceCount: unknown, memorizeTime: unknown, solutionTime: unknown, country: unknown): string | null {
  if (board.difficulty !== DAILY_BOARD) return null;
  const code = parseCountryCode(country);
  if (code === null || code === WORLD_CODE) return 'A daily row needs a country';
  const setting = dailySettingOf(board.daily_day);
  if (pieceCount !== setting.pieceCount || memorizeTime !== setting.memorizeTime) {
    return `The daily board for ${board.daily_day} is ${setting.pieceCount} pieces and ${setting.memorizeTime} seconds`;
  }
  const floor = setting.pieceCount * DAILY_SECONDS_PER_PIECE;
  if (typeof solutionTime !== 'number' || solutionTime < floor) return `A daily rebuild of ${setting.pieceCount} pieces takes at least ${floor} seconds`;
  return null;
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
  const board = readBoard(difficulty, difficulty === DAILY_BOARD ? (searchParams.get('daily_day') ?? utcDayOf(now)) : null, readableDays(now));

  if (board === null) {
    return NextResponse.json(
      { error: 'Invalid difficulty level' },
      { status: 400 }
    );
  }
  
  try {
    // First check if Supabase is configured properly
    const connectionStatus = await checkSupabaseConnection();
    if (!connectionStatus.connected) {
      console.warn('Supabase connection issue:', connectionStatus.error);
      // Return empty data with a connection error message
      return NextResponse.json({ 
        data: [], 
        error: 'Database connection unavailable. Please check the application configuration.'
      });
    }

    const result = await getLeaderboard(board);
    
    if (result.error) {
      // Return a more detailed error message but still with empty data
      return NextResponse.json({ 
        data: [], 
        error: result.error 
      });
    }
    
    return NextResponse.json({ data: result.data });
  } catch (err) {
    console.error('Unexpected API error:', err);
    return NextResponse.json(
      { 
        data: [],
        error: err instanceof Error ? err.message : 'An unexpected error occurred' 
      }
    );
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

  try {
    const body = await request.json();
    
    // Validate request body
    const { player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time, total_wrong_pieces, country_code, skill_rating, daily_day } = body;
    
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
    
    const board = readBoard(difficulty, daily_day, joinableDays(Date.now()));
    if (board === null) {
      return NextResponse.json({ error: 'Invalid difficulty or daily day' }, { status: 400 });
    }

    const mismatch = dailyRowMismatch(board, piece_count, memorize_time, solution_time, country_code);
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

    if (!countsAreScored(piece_count, correct_pieces, total_wrong_pieces) || memorize_time <= 0 || solution_time <= 0) {
      return NextResponse.json(
        { error: 'Invalid data values' },
        { status: 400 }
      );
    }

    // First check if Supabase is configured properly
    const connectionStatus = await checkSupabaseConnection();
    if (!connectionStatus.connected) {
      console.error('Leaderboard submission unavailable:', connectionStatus.error);
      return NextResponse.json({ error: LEADERBOARD_UNAVAILABLE }, { status: 503 });
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
        return NextResponse.json({ error: LEADERBOARD_UNAVAILABLE }, { status: 503 });
      case 'failed':
        console.error('Leaderboard submission failed:', result.cause);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
      default: {
        const unhandled: never = result;
        throw new Error(`unhandled submission result ${JSON.stringify(unhandled)}`);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 