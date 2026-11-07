import { useTranslations } from "next-intl";
import { Link } from "./HomeLinks";
import { LAB_SECTIONS } from "./SectionHeading";
import { QUICK_START_HREF } from "./links";

export function FinalCta() {
  const t = useTranslations("home");
  const lab = useTranslations("home.lab");

  return (
    <section className="lab-sec lab-end" id={LAB_SECTIONS.next.anchor}>
      <div className="lab-wrap">
        <div className="lab-final lab-plate lab-plate-grid">
          <div>
            <h2>{lab("final.title")}</h2>
            <p>{lab("final.body")}</p>
          </div>
          <div className="lab-cta-row">
            <Link className="lab-btn lab-btn-primary" href={QUICK_START_HREF}>
              {lab("index.play")}
            </Link>
            <Link className="lab-btn lab-btn-secondary" href="/leaderboard" prefetch={false}>
              {t("cta.leaderboard")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
