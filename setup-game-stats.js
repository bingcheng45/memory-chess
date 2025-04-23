const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function setupGameStats() {
  console.log('🎮 SETTING UP GAME STATS');
  console.log('========================');
  
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
    // Step 1: Try to query the table directly to check if it exists
    console.log('\nChecking if game_stats table exists...');
    
    const { error: queryError } = await supabase
      .from('game_stats')
      .select('count', { count: 'exact', head: true });
      
    const tableExists = !queryError || queryError.code !== 'PGRST301';

    if (queryError && queryError.code === 'PGRST301') {
      console.log('✅ Table does not exist. Creating...');
    } else if (!queryError) {
      console.log('✅ Table exists.');
    } else {
      console.error('❌ Unexpected error checking if table exists:', queryError);
      console.log('Continuing with table creation attempt anyway...');
    }
    
    // Step 2: Create the table if it doesn't exist
    if (!tableExists) {
      console.log('\nCreating game_stats table...');
      
      // Using raw SQL directly with the Supabase REST API
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          command: `
            CREATE TABLE IF NOT EXISTS game_stats (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              metric_name TEXT NOT NULL UNIQUE,
              metric_value BIGINT NOT NULL DEFAULT 0,
              last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_game_stats_metric_name ON game_stats (metric_name);
          `
        })
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error('❌ Error creating table:', errorData);
        console.log('Attempting to use the Tables API directly...');
        
        // Try SQL via Supabase SQL endpoint
        const sqlRes = await fetch(`${supabaseUrl}/rest/v1/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS game_stats (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                metric_name TEXT NOT NULL UNIQUE,
                metric_value BIGINT NOT NULL DEFAULT 0,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              
              CREATE INDEX IF NOT EXISTS idx_game_stats_metric_name ON game_stats (metric_name);
            `
          })
        });
        
        if (!sqlRes.ok) {
          const sqlErrorData = await sqlRes.text();
          console.error('❌ Error creating table via SQL endpoint:', sqlErrorData);
          console.log('\n⚠️ Please run the following SQL in the Supabase SQL editor:');
          console.log(`
CREATE TABLE IF NOT EXISTS game_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL UNIQUE,
  metric_value BIGINT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_stats_metric_name ON game_stats (metric_name);

-- Initialize default metrics
INSERT INTO game_stats (metric_name, metric_value) VALUES
  ('total_plays', 0),
  ('total_completed_games', 0),
  ('total_correct_pieces', 0)
ON CONFLICT (metric_name) DO NOTHING;

-- Create increment function
CREATE OR REPLACE FUNCTION increment_metric(p_metric_name TEXT, p_increment BIGINT DEFAULT 1)
RETURNS BIGINT AS $$
DECLARE
  v_new_value BIGINT;
BEGIN
  -- Insert the metric if it doesn't exist, otherwise update it
  INSERT INTO game_stats (metric_name, metric_value, last_updated)
  VALUES (p_metric_name, p_increment, NOW())
  ON CONFLICT (metric_name) 
  DO UPDATE SET 
    metric_value = game_stats.metric_value + p_increment,
    last_updated = NOW()
  RETURNING metric_value INTO v_new_value;
  
  RETURN v_new_value;
END;
$$ LANGUAGE plpgsql;
          `);
          return;
        }
      }
      
      console.log('✅ Table created successfully!');
    }
    
    // Step 3: Initialize default metrics if they don't exist
    console.log('\nInitializing default metrics...');
    
    const defaultMetrics = [
      { metric_name: 'total_plays', metric_value: 0 },
      { metric_name: 'total_completed_games', metric_value: 0 },
      { metric_name: 'total_correct_pieces', metric_value: 0 }
    ];
    
    // Insert with "on conflict do nothing" strategy
    const { error: insertError } = await supabase
      .from('game_stats')
      .upsert(defaultMetrics, { onConflict: 'metric_name', ignoreDuplicates: true });
      
    if (insertError) {
      console.error('❌ Error inserting default metrics:', insertError);
      return;
    }
      
    console.log(`✅ Default metrics initialized!`);
    
    // Step 4: Create the increment function - we'll need to use raw SQL
    console.log('\nSetting up the increment_metric function...');
    
    const functionSQL = `
    CREATE OR REPLACE FUNCTION increment_metric(p_metric_name TEXT, p_increment BIGINT DEFAULT 1)
    RETURNS BIGINT AS $$
    DECLARE
      v_new_value BIGINT;
    BEGIN
      -- Insert the metric if it doesn't exist, otherwise update it
      INSERT INTO game_stats (metric_name, metric_value, last_updated)
      VALUES (p_metric_name, p_increment, NOW())
      ON CONFLICT (metric_name) 
      DO UPDATE SET 
        metric_value = game_stats.metric_value + p_increment,
        last_updated = NOW()
      RETURNING metric_value INTO v_new_value;
      
      RETURN v_new_value;
    END;
    $$ LANGUAGE plpgsql;`;
    
    // Use the SQL endpoint
    const functionRes = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        query: functionSQL
      })
    });
    
    if (!functionRes.ok) {
      const functionErrorData = await functionRes.text();
      console.error('❌ Error creating increment_metric function:', functionErrorData);
      console.log('This error might be expected if you don\'t have function creation privileges.');
      console.log('The application will try to use regular updates as a fallback.');
    } else {
      console.log('✅ Function created/updated successfully!');
    }
    
    // Step 5: Display current metrics
    console.log('\nAttempting to retrieve current metrics...');
    const { data: currentMetrics, error: currentError } = await supabase
      .from('game_stats')
      .select('metric_name, metric_value, last_updated')
      .order('metric_name');
      
    if (currentError) {
      console.error('❌ Error fetching current metrics:', currentError);
    } else {
      console.log('\nCurrent Game Stats Metrics:');
      
      if (currentMetrics.length === 0) {
        console.log('No metrics found. The table might be empty or you may not have access permissions.');
      } else {
        console.table(currentMetrics);
      }
      
      console.log('\n✅ Game stats setup completed successfully!');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the function
setupGameStats(); 