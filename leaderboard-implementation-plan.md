# Leaderboard Implementation Plan

This document outlines the detailed steps to implement the leaderboard feature for Memory Chess, based on the requirements specified in the PRD.

## Phase 1: Setup & Database Configuration

### 1.1 Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 1.2 Configure Environment Variables
Add the following to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 1.3 Create Supabase Client Utility
Create file `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 1.4 Create Database Table
Run the following SQL in Supabase SQL Editor:
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

## Phase 2: API Routes & Services

### 2.1 Create Leaderboard Types
Create file `src/types/leaderboard.ts`:
```typescript
export interface LeaderboardEntry {
  id: string;
  player_name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'grandmaster';
  piece_count: number;
  correct_pieces: number;
  memorize_time: number;
  solution_time: number;
  created_at: string;
}

export interface LeaderboardSubmission {
  player_name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'grandmaster';
  piece_count: number;
  correct_pieces: number;
  memorize_time: number;
  solution_time: number;
}
```

### 2.2 Create Leaderboard Service
Create file `src/lib/services/leaderboardService.ts`:
```typescript
import { supabase } from '@/lib/supabase';
import { LeaderboardEntry, LeaderboardSubmission } from '@/types/leaderboard';

export async function getLeaderboard(difficulty: string = 'medium'): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('*')
    .eq('difficulty', difficulty)
    .order('correct_pieces', { ascending: false })
    .order('memorize_time', { ascending: true })
    .order('solution_time', { ascending: true })
    .limit(200);
    
  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw new Error('Failed to fetch leaderboard data');
  }
  
  return data || [];
}

export async function submitLeaderboardEntry(entry: LeaderboardSubmission): Promise<LeaderboardEntry> {
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .insert(entry)
    .select()
    .single();
    
  if (error) {
    console.error('Error submitting to leaderboard:', error);
    throw new Error('Failed to submit leaderboard entry');
  }
  
  return data;
}

export async function checkLeaderboardRanking(
  difficulty: string,
  correctPieces: number,
  memorizeTime: number,
  solutionTime: number
): Promise<number> {
  const { count, error } = await supabase
    .from('leaderboard_entries')
    .select('*', { count: 'exact', head: true })
    .eq('difficulty', difficulty)
    .or(`correct_pieces.gt.${correctPieces}, and(correct_pieces.eq.${correctPieces},memorize_time.lt.${memorizeTime}), and(correct_pieces.eq.${correctPieces},memorize_time.eq.${memorizeTime},solution_time.lt.${solutionTime})`);
    
  if (error) {
    console.error('Error checking leaderboard ranking:', error);
    throw new Error('Failed to check leaderboard ranking');
  }
  
  // The rank is one position after all the entries that beat this one
  return (count || 0) + 1;
}
```

### 2.3 Create API Routes
Create file `src/app/api/leaderboard/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, submitLeaderboardEntry } from '@/lib/services/leaderboardService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const difficulty = searchParams.get('difficulty') || 'medium';
  
  // Validate difficulty
  if (!['easy', 'medium', 'hard', 'grandmaster'].includes(difficulty)) {
    return NextResponse.json(
      { error: 'Invalid difficulty level' },
      { status: 400 }
    );
  }
  
  try {
    const data = await getLeaderboard(difficulty);
    return NextResponse.json({ data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const { player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time } = body;
    
    if (!player_name || !difficulty || !piece_count || correct_pieces === undefined || 
        !memorize_time || !solution_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate difficulty
    if (!['easy', 'medium', 'hard', 'grandmaster'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }
    
    // Additional validation
    if (correct_pieces > piece_count || memorize_time <= 0 || solution_time <= 0) {
      return NextResponse.json(
        { error: 'Invalid data values' },
        { status: 400 }
      );
    }
    
    const data = await submitLeaderboardEntry({
      player_name,
      difficulty,
      piece_count,
      correct_pieces,
      memorize_time,
      solution_time,
    });
    
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

## Phase 3: UI Components

### 3.1 Create Time Formatting Utility (if not already exists)
Create or update `src/lib/utils/timeFormatting.ts`:
```typescript
export function formatTimeParts(seconds: number): { minutes: string; seconds: string; milliseconds: string } {
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (wholeSeconds % 60).toString().padStart(2, '0');
  const ms = Math.floor((seconds - wholeSeconds) * 1000).toString().padStart(3, '0');
  
  return {
    minutes,
    seconds: remainingSeconds,
    milliseconds: ms
  };
}

export function formatTimeDisplay(seconds: number): string {
  const { minutes, seconds: secs, milliseconds } = formatTimeParts(seconds);
  return `${minutes}:${secs}.${milliseconds.substring(0, 1)}`;
}
```

### 3.2 Create Leaderboard Table Component
Create file `src/components/leaderboard/LeaderboardTable.tsx` as shown in the mockup.

### 3.3 Create Leaderboard Page
Create file `src/app/leaderboard/page.tsx` as shown in the mockup.

### 3.4 Update Home Page with Leaderboard Button
Edit `src/app/page.tsx` to add the leaderboard button beside Start Training.

### 3.5 Create Shadcn/UI Table Component (if not already exists)
Run the following to install the required Shadcn/UI components:
```bash
npx shadcn-ui@latest add table tabs dialog label input
```

### 3.6 Create Submit Score Modal in GameResult Component
Update `src/components/game/GameResult.tsx` to add leaderboard submission functionality.

## Phase 4: Game Integration

### 4.1 Update GameStore
Update `src/stores/gameStore.ts` or `src/lib/store/gameStore.js` to include leaderboard eligibility check:
```typescript
// Add to existing GameStore
isEligibleForLeaderboard: () => {
  const state = get();
  // Only standard difficulties are eligible
  return ['easy', 'medium', 'hard', 'grandmaster'].includes(state.config.difficulty);
},

// Optional: Add function to prepare leaderboard entry data
prepareLeaderboardEntry: (playerName: string) => {
  const state = get();
  
  return {
    player_name: playerName,
    difficulty: state.config.difficulty,
    piece_count: state.pieceCount,
    correct_pieces: Math.round((state.accuracy || 0) * state.pieceCount / 100),
    memorize_time: state.actualMemorizeTime || state.memorizeTime,
    solution_time: state.completionTime || 0,
  };
}
```

### 4.2 Enhance GameResult Component
Add leaderboard submission functionality to `src/components/game/GameResult.tsx` as shown in the mockup.

## Phase 5: Testing & Refinement

### 5.1 Manual Testing Scenarios
- Verify leaderboard page loads correctly for all difficulty levels
- Test leaderboard submission flow after completing a game
- Test error handling for network issues
- Verify correct ranking algorithm implementation
- Test sorting with varied scores

### 5.2 Performance Checks
- Verify Supabase query performance with larger datasets
- Test loading states and animations

### 5.3 Browser Compatibility
- Test across major browsers (Chrome, Firefox, Safari)
- Test responsive design on mobile devices

## Phase 6: Deployment & Monitoring

### 6.1 Update Environment Variables
Ensure production environment variables are properly set for Supabase.

### 6.2 Add Analytics Tracking (Optional)
```typescript
// Add tracking for leaderboard views and submissions
trackEvent({
  action: 'view_leaderboard',
  category: 'engagement',
  label: difficulty,
});

trackEvent({
  action: 'submit_leaderboard',
  category: 'engagement',
  label: difficulty,
  value: correctPieces,
});
```

### 6.3 Monitoring
Add logging for important actions to track usage and potential issues.

## Timeline Estimation

| Phase | Tasks | Estimated Duration |
|-------|-------|-------------------|
| 1 | Setup & Database Configuration | 1 day |
| 2 | API Routes & Services | 1-2 days |
| 3 | UI Components | 2-3 days |
| 4 | Game Integration | 1 day |
| 5 | Testing & Refinement | 1-2 days |
| 6 | Deployment & Monitoring | 0.5 day |
| **Total** | | **6.5-9.5 days** |

## Dependencies & Prerequisites
- Supabase account and project setup
- Next.js knowledge and experience
- Shadcn/UI component library
- Existing game logic and state management 