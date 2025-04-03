// Leaderboard Database Cleanup Script
// This script normalizes time formats and removes test/invalid entries

import 'dotenv/config'; 
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanLeaderboard() {
  console.log('Starting leaderboard database cleanup...');

  try {
    // 1. Fetch all leaderboard entries
    const { data: entries, error } = await supabase
      .from('leaderboard_entries')
      .select('*');

    if (error) {
      throw error;
    }

    console.log(`Found ${entries.length} entries in the leaderboard`);

    // 2. Identify problematic entries
    const problematicEntries = entries.filter(entry => {
      // Check for very low scores or test entries
      const isTestEntry = 
        entry.player_name.toLowerCase().includes('test') || 
        entry.player_name.toLowerCase().includes('pokemon') ||
        entry.correct_pieces === 0;
      
      // Check for unrealistic times (too short or too long)
      const hasUnrealisticTime = 
        entry.memorize_time < 0.1 || 
        entry.solution_time < 0.1 ||
        entry.memorize_time > 600 || // 10 minutes max
        entry.solution_time > 600;   // 10 minutes max
      
      return isTestEntry || hasUnrealisticTime;
    });

    console.log(`Found ${problematicEntries.length} problematic entries to clean up`);

    // 3. Delete identified problematic entries
    if (problematicEntries.length > 0) {
      console.log('Removing problematic entries...');
      
      for (const entry of problematicEntries) {
        console.log(`Removing entry: ${entry.id} (${entry.player_name}, ${entry.correct_pieces}/${entry.piece_count})`);
        
        const { error: deleteError } = await supabase
          .from('leaderboard_entries')
          .delete()
          .eq('id', entry.id);
        
        if (deleteError) {
          console.error(`Error deleting entry ${entry.id}:`, deleteError);
        }
      }
      
      console.log('Problematic entries removed successfully');
    }

    // 4. Normalize time formats for remaining entries
    console.log('Normalizing time formats for remaining entries...');
    
    const { data: remainingEntries, error: fetchError } = await supabase
      .from('leaderboard_entries')
      .select('*');
      
    if (fetchError) {
      throw fetchError;
    }
    
    // Ensure all time values are properly stored as milliseconds
    for (const entry of remainingEntries) {
      // Skip entries with already valid time formats
      if (Number.isInteger(entry.memorize_time) && Number.isInteger(entry.solution_time)) {
        continue;
      }
      
      // Normalize the time values if needed
      const updatedEntry = {
        ...entry,
        memorize_time: typeof entry.memorize_time === 'string' 
          ? parseFloat(entry.memorize_time) 
          : entry.memorize_time,
        solution_time: typeof entry.solution_time === 'string' 
          ? parseFloat(entry.solution_time) 
          : entry.solution_time,
      };
      
      // Update the entry if changes were made
      if (updatedEntry.memorize_time !== entry.memorize_time || 
          updatedEntry.solution_time !== entry.solution_time) {
        console.log(`Normalizing time formats for entry: ${entry.id} (${entry.player_name})`);
        
        const { error: updateError } = await supabase
          .from('leaderboard_entries')
          .update({
            memorize_time: updatedEntry.memorize_time,
            solution_time: updatedEntry.solution_time
          })
          .eq('id', entry.id);
        
        if (updateError) {
          console.error(`Error updating entry ${entry.id}:`, updateError);
        }
      }
    }

    console.log('Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error cleaning leaderboard:', error);
  }
}

// Run the cleanup function
cleanLeaderboard().catch(console.error);
