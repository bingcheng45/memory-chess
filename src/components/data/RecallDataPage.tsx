import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { LabReadingPage } from "@/components/lab-paper/LabReadingPage";
import {
  DEFAULT_ROUND_PIECES,
  DEFAULT_ROUND_SECONDS,
  RECALL_CSV_PAGE,
  RECALL_README_PAGE,
  cellsAtSeconds,
  cellsWithPieces,
  presetCells,
  recallStructuredData,
  type RecallCell,
  type RecallDataset,
} from "@/lib/data/recall";
import { RecallNotes } from "./RecallNotes";
import "./recall.css";

type Translate = Awaited<ReturnType<typeof getTranslations<"data">>>;
type Formatter = Awaited<ReturnType<typeof getFormatter>>;

interface ChartRow {
  readonly cell: RecallCell;
  readonly label: string;
}

function RecallChart({ id, title, rows, t, percent }: { id: string; title: string; rows: readonly ChartRow[]; t: Translate; percent: (value: number) => string }) {
  return (
    <figure className="recall-chart" aria-labelledby={id}>
      <figcaption id={id}>{title}</figcaption>
      <ul>
        {rows.map(({ cell, label }) => (
          <li key={label} className="recall-bar">
            <span className="recall-bar-label">{label}</span>
            <span className="recall-bar-track" aria-hidden="true">
              <i style={{ width: `${cell.meanAccuracy}%` }} />
            </span>
            <span className="recall-bar-value">
              {percent(cell.meanAccuracy)}
              <small>{t("chart.rounds", { count: cell.rounds })}</small>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function RecallTable({ data, t, format }: { data: RecallDataset; t: Translate; format: Formatter }) {
  const percent = (value: number) => format.number(value / 100, { style: "percent" });
  const tenth = (value: number) => format.number(value / 100, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <>
      <p className="recall-caption" id="recall-table-caption">
        {t("table.caption", { minRounds: data.minRounds, minPlayers: data.minPlayers })}
      </p>
      <div className="recall-scroll" tabIndex={0} role="region" aria-labelledby="recall-table-title">
        <table className="recall-table" aria-labelledby="recall-table-title" aria-describedby="recall-table-caption">
          <thead>
            <tr>
              <th scope="col">{t("table.pieces")}</th>
              <th scope="col">{t("table.seconds")}</th>
              <th scope="col" className="recall-num">{t("table.rounds")}</th>
              <th scope="col" className="recall-num">{t("table.players")}</th>
              <th scope="col" className="recall-num">{t("table.mean")}</th>
              <th scope="col" className="recall-num">{t("table.median")}</th>
              <th scope="col" className="recall-num">{t("table.middle")}</th>
              <th scope="col" className="recall-num">{t("table.perfect")}</th>
              <th scope="col" className="recall-num">{t("table.zero")}</th>
            </tr>
          </thead>
          <tbody>
            {data.cells.map((cell) => (
              <tr key={`${cell.pieceCount}/${cell.memorizeSeconds}`}>
                <th scope="row">{format.number(cell.pieceCount)}</th>
                <td>{t("chart.seconds", { count: cell.memorizeSeconds })}</td>
                <td className="recall-num">{format.number(cell.rounds)}</td>
                <td className="recall-num">{format.number(cell.players)}</td>
                <td className="recall-num">{tenth(cell.meanAccuracy)}</td>
                <td className="recall-num">{percent(cell.medianAccuracy)}</td>
                <td className="recall-num">
                  {t("table.middleValue", { low: percent(cell.p25Accuracy), high: percent(cell.p75Accuracy) })}
                </td>
                <td className="recall-num">{tenth(cell.perfectShare)}</td>
                <td className="recall-num">{tenth(cell.zeroShare)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export async function RecallDataPage({ data, locale }: { readonly data: RecallDataset; readonly locale: string }) {
  const t = await getTranslations({ locale, namespace: "data" });
  const format = await getFormatter({ locale });
  const whole = (value: number) => format.number(value / 100, { style: "percent", maximumFractionDigits: 0 });
  const tenth = (value: number) => format.number(value / 100, { style: "percent", maximumFractionDigits: 1 });
  const day = (iso: string) => format.dateTime(new Date(`${iso}T12:00:00Z`), { dateStyle: "long", timeZone: "UTC" });
  const { easy, medium, hard } = presetCells(data);
  const isEnglish = locale === DEFAULT_LOCALE;

  const answer = t("answer", {
    rounds: data.totalRounds,
    start: day(data.start),
    end: day(data.end),
    two: whole(easy.meanAccuracy),
    twoRounds: easy.rounds,
    six: whole(medium.meanAccuracy),
    sixRounds: medium.rounds,
    sixPerfect: tenth(medium.perfectShare),
    twelve: whole(hard.meanAccuracy),
    twelvePerfect: tenth(hard.perfectShare),
    twelveRounds: hard.rounds,
  });
  const structuredData = recallStructuredData(data, {
    name: t("meta.title"),
    description: t("meta.description", { rounds: data.totalRounds }),
  });

  return (
    <LabReadingPage locale={locale} kicker={t("kicker")} title={t("title")} lede={answer}>
      <section className="lab-read-sec recall-figures">
        <RecallChart
          id="recall-by-pieces"
          title={t("chart.byPieces", { seconds: DEFAULT_ROUND_SECONDS })}
          rows={cellsAtSeconds(data, DEFAULT_ROUND_SECONDS).map((cell) => ({ cell, label: t("chart.pieces", { count: cell.pieceCount }) }))}
          t={t}
          percent={whole}
        />
        <p className="recall-scale">{t("chart.byPiecesNote")}</p>
        <RecallChart
          id="recall-by-seconds"
          title={t("chart.bySeconds", { pieces: DEFAULT_ROUND_PIECES })}
          rows={cellsWithPieces(data, DEFAULT_ROUND_PIECES).map((cell) => ({ cell, label: t("chart.seconds", { count: cell.memorizeSeconds }) }))}
          t={t}
          percent={whole}
        />
        <p className="recall-scale">{t("chart.bySecondsNote")}</p>
        <p className="recall-scale">{t("chart.scale")}</p>
      </section>
      <section className="lab-read-sec" id="table">
        <h2 id="recall-table-title">{t("table.title")}</h2>
        <RecallTable data={data} t={t} format={format} />
        <p className="recall-actions">
          <a className="lab-btn lab-btn-primary" href={RECALL_CSV_PAGE}>
            {t("links.csv")}
          </a>
          <a className="lab-btn lab-btn-secondary" href={RECALL_README_PAGE}>
            {t("links.notes")}
          </a>
          <Link className="lab-btn lab-btn-secondary" href="/game">
            {t("links.play")}
          </Link>
        </p>
      </section>
      <div lang={isEnglish ? undefined : DEFAULT_LOCALE}>
        {isEnglish ? null : (
          <p className="lab-read-note" lang={locale}>
            {t("englishNote")}
          </p>
        )}
        <RecallNotes data={data} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    </LabReadingPage>
  );
}
