"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import CountryPicker from "@/components/leaderboard/CountryPicker";
import { WORLD_CODE } from "@/lib/leaderboard/countries";
import { START_RATING } from "@/lib/game/rating";
import type { DailyRound } from "@/lib/lab/daily";
import type { DailyEntry } from "@/lib/lab/entries";
import { DAILY_BOARD } from "@/types/leaderboard";
import { entryFromRow } from "@/lib/leaderboard/entryRow";
import { postLeaderboardEntry } from "@/lib/leaderboard/postEntry";
import { playerNameProblem } from "@/lib/leaderboard/playerName";
import { useGameStore } from "@/lib/store/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { guessCountry } from "./countryGuess";
import { dailySubmission } from "./dailySubmission";

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

interface DailyJoinFormProps {
  readonly round: DailyRound;
  readonly onJoined: (entry: DailyEntry) => void;
  readonly title?: string;
}

export function DailyJoinForm({ round, onJoined, title }: DailyJoinFormProps) {
  const t = useTranslations("daily.join");
  const id = useId();
  const ids = { name: `${id}-name`, nameHint: `${id}-name-hint`, nameError: `${id}-name-error`, country: `${id}-country`, countrySource: `${id}-country-source` };
  const { countryCode: saved, setCountryCode } = useSettingsStore();
  const rating = useGameStore((state) => state.gameState.skillRating) ?? START_RATING;
  const geo = useGeoCountry(saved === WORLD_CODE && round.correct > 0);
  const [name, setName] = useState("");
  const [submit, setSubmit] = useState<Submit>("idle");
  const [nameLeft, setNameLeft] = useState(false);
  const failure = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (submit === "failed") failure.current?.focus();
  }, [submit]);

  const guess = guessCountry({ saved, geo: geo ?? null, languages: geo === undefined ? [] : navigator.languages });
  const trimmed = name.trim();
  const lengthProblem = playerNameProblem(trimmed);
  const nameProblem =
    lengthProblem === "blocked"
      ? "nameBlocked"
      : lengthProblem === "long"
        ? "nameLong"
        : lengthProblem === "short" && nameLeft && trimmed.length > 0
          ? "nameShort"
          : null;
  const nameFits = lengthProblem === null;
  const sending = submit === "sending";

  if (round.correct === 0) return <p className="daily-note daily-join">{t("noneRight")}</p>;

  const join = async (event: FormEvent) => {
    event.preventDefault();
    if (!nameFits || guess === null || sending) return;
    setSubmit("sending");
    // The server's own reason is English, so the player is told in their language that the join failed.
    const posted = await postLeaderboardEntry(dailySubmission(round, trimmed, guess.code, rating)).catch(() => null);
    const entry = posted?.ok ? (posted.entry ?? entryFromRow(posted.row, Date.now())) : null;
    if (entry?.difficulty === DAILY_BOARD) onJoined(entry);
    else setSubmit("failed");
  };

  return (
    <form className="daily-join" onSubmit={join} noValidate>
      <h3 className="daily-join-title">{title ?? t("title")}</h3>
      <div className="daily-field">
        <label htmlFor={ids.name}>{t("name")}</label>
        <input
          id={ids.name}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => setNameLeft(true)}
          autoComplete="nickname"
          aria-invalid={nameProblem !== null}
          aria-describedby={nameProblem ? `${ids.nameHint} ${ids.nameError}` : ids.nameHint}
          disabled={sending}
          required
        />
        <p id={ids.nameHint} className="daily-hint">{t("nameHint")}</p>
        {nameProblem && (
          <p id={ids.nameError} className="daily-hint daily-error">
            {t(nameProblem)}
          </p>
        )}
      </div>
      <div className="daily-field">
        <label htmlFor={ids.country}>{t("country")}</label>
        <CountryPicker id={ids.country} value={guess?.code ?? null} onChange={setCountryCode} disabled={sending} placeholder={t("chooseCountry")} withWorld={false} describedBy={ids.countrySource} />
        <p className="daily-hint">
          <span id={ids.countrySource}>{t(`from.${guess?.source ?? "none"}`)}</span>{" "}
          {guess && (
            <button type="button" className="daily-change" onClick={() => document.getElementById(ids.country)?.click()} disabled={sending}>
              {t("change")}
            </button>
          )}
        </p>
      </div>
      {submit === "failed" && (
        <p ref={failure} role="alert" tabIndex={-1} className="daily-error">
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
