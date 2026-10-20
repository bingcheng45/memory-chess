import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE, LOCALE_LABELS, type Locale } from "@/i18n/routing";
import { LEARN_HUB_COPY } from "@/lib/seo/learn/copy";
import { guideLocalesOf, guidePath } from "@/lib/seo/learn/links";

/** The translations of a guide, each named in its own language, or nothing for a guide read in English alone. */
export default function GuideTranslations({ slug }: { readonly slug: string }) {
  const locales = guideLocalesOf(slug).filter((locale) => locale !== DEFAULT_LOCALE) as Locale[];
  if (locales.length === 0) return null;

  return (
    <p className="lh-also" data-guide-translations={slug}>
      <span>{LEARN_HUB_COPY.alsoIn}</span>{" "}
      {locales.map((locale, index) => (
        <span key={locale}>
          {index > 0 ? " · " : null}
          <Link href={guidePath(slug)} locale={locale} hrefLang={locale} lang={locale}>
            {LOCALE_LABELS[locale]}
          </Link>
        </span>
      ))}
    </p>
  );
}
