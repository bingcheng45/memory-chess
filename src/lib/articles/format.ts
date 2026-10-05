import { languageTag } from "@/lib/seo/alternates";

const ARTICLE_DATE_PARTS = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" } as const;

export function formatArticleDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(languageTag(locale), ARTICLE_DATE_PARTS).format(new Date(iso));
}

export function formatCount(count: number, locale: string): string {
  return new Intl.NumberFormat(languageTag(locale)).format(count);
}
