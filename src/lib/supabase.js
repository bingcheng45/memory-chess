import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables with more detailed messages
let environmentError = null;
if (!supabaseUrl && !supabaseAnonKey) {
  environmentError = 'Missing both Supabase URL and anonymous key';
} else if (!supabaseUrl) {
  environmentError = 'Missing Supabase URL (NEXT_PUBLIC_SUPABASE_URL)';
} else if (!supabaseAnonKey) {
  environmentError = 'Missing Supabase anonymous key (NEXT_PUBLIC_SUPABASE_ANON_KEY)';
}

// Only log during development or when explicitly requested, not during build
if (environmentError && (process.env.NODE_ENV === 'development' || process.env.DEBUG)) {
  console.error(`Supabase configuration error: ${environmentError}. Check your .env.local file.`);
}

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check Supabase connection
export async function checkSupabaseConnection() {
  // First check if environment variables are set
  if (environmentError) {
    return { connected: false, error: environmentError };
  }
  
  try {
    // Attempt a simple query to check connection
    const { error } = await supabase.from('leaderboard_entries').select('count', { count: 'exact', head: true });
    
    if (error) {
      // Only log during development or when explicitly requested
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
        console.error('Supabase connection test failed:', error);
      }
      
      // Provide more specific error messages based on common error codes
      if (error.code === 'PGRST301') {
        return { connected: false, error: 'Table does not exist. Please create the leaderboard_entries table.' };
      } else if (error.code === '42501') {
        return { connected: false, error: 'Permission denied. Check your Supabase policies.' };
      } else if (error.code === '28P01') {
        return { connected: false, error: 'Invalid API key or credentials.' };
      }
      return { connected: false, error: error.message };
    }
    
    return { connected: true };
  } catch (err) {
    // Only log during development or when explicitly requested
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.error('Unexpected error testing Supabase connection:', err);
    }
    
    return { 
      connected: false, 
      error: err instanceof Error 
        ? err.message 
        : 'Unknown error connecting to database'
    };
  }
}