'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface GameStat {
  id: string;
  metric_name: string;
  metric_value: number;
  last_updated: string;
}

export default function GameStats() {
  const [stats, setStats] = useState<GameStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGameStats() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/game-stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch game statistics');
        }
        
        const data = await response.json();
        setStats(data.data || []);
      } catch (err) {
        console.error('Error fetching game stats:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchGameStats();
  }, []);

  // Helper function to get a stat value by name
  const getStatValue = (name: string) => {
    const stat = stats.find(s => s.metric_name === name);
    return stat?.metric_value || 0;
  };
  
  // Format a date string to a readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(date);
    } catch (_) {
      return 'Invalid date';
    }
  };
  
  // Get the last update time for any stat
  const getLastUpdateTime = () => {
    if (stats.length === 0) return 'Never';
    
    // Find the most recently updated stat
    const mostRecent = stats.reduce((latest, stat) => {
      if (!latest.last_updated) return stat;
      
      const latestDate = new Date(latest.last_updated);
      const statDate = new Date(stat.last_updated);
      
      return statDate > latestDate ? stat : latest;
    }, stats[0]);
    
    return formatDate(mostRecent.last_updated);
  };

  return (
    <Card className="w-full max-w-md bg-bg-card border border-bg-light">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-text-primary">Game Statistics</CardTitle>
        <CardDescription className="text-text-secondary">
          Last updated: {isLoading ? <Skeleton className="h-4 w-20 inline-block" /> : getLastUpdateTime()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-md bg-red-500/10 p-4 text-red-500">
            <p>Error loading statistics: {error}</p>
          </div>
        ) : isLoading ? (
          <>
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-6 w-16" />
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Total Plays:</span>
              <span className="text-lg font-bold text-text-primary">{getStatValue('total_plays')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Completed Games:</span>
              <span className="text-lg font-bold text-text-primary">{getStatValue('total_completed_games')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Total Correct Pieces:</span>
              <span className="text-lg font-bold text-text-primary">{getStatValue('total_correct_pieces')}</span>
            </div>
            
            {/* Display all other metrics */}
            {stats
              .filter(stat => !['total_plays', 'total_completed_games', 'total_correct_pieces'].includes(stat.metric_name))
              .map(stat => (
                <div key={stat.id} className="flex justify-between items-center">
                  <span className="text-text-secondary">
                    {stat.metric_name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                  </span>
                  <span className="text-lg font-bold text-text-primary">{stat.metric_value}</span>
                </div>
              ))
            }
          </>
        )}
      </CardContent>
    </Card>
  );
} 