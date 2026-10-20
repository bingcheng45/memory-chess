import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const HOST = "thememorychess.com";
const KEY = "5a02a3bb61bac459c5a10034038b50f9";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const DEFAULT_SITEMAP = `https://${HOST}/sitemap.xml`;
const MAX_URLS = 10_000;

const XML_ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };

const decodeXml = (text) => text.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => XML_ENTITIES[entity]);

function parseSitemap(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].flatMap(([, block]) => {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) return [];
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    return [{ url: decodeXml(loc.trim()), lastmod: lastmod?.trim() }];
  });
}

function buildPayload(urls) {
  if (urls.length === 0) throw new Error("No URLs to submit.");
  if (urls.length > MAX_URLS) throw new Error(`${urls.length} URLs exceeds the IndexNow limit of ${MAX_URLS}.`);
  const foreign = urls.find((url) => new URL(url).hostname !== HOST);
  if (foreign) throw new Error(`${foreign} is not on ${HOST}.`);
  return { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls };
}

function parseArgs(argv) {
  const options = { dryRun: false, sitemap: DEFAULT_SITEMAP, urls: null, since: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--sitemap") options.sitemap = argv[++i];
    else if (arg === "--urls") options.urls = argv[++i].split(",").map((url) => url.trim()).filter(Boolean);
    else if (arg === "--since") options.since = argv[++i];
    else throw new Error(`Unknown argument ${arg}.`);
  }
  return options;
}

async function readSitemap(source) {
  if (!/^https?:\/\//.test(source)) return readFile(source, "utf8");
  const response = await fetch(source);
  if (!response.ok) throw new Error(`${source} answered ${response.status}.`);
  return response.text();
}

async function selectUrls({ sitemap, urls, since }) {
  if (urls) return urls;
  const entries = parseSitemap(await readSitemap(sitemap));
  const cutoff = since ? Date.parse(since) : null;
  if (cutoff !== null && Number.isNaN(cutoff)) throw new Error(`--since ${since} is not a date.`);
  return entries.filter((entry) => cutoff === null || (entry.lastmod && Date.parse(entry.lastmod) >= cutoff)).map((entry) => entry.url);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const urls = await selectUrls(options);
  if (urls.length === 0 && options.since) {
    console.log(`No sitemap URL changed since ${options.since}; nothing to submit.`);
    return;
  }
  const payload = buildPayload(urls);
  if (options.dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  console.log(`IndexNow answered ${response.status} for ${payload.urlList.length} URLs.`);
  if (response.status !== 200 && response.status !== 202) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
