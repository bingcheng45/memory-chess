# Memory Chess position recall data

How well people recall chess positions in [Memory Chess](https://thememorychess.com/data): one row per number of pieces and study time setting, from the finished rounds Google Analytics recorded between the dates in the file, for each setting with enough rounds and players. The page at https://thememorychess.com/data draws the same numbers.

- `latest.csv` and `latest.json`: the current release.
- `<yyyy-mm-dd>.json`: each release, named by the last day it covers.

Current release: 29 September to 19 October 2026, 3,734 finished rounds, of which 2,564 fall in the 11 published cells.

## Fields

| CSV column | JSON field | Meaning |
|---|---|---|
| `piece_count` | `pieceCount` | Pieces in the position, 2 to 32. |
| `memorize_seconds` | `memorizeSeconds` | The study time the round was set to, in seconds. A player can clear the board early, so the position may have been shown for less. |
| `rounds` | `rounds` | Finished rounds with this setting. |
| `players` | `players` | Distinct GA4 users who finished one: browsers, not people. |
| `mean_accuracy` | `meanAccuracy` | Mean round accuracy, 0 to 100, to one decimal. |
| `median_accuracy` | `medianAccuracy` | Median round accuracy. |
| `p25_accuracy`, `p75_accuracy` | `p25Accuracy`, `p75Accuracy` | The 25th and 75th percentile round accuracy. |
| `perfect_share` | `perfectShare` | Percent of rounds scored 100: every piece on its square, nothing extra. |
| `zero_share` | `zeroShare` | Percent of rounds scored 0, which includes empty boards (see Limits). |

The JSON also gives the totals: `totalRounds` in the date range, `roundsWithoutSettings` (events that reached GA4 without their parameters), `roundsInSmallCells` (left out by the thresholds below) and `publishedRounds`.

## Method

- **Source.** The game sends a GA4 event, `round_complete`, when a round's result shows. It carries the piece count, the study time setting and the round's accuracy. Rounds from the game page, review rounds, the daily board and the calibration round on the home page all send it, and all are pooled here. It has fired since 29 September 2026, so no earlier data exists. Dates are days in the property's time zone, America/Los_Angeles.
- **Accuracy.** A piece counts only when the right piece of the right colour stands on the right square. Accuracy is the share of the position's pieces placed that way, rounded to a whole percent, minus 10 points for each piece placed beyond the position's count, and never below 0. The code is `src/lib/game/scoring.ts`.
- **Positions.** Most rounds show a new legal position generated at random. A review round replays a board the player saw before, and the daily board is one seeded random position, the same for everyone that day. None is taken from a real game.
- **Presets.** Four settings are one-click presets: 2 pieces at 10 seconds (Easy), 6 at 10 (Medium, also the default and the calibration round's setting), 12 at 8 (Hard) and 20 at 5 (Grandmaster). Those rows can include rounds from players who clicked a preset rather than picked a setting. 20 at 5 had 26 rounds in this release, below the thresholds.
- **Thresholds.** A setting is published only with at least 30 rounds from at least 5 players. The cuts are a judgement call: smaller cells were mostly one or two people and describe them, not players in general. A cell near the cut (8 pieces at 10 seconds, 31 rounds from 6 players) is still a small sample.
- **Sampling.** Both reports for this release were unsampled (no `samplingMetadatas`) and had no "(other)" row (`dataLossFromOtherRow` false), so every setting is counted in full. Google Analytics may withhold or round user counts that fall under its privacy thresholds, so `players` can be lower than the real number of browsers.
- **Statistics.** Median and percentiles are nearest rank on the whole-number accuracies: the smallest accuracy at or below which at least that share of the rounds fall.
- **Privacy.** Only counts per setting are published. There are no names, player IDs, round IDs, dates per round or positions, and the privacy policy says so.

## Limits

- Players chose to play and chose their settings, so a cell describes the people who chose it, not everyone. There are no ratings; that stronger players pick harder settings is a judgement, not a measurement.
- Repeat players weigh more. A player who finished 50 rounds counts 50 times. Compare `rounds` with `players`.
- 6 pieces with 10 seconds is the default round, and the home page's calibration round uses the same setting and is pooled into it. That cell holds the most players.
- The game changed during this release. The calibration round's event, review rounds, the daily board and the free skip were all added between 8 and 14 October, so the earliest days hold none of them.
- An empty board counts as a round that scored 0. Since mid-October the game has accepted one empty board a day as a free skip, and the event cannot tell a skip from a real 0 (it sends no count of pieces placed), so skips are in the data. `zero_share` gives each setting's share of rounds that scored 0: 15.7% at 6 pieces and 10 seconds in this release.
- Review rounds and the daily board are pooled with the other rounds. The event's `round_source` parameter is not a registered GA4 dimension, and the older `source` parameter it replaced (PR 118, 18 October) reached GA4 for under a quarter of this release's rounds, so the data cannot separate them.
- A GA4 user is a browser. One person on two devices counts twice.
- Rounds from visitors who blocked analytics or declined analytics cookies are missing.
- Scoring is strict: a knight on the right square in the wrong colour scores nothing.

## License and citation

CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Use it for anything, with credit. Cite as:

> Cheng, B. (2026). Memory Chess position recall data, 29 September to 19 October 2026 [Data set]. Memory Chess. https://thememorychess.com/data

## Refreshing the data (monthly)

Anyone with read access to GA4 property 483086308 can do this. It needs no code changes unless a cell named on the page drops out.

1. Pull two reports for the new range, from 2026-09-29 (or the first day you want) to yesterday. Either use the analytics MCP tool `run_report` and save each response as a JSON file, or open the [batchRunReports API Explorer](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/batchRunReports), set `property` to `properties/483086308`, send this body with your dates and save the response:

   ```json
   {
     "requests": [
       {
         "dateRanges": [{ "startDate": "2026-09-29", "endDate": "2026-10-19" }],
         "dimensions": [{ "name": "customEvent:piece_count" }, { "name": "customEvent:memorize_time" }, { "name": "customEvent:accuracy" }],
         "metrics": [{ "name": "eventCount" }],
         "dimensionFilter": { "filter": { "fieldName": "eventName", "stringFilter": { "matchType": "EXACT", "value": "round_complete" } } },
         "limit": 100000
       },
       {
         "dateRanges": [{ "startDate": "2026-09-29", "endDate": "2026-10-19" }],
         "dimensions": [{ "name": "customEvent:piece_count" }, { "name": "customEvent:memorize_time" }],
         "metrics": [{ "name": "eventCount" }, { "name": "totalUsers" }],
         "dimensionFilter": { "filter": { "fieldName": "eventName", "stringFilter": { "matchType": "EXACT", "value": "round_complete" } } },
         "limit": 100000
       }
     ]
   }
   ```

   Check the response has no `rowCount` above the rows it returned, that `metadata.dataLossFromOtherRow` is false and that `metadata.samplingMetadatas` is empty, so nothing was cut, folded or sampled. End the range at least two days before the pull: GA4 keeps adding late events for a day or two, so a re-pull of the same range can differ by a few rounds (this release's histogram summed to 3,734 rounds, and a total pulled minutes later read 3,736).

2. Keep the saved files outside the repo. From the repo root run:

   ```
   node scripts/data/recall-from-ga4.mjs --start 2026-09-29 --end <last day> <saved file>...
   ```

   It writes `data/recall/<last day>.json`, `latest.json` and `latest.csv`. The same files in give the same bytes out.

3. Update the date range and the counts at the top of this file, the 6-piece `zero_share` in Limits, the sampling line in Method if a report was sampled, and the citation line, then `npm run build` and `npx jest src/lib/data` before you open the PR. The build fails if a cell the page quotes (2 or 6 pieces at 10 seconds, 12 pieces at 8 seconds) is missing.
