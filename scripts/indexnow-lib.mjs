import { dirname } from "node:path";

const HOST = "thememorychess.com";
const KEY = "5a02a3bb61bac459c5a10034038b50f9";
const DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
const DEFAULT_SITEMAP = `https://${HOST}/sitemap.xml`;
export const MAX_URLS = 10_000;
const MAX_BODY_CHARS = 500;

const STATUS_MEANING = {
  400: "Bad request: invalid format.",
  403: "Forbidden: the key is not valid (for example the key was not found, or the file was found but the key is not in it).",
  422: "Unprocessable: a URL does not belong to the host, or the key is not matching the schema in the protocol.",
  429: "Too many requests (potential spam).",
};

const XML_ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };

const decodeXml = (text) => text.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => XML_ENTITIES[entity]);

export function parseSitemap(xml) {
  const seen = new Set();
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].flatMap(([, block]) => {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) return [];
    const url = decodeXml(loc.trim());
    if (seen.has(url)) return [];
    seen.add(url);
    return [{ url, lastmod: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1].trim() }];
  });
}

function isNewer(lastmod, recorded) {
  const current = Date.parse(lastmod ?? "");
  if (Number.isNaN(current)) return false;
  const previous = Date.parse(recorded);
  return Number.isNaN(previous) || current > previous;
}

export function planSubmission(entries, previous) {
  const changed = [];
  const next = {};
  for (const { url, lastmod } of entries) {
    const isNew = !Object.hasOwn(previous, url);
    if (isNew || isNewer(lastmod, previous[url])) {
      changed.push(url);
      next[url] = lastmod ?? "";
    } else {
      next[url] = previous[url];
    }
  }
  return { changed, next };
}

export function buildPayload(urls) {
  if (urls.length === 0) throw new Error("No URLs to submit.");
  if (urls.length > MAX_URLS) throw new Error(`${urls.length} URLs exceeds the IndexNow limit of ${MAX_URLS}.`);
  const foreign = urls.find((url) => new URL(url).hostname !== HOST);
  if (foreign) throw new Error(`${foreign} is not on ${HOST}.`);
  return { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls };
}

function parseArgs(argv) {
  const options = { dryRun: false, all: false, sitemap: DEFAULT_SITEMAP, urls: null, state: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--all") options.all = true;
    else if (arg === "--sitemap") options.sitemap = argv[++i];
    else if (arg === "--state") options.state = argv[++i];
    else if (arg === "--urls") options.urls = argv[++i].split(",").map((url) => url.trim()).filter(Boolean);
    else throw new Error(`Unknown argument ${arg}.`);
  }
  return options;
}

async function readSitemap(source, { fetch, readFile }) {
  if (!/^https?:\/\//.test(source)) return readFile(source, "utf8");
  const response = await fetch(source);
  if (!response.ok) throw new Error(`${source} answered ${response.status}.`);
  return response.text();
}

async function readState(path, { readFile, error }) {
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch (cause) {
    if (cause.code === "ENOENT") return {};
    throw cause;
  }
  try {
    const state = JSON.parse(text);
    if (state && typeof state === "object" && !Array.isArray(state)) return state;
  } catch {}
  error(`${path}: ignoring unreadable state, treating every URL as new.`);
  return {};
}

async function readResponseBody(response) {
  const text = (await response.text().catch(() => "")).trim();
  return text ? text.slice(0, MAX_BODY_CHARS) : "(empty)";
}

export async function run(argv, deps) {
  const { fetch, writeFile, mkdir, log, error, endpoint = DEFAULT_ENDPOINT } = deps;
  try {
    const options = parseArgs(argv);
    let urls = options.urls;
    let nextState = null;
    if (!urls) {
      const entries = parseSitemap(await readSitemap(options.sitemap, deps));
      const previous = options.state && !options.all ? await readState(options.state, deps) : {};
      const plan = planSubmission(entries, previous);
      urls = plan.changed;
      nextState = plan.next;
      if (urls.length === 0 && options.state) {
        log("No sitemap URL changed since the last submission; nothing to submit.");
        return 0;
      }
    }
    const payload = buildPayload(urls);
    if (options.dryRun) {
      log(JSON.stringify(payload, null, 2));
      return 0;
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (response.status !== 200 && response.status !== 202) {
      const meaning = STATUS_MEANING[response.status] ?? "Unexpected status.";
      error(`IndexNow answered ${response.status} for ${urls.length} URLs. ${meaning}`);
      error(`Response body: ${await readResponseBody(response)}`);
      return 1;
    }
    log(`IndexNow answered ${response.status} for ${urls.length} URLs.`);
    if (options.state && nextState) {
      await mkdir(dirname(options.state), { recursive: true });
      await writeFile(options.state, `${JSON.stringify(nextState, null, 2)}\n`);
    }
    return 0;
  } catch (cause) {
    error(cause.message);
    return 1;
  }
}
