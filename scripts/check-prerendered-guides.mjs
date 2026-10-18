#!/usr/bin/env node
/**
 * Fails the build when an English Learn guide is not prerendered. The guides
 * are the top organic landing pages, and a Next upgrade once stopped emitting
 * them with no build error.
 *
 * Usage: node scripts/check-prerendered-guides.mjs   (after `next build`)
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const GUIDES_DIR = "src/lib/seo/learn/guides";
const DIST = ".next";

const slugs = readdirSync(GUIDES_DIR)
  .filter((file) => file.endsWith(".ts") && file !== "index.ts")
  .map((file) => file.replace(/\.ts$/, ""));

const routes = JSON.parse(readFileSync(join(DIST, "prerender-manifest.json"), "utf8")).routes;

const missing = slugs.filter(
  (slug) => !routes[`/en/learn/${slug}`] || !existsSync(join(DIST, "server/app/en/learn", `${slug}.html`)),
);

if (missing.length > 0) {
  console.error(`${missing.length} of ${slugs.length} English guides were not prerendered:`);
  for (const slug of missing) console.error(`  /en/learn/${slug}`);
  process.exit(1);
}

console.log(`All ${slugs.length} English guides prerendered.`);
