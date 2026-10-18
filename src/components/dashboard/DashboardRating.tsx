"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DASHBOARD_PLAY_HREF, trendOf } from "@/lib/lab/dashboard";
import type { Tone } from "@/lib/lab/progressSeries";
import type { RatingHistory } from "@/lib/lab/ratingHistory";
import { niceTicks } from "./chartGeometry";
import { ProgressChart } from "./ProgressChart";
import { TrendChip } from "./TrendChip";

const toneOf = (change: number): Tone => (change > 0 ? "better" : change < 0 ? "worse" : "level");

function RatingLine({ history: { current, start, steps, peak, isNewPeak, period } }: { history: RatingHistory }) {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const ratings = [start, ...steps.map(({ rating }) => rating)];
  const { ticks, domain } = niceTicks(Math.min(...ratings), Math.max(...ratings), 4);
  const dateOf = (at: number) => format.dateTime(at, { dateStyle: "medium" });
  const signed = (change: number) => format.number(change, { signDisplay: "exceptZero" });
  const periodWords =
    period.kind === "rounds"
      ? t("rating.periodRounds", { count: period.rounds })
      : t(period.change === 0 ? "rating.periodLevel" : "rating.periodDays", { days: period.days });

  return (
    <>
      <div className="lab-rating-hero">
        <span className="lab-rating-value">{format.number(current)}</span>
        <span className="lab-rating-period">
          <TrendChip trend={trendOf(period.change)} />
          <span>{periodWords}</span>
        </span>
      </div>
      <ProgressChart
        variant="rating"
        tone={toneOf(current - start)}
        line={ratings}
        domain={domain}
        ticks={ticks.map((value) => ({ value, label: format.number(value) }))}
        xLabels={[t("chart.start"), dateOf(steps[steps.length - 1].at)]}
        best={{ index: peak.index, value: peak.rating, label: isNewPeak ? t("rating.newPeak") : t("rating.peak", { rating: format.number(peak.rating) }) }}
        tips={[
          { value: format.number(start), label: t("chart.start") },
          ...steps.map(({ at, rating, change }) => ({ value: format.number(rating), label: `${dateOf(at)} · ${signed(change)}` })),
        ]}
        label={t("rating.aria", { count: steps.length, start: format.number(start), current: format.number(current), peak: format.number(peak.rating) })}
        table={{
          head: [t("chart.col.round"), t("chart.col.date"), t("chart.col.rating"), t("chart.col.change")],
          rows: [
            [t("chart.start"), "", format.number(start), ""],
            ...steps.map(({ at, rating, change }, index) => [String(index + 1), dateOf(at), format.number(rating), signed(change)]),
          ],
        }}
      />
    </>
  );
}

/**
 * The skill rating after each held round, the current rating large above it with its change over the last week. The hero
 * row and the plot box keep their heights in every state, so the summary under the card never moves.
 */
export function DashboardRating({ history }: { history: RatingHistory | null | "pending" }) {
  const t = useTranslations("dashboard");
  const ready = history !== "pending" && history !== null && history.steps.length > 0;

  return (
    <article className="lab-dash-panel lab-rating" data-panel="rating" data-state={ready ? "ready" : history === "pending" ? "pending" : "empty"}>
      <h3>{t("rating.title")}</h3>
      <p className="lab-dash-panel-desc">{t("rating.desc")}</p>
      {ready ? (
        <RatingLine history={history} />
      ) : (
        <>
          <div className="lab-rating-hero" aria-hidden="true" />
          <div className="lab-pc">
            <div className="lab-pc-plot" data-variant="rating">
              {history !== "pending" && (
                <div className="lab-rating-empty">
                  <p>{t("rating.empty")}</p>
                  <Link className="lab-tile-go" href={DASHBOARD_PLAY_HREF}>
                    {t("play")} →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </article>
  );
}
