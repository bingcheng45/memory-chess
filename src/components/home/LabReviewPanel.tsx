"use client";

import { Fragment, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics/events";
import { playHref } from "@/lib/game/roundLink";
import type { CurvePoint } from "@/lib/lab/curve";
import type { LabResults } from "@/lib/lab/metrics";
import { daysBetween, hasFigure, LAB_THRESHOLDS } from "@/lib/lab/readiness";
import type { RoundRecord } from "@/lib/lab/record";
import { readReviewOpened, REVIEW_DAILY_CAP, reviewQueue, reviewsDone, type ReviewQueue } from "@/lib/lab/review";
import { ForgettingCurve, MeasuredCurve } from "./LabCharts";
import { figureOf, PanelHead, StaleNote, useTags } from "./LabRecordPanels";

type Translate = ReturnType<typeof useTranslations<"home.lab.record.curve">>;

const trackPlay = () => trackEvent({ name: "lab_panel_action", params: { panel: "curve", action: "play" } });

/** Today's next review with a link to it, else that today's reviews are done, else when the next comes back, else how a board gets in. */
function QueueLine({ t, queue, today }: { t: Translate; queue: ReviewQueue; today: string }) {
  const [next] = queue.due;
  if (next && !reviewsDone(queue)) {
    return (
      <>
        <p role="status" className="lab-review-status">
          <span className="lab-review-chip">{t("due", { number: queue.doneToday + 1, cap: REVIEW_DAILY_CAP })}</span>
        </p>
        <Link className="lab-btn lab-btn-secondary lab-review-play" href={playHref(next.pieceCount, next.memorizeSeconds, "review")} onClick={trackPlay}>
          {t("play")} →
        </Link>
      </>
    );
  }
  const status = reviewsDone(queue) ? t("capped") : queue.next ? t("waiting", { days: daysBetween(today, queue.next), queued: queue.queued }) : t("empty");
  return (
    <p role="status" className="lab-review-status">
      {status}
    </p>
  );
}

function pointLabel(t: Translate, { day, accuracy, count }: CurvePoint): string {
  return day === 0 ? t("pointFirst", { accuracy, count }) : t("pointAfter", { day, accuracy, count });
}

interface ReviewPanelProps {
  readonly result: LabResults["curve"];
  readonly records: readonly RoundRecord[];
  /** The client's local day, "" on the server and while the record loads, when no queue is shown. */
  readonly today: string;
  readonly daysAgo: number | null;
}

/** The review queue and the forgetting curve it measures. Until one gap has enough reviews, the curve is the illustrative model. */
export function ReviewPanel({ result, records, today, daysAgo }: ReviewPanelProps) {
  const t = useTranslations("home.lab.record.curve");
  const tags = useTranslations("home.lab.tags");
  const mine = useTags().mine;
  const { readiness, value } = result;
  const measured = hasFigure(readiness) && value ? value : null;
  const queue = useMemo(() => (today ? reviewQueue(records, today, readReviewOpened()) : null), [records, today]);

  return (
    <div className="lab-panel lab-p-curve">
      <PanelHead
        fig={t("fig", { number: figureOf("curve") })}
        tag={measured ? mine : <span key="illustrative" className="lab-tag lab-tag-blue">{tags("illustrative")}</span>}
      />
      <h3>{t("title")}</h3>
      <p className="lab-panel-desc">{t("desc")}</p>
      <div className="lab-review-queue" key={queue?.due.length ? "due" : "quiet"}>
        {queue && <QueueLine t={t} queue={queue} today={today} />}
      </div>
      <Fragment key={measured ? "measured" : "model"}>
        {measured ? (
          <>
            <MeasuredCurve points={measured.points} label={t("measuredAria", { points: measured.points.map((point) => pointLabel(t, point)).join(", ") })} />
            <p className="lab-note">{t("measuredNote", { reviews: measured.reviews, boards: measured.boards, min: LAB_THRESHOLDS.curveReviews })}</p>
          </>
        ) : (
          <>
            <ForgettingCurve />
            {readiness.state === "warming" && readiness.need?.reviews && <p className="lab-note">{t("warming", { reviews: readiness.need.reviews })}</p>}
            <p className="lab-note">{t("note")}</p>
          </>
        )}
      </Fragment>
      <StaleNote readiness={readiness} daysAgo={daysAgo} panel="curve" />
    </div>
  );
}
