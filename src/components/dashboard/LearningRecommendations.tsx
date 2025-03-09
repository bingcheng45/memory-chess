'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { 
  generateDailyChallenge, 
  identifyWeakAreas, 
  generateLearningRecommendations 
} from '@/lib/utils/learningUtils';
import { 
  DailyChallenge, 
  LearningRecommendation, 
  RecommendationType, 
  WeakArea 
} from '@/lib/types/game';
import Link from 'next/link';

export default function LearningRecommendations() {
  const { history, getSkillRating } = useGameStore();
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Generate daily challenge and recommendations
    const skillRating = getSkillRating();
    const identifiedWeakAreas = identifyWeakAreas(history);
    const challenge = generateDailyChallenge(skillRating, history);
    const learningRecommendations = generateLearningRecommendations(
      skillRating,
      history,
      identifiedWeakAreas
    );
    
    setDailyChallenge(challenge);
    setWeakAreas(identifiedWeakAreas);
    setRecommendations(learningRecommendations);
    setLoading(false);
  }, [history, getSkillRating]);
  
  if (loading) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-peach-500 border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Daily Challenge */}
      {dailyChallenge && (
        <div className="rounded-lg border border-peach-500/30 bg-bg-dark p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-text-primary">Daily Challenge</h3>
            <span className="rounded-full bg-peach-500/20 px-3 py-1 text-sm font-medium text-peach-500">
              {dailyChallenge.difficulty}
            </span>
          </div>
          
          <p className="mb-4 text-text-secondary">{dailyChallenge.description}</p>
          
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-bg-card p-3">
              <div className="text-sm text-text-muted">Pieces</div>
              <div className="text-lg font-bold text-text-primary">{dailyChallenge.pieceCount}</div>
            </div>
            
            <div className="rounded-lg bg-bg-card p-3">
              <div className="text-sm text-text-muted">Time</div>
              <div className="text-lg font-bold text-text-primary">{dailyChallenge.memorizeTime}s</div>
            </div>
          </div>
          
          <Link
            href={{
              pathname: '/game',
              query: { 
                challenge: dailyChallenge.id,
                pieceCount: dailyChallenge.pieceCount,
                memorizeTime: dailyChallenge.memorizeTime
              }
            }}
            className="block w-full rounded-lg bg-peach-500 px-4 py-2 text-center font-medium text-bg-dark transition-all hover:bg-peach-400"
          >
            {dailyChallenge.completed ? 'Try Again' : 'Start Challenge'}
          </Link>
          
          {dailyChallenge.completed && (
            <div className="mt-2 text-center text-sm text-text-secondary">
              You've completed today's challenge with {dailyChallenge.accuracy}% accuracy
            </div>
          )}
        </div>
      )}
      
      {/* Personalized Recommendations */}
      <div className="rounded-lg border border-bg-light bg-bg-dark p-6">
        <h3 className="mb-4 text-xl font-bold text-text-primary">Personalized Recommendations</h3>
        
        {recommendations.length === 0 ? (
          <p className="text-text-secondary">
            Play more games to get personalized recommendations
          </p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="rounded-lg bg-bg-card p-4">
                <div className="mb-2 flex items-center">
                  {recommendation.type === RecommendationType.DAILY_CHALLENGE && (
                    <span className="mr-2 text-xl">🏆</span>
                  )}
                  {recommendation.type === RecommendationType.FOCUSED_PRACTICE && (
                    <span className="mr-2 text-xl">🎯</span>
                  )}
                  {recommendation.type === RecommendationType.SKILL_IMPROVEMENT && (
                    <span className="mr-2 text-xl">📈</span>
                  )}
                  {recommendation.type === RecommendationType.DIFFICULTY_ADJUSTMENT && (
                    <span className="mr-2 text-xl">⚙️</span>
                  )}
                  <h4 className="font-medium text-text-primary">
                    {recommendation.type === RecommendationType.DAILY_CHALLENGE && 'Daily Challenge'}
                    {recommendation.type === RecommendationType.FOCUSED_PRACTICE && 'Focused Practice'}
                    {recommendation.type === RecommendationType.SKILL_IMPROVEMENT && 'Skill Improvement'}
                    {recommendation.type === RecommendationType.DIFFICULTY_ADJUSTMENT && 'Difficulty Adjustment'}
                  </h4>
                </div>
                
                <p className="mb-3 text-sm text-text-secondary">{recommendation.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {recommendation.pieceCount && (
                    <span className="rounded-full bg-bg-dark px-3 py-1 text-xs text-text-secondary">
                      {recommendation.pieceCount} pieces
                    </span>
                  )}
                  
                  {recommendation.memorizeTime && (
                    <span className="rounded-full bg-bg-dark px-3 py-1 text-xs text-text-secondary">
                      {recommendation.memorizeTime}s memorize time
                    </span>
                  )}
                  
                  {recommendation.difficulty && (
                    <span className="rounded-full bg-bg-dark px-3 py-1 text-xs text-text-secondary">
                      {recommendation.difficulty} difficulty
                    </span>
                  )}
                </div>
                
                <Link
                  href={{
                    pathname: '/game',
                    query: { 
                      pieceCount: recommendation.pieceCount || dailyChallenge?.pieceCount || 8,
                      memorizeTime: recommendation.memorizeTime || dailyChallenge?.memorizeTime || 10
                    }
                  }}
                  className="mt-3 inline-block rounded-lg bg-peach-500/20 px-4 py-1 text-sm font-medium text-peach-500 transition-all hover:bg-peach-500/30"
                >
                  Try This
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <div className="rounded-lg border border-bg-light bg-bg-dark p-6">
          <h3 className="mb-4 text-xl font-bold text-text-primary">Areas to Improve</h3>
          
          <div className="space-y-4">
            {weakAreas.map((weakArea, index) => (
              <div key={index} className="rounded-lg bg-bg-card p-4">
                <h4 className="mb-2 font-medium text-text-primary">
                  {weakArea.type === 'pieceCount' && 'Piece Count'}
                  {weakArea.type === 'memorizeTime' && 'Memorization Time'}
                  {weakArea.type === 'pieceType' && 'Piece Types'}
                  {weakArea.type === 'boardRegion' && 'Board Regions'}
                </h4>
                
                <div className="mb-2 flex items-center">
                  <div className="mr-2 h-2 w-full rounded-full bg-bg-dark">
                    <div 
                      className={`h-full rounded-full ${
                        weakArea.score >= 70 ? 'bg-green-500' :
                        weakArea.score >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${weakArea.score}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-text-secondary">
                    {weakArea.score}%
                  </span>
                </div>
                
                <p className="text-sm text-text-secondary">
                  {weakArea.type === 'pieceCount' && `You struggle with positions containing ${weakArea.score < 50 ? 'many' : 'few'} pieces.`}
                  {weakArea.type === 'memorizeTime' && `You struggle with ${weakArea.score < 50 ? 'short' : 'long'} memorization times.`}
                  {weakArea.type === 'pieceType' && "You struggle with certain piece types."}
                  {weakArea.type === 'boardRegion' && "You struggle with certain regions of the board."}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 