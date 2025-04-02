const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 TESTING SUPABASE CONNECTION');
  console.log('===============================');
  
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log(`\nConnection Details:`);
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Project ID: ${supabaseUrl?.split('.')[0]?.split('//')[1]}`);
  
  // Create client
  console.log('\nCreating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test basic connection
  try {
    console.log('\nTesting basic connection...');
    const { data, error } = await supabase.from('leaderboard_entries').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ CONNECTION ERROR:', error.message);
      console.error('Error details:', error);
      
      if (error.code === 'PGRST301') {
        console.log('\n✅ SOLUTION: The table "leaderboard_entries" does not exist');
        console.log('Create the table with the following columns:');
        console.log('- id (uuid, primary key)');
        console.log('- player_name (text)');
        console.log('- difficulty (text)');
        console.log('- piece_count (integer)');
        console.log('- correct_pieces (integer)');
        console.log('- memorize_time (integer)');
        console.log('- solution_time (integer)');
        console.log('- created_at (timestamp with time zone)');
      }
      
      if (error.code === '42501') {
        console.log('\n✅ SOLUTION: Permission denied. Enable Row Level Security with appropriate policies');
        console.log('Create a policy allowing anonymous SELECT access:');
        console.log('1. Go to Authentication > Policies');
        console.log('2. Add a policy for "leaderboard_entries" table');
        console.log('3. Allow SELECT for anon role');
      }
    } else {
      console.log('✅ CONNECTION SUCCESSFUL!');
      console.log(`Table exists with ${data.count} entries`);
    }
  } catch (err) {
    console.error('❌ UNEXPECTED ERROR:', err.message);
    console.error(err);
  }
  
  // Test table list
  try {
    console.log('\nListing available tables...');
    const { data, error } = await supabase.from('_tables').select('*');
    
    if (error) {
      console.error('❌ Cannot list tables:', error.message);
    } else {
      console.log('Available tables:');
      if (data && data.length > 0) {
        data.forEach(table => console.log(`- ${table.name}`));
      } else {
        console.log('No tables found or no permission to view tables');
      }
    }
  } catch (err) {
    console.log('Note: Listing tables operation not supported or permission denied');
  }
}

// Run the test
testSupabaseConnection(); 