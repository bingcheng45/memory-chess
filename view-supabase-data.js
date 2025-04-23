const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function viewSupabaseData() {
  console.log('🔍 VIEWING SUPABASE DATA');
  console.log('=======================');
  
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Please check your .env.local file.');
    return;
  }
  
  console.log(`\nConnection Details:`);
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Project ID: ${supabaseUrl?.split('.')[0]?.split('//')[1]}`);
  
  // Create client
  console.log('\nCreating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test connection
  try {
    console.log('\nTesting connection...');
    const { error: countError } = await supabase
      .from('leaderboard_entries')
      .select('*', { head: true });
    
    if (countError) {
      if (countError.code === 'PGRST301') {
        console.error('❌ The table "leaderboard_entries" does not exist.');
      } else {
        console.error('❌ CONNECTION ERROR:', countError.message);
      }
      return;
    }
    
    console.log('✅ CONNECTION SUCCESSFUL!');
    
    // List tables (if possible)
    try {
      console.log('\nAttempting to list available tables...');
      // Using a safer approach since .rpc('get_tables') may not be available
      const { error: tablesError } = await supabase
        .from('pg_tables')
        .select('*');
      
      if (tablesError) {
        console.log('Note: Unable to automatically list tables. This is normal if your role doesn\'t have system table access.\n');
      } 
    } catch (_) {
      console.log('Note: Listing tables requires special permissions. Continuing...\n');
    }
    
    // View leaderboard_entries data
    console.log('\nFetching leaderboard_entries data...');
    const { data: entries, error: entriesError } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .limit(10);
    
    if (entriesError) {
      console.error('❌ Error fetching data:', entriesError.message);
      return;
    }
    
    console.log(`\nFound ${entries.length} entries (showing first 10):`);
    if (entries.length > 0) {
      console.table(entries);
      
      // Count by difficulty - without using count
      console.log('\nCounting entries by difficulty:');
      const difficulties = ['easy', 'medium', 'hard', 'grandmaster'];
      
      for (const difficulty of difficulties) {
        const { data: diffData, error: diffError } = await supabase
          .from('leaderboard_entries')
          .select('*')
          .eq('difficulty', difficulty);
        
        if (!diffError) {
          console.log(`- ${difficulty}: ${diffData?.length || 0} entries`);
        }
      }
    } else {
      console.log('No data found in the leaderboard_entries table.');
    }
  } catch (err) {
    console.error('❌ UNEXPECTED ERROR:', err.message);
  }
}

// Run the function
viewSupabaseData(); 