import { Link } from "@/i18n/navigation";
import { LabReadingSection } from "@/components/lab-paper/LabReadingPage";
import { articlePath } from "@/lib/articles/paths";
import { DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS, RECALL_CSV_PAGE, RECALL_README_PAGE, findCell, type RecallDataset } from "@/lib/data/recall";

const englishNumber = new Intl.NumberFormat("en");
const englishDate = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" });
export const englishDay = (iso: string) => englishDate.format(new Date(`${iso}T12:00:00Z`));

export function RecallNotes({ data }: { readonly data: RecallDataset }) {
  const n = (value: number) => englishNumber.format(value);
  const range = `${englishDay(data.start)} to ${englishDay(data.end)}`;
  const defaultRound = findCell(data, DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS);

  return (
    <>
      <LabReadingSection title="Method" id="method">
        <p>
          Every number here comes from the game. When a round&apos;s result shows, Memory Chess sends one Google Analytics 4 event,
          round_complete, with the number of pieces, the study time and the round&apos;s accuracy. The event has fired since September 29,
          2026, so there is no earlier data. This release covers {range}, counted in days of the America/Los_Angeles time zone the
          analytics property uses.
        </p>
        <p>
          A piece counts only when the right piece of the right colour stands on the right square. Accuracy is the share of the
          position&apos;s pieces placed that way, rounded to a whole percent, minus 10 points for each piece placed beyond the
          position&apos;s count, and never below 0. A perfect round scores 100: every piece right and nothing extra. Each round is a new
          legal position generated at random, not one taken from a real game.
        </p>
        <p>
          A setting is shown only with at least {n(data.minRounds)} rounds from at least {n(data.minPlayers)} players, because smaller
          groups are mostly one or two people. Of {n(data.totalRounds)} rounds, {n(data.publishedRounds)} fall in the{" "}
          {n(data.cells.length)} settings shown, {n(data.roundsInSmallCells)} in smaller settings, and {n(data.roundsWithoutSettings)}{" "}
          arrived without their settings. The median and the middle half (the 25th to the 75th percentile) are nearest-rank values of
          the whole-number scores.
        </p>
      </LabReadingSection>
      <LabReadingSection title="Limits" id="limits">
        <ul>
          <li>
            Players chose to play and chose their settings. People who pick harder settings tend to be stronger, so each row describes
            the players who chose it, not people in general.
          </li>
          <li>Repeat players weigh more: one player&apos;s 50 rounds count 50 times. Compare the Rounds and Players columns.</li>
          <li>
            {DEFAULT_ROUND_PIECES} pieces with {DEFAULT_ROUND_SECONDS} seconds is the default round, so it holds the most players ({n(defaultRound.players)})
            and likely many first rounds.
          </li>
          <li>A player is a browser as Google Analytics counts it. One person on two devices counts twice.</li>
          <li>Rounds from visitors who block analytics, or decline analytics cookies where they are asked, are missing.</li>
          <li>
            Recall studies find that chess skill helps far more on positions from real games than on random ones (see{" "}
            <Link href={articlePath("adriaan-de-groot")}>de Groot&apos;s 1944 test, by the numbers</Link>). These positions are random,
            so in my judgement they measure short-term memory for pieces more than chess knowledge.
          </li>
        </ul>
      </LabReadingSection>
      <LabReadingSection title="How to cite" id="cite">
        <p>
          Cheng, B. (2026). <i>Memory Chess position recall data, {range}</i> [Data set]. Memory Chess.
          https://thememorychess.com/data
        </p>
        <p>
          The data is free to reuse under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit Memory Chess and
          link this page. The <a href={RECALL_CSV_PAGE}>CSV</a> and the <a href={RECALL_README_PAGE}>field notes</a> are on GitHub, with
          a new release planned each month.
        </p>
      </LabReadingSection>
    </>
  );
}
