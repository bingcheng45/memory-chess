"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RANKED_DIFFICULTIES } from "@/lib/reference/facts";
import { AccuracySparkline, ForgettingCurve, MissMap, StreakGrid } from "./LabCharts";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

const PLANS = ["a", "b", "c"] as const;
// Placeholder bar lengths for the leaderboard sketch; no scores are shown.
const BOARD_SKETCH = [
  { rank: "01", width: "86%", you: false },
  { rank: "02", width: "74%", you: false },
  { rank: "03", width: "61%", you: true },
];

export function LabRecordSection() {
  const t = useTranslations("home.lab.record");
  const tags = useTranslations("home.lab.tags");
  const presets = useTranslations("game.presets");
  const proposed = <span className="lab-tag">{tags("proposed")}</span>;

  return (
    <section className="lab-sec" id={LAB_SECTIONS.record.anchor}>
      <div className="lab-wrap">
        <SectionHeading
          section="record"
          title={t("title")}
          lede={t.rich("lede", { tag: (chunks) => <span className="lab-tag">{chunks}</span> })}
        />
        <div className="lab-dash">
          <div className="lab-panel lab-p-curve">
            <div className="lab-panel-h">
              <span className="lab-k">{t("curve.fig")}</span>
              <span className="lab-tag">{t("curve.tag")}</span>
            </div>
            <h3>{t("curve.title")}</h3>
            <p className="lab-panel-desc">{t("curve.desc")}</p>
            <ForgettingCurve />
            <p className="lab-note">
              <span className="lab-tag lab-tag-blue">{tags("illustrative")}</span> {t("curve.note")}
            </p>
          </div>
          <div className="lab-panel lab-p-spark">
            <div className="lab-panel-h">
              <span className="lab-k">{t("spark.fig")}</span>
              <span className="lab-tag lab-tag-blue">{tags("sample")}</span>
            </div>
            <h3>{t("spark.title")}</h3>
            <AccuracySparkline />
            <p className="lab-note">{t("spark.note")}</p>
          </div>
          <div className="lab-panel lab-p-heat">
            <div className="lab-panel-h">
              <span className="lab-k">{t("heat.fig")}</span>
              {proposed}
            </div>
            <h3>{t("heat.title")}</h3>
            <MissMap />
            <p className="lab-note">{t("heat.note")}</p>
          </div>
          <div className="lab-panel lab-p-streak">
            <div className="lab-panel-h">
              <span className="lab-k">{t("streak.fig")}</span>
              {proposed}
            </div>
            <h3>{t("streak.title")}</h3>
            <p className="lab-panel-desc">{t("streak.desc")}</p>
            <StreakGrid />
            <p className="lab-note">{t("streak.note")}</p>
          </div>
          <div className="lab-panel lab-p-board">
            <div className="lab-panel-h">
              <span className="lab-k">{t("board.fig")}</span>
              <span className="lab-tag lab-tag-mint">{tags("live")}</span>
            </div>
            <h3>{t("board.title")}</h3>
            <p className="lab-panel-desc">{t("board.desc")}</p>
            <div className="lab-chips">
              {RANKED_DIFFICULTIES.map((difficulty) => (
                <span key={difficulty}>{presets(`${difficulty}.label`)}</span>
              ))}
            </div>
            <div aria-hidden="true">
              {BOARD_SKETCH.map(({ rank, width, you }) => (
                <div className="lab-lb-row" key={rank}>
                  <span className="lab-mono">{rank}</span>
                  <span className="lab-lb-bar" style={{ width }} data-you={you || undefined} />
                  <span className="lab-mono lab-note">{you ? t("board.you") : "--%"}</span>
                </div>
              ))}
            </div>
            <p className="lab-note">
              {t("board.countryFilter")} {proposed}
            </p>
            <Link className="lab-go" href="/leaderboard">
              {t("board.open")} →
            </Link>
          </div>
        </div>
        <div className="lab-plans">
          {PLANS.map((plan) => (
            <div className="lab-plan" key={plan}>
              <span className="lab-k">
                {t(`plans.${plan}.kicker`)} {proposed}
              </span>
              <h3>{t(`plans.${plan}.title`)}</h3>
              <ol>
                {(t.raw(`plans.${plan}.steps`) as string[]).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
