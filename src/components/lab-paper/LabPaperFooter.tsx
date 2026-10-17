"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FOOTER_LINKS, LaunchBadges, X_URL, XIcon } from "@/components/ui/Footer";
import { CommunityLink } from "@/components/community/CommunityLink";
import SiteLink from "@/components/ui/SiteLink";
import { LAB_PAPER_CLASS } from "./shell";

/**
 * The site footer on a Lab Paper route: the same links and awards as the dark footer, on paper. It carries its own
 * Lab Paper block because the locale layout renders it after the page. data-below-game: see the dark Footer.
 */
export function LabPaperFooter() {
  const t = useTranslations("common");
  // A string on purpose: ICU would format a bare number with grouping separators and print "2,026".
  const currentYear = String(new Date().getFullYear());

  return (
    <div className={LAB_PAPER_CLASS} data-below-game>
      <footer className="lab-footer">
        <div className="lab-wrap">
          <div className="lab-foot-grid">
            <div>
              <Link className="lab-wordmark" href="/">
                Memory <span className="lab-wordmark-chess">Chess</span>
              </Link>
              <p className="lab-foot-about">{t("footer.tagline")}</p>
            </div>
            <nav aria-label={t("nav.site")}>
              <p className="lab-foot-h">{t("nav.site")}</p>
              <ul className="lab-foot-links">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <SiteLink href={link.href} label={t(link.labelKey)} />
                  </li>
                ))}
                <li>
                  <CommunityLink placement="footer">{t("community.footer")}</CommunityLink>
                </li>
              </ul>
            </nav>
            <div>
              <p className="lab-foot-h">{t("footer.recognition")}</p>
              <LaunchBadges theme="light" className="lab-awards" />
            </div>
          </div>
          <div className="lab-foot-base">
            <p>{t("footer.copyright", { year: currentYear })}</p>
            <div className="lab-foot-social">
              <a href={X_URL} target="_blank" rel="noopener noreferrer" aria-label={t("footer.followOnX")}>
                <XIcon />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
