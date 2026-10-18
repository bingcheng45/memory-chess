"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CommunityInvite } from "@/components/community/CommunityLink";
import { isReturningPlayer } from "@/lib/community";
import { useLabResults } from "@/hooks/useLabData";
import { useLabRecord } from "@/components/home/useLabRecord";
import { readDailyOpened, utcDayOf } from "@/lib/lab/daily";
import { DASHBOARD_GROUPS, dashboardOf, drawnTilesOf, shareCardOf, unlocksOf } from "@/lib/lab/dashboard";
import { historyOf } from "@/lib/lab/history";
import { ratingHistoryOf } from "@/lib/lab/ratingHistory";
import { daysBetween } from "@/lib/lab/readiness";
import { WIN_ACCURACY } from "@/lib/store/gameStore";
import { entriesChoice, planChoice, targetChoice } from "@/components/home/labChoices";
import { LAB_SECTIONS } from "@/components/home/SectionHeading";
import { useWeekGoal } from "@/components/home/useWeekGoal";
import { DashboardBackup } from "./DashboardBackup";
import { DashboardDailyCard } from "./DashboardDailyCard";
import { DashboardRating } from "./DashboardRating";
import { DashboardShare } from "./DashboardShare";
import { TileList } from "./DashboardTiles";
import { DashboardUnlocks } from "./DashboardUnlocks";
import { useGameStanding } from "./useGameStanding";
import "@/components/round/round.css";
import "./dashboard.css";

const CHOOSE_HREF = `/#${LAB_SECTIONS.record.anchor}`;

const HistoryPending = () => <div className="lab-hist-pending" aria-hidden="true" />;
const AnalysisPending = () => <div className="lab-dash-panels lab-dash-pending" aria-hidden="true" />;
const DashboardHistory = dynamic(() => import("./DashboardHistory").then((module) => module.DashboardHistory), { ssr: false, loading: HistoryPending });
const DashboardAnalysis = dynamic(() => import("./DashboardAnalysis").then((module) => module.DashboardAnalysis), { ssr: false, loading: AnalysisPending });

/**
 * True once the record is read and the browser has had an idle moment after drawing the summary, so the sections
 * below the fold render in a task of their own instead of lengthening the one that draws what the player sees first.
 */
function useIdleAfter(ready: boolean): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!ready || idle) return;
    if (typeof window.requestIdleCallback !== "function") {
      const timer = window.setTimeout(() => setIdle(true), 1);
      return () => window.clearTimeout(timer);
    }
    const handle = window.requestIdleCallback(() => setIdle(true), { timeout: 1000 });
    return () => window.cancelIdleCallback(handle);
  }, [ready, idle]);
  return idle;
}

/**
 * Most tiles are drawn only once the record is read, after the browser has already looked for the address's fragment, so
 * a Learn link to one of them is opened here instead.
 */
function useOpenFragmentWhen(ready: boolean) {
  const missedAtFirstPaint = useRef(false);
  useEffect(() => {
    missedAtFirstPaint.current = document.getElementById(window.location.hash.slice(1)) === null;
  }, []);
  useEffect(() => {
    if (ready && missedAtFirstPaint.current) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, [ready]);
}

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
  const tCommunity = useTranslations("common.community");
  const data = useLabRecord();
  const storedPlan = planChoice.useValue();
  const storedTarget = targetChoice.useValue();
  const entries = entriesChoice.useValue();
  const [weekGoal] = useWeekGoal();
  const loaded = data.storage === "available" && data.today !== "";
  const results = useLabResults({ ...data, plan: loaded ? storedPlan : null, target: loaded ? storedTarget : null });
  const { standing, rated } = useGameStanding(loaded);
  const later = useIdleAfter(loaded);
  useOpenFragmentWhen(loaded);

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
            chooseHref: CHOOSE_HREF,
            game: standing,
            winAccuracy: WIN_ACCURACY,
          })
        : null,
    [loaded, data, results, weekGoal, entries, standing],
  );
  const ratingLine = useMemo(() => (loaded ? standing && ratingHistoryOf(standing.rating, rated, Date.now()) : "pending"), [loaded, standing, rated]);
  const rounds = useMemo(() => (later ? historyOf(data.records, rated) : null), [later, data.records, rated]);
  const figures = useMemo(() => tiles && drawnTilesOf(tiles), [tiles]);
  const unlocks = useMemo(() => tiles && unlocksOf(tiles), [tiles]);
  const card = tiles && shareCardOf(tiles, data.summary.rounds);
  const lastDay = data.summary.days.at(-1);
  const staleFor = tiles?.some(({ state }) => state === "stale") && lastDay ? daysBetween(lastDay, data.today) : null;

  return (
    <main className="lab-wrap lab-dashboard">
      <header className="lab-dash-head">
        <h1>{t("title")}</h1>
        <DashboardDailyCard records={loaded ? data.records : "loading"} />
        <p className="lab-lede">{t("lede")}</p>
        <div className="lab-dash-notes">
          {data.storage === "unavailable" && <p className="lab-dash-warn">{t("unavailable")}</p>}
          {staleFor !== null && <p className="lab-dash-warn">{t("staleNote", { count: staleFor })}</p>}
        </div>
      </header>
      {data.storage !== "unavailable" && (
        <>
          <Section id="summary" title={t("sections.summary")}>
            <TileList ids={DASHBOARD_GROUPS.today} tiles={figures} size="today" />
            {figures && unlocks ? (
              <div>
                <DashboardUnlocks unlocks={unlocks} />
                <TileList ids={DASHBOARD_GROUPS.lead} tiles={figures} size="lead" />
                <DashboardRating history={ratingLine} />
                <div className="lab-dash-summary">
                  <TileList ids={DASHBOARD_GROUPS.summary} tiles={figures} size="summary" />
                  <DashboardShare card={card} />
                </div>
              </div>
            ) : (
              <div className="lab-dash-summary-pending" aria-hidden="true" />
            )}
          </Section>
          {later && <DashboardBackup record={data} />}
          <Section id="history" title={t("sections.history")} lede={t("historyLede")}>
            {later ? <DashboardHistory rounds={rounds} total={data.summary.rounds} /> : <HistoryPending />}
          </Section>
          <Section id="analysis" title={t("sections.analysis")} lede={t("analysisLede")}>
            {later ? <DashboardAnalysis results={results} /> : <AnalysisPending />}
          </Section>
          <Section id="more" title={t("sections.more")}>
            <TileList ids={DASHBOARD_GROUPS.more} tiles={figures} size="more" />
            <Link className="lab-dash-full" href={CHOOSE_HREF}>
              {t("fullRecord")} →
            </Link>
          </Section>
          {isReturningPlayer(data.summary.rounds) && (
            <CommunityInvite placement="dashboard" line={tCommunity("dashboardLine")} link={tCommunity("link")} />
          )}
        </>
      )}
    </main>
  );
}
