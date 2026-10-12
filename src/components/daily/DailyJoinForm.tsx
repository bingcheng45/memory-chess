"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import CountryPicker from "@/components/leaderboard/CountryPicker";
import { START_RATING } from "@/lib/game/rating";
import type { DailyRound } from "@/lib/lab/daily";
import { entryFromRow, type DailyEntry } from "@/lib/lab/entries";
import { postLeaderboardEntry } from "@/lib/leaderboard/postEntry";
import { useGameStore } from "@/lib/store/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { guessCountry } from "./countryGuess";
import { dailySubmission } from "./dailySubmission";

const COUNTRY_ID = "daily-country";
const NAME_LENGTH = { min: 4, max: 16 } as const;

/** Undefined while /api/geo is asked; null when it names no country or cannot be reached. */
function useGeoCountry(): string | null | undefined {
  const [geo, setGeo] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    fetch("/api/geo", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { country?: unknown }) => live && setGeo(typeof body.country === "string" ? body.country : null))
      .catch(() => live && setGeo(null));
    return () => {
      live = false;
    };
  }, []);
  return geo;
}

type Submit = { readonly state: "idle" | "sending" } | { readonly state: "failed"; readonly message: string | null };

export function DailyJoinForm({ round, onJoined }: { round: DailyRound; onJoined: (entry: DailyEntry) => void }) {
  const t = useTranslations("daily.join");
  const page = useTranslations("daily.page");
  const { countryCode: saved, setCountryCode } = useSettingsStore();
  const rating = useGameStore((state) => state.gameState.skillRating) || START_RATING;
  const geo = useGeoCountry();
  const [name, setName] = useState("");
  const [submit, setSubmit] = useState<Submit>({ state: "idle" });

  // The connection outranks the browser's language, so the language waits for the connection's answer.
  const guess = guessCountry({ saved, geo: geo ?? null, languages: geo === undefined ? [] : navigator.languages });
  const trimmed = name.trim();
  const nameFits = trimmed.length >= NAME_LENGTH.min && trimmed.length <= NAME_LENGTH.max;
  const sending = submit.state === "sending";

  if (round.correct === 0) return <p className="daily-note daily-join">{page("noneRight")}</p>;

  const join = async (event: FormEvent) => {
    event.preventDefault();
    if (!nameFits || guess === null || sending) return;
    setSubmit({ state: "sending" });
    try {
      const posted = await postLeaderboardEntry(dailySubmission(round, trimmed, guess.code, rating));
      if (!posted.ok) {
        setSubmit({ state: "failed", message: posted.message });
        return;
      }
      setCountryCode(guess.code);
      const entry = entryFromRow(posted.row, Date.now());
      if (entry?.difficulty === "daily") onJoined(entry);
    } catch {
      setSubmit({ state: "failed", message: null });
    }
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
      {submit.state === "failed" && (
        <p role="alert" className="daily-error">
          {submit.message ? t("failed", { message: submit.message }) : t("failedGeneric")}
        </p>
      )}
      <button type="submit" className="lab-btn lab-btn-primary" disabled={!nameFits || guess === null || sending}>
        {sending ? t("submitting") : t("submit")}
      </button>
      <p className="daily-hint">{t("public")}</p>
    </form>
  );
}
