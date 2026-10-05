/** @jest-environment node */

import { runAudit } from "./runAudit";

const PROD = "https://thememorychess.com";
const LOCAL = "http://127.0.0.1:4517";
const ARTICLE = "/articles/magnus-carlsen";

type Finding = { rule: string; message: string };
type Row = {
  url: string;
  path: string;
  locale: string;
  english: string;
  robots: string;
  canonical: string | null;
  h1Count: number;
  hiddenWords: number;
  words: number;
  counter: string;
  blocks: Record<string, number>;
  englishBlocks: Record<string, number>;
  owesNote: boolean;
  findings: Finding[];
};
type Served = { path: string; html: string; linkHeader?: string };

const words = (stem: string, count: number) => Array.from({ length: count }, (_, i) => `${stem}${i}`).join(" ");
const ARTICLE_SCHEMA = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"Magnus Carlsen"}</script>';
const LIST_SCHEMA = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","mainEntity":{"@type":"ItemList"}}</script>';
const note = (href: string) => `<p data-authorship-note="true" data-translation-note="true" class="text-sm">Mit KI aus dem Englischen übersetzt. <a hrefLang="en" href="${href}">Auf Englisch lesen</a></p>`;

function englishPage(path: string, schema: string, text = words("word", 40), sections = ""): Served {
  return {
    path,
    html: `<html lang="en"><head><link rel="canonical" href="${PROD}${path}"/>${schema}</head><body><main><h1>Title</h1><p>${text}</p>${sections}</main></body></html>`,
  };
}

type Parts = {
  robots?: string;
  canonical?: string;
  head?: string;
  headings?: string;
  text?: string;
  sections?: string;
  note?: string;
  chrome?: string;
  linkHeader?: string;
};

function translatedPage(path: string, englishPath: string, parts: Parts = {}): Served {
  const { robots = "noindex, follow", canonical = `${PROD}${path}`, head = "", headings = "<h1>Titel</h1>", text = words("wort", 40), sections = "", chrome = "", linkHeader } = parts;
  return {
    path,
    linkHeader,
    html: `<html lang="de"><head><meta name="robots" content="${robots}"/><link rel="canonical" href="${canonical}"/>${head}</head><body><main>${headings}<p>${text}</p>${sections}${parts.note ?? note(englishPath)}</main>${chrome}</body></html>`,
  };
}

function audit(translated: Served, english: Served): Row {
  const parse = (served: Served) => `audit.parsePage(${JSON.stringify(`${LOCAL}${served.path}`)}, 200, ${JSON.stringify(served.html)}, ${JSON.stringify(served.linkHeader ?? "")})`;
  return JSON.parse(runAudit(`JSON.stringify(audit.auditTranslated([{ page: ${parse(translated)}, english: ${parse(english)} }]))`))[0];
}

const englishArticle = englishPage(ARTICLE, ARTICLE_SCHEMA);
const germanArticle = (parts?: Parts) => translatedPage(`/de${ARTICLE}`, ARTICLE, parts);
const findingsOf = (parts: Parts) => audit(germanArticle(parts), englishArticle).findings;

describe("audit-adsense translated page", () => {
  it("passes a noindex, self-canonical article with one h1, the note and as many blocks as the English page", () => {
    expect(audit(germanArticle(), englishArticle)).toEqual({
      url: `${LOCAL}/de${ARTICLE}`,
      path: `/de${ARTICLE}`,
      locale: "de",
      english: ARTICLE,
      robots: "noindex, follow",
      canonical: `${PROD}/de${ARTICLE}`,
      h1Count: 1,
      hiddenWords: 0,
      words: 50,
      counter: "space-separated words",
      blocks: { h2: 0, p: 1, li: 0, "article card": 0 },
      englishBlocks: { h2: 0, p: 1, li: 0, "article card": 0 },
      owesNote: true,
      findings: [],
    });
  });

  it("fails a page that is not noindex", () => {
    expect(findingsOf({ robots: "index, follow" })).toEqual([{ rule: "translated-noindex", message: 'robots="index, follow", expected noindex' }]);
  });

  it("fails a page canonical to the English URL", () => {
    expect(findingsOf({ canonical: `${PROD}${ARTICLE}` })).toEqual([{ rule: "translated-canonical", message: `canonical points elsewhere: ${PROD}${ARTICLE}` }]);
  });

  it("fails a page with an hreflang alternate in the HTML", () => {
    expect(findingsOf({ head: `<link rel="alternate" hrefLang="en" href="${PROD}${ARTICLE}"/>` })).toEqual([
      { rule: "translated-hreflang", message: `1 hreflang alternate in the HTML, e.g. en ${PROD}${ARTICLE}` },
    ]);
  });

  it("fails a page with an hreflang alternate in the Link header", () => {
    expect(findingsOf({ linkHeader: `<${PROD}${ARTICLE}>; rel="alternate"; hreflang="en"` })).toEqual([
      { rule: "translated-hreflang", message: `1 hreflang alternate in the Link header, e.g. en ${PROD}${ARTICLE}` },
    ]);
  });

  it("fails a page with two h1 elements", () => {
    expect(findingsOf({ headings: "<h1>Titel</h1><h1>Noch ein Titel</h1>" })).toEqual([{ rule: "translated-structure", message: "2 h1 elements" }]);
  });

  it("fails a page with hidden words", () => {
    expect(findingsOf({ text: `${words("wort", 40)}<span class="hidden">Fünf Wörter für niemanden sichtbar</span>` })).toEqual([
      { rule: "translated-hidden-text", message: "5 words ship hidden (inline style, hidden attribute, hidden class, or breakpoint-hidden class)" },
    ]);
  });
});

describe("audit-adsense translated structure", () => {
  const H2_ONE = "<h2>Eins</h2><p>Erster Abschnitt</p>";
  const H2_TWO = "<h2>Zwei</h2><p>Zweiter Abschnitt</p>";
  const ITEMS = "<ul><li>Punkt eins</li><li>Punkt zwei</li></ul>";
  const SECTIONS = `${H2_ONE}${H2_TWO}${ITEMS}`;
  const englishSections = englishPage(ARTICLE, ARTICLE_SCHEMA, words("word", 40), SECTIONS);
  const structureOf = (sections: string, english = englishSections) => audit(germanArticle({ sections }), english).findings;
  const DROPPED = "translated-dropped-content";

  it("passes a translation with the same blocks as its English page", () => {
    expect(structureOf(SECTIONS)).toEqual([]);
  });

  it("fails a translation missing one h2", () => {
    expect(structureOf(`${H2_ONE}<p>Zweiter Abschnitt</p>${ITEMS}`)).toEqual([{ rule: DROPPED, message: `1 h2 where ${ARTICLE} has 2` }]);
  });

  it("fails a translation missing one p", () => {
    expect(structureOf(`${H2_ONE}<h2>Zwei</h2>${ITEMS}`)).toEqual([{ rule: DROPPED, message: `2 p where ${ARTICLE} has 3` }]);
  });

  it("fails a translation with one p more", () => {
    expect(structureOf(`${SECTIONS}<p>Ein Absatz zu viel</p>`)).toEqual([{ rule: DROPPED, message: `4 p where ${ARTICLE} has 3` }]);
  });

  it("fails a translation missing one li", () => {
    expect(structureOf(`${H2_ONE}${H2_TWO}<ul><li>Punkt eins</li></ul>`)).toEqual([{ rule: DROPPED, message: `1 li where ${ARTICLE} has 2` }]);
  });

  it("names every kind that differs in one message", () => {
    expect(structureOf(H2_ONE)).toEqual([{ rule: DROPPED, message: `1 h2 where ${ARTICLE} has 2, 2 p where it has 3, 0 li where it has 2` }]);
  });

  it("fails a translated list page missing one article card", () => {
    const card = (slug: string) => `<a data-article-card="${slug}" href="/articles/${slug}">${slug}</a>`;
    const english = englishPage("/articles", LIST_SCHEMA, words("word", 40), `${card("a")}${card("b")}${card("c")}`);
    const translated = translatedPage("/de/articles", "/articles", { sections: `${card("a")}${card("b")}` });

    expect(audit(translated, english).findings).toEqual([{ rule: DROPPED, message: "2 article card where /articles has 3" }]);
  });

  it("passes a translation with the same blocks and a third of the English words", () => {
    const english = englishPage(ARTICLE, ARTICLE_SCHEMA, words("word", 120), SECTIONS);

    expect(audit(germanArticle({ text: words("wort", 33), sections: SECTIONS }), english).findings).toEqual([]);
  });

  it("does not count the translation note as a p", () => {
    const row = audit(germanArticle({ sections: SECTIONS }), englishSections);

    expect({ blocks: row.blocks, englishBlocks: row.englishBlocks }).toEqual({
      blocks: { h2: 2, p: 3, li: 2, "article card": 0 },
      englishBlocks: { h2: 2, p: 3, li: 2, "article card": 0 },
    });
  });

  it("does not count the view and like counts, which a card prints only once its article has a view or a like", () => {
    const COUNTS = '<p id="a-counts" data-article-counts="true" class="mt-auto"><span>3 views</span><span>1 like</span></p>';
    const card = (slug: string, counts = "") => `<li><a data-article-card="${slug}" href="/articles/${slug}"><p>${slug} described</p>${counts}</a></li>`;
    const english = englishPage("/articles", LIST_SCHEMA, words("word", 40), `${card("a", COUNTS)}${card("b")}`);
    const translated = translatedPage("/de/articles", "/articles", { sections: `${card("a")}${card("b", COUNTS)}` });
    const row = audit(translated, english);
    const CARDS_WITHOUT_COUNTS = { h2: 0, p: 3, li: 2, "article card": 2 };

    expect({ blocks: row.blocks, englishBlocks: row.englishBlocks, findings: row.findings }).toEqual({
      blocks: CARDS_WITHOUT_COUNTS,
      englishBlocks: CARDS_WITHOUT_COUNTS,
      findings: [],
    });
  });

  it("does not count the counts element of an article, whatever is inside it", () => {
    const counts = (inside: string) => `<div data-article-counts="true" class="mt-4">${inside}</div>`;
    const english = englishPage(ARTICLE, ARTICLE_SCHEMA, words("word", 40), `${counts('<span>3 views</span><p role="status"></p>')}${SECTIONS}`);

    expect(structureOf(`${counts("")}${SECTIONS}`, english)).toEqual([]);
  });

  it("does not compare the blocks of the leaderboard, which prints the rows it has and a different text when it has none", () => {
    const english = englishPage("/leaderboard", "", words("word", 40), "<h2>Top scores</h2><p>One</p><p>Two</p>");
    const translated = translatedPage("/de/leaderboard", "/leaderboard", { note: "", sections: "<p>Noch keine Ergebnisse</p><ul><li>Eins</li></ul>" });
    const row = audit(translated, english);

    expect({ blocks: row.blocks, englishBlocks: row.englishBlocks, findings: row.findings }).toEqual({
      blocks: { h2: 0, p: 2, li: 1, "article card": 0 },
      englishBlocks: { h2: 1, p: 3, li: 0, "article card": 0 },
      findings: [],
    });
  });

  it("does not count a p inside nav or footer", () => {
    const chrome = "<nav><p>Menü</p></nav><footer><p>Impressum</p><ul><li>Datenschutz</li></ul></footer>";
    const row = audit(germanArticle({ sections: SECTIONS, chrome }), englishSections);

    expect({ blocks: row.blocks, findings: row.findings }).toEqual({ blocks: { h2: 2, p: 3, li: 2, "article card": 0 }, findings: [] });
  });
});

describe("audit-adsense translation note", () => {
  it("fails an article without the note", () => {
    expect(findingsOf({ note: "" })).toEqual([
      { rule: "translation-note", message: `no translation note (data-translation-note), though ${ARTICLE} declares a schema.org Article` },
    ]);
  });

  it("fails an article whose note links elsewhere", () => {
    expect(findingsOf({ note: note("/articles") })).toEqual([{ rule: "translation-note", message: `the translation note links to /articles, expected ${ARTICLE}` }]);
  });

  it("fails an article whose note has no link", () => {
    expect(findingsOf({ note: '<p data-translation-note="true">Mit KI aus dem Englischen übersetzt.</p>' })).toEqual([
      { rule: "translation-note", message: `the translation note links to nothing, expected ${ARTICLE}` },
    ]);
  });

  it("accepts a note that links to the English page by its production URL", () => {
    expect(findingsOf({ note: note(`${PROD}${ARTICLE}`) })).toEqual([]);
  });

  it("fails an article whose only note sits in the footer, outside the main content", () => {
    expect(findingsOf({ note: "", chrome: `<footer>${note(ARTICLE)}</footer>` })).toEqual([
      { rule: "translation-note", message: `no translation note (data-translation-note), though ${ARTICLE} declares a schema.org Article` },
    ]);
  });

  it("asks the note of the article list, whose English page declares a CollectionPage", () => {
    const row = audit(translatedPage("/de/articles", "/articles", { note: "" }), englishPage("/articles", LIST_SCHEMA));

    expect(row.owesNote).toBe(true);
    expect(row.findings).toEqual([{ rule: "translation-note", message: "no translation note (data-translation-note), though /articles declares a schema.org CollectionPage" }]);
  });

  it("asks no note of the leaderboard, whose English page declares neither", () => {
    const row = audit(translatedPage("/de/leaderboard", "/leaderboard", { note: "" }), englishPage("/leaderboard", ""));

    expect(row.owesNote).toBe(false);
    expect(row.findings).toEqual([]);
  });
});

describe("audit-adsense translated word counters", () => {
  const english = englishPage(ARTICLE, ARTICLE_SCHEMA, words("word", 9));
  const WORDLESS_NOTE = `<p data-translation-note="true"><a hrefLang="en" href="${ARTICLE}"></a></p>`;

  it.each([
    ["zh-CN", "我", "你，他，她，它，谁，这，那，哪。"],
    ["zh-TW", "我", "你，他，她，它，誰，這，那，哪。"],
    ["ja", "犬", "猫、鳥、魚、馬、牛、羊、豚、虎。"],
  ])("counts %s with Intl.Segmenter, where splitting on spaces sees one word", (locale, title, text) => {
    const row = audit(translatedPage(`/${locale}${ARTICLE}`, ARTICLE, { headings: `<h1>${title}</h1>`, text, note: WORDLESS_NOTE }), english);

    expect({ words: row.words, counter: row.counter, findings: row.findings }).toEqual({
      words: 9,
      counter: "Intl.Segmenter word segments",
      findings: [],
    });
  });

  it("counts Korean by its spaces, without the half-character bonus the sitemap counter adds", () => {
    const row = audit(translatedPage(`/ko${ARTICLE}`, ARTICLE, { headings: "<h1>체스</h1>", text: "기억 훈련 체스 선수 눈가림 대국 기록 연구", note: WORDLESS_NOTE }), english);

    expect({ words: row.words, counter: row.counter }).toEqual({ words: 9, counter: "space-separated words" });
  });
});

describe("audit-adsense translated report lines", () => {
  const blocksLine = (compared: number) =>
    `  blocks compared with the English page on the ${compared} that owe a note: h2, p, li, article card (the translation note and the view and like counts left out)`;
  const row = (path: string, locale: string, wordCount: number, counter: string): Partial<Row> & { locale: string } => ({
    path,
    locale,
    english: path.replace(`/${locale}`, ""),
    words: wordCount,
    counter,
    owesNote: path.includes("/articles"),
    findings: [],
  });
  const rows = [
    row("/de/leaderboard", "de", 541, "space-separated words"),
    row("/fi/articles", "fi", 296, "space-separated words"),
    row("/ja/articles", "ja", 597, "Intl.Segmenter word segments"),
    row("/zh-CN/articles", "zh-CN", 479, "Intl.Segmenter word segments"),
  ];

  it("says how many pages were checked, which counter read which locales, which blocks were compared and which pages are thin", () => {
    expect(JSON.parse(runAudit(`JSON.stringify(audit.translatedLines(${JSON.stringify(rows)}))`))).toEqual([
      "translated pages (noindex under a locale prefix): 4 checked against their English pages, 3 of them owing a translation note",
      "  words counted as Intl.Segmenter word segments in ja, zh-CN and as space-separated words in de, fi",
      blocksLine(3),
      "  under 300 words, reported and not failed: /fi/articles 296",
    ]);
  });

  it("leaves out the thin-page line when every page has 300 words", () => {
    expect(JSON.parse(runAudit(`JSON.stringify(audit.translatedLines(${JSON.stringify(rows.filter((r) => r.locale !== "fi"))}))`))).toEqual([
      "translated pages (noindex under a locale prefix): 3 checked against their English pages, 2 of them owing a translation note",
      "  words counted as Intl.Segmenter word segments in ja, zh-CN and as space-separated words in de",
      blocksLine(2),
    ]);
  });

  it("says so when no page is served in translation", () => {
    expect(JSON.parse(runAudit(`JSON.stringify(audit.translatedLines([]))`))).toEqual(["translated pages (noindex under a locale prefix): none served, so none checked"]);
  });
});
