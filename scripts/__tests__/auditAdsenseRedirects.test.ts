/** @jest-environment node */

import { runAudit } from "./runAudit";

describe("audit-adsense single-308 redirect chain", () => {
  const LOCAL = "http://127.0.0.1:4517";
  type Hop = { url: string; status: number; location: string | null };
  const hop = (path: string, status: number, location: string | null = null): Hop => ({ url: `${LOCAL}${path}`, status, location });

  function problemFor(expectedPath: string, hops: Hop[]): string | null {
    return JSON.parse(runAudit(`JSON.stringify(audit.redirectProblem(${JSON.stringify(hops)}, ${JSON.stringify(`${LOCAL}${expectedPath}`)}))`));
  }

  it("passes one 308 to the expected URL when that URL answers 200", () => {
    expect(problemFor("/de/game", [hop("/de/game/", 308, "/de/game"), hop("/de/game", 200)])).toBeNull();
  });

  it("fails a 308 whose target answers 308 again", () => {
    expect(problemFor("/de/about", [hop("/de/about/", 308, "/de/about"), hop("/de/about", 308, "/about"), hop("/about", 200)])).toBe(
      `${LOCAL}/de/about answers 308, expected 200`,
    );
  });

  it("fails a 308 to a different URL than expected", () => {
    expect(problemFor("/about", [hop("/de/about/", 308, "/de/about"), hop("/de/about", 308, "/about"), hop("/about", 200)])).toBe(
      `redirects to ${LOCAL}/de/about, expected ${LOCAL}/about`,
    );
  });

  it("fails a 307", () => {
    expect(problemFor("/de/game", [hop("/de/game/", 307, "/de/game"), hop("/de/game", 200)])).toBe("answers 307, expected 308");
  });

  it("fails a 200 that does not redirect", () => {
    expect(problemFor("/de/game", [hop("/de/game/", 200)])).toBe("answers 200, expected 308");
  });
});

describe("audit-adsense locale-prefix pairs", () => {
  const PROD = "https://thememorychess.com";
  const LOCAL = "http://127.0.0.1:4517";
  const ARTICLE = "/articles/magnus-carlsen";
  const alternate = (lang: string, path: string) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${PROD}${path}" />`;
  const entry = (path: string, alternates = "") => `<url><loc>${PROD}${path}</loc>${alternates}<priority>1</priority></url>`;
  const sitemap = [
    '<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    entry("/", [alternate("en", "/"), alternate("de", "/de"), alternate("pt-BR", "/pt-BR"), alternate("x-default", "/")].join("")),
    entry("/de", [alternate("en", "/"), alternate("de", "/de"), alternate("pt-BR", "/pt-BR"), alternate("x-default", "/")].join("")),
    entry("/about"),
    entry("/leaderboard"),
    entry(ARTICLE),
    entry("/privacy"),
    "</urlset>",
  ].join("");
  const canonicals = {
    [`${LOCAL}/about`]: `${PROD}/about`,
    [`${LOCAL}/leaderboard`]: `${PROD}/leaderboard`,
    [`${LOCAL}${ARTICLE}`]: `${PROD}${ARTICLE}`,
    [`${LOCAL}/privacy`]: `${PROD}/`,
  };

  type Probe = { url: string; status: number; robots: string; canonical: string | null };
  type Pair = { url: string; locale: string; prefixed: string };
  type Case = { url: string; expected: string };
  const probe = (prefixedPath: string, status: number, robots = "", canonical: string | null = null): Probe => ({
    url: `${LOCAL}${prefixedPath}`,
    status,
    robots,
    canonical,
  });
  const translated = (prefixedPath: string) => probe(prefixedPath, 200, "noindex, follow", `${PROD}${prefixedPath}`);
  const pair = (path: string, locale: string): Pair => ({ url: `${LOCAL}${path}`, locale, prefixed: `${LOCAL}/${locale}${path}` });
  const bothSpellings = (path: string, locale: string): Case[] => [
    { url: `${LOCAL}/${locale}${path}`, expected: `${LOCAL}${path}` },
    { url: `${LOCAL}/${locale}${path}/`, expected: `${LOCAL}${path}` },
  ];
  const translatedLeaderboard = [translated("/de/leaderboard"), translated("/pt-BR/leaderboard")];

  function derive(xml: string, probes: Probe[]) {
    const byUrl = Object.fromEntries(probes.map((p) => [p.url, p]));
    return JSON.parse(
      runAudit(
        `(() => { const entries = audit.parseSitemap(${JSON.stringify(xml)}); const locales = audit.prefixLocales(entries); const candidates = audit.englishOnlyCandidates(entries, ${JSON.stringify(canonicals)}); const pairs = audit.localePairs(candidates, locales); const owed = audit.pairsOwedARedirect(pairs, ${JSON.stringify(byUrl)}); return JSON.stringify({ urls: entries.map((e) => e.url), locales, candidates, pairs, owed, cases: audit.localeRedirectCases(owed), coverage: audit.localeCoverageProblem(locales, pairs, owed) }); })()`,
      ),
    ) as { urls: string[]; locales: string[]; candidates: string[]; pairs: Pair[]; owed: Pair[]; cases: Case[]; coverage: string | null };
  }

  function coverageProblem(locales: string[], pairs: Pair[], owed: Pair[]): string | null {
    return JSON.parse(runAudit(`JSON.stringify(audit.localeCoverageProblem(${JSON.stringify(locales)}, ${JSON.stringify(pairs)}, ${JSON.stringify(owed)}))`));
  }

  it("pairs every sitemap URL that has no alternates and a bare canonical with every locale prefix", () => {
    const result = derive(sitemap, []);

    expect(result.urls).toEqual([`${LOCAL}/`, `${LOCAL}/de`, `${LOCAL}/about`, `${LOCAL}/leaderboard`, `${LOCAL}${ARTICLE}`, `${LOCAL}/privacy`]);
    expect(result.locales).toEqual(["de", "pt-BR"]);
    expect(result.candidates).toEqual([`${LOCAL}/about`, `${LOCAL}/leaderboard`, `${LOCAL}${ARTICLE}`]);
    expect(result.pairs).toEqual([
      pair("/about", "de"),
      pair("/about", "pt-BR"),
      pair("/leaderboard", "de"),
      pair("/leaderboard", "pt-BR"),
      pair(ARTICLE, "de"),
      pair(ARTICLE, "pt-BR"),
    ]);
  });

  it("skips a page in the locale that serves it in translation and still demands the redirect in a locale that does not", () => {
    const result = derive(sitemap, [...translatedLeaderboard, probe("/de/about", 308), probe("/pt-BR/about", 308), translated(`/de${ARTICLE}`), probe(`/pt-BR${ARTICLE}`, 308)]);

    expect(result.owed).toEqual([pair("/about", "de"), pair("/about", "pt-BR"), pair(ARTICLE, "pt-BR")]);
    expect(result.cases).toEqual([...bothSpellings("/about", "de"), ...bothSpellings("/about", "pt-BR"), ...bothSpellings(ARTICLE, "pt-BR")]);
    expect(result.coverage).toBeNull();
  });

  it("does not let the first locale's redirect demand one from a later locale that serves the page in translation", () => {
    const result = derive(sitemap, [...translatedLeaderboard, probe("/de/about", 308), probe("/pt-BR/about", 308), probe(`/de${ARTICLE}`, 308), translated(`/pt-BR${ARTICLE}`)]);

    expect(result.owed).toEqual([pair("/about", "de"), pair("/about", "pt-BR"), pair(ARTICLE, "de")]);
  });

  it("fails a pair that is neither served in translation nor redirected", () => {
    const englishUnderPrefix = probe(`/pt-BR${ARTICLE}`, 200, "index, follow", `${PROD}${ARTICLE}`);
    const result = derive(sitemap, [...translatedLeaderboard, translated(`/de${ARTICLE}`), englishUnderPrefix]);
    const checked = result.cases.find((c) => c.url === englishUnderPrefix.url);

    expect(checked).toEqual({ url: `${LOCAL}/pt-BR${ARTICLE}`, expected: `${LOCAL}${ARTICLE}` });
    expect(
      JSON.parse(runAudit(`JSON.stringify(audit.redirectProblem(${JSON.stringify([{ url: englishUnderPrefix.url, status: 200, location: null }])}, ${JSON.stringify(checked?.expected)}))`)),
    ).toBe("answers 200, expected 308");
  });

  it("keeps a translated article that lost its noindex, though it is canonical to itself", () => {
    const indexableTranslation = probe(`/de${ARTICLE}`, 200, "index, follow", `${PROD}/de${ARTICLE}`);
    const result = derive(sitemap, [...translatedLeaderboard, probe("/de/about", 308), probe("/pt-BR/about", 308), indexableTranslation, translated(`/pt-BR${ARTICLE}`)]);

    expect(result.owed).toEqual([pair("/about", "de"), pair("/about", "pt-BR"), pair(ARTICLE, "de")]);
    expect(result.cases).toContainEqual({ url: `${LOCAL}/de${ARTICLE}`, expected: `${LOCAL}${ARTICLE}` });
  });

  it("keeps a pair answering 404, and a pair that was never probed", () => {
    const result = derive(sitemap, [...translatedLeaderboard, probe("/de/about", 404), translated(`/de${ARTICLE}`), translated(`/pt-BR${ARTICLE}`)]);

    expect(result.owed).toEqual([pair("/about", "de"), pair("/about", "pt-BR")]);
  });

  it.each([
    ["a 200 with noindex and a self canonical", probe(`/de${ARTICLE}`, 200, "noindex, follow", `${PROD}/de${ARTICLE}`), true],
    ["a 200 with noindex alone", probe(`/de${ARTICLE}`, 200, "noindex", `${PROD}${ARTICLE}`), true],
    ["an indexable 200 with a self canonical", probe(`/de${ARTICLE}`, 200, "index, follow", `${PROD}/de${ARTICLE}`), false],
    ["a 200 with neither noindex nor a self canonical", probe(`/de${ARTICLE}`, 200, "index, follow", `${PROD}${ARTICLE}`), false],
    ["a 404 that says noindex", probe(`/de${ARTICLE}`, 404, "noindex", null), false],
  ])("reads %s as served in translation or not", (_, answer, expected) => {
    expect(JSON.parse(runAudit(`JSON.stringify(audit.servedInTranslation(${JSON.stringify(answer)}))`))).toBe(expected);
  });

  it("reads alternates whose attributes come in another order", () => {
    const reordered = sitemap.replace(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)" \/>/g, '<xhtml:link href="$2" hreflang="$1" rel="alternate"/>');

    expect(reordered).not.toBe(sitemap);
    expect(derive(reordered, []).locales).toEqual(["de", "pt-BR"]);
  });

  it("reports a problem when the sitemap yields no locale prefixes", () => {
    expect(coverageProblem([], [], [])).toBe("the sitemap alternates name no prefixed locale, so no locale prefix was checked");
  });

  it("reports a problem when every pair is served in translation, so the check would pass having checked nothing", () => {
    expect(coverageProblem(["de"], [pair("/leaderboard", "de"), pair(ARTICLE, "de")], [])).toBe(
      "all 2 page and locale pairs are served in translation, so no locale prefix redirect was checked",
    );
  });

  it("reports nothing when at least one pair owes a redirect", () => {
    expect(coverageProblem(["de"], [pair("/about", "de"), pair(ARTICLE, "de")], [pair("/about", "de")])).toBeNull();
  });

  it("prints how many pairs were checked and how many were skipped", () => {
    const summary = runAudit(`audit.redirectSummary(${JSON.stringify({ slashChecked: 95, localeChecked: 1050, pairs: 552, servedInTranslation: 27, locales: 23 })})`);

    expect(summary).toBe(
      "single-308 redirects (G28 crawlable canonical URLs): 95 slashed sitemap URLs, 1050 locale-prefixed URLs (525 of 552 page and locale pairs x 2, across 23 locales; 27 pairs served in translation and skipped)",
    );
  });
});

describe("audit-adsense single-308 checks against a stubbed site", () => {
  const PROD = "https://thememorychess.com";
  const LOCAL = "http://127.0.0.1:4517";
  const ARTICLE = "/articles/magnus-carlsen";
  const page = (canonicalPath: string, robots = "index, follow") =>
    `<html><head><meta name="robots" content="${robots}"/><link rel="canonical" href="${PROD}${canonicalPath}"/></head></html>`;
  const redirect = (to: string) => ({ status: 308, location: to });
  const served = (canonicalPath: string, robots?: string) => ({ status: 200, body: page(canonicalPath, robots) });
  const translated = (prefixedPath: string) => served(prefixedPath, "noindex, follow");
  type Answer = { status: number; location?: string; body?: string };

  const SITE: Record<string, Answer> = {
    "/about": served("/about"),
    "/about/": redirect("/about"),
    "/de/about": redirect("/about"),
    "/de/about/": redirect("/about"),
    "/fr/about": redirect("/about"),
    "/fr/about/": redirect("/about"),
    "/leaderboard": served("/leaderboard"),
    "/leaderboard/": redirect("/leaderboard"),
    "/de/leaderboard": translated("/de/leaderboard"),
    "/fr/leaderboard": translated("/fr/leaderboard"),
    [ARTICLE]: served(ARTICLE),
    [`${ARTICLE}/`]: redirect(ARTICLE),
    [`/de${ARTICLE}`]: translated(`/de${ARTICLE}`),
    [`/fr${ARTICLE}`]: redirect(ARTICLE),
    [`/fr${ARTICLE}/`]: redirect(ARTICLE),
  };
  const alternates = ["en", "de", "fr"].map((lang) => ({ lang, href: `${PROD}${lang === "en" ? "/" : `/${lang}`}` }));
  const entries = [
    { url: `${LOCAL}/`, alternates },
    ...["/about", "/leaderboard", ARTICLE].map((path) => ({ url: `${LOCAL}${path}`, alternates: [] })),
  ];
  const pages = ["/about", "/leaderboard", ARTICLE].map((path) => ({ url: `${LOCAL}${path}`, canonical: `${PROD}${path}` }));

  function check(site: Record<string, Answer>) {
    const program = `await (async () => {
      const site = ${JSON.stringify(site)};
      globalThis.fetch = async (url) => {
        const answer = site[new URL(url).pathname] ?? { status: 404 };
        return new Response(answer.body ?? null, { status: answer.status, headers: answer.location ? { location: answer.location } : {} });
      };
      return JSON.stringify(await audit.singleRedirects(${JSON.stringify(entries)}, ${JSON.stringify(pages)}));
    })()`;
    return JSON.parse(runAudit(program)) as {
      slashChecked: number;
      localeChecked: number;
      pairs: number;
      servedInTranslation: number;
      locales: number;
      problems: Array<{ rule: string; message: string }>;
    };
  }

  it("passes a site where each locale either serves a page in translation or redirects it in one 308", () => {
    expect(check(SITE)).toEqual({ slashChecked: 3, localeChecked: 6, pairs: 6, servedInTranslation: 3, locales: 2, problems: [] });
  });

  it("fails the locale that serves the English article under its prefix, though the first locale serves a translation", () => {
    const result = check({ ...SITE, [`/fr${ARTICLE}`]: served(ARTICLE), [`/fr${ARTICLE}/`]: redirect(`/fr${ARTICLE}`) });

    expect(result.servedInTranslation).toBe(3);
    expect(result.problems.map(({ rule, message }) => ({ rule, message }))).toEqual([
      { rule: "locale-prefix-redirect", message: `/fr${ARTICLE} answers 200, expected 308; chain /fr${ARTICLE} 200` },
      {
        rule: "locale-prefix-redirect",
        message: `/fr${ARTICLE}/ redirects to ${LOCAL}/fr${ARTICLE}, expected ${LOCAL}${ARTICLE}; chain /fr${ARTICLE}/ 308 -> /fr${ARTICLE} 200`,
      },
    ]);
  });

  it("fails a translated article that is indexable and names its URL", () => {
    const result = check({ ...SITE, [`/de${ARTICLE}`]: served(`/de${ARTICLE}`), [`/de${ARTICLE}/`]: redirect(`/de${ARTICLE}`) });

    expect(result.servedInTranslation).toBe(2);
    expect(result.problems.map(({ rule, message }) => ({ rule, message }))).toEqual([
      { rule: "locale-prefix-redirect", message: `/de${ARTICLE} answers 200, expected 308; chain /de${ARTICLE} 200` },
      {
        rule: "locale-prefix-redirect",
        message: `/de${ARTICLE}/ redirects to ${LOCAL}/de${ARTICLE}, expected ${LOCAL}${ARTICLE}; chain /de${ARTICLE}/ 308 -> /de${ARTICLE} 200`,
      },
    ]);
  });

  it("fails the first locale too when it stops serving its translation and does not redirect", () => {
    const result = check({ ...SITE, [`/de${ARTICLE}`]: { status: 404 } });

    expect(result.servedInTranslation).toBe(2);
    expect(result.problems.map(({ message }) => message)).toEqual([
      `/de${ARTICLE} answers 404, expected 308; chain /de${ARTICLE} 404`,
      `/de${ARTICLE}/ answers 404, expected 308; chain /de${ARTICLE}/ 404`,
    ]);
  });

  it("fails when every pair is served in translation, having checked no redirect", () => {
    const everywhere = Object.fromEntries(
      ["de", "fr"].flatMap((locale) => ["/about", "/leaderboard", ARTICLE].map((path) => [`/${locale}${path}`, translated(`/${locale}${path}`)])),
    );
    const result = check({ ...SITE, ...everywhere });

    expect(result.localeChecked).toBe(0);
    expect(result.problems.map(({ rule, message }) => ({ rule, message }))).toEqual([
      { rule: "locale-prefix-redirect", message: "all 6 page and locale pairs are served in translation, so no locale prefix redirect was checked" },
    ]);
  });
});
