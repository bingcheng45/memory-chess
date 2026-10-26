"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useTotalPlays } from "./useLabEffects";

/** Stands in for the count while it loads or when it cannot be read. */
const PLAYS_PENDING = "–";
// Any count that takes the general plural in every catalogue, so the label reads naturally with no number known.
const GENERAL_COUNT = 100;

/** The hero's games-played figure: the count the server read, then the browser's newer one. */
export function LabHeroPlays({ initialPlays }: { readonly initialPlays?: number }) {
  const lab = useTranslations("home.lab");
  const format = useFormatter();
  const totalPlays = useTotalPlays(initialPlays);
  const plays = totalPlays.status === "known" ? totalPlays.plays : null;

  return (
    <div className="lab-fact-lead" data-status={totalPlays.status} aria-busy={totalPlays.status === "loading"}>
      <b>{plays === null ? PLAYS_PENDING : format.number(plays)}</b>
      {lab("hero.facts.plays", { count: plays ?? GENERAL_COUNT })}
    </div>
  );
}
