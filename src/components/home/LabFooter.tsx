"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FOOTER_LINKS, PRODUCT_HUNT_DAY_URL, PRODUCT_HUNT_WEEK_URL, X_URL, XIcon } from "@/components/ui/Footer";

const AWARDS = [
  { href: PRODUCT_HUNT_DAY_URL, rank: "#5", source: "productHunt", title: "productOfTheDay" },
  { href: PRODUCT_HUNT_WEEK_URL, rank: "#2", source: "productHuntEducation", title: "productOfTheWeek" },
] as const;

/** The site footer on the Lab Paper homepage: the same links and awards as the site footer, on paper. */
export function LabFooter() {
  const common = useTranslations("common");
  const t = useTranslations("home.lab.footer");
  // A string on purpose: ICU would format a bare number with grouping separators and print "2,026".
  const currentYear = String(new Date().getFullYear());

  return (
    <footer className="lab-footer">
      <div className="lab-wrap">
        <div className="lab-foot-grid">
          <div>
            <Link className="lab-wordmark" href="/">
              Memory <span className="text-peach-500">Chess</span>
            </Link>
            <p className="lab-foot-about">{t("description")}</p>
          </div>
          <nav aria-label={t("site")}>
            <p className="lab-foot-h">{t("site")}</p>
            <ul className="lab-foot-links">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{common(link.labelKey)}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="lab-foot-h">{t("recognition")}</p>
            <div className="lab-awards">
              {AWARDS.map((award) => (
                <a key={award.rank} className="lab-award" href={award.href} target="_blank" rel="noopener noreferrer">
                  <span className="lab-award-rank">{award.rank}</span>
                  <span>
                    <small>{t(award.source)}</small>
                    <b>{t(award.title)}</b>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="lab-foot-base">
          <p>{common("footer.copyright", { year: currentYear })}</p>
          <div className="lab-foot-social">
            <a href={X_URL} target="_blank" rel="noopener noreferrer" aria-label={common("footer.followOnX")}>
              <XIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
