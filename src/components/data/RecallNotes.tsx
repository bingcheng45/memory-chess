import { Link } from "@/i18n/navigation";
import { LabReadingSection } from "@/components/lab-paper/LabReadingPage";
import { articlePath } from "@/lib/articles/paths";
import { DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS, RECALL_CSV_PAGE, RECALL_README_PAGE, findCell, type RecallDataset } from "@/lib/data/recall";

const englishNumber = new Intl.NumberFormat("en");
const englishTenth = new Intl.NumberFormat("en", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const englishDate = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" });
export const englishDay = (iso: string) => englishDate.format(new Date(`${iso}T12:00:00Z`));

export function RecallNotes({ data }: { readonly data: RecallDataset }) {
  const n = (value: number) => englishNumber.format(value);
  const tenth = (value: number) => englishTenth.format(value);
  const range = `${englishDay(data.start)} to ${englishDay(data.end)}`;
  const defaultRound = findCell(data, DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS);

  return (
    <>
      <LabReadingSection title="Method" id="method">
        <p>
          Every number here comes from the game. When a round&apos;s result shows, Memory Chess sends one Google Analytics 4 event,
          round_complete, with the number of pieces, the study time the round was set to and the round&apos;s accuracy. The study time
          is that setting, not the time the board was actually shown. A player can clear the board early. The event has fired since
          September 29, 2026, so there is no earlier data. This release covers {range}, counted in days of the America/Los_Angeles
          time zone the analytics property uses.
        </p>
        <p>
          A piece counts only when the right piece of the right colour stands on the right square. Accuracy is the share of the
          position&apos;s pieces placed that way, rounded to a whole percent, minus 10 points for each piece placed beyond the
          position&apos;s count, and never below 0. A perfect round scores 100: every piece right and nothing extra. Most rounds show a new
          legal position generated at random. A review round replays a board the player saw before, and the daily board is one seeded
          random position, the same for everyone that day. None is taken from a real game.
        </p>
        <p>
          A setting is shown only with at least {n(data.minRounds)} rounds from at least {n(data.minPlayers)} players. Those cuts are my
          judgement: smaller groups were mostly one or two people, and a setting near the cut is still a small sample. Of {n(data.totalRounds)} rounds from {n(data.totalPlayers)} players, {n(data.publishedRounds)} fall in the{" "}
          {n(data.cells.length)} settings shown, {n(data.roundsInSmallCells)} in smaller settings, and {n(data.roundsWithoutSettings)}{" "}
          arrived without their settings. The median and the middle half (the 25th to the 75th percentile) are nearest-rank values of
          the whole-number scores.
        </p>
        <p>
          Four settings are one-click presets: 2 pieces at 10 seconds (Easy), 6 at 10 (Medium), 12 at 8 (Hard) and 20 at 5
          (Grandmaster). Those rows can include rounds from players who clicked a preset rather than picked a setting. 20 at 5 has too
          few rounds to show.
        </p>
        <p>
          The Google Analytics reports behind this release were unsampled and had no &ldquo;(other)&rdquo; row, so every setting is
          counted in full. Google Analytics may withhold or round user counts that fall under its privacy thresholds, so the Players
          column can be lower than the real number of browsers.
        </p>
      </LabReadingSection>
      <LabReadingSection title="Limits" id="limits">
        <ul>
          <li>
            Players chose to play and chose their settings, so each row describes the players who chose it, not people in general.
            The data has no ratings, but in my judgement people who pick harder settings are likely better at this game.
          </li>
          <li>Repeat players weigh more: one player&apos;s 50 rounds count 50 times. Compare the Rounds and Players columns.</li>
          <li>
            {DEFAULT_ROUND_PIECES} pieces with {DEFAULT_ROUND_SECONDS} seconds is the default round, and the home page&apos;s calibration
            round uses the same setting and is pooled into it. It holds the most players ({n(defaultRound.players)}).
          </li>
          <li>
            An empty board counts as a round that scored 0. Since October 14 the game has accepted one empty board a day as a free
            skip, and the analytics event cannot tell a skip from a real 0, so skips are in the data. The Scored 0 column gives each setting&apos;s
            share, {tenth(defaultRound.zeroShare)}% for the {DEFAULT_ROUND_PIECES}-piece, {DEFAULT_ROUND_SECONDS}-second rounds.
          </li>
          <li>
            Review rounds, which replay a board the player saw before, and the daily board, the same seeded position for everyone that
            day, are pooled with the other rounds. The data cannot separate them.
          </li>
          <li>
            The game changed during this release. The calibration round&apos;s event, review rounds, the daily board and the free skip
            all reached players on October 14, so the 15 days before then hold none of them.
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
