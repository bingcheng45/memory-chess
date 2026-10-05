import NextLink from "next/link";
import type { ReactNode } from "react";
import { ARTICLE_LINK } from "@/components/articles/articleStyles";
import { DEFAULT_LOCALE } from "@/i18n/routing";

type EnglishPageLinkProps = {
  /** The unprefixed path, which is the English page's whole URL. */
  href: string;
  children: ReactNode;
};

// The locale-aware Link would keep the reader's prefix and point a German
// reader at /de/about or back at the translated article. EnglishOnlyLink
// cannot stand in here: it takes a function as its child, and a server
// component cannot hand a function to a client component.
export default function EnglishPageLink({ href, children }: EnglishPageLinkProps) {
  return (
    <NextLink href={href} hrefLang={DEFAULT_LOCALE} className={ARTICLE_LINK}>
      {children}
    </NextLink>
  );
}
