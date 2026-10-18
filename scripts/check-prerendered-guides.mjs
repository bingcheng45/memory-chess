#!/usr/bin/env node
import "./lab/ts-hooks.mjs";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DIST = ".next";
const MANIFEST = join(DIST, "prerender-manifest.json");

const { LEARN_SLUGS: slugs } = await import(pathToFileURL(join(process.cwd(), "src/lib/seo/learn/index.ts")).href);

if (!existsSync(MANIFEST)) {
  console.error(`${MANIFEST} not found. Run \`next build\` before this check.`);
  process.exit(1);
}

const routes = JSON.parse(readFileSync(MANIFEST, "utf8")).routes;

const missing = slugs.filter(
  (slug) => !routes[`/en/learn/${slug}`] || !existsSync(join(DIST, "server/app/en/learn", `${slug}.html`)),
);

if (missing.length > 0) {
  console.error(`${missing.length} of ${slugs.length} English guides were not prerendered:`);
  for (const slug of missing) console.error(`  /en/learn/${slug}`);
  process.exit(1);
}

console.log(`All ${slugs.length} English guides prerendered.`);
