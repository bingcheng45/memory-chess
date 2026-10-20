"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics/events";
import { ENTRY_BOARDS, entryKey, withoutEntry, type EntryKey, type StoredEntries, type StoredEntry } from "@/lib/lab/entries";
import { countryName, flagEmoji, WORLD_CODE } from "@/lib/leaderboard/countries";
import type { StandingScope } from "@/lib/leaderboard/standing";
import { checkStanding, type StandingCheck } from "@/lib/leaderboard/standingClient";
import { LEADERBOARD_ROW_LIMIT, RANKED_DIFFICULTIES } from "@/lib/reference/facts";
import { entriesChoice } from "./labChoices";
import { figureOf, PanelHead, useTags } from "./LabRecordPanels";

const BOARD_SKETCH = [
  { rank: "01", width: "86%", pieces: 12 },
  { rank: "02", width: "74%", pieces: 10 },
  { rank: "03", width: "61%", pieces: 8 },
];

type Translate = ReturnType<typeof useTranslations<"home.lab.record.board">>;

interface Seen {
  readonly rank: number;
  readonly checkedAt: number;
}

interface Checked {
  readonly result: StandingCheck;
  readonly entry: StoredEntry;
  readonly before: Seen | null;
}

type Check = { readonly state: "idle" } | { readonly state: "checking" } | ({ readonly state: "done" } & Checked);

const clock = (at: number) => new Date(at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });

function statusOf(t: Translate, difficulty: string, { result, before }: Checked): string {
  switch (result.kind) {
    case "ranked": {
      const { rank, total, country } = result.standing;
      const lines = [
        country === null ? t("ranked", { rank, total, difficulty }) : t("rankedIn", { rank, total, difficulty, country: countryName(country, "en") }),
        t("checkedAt", { time: clock(result.checkedAt) }),
      ];
      if (country === null) lines.push(t("boardSize", { limit: LEADERBOARD_ROW_LIMIT }));
      if (before) {
        const moved = before.rank - rank;
        const time = clock(before.checkedAt);
        lines.push(moved === 0 ? t("same", { time }) : t(moved > 0 ? "up" : "down", { places: Math.abs(moved), time }));
      }
      return lines.join(" ");
    }
    case "missing":
      return t("missing", { difficulty, time: clock(result.checkedAt) });
    case "limited":
      return t("limited", { wait: result.retryAfterSeconds });
    case "noCountry":
    case "offline":
    case "failed":
      return t(result.kind);
  }
}

function Choice<T extends string>({ label, options, value, onChange }: { label: string; options: readonly { value: T; text: string }[]; value: T; onChange: (value: T) => void }) {
  const group = useId();
  return (
    <div className="lab-goal lab-board-choice" role="radiogroup" aria-labelledby={group}>
      <span id={group}>{label}</span>
      {options.map((option) => (
        <label key={option.value}>
          <input type="radio" name={group} checked={option.value === value} onChange={() => onChange(option.value)} />
          <span>{option.text}</span>
        </label>
      ))}
    </div>
  );
}

/** A blindfold entry ranks on its own board, so its name says so. */
function useBoardName(): (entry: StoredEntry) => string {
  const presets = useTranslations("game.presets");
  const config = useTranslations("game.config");
  return (entry) => (entry.mode ? `${presets(`${entry.difficulty}.label`)} · ${config("blindfold")}` : presets(`${entry.difficulty}.label`));
}

function Standing({ t, entries, check, onCheck }: { t: Translate; entries: StoredEntries; check: Check; onCheck: (entry: StoredEntry, scope: StandingScope) => void }) {
  const boardName = useBoardName();
  const kept = ENTRY_BOARDS.flatMap((board) => entries[entryKey(board)] ?? []);
  const latest = kept.reduce((newest, entry) => (entry.submittedAt > newest.submittedAt ? entry : newest));
  const [picked, setPicked] = useState<EntryKey>(entryKey(latest));
  const [scope, setScope] = useState<StandingScope>("world");
  const entry = entries[picked] ?? latest;
  const hasCountry = entry.country !== WORLD_CODE;
  const asked = hasCountry ? scope : "world";

  return (
    <>
      {kept.length > 1 && (
        <Choice
          label={t("difficulty")}
          options={kept.map((option) => ({ value: entryKey(option), text: boardName(option) }))}
          value={entryKey(entry)}
          onChange={setPicked}
        />
      )}
      {hasCountry && (
        <Choice
          label={t("scope")}
          options={[
            { value: "world", text: t("world") },
            { value: "country", text: `${flagEmoji(entry.country)} ${countryName(entry.country, "en")}` },
          ]}
          value={asked}
          onChange={setScope}
        />
      )}
      <p className="lab-note">
        {t("entry", {
          difficulty: boardName(entry),
          correct: entry.score.correctPieces,
          date: new Date(entry.submittedAt).toLocaleDateString("en", { day: "numeric", month: "short" }),
        })}
      </p>
      <button type="button" className="lab-btn lab-btn-secondary lab-board-check" disabled={check.state === "checking"} onClick={() => onCheck(entry, asked)}>
        {t(check.state === "checking" ? "checking" : "check")}
      </button>
    </>
  );
}

export function BoardPanel({ ready }: { ready: boolean }) {
  const t = useTranslations("home.lab.record.board");
  const presets = useTranslations("game.presets");
  const boardName = useBoardName();
  const tags = useTags();
  const stored = entriesChoice.useValue();
  const entries = ready ? stored : null;
  const [check, setCheck] = useState<Check>({ state: "idle" });
  const seen = useRef(new Map<string, Seen>());

  const onCheck = async (entry: StoredEntry, scope: StandingScope) => {
    setCheck({ state: "checking" });
    const result = await checkStanding(entry.id, scope);
    if (result.kind !== "offline") trackEvent({ name: "lab_panel_action", params: { panel: "board", action: "check" } });
    const key = `${entry.id}:${scope}`;
    const before = seen.current.get(key) ?? null;
    if (result.kind === "ranked") seen.current.set(key, { rank: result.standing.rank, checkedAt: result.checkedAt });
    if (result.kind === "missing") entriesChoice.update((current) => withoutEntry(current, entry));
    setCheck({ state: "done", result, entry, before });
  };

  return (
    <div className="lab-panel lab-p-board">
      <PanelHead fig={t("fig", { number: figureOf("board") })} tag={entries ? tags.mine : tags.sample} />
      <h3>{t("title")}</h3>
      <p className="lab-panel-desc">{t("desc")}</p>
      {entries ? (
        <Standing t={t} entries={entries} check={check} onCheck={onCheck} />
      ) : (
        <>
          <div className="lab-chips">
            {RANKED_DIFFICULTIES.map((difficulty) => (
              <span key={difficulty}>{presets(`${difficulty}.label`)}</span>
            ))}
          </div>
          <div aria-hidden="true">
            {BOARD_SKETCH.map(({ rank, width, pieces }) => (
              <div className="lab-lb-row" key={rank}>
                <span className="lab-mono">{rank}</span>
                <span className="lab-lb-bar" style={{ width }} />
                <span className="lab-mono lab-note">{t("sketchPieces", { count: pieces })}</span>
              </div>
            ))}
          </div>
          <p className="lab-note">{t("howTo")}</p>
        </>
      )}
      <p className="lab-note lab-board-status" role="status" data-reserve={entries ? "" : undefined}>
        {check.state === "done" ? statusOf(t, boardName(check.entry), check) : ""}
      </p>
      <Link className="lab-go" href="/leaderboard">
        {t("open")} →
      </Link>
    </div>
  );
}
