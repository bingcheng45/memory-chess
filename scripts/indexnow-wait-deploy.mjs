import { appendFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { waitForDeployment } from "./indexnow-deploy.mjs";

const MINUTE = 60_000;
const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const at = argv.indexOf(name);
  return at === -1 ? fallback : argv[at + 1];
};

const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_OUTPUT, GITHUB_API_URL = "https://api.github.com" } = process.env;
const sha = option("--sha");
if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !sha) {
  console.error("GITHUB_TOKEN and GITHUB_REPOSITORY are required.");
  process.exit(1);
}

async function api(path) {
  const response = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${path}.`);
  return response.json();
}

const result = await waitForDeployment({
  api,
  sha,
  now: Date.now,
  sleep,
  log: console.log,
  pollMs: 20_000,
  noDeploymentMs: Number(option("--no-deployment-minutes", 6)) * MINUTE,
  timeoutMs: Number(option("--timeout-minutes", 15)) * MINUTE,
});

if (result.deployed) console.log(`The Production deployment of ${sha} is live.`);
else console.log(`::warning::IndexNow skipped: ${result.reason}.`);
if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `deployed=${result.deployed}\n`);
