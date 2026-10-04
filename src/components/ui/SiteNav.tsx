"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import { englishOnlyLinkSuffix, isServedAtBareEnglishUrl } from "@/lib/seo/englishOnly";

const NAV_LINKS = [
  { href: "/game", labelKey: "nav.play" },
  { href: "/learn", labelKey: "nav.learn" },
  { href: "/articles", labelKey: "nav.articles" },
  { href: "/leaderboard", labelKey: "nav.leaderboard" },
  { href: "/about", labelKey: "nav.about" },
] as const;

const LINK_CLASS =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300 sm:px-3.5";
const IDLE_CLASS = "text-text-muted hover:bg-white/5 hover:text-peach-300";
const CURRENT_CLASS = "bg-peach-500/10 text-peach-300";
const EN_MARKER_CLASS =
  "rounded border border-white/15 px-1 font-mono text-xs leading-4 text-text-muted";

export default function SiteNav() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const locale = useLocale();
  const englishSuffix = englishOnlyLinkSuffix(locale);

  return (
    <nav aria-label="Main" className="mt-3 w-full">
      <ul className="flex flex-wrap items-center justify-center gap-1 sm:gap-x-2">
        {NAV_LINKS.map(({ href, labelKey }) => {
          const isCurrent = pathname === href;
          const linkProps = {
            className: `${LINK_CLASS} ${isCurrent ? CURRENT_CLASS : IDLE_CLASS}`,
            "aria-current": isCurrent ? ("page" as const) : undefined,
          };
          const label = t(labelKey);

          return (
            <li key={href}>
              {isServedAtBareEnglishUrl(href, locale) ? (
                // The footer's " (English)" suffix is too wide for this row at
                // 320px, so the row shows a compact marker and the accessible
                // name keeps the full suffix.
                <EnglishOnlyLink
                  href={href}
                  {...linkProps}
                  aria-label={englishSuffix ? `${label}${englishSuffix}` : undefined}
                >
                  {(suffix) => (
                    <>
                      {label}
                      {suffix && (
                        <span aria-hidden="true" className={EN_MARKER_CLASS}>
                          EN
                        </span>
                      )}
                    </>
                  )}
                </EnglishOnlyLink>
              ) : (
                <Link href={href} {...linkProps}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
