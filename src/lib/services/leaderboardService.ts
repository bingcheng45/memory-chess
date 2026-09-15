import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { LEADERBOARD_ROW_LIMIT } from '@/lib/reference/facts';
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

export async function submitLeaderboardEntry(entry: LeaderboardSubmission): Promise<LeaderboardEntry> {
  // Validate player name length
  if (entry.player_name.length < 4 || entry.player_name.length > 16) {
    throw new Error('Player name must be between 4 and 16 characters');
  }
  if (!supabase) {
    throw new Error('Supabase is not configured');
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
