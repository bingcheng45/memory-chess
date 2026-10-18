import type { Locale } from "@/i18n/routing";

const TRADITIONAL_TAG = /^zh-(?:tw|hk|mo|hant)(?:-|$)/;

type ChineseLocale = Extract<Locale, "zh-CN" | "zh-TW">;

/**
 * Which Chinese `/zh` should open: the visitor's saved choice, else the first
 * Chinese tag in `Accept-Language` by quality. Traditional tags (zh-TW, zh-HK,
 * zh-MO, zh-Hant) pick zh-TW; anything else, or no Chinese at all, picks zh-CN.
 */
export function chineseLocaleFor(acceptLanguage: string | null, savedLocale?: string): ChineseLocale {
  if (savedLocale === "zh-TW" || savedLocale === "zh-CN") return savedLocale;

  const firstChinese = (acceptLanguage ?? "")
    .split(",")
    .map((part, order) => {
      const [tag = "", ...params] = part.trim().toLowerCase().split(";");
      const q = params.map((param) => /^\s*q=([\d.]+)$/.exec(param)?.[1]).find(Boolean);
      return { tag: tag.trim(), quality: q === undefined ? 1 : Number(q), order };
    })
    .filter(({ tag, quality }) => (tag === "zh" || tag.startsWith("zh-")) && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.order - b.order)[0];

  return firstChinese && TRADITIONAL_TAG.test(firstChinese.tag) ? "zh-TW" : "zh-CN";
}
