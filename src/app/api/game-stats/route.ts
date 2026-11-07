import { NextRequest, NextResponse } from 'next/server';
import { 
  DATABASE_CONNECTION_ISSUE,
  getAllGameMetrics, 
  getGameMetric, 
  incrementGameMetric 
} from '@/lib/services/gameStatsService';
import { clientAddress, fixedWindowLimiter } from '@/lib/server/rateLimit';
import { isJson, readBodyWithinLimit } from '@/lib/server/requestBody';
import { reportServerError, type ServerErrorKind } from '@/lib/server/serverErrors';

const COUNTED_METRIC = 'total_plays';
const READ_FAILED = 'Game stats are unavailable';
const COUNT_FAILED = 'The play could not be counted';

const MAX_BODY_BYTES = 128;

/** A round takes seconds and counts once; this many from one address in a minute is a script inflating total_plays. */
const COUNTS_PER_WINDOW = 30;
const allowCount = fixedWindowLimiter({ limit: COUNTS_PER_WINDOW, windowMs: 60_000, maxKeys: 5_000 });

const kindOf = (error: string | undefined): ServerErrorKind =>
  error?.startsWith(DATABASE_CONNECTION_ISSUE) ? 'unavailable' : 'failed';

const hasSupabaseConfig =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const METRIC_CACHE = 'public, s-maxage=60, stale-while-revalidate=600';

/**
 * GET /api/game-stats - Retrieve all game metrics
 * GET /api/game-stats?metric=total_plays - Retrieve a specific metric
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const metricName = searchParams.get('metric');
  
  try {
    if (!hasSupabaseConfig && process.env.NODE_ENV === 'development' && metricName) {
      const productionResponse = await fetch(
        `https://thememorychess.com/api/game-stats?metric=${encodeURIComponent(metricName)}`,
        { cache: 'no-store' }
      );

      if (productionResponse.ok) {
        return NextResponse.json(await productionResponse.json());
      }
    }

    if (metricName) {
      // Get a specific metric
      const { data, error } = await getGameMetric(metricName);
      
      if (error) {
        reportServerError('GET /api/game-stats', kindOf(error), error);
        return NextResponse.json(
          { error: READ_FAILED },
          { status: 500 }
        );
      }
      
      if (!data) {
        return NextResponse.json(
          { error: `Metric '${metricName}' not found` },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ data }, { headers: { 'Cache-Control': METRIC_CACHE } });
    } else {
      // Get all metrics
      const { data, error } = await getAllGameMetrics();
      
      if (error) {
        reportServerError('GET /api/game-stats', kindOf(error), error);
        return NextResponse.json(
          { error: READ_FAILED },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ data });
    }
  } catch (err) {
    console.error('Unexpected error in game-stats GET route:', err);
    reportServerError('GET /api/game-stats', 'unexpected', err);
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
  const verdict = allowCount(clientAddress(request.headers), Date.now());
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(verdict.retryAfterSeconds) } }
    );
  }

  if (!isJson(request.headers.get('content-type'))) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
  }

  const text = await readBodyWithinLimit(request, MAX_BODY_BYTES);
  if (text === null) {
    return NextResponse.json({ error: 'Request body is too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  try {
    const { metric, increment = 1 } = (body ?? {}) as { metric?: unknown; increment?: unknown };
    
    if (!metric) {
      return NextResponse.json(
        { error: 'Missing required field: metric' },
        { status: 400 }
      );
    }
    if (metric !== COUNTED_METRIC) {
      return NextResponse.json({ error: 'Unknown metric' }, { status: 400 });
    }
    if (increment !== 1) {
      return NextResponse.json({ error: 'The increment must be 1' }, { status: 400 });
    }
    
    const { success, newValue, error } = await incrementGameMetric(metric, increment);
    
    if (!success) {
      reportServerError('POST /api/game-stats', kindOf(error), error);
      return NextResponse.json(
        { error: COUNT_FAILED },
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
    reportServerError('POST /api/game-stats', 'unexpected', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
