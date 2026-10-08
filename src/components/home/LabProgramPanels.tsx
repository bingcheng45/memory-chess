"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import { trackEvent, type LabPanelAction } from "@/lib/analytics/events";
import { playHref } from "@/lib/game/roundLink";
import { SAMPLE_GOAL } from "@/lib/home/labRecord";
import { GOAL_ACCURACY_OPTIONS, GOAL_PIECE_OPTIONS, PLAN_IDS, type PlanId, type StoredPlan, type StoredTarget } from "@/lib/lab/choices";
import { dayDate } from "@/lib/lab/engine";
import { INSIGHT_GUIDES } from "@/lib/lab/insights";
import type { LabResults } from "@/lib/lab/metrics";
import { PLAN_RULES, startRung, type PlanProgress, type PlanStatus, type Rung } from "@/lib/lab/plans";
import type { RoundRecord } from "@/lib/lab/record";
import { seconds } from "./labFormat";
import { planChoice, targetChoice } from "./labChoices";
import { PanelFrame, StaleNote, useTags } from "./LabRecordPanels";

const track = (panel: "plans" | "goal", action: LabPanelAction) => trackEvent({ name: "lab_panel_action", params: { panel, action } });
const rungValues = ({ pieceCount, memorizeSeconds }: Rung) => ({ pieceCount, studyTime: seconds(memorizeSeconds) });
const PLAN_LENGTH: { readonly [K in PlanId]: number | null } = { baseline: PLAN_RULES.baseline.days, edge: PLAN_RULES.edge.days, ladder: null };

/** Interactive once storage is read: `today` is the client's day, and `records` choose the ladder's first rung. */
interface Choosing {
  readonly today: string;
  readonly records: readonly RoundRecord[];
  readonly plan: StoredPlan | null;
}

function StatusLine({ planId, status }: { planId: PlanId; status: PlanStatus }) {
  const t = useTranslations("home.lab.record.plans.status");
  const length = PLAN_LENGTH[planId];
  const { day } = status;
  const key =
    status.kind === "active"
      ? length === null ? "day" : day > length ? "overtime" : "dayOf"
      : status.kind === "done" && status.how === "finished" ? "finished" : status.kind;
  return <p className="lab-plan-status">{t(key, { day, length: length ?? 0 })}</p>;
}

function ProgressLines({ progress }: { progress: PlanProgress }) {
  const t = useTranslations("home.lab.record.plans");
  if (progress.planId === "baseline") {
    const { daysPlayed, comparison } = progress;
    return (
      <>
        <p>{t("baseline.progress", { played: daysPlayed, days: PLAN_RULES.baseline.days })}</p>
        {comparison?.kind === "change" && (
          <p>{t("baseline.compare", { ...comparison, direction: comparison.change > 0 ? "up" : comparison.change < 0 ? "down" : "same", change: Math.abs(comparison.change) })}</p>
        )}
        {comparison?.kind === "tooFew" && <p>{t(comparison.rounds === 0 ? "baseline.compareNone" : "baseline.compareOne")}</p>}
      </>
    );
  }
  if (progress.planId === "edge") {
    const { daysPlayed, daysElapsed, before, since } = progress;
    const { targetDays, days, compareRounds } = PLAN_RULES.edge;
    return (
      <>
        <p>{t("edge.progress", { played: daysPlayed, elapsed: daysElapsed, target: targetDays, days })}</p>
        <p>
          {before.percent !== null && since.percent !== null
            ? t("edge.share", { before: before.percent, beforeRounds: before.rounds, now: since.percent, nowRounds: since.rounds })
            : t("edge.shareMissing", { needed: compareRounds, before: before.rounds, now: since.rounds })}
        </p>
        <EnglishOnlyLink className="lab-go" href={`/learn/${INSIGHT_GUIDES.vision}`} onClick={() => track("plans", "guide")}>
          {(suffix) => `${t("edge.guide")}${suffix} →`}
        </EnglishOnlyLink>
      </>
    );
  }
  const { rung, run, climbed, next } = progress;
  const { runLength: needed, accuracy } = PLAN_RULES.ladder;
  return (
    <>
      <p>{t("ladder.rung", rungValues(rung))}</p>
      <p>{climbed ? t("ladder.climbed", { needed, accuracy }) : t("ladder.run", { run, needed, accuracy })}</p>
      <p>{next ? t("ladder.next", rungValues(next)) : t("ladder.top", { pieceCount: rung.pieceCount })}</p>
    </>
  );
}

/** The setting the plan's play link opens: the plan's rig, or the ladder's next rung once the current one is climbed. */
function playRung(progress: PlanProgress): Rung {
  if (progress.planId !== "ladder") return PLAN_RULES[progress.planId].rung;
  return progress.climbed && progress.next ? progress.next : progress.rung;
}

function StopControl({ onStop }: { onStop: () => void }) {
  const t = useTranslations("home.lab.record.plans");
  const [confirming, setConfirming] = useState(false);
  const confirm = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirming) confirm.current?.focus();
  }, [confirming]);

  if (!confirming) {
    return (
      <button type="button" className="lab-plan-quiet" onClick={() => setConfirming(true)}>
        {t("stop")}
      </button>
    );
  }
  return (
    <>
      <button type="button" className="lab-plan-quiet lab-plan-warn" ref={confirm} onClick={onStop}>
        {t("confirmStop")}
      </button>
      <button type="button" className="lab-plan-quiet" onClick={() => setConfirming(false)}>
        {t("keep")}
      </button>
    </>
  );
}

function PlanCard({ planId, progress, running, choosing }: { planId: PlanId; progress: PlanProgress | null; running: PlanId | null; choosing: Choosing | null }) {
  const t = useTranslations("home.lab.record.plans");
  const title = t(`${planId}.title`);

  const start = () => {
    if (!choosing) return;
    planChoice.set({ planId, startedDay: choosing.today });
    track("plans", "start");
  };
  const end = (how: "stopped" | "finished") => {
    if (!choosing?.plan) return;
    planChoice.set({ ...choosing.plan, ended: { how, day: choosing.today } });
    track("plans", how === "stopped" ? "stop" : "finish");
  };

  const controls = () => {
    if (!choosing) return null;
    if (running) return <p className="lab-note">{t("busy", { title: t(`${running}.title`) })}</p>;
    if (!progress || progress.status.kind !== "active") {
      const first = startRung(planId, choosing.records);
      // A link, since starting opens the plan's first round; the plan is stored on the way, so a new tab starts it too.
      return (
        <Link className="lab-btn lab-btn-secondary" href={playHref(first.pieceCount, first.memorizeSeconds, "plan")} onClick={start}>
          {t(progress ? "again" : "start", { title })}
        </Link>
      );
    }
    const rung = playRung(progress);
    return (
      <>
        <Link className="lab-go" href={playHref(rung.pieceCount, rung.memorizeSeconds, "plan")} onClick={() => track("plans", "play")}>
          {t("play", rungValues(rung))} →
        </Link>
        {progress.planId === "baseline" && (
          <button type="button" className="lab-plan-quiet" onClick={() => end("finished")}>
            {t("finish")}
          </button>
        )}
        <StopControl onStop={() => end("stopped")} />
      </>
    );
  };

  return (
    <div className="lab-plan" data-plan={planId}>
      <span className="lab-k">{t(`${planId}.kicker`)}</span>
      <h4>{title}</h4>
      {progress ? (
        <div className="lab-plan-progress">
          <StatusLine planId={planId} status={progress.status} />
          <ProgressLines progress={progress} />
        </div>
      ) : (
        <ol>
          {(t.raw(`${planId}.steps`) as string[]).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      {/* Rendered empty on the server, so the Start link arriving with the record does not push the cards below down. */}
      <div className="lab-plan-actions">{controls()}</div>
    </div>
  );
}

export function PlansPanel({ result: { readiness, value }, choosing, daysAgo }: { result: LabResults["plans"]; choosing: Choosing | null; daysAgo: number | null }) {
  const t = useTranslations("home.lab.record.plans");
  const tags = useTags();
  const running = value?.status.kind === "active" ? value.planId : null;
  return (
    <PanelFrame panel="plans" name="plans" tag={value ? tags.mine : tags.sample} state={readiness.state} intro={<p className="lab-panel-desc">{t("desc")}</p>}>
      <div className="lab-plans">
        {PLAN_IDS.map((planId) => (
          <PlanCard
            key={planId}
            planId={planId}
            progress={value?.planId === planId ? value : null}
            running={running === planId ? null : running}
            choosing={choosing}
          />
        ))}
      </div>
      {value?.status.kind === "active" && <StaleNote readiness={readiness} daysAgo={daysAgo} panel="plans" />}
    </PanelFrame>
  );
}

function GoalBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="lab-target-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={label}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

function GoalForm({ initial, today, onDone }: { initial: Pick<StoredTarget, "pieceCount" | "accuracy">; today: string; onDone: (() => void) | null }) {
  const t = useTranslations("home.lab.record.goal");
  const id = useId();
  const [pieceCount, setPieceCount] = useState(initial.pieceCount);
  const [accuracy, setAccuracy] = useState(initial.accuracy);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    targetChoice.set({ pieceCount, accuracy, createdDay: today });
    track("goal", "setGoal");
    onDone?.();
  };
  return (
    <form className="lab-target-form" aria-label={t("form")} onSubmit={submit}>
      <label htmlFor={`${id}-pieces`}>{t("pieces")}</label>
      <select id={`${id}-pieces`} value={pieceCount} onChange={(event) => setPieceCount(Number(event.target.value))}>
        {GOAL_PIECE_OPTIONS.map((count) => (
          <option key={count} value={count}>
            {count}
          </option>
        ))}
      </select>
      <label htmlFor={`${id}-accuracy`}>{t("accuracy")}</label>
      <select id={`${id}-accuracy`} value={accuracy} onChange={(event) => setAccuracy(Number(event.target.value))}>
        {GOAL_ACCURACY_OPTIONS.map((value) => (
          <option key={value} value={value}>
            {t("percent", { value })}
          </option>
        ))}
      </select>
      <button type="submit" className="lab-btn lab-btn-secondary">
        {t("set")}
      </button>
      {onDone && (
        <button type="button" className="lab-plan-quiet" onClick={onDone}>
          {t("cancel")}
        </button>
      )}
    </form>
  );
}

export function GoalPanel({ result: { readiness, value }, today, daysAgo }: { result: LabResults["goal"]; today: string | null; daysAgo: number | null }) {
  const t = useTranslations("home.lab.record.goal");
  const tags = useTags();
  const format = useFormatter();
  const [editing, setEditing] = useState(false);
  const day = (localDay: string) => format.dateTime(dayDate(localDay), { day: "numeric", month: "short" });

  const body = () => {
    if (!value) {
      const percent = Math.round((SAMPLE_GOAL.best / SAMPLE_GOAL.accuracy) * 100);
      const sentence = t("sample", { ...SAMPLE_GOAL, percent });
      return (
        <>
          <p>{sentence}</p>
          <GoalBar percent={percent} label={sentence} />
          {today && <GoalForm initial={SAMPLE_GOAL} today={today} onDone={null} />}
        </>
      );
    }
    const { target, best, percent, reached } = value;
    const progress = best && t("progress", { best: best.accuracy, pieceCount: best.pieceCount, percent });
    return (
      <>
        <p className="lab-target-goal">{t("target", { pieceCount: target.pieceCount, accuracy: target.accuracy, date: day(target.createdDay) })}</p>
        {progress ? (
          <>
            <p>{progress}</p>
            <GoalBar percent={percent} label={t("bar", { percent })} />
          </>
        ) : (
          <p className="lab-empty">{t("need", { pieceCount: target.pieceCount })}</p>
        )}
        {reached && <p className="lab-target-reached">{t("reached", { date: day(reached.localDay), accuracy: reached.accuracy, pieceCount: reached.pieceCount })}</p>}
        {today && editing ? (
          <GoalForm initial={target} today={today} onDone={() => setEditing(false)} />
        ) : (
          <div className="lab-plan-actions">
            <button type="button" className="lab-btn lab-btn-secondary" onClick={() => setEditing(true)}>
              {t("newGoal")}
            </button>
            <button
              type="button"
              className="lab-plan-quiet"
              onClick={() => {
                targetChoice.set(null);
                track("goal", "clearGoal");
              }}
            >
              {t("clear")}
            </button>
          </div>
        )}
        {!reached && <StaleNote readiness={readiness} daysAgo={daysAgo} panel="goal" />}
      </>
    );
  };

  return (
    <PanelFrame panel="goal" name="goal" tag={value ? tags.mine : tags.sample} state={readiness.state} intro={<p className="lab-panel-desc">{t("desc")}</p>}>
      {body()}
    </PanelFrame>
  );
}
