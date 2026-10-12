import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, submitLeaderboardEntry } from '@/lib/services/leaderboardService';
import { checkSupabaseConnection } from '@/lib/supabase';
import { parseCountryCode, WORLD_CODE } from '@/lib/leaderboard/countries';
import {
  DAILY_BOARD,
  isLeaderboardDifficulty,
  MAX_SKILL_RATING,
  type LeaderboardBoard,
} from '@/types/leaderboard';

const LEADERBOARD_UNAVAILABLE = 'The leaderboard is being updated. Please try again shortly.';

const DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

function parseSkillRating(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_SKILL_RATING
    ? value
    : null;
}

/** A calendar day that exists, as YYYY-MM-DD. */
function parseDay(value: unknown): string | null {
  if (typeof value !== 'string' || !DAY_FORMAT.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) ? value : null;
}

type BoardReading = { board: LeaderboardBoard } | { error: string };

function readBoard(difficulty: unknown, dailyDay: unknown): BoardReading {
  if (difficulty === DAILY_BOARD) {
    const day = parseDay(dailyDay);
    return day === null ? { error: 'Invalid daily day' } : { board: { difficulty, daily_day: day } };
  }
  if (!isLeaderboardDifficulty(difficulty)) {
    return { error: 'Invalid difficulty level' };
  }
  return dailyDay === undefined || dailyDay === null
    ? { board: { difficulty } }
    : { error: 'Invalid daily day' };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const difficulty = searchParams.get('difficulty') || 'medium';
  
  // Validate difficulty
  if (!['easy', 'medium', 'hard', 'grandmaster'].includes(difficulty)) {
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

    const result = await getLeaderboard(difficulty);
    
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
    
    // Validate player name length
    if (typeof player_name === 'string' && (player_name.length < 4 || player_name.length > 16)) {
      return NextResponse.json(
        { error: 'Player name must be between 4 and 16 characters' },
        { status: 400 }
      );
    }
    
    const board = readBoard(difficulty, daily_day);
    if ('error' in board) {
      return NextResponse.json({ error: board.error }, { status: 400 });
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

    // Additional validation
    // The board lists only rows with a correct piece; accepting 0 would store
    // a score nobody can see.
    if (correct_pieces < 1 || correct_pieces > piece_count || memorize_time <= 0 || solution_time <= 0) {
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
      player_name,
      ...board.board,
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