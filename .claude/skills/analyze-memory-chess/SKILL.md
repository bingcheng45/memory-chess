---
name: analyze-memory-chess
description: "Read Memory Chess's product analytics in PostHog (project 675523) and turn them into findings and proposed app changes. Use whenever the user asks how the site or game is doing, where players drop off, what to improve next, whether a change helped, about traffic, retention, round funnels, Learn search, errors, Web Vitals or AI crawler traffic, or says 'check the analytics' / 'what does PostHog say'."
---

# Analyze Memory Chess

PostHog is the source of truth for player behaviour. GA4 is kept for Search Console and AdSense only. Every
event and property is defined in [`docs/analytics.md`](../../../docs/analytics.md), so read it first. The
code contract is `FunnelEvent` in `src/lib/analytics/events.ts`.

## Ground rules

- Use the PostHog MCP (`exec` tool). Its active project must be **675523 "The Memory Chess"**: check with
  `call project-get {}`. Follow the MCP's own rules. Run `learn analytics` before writing queries, confirm
  that each event and property exists with `read-data-schema`, and never guess names.
- Always exclude internal traffic: `filterTestAccounts: true` on insights, or the test-account filter in
  HogQL. Agent runs from the owner's Mac in Singapore inflate visits.
- Nobody is identified and there are no person profiles. Count unique visitors with
  `count(DISTINCT distinct_id)` or the "unique users" math, and expect a returning visitor on a new device
  or browser to count as new.
- Data starts on the PostHog launch date (the day PR "feat: PostHog analytics" merged). For anything older,
  say there is no PostHog data. Don't mix in GA4 numbers without labelling them.
- Read-only by default. Create or change PostHog insights, dashboards or settings only when the user asks.

## Start here

1. Open the **Player health** dashboard (`call dashboards-get-all` and find it by name) and read every
   insight on it for the last 7 and 28 days, each compared with the previous period.
2. Then answer the standard questions, each with a number, a comparison and a sentence on what it means:
   - **Traffic:** daily visitors, top landing pages, top referrers and UTM sources, country mix.
   - **Activation:** share of visitors whose first `round_complete` happens in their first session.
     Rounds by `round_source`.
   - **Round funnel:** `$pageview` → `round_start` → `round_complete` → `score_submit`. Name the step with
     the biggest drop, broken down by `round_source` and by device type.
   - **Difficulty fit:** `accuracy` by `piece_count` and `memorize_time`. Which settings players finish but
     fail, and which they abandon (a `round_start` with no `round_complete` in the session).
   - **Retention:** weekly retention on `round_complete`, plus `rounds_played` and `days_since_first_round`
     on `round_complete`.
   - **Daily board:** `round_complete` where `round_source = daily`, `reminder_set` and its surfaces.
   - **Sharing:** `result_share` and `lab_dashboard_share` by `method` and `network`, and rounds started
     with `round_source = share`.
   - **Learn:** `learn_search` with `outcome` showing no or weak match (content gaps), then
     `learn_search_select` rank.
   - **Quality:** top `$exception` issues by count and affected pages, and the worst `$web_vitals` pages
     (p75 LCP and INP).
   - **AI crawlers:** `ai_crawler_visit` by `agent` and `format`, and which paths they read.
3. Look for what changed. List releases from `git log --since=<period start> --oneline origin/main` and
   check whether metrics moved after each merge.

## Turning findings into changes

For each finding worth acting on, write:
- **What:** the metric, its value, the comparison and the period.
- **Why it matters:** in player terms.
- **Proposed change:** the specific screen or flow, with the file to change (search the codebase), sized
  as one small PR.
- **How we'll know:** the event or insight that should move, and by how much.

Rank by expected impact on activation and retention. Keep every proposal inside `docs/PRD.md`'s scope, and
don't suggest collecting new data without noting that the privacy page and its 23 translations must change
too.

## Output

A short report, findings first, then ranked proposals. For anything the user will share, publish it as an
Artifact. Link each number to its PostHog insight URL: run `learn urls` before writing a link.
