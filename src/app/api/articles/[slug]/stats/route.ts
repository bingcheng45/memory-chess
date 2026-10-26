import { NextResponse } from "next/server";
import { isCrawler } from "@/i18n/countryLocale";
import { ARTICLE_SLUGS } from "@/lib/articles/registry";
import { parseArticleEvent, type ArticleEvent } from "@/lib/articles/stats";
import {
  recordArticleEvent,
  type RecordArticleEventResult,
} from "@/lib/services/articleStatsService";
import { clientAddress, fixedWindowLimiter } from "@/lib/server/rateLimit";
import { isJson, readBodyWithinLimit } from "@/lib/server/requestBody";
import { reportServerError } from "@/lib/server/serverErrors";

const MAX_BODY_BYTES = 64;

/** A reader sends one view and a few like toggles per article, so this many from one address for one article in a minute is a script. */
const EVENTS_PER_WINDOW = 10;
const allowEvent = fixedWindowLimiter({ limit: EVENTS_PER_WINDOW, windowMs: 60_000, maxKeys: 5_000 });

const ERRORS = {
  tooManyEvents: { status: 429, error: "Too many requests" },
  unknownArticle: { status: 404, error: "Unknown article" },
  notJson: { status: 400, error: "Content-Type must be application/json" },
  bodyTooLarge: { status: 400, error: "Request body is too large" },
  invalidBody: { status: 400, error: "Invalid request body" },
  unavailable: { status: 503, error: "Article stats are unavailable" },
  failed: { status: 500, error: "Failed to record the article event" },
} as const;

type RouteContext = { params: Promise<{ slug: string }> };

function errorResponse(kind: keyof typeof ERRORS): NextResponse {
  const { status, error } = ERRORS[kind];
  return NextResponse.json({ error }, { status });
}

function parseEvent(body: string): ArticleEvent | null {
  try {
    return parseArticleEvent(JSON.parse(body));
  } catch {
    return null;
  }
}

function isViewFromLikelyCrawler(event: ArticleEvent, userAgent: string | null): boolean {
  return event === "view" && isCrawler(userAgent);
}

function respond(slug: string, result: RecordArticleEventResult): NextResponse {
  switch (result.status) {
    case "recorded": {
      const { views, likes } = result.counts;
      return NextResponse.json({ views, likes });
    }
    case "unavailable":
      console.error("Article stats unavailable:", result.cause);
      reportServerError("POST /api/articles/stats", "unavailable", result.cause, { slug });
      return errorResponse("unavailable");
    case "failed":
      console.error("Article stats write failed:", result.cause);
      reportServerError("POST /api/articles/stats", "failed", result.cause, { slug });
      return errorResponse("failed");
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    if (!ARTICLE_SLUGS.includes(slug)) return errorResponse("unknownArticle");

    const verdict = allowEvent(`${clientAddress(request.headers)}:${slug}`, Date.now());
    if (!verdict.allowed) {
      const { status, error } = ERRORS.tooManyEvents;
      return NextResponse.json({ error }, { status, headers: { "Retry-After": String(verdict.retryAfterSeconds) } });
    }

    // Without a preflight another site can only POST text/plain or a form type, so this stops it spending its visitors' browsers on likes.
    if (!isJson(request.headers.get("content-type"))) return errorResponse("notJson");

    const body = await readBodyWithinLimit(request, MAX_BODY_BYTES);
    if (body === null) return errorResponse("bodyTooLarge");

    const event = parseEvent(body);
    if (event === null) return errorResponse("invalidBody");

    if (isViewFromLikelyCrawler(event, request.headers.get("user-agent"))) {
      return new NextResponse(null, { status: 204 });
    }

    return respond(slug, await recordArticleEvent(slug, event));
  } catch (cause) {
    console.error("Article stats request failed:", cause);
    reportServerError("POST /api/articles/stats", "unexpected", cause);
    return errorResponse("failed");
  }
}
