"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { DashboardTile, DashboardTileId, Rig } from "@/lib/lab/dashboard";
import { LAB_THRESHOLDS, type Need } from "@/lib/lab/readiness";
import { useContextText, useFigureText } from "./figureText";

const NEED_VALUES = { accuracy: LAB_THRESHOLDS.spanAccuracy, minPieces: LAB_THRESHOLDS.spanMinPieces };

/** What a warming figure still needs, as one list, at the setting it reads when it reads one. */
export function useNeedText() {
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
  const figureText = useFigureText();
  const contextText = useContextText();
  const needText = useNeedText();

  switch (tile.state) {
    case "ready":
    case "stale":
      return (
        <>
          <p className="lab-tile-figure">{figureText.rich(tile.figure)}</p>
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
    <li className="lab-tile" data-state={tile.state} data-tile={tile.id}>
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
    <li className="lab-tile" data-state="loading" data-tile={id}>
      <div className="lab-tile-head">
        <h3 className="lab-tile-label">{t(`label.${id}`)}</h3>
      </div>
    </li>
  );
}

interface TileListProps {
  readonly ids: readonly DashboardTileId[];
  readonly tiles: readonly DashboardTile[] | null;
  readonly size: "lead" | "summary" | "more";
}

export function TileList({ ids, tiles, size }: TileListProps) {
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
