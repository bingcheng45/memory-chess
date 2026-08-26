import type { Metadata } from "next";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n/routing";

/**
 * Builds the locale-prefixed pathname for a route.
 *
 * Mirrors next-intl's `localePrefix: "as-needed"`: English keeps the bare path
 * so previously indexed URLs and inbound links never move, every other locale
 * gets a prefix.
 */
export function localizedPath(path: string, locale: string): string {
  const normalized = path === "/" ? "" : path;
  return locale === DEFAULT_LOCALE
    ? normalized || "/"
    : `/${locale}${normalized}`;
}

/**
 * hreflang block for a single route across all locales, plus the canonical for
 * the locale currently being rendered.
 *
 * `x-default` points at English: it is the fallback Google serves when no
 * hreflang matches the user, and it is the only locale guaranteed to be
 * complete.
 */
export function buildAlternates(
  path: string,
  currentLocale: string,
): Metadata["alternates"] {
  const languages = Object.fromEntries(
    LOCALES.map((locale: Locale) => [locale, localizedPath(path, locale)]),
  ) as Record<string, string>;

  return {
    canonical: localizedPath(path, currentLocale),
    languages: {
      ...languages,
      "x-default": localizedPath(path, DEFAULT_LOCALE),
    },
  };
}
