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
  englishWords: number;
  percent: number;
  counter: string;
  owesNote: boolean;
  findings: Finding[];
};
type Served = { path: string; html: string; linkHeader?: string };

const words = (stem: string, count: number) => Array.from({ length: count }, (_, i) => `${stem}${i}`).join(" ");
const ARTICLE_SCHEMA = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"Magnus Carlsen"}</script>';
const LIST_SCHEMA = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","mainEntity":{"@type":"ItemList"}}</script>';
const note = (href: string) => `<p data-authorship-note="true" data-translation-note="true" class="text-sm">Mit KI aus dem Englischen übersetzt. <a hrefLang="en" href="${href}">Auf Englisch lesen</a></p>`;

function englishPage(path: string, schema: string, text = words("word", 40)): Served {
  return {
    path,
    html: `<html lang="en"><head><link rel="canonical" href="${PROD}${path}"/>${schema}</head><body><main><h1>Title</h1><p>${text}</p></main></body></html>`,
  };
}

type Parts = { robots?: string; canonical?: string; head?: string; headings?: string; text?: string; note?: string; linkHeader?: string };

function translatedPage(path: string, englishPath: string, parts: Parts = {}): Served {
  const { robots = "noindex, follow", canonical = `${PROD}${path}`, head = "", headings = "<h1>Titel</h1>", text = words("wort", 40), linkHeader } = parts;
  return {
    path,
    linkHeader,
    html: `<html lang="de"><head><meta name="robots" content="${robots}"/><link rel="canonical" href="${canonical}"/>${head}</head><body><main>${headings}<p>${text}</p>${parts.note ?? note(englishPath)}</main></body></html>`,
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
  it("passes a noindex, self-canonical article with one h1, the note and as many words as the English page", () => {
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
      englishWords: 41,
      percent: 121,
      counter: "space-separated words",
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
    expect(findingsOf({ text: `${words("wort", 40)}</p><p class="hidden">Fünf Wörter für niemanden sichtbar` })).toEqual([
      { rule: "translated-hidden-text", message: "5 words ship hidden (inline style, hidden attribute, hidden class, or breakpoint-hidden class)" },
    ]);
  });

  it("fails a page with half the English words", () => {
    const row = audit(germanArticle({ text: words("wort", 11) }), englishArticle);

    expect(row.findings).toEqual([
      { rule: "translated-dropped-content", message: `21 main-content words (space-separated words), 51% of the 41 on ${ARTICLE}, floor 70%` },
    ]);
  });

  it("passes a page at exactly 70 percent of the English words and fails one word under", () => {
    const english = englishPage(ARTICLE, ARTICLE_SCHEMA, words("word", 99));

    expect(audit(germanArticle({ text: words("wort", 60) }), english).findings).toEqual([]);
    expect(audit(germanArticle({ text: words("wort", 59) }), english).findings).toEqual([
      { rule: "translated-dropped-content", message: `69 main-content words (space-separated words), 69% of the 100 on ${ARTICLE}, floor 70%` },
    ]);
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

    expect({ words: row.words, englishWords: row.englishWords, counter: row.counter, findings: row.findings }).toEqual({
      words: 9,
      englishWords: 10,
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
  const row = (path: string, locale: string, wordCount: number, englishWords: number, counter: string): Partial<Row> & { locale: string } => ({
    path,
    locale,
    english: path.replace(`/${locale}`, ""),
    words: wordCount,
    englishWords,
    percent: Math.floor((wordCount * 100) / englishWords),
    counter,
    owesNote: path.includes("/articles"),
    findings: [],
  });
  const rows = [
    row("/de/leaderboard", "de", 541, 525, "space-separated words"),
    row("/fi/articles", "fi", 296, 385, "space-separated words"),
    row("/ja/articles", "ja", 597, 385, "Intl.Segmenter word segments"),
    row("/zh-CN/articles", "zh-CN", 479, 385, "Intl.Segmenter word segments"),
  ];

  it("says how many pages were checked, which counter read which locales, and the lowest share", () => {
    expect(JSON.parse(runAudit(`JSON.stringify(audit.translatedLines(${JSON.stringify(rows)}))`))).toEqual([
      "translated pages (noindex under a locale prefix): 4 checked against their English pages, 3 of them owing a translation note",
      "  words counted as Intl.Segmenter word segments in ja, zh-CN and as space-separated words in de, fi",
      "  lowest share of the English word count: 76% on /fi/articles (296 of 385), floor 70%",
      "  under 300 words, reported and not failed: /fi/articles 296",
    ]);
  });

  it("leaves out the thin-page line when every page has 300 words", () => {
    expect(JSON.parse(runAudit(`JSON.stringify(audit.translatedLines(${JSON.stringify(rows.filter((r) => r.locale !== "fi"))}))`))).toEqual([
      "translated pages (noindex under a locale prefix): 3 checked against their English pages, 2 of them owing a translation note",
      "  words counted as Intl.Segmenter word segments in ja, zh-CN and as space-separated words in de",
      "  lowest share of the English word count: 103% on /de/leaderboard (541 of 525), floor 70%",
    ]);
  });

  it("says so when no page is served in translation", () => {
    expect(JSON.parse(runAudit(`JSON.stringify(audit.translatedLines([]))`))).toEqual(["translated pages (noindex under a locale prefix): none served, so none checked"]);
  });
});
