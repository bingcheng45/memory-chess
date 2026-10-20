import { languageTag } from "@/lib/seo/alternates";

const READING_ZONE = "Asia/Singapore";
const isoDate = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: READING_ZONE });

export function readingDateTime(iso: string): string {
  return isoDate.format(new Date(iso));
}

export function readingDateLabel(iso: string, locale: string): string {
  const format = { month: "long", day: "numeric", year: "numeric", timeZone: READING_ZONE } as const;
  return new Intl.DateTimeFormat(languageTag(locale), format).format(new Date(iso));
}
