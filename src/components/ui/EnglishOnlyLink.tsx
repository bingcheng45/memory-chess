"use client";

import NextLink from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { useLocale } from "next-intl";

import { englishOnlyLinkSuffix } from "@/lib/seo/englishOnly";

type EnglishOnlyLinkProps = Omit<ComponentProps<typeof NextLink>, "href" | "hrefLang" | "children"> & {
  href: string;
  /** Renders the label; place `suffix` where the reader sees the link text. */
  children: (suffix: string) => ReactNode;
};

/**
 * A link to a page the reader gets in English at its bare URL: an
 * English-only page from any locale, or an article from a locale the articles
 * are not translated into. The locale-aware Link would keep the active locale
 * and point a German reader at /de/about.
 */
export default function EnglishOnlyLink({ href, children, ...props }: EnglishOnlyLinkProps) {
  const locale = useLocale();

  return (
    <NextLink href={href} hrefLang="en" {...props}>
      {children(englishOnlyLinkSuffix(locale))}
    </NextLink>
  );
}
