#!/usr/bin/env node
// Copies the production env from Vercel to the memory-chess Worker without printing any value.
// Runtime secrets go to `wrangler secret bulk`; NEXT_PUBLIC_* values, which Next.js inlines at build
// time, go to .env.production.local for local builds and to the Workers Builds trigger when one exists.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { parseEnv } from "node:util";

const WORKER = "memory-chess";
const ACCOUNT = "8e85617b72ae06600e88f3e1d9a010bd";
const RUNTIME = ["SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "GOOGLE_SHEET_ID", "GOOGLE_SERVICE_ACCOUNT_KEY"];

const dir = mkdtempSync(join(tmpdir(), "cf-env-"));
try {
  const file = join(dir, "prod.env");
  // The Vercel project link (.vercel/) lives in the main checkout, not in worktrees.
  const gitCommon = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).trim();
  execFileSync("vercel", ["env", "pull", file, "--environment=production", "--yes"], { cwd: dirname(gitCommon), stdio: ["ignore", "ignore", "inherit"] });
  const env = parseEnv(readFileSync(file, "utf8"));

  // Vercel writes this placeholder for a value marked Sensitive, which it never lets anyone download.
  const usable = (k) => env[k] && env[k] !== "[SENSITIVE]";
  const sensitive = RUNTIME.filter((k) => env[k] === "[SENSITIVE]");
  const runtime = Object.fromEntries(RUNTIME.filter(usable).map((k) => [k, env[k]]));
  writeFileSync(join(dir, "secrets.json"), JSON.stringify(runtime));
  execFileSync("npx", ["wrangler", "secret", "bulk", join(dir, "secrets.json"), "--name", WORKER], { stdio: ["ignore", "ignore", "inherit"] });
  console.log(`Worker ${WORKER}: set ${Object.keys(runtime).join(", ")}`);
  for (const k of sensitive) console.log(`Skipped ${k}: Vercel keeps it Sensitive. Set it with: npx wrangler secret put ${k} --name ${WORKER}`);

  const build = Object.entries(env).filter(([k, v]) => k.startsWith("NEXT_PUBLIC_") && v !== "[SENSITIVE]");
  writeFileSync(".env.production.local", build.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join("\n") + "\n", { mode: 0o600 });
  console.log(`.env.production.local: wrote ${build.map(([k]) => k).join(", ")}`);

  const token = execFileSync("npx", ["wrangler", "auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split("\n").pop();
  const api = (path, init = {}) =>
    fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }).then((r) => r.json());
  const tag = (await api("/workers/scripts")).result.find((w) => w.id === WORKER).tag;
  const triggers = (await api(`/builds/workers/${tag}/triggers`)).result ?? [];
  for (const t of triggers) {
    const body = Object.fromEntries(build.map(([k, v]) => [k, { value: v, is_secret: false }]));
    const res = await api(`/builds/triggers/${t.trigger_uuid}/environment_variables`, { method: "PATCH", body: JSON.stringify(body) });
    console.log(`Build trigger ${t.trigger_name ?? t.trigger_uuid}: ${res.success ? "set build variables" : JSON.stringify(res.errors)}`);
  }
  if (triggers.length === 0) console.log("No Workers Builds trigger yet; build variables not set.");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
