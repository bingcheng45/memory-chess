import { NextResponse } from "next/server";
import { isCrawler } from "@/i18n/countryLocale";
import { ARTICLE_SLUGS } from "@/lib/articles/registry";
import { parseArticleEvent, type ArticleEvent } from "@/lib/articles/stats";
import {
  recordArticleEvent,
  type RecordArticleEventResult,
} from "@/lib/services/articleStatsService";

const MAX_BODY_BYTES = 64;
const JSON_MEDIA_TYPE = "application/json";

const ERRORS = {
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

function isJson(contentType: string | null): boolean {
  return contentType?.split(";")[0].trim().toLowerCase() === JSON_MEDIA_TYPE;
}

async function readBodyWithinLimit(request: Request): Promise<string | null> {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return null;
  if (request.body === null) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();

    received += value.byteLength;
    if (received > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
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

function respond(result: RecordArticleEventResult): NextResponse {
  switch (result.status) {
    case "recorded": {
      const { views, likes } = result.counts;
      return NextResponse.json({ views, likes });
    }
    case "unavailable":
      console.error("Article stats unavailable:", result.cause);
      return errorResponse("unavailable");
    case "failed":
      console.error("Article stats write failed:", result.cause);
      return errorResponse("failed");
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    if (!ARTICLE_SLUGS.includes(slug)) return errorResponse("unknownArticle");

    // Without a preflight another site can only POST text/plain or a form type, so this stops it spending its visitors' browsers on likes.
    if (!isJson(request.headers.get("content-type"))) return errorResponse("notJson");

    const body = await readBodyWithinLimit(request);
    if (body === null) return errorResponse("bodyTooLarge");

    const event = parseEvent(body);
    if (event === null) return errorResponse("invalidBody");

    if (isViewFromLikelyCrawler(event, request.headers.get("user-agent"))) {
      return new NextResponse(null, { status: 204 });
    }

    return respond(await recordArticleEvent(slug, event));
  } catch (cause) {
    console.error("Article stats request failed:", cause);
    return errorResponse("failed");
  }
}
