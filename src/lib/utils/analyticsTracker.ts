import { GameHistory } from '@/lib/types/game';

// Define analytics event types
export enum AnalyticsEventType {
  GAME_START = 'game_start',
  GAME_COMPLETE = 'game_complete',
  MEMORIZATION_PHASE = 'memorization_phase',
  SOLUTION_PHASE = 'solution_phase',
  DAILY_CHALLENGE_START = 'daily_challenge_start',
  DAILY_CHALLENGE_COMPLETE = 'daily_challenge_complete',
  RECOMMENDATION_CLICK = 'recommendation_click',
  SETTINGS_CHANGE = 'settings_change',
  FEATURE_USAGE = 'feature_usage',
  ERROR = 'error'
}

// Define analytics event data structure
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  userId?: string;
  sessionId: string;
  data: Record<string, unknown>;
}

// Define performance metrics structure
export interface PerformanceMetrics {
  accuracy: number;
  completionTime: number;
  pieceCount: number;
  memorizeTime: number;
  skillRating: number;
  skillRatingChange: number;
}

// Analytics tracker class
class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId: string | null = null;
  private isEnabled: boolean = true;
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private flushIntervalId: NodeJS.Timeout | null = null;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeFlushInterval();
    
    // Try to load user ID from localStorage
    if (typeof window !== 'undefined') {
      this.userId = localStorage.getItem('memory_chess_user_id');
      
      // If no user ID exists, create one
      if (!this.userId) {
        this.userId = this.generateUserId();
        localStorage.setItem('memory_chess_user_id', this.userId);
      }
    }
  }
  
  // Generate a unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  // Generate a unique user ID
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  // Initialize the flush interval
  private initializeFlushInterval(): void {
    if (typeof window !== 'undefined' && !this.flushIntervalId) {
      this.flushIntervalId = setInterval(() => {
        this.flush();
      }, this.flushInterval);
    }
  }
  
  // Clear the flush interval
  private clearFlushInterval(): void {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
      this.flushIntervalId = null;
    }
  }
  
  // Enable analytics tracking
  public enable(): void {
    this.isEnabled = true;
    this.initializeFlushInterval();
  }
  
  // Disable analytics tracking
  public disable(): void {
    this.isEnabled = false;
    this.clearFlushInterval();
  }
  
  // Track an analytics event
  public track(type: AnalyticsEventType, data: Record<string, unknown> = {}): void {
    if (!this.isEnabled) return;
    
    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      data
    };
    
    this.events.push(event);
    
    // If we've reached the batch size, flush the events
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
    
    // Log the event to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }
  
  // Track game start
  public trackGameStart(pieceCount: number, memorizeTime: number, isDailyChallenge: boolean = false): void {
    this.track(AnalyticsEventType.GAME_START, {
      pieceCount,
      memorizeTime,
      isDailyChallenge
    });
    
    if (isDailyChallenge) {
      this.track(AnalyticsEventType.DAILY_CHALLENGE_START, {
        pieceCount,
        memorizeTime
      });
    }
  }
  
  // Track game completion
  public trackGameComplete(gameHistory: GameHistory, skillRatingChange: number): void {
    this.track(AnalyticsEventType.GAME_COMPLETE, {
      pieceCount: gameHistory.pieceCount,
      memorizeTime: gameHistory.memorizeTime,
      accuracy: gameHistory.accuracy,
      duration: gameHistory.duration,
      level: gameHistory.level,
      skillRatingChange
    });
  }
  
  // Track daily challenge completion
  public trackDailyChallengeComplete(gameHistory: GameHistory, skillRatingChange: number): void {
    this.track(AnalyticsEventType.DAILY_CHALLENGE_COMPLETE, {
      pieceCount: gameHistory.pieceCount,
      memorizeTime: gameHistory.memorizeTime,
      accuracy: gameHistory.accuracy,
      duration: gameHistory.duration,
      skillRatingChange
    });
  }
  
  // Track recommendation click
  public trackRecommendationClick(recommendationType: string, pieceCount?: number, memorizeTime?: number): void {
    this.track(AnalyticsEventType.RECOMMENDATION_CLICK, {
      recommendationType,
      pieceCount,
      memorizeTime
    });
  }
  
  // Track settings change
  public trackSettingsChange(setting: string, value: unknown): void {
    this.track(AnalyticsEventType.SETTINGS_CHANGE, {
      setting,
      value
    });
  }
  
  // Track feature usage
  public trackFeatureUsage(feature: string, action: string, value?: unknown): void {
    this.track(AnalyticsEventType.FEATURE_USAGE, {
      feature,
      action,
      value
    });
  }
  
  // Track error
  public trackError(error: Error, context?: Record<string, unknown>): void {
    this.track(AnalyticsEventType.ERROR, {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context
    });
  }
  
  // Flush events to the server
  public async flush(): Promise<void> {
    if (this.events.length === 0) return;
    
    const eventsToSend = [...this.events];
    this.events = [];
    
    try {
      // In a real implementation, this would send the events to a server
      // For now, we'll just log them to the console
      if (process.env.NODE_ENV === 'development') {
        console.log('Flushing analytics events:', eventsToSend);
      }
      
      // Mock API call
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ events: eventsToSend })
      // });
    } catch (error) {
      // If the API call fails, add the events back to the queue
      this.events = [...eventsToSend, ...this.events];
      console.error('Failed to flush analytics events:', error);
    }
  }
}

// Create a singleton instance
export const analyticsTracker = new AnalyticsTracker();

// Export a hook for React components
export function useAnalytics() {
  return analyticsTracker;
} 