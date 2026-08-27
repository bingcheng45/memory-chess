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

const SITE_URL = "https://thememorychess.com";

/**
 * Absolute locale-prefixed URL for a route.
 *
 * The home page stays bare (`https://thememorychess.com`, no trailing slash)
 * for English, because that is the identifier the site has always published in
 * its structured data and changing it would fork the entity graph.
 */
export function localizedUrl(path: string, locale: string): string {
  const localized = localizedPath(path, locale);
  return localized === "/" ? SITE_URL : `${SITE_URL}${localized}`;
}

/**
 * BCP-47 tag for schema.org `inLanguage` and the `lang` attribute.
 *
 * Every locale we ship is already a valid tag. English is qualified to `en-US`
 * because that is what the site has always published and what the source copy
 * is written in.
 */
export function languageTag(locale: string): string {
  return locale === DEFAULT_LOCALE ? "en-US" : locale;
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
