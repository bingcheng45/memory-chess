#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PUBLISHER_ID = "pub-9048170183399377";
const PROD_ORIGIN = "https://thememorychess.com";
const CONCURRENCY = 8;
const MIN_MAIN_WORDS = 300;
const MAX_SIMILARITY = 0.5;
const SHINGLE = 5;
const MIN_BOILERPLATE_WORDS = 5;
const MAX_SHARED_HEADING_PAGES = 3;
const MAX_SHARED_HEADING_SHARE = 0.5;
const MIN_TEMPLATE_HEADINGS = 4;
const MAX_SENTENCE_REPEATS = 3;

/**
 * Pages whose job is not prose. Each one states why it may sit under the
 * floor, so a new short page cannot slip in without somebody writing a reason.
 */
const WORD_FLOOR_EXCEPTIONS = new Map([
  ["/contact-us", { floor: 120, reason: "a contact form is the content, and Finnish or Turkish say the same text in a fifth fewer words" }],
]);

const PLACEHOLDERS = [
  /\bloading\b[^.]{0,40}\.\.\./i,
  /:\s*\.\.\.(\s|$)/,
  /\bcoming soon\b/i,
  /\blorem ipsum\b/i,
  /\bunder construction\b/i,
  /\bTODO\b/,
  /no entries on this leaderboard yet/i,
];

const TRUST_LINKS = ["/privacy", "/about", "/terms", "/contact-us"];

const args = Object.fromEntries(
  process.argv.slice(2).map((arg, i, all) =>
    arg.startsWith("--") ? [arg.slice(2), all[i + 1]] : [],
  ).filter((pair) => pair.length),
);
const base = (args.base ?? "http://127.0.0.1:4517").replace(/\/$/, "");
const outDir = args.out;

function stripBlocks(html, tags) {
  return tags.reduce(
    (acc, tag) => acc.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi"), " "),
    html,
  );
}

function toText(html) {
  return html
    .replace(/<\/(?:h[1-6]|p|div|li|td|th|dt|dd|summary|figcaption|blockquote)>/gi, " ¶ ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-zA-Z#0-9]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text) {
  return text ? text.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
}

function countUnits(text) {
  const cjk = (text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) ?? []).length;
  return countWords(text) + Math.round(cjk / 2);
}

function hiddenText(html) {
  const opener = /<(\w+)\b[^>]*style="[^"]*(?:opacity:\s*0(?![.\d])|display:\s*none|visibility:\s*hidden)[^"]*"[^>]*>/gi;
  let hidden = "";
  let match;
  while ((match = opener.exec(html))) {
    const tag = match[1];
    const scan = new RegExp(`<${tag}\\b[^>]*>|<\\/${tag}>`, "gi");
    scan.lastIndex = opener.lastIndex;
    let depth = 1;
    let end = html.length;
    let inner;
    while (depth && (inner = scan.exec(html))) {
      depth += inner[0].startsWith("</") ? -1 : 1;
      if (!depth) end = inner.index;
    }
    hidden += ` ${html.slice(opener.lastIndex, end)}`;
    opener.lastIndex = end;
  }
  return toText(hidden);
}

function attr(html, pattern) {
  return html.match(pattern)?.[1]?.trim() ?? null;
}

function parsePage(url, status, html) {
  const body = stripBlocks(html, ["script", "style", "noscript", "template"]);
  const main = stripBlocks(body, ["nav", "footer"]);
  const mainText = toText(main);
  const path = new URL(url).pathname;
  const localeMatch = path.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(?=\/|$)/);
  return {
    url,
    path,
    locale: localeMatch ? localeMatch[1] : "en",
    status,
    robots: attr(html, /<meta name="robots" content="([^"]*)"/i) ?? "",
    canonical: attr(html, /<link rel="canonical" href="([^"]*)"/i),
    title: attr(html, /<title>([^<]*)<\/title>/i),
    description: attr(html, /<meta name="description" content="([^"]*)"/i),
    h1Count: (body.match(/<h1\b/gi) ?? []).length,
    headings: [...main.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => toText(m[1]).replace(/¶/g, "").trim()),
    mainText,
    proseText: toText(stripBlocks(main, ["cite", "a"])),
    mainWords: countUnits(mainText),
    hiddenWords: countUnits(hiddenText(main)),
    adUnits: (html.match(/<ins\b[^>]*class="[^"]*adsbygoogle/gi) ?? []).length,
    links: [...body.matchAll(/<a\b[^>]*href="([^"#?]*)[^"]*"/gi)].map((m) => m[1]),
    hreflang: [...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/gi)].map((m) => ({ lang: m[1], href: m[2] })),
  };
}

function shingles(text) {
  const words = text.toLowerCase().split(" ").filter((word) => word !== "¶");
  const set = new Set();
  for (let i = 0; i + SHINGLE <= words.length; i += 1) {
    set.add(words.slice(i, i + SHINGLE).join(" "));
  }
  return set;
}

function jaccard(a, b) {
  let shared = 0;
  for (const s of a) if (b.has(s)) shared += 1;
  return shared / (a.size + b.size - shared || 1);
}

const toLocal = (href) => href.replace(PROD_ORIGIN, base);
const isIndexable = (page) => page.status === 200 && !/noindex/i.test(page.robots);

async function fetchPage(url) {
  const res = await fetch(url, { redirect: "manual" });
  return parsePage(url, res.status, res.status === 200 ? await res.text() : "");
}

async function pool(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i]);
      }
    }),
  );
  return results;
}

const RULES = [
  {
    id: "status",
    guideline: "G11 G28 working navigation, sitemap reaches real pages",
    check: (page) => (page.status === 200 ? [] : [`HTTP ${page.status}`]),
  },
  {
    id: "indexable",
    guideline: "G28 the sitemap lists only pages meant to be indexed",
    check: (page) => {
      const problems = [];
      if (/noindex/i.test(page.robots)) problems.push(`listed in sitemap but robots="${page.robots}"`);
      if (!page.canonical) problems.push("missing canonical");
      if (page.canonical && toLocal(page.canonical).replace(/\/$/, "") !== page.url.replace(/\/$/, "")) {
        problems.push(`canonical points elsewhere: ${page.canonical}`);
      }
      return problems;
    },
  },
  {
    id: "substance",
    guideline: "G1 enough original text to tell what the page is about",
    check: (page) => {
      const exception = WORD_FLOOR_EXCEPTIONS.get(page.path.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/, "") || "/");
      const floor = exception?.floor ?? MIN_MAIN_WORDS;
      return page.mainWords >= floor ? [] : [`${page.mainWords} main-content words, floor ${floor}`];
    },
  },
  {
    id: "hidden-text",
    guideline: "G19 no text hidden from the first paint",
    check: (page) =>
      page.hiddenWords === 0 ? [] : [`${page.hiddenWords} of ${page.mainWords} words ship at opacity 0, display none or visibility hidden`],
  },
  {
    id: "placeholder",
    guideline: "G2 no loading or under-construction stubs in served content",
    check: (page) =>
      PLACEHOLDERS.flatMap((re) => {
        const hit = page.mainText.match(re);
        return hit ? [`placeholder text "${hit[0].trim()}"`] : [];
      }),
  },
  {
    id: "structure",
    guideline: "G11 G22 one h1, a title and a description",
    check: (page) => [
      ...(page.h1Count === 1 ? [] : [`${page.h1Count} h1 elements`]),
      ...(page.title ? [] : ["missing <title>"]),
      ...(page.description ? [] : ["missing meta description"]),
    ],
  },
  {
    id: "trust-links",
    guideline: "G23 privacy, about, terms and contact reachable from every page",
    check: (page) =>
      TRUST_LINKS.filter((target) => !page.links.some((href) => href.replace(PROD_ORIGIN, "").replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/)/, "") === target)).map(
        (target) => `no link to ${target}`,
      ),
  },
  {
    id: "ad-density",
    guideline: "G14 publisher content outweighs ads",
    check: (page) => (page.adUnits <= 1 ? [] : [`${page.adUnits} ad units`]),
  },
  {
    id: "unique-meta",
    guideline: "G5 each page is distinct in title and description within its language",
    site: (pages) => {
      const problems = new Map();
      for (const field of ["title", "description"]) {
        const seen = new Map();
        for (const page of pages) {
          if (!page[field]) continue;
          const key = `${page.locale}\u0000${page[field]}`;
          if (seen.has(key)) {
            const first = seen.get(key);
            problems.set(page.url, [...(problems.get(page.url) ?? []), `duplicate ${field} with ${first.path}`]);
          } else {
            seen.set(key, page);
          }
        }
      }
      return problems;
    },
  },
  {
    id: "near-duplicate",
    guideline: "G5 G8 no near-duplicate pages within a language",
    site: (pages) => {
      const problems = new Map();
      const prepared = pages.map((page) => ({ page, set: shingles(page.mainText) }));
      for (let i = 0; i < prepared.length; i += 1) {
        for (let j = i + 1; j < prepared.length; j += 1) {
          const a = prepared[i];
          const b = prepared[j];
          if (a.page.locale !== b.page.locale) continue;
          const score = jaccard(a.set, b.set);
          if (score > MAX_SIMILARITY) {
            problems.set(b.page.url, [...(problems.get(b.page.url) ?? []), `${Math.round(score * 100)}% shared with ${a.page.path}`]);
          }
        }
      }
      return problems;
    },
  },
  {
    id: "boilerplate",
    guideline: "G6 no content sentence stamped onto many pages of a language (citations and link text excepted)",
    site: (pages) => {
      const problems = new Map();
      const pagesBySentence = new Map();
      for (const page of pages) {
        const sentences = new Set(
          page.proseText
            .split(/(?<=[.!?。！？])\s+|\s*¶\s*/)
            .filter((s) => countWords(s) >= MIN_BOILERPLATE_WORDS),
        );
        for (const sentence of sentences) {
          const key = `${page.locale}\u0000${sentence}`;
          pagesBySentence.set(key, [...(pagesBySentence.get(key) ?? []), page]);
        }
      }
      for (const [key, shared] of pagesBySentence) {
        if (shared.length <= MAX_SENTENCE_REPEATS) continue;
        const sentence = key.split("\u0000")[1];
        for (const page of shared) {
          problems.set(page.url, [
            ...(problems.get(page.url) ?? []),
            `sentence on ${shared.length} pages: "${sentence.slice(0, 90)}"`,
          ]);
        }
      }
      return problems;
    },
  },
  {
    id: "heading-template",
    guideline: "G6 pages of a language do not share one section scaffold",
    site: (pages) => {
      const problems = new Map();
      const pageCountByHeading = new Map();
      const keyOf = (page, heading) => `${page.locale}|${heading}`;
      for (const page of pages) {
        for (const heading of new Set(page.headings)) {
          pageCountByHeading.set(keyOf(page, heading), (pageCountByHeading.get(keyOf(page, heading)) ?? 0) + 1);
        }
      }
      for (const page of pages) {
        if (page.headings.length < MIN_TEMPLATE_HEADINGS) continue;
        const shared = page.headings.filter((heading) => pageCountByHeading.get(keyOf(page, heading)) > MAX_SHARED_HEADING_PAGES);
        if (shared.length / page.headings.length >= MAX_SHARED_HEADING_SHARE) {
          problems.set(page.url, [
            `${shared.length} of ${page.headings.length} section headings each head more than ${MAX_SHARED_HEADING_PAGES} pages: ${shared.join(" / ")}`,
          ]);
        }
      }
      return problems;
    },
  },
  {
    id: "hreflang-targets",
    guideline: "G8 G28 alternates point only at pages the sitemap lists",
    site: (pages, { listed }) => {
      const problems = new Map();
      for (const page of pages) {
        const dangling = page.hreflang.filter((alt) => !listed.has(toLocal(alt.href).replace(/\/$/, "") || base));
        if (dangling.length) {
          problems.set(page.url, [`${dangling.length} hreflang targets not in the sitemap, e.g. ${dangling[0].lang} ${dangling[0].href}`]);
        }
      }
      return problems;
    },
  },
];

const listedKey = (url) => url.replace(/\/$/, "") || base;

async function crawlLinks(pages, listed) {
  const targets = [...new Set(pages.flatMap((page) => page.links))]
    .filter((href) => href.startsWith("/") || href.startsWith(PROD_ORIGIN))
    .map((href) => toLocal(href.startsWith("/") ? `${base}${href}` : href))
    .filter((url) => !listed.has(listedKey(url)));
  const crawled = await pool(targets, async (url) => {
    const res = await fetch(url, { redirect: "follow" });
    const landsOnListed = listed.has(listedKey(res.url));
    const html = res.ok && !landsOnListed ? await res.text() : (await res.arrayBuffer(), "");
    return { url, status: res.status, page: html ? parsePage(res.url, res.status, html) : null };
  });
  return {
    broken: crawled.filter((c) => c.status !== 200),
    unlisted: crawled.filter((c) => c.page && isIndexable(c.page)).map((c) => c.page),
  };
}

async function main() {
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => toLocal(m[1]));
  const listed = new Set(urls.map((u) => u.replace(/\/$/, "") || base));
  const pages = await pool(urls, fetchPage);
  const indexable = pages.filter(isIndexable);

  const findings = new Map(pages.map((page) => [page.url, []]));
  const add = (url, ruleId, messages) => {
    for (const message of messages) findings.get(url).push({ rule: ruleId, message });
  };
  for (const rule of RULES) {
    if (rule.check) for (const page of pages) add(page.url, rule.id, rule.check(page));
    if (rule.site) for (const [url, messages] of rule.site(indexable, { listed })) add(url, rule.id, messages);
  }

  const { broken, unlisted } = await crawlLinks(pages, listed);
  const adsTxt = await fetch(`${base}/ads.txt`).then((r) => (r.ok ? r.text() : ""));
  const siteProblems = [
    ...broken.map((b) => ({ rule: "broken-link", message: `${b.url} answers ${b.status}` })),
    ...unlisted.map((p) => ({ rule: "unlisted-indexable", message: `${p.path} is linked and indexable but missing from the sitemap` })),
    ...(adsTxt.includes(PUBLISHER_ID) ? [] : [{ rule: "ads-txt", message: `ads.txt does not list ${PUBLISHER_ID}` }]),
  ];

  const byRule = RULES.map((rule) => {
    const failing = pages.filter((page) => findings.get(page.url).some((f) => f.rule === rule.id));
    return { id: rule.id, guideline: rule.guideline, failing: failing.length, example: failing[0] ? `${failing[0].path}: ${findings.get(failing[0].url).find((f) => f.rule === rule.id).message}` : "" };
  });

  const locales = new Map();
  for (const page of pages) locales.set(page.locale, (locales.get(page.locale) ?? 0) + 1);

  console.log(`AdSense audit of ${base}`);
  console.log(`${pages.length} sitemap URLs, ${indexable.length} indexable, ${locales.size} locales, ${broken.length} broken internal links\n`);
  console.log("| rule | guideline | failing pages | example |");
  console.log("| --- | --- | ---: | --- |");
  for (const row of byRule) console.log(`| ${row.id} | ${row.guideline} | ${row.failing} | ${row.example.replace(/\|/g, "\\|")} |`);
  for (const problem of siteProblems) console.log(`| ${problem.rule} | site | 1 | ${problem.message} |`);

  const failingPages = pages.filter((page) => findings.get(page.url).length);
  if (failingPages.length) {
    console.log("\nFailing pages:");
    for (const page of failingPages) {
      console.log(`  ${page.path}`);
      for (const f of findings.get(page.url)) console.log(`    [${f.rule}] ${f.message}`);
    }
  }

  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "audit.json"),
      JSON.stringify(
        {
          base,
          summary: { urls: pages.length, indexable: indexable.length, locales: Object.fromEntries(locales), broken: broken.length },
          rules: byRule,
          siteProblems,
          pages: pages.map(({ mainText, proseText, links, hreflang, ...rest }) => ({ ...rest, findings: findings.get(rest.url) })),
        },
        null,
        2,
      ),
    );
  }

  const failed = failingPages.length + siteProblems.length;
  console.log(failed ? `\nFAIL: ${failingPages.length} pages and ${siteProblems.length} site checks` : "\nPASS");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
