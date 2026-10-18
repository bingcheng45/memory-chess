"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BETTER_WHEN, type DashboardTile, type DashboardTileId, type DashboardUnit, type Rig, type Trend } from "@/lib/lab/dashboard";
import { LAB_THRESHOLDS, type Need } from "@/lib/lab/readiness";
import { useContextText, useFigureText } from "./figureText";
import { TrendChip } from "./TrendChip";

const NEED_VALUES = { accuracy: LAB_THRESHOLDS.spanAccuracy, minPieces: LAB_THRESHOLDS.spanMinPieces };

export function useNeedList() {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  return (need: Need) =>
    format.list(
      Object.entries(need).map(([key, count]) => t(`need.${key as keyof Need}`, { count, ...NEED_VALUES })),
      { type: "conjunction" },
    );
}

export function useNeedText() {
  const t = useTranslations("dashboard");
  const needList = useNeedList();
  return (need: Need, rig: Rig | null) => (rig ? t("needsAt", { need: needList(need), ...rig }) : t("needs", { need: needList(need) }));
}

const betterWhenOf = (id: DashboardTileId) => (id in BETTER_WHEN ? BETTER_WHEN[id as keyof typeof BETTER_WHEN] : "higher");

/** A time's trend compares its last rounds with the ones before, so it says so; the rating's sums its changes and keeps the chip's own words. */
function TileTrend({ id, trend, unit }: { id: DashboardTileId; trend: Trend; unit: DashboardUnit }) {
  const t = useTranslations("dashboard");
  const figureText = useFigureText();
  const betterWhen = betterWhenOf(id);
  const label =
    betterWhen === "lower"
      ? t("trend", { direction: trend.direction, amount: figureText.plain({ value: trend.amount, unit, digits: 1 }), window: LAB_THRESHOLDS.rollingWindow })
      : undefined;
  return <TrendChip trend={trend} betterWhen={betterWhen} label={label} />;
}

function TileBody({ tile }: { tile: DashboardTile }) {
  const t = useTranslations("dashboard");
  const figureText = useFigureText();
  const contextText = useContextText();
  const needText = useNeedText();

  switch (tile.state) {
    case "ready":
    case "stale":
      return (
        <>
          <div className="lab-tile-figure-row">
            <p className="lab-tile-figure">{figureText.rich(tile.figure)}</p>
            {tile.trend && <TileTrend id={tile.id} trend={tile.trend} unit={tile.figure.unit} />}
          </div>
          <p className="lab-tile-note">{contextText(tile.context)}</p>
        </>
      );
    case "warming":
      return (
        <>
          <p className="lab-tile-need">{needText(tile.need, tile.rig)}</p>
          {tile.href === null ? (
            <p className="lab-tile-note">{t("tomorrow")}</p>
          ) : (
            <Link className="lab-tile-go" href={tile.href}>
              {tile.rig ? t("playAt", tile.rig) : t("play")} →
            </Link>
          )}
        </>
      );
    case "empty":
      return (
        <>
          <p className="lab-tile-need">{t(tile.cta === "choose" ? "notSet" : "notYet")}</p>
          <Link className="lab-tile-go" href={tile.href}>
            {t(tile.cta === "choose" ? "choose" : "play")} →
          </Link>
        </>
      );
  }
}

function Tile({ tile }: { tile: DashboardTile }) {
  const t = useTranslations("dashboard");
  return (
    <li className="lab-tile" id={`tile-${tile.id}`} data-state={tile.state} data-tile={tile.id}>
      <div className="lab-tile-head">
        <h3 className="lab-tile-label">{t(`label.${tile.id}`)}</h3>
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
    <li className="lab-tile" id={`tile-${id}`} data-state="loading" data-tile={id}>
      <div className="lab-tile-head">
        <h3 className="lab-tile-label">{t(`label.${id}`)}</h3>
      </div>
    </li>
  );
}

interface TileListProps {
  readonly ids: readonly DashboardTileId[];
  readonly tiles: readonly DashboardTile[] | null;
  readonly size: "today" | "lead" | "summary" | "more";
}

export function TileList({ ids, tiles, size }: TileListProps) {
  if (tiles && !ids.some((id) => tiles.some((tile) => tile.id === id))) return null;
  return (
    <ul className="lab-tiles" data-size={size}>
      {ids.map((id) => {
        const tile = tiles?.find((candidate) => candidate.id === id);
        if (tile) return <Tile key={id} tile={tile} />;
        return tiles ? null : <PendingTile key={id} id={id} />;
      })}
    </ul>
  );
}
