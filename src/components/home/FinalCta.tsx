"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LAB_SECTIONS, SectionIndex } from "./SectionHeading";
import { QUICK_START_HREF } from "./links";

export function FinalCta() {
  const t = useTranslations("home");
  const lab = useTranslations("home.lab.final");

  return (
    <section className="lab-sec lab-sec-tight lab-end" id={LAB_SECTIONS.next.anchor}>
      <div className="lab-wrap">
        <div className="lab-final">
          <div>
            <SectionIndex section="next" />
            <h2>{lab("title")}</h2>
            <p>{lab("body")}</p>
          </div>
          <div className="lab-cta-row">
            <Link className="lab-btn lab-btn-primary" href={QUICK_START_HREF}>
              <span className="lab-dot" aria-hidden="true" />
              {t("cta.playFree")}
            </Link>
            <Link className="lab-btn lab-btn-secondary" href="/leaderboard">
              {t("cta.leaderboard")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
