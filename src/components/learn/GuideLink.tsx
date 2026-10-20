import NextLink from "next/link";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { englishOnlyLinkSuffix, isServedAtBareEnglishUrl } from "@/lib/seo/englishOnly";

type DataAttributes = { readonly [name: `data-${string}`]: string };

type GuideLinkProps = DataAttributes & {
  readonly href: string;
  readonly locale: string;
  readonly className?: string;
  readonly marksEnglish?: boolean;
  readonly children: ReactNode;
};

/**
 * The locale-aware Link given `locale="en"` writes `/en/...`, which costs a redirect, so the English link is a plain one.
 */
export default function GuideLink({ href, locale, className, marksEnglish = true, children, ...data }: GuideLinkProps) {
  const path = href.split(/[?#]/)[0];
  if (locale === DEFAULT_LOCALE || !isServedAtBareEnglishUrl(path, locale)) {
    return (
      <Link href={href} className={className} {...data}>
        {children}
      </Link>
    );
  }
  return (
    <NextLink href={href} hrefLang={DEFAULT_LOCALE} className={className} {...data}>
      {children}
      {marksEnglish ? englishOnlyLinkSuffix(locale) : null}
    </NextLink>
  );
}
