#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { prerenderedHtml } from "./prerendered-html.mjs";

// Only the home pages (<locale>.html) may load the home page's chunk. Another page that references it
// downloads the home page's code; src/components/home/HomeLinks.tsx says how that happens.
const HOME_CHUNK = /\(home\)\/page-[a-z0-9]+\.js/;

const pages = prerenderedHtml();
if (pages.length === 0) {
  console.error("No prerendered HTML found. Run `next build` before this check.");
  process.exit(1);
}

const isHomePage = (route) => !route.includes("/") && !route.startsWith("_");
const leaking = pages.filter(({ route, path }) => !isHomePage(route) && HOME_CHUNK.test(readFileSync(path, "utf8")));
const homePages = pages.filter(({ route }) => isHomePage(route));
if (!homePages.some(({ path }) => HOME_CHUNK.test(readFileSync(path, "utf8")))) {
  console.error("No home page loads a chunk named like (home)/page-<hash>.js, so this check cannot see a leak. Build with webpack.");
  process.exit(1);
}

if (leaking.length > 0) {
  console.error(`${leaking.length} of ${pages.length} prerendered pages load the home page's chunk:`);
  for (const { route } of leaking.slice(0, 20)) console.error(`  ${route}`);
  process.exit(1);
}

console.log(`None of the ${pages.length} prerendered pages outside the home page loads its chunk.`);
