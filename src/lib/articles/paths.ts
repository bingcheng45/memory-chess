import { DEFAULT_LOCALE } from "@/i18n/routing";
import { localizedUrl } from "@/lib/seo/alternates";

export const ARTICLES_PATH = "/articles";

export function articlePath(slug: string): string {
  return `${ARTICLES_PATH}/${slug}`;
}

export function absoluteUrl(path: string): string {
  return localizedUrl(path, DEFAULT_LOCALE);
}
