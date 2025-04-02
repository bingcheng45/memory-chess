const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample player names
const playerNames = [
  'ChessMaster', 'MemoryKing', 'QueenGambit', 'PawnStar', 'KnightRider',
  'BishopMove', 'RookiePro', 'CheckMate99', 'CastleKing', 'PieceCrusher',
  'TacticalMind', 'VisualGenius', 'BoardWizard', 'MemoryChamp', 'GrandVision',
  'MindMapper', 'PatternMaster', 'BlunderStop', 'FlashMemory', 'ChessNinja'
];

// Generate random score within range
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Generate realistic scores based on difficulty
function generateScore(difficulty) {
  let pieceCount, correctPiecesMin, correctPiecesMax, memorizeTimeMin, memorizeTimeMax, solutionTimeMin, solutionTimeMax;
  
  switch(difficulty) {
    case 'easy':
      pieceCount = 6;
      correctPiecesMin = 3;
      correctPiecesMax = 6;
      memorizeTimeMin = 5000;
      memorizeTimeMax = 20000;
      solutionTimeMin = 3000;
      solutionTimeMax = 15000;
      break;
    case 'medium':
      pieceCount = 10;
      correctPiecesMin = 5;
      correctPiecesMax = 10;
      memorizeTimeMin = 10000;
      memorizeTimeMax = 30000;
      solutionTimeMin = 5000;
      solutionTimeMax = 25000;
      break;
    case 'hard':
      pieceCount = 16;
      correctPiecesMin = 8;
      correctPiecesMax = 16;
      memorizeTimeMin = 20000;
      memorizeTimeMax = 45000;
      solutionTimeMin = 10000;
      solutionTimeMax = 40000;
      break;
    case 'grandmaster':
      pieceCount = 24;
      correctPiecesMin = 10;
      correctPiecesMax = 24;
      memorizeTimeMin = 30000;
      memorizeTimeMax = 60000;
      solutionTimeMin = 15000;
      solutionTimeMax = 60000;
      break;
  }

  // Better players tend to have higher correct pieces and lower times
  const correctPieces = randomBetween(correctPiecesMin, correctPiecesMax);
  
  // Skill factor - higher for better players (more correct pieces)
  const skillFactor = correctPieces / pieceCount;
  
  // Better players memorize and solve faster
  const memorizeTime = Math.round(
    randomBetween(memorizeTimeMin, memorizeTimeMax) * (1 - skillFactor * 0.5)
  );
  const solutionTime = Math.round(
    randomBetween(solutionTimeMin, solutionTimeMax) * (1 - skillFactor * 0.5)
  );
  
  return {
    piece_count: pieceCount,
    correct_pieces: correctPieces,
    memorize_time: memorizeTime,
    solution_time: solutionTime
  };
}

// Create entries for each difficulty level
async function populateLeaderboard() {
  const difficulties = ['easy', 'medium', 'hard', 'grandmaster'];
  const entriesPerDifficulty = 25; // 25 entries per difficulty = 100 total
  const entries = [];
  
  console.log('Preparing leaderboard entries...');
  
  // Generate entries
  difficulties.forEach(difficulty => {
    for (let i = 0; i < entriesPerDifficulty; i++) {
      const playerName = playerNames[Math.floor(Math.random() * playerNames.length)];
      const score = generateScore(difficulty);
      
      entries.push({
        player_name: `${playerName}${randomBetween(1, 999)}`,
        difficulty,
        piece_count: score.piece_count,
        correct_pieces: score.correct_pieces,
        memorize_time: score.memorize_time,
        solution_time: score.solution_time
      });
    }
  });
  
  console.log(`Generated ${entries.length} sample entries`);
  
  // Insert in batches to avoid rate limits
  const batchSize = 20;
  const batches = Math.ceil(entries.length / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, entries.length);
    const batch = entries.slice(start, end);
    
    console.log(`Inserting batch ${i+1}/${batches} (${batch.length} entries)...`);
    
    const { error } = await supabase
      .from('leaderboard_entries')
      .insert(batch);
      
    if (error) {
      console.error('Error inserting batch:', error);
    } else {
      console.log(`✅ Successfully inserted batch ${i+1}`);
    }
    
    // Brief pause between batches
    if (i < batches - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log('Leaderboard population complete!');
}

// Run the population script
populateLeaderboard()
  .catch(err => console.error('Error populating leaderboard:', err)); 