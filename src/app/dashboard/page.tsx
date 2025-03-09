'use client';

import { useGameStore } from '@/lib/store/gameStore';
import PerformanceMetrics from '@/components/dashboard/PerformanceMetrics';
import LearningRecommendations from '@/components/dashboard/LearningRecommendations';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { history } = useGameStore();
  
  // If no game history, show onboarding
  if (history.length === 0) {
    return (
      <div className="container mx-auto max-w-5xl py-8">
        <Card className="border-bg-light bg-bg-dark">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-text-primary">Welcome to Memory Chess</CardTitle>
            <CardDescription className="text-text-secondary">
              Start playing games to see your performance metrics and get personalized recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-6 py-8">
            <div className="rounded-full bg-peach-500/10 p-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-peach-500"
              >
                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
              </svg>
            </div>
            <p className="max-w-md text-center text-text-secondary">
              Memory Chess helps you improve your memory and visualization skills through chess-based exercises.
              Play your first game to start tracking your progress!
            </p>
            <a 
              href="/game" 
              className="rounded-lg bg-peach-500 px-6 py-3 font-medium text-bg-dark transition-all hover:bg-peach-400"
            >
              Play Your First Game
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-5xl py-8">
      <h1 className="mb-6 text-3xl font-bold text-text-primary">Your Dashboard</h1>
      
      <Tabs defaultValue="performance">
        <TabsList className="mb-6 grid w-full grid-cols-3 bg-bg-dark">
          <TabsTrigger value="performance" className="data-[state=active]:bg-peach-500 data-[state=active]:text-bg-dark">
            Performance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-peach-500 data-[state=active]:text-bg-dark">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="learning" className="data-[state=active]:bg-peach-500 data-[state=active]:text-bg-dark">
            Learning
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="mt-0">
          <Card className="border-bg-light bg-bg-dark">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-text-primary">Performance Metrics</CardTitle>
              <CardDescription className="text-text-secondary">
                Track your progress and see how your memory skills are improving over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceMetrics />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-0">
          <Card className="border-bg-light bg-bg-dark">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-text-primary">Advanced Analytics</CardTitle>
              <CardDescription className="text-text-secondary">
                Dive deeper into your performance data with detailed analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="learning" className="mt-0">
          <Card className="border-bg-light bg-bg-dark">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-text-primary">Learning & Recommendations</CardTitle>
              <CardDescription className="text-text-secondary">
                Personalized challenges and recommendations based on your performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LearningRecommendations />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 