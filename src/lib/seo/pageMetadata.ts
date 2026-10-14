import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { loadPage } from "@/lib/pages/load";
import { PAGES } from "@/lib/pages/registry";
import type { PageName } from "@/lib/pages/translatedLocales";
import { localizedPath, localizedUrl } from "@/lib/seo/alternates";
import { socialMetadata } from "@/lib/seo/brand";
import { robotsFor } from "@/lib/seo/englishOnly";

/** A trust page's metadata in `locale`: canonical to its own URL, with no language alternates. */
export async function pageMetadata(name: PageName, locale: Locale): Promise<Metadata> {
  const { text } = await loadPage(name, locale);
  const { route } = PAGES[name];
  const robots = robotsFor(route, locale);

  return {
    title: text.meta.title,
    description: text.meta.description,
    alternates: { canonical: localizedPath(route, locale) },
    // An `undefined` robots key would erase the layout's own robots, so the English page carries no key at all.
    ...(robots ? { robots } : {}),
    ...socialMetadata({
      title: text.meta.socialTitle,
      description: text.meta.socialDescription,
      url: localizedUrl(route, locale),
    }),
  };
}
