import { defineRouting } from "next-intl/routing";

/**
 * The locales Memory Chess ships.
 *
 * The first ten were chosen from chess-participation data; the rest were added
 * from this site's own analytics, where they showed up as real traffic with no
 * language to land in.
 *
 * Arabic and Persian are deliberately absent. Both are right-to-left and need
 * a bidirectional pass over the board, coordinates and result screens before
 * they can ship credibly -- they get their own patch rather than a broken
 * first release.
 */
export const LOCALES = [
  // Chosen from global chess participation
  "en",
  "es",
  "ru",
  "pt-BR",
  "de",
  "fr",
  "hi",
  "it",
  "zh-CN",
  "tr",
  // Added from site analytics
  "sv",
  "nl",
  "pl",
  "id",
  "no",
  "fi",
  "ro",
  "vi",
  "cs",
  "ja",
  "ko",
  "zh-TW",
  "da",
  "hu",
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Native names, shown in the switcher. Never translate these. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ru: "Русский",
  "pt-BR": "Português (BR)",
  de: "Deutsch",
  fr: "Français",
  hi: "हिन्दी",
  it: "Italiano",
  // Qualified as Simplified now that Traditional also ships.
  "zh-CN": "简体中文",
  tr: "Türkçe",
  sv: "Svenska",
  nl: "Nederlands",
  pl: "Polski",
  id: "Bahasa Indonesia",
  no: "Norsk",
  fi: "Suomi",
  ro: "Română",
  vi: "Tiếng Việt",
  cs: "Čeština",
  ja: "日本語",
  ko: "한국어",
  "zh-TW": "繁體中文",
  da: "Dansk",
  hu: "Magyar",
};

/**
 * Short badge shown inside the switcher button. Region-qualified locales
 * collapse to the region ("BR", "CN", "TW") because that is what distinguishes
 * them to a reader, not the language half.
 */
export const LOCALE_BADGES: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  ru: "RU",
  "pt-BR": "BR",
  de: "DE",
  fr: "FR",
  hi: "HI",
  it: "IT",
  "zh-CN": "CN",
  tr: "TR",
  sv: "SV",
  nl: "NL",
  pl: "PL",
  id: "ID",
  no: "NO",
  fi: "FI",
  ro: "RO",
  vi: "VI",
  cs: "CS",
  ja: "JA",
  ko: "KO",
  "zh-TW": "TW",
  da: "DA",
  hu: "HU",
};

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // English keeps its bare URLs (`/game`, `/learn/...`) so every existing
  // indexed page and backlink survives the restructure untouched.
  localePrefix: "as-needed",
});
