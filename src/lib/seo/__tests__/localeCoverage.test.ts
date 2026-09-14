import fs from "node:fs";
import path from "node:path";

import sitemap from "@/app/sitemap";
import { LOCALES, DEFAULT_LOCALE } from "@/i18n/routing";
import {
  EN_LEARN_PAGES,
  hasLearnTranslation,
  reviewedLearnLocales,
} from "@/lib/seo/learn";

const PROSE_DIR = path.join(process.cwd(), "src/lib/seo/learn/prose");
const NON_DEFAULT_LOCALES = LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
);

describe("locale coverage", () => {
  it("ships translated Learn prose for every locale, and vouches only for reviewed ones", () => {
    for (const locale of NON_DEFAULT_LOCALES) {
      expect(fs.existsSync(path.join(PROSE_DIR, `${locale}.json`))).toBe(true);
      expect(hasLearnTranslation(locale)).toBe(true);
    }
    expect(reviewedLearnLocales()).toEqual([DEFAULT_LOCALE]);
  });

  it("keeps every prose file aligned with the English article order", () => {
    const englishSlugs = EN_LEARN_PAGES.map((page) => page.slug);

    for (const locale of NON_DEFAULT_LOCALES) {
      const prose = JSON.parse(
        fs.readFileSync(path.join(PROSE_DIR, `${locale}.json`), "utf8"),
      ) as Array<{ slug: string }>;

      // The overlay is positional: a reordered or short file would silently
      // graft one article's prose onto another article's routing data.
      expect(prose.map((article) => article.slug)).toEqual(englishSlugs);
    }
  });

  it("lists the app in every locale but Learn only in reviewed ones", async () => {
    const entries = await sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    for (const locale of NON_DEFAULT_LOCALES) {
      expect(urls).toContain(`https://thememorychess.com/${locale}/game`);
      expect(urls).not.toContain(`https://thememorychess.com/${locale}/learn`);

      for (const page of EN_LEARN_PAGES) {
        expect(urls).not.toContain(
          `https://thememorychess.com/${locale}/learn/${page.slug}`,
        );
      }
    }
  });

  it("keeps English-only routes out of the localized matrix", async () => {
    const entries = await sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    expect(urls).toContain("https://thememorychess.com/privacy");
    for (const locale of NON_DEFAULT_LOCALES) {
      expect(urls).not.toContain(
        `https://thememorychess.com/${locale}/privacy`,
      );
    }
  });
});
