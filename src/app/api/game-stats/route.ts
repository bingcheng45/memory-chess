import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllGameMetrics, 
  getGameMetric, 
  incrementGameMetric 
} from '@/lib/services/gameStatsService';

/**
 * GET /api/game-stats - Retrieve all game metrics
 * GET /api/game-stats?metric=total_plays - Retrieve a specific metric
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const metricName = searchParams.get('metric');
  
  try {
    if (metricName) {
      // Get a specific metric
      const { data, error } = await getGameMetric(metricName);
      
      if (error) {
        return NextResponse.json(
          { error },
          { status: 500 }
        );
      }
      
      if (!data) {
        return NextResponse.json(
          { error: `Metric '${metricName}' not found` },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ data });
    } else {
      // Get all metrics
      const { data, error } = await getAllGameMetrics();
      
      if (error) {
        return NextResponse.json(
          { error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ data });
    }
  } catch (err) {
    console.error('Unexpected error in game-stats GET route:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/game-stats - Increment a metric
 * Body: { metric: "total_plays", increment: 1 }
 */
export async function POST(request: NextRequest) {
  try {
    const { metric, increment = 1 } = await request.json();
    
    if (!metric) {
      return NextResponse.json(
        { error: 'Missing required field: metric' },
        { status: 400 }
      );
    }
    
    const { success, newValue, error } = await incrementGameMetric(metric, increment);
    
    if (!success) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        metric,
        value: newValue 
      } 
    });
  } catch (err) {
    console.error('Unexpected error in game-stats POST route:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 