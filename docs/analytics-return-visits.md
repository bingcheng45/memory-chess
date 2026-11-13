# Return visits on round_complete

A game round's `round_complete` event says whether it is the player's first round or a return visit, so day-1 and day-7 return rates can be read in GA4. The event name and its other parameters are unchanged. The homepage calibration round does not send these three.

## The three parameters

| Parameter | Values | What it means |
| --- | --- | --- |
| `days_since_first_round` | a whole number, or `unknown` | Local days since the first game round on this device. `0` on the first day, `1` the next day, `7` a week on. `unknown` when the browser record was saved before this change, or the device clock is set before the first round's day. Never a guess. |
| `rounds_played` | `1`, `2-5`, `6+` | This round's count among the game rounds on this device, rated or not, this one included. |
| `board_type` | `daily`, `free` | `daily` for today's daily board, `free` for every other round, reviews included. |

They are worked out in the browser from the game record in local storage (`memory-chess-storage`). That record now also keeps `firstRoundDay` (a local day such as `2026-11-08`, never a time) and `roundsPlayed` (a count). No id, cookie, name, date or score tied to a name is added to the event. A player who has scored rounds but no saved `firstRoundDay`, because they played before this change or while `RETURN_VISIT_DISCLOSED` was `false`, gets `unknown` on their next counted round and keeps it for good. Their count continues from the rated rounds their rating had seen.

## Register them in GA4 (manual)

GA4 property 483086308: Admin, Data display, Custom definitions, Create custom dimension. Create three, each with scope **Event**:

| Dimension name | Scope | Event parameter |
| --- | --- | --- |
| Days since first round | Event | `days_since_first_round` |
| Rounds played | Event | `rounds_played` |
| Board type | Event | `board_type` |

GA4 fills a custom dimension only from the day it is registered, so register them before or on the day this ships.

## Check it

1. Open thememorychess.com in a fresh private window with the Google Analytics Debugger Chrome extension on, and GA4 DebugView open (Admin, DebugView).
2. Play one round on /game. Its `round_complete` should show `days_since_first_round: 0`, `rounds_played: 1`, `board_type: free`.
3. Play a second round. It should show `days_since_first_round: 0`, `rounds_played: 2-5`.
4. Play today's daily board. It should show `board_type: daily`.

## The number it enables

Day-1 return rate: users whose `round_complete` has `days_since_first_round = 1`, over users whose `round_complete` had `days_since_first_round = 0` and `rounds_played = 1` the day before. Day-7 is the same with `7`. In a GA4 free-form exploration, use the event `round_complete`, the dimension "Days since first round", and the metric Total users.

## Privacy page

The privacy page names these three and the two stored values, in English and all 23 translations, in the "Cookies and browser storage" section. `RETURN_VISIT_DISCLOSED` in `src/lib/analytics/returnVisitDisclosure.ts` is `true` since that text shipped. Set it back to `false` to stop sending the three and saving the two values; the privacy text then over-states what is sent until it is changed too.
