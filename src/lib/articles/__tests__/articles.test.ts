import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  ARTICLES,
  ARTICLES_LAST_UPDATED,
  ARTICLE_SLUGS,
  FACT_ROWS,
  getArticle,
  getArticleSummaries,
  getNextArticle,
  newestFirst,
  summarize,
  type Article,
} from "@/lib/articles";
import { GAME_CONFIG_RULES, parseGameSettings } from "@/lib/game/configPrefill";
import { MIN_OWN_SECTIONS, makeArticle } from "./fixtures";
import messages from "../../../../messages/en.json";

const TITLE_MAX_CHARS = 60;
const DESCRIPTION_MIN_CHARS = 120;
const DESCRIPTION_MAX_CHARS = 155;
const BODY_MIN_WORDS = 900;
const BODY_MAX_WORDS = 1300;
const MAX_SENTENCE_WORDS = 28;
const MIN_SOURCES = 3;
const MAX_ENTRIES_PER_HEADING = 3;
const MIN_REPEAT_WORDS = 5;
const MAX_PORTRAIT_BYTES = 160_000;
const PORTRAIT_ASPECT = 4 / 5;
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LONG_DASHES = [0x2013, 0x2014].map((code) => String.fromCharCode(code));

const MAX_LOCAL_DATE_LEAD_OVER_UTC_MS = 24 * 60 * 60 * 1000;

const wordsIn = (text: string) => text.split(/\s+/).filter(Boolean);
const sentencesIn = (text: string) =>
  text
    .split(/(?<=[.!?]["')]?)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
const bodyOf = (article: Article) => article.sections.flatMap((section) => section.paragraphs);
const proseOf = (article: Article) => [
  article.description,
  article.drill.why,
  ...bodyOf(article),
  ...article.sources.map((source) => source.note),
];

describe("the article registry", () => {
  it("publishes at least one article, each under its own slug", () => {
    expect(ARTICLES.length).toBeGreaterThan(0);
    expect(new Set(ARTICLE_SLUGS).size).toBe(ARTICLES.length);
    expect(ARTICLE_SLUGS).toEqual(ARTICLES.map((article) => article.slug));
  });

  it("lists the newest article first and keeps registry order on a date tie", () => {
    const older = makeArticle(0, { publishedAt: "2026-01-01T00:00:00.000Z" });
    const newer = makeArticle(1, { publishedAt: "2026-02-01T00:00:00.000Z" });
    const tiedFirst = makeArticle(2, { publishedAt: "2026-02-01T00:00:00.000Z" });
    const registry = [older, newer, tiedFirst];

    expect(newestFirst(registry).map((article) => article.slug)).toEqual([
      newer.slug,
      tiedFirst.slug,
      older.slug,
    ]);
    expect(registry[0]).toBe(older);
    expect(ARTICLES.map((article) => article.slug)).toEqual(
      newestFirst(ARTICLES).map((article) => article.slug),
    );
  });

  it("finds an English article by slug, as the entry itself, and nothing for an unknown one", async () => {
    expect(await getArticle(ARTICLES[0].slug, "en")).toBe(ARTICLES[0]);
    expect(await getArticle("no-such-article", "en")).toBeUndefined();
  });

  it("keeps the bodies out of the summaries the list ships to the browser", async () => {
    const summaries = await getArticleSummaries("en");

    expect(Object.keys(summarize(makeArticle(0), "en")).sort()).toEqual(
      ["description", "person", "photo", "publishedAt", "publishedLabel", "slug", "title"],
    );
    expect(Object.keys(summarize(makeArticle(0), "en").photo).sort()).toEqual(["alt", "height", "src", "width"]);
    expect(summaries.map((summary) => summary.slug)).toEqual(ARTICLE_SLUGS);
    for (const summary of summaries) {
      expect(summary).not.toHaveProperty("sections");
      expect(summary).not.toHaveProperty("sources");
    }
  });

  it("prints the date of a summary on the server, in the language of the page", () => {
    const article = makeArticle(0, { publishedAt: "2026-10-03T00:00:00.000Z" });

    expect(summarize(article, "en").publishedLabel).toBe("Oct 3, 2026");
    expect(summarize(article, "de").publishedLabel).toBe("3. Okt. 2026");
  });

  it("leads each article to the next older one and wraps at the end", async () => {
    expect(await getNextArticle("no-such-article", "en")).toBeUndefined();

    for (const [index, article] of ARTICLES.entries()) {
      const next = await getNextArticle(article.slug, "en");
      if (ARTICLES.length === 1) {
        expect(next).toBeUndefined();
      } else {
        expect(next?.slug).toBe(ARTICLES[(index + 1) % ARTICLES.length].slug);
      }
    }
  });

  it("dates the list by its most recent edit", () => {
    expect(ARTICLES_LAST_UPDATED).toBe(
      [...ARTICLES.map((article) => article.updatedAt)].sort().at(-1),
    );
  });

  it("holds back the Timur Gareyev profile", async () => {
    expect(await getArticle("timur-gareyev", "en")).toBeUndefined();
    expect(existsSync(join(process.cwd(), "public/images/articles/timur-gareyev.jpg"))).toBe(false);
  });
});

describe.each(ARTICLES.map((article) => [article.slug, article] as const))("article %s", (_, article) => {
  it("has a URL-safe slug", () => {
    expect(article.slug).toMatch(SLUG_PATTERN);
  });

  it("has a title and a description that fit a search result", () => {
    expect(article.title.length).toBeGreaterThan(0);
    expect(article.title.length).toBeLessThanOrEqual(TITLE_MAX_CHARS);
    expect(article.description.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN_CHARS);
    expect(article.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX_CHARS);
  });

  it("carries real ISO dates, published no later than updated and neither ahead of every local clock", () => {
    for (const date of [article.publishedAt, article.updatedAt]) {
      expect(new Date(date).toISOString()).toBe(date);
      expect(new Date(date).getTime()).toBeLessThanOrEqual(Date.now() + MAX_LOCAL_DATE_LEAD_OVER_UTC_MS);
    }
    expect(article.publishedAt <= article.updatedAt).toBe(true);
  });

  it("names the person", () => {
    expect(article.person.name.trim()).not.toBe("");
    expect(article.person.role.trim()).not.toBe("");
  });

  it(`has a body of ${BODY_MIN_WORDS} to ${BODY_MAX_WORDS} words in at least ${MIN_OWN_SECTIONS} sections`, () => {
    const words = wordsIn(bodyOf(article).join(" ")).length;

    expect(words).toBeGreaterThanOrEqual(BODY_MIN_WORDS);
    expect(words).toBeLessThanOrEqual(BODY_MAX_WORDS);
    expect(article.sections.length).toBeGreaterThanOrEqual(MIN_OWN_SECTIONS);
    for (const section of article.sections) {
      expect(section.heading.trim()).not.toBe("");
      expect(section.paragraphs.length).toBeGreaterThan(0);
    }
  });

  it(`has no sentence over ${MAX_SENTENCE_WORDS} words`, () => {
    const tooLong = [article.description, article.drill.why, ...bodyOf(article)]
      .flatMap(sentencesIn)
      .filter((sentence) => wordsIn(sentence).length > MAX_SENTENCE_WORDS);

    expect(tooLong).toEqual([]);
  });

  it("holds no angle bracket anywhere, since the page prints the entry inside a script element", () => {
    expect(JSON.stringify(article)).not.toMatch(/[<>]/);
  });

  it("keeps its paragraphs plain text with no long dashes", () => {
    for (const paragraph of [...bodyOf(article), ...article.sections.map((section) => section.heading)]) {
      expect(paragraph).toBe(paragraph.trim());
      expect(paragraph).not.toMatch(/[*_`<>\[\]]/);
      for (const dash of LONG_DASHES) expect(paragraph).not.toContain(dash);
    }
  });

  it(`cites at least ${MIN_SOURCES} sources, each over https with a note`, () => {
    expect(article.sources.length).toBeGreaterThanOrEqual(MIN_SOURCES);
    expect(new Set(article.sources.map((source) => source.url)).size).toBe(article.sources.length);
    for (const source of article.sources) {
      expect(source.title.trim()).not.toBe("");
      expect(source.note.trim()).not.toBe("");
      expect(new URL(source.url).protocol).toBe("https:");
    }
  });

  it("has a portrait on disk at 4:5 with a full credit", () => {
    const { photo } = article;
    const file = join(process.cwd(), "public", photo.src);

    expect(photo.src).toBe(`/images/articles/${article.slug}.jpg`);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeLessThanOrEqual(MAX_PORTRAIT_BYTES);
    expect(photo.width / photo.height).toBeCloseTo(PORTRAIT_ASPECT, 2);
    expect(photo.alt.trim()).not.toBe("");
    expect(photo.author.trim()).not.toBe("");
    expect(photo.license.trim()).not.toBe("");
    expect(photo.changes.trim()).not.toBe("");
    expect(photo.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    if (photo.licenseUrl !== null) expect(new URL(photo.licenseUrl).protocol).toBe("https:");
  });

  it("fills the four facts every file shows and nothing the table cannot label", () => {
    const labelled = FACT_ROWS.map((row) => row.key as string);

    for (const key of ["born", "country", "knownFor", "memoryFeat"] as const) {
      expect(article.facts[key].trim()).not.toBe("");
    }
    for (const key of Object.keys(article.facts)) expect(labelled).toContain(key);
  });

  it("ends on a drill the game accepts", () => {
    const { pieceCount, memorizeTime, why } = article.drill;

    expect(parseGameSettings({ pieceCount, memorizeTime }, GAME_CONFIG_RULES)).toEqual({
      pieceCount,
      memorizeTime,
    });
    expect(why.trim()).not.toBe("");
  });
});

describe("the fact file table", () => {
  it("lists the facts in the order the file shows them, each with a label in the catalogue", () => {
    expect(FACT_ROWS.map((row) => messages.articles.page.facts[row.key])).toEqual([
      "Born",
      "Died",
      "Country",
      "Title",
      "Peak rating",
      "World Champion",
      "Known for",
      "Memory feat",
    ]);
  });
});

describe("across articles", () => {
  it(`shares no section heading between more than ${MAX_ENTRIES_PER_HEADING} entries`, () => {
    const entriesByHeading = new Map<string, number>();
    for (const article of ARTICLES) {
      for (const heading of new Set(article.sections.map((section) => section.heading))) {
        entriesByHeading.set(heading, (entriesByHeading.get(heading) ?? 0) + 1);
      }
    }

    const overused = [...entriesByHeading].filter(([, count]) => count > MAX_ENTRIES_PER_HEADING);
    expect(overused).toEqual([]);
  });

  it(`repeats no sentence of ${MIN_REPEAT_WORDS} or more words`, () => {
    const slugsBySentence = new Map<string, Set<string>>();
    for (const article of ARTICLES) {
      for (const sentence of proseOf(article).flatMap(sentencesIn)) {
        if (wordsIn(sentence).length < MIN_REPEAT_WORDS) continue;
        slugsBySentence.set(sentence, (slugsBySentence.get(sentence) ?? new Set()).add(article.slug));
      }
    }

    const repeated = [...slugsBySentence]
      .filter(([, slugs]) => slugs.size > 1)
      .map(([sentence, slugs]) => `${[...slugs].join(" + ")}: ${sentence}`);
    expect(repeated).toEqual([]);
  });

  it("gives every article its own title and description", () => {
    expect(new Set(ARTICLES.map((article) => article.title)).size).toBe(ARTICLES.length);
    expect(new Set(ARTICLES.map((article) => article.description)).size).toBe(ARTICLES.length);
  });
});
