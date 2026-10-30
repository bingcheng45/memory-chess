#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

// Only the home pages (.next/server/app/<locale>.html) may load the home page's chunk. Another page that references it
// downloads the home page's code; src/components/home/HomeLinks.tsx says how that happens.
const APP = ".next/server/app";
const HOME_CHUNK = /\(home\)\/page-[a-z0-9]+\.js/;

if (!existsSync(APP)) {
  console.error(`${APP} not found. Run \`next build\` before this check.`);
  process.exit(1);
}

const pages = readdirSync(APP, { recursive: true })
  .filter((file) => file.endsWith(".html"))
  .map((file) => join(APP, file));
const isHomePage = (path) => !relative(APP, path).includes("/") && !relative(APP, path).startsWith("_");
const leaking = pages.filter((path) => !isHomePage(path) && HOME_CHUNK.test(readFileSync(path, "utf8")));

if (leaking.length > 0) {
  console.error(`${leaking.length} of ${pages.length} prerendered pages load the home page's chunk:`);
  for (const path of leaking.slice(0, 20)) console.error(`  ${relative(APP, path)}`);
  process.exit(1);
}

console.log(`None of the ${pages.length} prerendered pages outside the home page loads its chunk.`);
