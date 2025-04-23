const fetch = require('node-fetch');

async function testFrontendDisplay() {
  console.log('🎮 TESTING FRONTEND DISPLAY');
  console.log('==========================');
  
  try {
    // Fetch game stats data - similar to what the GameStats component does
    console.log('\nFetching game stats...');
    
    const response = await fetch('http://localhost:3000/api/game-stats');
    
    if (!response.ok) {
      console.log('❌ API request failed. Make sure your development server is running.');
      console.log('Here\'s what the GameStats component would display in this case:');
      
      console.log(`
========================================
|           Game Statistics           |
|--------------------------------------|
| Last updated: Never                  |
|                                      |
| Total Plays: 0                       |
========================================
      `);
      
      return;
    }
    
    const { data } = await response.json();
    
    console.log('✅ Successfully fetched game stats data:');
    console.log(data);
    
    // Find the total_plays metric
    const totalPlays = data.find(stat => stat.metric_name === 'total_plays');
    const totalPlaysValue = totalPlays ? totalPlays.metric_value : 0;
    
    // Format last updated time
    let lastUpdated = 'Never';
    
    if (data.length > 0) {
      // Find the most recently updated stat
      const mostRecent = data.reduce((latest, stat) => {
        if (!latest.last_updated) return stat;
        
        const latestDate = new Date(latest.last_updated);
        const statDate = new Date(stat.last_updated);
        
        return statDate > latestDate ? stat : latest;
      }, data[0]);
      
      if (mostRecent && mostRecent.last_updated) {
        const date = new Date(mostRecent.last_updated);
        lastUpdated = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }).format(date);
      }
    }
    
    // Simulate what the user would see in the GameStats component
    console.log('\nHere\'s what the GameStats component would display:');
    
    console.log(`
========================================
|           Game Statistics           |
|--------------------------------------|
| Last updated: ${lastUpdated}                  
|                                      |
| Total Plays: ${totalPlaysValue}                       |
========================================
    `);
    
    console.log('\nTo see this in your actual application:');
    console.log('1. Make sure your Next.js development server is running');
    console.log('2. Visit http://localhost:3000 and check the Game Statistics card on the home page');
    
  } catch (err) {
    console.log('Note: Test skipped because the API endpoint is not available.');
    console.log('Make sure your Next.js development server is running at http://localhost:3000');
  }
}

// Run the function
testFrontendDisplay(); 