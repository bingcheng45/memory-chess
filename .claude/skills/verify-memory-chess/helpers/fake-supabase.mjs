#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const [fixturePath, portArg = "54321"] = process.argv.slice(2);
if (!fixturePath) {
  console.error("usage: fake-supabase.mjs <fixture.json> [port]");
  console.error("fixture: an array of leaderboard_entries rows, or { leaderboard_entries: [...], article_stats: [{ slug, views, likes }] }");
  console.error("env: FAKE_SUPABASE_MISSING_RATING=1 serves the table before migration 0004: no skill_rating or daily_day, no daily board");
  console.error("env: FAKE_SUPABASE_MISSING_COUNTRY=1 serves the table before migration 0001 as well: no country_code either");
  console.error("env: FAKE_SUPABASE_MISSING_MODE=1 serves the table before migration 0008: no mode, no blindfold boards");
  process.exit(1);
}

const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));

const DEFAULTS = { country_code: "ZZ", skill_rating: 1000, daily_day: null, mode: "board" };
const SCHEMAS = {
  MISSING_COUNTRY: {
    label: ", without migrations 0001 and 0004 (no country_code, skill_rating or daily_day)",
    absent: ["skill_rating", "daily_day", "country_code", "mode"],
  },
  MISSING_RATING: {
    label: ", without migration 0004 (no skill_rating or daily_day)",
    absent: ["skill_rating", "daily_day", "mode"],
  },
  MISSING_MODE: {
    label: ", without migration 0008 (no mode)",
    absent: ["mode"],
  },
};
const mode = Object.keys(SCHEMAS).find((name) => process.env[`FAKE_SUPABASE_${name}`] === "1");
const schema = mode ? SCHEMAS[mode] : { label: "", absent: [] };
const has = (column) => !schema.absent.includes(column);
const present = (row) => Object.fromEntries(Object.entries(row).filter(([column]) => has(column)));
const boards = ["easy", "medium", "hard", "grandmaster", ...(has("daily_day") ? ["daily"] : [])];

const fixtureRows = Array.isArray(fixture) ? fixture : (fixture.leaderboard_entries ?? []);
const rows = fixtureRows.map(present);
let articleStats = Array.isArray(fixture) ? [] : (fixture.article_stats ?? []);

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

const missingColumn = (column) => ({
  code: "PGRST204",
  details: null,
  hint: null,
  message: `Could not find the '${column}' column of 'leaderboard_entries' in the schema cache`,
});

const checkViolation = (constraint) => ({
  code: "23514",
  details: null,
  hint: null,
  message: `new row for relation "leaderboard_entries" violates check constraint "${constraint}"`,
});

const CHECKS = [
  ["check_difficulty_board", "difficulty", (row) => boards.includes(row.difficulty)],
  ["check_daily_day_matches_board", "daily_day", (row) => (row.difficulty === "daily") === (row.daily_day != null)],
  [
    "check_daily_day_recent",
    "daily_day",
    (row) => {
      if (row.daily_day == null) return true;
      const stored = Date.parse(row.created_at.slice(0, 10));
      const day = Date.parse(row.daily_day);
      return day === stored || day === stored - 86_400_000;
    },
  ],
  [
    "check_skill_rating_range",
    "skill_rating",
    (row) => Number.isInteger(row.skill_rating) && row.skill_rating >= 0 && row.skill_rating <= 5000,
  ],
  ["check_memorize_time_floor", "memorize_time", (row) => Number(row.memorize_time) >= Math.max(0.3, row.piece_count * 0.1)],
  ["check_mode_known", "mode", (row) => row.mode === "board" || row.mode === "blindfold"],
  ["check_daily_board_mode", "mode", (row) => row.difficulty !== "daily" || row.mode === "board"],
].filter(([, column]) => has(column));

function rejectInsert(body) {
  console.log(`insert rejected ${body.code}: ${body.message}`);
  return { status: 400, body };
}

function insertRow(body) {
  const unknown = Object.keys(body).find((column) => !has(column));
  if (unknown) return rejectInsert(missingColumn(unknown));
  const stamped = { id: randomUUID(), created_at: new Date().toISOString(), total_wrong_pieces: null, ...present(DEFAULTS), ...body };
  const row = stamped.daily_day == null ? stamped : { ...stamped, created_at: new Date().toISOString() };
  const broken = CHECKS.find(([, , holds]) => !holds(row));
  if (broken) return rejectInsert(checkViolation(broken[0]));
  rows.push(row);
  console.log(`insert ${row.difficulty} ${row.player_name} skill_rating=${row.skill_rating ?? "(no column)"} -> ${rows.length} rows`);
  return { status: 201, body: row };
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

function splitTopLevel(list) {
  const parts = [];
  let depth = 0;
  let start = 0;
  [...list].forEach((char, index) => {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(list.slice(start, index));
      start = index + 1;
    }
  });
  return [...parts, list.slice(start)];
}

const COMPARE = {
  eq: (x, y) => String(x) === y,
  gt: (x, y) => x != null && Number(x) > Number(y),
  lt: (x, y) => x != null && Number(x) < Number(y),
  gte: (x, y) => x != null && Number(x) >= Number(y),
  lte: (x, y) => x != null && Number(x) <= Number(y),
};

function condition(column, test) {
  if (test === "is.null") return (row) => row[column] == null;
  if (test === "not.is.null") return (row) => row[column] != null;
  const [name, ...value] = test.split(".");
  return (row) => COMPARE[name](row[column], value.join("."));
}

const CONTROL_PARAMS = new Set(["select", "order", "limit", "offset"]);
const anyOf = (tests) => (row) => tests.some((test) => test(row));

function logicTest(clause) {
  if (clause.startsWith("and(")) {
    const tests = splitTopLevel(clause.slice("and(".length, -1)).map(logicTest);
    return (row) => tests.every((test) => test(row));
  }
  const [column, ...test] = clause.split(".");
  return condition(column, test.join("."));
}

const OPERATOR_THE_FIXTURE_CANNOT_RUN = Symbol("operator the fixture cannot run");

function slugFilter(value) {
  if (value === null) return () => true;
  if (value.startsWith("in.(")) {
    const wanted = inList(value);
    return (row) => wanted.includes(row.slug);
  }
  if (value.startsWith("eq.")) return (row) => row.slug === value.slice("eq.".length);
  return OPERATOR_THE_FIXTURE_CANNOT_RUN;
}

function unsupportedArticleStatsFilters(url, keeps) {
  return [...url.searchParams].filter(
    ([key]) => key !== "select" && (key !== "slug" || keeps === OPERATOR_THE_FIXTURE_CANNOT_RUN),
  );
}

function selectArticleStats(url, keeps) {
  const columns = (url.searchParams.get("select") ?? "*").split(",");
  const kept = articleStats.filter(keeps);
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
    const keeps = slugFilter(url.searchParams.get("slug"));
    const unsupported = unsupportedArticleStatsFilters(url, keeps);
    if (unsupported.length) {
      console.log(`article_stats select ${url.searchParams.toString()} -> 501`);
      sendCannotAnswer(res, unsupported);
      return;
    }
    const page = selectArticleStats(url, keeps);
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
  if (req.method === "POST") {
    const answer = insertRow((await readJson(req)) ?? {});
    const single = (req.headers.accept ?? "").includes("vnd.pgrst.object");
    sendJson(res, answer.status, answer.status === 201 && !single ? [answer.body] : answer.body);
    return;
  }
  const filters = [...url.searchParams].filter(([key]) => !CONTROL_PARAMS.has(key));
  const unsupported = filters.filter(([key, value]) => key !== "or" && !/^(eq|gt|gte|lt|lte)\./.test(value));
  if (unsupported.length) {
    sendCannotAnswer(res, unsupported);
    return;
  }
  const tests = filters.map(([column, value]) =>
    column === "or" ? anyOf(splitTopLevel(value.slice(1, -1)).map(logicTest)) : condition(column, value),
  );
  const ranked = rows.filter((row) => tests.every((test) => test(row))).sort(compare(url.searchParams.get("order") ?? "id"));
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
  console.log(`fake supabase on http://127.0.0.1:${portArg} serving ${rows.length} rows${schema.label}`);
  console.log(`article_stats holds ${articleStats.length} rows`);
});
