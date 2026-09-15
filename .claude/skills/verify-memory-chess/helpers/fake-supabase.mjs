#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const [fixturePath, portArg = "54321"] = process.argv.slice(2);
if (!fixturePath) {
  console.error("usage: fake-supabase.mjs <rows.json> [port]");
  process.exit(1);
}

const rows = JSON.parse(readFileSync(fixturePath, "utf8"));

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

createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (!url.pathname.endsWith("/rest/v1/leaderboard_entries")) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ code: "PGRST205", message: `no fixture for ${url.pathname}` }));
    return;
  }
  const unsupported = [...url.searchParams].filter(
    ([key, value]) => !["select", "order", "limit"].includes(key) && !/^(eq|gt)\./.test(value),
  );
  if (unsupported.length) {
    res.writeHead(501, { "content-type": "application/json" });
    res.end(JSON.stringify({ code: "PGRST000", message: `fixture cannot answer ${unsupported.map(([k, v]) => `${k}=${v}`).join("&")}` }));
    return;
  }
  const filtered = rows
    .filter((row) =>
      [...url.searchParams].every(([column, value]) => {
        if (value.startsWith("eq.")) return String(row[column]) === value.slice(3);
        if (value.startsWith("gt.")) return row[column] != null && Number(row[column]) > Number(value.slice(3));
        return true;
      }),
    )
    .sort(compare(url.searchParams.get("order") ?? "id"))
    .slice(0, Number(url.searchParams.get("limit") ?? rows.length));
  res.writeHead(200, {
    "content-type": "application/json",
    "content-range": `0-${Math.max(filtered.length - 1, 0)}/${filtered.length}`,
  });
  res.end(req.method === "HEAD" ? undefined : JSON.stringify(filtered));
}).listen(Number(portArg), "127.0.0.1", () => {
  console.log(`fake supabase on http://127.0.0.1:${portArg} serving ${rows.length} rows`);
});
