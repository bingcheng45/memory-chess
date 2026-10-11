"use client";

import { useMemo } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLabData, useLabResults } from "@/hooks/useLabData";
import { readDailyOpened, utcDayOf } from "@/lib/lab/daily";
import { DASHBOARD_TILES, dashboardOf, HEADLINE_TILES, shareCardOf, type DashboardTile, type DashboardTileId, type Rig } from "@/lib/lab/dashboard";
import { hasLabCopy } from "@/lib/home/labLocales";
import { daysBetween, LAB_THRESHOLDS, type Need } from "@/lib/lab/readiness";
import { entriesChoice, planChoice, targetChoice } from "@/components/home/labChoices";
import { LAB_SECTIONS } from "@/components/home/SectionHeading";
import { useWeekGoal } from "@/components/home/useWeekGoal";
import { DashboardShare } from "./DashboardShare";
import { useFigureText } from "./figureText";
import "./lab.css";
import "./dashboard.css";

const isHeadline = (id: DashboardTileId) => (HEADLINE_TILES as readonly DashboardTileId[]).includes(id);
const NEED_VALUES = { accuracy: LAB_THRESHOLDS.spanAccuracy, minPieces: LAB_THRESHOLDS.spanMinPieces };

function useNeedText() {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  return (need: Need, rig: Rig | null) => {
    const parts = Object.entries(need).map(([key, count]) => t(`need.${key as keyof Need}`, { count, ...NEED_VALUES }));
    const list = format.list(parts, { type: "conjunction" });
    return rig ? t("needsAt", { need: list, ...rig }) : t("needs", { need: list });
  };
}

function TileBody({ tile }: { tile: DashboardTile }) {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const figureText = useFigureText();
  const needText = useNeedText();

  switch (tile.state) {
    case "ready":
    case "stale": {
      const values = Object.fromEntries(
        Object.entries(tile.context.values).map(([key, value]) => [key, value instanceof Date ? format.dateTime(value, { dateStyle: "medium" }) : value]),
      );
      return (
        <>
          <p className="lab-tile-figure">{figureText.rich(tile.figure)}</p>
          <p className="lab-note">{t(`context.${tile.context.kind}`, values)}</p>
        </>
      );
    }
    case "warming":
      return (
        <>
          <p className="lab-tile-need">{needText(tile.need, tile.rig)}</p>
          {tile.href === null ? (
            <p className="lab-note">{t("tomorrow")}</p>
          ) : (
            <Link className="lab-go" href={tile.href}>
              {tile.rig ? t("playAt", tile.rig) : t("play")} →
            </Link>
          )}
        </>
      );
    case "empty":
      return (
        <>
          <p className="lab-tile-need">{t(tile.cta === "choose" ? "notSet" : "notYet")}</p>
          <Link className="lab-go" href={tile.href}>
            {t(tile.cta === "choose" ? "choose" : "play")} →
          </Link>
        </>
      );
  }
}

function Tile({ tile }: { tile: DashboardTile }) {
  const t = useTranslations("dashboard");
  return (
    <li className="lab-tile" data-state={tile.state} data-tile={tile.id}>
      <div className="lab-tile-head">
        <h3 className="lab-k">{t(`label.${tile.id}`)}</h3>
        {tile.state === "stale" && <span className="lab-tag">{t("stale")}</span>}
      </div>
      <TileBody tile={tile} />
    </li>
  );
}

/** Before the record is read, each tile keeps its place with its label only, so nothing moves when the figures arrive. */
function PendingTile({ id }: { id: DashboardTileId }) {
  const t = useTranslations("dashboard");
  return (
    <li className="lab-tile" data-state="loading" data-tile={id}>
      <div className="lab-tile-head">
        <h3 className="lab-k">{t(`label.${id}`)}</h3>
      </div>
    </li>
  );
}

function TileList({ ids, tiles, className }: { ids: readonly DashboardTileId[]; tiles: readonly DashboardTile[] | null; className: string }) {
  return (
    <ul className={className}>
      {ids.map((id) => {
        const tile = tiles?.find((candidate) => candidate.id === id);
        if (tile) return <Tile key={id} tile={tile} />;
        return tiles ? null : <PendingTile key={id} id={id} />;
      })}
    </ul>
  );
}

export function ProgressDashboard() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const data = useLabData();
  const storedPlan = planChoice.useValue();
  const storedTarget = targetChoice.useValue();
  const entries = entriesChoice.useValue();
  const [weekGoal] = useWeekGoal();
  const loaded = data.storage === "available" && data.today !== "";
  const results = useLabResults({ ...data, plan: loaded ? storedPlan : null, target: loaded ? storedTarget : null });
  const chooseHref = hasLabCopy(locale) ? `/#${LAB_SECTIONS.record.anchor}` : null;

  const tiles = useMemo(
    () =>
      loaded
        ? dashboardOf({ ...data, results, weekGoal, entries, utcDay: utcDayOf(Date.now()), dailyOpened: readDailyOpened(), chooseHref })
        : null,
    [loaded, data, results, weekGoal, entries, chooseHref],
  );
  const card = tiles && shareCardOf(tiles, data.summary.rounds);
  const lastDay = data.summary.days.at(-1);
  const staleFor = tiles?.some(({ state }) => state === "stale") && lastDay ? daysBetween(lastDay, data.today) : null;

  return (
    <div className="lab lab-dashboard">
      <main className="lab-wrap">
        <header className="lab-dash-head">
          <span className="lab-sec-idx">{t("kicker")}</span>
          <h1>{t("title")}</h1>
          <p className="lab-lede">{t("lede")}</p>
          {chooseHref && (
            <Link className="lab-dash-full" href={chooseHref}>
              {t("fullRecord")} →
            </Link>
          )}
          {data.storage === "loading" && <p className="lab-note">{t("loading")}</p>}
          {data.storage === "unavailable" && <p className="lab-tools-warn">{t("unavailable")}</p>}
          {tiles && <DashboardShare card={card} />}
        </header>
        {staleFor !== null && <p className="lab-note lab-stale">{t("staleNote", { count: staleFor })}</p>}
        {data.storage !== "unavailable" && (
          <>
            <section className="lab-dash-section" aria-labelledby="dash-headline">
              <h2 id="dash-headline">{t("headline")}</h2>
              <TileList ids={HEADLINE_TILES} tiles={tiles} className="lab-tiles lab-tiles-headline" />
            </section>
            <section className="lab-dash-section" aria-labelledby="dash-more">
              <h2 id="dash-more">{t("more")}</h2>
              <TileList ids={DASHBOARD_TILES.filter((id) => !isHeadline(id))} tiles={tiles} className="lab-tiles" />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
