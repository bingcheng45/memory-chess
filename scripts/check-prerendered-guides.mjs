#!/usr/bin/env node
import "./lab/ts-hooks.mjs";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DIST = ".next";
const MANIFEST = join(DIST, "prerender-manifest.json");

const { LEARN_SLUGS: slugs } = await import(pathToFileURL(join(process.cwd(), "src/lib/seo/learn/index.ts")).href);
const { SERVED_GUIDES_FILE } = await import(pathToFileURL(join(process.cwd(), "src/lib/seo/learn/translatedGuides.ts")).href);
const served = JSON.parse(readFileSync(join(process.cwd(), SERVED_GUIDES_FILE), "utf8"));
const pages = [
  ...slugs.map((slug) => ["en", slug]),
  ...Object.entries(served).flatMap(([slug, locales]) => locales.map((locale) => [locale, slug])),
];

if (!existsSync(MANIFEST)) {
  console.error(`${MANIFEST} not found. Run \`next build\` before this check.`);
  process.exit(1);
}

const routes = JSON.parse(readFileSync(MANIFEST, "utf8")).routes;

const missing = pages.filter(
  ([locale, slug]) => !routes[`/${locale}/learn/${slug}`] || !existsSync(join(DIST, `server/app/${locale}/learn`, `${slug}.html`)),
);

if (missing.length > 0) {
  console.error(`${missing.length} of ${pages.length} guide pages were not prerendered:`);
  for (const [locale, slug] of missing) console.error(`  /${locale}/learn/${slug}`);
  process.exit(1);
}

console.log(`All ${slugs.length} English guides and ${pages.length - slugs.length} translated guides prerendered.`);
