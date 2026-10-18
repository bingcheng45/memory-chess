"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { LockedTile } from "@/lib/lab/dashboard";
import type { Need } from "@/lib/lab/readiness";
import { useNeedList } from "./DashboardTiles";

const SHOWN = 4;
const FIRST_ROUND: Need = { rounds: 1 };

function UnlockItem({ tile }: { tile: LockedTile }) {
  const t = useTranslations("dashboard");
  const needText = useNeedList();

  const choose = tile.state === "empty" && tile.cta === "choose";
  const rig = tile.state === "warming" ? tile.rig : null;
  const need = choose ? t("notSet") : tile.state === "warming" ? needText(tile.need) : needText(FIRST_ROUND);
  const action = choose ? t("choose") : rig ? t("playAt", rig) : t("play");

  return (
    <li data-unlock={tile.id}>
      <span className="lab-dash-unlock-what">{t(`label.${tile.id}`)}</span>
      <span className="lab-dash-unlock-need">{choose ? need : rig ? t("unlocks.at", { need, ...rig }) : t("unlocks.plain", { need })}</span>
      {tile.href === null ? (
        <span className="lab-dash-unlock-wait">{t("tomorrow")}</span>
      ) : (
        <Link className="lab-dash-unlock-go" href={tile.href}>
          {action} →
        </Link>
      )}
    </li>
  );
}

/** Every figure still to unlock as one list, nearest first, instead of a card each. */
export function DashboardUnlocks({ unlocks }: { unlocks: readonly LockedTile[] }) {
  const t = useTranslations("dashboard.unlocks");
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  if (unlocks.length === 0) return null;
  const shown = expanded ? unlocks : unlocks.slice(0, SHOWN);

  return (
    <section className="lab-dash-unlocks" aria-labelledby={`${listId}-title`}>
      <h3 id={`${listId}-title`}>{t("title")}</h3>
      <ul id={listId}>
        {shown.map((tile) => (
          <UnlockItem key={tile.id} tile={tile} />
        ))}
      </ul>
      {unlocks.length > SHOWN && (
        <button type="button" className="lab-dash-unlock-toggle" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(!expanded)}>
          {expanded ? t("showFewer") : t("showAll", { count: unlocks.length })}
        </button>
      )}
    </section>
  );
}
