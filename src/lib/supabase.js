import 'server-only';
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

// Create a single supabase client for the entire app
export const supabase = environmentError ? null : createClient(supabaseUrl, supabaseAnonKey);

const readOnly = process.env.SUPABASE_READ_ONLY === 'true';

// Local runs against the production project set SUPABASE_READ_ONLY so no write can reach it
export const supabaseWriter = readOnly ? null : supabase;

function jwtRole(key) {
  const parts = key.split('.');
  if (parts.length !== 3) return null;
  try {
    const role = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role;
    return typeof role === 'string' ? role : null;
  } catch {
    return null;
  }
}

function serviceKeyProblem(key) {
  if (!key) return 'is not set';
  const role = jwtRole(key);
  if (role === 'service_role') return null;
  return role ? `holds a key whose role is "${role}", not "service_role"` : 'does not hold a Supabase JWT with a role';
}

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const leaderboardServiceKeyProblem = serviceKeyProblem(serviceKey);
export const serviceRoleWriter =
  supabaseWriter && !leaderboardServiceKeyProblem
    ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    : null;

function anonFallbackWriter(what, migration) {
  let reported = false;
  return () => {
    if (serviceRoleWriter || !supabaseWriter) return serviceRoleWriter;
    if (!reported) {
      reported = true;
      const message = `SUPABASE_SERVICE_ROLE_KEY ${leaderboardServiceKeyProblem}, so ${what} are written with the anon key. Migration ${migration} refuses those writes.`;
      if (serviceKey) console.error(`${message} Set it to the service_role key from Supabase project settings, under API.`);
      else console.warn(message);
    }
    return supabaseWriter;
  };
}

export const leaderboardWriter = anonFallbackWriter('leaderboard scores', '0006');

// Play and article counters run SECURITY DEFINER functions that migration 0010 closes to the anon key
export const counterWriter = anonFallbackWriter('play and article counters', '0010');

export const SUPABASE_WRITES_OFF_REASON = readOnly
  ? 'Supabase is read-only (SUPABASE_READ_ONLY=true)'
  : 'Supabase is not configured';

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
