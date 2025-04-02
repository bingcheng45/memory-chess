# Memory Chess Leaderboard Feature - PRD

## Overview
This document outlines the requirements for implementing a leaderboard feature in the Memory Chess application. The leaderboard will display top-performing players across different difficulty levels, providing an element of competition and motivation for users.

## Goals
- Create a competitive aspect to the game that motivates users to improve
- Provide visibility into high scores across different difficulty levels
- Recognize and showcase players with exceptional memory chess skills
- Create a sense of community among players

## User Stories
1. As a player, I want to see how my performance compares to other players so I can gauge my skill level
2. As a player, I want to see different leaderboards for each difficulty level so I can track my progress across all levels
3. As a player, I want to easily access the leaderboard from the home page and after completing a game
4. As a player, I want to see detailed metrics about top players so I can understand what makes a good performance
5. As a player, I want to add my name to the leaderboard when I achieve a high score

## Feature Requirements

### Access Points
1. Home page - Add a "Leaderboard" button next to the "Start Training" button
2. Game result screen - Add a "View Leaderboard" button below the "New Game" button

### Leaderboard Categories
The leaderboard will be segmented into four difficulty levels:
- Easy
- Medium
- Hard
- Grandmaster

### Leaderboard Display
Each leaderboard will show:
1. Player Rank (position)
2. Player Name
3. Number of Pieces Correctly Placed
4. Memorization Time (in seconds)
5. Solution Time (in seconds)
6. Date Achieved

### Ranking Algorithm
Players will be ranked based on the following criteria (in order of priority):
1. Number of pieces correctly placed (higher is better)
2. Memorization time (lower is better)
3. Solution time (lower is better)

### Data Storage
- All leaderboard data will be stored in Supabase
- Each leaderboard entry will contain:
  - Player name (string)
  - Difficulty level (string: "easy", "medium", "hard", "grandmaster")
  - Number of pieces (number)
  - Number of correct pieces (number)
  - Memorization time (number, seconds)
  - Solution time (number, seconds)
  - Date/time (timestamp)

### Eligibility
- Only standard games are eligible for the leaderboard
- Custom piece categories or timing settings are not eligible
- Each difficulty level has its own separate leaderboard with 200 entries maximum

## Technical Implementation

### Database Schema
```sql
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_name TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'grandmaster')),
  piece_count INTEGER NOT NULL,
  correct_pieces INTEGER NOT NULL,
  memorize_time DECIMAL(10, 3) NOT NULL,
  solution_time DECIMAL(10, 3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional constraints
  CHECK (correct_pieces <= piece_count),
  CHECK (memorize_time > 0),
  CHECK (solution_time > 0)
);

-- Index for quick leaderboard retrieval
CREATE INDEX idx_leaderboard_ranking ON leaderboard_entries (
  difficulty,
  correct_pieces DESC,
  memorize_time ASC,
  solution_time ASC
);
```

### Supabase Integration
1. Install Supabase client:
   ```
   npm install @supabase/supabase-js
   ```

2. Create a Supabase client utility file:
   ```typescript
   // src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

3. Add environment variables to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### API Endpoints
Create the following API routes:

1. `GET /api/leaderboard` - Get leaderboard entries by difficulty
2. `POST /api/leaderboard` - Submit a new leaderboard entry

### UI Components
1. `LeaderboardButton` - For navigation to the leaderboard
2. `LeaderboardPage` - Main page showing all leaderboards
3. `LeaderboardTabs` - Tabs for switching between difficulty levels
4. `LeaderboardTable` - Table component for displaying entries
5. `LeaderboardEntryForm` - Form for submitting player name when achieving a high score

## User Flow

### Viewing the Leaderboard
1. User clicks on "Leaderboard" from the home page or "View Leaderboard" from the game result screen
2. The leaderboard page loads, defaulting to the "Medium" difficulty tab
3. User can switch between difficulty tabs to view different leaderboards
4. Each leaderboard shows the top 200 entries (or fewer if not enough entries exist)

### Submitting a Score
1. User completes a game with standard settings (not custom)
2. System checks if the score is eligible for the leaderboard
3. If eligible, user is prompted to enter their name
4. Score is submitted to the leaderboard with the player's name
5. User is shown their position on the leaderboard

## Phases of Implementation

### Phase 1: Setup
- Install Supabase and configure environment
- Create database schema
- Set up API endpoints

### Phase 2: UI Development
- Create leaderboard page and components
- Add navigation buttons to home page and result screen
- Implement difficulty tabs and leaderboard table

### Phase 3: Integration
- Connect UI to API endpoints
- Implement score submission logic
- Add eligibility checks to game result flow

### Phase 4: Testing and Polish
- Test leaderboard functionality across all difficulty levels
- Optimize queries for performance
- Add animations and polish to UI

## Future Enhancements
- Add weekly/monthly/all-time leaderboard filters
- Implement user profiles with history of submissions
- Add social sharing functionality for high scores
- Create achievements based on leaderboard performance

## Metrics for Success
- Number of leaderboard submissions
- Repeated visits to the leaderboard page
- Increase in game plays after leaderboard implementation
- User retention after implementing the feature 