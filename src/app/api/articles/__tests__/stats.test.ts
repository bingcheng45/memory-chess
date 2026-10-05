/** @jest-environment node */

import { POST } from "@/app/api/articles/[slug]/stats/route";
import { ARTICLE_EVENTS, type ArticleCounts } from "@/lib/articles/stats";
import { recordArticleEvent } from "@/lib/services/articleStatsService";

jest.mock("@/lib/services/articleStatsService", () => ({
  recordArticleEvent: jest.fn(),
}));

const SLUG = "magnus-carlsen";
const JSON_HEADERS = { "content-type": "application/json" };
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const DUCKDUCKGO_BROWSER =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile DuckDuckGo/5 Safari/537.36";
const CUBOT_PHONE =
  "Mozilla/5.0 (Linux; Android 11; CUBOT NOTE 20 PRO Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36";
const MARKER = "zz-marker-zz";
const CHUNK_BYTES = 16;
const BODY_LIMIT_BYTES = 64;
const COUNTS: ArticleCounts = { views: 12, likes: 3 };
const UNAVAILABLE_COPY = "Article stats are unavailable";
const FAILED_COPY = "Failed to record the article event";

type PostOptions = {
  slug?: string;
  headers?: Record<string, string>;
  body?: BodyInit;
};

function post({ slug = SLUG, headers = JSON_HEADERS, body = '{"event":"view"}' }: PostOptions = {}) {
  const init: RequestInit & { duplex: "half" } = { method: "POST", headers, body, duplex: "half" };
  const request = new Request(`http://localhost/api/articles/${encodeURIComponent(slug)}/stats`, init);
  return POST(request, { params: Promise.resolve({ slug }) });
}

function endlessBody() {
  const counters = { pulls: 0, isCancelled: false };
  const stream = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        counters.pulls += 1;
        controller.enqueue(new Uint8Array(CHUNK_BYTES).fill(0x20));
      },
      cancel() {
        counters.isCancelled = true;
      },
    },
    { highWaterMark: 0 },
  );
  return { stream, counters };
}

async function expectError(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ error: expect.any(String) });
}

async function expectFixedCopy(response: Response, status: number, copy: string, causeMessage: string) {
  const body = await response.text();

  expect(response.status).toBe(status);
  expect(JSON.parse(body)).toEqual({ error: copy });
  expect(body).not.toContain(causeMessage);
}

describe("POST /api/articles/[slug]/stats", () => {
  let logged: jest.SpyInstance;

  beforeEach(() => {
    jest.mocked(recordArticleEvent).mockReset().mockResolvedValue({ status: "recorded", counts: COUNTS });
    logged = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logged.mockRestore();
  });

  it.each(ARTICLE_EVENTS)("records a %s and answers the counts", async (event) => {
    const response = await post({ body: JSON.stringify({ event }) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(COUNTS);
    expect(recordArticleEvent).toHaveBeenCalledTimes(1);
    expect(recordArticleEvent).toHaveBeenCalledWith(SLUG, event);
  });

  it("answers the two counts and nothing else the service handed back", async () => {
    const countsWithMore = { ...COUNTS, slug: SLUG, updated_at: "2026-10-03T00:00:00.000Z" };
    jest.mocked(recordArticleEvent).mockResolvedValue({ status: "recorded", counts: countsWithMore });

    const response = await post();

    expect(await response.json()).toEqual(COUNTS);
  });

  it("accepts a content type that carries a charset", async () => {
    const response = await post({ headers: { "content-type": "Application/JSON; charset=utf-8" } });

    expect(response.status).toBe(200);
  });

  it("ignores every body field but the event", async () => {
    const response = await post({ body: '{"event":"like","slug":"judit-polgar","views":9999}' });

    expect(response.status).toBe(200);
    expect(recordArticleEvent).toHaveBeenCalledWith(SLUG, "like");
    expect(jest.mocked(recordArticleEvent).mock.calls[0]).toHaveLength(2);
  });

  it("answers 404 for a slug outside the registry, before anything else", async () => {
    const response = await post({ slug: "not-an-article", headers: { ...JSON_HEADERS, "user-agent": GOOGLEBOT } });

    await expectError(response, 404);
    expect(recordArticleEvent).not.toHaveBeenCalled();
  });

  it("answers a crawler's view 204 with no body and records nothing", async () => {
    const response = await post({ headers: { ...JSON_HEADERS, "user-agent": GOOGLEBOT } });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(recordArticleEvent).not.toHaveBeenCalled();
  });

  it.each([
    ["a like", "the DuckDuckGo browser", "like", DUCKDUCKGO_BROWSER],
    ["an unlike", "the DuckDuckGo browser", "unlike", DUCKDUCKGO_BROWSER],
    ["a like", "a phone whose model name holds bot", "like", CUBOT_PHONE],
    ["a like", "Googlebot", "like", GOOGLEBOT],
    ["an unlike", "Googlebot", "unlike", GOOGLEBOT],
  ])("records %s from %s, an agent the crawler pattern matches", async (_what, _who, event, agent) => {
    const response = await post({
      headers: { ...JSON_HEADERS, "user-agent": agent },
      body: JSON.stringify({ event }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(COUNTS);
    expect(recordArticleEvent).toHaveBeenCalledTimes(1);
    expect(recordArticleEvent).toHaveBeenCalledWith(SLUG, event);
  });

  it("answers a crawler 400, not 204, for a view sent as text/plain", async () => {
    const response = await post({ headers: { "content-type": "text/plain", "user-agent": GOOGLEBOT } });

    await expectError(response, 400);
    expect(recordArticleEvent).not.toHaveBeenCalled();
  });

  it("answers a crawler 400, not 204, for a body that names no event", async () => {
    const response = await post({ headers: { ...JSON_HEADERS, "user-agent": GOOGLEBOT }, body: '{"event":"share"}' });

    await expectError(response, 400);
    expect(recordArticleEvent).not.toHaveBeenCalled();
  });

  it.each([
    ["text/plain", { "content-type": "text/plain" }],
    ["a form", { "content-type": "application/x-www-form-urlencoded" }],
    ["text/plain with a json parameter", { "content-type": "text/plain; application/json" }],
    ["no content type", {}],
  ])("answers 400 for %s", async (_label, headers) => {
    const { stream, counters } = endlessBody();

    const response = await post({ headers, body: stream });

    await expectError(response, 400);
    expect(counters.pulls).toBe(0);
    expect(recordArticleEvent).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid JSON", '{"event":'],
    ["an empty body", ""],
    ["an unknown event", '{"event":"share"}'],
    ["a missing event", '{"kind":"view"}'],
    ["an array body", '["view"]'],
    ["a string body", '"view"'],
    ["a null body", "null"],
  ])("answers 400 for %s", async (_label, body) => {
    const response = await post({ body });

    await expectError(response, 400);
    expect(recordArticleEvent).not.toHaveBeenCalled();
  });

  it("answers 400 from content-length alone, without reading the body", async () => {
    const { stream, counters } = endlessBody();

    const response = await post({
      headers: { ...JSON_HEADERS, "content-length": String(BODY_LIMIT_BYTES + 1) },
      body: stream,
    });

    await expectError(response, 400);
    expect(counters.pulls).toBe(0);
    expect(recordArticleEvent).not.toHaveBeenCalled();
  });

  it.each([
    ["a content-length that lies", { ...JSON_HEADERS, "content-length": "16" }],
    ["no content-length", JSON_HEADERS],
  ])("stops reading an oversized body with %s as soon as the limit is passed", async (_label, headers) => {
    const { stream, counters } = endlessBody();

    const response = await post({ headers, body: stream });

    await expectError(response, 400);
    expect(counters.pulls).toBeLessThanOrEqual(BODY_LIMIT_BYTES / CHUNK_BYTES + 2);
    expect(counters.isCancelled).toBe(true);
    expect(recordArticleEvent).not.toHaveBeenCalled();
  });

  it("accepts a body of exactly the limit", async () => {
    const event = '{"event":"view"}';
    const body = event + " ".repeat(BODY_LIMIT_BYTES - event.length);

    const response = await post({ body });

    expect(response.status).toBe(200);
  });

  it("answers 400 for a body one byte over the limit", async () => {
    const event = '{"event":"view"}';
    const body = event + " ".repeat(BODY_LIMIT_BYTES - event.length + 1);

    const response = await post({ body });

    await expectError(response, 400);
    expect(recordArticleEvent).not.toHaveBeenCalled();
  });

  it("answers 503 with fixed copy, and only logs the cause, when the store is unavailable", async () => {
    const cause = "Supabase is not configured";
    jest.mocked(recordArticleEvent).mockResolvedValue({ status: "unavailable", cause });

    const response = await post();

    await expectFixedCopy(response, 503, UNAVAILABLE_COPY, cause);
    expect(logged).toHaveBeenCalledWith(expect.any(String), cause);
  });

  it("answers 500 with fixed copy, and only logs the cause, when the write fails", async () => {
    const cause = { code: "42883", message: "function does not exist" };
    jest.mocked(recordArticleEvent).mockResolvedValue({ status: "failed", cause });

    const response = await post();

    await expectFixedCopy(response, 500, FAILED_COPY, cause.message);
    expect(logged).toHaveBeenCalledWith(expect.any(String), cause);
  });

  it("answers 500 with the same fixed copy when the service throws", async () => {
    const cause = new Error("supabase unreachable");
    jest.mocked(recordArticleEvent).mockRejectedValue(cause);

    const response = await post();

    await expectFixedCopy(response, 500, FAILED_COPY, cause.message);
    expect(logged).toHaveBeenCalledWith(expect.any(String), cause);
  });

  it("never echoes the slug, the body or a header back, in a response or a log line", async () => {
    const failing = () =>
      jest.mocked(recordArticleEvent).mockResolvedValueOnce({ status: "failed", cause: "write failed" });
    const unavailable = () =>
      jest.mocked(recordArticleEvent).mockResolvedValueOnce({ status: "unavailable", cause: "no client" });
    const markedHeaders = { ...JSON_HEADERS, "user-agent": MARKER, "x-note": MARKER, referer: `http://${MARKER}/` };
    const attempts: Array<{ status: number; arrange?: () => void; options: PostOptions }> = [
      { status: 404, options: { slug: MARKER } },
      { status: 400, options: { headers: { "content-type": MARKER } } },
      { status: 400, options: { headers: markedHeaders, body: `{"event":"${MARKER}"}` } },
      { status: 400, options: { headers: markedHeaders, body: `${MARKER} is not json` } },
      { status: 400, options: { headers: markedHeaders, body: MARKER.repeat(BODY_LIMIT_BYTES) } },
      { status: 200, options: { headers: markedHeaders, body: `{"event":"like","note":"${MARKER}"}` } },
      { status: 500, arrange: failing, options: { headers: markedHeaders, body: `{"event":"like","note":"${MARKER}"}` } },
      { status: 503, arrange: unavailable, options: { headers: markedHeaders, body: `{"event":"like","note":"${MARKER}"}` } },
    ];

    for (const { status, arrange, options } of attempts) {
      arrange?.();
      const response = await post(options);

      expect(response.status).toBe(status);
      expect(await response.text()).not.toContain(MARKER);
      expect([...response.headers].join("\n")).not.toContain(MARKER);
    }
    expect(JSON.stringify(logged.mock.calls)).not.toContain(MARKER);
    expect(JSON.stringify(jest.mocked(recordArticleEvent).mock.calls)).not.toContain(MARKER);
  });
});
