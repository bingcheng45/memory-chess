"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLabResults } from "@/hooks/useLabData";
import { trackEvent } from "@/lib/analytics/events";
import { daysBetween } from "@/lib/lab/readiness";
import { RANKED_DIFFICULTIES } from "@/lib/reference/facts";
import { ForgettingCurve } from "./LabCharts";
import { BestsPanel, MissPanel, PanelHead, StreakPanel, TrendPanel, TypesPanel } from "./LabRecordPanels";
import { LabRecordTools } from "./LabRecordTools";
import { LabUnlockStrip } from "./LabUnlockStrip";
import type { LabRecord } from "./useLabRecord";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

const PLANS = ["a", "b", "c"] as const;
const BOARD_SKETCH = [
  { rank: "01", width: "86%", pieces: 12 },
  { rank: "02", width: "74%", pieces: 10 },
  { rank: "03", width: "61%", pieces: 8 },
];

/** Sends lab_section_view the first time the section scrolls into sight, then stops watching. */
function useFirstSight() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
      observer.disconnect();
      trackEvent({ name: "lab_section_view", params: {} });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function LabRecordSection({ record }: { record: LabRecord }) {
  const t = useTranslations("home.lab.record");
  const tags = useTranslations("home.lab.tags");
  const presets = useTranslations("game.presets");
  const proposed = <span className="lab-tag">{tags("proposed")}</span>;
  const { summary, today } = record;
  const lab = useLabResults(record);
  const section = useFirstSight();
  const lastDay = summary.days.at(-1);
  const daysAgo = today && lastDay ? daysBetween(lastDay, today) : null;

  return (
    <section className="lab-sec" id={LAB_SECTIONS.record.anchor} ref={section}>
      <div className="lab-wrap">
        <SectionHeading
          section="record"
          title={t("title")}
          lede={t.rich("lede", { tag: (chunks) => <span className="lab-tag lab-tag-blue">{chunks}</span> })}
        />
        <LabUnlockStrip results={lab} />
        <div className="lab-dash">
          <div className="lab-panel lab-p-curve">
            <PanelHead fig={t("curve.fig")} tag={<span className="lab-tag">{t("curve.tag")}</span>} />
            <h3>{t("curve.title")}</h3>
            <p className="lab-panel-desc">{t("curve.desc")}</p>
            <ForgettingCurve />
            <p className="lab-note">
              <span className="lab-tag lab-tag-blue">{tags("illustrative")}</span> {t("curve.note")}
            </p>
          </div>
          <TrendPanel result={lab.trend} played={summary.rounds > 0} daysAgo={daysAgo} />
          <MissPanel result={lab.missMap} daysAgo={daysAgo} />
          <StreakPanel result={lab.streak} daysAgo={daysAgo} />
          <div className="lab-panel lab-p-board">
            <PanelHead fig={t("board.fig")} tag={<span className="lab-tag lab-tag-blue">{tags("sample")}</span>} />
            <h3>{t("board.title")}</h3>
            <p className="lab-panel-desc">{t("board.desc")}</p>
            <div className="lab-chips">
              {RANKED_DIFFICULTIES.map((difficulty) => (
                <span key={difficulty}>{presets(`${difficulty}.label`)}</span>
              ))}
            </div>
            <div aria-hidden="true">
              {BOARD_SKETCH.map(({ rank, width, pieces }) => (
                <div className="lab-lb-row" key={rank}>
                  <span className="lab-mono">{rank}</span>
                  <span className="lab-lb-bar" style={{ width }} />
                  <span className="lab-mono lab-note">{t("board.sketchPieces", { count: pieces })}</span>
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
          <BestsPanel result={lab.bests} daysAgo={daysAgo} />
          <TypesPanel result={lab.typeRecall} daysAgo={daysAgo} />
        </div>
        <div className="lab-tools-slot">
          <LabRecordTools record={record} />
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
