"use client";

import type { MouseEventHandler } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import { isServedAtBareEnglishUrl } from "@/lib/seo/englishOnly";

interface SiteLinkProps {
  readonly href: string;
  readonly label: string;
  readonly className?: string;
  readonly prefetch?: boolean;
  readonly onClick?: MouseEventHandler<HTMLAnchorElement>;
  readonly "aria-current"?: "page";
}

/** A link to one of the site's pages: at its bare English URL, marked as English, when this locale is served it there. */
export default function SiteLink({ href, label, ...props }: SiteLinkProps) {
  const locale = useLocale();

  if (isServedAtBareEnglishUrl(href, locale)) {
    return (
      <EnglishOnlyLink href={href} {...props}>
        {(suffix) => `${label}${suffix}`}
      </EnglishOnlyLink>
    );
  }

  return (
    <Link href={href} {...props}>
      {label}
    </Link>
  );
}
