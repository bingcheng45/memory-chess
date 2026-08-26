import { defineRouting } from "next-intl/routing";

/**
 * The ten locales Memory Chess ships. Ordered by expected audience size for a
 * chess product: US/global English first, then the markets that dominate
 * chess participation (Spain and LatAm, Russia, Brazil, Germany, France) and
 * the large-but-casual markets (India, China, Turkey).
 *
 * Arabic is deliberately absent from v1 -- RTL needs a bidirectional pass over
 * the board, coordinates and result screens before it can ship credibly.
 */
export const LOCALES = [
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
  "zh-CN": "中文",
  tr: "Türkçe",
};

/**
 * Short badge shown inside the circular switcher button. Region-qualified
 * locales collapse to the region ("BR", "CN") because that is what
 * distinguishes them to a reader, not the language half.
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
};

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // English keeps its bare URLs (`/game`, `/learn/...`) so every existing
  // indexed page and backlink survives the restructure untouched.
  localePrefix: "as-needed",
});
