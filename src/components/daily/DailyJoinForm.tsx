"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import CountryPicker from "@/components/leaderboard/CountryPicker";
import { WORLD_CODE } from "@/lib/leaderboard/countries";
import { START_RATING } from "@/lib/game/rating";
import type { DailyRound } from "@/lib/lab/daily";
import type { DailyEntry } from "@/lib/lab/entries";
import { DAILY_BOARD } from "@/types/leaderboard";
import { postLeaderboardEntry } from "@/lib/leaderboard/postEntry";
import { useGameStore } from "@/lib/store/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { guessCountry } from "./countryGuess";
import { dailySubmission } from "./dailySubmission";

const COUNTRY_ID = "daily-country";
const NAME_LENGTH = { min: 4, max: 16 } as const;

const GEO_TIMEOUT_MS = 3_000;

function useGeoCountry(needed: boolean): string | null | undefined {
  const [geo, setGeo] = useState<string | null | undefined>(needed ? undefined : null);
  useEffect(() => {
    if (!needed) return;
    let live = true;
    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), GEO_TIMEOUT_MS);
    fetch("/api/geo", { cache: "no-store", signal: abort.signal })
      .then((response) => response.json())
      .then((body: { country?: unknown }) => live && setGeo(typeof body.country === "string" ? body.country : null))
      .catch(() => live && setGeo(null))
      .finally(() => window.clearTimeout(timer));
    return () => {
      live = false;
      abort.abort();
    };
  }, [needed]);
  return geo;
}

type Submit = "idle" | "sending" | "failed";

export function DailyJoinForm({ round, onJoined }: { round: DailyRound; onJoined: (entry: DailyEntry) => void }) {
  const t = useTranslations("daily.join");
  const { countryCode: saved, setCountryCode } = useSettingsStore();
  const rating = useGameStore((state) => state.gameState.skillRating) ?? START_RATING;
  const geo = useGeoCountry(saved === WORLD_CODE && round.correct > 0);
  const [name, setName] = useState("");
  const [submit, setSubmit] = useState<Submit>("idle");

  const guess = guessCountry({ saved, geo: geo ?? null, languages: geo === undefined ? [] : navigator.languages });
  const trimmed = name.trim();
  const nameFits = trimmed.length >= NAME_LENGTH.min && trimmed.length <= NAME_LENGTH.max;
  const sending = submit === "sending";

  if (round.correct === 0) return <p className="daily-note daily-join">{t("noneRight")}</p>;

  const join = async (event: FormEvent) => {
    event.preventDefault();
    if (!nameFits || guess === null || sending) return;
    setSubmit("sending");
    // The server's own reason is English, so the player is told in their language that the join failed.
    const posted = await postLeaderboardEntry(dailySubmission(round, trimmed, guess.code, rating)).catch(() => null);
    if (posted?.ok && posted.entry?.difficulty === DAILY_BOARD) onJoined(posted.entry);
    else setSubmit("failed");
  };

  return (
    <form className="daily-join" onSubmit={join} noValidate>
      <h3 className="daily-join-title">{t("title")}</h3>
      <div className="daily-field">
        <label htmlFor="daily-name">{t("name")}</label>
        <input
          id="daily-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={NAME_LENGTH.max}
          autoComplete="nickname"
          aria-describedby="daily-name-hint"
          disabled={sending}
          required
        />
        <p id="daily-name-hint" className="daily-hint">{t("nameHint")}</p>
      </div>
      <div className="daily-field">
        <label htmlFor={COUNTRY_ID}>{t("country")}</label>
        <CountryPicker id={COUNTRY_ID} value={guess?.code ?? null} onChange={setCountryCode} disabled={sending} placeholder={t("chooseCountry")} withWorld={false} />
        <p className="daily-hint">
          {t(`from.${guess?.source ?? "none"}`)}{" "}
          {guess && (
            <button type="button" className="daily-change" onClick={() => document.getElementById(COUNTRY_ID)?.click()} disabled={sending}>
              {t("change")}
            </button>
          )}
        </p>
      </div>
      {submit === "failed" && (
        <p role="alert" className="daily-error">
          {t("failed")}
        </p>
      )}
      <button type="submit" className="lab-btn lab-btn-primary" disabled={!nameFits || guess === null || sending}>
        {sending ? t("submitting") : t("submit")}
      </button>
      <p className="daily-hint">{t("public")}</p>
    </form>
  );
}
