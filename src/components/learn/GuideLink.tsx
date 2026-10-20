import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { englishOnlyLinkSuffix, isServedAtBareEnglishUrl } from "@/lib/seo/englishOnly";

type DataAttributes = { readonly [name: `data-${string}`]: string };

type GuideLinkProps = DataAttributes & {
  readonly href: string;
  /** The locale the guide is read in. */
  readonly locale: string;
  readonly className?: string;
  /** Whether the label says "(English)" when the link leaves the reader's language. */
  readonly marked?: boolean;
  readonly children: ReactNode;
};

/** A link from a guide: in the reader's locale where the target is served in it, else to the bare English URL. */
export default function GuideLink({ href, locale, className, marked = true, children, ...data }: GuideLinkProps) {
  const path = href.split(/[?#]/)[0];
  if (locale === DEFAULT_LOCALE || !isServedAtBareEnglishUrl(path, locale)) {
    return (
      <Link href={href} className={className} {...data}>
        {children}
      </Link>
    );
  }
  return (
    <Link href={href} locale={DEFAULT_LOCALE} hrefLang={DEFAULT_LOCALE} className={className} {...data}>
      {children}
      {marked ? englishOnlyLinkSuffix(locale) : null}
    </Link>
  );
}
