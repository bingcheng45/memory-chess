"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLabData, useLabResults } from "@/hooks/useLabData";
import { readDailyOpened, utcDayOf } from "@/lib/lab/daily";
import { DASHBOARD_GROUPS, dashboardOf, shareCardOf } from "@/lib/lab/dashboard";
import { historyOf } from "@/lib/lab/history";
import { hasLabCopy } from "@/lib/home/labLocales";
import { daysBetween } from "@/lib/lab/readiness";
import { WIN_ACCURACY } from "@/lib/store/gameStore";
import { entriesChoice, planChoice, targetChoice } from "@/components/home/labChoices";
import { LAB_SECTIONS } from "@/components/home/SectionHeading";
import { useWeekGoal } from "@/components/home/useWeekGoal";
import { DashboardAnalysis } from "./DashboardAnalysis";
import { DashboardHistory } from "./DashboardHistory";
import { DashboardShare } from "./DashboardShare";
import { TileList } from "./DashboardTiles";
import { useGameStanding } from "./useGameStanding";
import "@/components/round/round.css";
import "./dashboard.css";

function Section({ id, title, lede, children }: { id: string; title: string; lede?: string; children: ReactNode }) {
  return (
    <section className="lab-dash-sec" id={id} aria-labelledby={`${id}-title`}>
      <div className="lab-dash-sec-h">
        <h2 id={`${id}-title`}>{title}</h2>
        {lede && <p className="lab-dash-sec-lede">{lede}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * The player's whole record on one page. Rounds, figures and charts read the lab record, which holds every round played
 * on this device; the game store adds only what it alone knows, the rating and the win streak.
 */
export function Dashboard() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const data = useLabData();
  const storedPlan = planChoice.useValue();
  const storedTarget = targetChoice.useValue();
  const entries = entriesChoice.useValue();
  const [weekGoal] = useWeekGoal();
  const loaded = data.storage === "available" && data.today !== "";
  const results = useLabResults({ ...data, plan: loaded ? storedPlan : null, target: loaded ? storedTarget : null });
  const { standing, rated } = useGameStanding(loaded);
  const chooseHref = hasLabCopy(locale) ? `/#${LAB_SECTIONS.record.anchor}` : null;

  const tiles = useMemo(
    () =>
      loaded
        ? dashboardOf({
            ...data,
            results,
            weekGoal,
            entries,
            utcDay: utcDayOf(Date.now()),
            dailyOpened: readDailyOpened(),
            chooseHref,
            game: standing,
            winAccuracy: WIN_ACCURACY,
          })
        : null,
    [loaded, data, results, weekGoal, entries, chooseHref, standing],
  );
  const rounds = useMemo(() => (loaded ? historyOf(data.records, rated) : null), [loaded, data.records, rated]);
  const card = tiles && shareCardOf(tiles, data.summary.rounds);
  const lastDay = data.summary.days.at(-1);
  const staleFor = tiles?.some(({ state }) => state === "stale") && lastDay ? daysBetween(lastDay, data.today) : null;

  return (
    <main className="lab-wrap lab-dashboard">
      <header className="lab-dash-head">
        <h1>{t("title")}</h1>
        <p className="lab-lede">{t("lede")}</p>
        {data.storage === "unavailable" && <p className="lab-dash-warn">{t("unavailable")}</p>}
        {staleFor !== null && <p className="lab-dash-warn">{t("staleNote", { count: staleFor })}</p>}
      </header>
      {data.storage !== "unavailable" && (
        <>
          <Section id="summary" title={t("sections.summary")}>
            <TileList ids={DASHBOARD_GROUPS.lead} tiles={tiles} size="lead" />
            <div className="lab-dash-summary">
              <TileList ids={DASHBOARD_GROUPS.summary} tiles={tiles} size="summary" />
              <DashboardShare card={tiles ? card : "pending"} />
            </div>
          </Section>
          <Section id="history" title={t("sections.history")} lede={t("historyLede")}>
            <DashboardHistory rounds={rounds} total={data.summary.rounds} />
          </Section>
          <Section id="analysis" title={t("sections.analysis")} lede={t("analysisLede")}>
            <DashboardAnalysis results={loaded ? results : null} />
          </Section>
          <Section id="more" title={t("sections.more")}>
            <TileList ids={DASHBOARD_GROUPS.more} tiles={tiles} size="more" />
            {chooseHref && (
              <Link className="lab-dash-full" href={chooseHref}>
                {t("fullRecord")} →
              </Link>
            )}
          </Section>
        </>
      )}
    </main>
  );
}
