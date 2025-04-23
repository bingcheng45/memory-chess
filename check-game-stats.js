const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkGameStats() {
  console.log('🎮 CHECKING GAME STATS');
  console.log('======================');
  
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Please check your .env.local file.');
    return;
  }
  
  // Create client
  console.log('\nCreating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Step 1: Check the game_stats table
    console.log('\nChecking game_stats table...');
    
    const { data: gameStats, error: gameStatsError } = await supabase
      .from('game_stats')
      .select('*');
      
    if (gameStatsError) {
      console.error('❌ Error fetching game stats:', gameStatsError);
      return;
    }
    
    if (!gameStats || gameStats.length === 0) {
      console.log('❌ No game stats found. The table might be empty.');
      
      // Try to initialize the total_plays metric
      console.log('Attempting to initialize total_plays...');
      
      const { error: insertError } = await supabase
        .from('game_stats')
        .insert({ metric_name: 'total_plays', metric_value: 0 });
        
      if (insertError) {
        console.error('❌ Error initializing total_plays:', insertError);
      } else {
        console.log('✅ Initialized total_plays to 0');
      }
    } else {
      console.log('\nCurrent Game Stats:');
      console.table(gameStats);
      
      // Check if total_plays exists
      const totalPlays = gameStats.find(stat => stat.metric_name === 'total_plays');
      
      if (!totalPlays) {
        console.log('❌ total_plays metric not found. Attempting to create it...');
        
        const { error: insertError } = await supabase
          .from('game_stats')
          .insert({ metric_name: 'total_plays', metric_value: 0 });
          
        if (insertError) {
          console.error('❌ Error creating total_plays:', insertError);
        } else {
          console.log('✅ Created total_plays with value 0');
        }
      } else {
        console.log(`✅ total_plays metric found with value: ${totalPlays.metric_value}`);
      }
    }
    
    // Step 2: Test the increment_metric function
    console.log('\nTesting increment_metric function...');
    
    console.log('Attempting to increment total_plays by 1...');
    
    try {
      const { data: newValue, error: rpcError } = await supabase
        .rpc('increment_metric', {
          p_metric_name: 'total_plays',
          p_increment: 1
        });
        
      if (rpcError) {
        console.error('❌ Error incrementing metric via RPC:', rpcError);
        console.log('Trying fallback method...');
        
        // Fallback: get current value and update
        const { data: currentData } = await supabase
          .from('game_stats')
          .select('metric_value')
          .eq('metric_name', 'total_plays')
          .single();
          
        const currentValue = currentData?.metric_value || 0;
        
        const { data: updateData, error: updateError } = await supabase
          .from('game_stats')
          .update({ 
            metric_value: currentValue + 1,
            last_updated: new Date().toISOString()
          })
          .eq('metric_name', 'total_plays')
          .select()
          .single();
          
        if (updateError) {
          console.error('❌ Error incrementing via update:', updateError);
        } else {
          console.log(`✅ Incremented total_plays to ${updateData.metric_value} via update method`);
        }
      } else {
        console.log(`✅ Successfully incremented total_plays to ${newValue} via RPC function`);
      }
    } catch (err) {
      console.error('❌ Unexpected error testing increment function:', err);
    }
    
    // Step 3: Get the updated stats
    console.log('\nFetching updated game stats...');
    
    const { data: updatedStats, error: updatedError } = await supabase
      .from('game_stats')
      .select('*')
      .order('metric_name');
      
    if (updatedError) {
      console.error('❌ Error fetching updated stats:', updatedError);
    } else {
      console.log('\nUpdated Game Stats:');
      console.table(updatedStats);
    }
    
    // Step 4: Test the API endpoint if available
    console.log('\nTesting API endpoint...');
    
    try {
      // Test GET endpoint
      console.log('Testing GET /api/game-stats...');
      const getResponse = await fetch('http://localhost:3000/api/game-stats');
      
      if (!getResponse.ok) {
        console.log('❌ GET request failed. Make sure your development server is running.');
      } else {
        const getData = await getResponse.json();
        console.log('✅ GET request successful:');
        console.log(getData);
      }
      
      // Test POST endpoint
      console.log('\nTesting POST /api/game-stats (incrementing total_plays)...');
      const postResponse = await fetch('http://localhost:3000/api/game-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: 'total_plays',
          increment: 1
        })
      });
      
      if (!postResponse.ok) {
        console.log('❌ POST request failed. Make sure your development server is running.');
      } else {
        const postData = await postResponse.json();
        console.log('✅ POST request successful:');
        console.log(postData);
      }
    } catch (err) {
      console.log('Note: API testing skipped. Start your Next.js development server to test the API endpoints.');
    }
    
    console.log('\n✅ Game stats check completed!');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the function
checkGameStats(); 