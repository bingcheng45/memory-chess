#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const [fixturePath, portArg = "54321"] = process.argv.slice(2);
if (!fixturePath) {
  console.error("usage: fake-supabase.mjs <fixture.json> [port]");
  console.error("fixture: an array of leaderboard_entries rows, or { leaderboard_entries: [...], article_stats: [{ slug, views, likes }] }");
  console.error("env: FAKE_SUPABASE_MISSING_COUNTRY=1 rejects inserts carrying country_code with PGRST204");
  process.exit(1);
}

const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const rows = Array.isArray(fixture) ? fixture : (fixture.leaderboard_entries ?? []);
let articleStats = Array.isArray(fixture) ? [] : (fixture.article_stats ?? []);

// Opt-in: stand in for a database whose country_code migration has not been
// applied, so a driver can see what a player gets from the real server.
const rejectCountryInserts = process.env.FAKE_SUPABASE_MISSING_COUNTRY === "1";

const MISSING_COUNTRY_COLUMN = {
  code: "PGRST204",
  details: null,
  hint: null,
  message: "Could not find the 'country_code' column of 'leaderboard_entries' in the schema cache",
};

const RECORD_EVENT_PATH = "/rest/v1/rpc/record_article_event";
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 80;
const INVALID_PARAMETER = "22023";

const EVENT_STEPS = {
  view: { views: 1, likes: 0 },
  like: { views: 0, likes: 1 },
  unlike: { views: 0, likes: -1 },
};

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

function sendCannotAnswer(res, unsupported) {
  sendJson(res, 501, {
    code: "PGRST000",
    message: `fixture cannot answer ${unsupported.map(([key, value]) => `${key}=${value}`).join("&")}`,
  });
}

function carriesCountryCode(body) {
  const inserted = Array.isArray(body) ? body : [body];
  return inserted.some((row) => row && typeof row === "object" && "country_code" in row);
}

function compare(order) {
  const keys = order.split(",").map((part) => {
    const [column, direction = "asc", nulls] = part.split(".");
    const descending = direction === "desc";
    return { column, descending, nullsLast: nulls ? nulls === "nullslast" : !descending };
  });
  return (a, b) => {
    for (const { column, descending, nullsLast } of keys) {
      const x = a[column];
      const y = b[column];
      if (x === y) continue;
      if (x == null) return nullsLast ? 1 : -1;
      if (y == null) return nullsLast ? -1 : 1;
      return (x < y ? -1 : 1) * (descending ? -1 : 1);
    }
    return 0;
  };
}

// postgrest-js writes .in("slug", [...]) as in.(a,b) and quotes a value only when it holds a reserved character.
function inList(value) {
  const inner = value.slice("in.(".length, -1);
  return [...inner.matchAll(/"((?:[^"\\]|\\.)*)"|([^,]+)/g)].map((match) => match[1] ?? match[2]);
}

function invalidParameter(message) {
  return { status: 400, body: { code: INVALID_PARAMETER, details: null, hint: null, message } };
}

function recordArticleEvent(body) {
  const slug = body?.p_slug;
  const step = typeof body?.p_event === "string" && Object.hasOwn(EVENT_STEPS, body.p_event) ? EVENT_STEPS[body.p_event] : null;
  if (typeof slug !== "string" || slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) {
    return invalidParameter("invalid article slug");
  }
  if (step === null) {
    return invalidParameter("invalid article event");
  }
  const before = articleStats.find((row) => row.slug === slug) ?? { slug, views: 0, likes: 0 };
  const after = { slug, views: before.views + step.views, likes: Math.max(0, before.likes + step.likes) };
  articleStats = [...articleStats.filter((row) => row.slug !== slug), after];
  console.log(`rpc record_article_event slug=${slug} event=${body.p_event} -> views=${after.views} likes=${after.likes}`);
  return { status: 200, body: [{ views: after.views, likes: after.likes }] };
}

function unsupportedArticleStatsFilters(url) {
  return [...url.searchParams].filter(
    ([key, value]) => key !== "select" && !(key === "slug" && /^(eq\.|in\.\()/.test(value)),
  );
}

function selectArticleStats(url) {
  const columns = (url.searchParams.get("select") ?? "*").split(",");
  const wanted = url.searchParams.get("slug");
  const kept = articleStats.filter((row) => {
    if (wanted === null) return true;
    if (wanted.startsWith("in.(")) return inList(wanted).includes(row.slug);
    return row.slug === wanted.slice("eq.".length);
  });
  const picked = columns.includes("*")
    ? kept
    : kept.map((row) => Object.fromEntries(columns.map((column) => [column, row[column]])));
  console.log(`article_stats select ${url.searchParams.toString()} -> ${picked.length} rows`);
  return picked;
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.endsWith(RECORD_EVENT_PATH)) {
    const answer = req.method === "POST"
      ? recordArticleEvent(await readJson(req))
      : { status: 405, body: { code: "PGRST000", message: "record_article_event takes POST" } };
    if (answer.status !== 200) console.log(`rpc record_article_event rejected ${answer.body.code}`);
    sendJson(res, answer.status, answer.body);
    return;
  }
  if (url.pathname.includes("/rest/v1/rpc/")) {
    sendJson(res, 404, { code: "PGRST202", message: `no fixture for ${url.pathname}` });
    return;
  }
  if (url.pathname.endsWith("/rest/v1/article_stats")) {
    const unsupported = unsupportedArticleStatsFilters(url);
    if (unsupported.length) {
      console.log(`article_stats select ${url.searchParams.toString()} -> 501`);
      sendCannotAnswer(res, unsupported);
      return;
    }
    const page = selectArticleStats(url);
    sendJson(res, 200, req.method === "HEAD" ? undefined : page, {
      "content-range": page.length ? `0-${page.length - 1}/${page.length}` : `*/0`,
    });
    return;
  }
  if (!url.pathname.endsWith("/rest/v1/leaderboard_entries")) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ code: "PGRST205", message: `no fixture for ${url.pathname}` }));
    return;
  }
  if (rejectCountryInserts && req.method === "POST" && carriesCountryCode(await readJson(req))) {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify(MISSING_COUNTRY_COLUMN));
    return;
  }
  const unsupported = [...url.searchParams].filter(
    ([key, value]) =>
      !["select", "order", "limit", "offset"].includes(key) && !/^(eq|gt)\./.test(value),
  );
  if (unsupported.length) {
    sendCannotAnswer(res, unsupported);
    return;
  }
  const ranked = rows
    .filter((row) =>
      [...url.searchParams].every(([column, value]) => {
        if (value.startsWith("eq.")) return String(row[column]) === value.slice(3);
        if (value.startsWith("gt.")) return row[column] != null && Number(row[column]) > Number(value.slice(3));
        return true;
      }),
    )
    .sort(compare(url.searchParams.get("order") ?? "id"));
  // `.range(from, to)` reaches PostgREST as offset plus limit, not as a Range header.
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Number(url.searchParams.get("limit") ?? ranked.length);
  const page = ranked.slice(offset, offset + limit);
  res.writeHead(200, {
    "content-type": "application/json",
    "content-range": page.length
      ? `${offset}-${offset + page.length - 1}/${ranked.length}`
      : `*/${ranked.length}`,
  });
  res.end(req.method === "HEAD" ? undefined : JSON.stringify(page));
}).listen(Number(portArg), "127.0.0.1", () => {
  const mode = rejectCountryInserts ? ", rejecting country_code inserts with PGRST204" : "";
  console.log(`fake supabase on http://127.0.0.1:${portArg} serving ${rows.length} rows${mode}`);
  console.log(`article_stats holds ${articleStats.length} rows`);
});
