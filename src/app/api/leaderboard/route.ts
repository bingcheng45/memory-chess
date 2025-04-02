import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, submitLeaderboardEntry } from '@/lib/services/leaderboardService';

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
    const { player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time } = body;
    
    if (!player_name || !difficulty || !piece_count || correct_pieces === undefined || 
        !memorize_time || !solution_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate difficulty
    if (!['easy', 'medium', 'hard', 'grandmaster'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }
    
    // Additional validation
    if (correct_pieces > piece_count || memorize_time <= 0 || solution_time <= 0) {
      return NextResponse.json(
        { error: 'Invalid data values' },
        { status: 400 }
      );
    }
    
    const data = await submitLeaderboardEntry({
      player_name,
      difficulty,
      piece_count,
      correct_pieces,
      memorize_time,
      solution_time,
    });
    
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 