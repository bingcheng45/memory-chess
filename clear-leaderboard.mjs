// Leaderboard Database Clear Script
// This script deletes all entries from the leaderboard

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

console.log('Reading environment variables from .env.local...');

// Read environment variables from .env.local
let supabaseUrl, supabaseAnonKey;
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim();
    }
  }
} catch (err) {
  console.error('Error reading .env.local file:', err);
}

// Validate Supabase credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

console.log('Supabase credentials found. Initializing client...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearLeaderboard() {
  console.log('Starting leaderboard database clear process...');

  try {
    // 1. Test the connection
    console.log('Testing Supabase connection...');
    const { error: testError } = await supabase
      .from('leaderboard_entries')
      .select('count', { count: 'exact', head: true })
      .limit(1);

    if (testError) {
      throw new Error(`Supabase connection test failed: ${testError.message}`);
    }
    console.log('Supabase connection successful!');

    // 2. Count current entries
    const { count, error: countError } = await supabase
      .from('leaderboard_entries')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    console.log(`Found ${count} entries in the leaderboard`);

    if (count === 0) {
      console.log('Leaderboard is already empty. Nothing to clear.');
      return;
    }

    // 3. Confirm deletion
    console.log('\n⚠️  WARNING: This will delete ALL entries from the leaderboard!');
    console.log('⚠️  This action cannot be undone!\n');
    
    // Wait for 5 seconds to give the user a chance to abort
    console.log('Proceeding in 5 seconds... (Press Ctrl+C to abort)');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Delete all entries
    console.log('Deleting all leaderboard entries...');
    
    const { error: deleteError } = await supabase
      .from('leaderboard_entries')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000'); // This matches all UUIDs
    
    if (deleteError) {
      throw deleteError;
    }
    
    // 5. Verify deletion
    const { count: remainingCount, error: verifyError } = await supabase
      .from('leaderboard_entries')
      .select('*', { count: 'exact', head: true });
      
    if (verifyError) {
      throw verifyError;
    }
    
    if (remainingCount > 0) {
      console.warn(`Warning: There are still ${remainingCount} entries in the leaderboard after deletion.`);
    } else {
      console.log('✅ Leaderboard cleared successfully! All entries have been deleted.');
    }
    
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
  }
}

// Run the clear function
clearLeaderboard().catch(console.error); 