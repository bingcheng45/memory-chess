"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { countryName, WORLD_CODE, type CountryCode } from "@/lib/leaderboard/countries";
import type { Standing } from "@/lib/leaderboard/standing";
import { checkStanding, type StandingCheck } from "@/lib/leaderboard/standingClient";

export type Reveal =
  | { readonly status: "loading" }
  | { readonly status: "done"; readonly world: Standing | null; readonly country: Standing | null };

const standingOf = (check: StandingCheck): Standing | null => (check.kind === "ranked" ? check.standing : null);

/** The rank a sent score holds, worldwide and in the player's country, looked up once for everything that shows it. */
export function useSubmittedStanding(entryId: string | null, country: CountryCode): Reveal {
  const [reveal, setReveal] = useState<Reveal>({ status: "loading" });

  useEffect(() => {
    if (entryId === null) return;
    let live = true;
    const inCountry = country === WORLD_CODE ? Promise.resolve(null) : checkStanding(entryId, "country").then(standingOf);
    void Promise.all([checkStanding(entryId, "world").then(standingOf), inCountry]).then(([world, local]) => {
      if (live) setReveal({ status: "done", world, country: local });
    });
    return () => {
      live = false;
    };
  }, [entryId, country]);

  return reveal;
}

/** The rank a score that was just sent holds, worldwide and in the player's country, so every submit pays back. */
export function SubmittedStanding({ reveal, country }: { readonly reveal: Reveal; readonly country: CountryCode }) {
  const t = useTranslations("game.result.dialog");
  const locale = useLocale();
  if (reveal.status === "loading") return <p className="lab-dialog-text">{t("rankLoading")}</p>;
  // The dialog already says the score went up; without a rank there is nothing more to add.
  if (reveal.world === null) return null;
  return (
    <ul className="lab-dialog-ranks" data-submitted-standing>
      <li>{t("rankWorld", { rank: reveal.world.rank, total: reveal.world.total })}</li>
      {reveal.country && (
        <li>{t("rankCountry", { rank: reveal.country.rank, total: reveal.country.total, country: countryName(country, locale) })}</li>
      )}
    </ul>
  );
}
