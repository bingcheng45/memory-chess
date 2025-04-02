# Leaderboard UI Mockup

## Home Page Integration

```jsx
// Home page Leaderboard button addition
<div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
  <Link href="/game">
    <Button 
      variant="outline"
      size="sm"
      className="bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5 text-sm"
    >
      Start Training
    </Button>
  </Link>
  
  <Link href="/leaderboard">
    <Button 
      variant="outline"
      size="sm"
      className="bg-indigo-500/10 text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/20 px-3 py-1.5 text-sm"
    >
      Leaderboard
    </Button>
  </Link>
</div>
```

## Game Result Integration

```jsx
// GameResult component with Leaderboard button
<div className="flex flex-col space-y-3">
  <Button
    onClick={onTryAgain}
    variant="outline"
    className="w-full bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5"
  >
    Try Again
  </Button>
  
  <Button
    onClick={onNewGame}
    variant="secondary"
    size="lg"
    className="w-full border border-gray-600"
  >
    New Game
  </Button>
  
  <Link href="/leaderboard">
    <Button 
      variant="outline"
      className="w-full bg-indigo-500/10 text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/20 px-3 py-1.5"
    >
      View Leaderboard
    </Button>
  </Link>
</div>
```

## Leaderboard Page

### Main Page Layout

```jsx
// src/app/leaderboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import PageHeader from '@/components/ui/PageHeader';
import { supabase } from '@/lib/supabase';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('medium');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch leaderboard data based on active tab
  useEffect(() => {
    async function fetchLeaderboardData() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('leaderboard_entries')
          .select('*')
          .eq('difficulty', activeTab)
          .order('correct_pieces', { ascending: false })
          .order('memorize_time', { ascending: true })
          .order('solution_time', { ascending: true })
          .limit(200);
          
        if (error) throw error;
        setLeaderboardData(data || []);
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLeaderboardData();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <PageHeader />
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-8">
          <h1 className="text-3xl font-bold text-peach-400">Memory Chess Leaderboard</h1>
          
          <p className="max-w-2xl text-lg text-text-secondary text-center">
            See how your memory and visualization skills compare to other players!
          </p>
          
          <Tabs 
            defaultValue="medium" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full max-w-4xl"
          >
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="easy">Easy</TabsTrigger>
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="hard">Hard</TabsTrigger>
              <TabsTrigger value="grandmaster">Grandmaster</TabsTrigger>
            </TabsList>
            
            <TabsContent value="easy">
              <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} />
            </TabsContent>
            
            <TabsContent value="medium">
              <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} />
            </TabsContent>
            
            <TabsContent value="hard">
              <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} />
            </TabsContent>
            
            <TabsContent value="grandmaster">
              <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-center mt-8">
            <Link href="/">
              <Button variant="outline" className="border-gray-600 hover:bg-bg-light">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
```

### Leaderboard Table Component

```jsx
// src/components/leaderboard/LeaderboardTable.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTimeParts } from '@/lib/utils/timeFormatting';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  difficulty: string;
  piece_count: number;
  correct_pieces: number;
  memorize_time: number;
  solution_time: number;
  created_at: string;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

export default function LeaderboardTable({ data, isLoading, error }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-peach-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-4 text-text-secondary">Loading leaderboard data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8 border border-red-500/30 rounded-lg bg-red-500/10">
        <p className="text-red-400">Error loading leaderboard: {error}</p>
        <p className="mt-2 text-text-secondary">Please try again later</p>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center p-8 border border-bg-light rounded-lg bg-bg-card">
        <p className="text-xl text-text-secondary">No entries yet!</p>
        <p className="mt-2 text-text-muted">Be the first to make it on this leaderboard</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border border-bg-light overflow-hidden">
      <Table>
        <TableHeader className="bg-bg-card">
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-center">Pieces</TableHead>
            <TableHead className="text-center">Memorize Time</TableHead>
            <TableHead className="text-center">Solution Time</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry, index) => (
            <TableRow key={entry.id} className={index < 3 ? "bg-peach-500/5" : undefined}>
              <TableCell className="text-center font-bold">
                {index === 0 && <span className="text-yellow-400">🏆</span>}
                {index === 1 && <span className="text-gray-300">🥈</span>}
                {index === 2 && <span className="text-amber-700">🥉</span>}
                {index > 2 && index + 1}
              </TableCell>
              <TableCell className="font-medium">{entry.player_name}</TableCell>
              <TableCell className="text-center">
                {entry.correct_pieces}/{entry.piece_count}
              </TableCell>
              <TableCell className="text-center">
                {formatMemorizeTime(entry.memorize_time)}
              </TableCell>
              <TableCell className="text-center">
                {formatSolutionTime(entry.solution_time)}
              </TableCell>
              <TableCell className="text-right text-text-muted">
                {formatDate(entry.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Helper functions
function formatMemorizeTime(seconds: number): string {
  const { minutes, seconds: secs, milliseconds } = formatTimeParts(seconds);
  return `${minutes}:${secs}.${milliseconds.substring(0, 1)}`;
}

function formatSolutionTime(seconds: number): string {
  const { minutes, seconds: secs, milliseconds } = formatTimeParts(seconds);
  return `${minutes}:${secs}.${milliseconds.substring(0, 1)}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}
```

### Submit Score Flow

```jsx
// Add to GameResult.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';

// Inside GameResult component
const [showLeaderboardDialog, setShowLeaderboardDialog] = useState(false);
const [playerName, setPlayerName] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitError, setSubmitError] = useState<string | null>(null);
const [submitSuccess, setSubmitSuccess] = useState(false);

// Check if score is eligible for leaderboard
const isEligibleForLeaderboard = () => {
  // Only standard difficulties are eligible
  return ['easy', 'medium', 'hard', 'grandmaster'].includes(gameState.config.difficulty);
};

// Handle score submission
const submitToLeaderboard = async () => {
  if (!playerName.trim()) return;
  
  setIsSubmitting(true);
  setSubmitError(null);
  
  try {
    const { error } = await supabase
      .from('leaderboard_entries')
      .insert({
        player_name: playerName.trim(),
        difficulty: gameState.config.difficulty,
        piece_count: gameState.pieceCount,
        correct_pieces: Math.round((gameState.accuracy || 0) * gameState.pieceCount / 100),
        memorize_time: gameState.actualMemorizeTime || gameState.memorizeTime,
        solution_time: gameState.completionTime || 0,
      });
      
    if (error) throw error;
    setSubmitSuccess(true);
  } catch (err) {
    console.error('Error submitting to leaderboard:', err);
    setSubmitError(err.message);
  } finally {
    setIsSubmitting(false);
  }
};

// Add this to the button section of the component
{isEligibleForLeaderboard() && (
  <Button
    onClick={() => setShowLeaderboardDialog(true)}
    variant="outline"
    className="w-full bg-indigo-500/10 text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/20 px-3 py-1.5 mt-2"
  >
    Submit to Leaderboard
  </Button>
)}

<Link href="/leaderboard">
  <Button 
    variant="ghost"
    className="w-full text-text-secondary hover:text-text-primary mt-2"
  >
    View Leaderboard
  </Button>
</Link>

// Add dialog for name submission
<Dialog open={showLeaderboardDialog} onOpenChange={setShowLeaderboardDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{submitSuccess ? 'Score Submitted!' : 'Submit to Leaderboard'}</DialogTitle>
      <DialogDescription>
        {submitSuccess 
          ? 'Your score has been successfully submitted to the leaderboard.'
          : 'Enter your name to be displayed on the leaderboard.'}
      </DialogDescription>
    </DialogHeader>
    
    {!submitSuccess ? (
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="player-name">Player Name</Label>
          <Input
            id="player-name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            disabled={isSubmitting}
          />
        </div>
        
        {submitError && (
          <div className="text-sm text-red-500">
            Error: {submitError}
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowLeaderboardDialog(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={submitToLeaderboard}
            disabled={!playerName.trim() || isSubmitting}
            className="bg-peach-500 text-white hover:bg-peach-600"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </Button>
        </div>
      </div>
    ) : (
      <div className="space-y-4 py-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-500/20 p-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-green-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-text-primary">Thanks for participating, {playerName}!</p>
        </div>
        
        <div className="flex justify-center gap-2">
          <Link href="/leaderboard">
            <Button className="bg-indigo-500 text-white hover:bg-indigo-600">
              View Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
```

## API Routes

### GET /api/leaderboard

```typescript
// src/app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('difficulty', difficulty)
      .order('correct_pieces', { ascending: false })
      .order('memorize_time', { ascending: true })
      .order('solution_time', { ascending: true })
      .limit(200);
      
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

### POST /api/leaderboard

```typescript
// Add to src/app/api/leaderboard/route.ts
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
    
    // Insert entry
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .insert({
        player_name,
        difficulty,
        piece_count,
        correct_pieces,
        memorize_time,
        solution_time,
      })
      .select();
      
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to submit leaderboard entry' },
        { status: 500 }
      );
    }
    
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

## Visual Design

### Leaderboard Tabs

```
┌───────┬────────┬────────┬────────────┐
│ Easy  │ Medium │ Hard   │ Grandmaster│
└───────┴────────┴────────┴────────────┘
```

### Leaderboard Table

```
┌──────┬───────────┬─────────┬──────────────┬──────────────┬──────────┐
│ Rank │ Player    │ Pieces  │ Memorize Time│ Solution Time│ Date     │
├──────┼───────────┼─────────┼──────────────┼──────────────┼──────────┤
│ 🏆   │ ChessMstr │ 32/32   │ 00:15.2      │ 00:42.8      │ Apr 2    │
├──────┼───────────┼─────────┼──────────────┼──────────────┼──────────┤
│ 🥈   │ Visionary │ 30/32   │ 00:20.1      │ 00:37.5      │ Apr 1    │
├──────┼───────────┼─────────┼──────────────┼──────────────┼──────────┤
│ 🥉   │ MemoryPro │ 30/32   │ 00:22.3      │ 00:45.9      │ Mar 29   │
├──────┼───────────┼─────────┼──────────────┼──────────────┼──────────┤
│ 4    │ ChessLvr  │ 29/32   │ 00:18.7      │ 00:39.2      │ Mar 30   │
├──────┼───────────┼─────────┼──────────────┼──────────────┼──────────┤
│ 5    │ BoardMstr │ 28/32   │ 00:17.9      │ 00:41.3      │ Mar 28   │
└──────┴───────────┴─────────┴──────────────┴──────────────┴──────────┘
``` 