import { getTranslations } from "next-intl/server";
import { WEEKLY_ARC, type Band } from "@/lib/daily/schedule";
import { DAY_MS } from "@/lib/lab/readiness";

/** 2026-10-12 is a Monday; the table reads the week from there, the way the arc is told. */
const MONDAY = Date.UTC(2026, 9, 12);
const WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

type Translate = Awaited<ReturnType<typeof getTranslations<"daily.reference">>>;

const piecesOf = (t: Translate, { pieces: { min, max } }: Band) => (min === max ? String(min) : t("range", { min, max }));

const secondsOf = (t: Translate, { seconds: { min, max } }: Band) =>
  min === max ? t("secondsExact", { count: min }) : t("secondsRange", { min, max });

/** What the page is for, server rendered, so a reader without JavaScript and a crawler both get the rules of the board. */
export async function DailyReference({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "daily.reference" });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });

  return (
    <section className="daily-ref" aria-labelledby="daily-ref-title">
      <h2 id="daily-ref-title">{t("title")}</h2>
      <p>{t("shared")}</p>
      <p>{t("oneTry")}</p>
      <p>{t("grid")}</p>
      <p>{t("join")}</p>
      <p>{t("ranking")}</p>
      <h3>{t("arcTitle")}</h3>
      <p>{t("arcIntro")}</p>
      <table className="daily-arc">
        <thead>
          <tr>
            <th scope="col">{t("day")}</th>
            <th scope="col">{t("pieces")}</th>
            <th scope="col">{t("seconds")}</th>
          </tr>
        </thead>
        <tbody>
          {WEEK.map((day, index) => (
            <tr key={day}>
              <th scope="row">{weekday.format(MONDAY + index * DAY_MS)}</th>
              <td>{piecesOf(t, WEEKLY_ARC[day])}</td>
              <td>{secondsOf(t, WEEKLY_ARC[day])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
