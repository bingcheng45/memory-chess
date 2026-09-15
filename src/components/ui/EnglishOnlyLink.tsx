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
 * A link to an English-only page, from any locale.
 *
 * Such a page has one URL and it is the bare one. The locale-aware Link cannot
 * express that: left alone it keeps the active locale and points a German
 * reader at /de/about, and forcing locale="en" points at /en/about, which only
 * 307s to /about because the routing prefixes English as-needed. On a
 * translated page the label says the language changes.
 */
export default function EnglishOnlyLink({ href, children, ...props }: EnglishOnlyLinkProps) {
  const locale = useLocale();

  return (
    <NextLink href={href} hrefLang="en" {...props}>
      {children(englishOnlyLinkSuffix(locale))}
    </NextLink>
  );
}
