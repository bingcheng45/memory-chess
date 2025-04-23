import { supabase, checkSupabaseConnection } from '@/lib/supabase';

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
        error: `Database connection issue: ${connectionStatus.error || 'Unable to connect to the database'}`
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
        error: `Database connection issue: ${connectionStatus.error || 'Unable to connect to the database'}`
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
        error: `Database connection issue: ${connectionStatus.error || 'Unable to connect to the database'}`
      };
    }

    // Using the PostgreSQL function we created
    const { data, error } = await supabase
      .rpc('increment_metric', {
        p_metric_name: metricName,
        p_increment: increment
      });

    if (error) {
      console.error(`Error incrementing metric ${metricName}:`, error);
      
      // Fallback: If RPC fails, try direct update
      const { data: metric } = await getGameMetric(metricName);
      
      if (metric) {
        const { data: updateData, error: updateError } = await supabase
          .from('game_stats')
          .update({ 
            metric_value: metric.metric_value + increment,
            last_updated: new Date().toISOString()
          })
          .eq('metric_name', metricName)
          .select('metric_value')
          .single();
          
        if (updateError) {
          return {
            success: false,
            error: `Failed to increment metric: ${updateError.message}`
          };
        }
        
        return { 
          success: true, 
          newValue: updateData?.metric_value 
        };
      } else {
        // If metric doesn't exist, create it
        const { data: insertData, error: insertError } = await supabase
          .from('game_stats')
          .insert({
            metric_name: metricName,
            metric_value: increment
          })
          .select('metric_value')
          .single();
          
        if (insertError) {
          return {
            success: false,
            error: `Failed to create metric: ${insertError.message}`
          };
        }
        
        return { 
          success: true, 
          newValue: insertData?.metric_value 
        };
      }
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