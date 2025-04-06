import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { LeaderboardEntry, LeaderboardSubmission } from '@/types/leaderboard';

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
    
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('difficulty', difficulty)
      .order('correct_pieces', { ascending: false })
      .order('total_wrong_pieces', { ascending: true, nullsFirst: false })
      .order('memorize_time', { ascending: true })
      .order('solution_time', { ascending: true })
      .limit(200);
      
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

export async function submitLeaderboardEntry(entry: LeaderboardSubmission): Promise<LeaderboardEntry> {
  // Validate player name length
  if (entry.player_name.length < 4 || entry.player_name.length > 16) {
    throw new Error('Player name must be between 4 and 16 characters');
  }
  
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .insert(entry)
    .select()
    .single();
    
  if (error) {
    console.error('Error submitting to leaderboard:', error);
    throw new Error('Failed to submit leaderboard entry');
  }
  
  return data;
}

export async function checkLeaderboardRanking(
  difficulty: string,
  correctPieces: number,
  memorizeTime: number,
  solutionTime: number,
  totalWrongPieces?: number
): Promise<number> {
  // Build the query condition based on the updated sorting criteria
  let condition = `correct_pieces.gt.${correctPieces}`;
  
  // If total_wrong_pieces is provided, use it in the ranking
  if (totalWrongPieces !== undefined) {
    condition += `, and(correct_pieces.eq.${correctPieces},total_wrong_pieces.lt.${totalWrongPieces})`;
    condition += `, and(correct_pieces.eq.${correctPieces},total_wrong_pieces.eq.${totalWrongPieces},memorize_time.lt.${memorizeTime})`;
    condition += `, and(correct_pieces.eq.${correctPieces},total_wrong_pieces.eq.${totalWrongPieces},memorize_time.eq.${memorizeTime},solution_time.lt.${solutionTime})`;
  } else {
    // Fallback to previous logic when totalWrongPieces is not provided
    condition += `, and(correct_pieces.eq.${correctPieces},memorize_time.lt.${memorizeTime})`;
    condition += `, and(correct_pieces.eq.${correctPieces},memorize_time.eq.${memorizeTime},solution_time.lt.${solutionTime})`;
  }
  
  const { count, error } = await supabase
    .from('leaderboard_entries')
    .select('*', { count: 'exact', head: true })
    .eq('difficulty', difficulty)
    .or(condition);
    
  if (error) {
    console.error('Error checking leaderboard ranking:', error);
    throw new Error('Failed to check leaderboard ranking');
  }
  
  // The rank is one position after all the entries that beat this one
  return (count || 0) + 1;
} 