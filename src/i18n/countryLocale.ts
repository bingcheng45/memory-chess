import type { Locale } from "./routing";

/**
 * Country -> locale hints, used only as a last resort when a visitor's browser
 * sends no usable `Accept-Language` (see src/middleware.ts). The browser
 * header is a statement of preference; geography is only a guess, so it never
 * overrides one.
 *
 * Two deliberate omissions, both cases where the obvious mapping would be
 * wrong:
 *
 * - India and Singapore are NOT mapped to Hindi or Chinese. Both are large
 *   real audiences here, and both browse chess sites in English. Switching
 *   them out of English on the strength of an IP would make the product worse
 *   for the people it would affect most.
 * - Taiwan, Hong Kong and Macau are NOT mapped to zh-CN. They read Traditional
 *   characters; serving Simplified is not a neutral fallback.
 */
export const COUNTRY_LOCALE_HINTS: Readonly<Record<string, Locale>> = {
  // Spanish
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es",
  UY: "es", BO: "es", PY: "es", EC: "es", GT: "es", CR: "es", PA: "es",
  DO: "es", SV: "es", HN: "es", NI: "es", CU: "es", PR: "es",

  // Portuguese (only pt-BR ships; PT/AO/MZ get the closest available)
  BR: "pt-BR", PT: "pt-BR", AO: "pt-BR", MZ: "pt-BR",

  // Russian. Central Asia and the Caucasus are included because Russian is the
  // regional lingua franca and none of those national languages ship yet --
  // Uzbekistan alone is a top-10 source of traffic.
  RU: "ru", BY: "ru", KZ: "ru", KG: "ru", UZ: "ru", TJ: "ru", TM: "ru",
  AM: "ru", AZ: "ru", MD: "ru", GE: "ru",

  // German
  DE: "de", AT: "de", CH: "de", LI: "de",

  // French
  FR: "fr", BE: "fr", MC: "fr", LU: "fr", SN: "fr", CI: "fr", CM: "fr",
  NC: "fr", PF: "fr", GA: "fr", ML: "fr", BF: "fr", NE: "fr", TG: "fr",
  BJ: "fr", MG: "fr",

  // Italian
  IT: "it", SM: "it", VA: "it",

  // Simplified Chinese
  CN: "zh-CN",

  // Turkish
  TR: "tr",
};

/** Crawlers skip geo detection so a bot's exit IP cannot decide what gets indexed. */
const CRAWLER_PATTERN =
  /bot|crawler|spider|crawling|googlebot|bingbot|yandex|duckduck|baidu|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora|pinterest|whatsapp|telegram/i;

export function isCrawler(userAgent: string | null): boolean {
  return Boolean(userAgent && CRAWLER_PATTERN.test(userAgent));
}

export function localeForCountry(
  country: string | null | undefined,
): Locale | undefined {
  if (!country) return undefined;
  return COUNTRY_LOCALE_HINTS[country.toUpperCase()];
}
