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
  solutionTime: number
): Promise<number> {
  const { count, error } = await supabase
    .from('leaderboard_entries')
    .select('*', { count: 'exact', head: true })
    .eq('difficulty', difficulty)
    .or(`correct_pieces.gt.${correctPieces}, and(correct_pieces.eq.${correctPieces},memorize_time.lt.${memorizeTime}), and(correct_pieces.eq.${correctPieces},memorize_time.eq.${memorizeTime},solution_time.lt.${solutionTime})`);
    
  if (error) {
    console.error('Error checking leaderboard ranking:', error);
    throw new Error('Failed to check leaderboard ranking');
  }
  
  // The rank is one position after all the entries that beat this one
  return (count || 0) + 1;
} 