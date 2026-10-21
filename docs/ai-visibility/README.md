# AI visibility tracking

This folder tracks whether AI assistants and AI answer boxes name Memory Chess. It holds five measures, a baseline taken in October 2026, goals for January 2027, and a log that grows by one row each month. An agent with a browser, Claude's WebSearch tool and the GA4 connector can run the whole check from this file.

- [questions.md](questions.md) holds the 43 fixed searches and their results.
- [mentions.md](mentions.md) holds the third-party pages that name Memory Chess, the owner-submitted listings, and the Phase 4 targets.

The research behind the baseline is in the `aivis/` notes of the October 2026 planning session (`0-ga4.md`, `2-landscape.md`, `3-distribution.md`). Those notes are not in the repo. Every baseline number below is copied into this folder with its date, so the check does not need them.

## Measures, baseline and goals

The goals are targets the plan proposed, not predictions. The 3-month goal date is 2027-01-20.

| Measure | Baseline | Baseline date and source | Goal |
|---|---|---|---|
| AI answers that name the Memory Chess trainer at thememorychess.com, out of the 43 rows in questions.md | 4 of 43 | Searches run 2026-10-20 | 12 of 43 |
| Visits from AI assistants | about 66 a month | GA4, 90 days to 2026-10-18 (about 198 sessions), pulled 2026-10-20 | 150 a month |
| Share of AI-assistant visits that land on a guide or the data page | about 7% | GA4, same 90 days | 25% |
| Independent third-party pages that name Memory Chess | 0 | Research on 2026-10-20, rule rechecked 2026-10-21 | 10 |
| Bing ranks thememorychess.com, not memory-chess.vercel.app | no | Bing search on 2026-10-20 | yes |

Two details sit behind the GA4 baselines:

- The research summed about 198 AI-assistant sessions over 90 days. A rerun of the same report on 2026-10-21 returned 199, because GA4 still adds late hits for a few days. 198 divided by 3 gives the "about 66 a month".
- The rerun on 2026-10-21 found 14 of the 199 sessions landing on a `/learn` page, which is 7.0%. The `/data` page did not exist yet in that window.

The mentions baseline is 0, not the plan's 2. The plan's 2 matches the only two pages in the research on hosts the owner does not run, thistools.app and the TrustMRR listing, counted under that looser rule. The rule in [mentions.md](mentions.md) now counts only independent pages. A counted page is on a host the owner does not run, was not written or submitted by the owner, and is not an automatic copy. TrustMRR is a listing the owner wrote, so it moves to the owner-submitted table. Nobody has confirmed who submitted the thistools.app listing, so it waits as "unconfirmed" until the owner says. The goal stays at 10, and it counts only independent pages.

## Run the monthly check

Run the check once a month, in the first week, for the calendar month that just ended. AI answers change from run to run, so read the score as a count across many rows, not as the fate of one question. Do not sign in to anything. Do not post, submit or change anything on any site, in GA4, or in Search Console.

### 1. Score the 43 questions

The engines that can be read without signing in:

- **Google.** Open `https://www.google.com/search?q=<question>&hl=en` in a browser. Wait for the AI Overview to finish loading. If it shows "Show more", expand it.
- **Bing.** Open `https://www.bing.com/search?q=<question>`. Read the Copilot answer box at the top. Do not open Bing "AI Mode".
- **WebSearch.** Call Claude's WebSearch tool with the question as the query. Read the answer it returns.

Perplexity returned "Sign up and repeat your request" on 2026-10-20, and ChatGPT and Copilot chat need a sign-in. The check does not read them. Their GA4 visits in step 2 stand in for them.

For each row in [questions.md](questions.md):

1. Run the question on the row's engine, typed exactly as written.
2. Fill the "AI" cell with one of the values below.
3. Fill the "org" cell with one of the values below.
4. If the result page does not load, retry once. If it still fails, record "failed" in both cells and say so in the log.

Values for the "AI" cell:

- **yes.** The AI answer names the Memory Chess trainer at thememorychess.com. That means one of three things. It names the domain thememorychess.com. It links to or cites a thememorychess.com page, or the old host memory-chess.vercel.app. Or it calls the tool Memory Chess (or MemoryChess) and describes it as a chess trainer where you study a position briefly and then rebuild it from memory.
- **no.** An AI answer shows, and it does not meet the "yes" test.
- **no box.** No AI answer shows on the page.
- **failed.** The page did not load after one retry.
- **not recorded.** Used only in the 2026-10-20 baseline for rows 41 and 42. Never record it in a new month.

These answers are "no", even though they contain the words "Memory Chess":

- The itch.io "Memory Chess" dice-and-colour game (gamedev-boy.itch.io), the toytheater.com or brainplay.com games, wooden "memory chess" toys, and Play Store apps such as "Chess Memory".
- A mention of a Product Hunt launch, or of hunted.space or another Product Hunt copy, with no thememorychess.com domain or link. Row 15 in the baseline is this case.
- An answer that names Memory Chess but says it found no web version of it.

Values for the "org" cell:

- **#n**, such as "#3". The rank, within the top 10 organic results, of the first result on thememorychess.com or memory-chess.vercel.app.
- **#n old host**, such as "#1 old host". Use this when that first result is on memory-chess.vercel.app. Row 2 in the baseline is this case.
- **-**. No result on either host in the top 10.
- **n/a**. The row runs on WebSearch. The tool returns a summary, not a ranked list, so there is no organic rank to record.
- **failed**. The page did not load after one retry.

Add the month's two columns to the "Monthly results" table in questions.md. The score is the count of "yes" rows. Rows marked "failed" stay in the denominator of 43.

The October 2026 Google runs used a browser that already had a Google session, though nothing was signed in to during the research. This check forbids sign-in, so a signed-out Google page can show a different AI Overview. Some Google rows may shift for that reason alone. Say so in the log when a Google row changes.

### 2. Pull the GA4 numbers

Use the analytics connector's `run_report` tool on property `483086308`. GA4 reports in the property's time zone, America/Los_Angeles. Replace the dates with the first and last day of the month being checked.

```json
{
	"property_id": "483086308",
	"date_ranges": [{"start_date": "2026-11-01", "end_date": "2026-11-30", "name": "month"}],
	"dimensions": ["sessionSource", "landingPage"],
	"metrics": ["sessions"],
	"dimension_filter": {
		"filter": {
			"field_name": "sessionSource",
			"string_filter": {
				"match_type": 6,
				"value": "chatgpt|openai|gemini|perplexity|copilot|alice\\.yandex",
				"case_sensitive": false
			}
		}
	},
	"limit": 500
}
```

`match_type` 6 is a partial regular expression match. The pattern matches the sources the plan names (chatgpt.com, gemini.google.com, perplexity.ai, copilot.com, alice.yandex.ru) and the short forms GA4 also records (`openai`, `gemini`).

From the rows:

- **AI-assistant visits** is the sum of `sessions` over every row.
- **Guide or data share** is the sum of `sessions` on rows whose `landingPage` contains `/learn` or `/articles`, or ends in `/data`, divided by the AI-assistant visits. Locale-prefixed paths such as `/it/learn/...` and `/fr/data` count. Rows with `(not set)` stay in the denominator.

To check for a new AI assistant, run the same report once without `dimension_filter` and with only `sessionSource`. If a new assistant appears, such as `claude.ai`, add it to the pattern and note the change in the log, since it breaks comparison with earlier months.

### 3. Update the mentions list

1. Reopen every row in the first two tables of [mentions.md](mentions.md). Set "Last checked" to today. Set the status to one value from the fixed set that mentions.md defines: "live", "unconfirmed", "removed" or "offline". Keep any detail in the description cell, never in the status cell.
2. Search Google, Bing and WebSearch for `"thememorychess"` and for `"Memory Chess" chess trainer`.
3. Open each Phase 4 target in mentions.md and look for Memory Chess on the page.
4. For each new page that names Memory Chess, apply the counting rule in mentions.md. Add an independent page to the first table, and a listing the owner submitted to the second table. Fill in the URL, the date seen, today as "Last checked", and how the page describes the site.

The measure is the count of rows in the first table whose status is "live" and whose "Last checked" date is in this check. Rows marked "unconfirmed", "removed" or "offline" do not count. A row that was not reopened this month does not count. The owner-submitted table is tracked and never counted.

### 4. Check Bing's host

1. Open `https://www.bing.com/search?q=best+app+to+train+chess+memory+and+visualization`.
2. Record "yes" when the Memory Chess result shows the host `thememorychess.com` and no `memory-chess.vercel.app` result is on the page. Otherwise record "no" and the host Bing shows.

The fix for a "no" lives in [docs/bing-webmaster.md](../bing-webmaster.md). Only the site owner can do it.

### 5. Log the month

Append one row to the table below and open a docs pull request with the changes to this folder.

## Monthly log

| Check date | Month covered | AI answers naming MC | AI-assistant visits | Guide or data share | Third-party mentions | Bing host is thememorychess.com | Notes |
|---|---|---|---|---|---|---|---|
| 2026-10-20 | 90 days to 2026-10-18 (baseline) | 4 of 43 | about 66 a month (about 198 in 90 days) | about 7% (14 of 199 on the 2026-10-21 rerun) | 0 (the plan's 2 used a looser rule; thistools.app unconfirmed) | no (#1 is memory-chess.vercel.app) | Row 43 page blank, recorded as failed. Perplexity and ChatGPT not read. Google rows were run in a browser that already had a Google session, so a signed-out run may differ. |
