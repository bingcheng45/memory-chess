import { supabase, supabaseWriter, SUPABASE_WRITES_OFF_REASON, checkSupabaseConnection } from '@/lib/supabase';

export const DATABASE_CONNECTION_ISSUE = 'Database connection issue';

export interface GameMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  last_updated: string;
}

/**
 * Get all game metrics from the database
 */
export async function getAllGameMetrics(): Promise<{
  data: GameMetric[];
  error?: string;
}> {
  try {
    // First check the Supabase connection
    const connectionStatus = await checkSupabaseConnection();
    if (!connectionStatus.connected) {
      console.error('Supabase connection failed:', connectionStatus.error);
      return {
        data: [],
        error: `${DATABASE_CONNECTION_ISSUE}: ${connectionStatus.error || 'Unable to connect to the database'}`
      };
    }
    if (!supabase) {
      return {
        data: [],
        error: `${DATABASE_CONNECTION_ISSUE}: Supabase is not configured`
      };
    }

    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .order('metric_name');

    if (error) {
      console.error('Error fetching game metrics:', error);
      return {
        data: [],
        error: `Failed to fetch game metrics: ${error.message}`
      };
    }

    return { data: data || [] };
  } catch (err) {
    console.error('Unexpected error in getAllGameMetrics:', err);
    return {
      data: [],
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Get a specific game metric by name
 */
export async function getGameMetric(metricName: string): Promise<{
  data: GameMetric | null;
  error?: string;
}> {
  try {
    const connectionStatus = await checkSupabaseConnection();
    if (!connectionStatus.connected) {
      return {
        data: null,
        error: `${DATABASE_CONNECTION_ISSUE}: ${connectionStatus.error || 'Unable to connect to the database'}`
      };
    }
    if (!supabase) {
      return {
        data: null,
        error: `${DATABASE_CONNECTION_ISSUE}: Supabase is not configured`
      };
    }

    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('metric_name', metricName)
      .single();

    if (error) {
      // If the error is "No rows found", return null without an error
      if (error.code === 'PGRST116') {
        return { data: null };
      }
      
      console.error(`Error fetching metric ${metricName}:`, error);
      return {
        data: null,
        error: `Failed to fetch metric: ${error.message}`
      };
    }

    return { data };
  } catch (err) {
    console.error(`Unexpected error in getGameMetric(${metricName}):`, err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Increment a game metric by a specified amount
 */
export async function incrementGameMetric(metricName: string, increment: number = 1): Promise<{
  success: boolean;
  newValue?: number;
  error?: string;
}> {
  try {
    const connectionStatus = await checkSupabaseConnection();
    if (!connectionStatus.connected) {
      return {
        success: false,
        error: `${DATABASE_CONNECTION_ISSUE}: ${connectionStatus.error || 'Unable to connect to the database'}`
      };
    }
    if (!supabaseWriter) {
      return {
        success: false,
        error: `${DATABASE_CONNECTION_ISSUE}: ${SUPABASE_WRITES_OFF_REASON}`
      };
    }

    const { data, error } = await supabaseWriter
      .rpc('increment_metric', {
        p_metric_name: metricName,
        p_increment: increment
      });

    if (error) {
      console.error(`Error incrementing metric ${metricName}:`, error);
      return {
        success: false,
        error: `Failed to increment metric: ${error.message}`
      };
    }

    return {
      success: true,
      newValue: data
    };
  } catch (err) {
    console.error(`Unexpected error in incrementGameMetric(${metricName}):`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
}
