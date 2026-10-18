"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

const askPersisted = (): Promise<boolean | null> => navigator.storage?.persisted?.().catch(() => null) ?? Promise.resolve(null);

const loadLate = () =>
  Promise.all([import("./DashboardHistory"), import("./DashboardAnalysis"), askPersisted()]).then(([history, analysis, persisted]) => ({
    DashboardHistory: history.DashboardHistory,
    DashboardAnalysis: analysis.DashboardAnalysis,
    persisted,
  }));

type Late = Awaited<ReturnType<typeof loadLate>>;

/** Not "scroll": the router fires one when a client navigation lands on a fragment it cannot find yet. */
const USER_INPUTS = ["wheel", "touchstart", "keydown"] as const;

function whenIdle(run: () => void): () => void {
  if (typeof window.requestIdleCallback !== "function") {
    const timer = window.setTimeout(run, 1);
    return () => window.clearTimeout(timer);
  }
  const handle = window.requestIdleCallback(run, { timeout: 1000 });
  return () => window.cancelIdleCallback(handle);
}

function useLate(ready: boolean): Late | null {
  const [late, setLate] = useState<Late | null>(null);
  const fragment = useRef<string | null>(null);
  const playerMoved = useRef(false);
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id || document.getElementById(id)) return;
    fragment.current = id;
    const moved = () => {
      playerMoved.current = true;
      stop();
    };
    const stop = () => USER_INPUTS.forEach((type) => window.removeEventListener(type, moved));
    USER_INPUTS.forEach((type) => window.addEventListener(type, moved, { passive: true }));
    return stop;
  }, []);
  useEffect(() => {
    if (!ready || late) return;
    let live = true;
    const load = () => loadLate().then((loaded) => live && setLate(loaded));
    if (fragment.current) {
      load();
      return () => {
        live = false;
      };
    }
    const cancel = whenIdle(load);
    return () => {
      live = false;
      cancel();
    };
  }, [ready, late]);
  useEffect(() => {
    const id = fragment.current;
    if (!late || !id) return;
    // A frame of its own for the scroll: Chrome reads a scroll painted with a layout change as a shift.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (!playerMoved.current) document.getElementById(id)?.scrollIntoView();
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [late]);
  return late;
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
  const late = useLate(loaded);

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
  const rounds = useMemo(() => (late ? historyOf(data.records, rated) : null), [late, data.records, rated]);
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
          {late && <DashboardBackup record={data} persisted={late.persisted} />}
          <Section id="history" title={t("sections.history")} lede={t("historyLede")}>
            {late ? <late.DashboardHistory rounds={rounds} total={data.summary.rounds} /> : <div className="lab-hist-pending" aria-hidden="true" />}
          </Section>
          <Section id="analysis" title={t("sections.analysis")} lede={t("analysisLede")}>
            {late ? <late.DashboardAnalysis results={results} /> : <div className="lab-dash-panels lab-dash-pending" aria-hidden="true" />}
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
