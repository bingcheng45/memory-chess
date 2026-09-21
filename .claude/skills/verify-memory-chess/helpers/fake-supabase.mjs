#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const [fixturePath, portArg = "54321"] = process.argv.slice(2);
if (!fixturePath) {
  console.error("usage: fake-supabase.mjs <rows.json> [port]");
  console.error("env: FAKE_SUPABASE_MISSING_COUNTRY=1 rejects inserts carrying country_code with PGRST204");
  process.exit(1);
}

const rows = JSON.parse(readFileSync(fixturePath, "utf8"));

// Opt-in: stand in for a database whose country_code migration has not been
// applied, so a driver can see what a player gets from the real server.
const rejectCountryInserts = process.env.FAKE_SUPABASE_MISSING_COUNTRY === "1";

const MISSING_COUNTRY_COLUMN = {
  code: "PGRST204",
  details: null,
  hint: null,
  message: "Could not find the 'country_code' column of 'leaderboard_entries' in the schema cache",
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

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
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
    res.writeHead(501, { "content-type": "application/json" });
    res.end(JSON.stringify({ code: "PGRST000", message: `fixture cannot answer ${unsupported.map(([k, v]) => `${k}=${v}`).join("&")}` }));
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
});
