/**
 * Lists recent leaderboard names that the name blocklist now refuses.
 *
 * The API refuses new offensive names and hides stored ones, but the rows stay
 * in the table, and a name the list does not know yet slips through. This reads
 * the last N days with the anon key (select only) so the owner can see what was
 * hidden, delete those rows, and spot names the list should learn.
 *
 * Usage: npm run check:names [-- --days 30]
 * Exit code 1 when any recent name is blocked.
 */

import { isBlockedName } from "../src/lib/leaderboard/blockedNames.ts";

const PAGE = 1000;

function parseDays(argv) {
  const index = argv.indexOf("--days");
  const days = index === -1 ? 7 : Number(argv[index + 1]);
  if (!Number.isInteger(days) || days < 1) {
    console.error("usage: npm run check:names [-- --days 7]");
    process.exit(2);
  }
  return days;
}

async function fetchRecentRows(url, key, since) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const query = new URLSearchParams({
      select: "id,player_name,difficulty,created_at",
      created_at: `gte.${since.toISOString()}`,
      order: "created_at.desc",
    });
    const response = await fetch(`${url}/rest/v1/leaderboard_entries?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + PAGE - 1}` },
    });
    if (!response.ok) {
      throw new Error(`Supabase read failed: ${response.status} ${await response.text()}`);
    }
    const page = await response.json();
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

async function main() {
  const days = parseDays(process.argv);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local");
    process.exit(2);
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await fetchRecentRows(url, key, since);
  const blocked = rows.filter((row) => isBlockedName(row.player_name));
  const names = new Set(rows.map((row) => row.player_name));

  console.log(`since    ${since.toISOString()} (${days} days)`);
  console.log(`rows     ${rows.length} from ${names.size} names`);
  console.log(`blocked  ${blocked.length}`);
  for (const row of blocked) {
    console.log(`  ${row.created_at}  ${row.difficulty.padEnd(8)}  ${row.id}  ${JSON.stringify(row.player_name)}`);
  }
  process.exit(blocked.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(2);
});
