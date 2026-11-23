# Analytics: what the site records and how to read it

Memory Chess sends product analytics to **PostHog** (project 675523, "The Memory Chess", US cloud) and to
**GA4** (property 483086308). PostHog is the one to analyse. GA4 stays for Search Console, AdSense and the
Data Studio dashboard. Ahrefs Analytics counts traffic for SEO.

Both get the same custom events, from one helper: `trackEvent` in `src/lib/analytics/events.ts`. The
`FunnelEvent` type in that file is the contract. If this page and that type disagree, the type is right and
this page is out of date.

## How the data reaches PostHog

- `src/components/common/SitePostHog.tsx` loads `posthog-js` after the page's load event, and only on the
  live site (`isLiveSite()`, `SITE_ENV=production`). Local runs and test deploys send nothing.
- The browser posts to `/relay/*` on thememorychess.com. The Cloudflare gateway Worker forwards it to
  `us.i.posthog.com` (scripts come from `us-assets.i.posthog.com`), in `src/lib/cloudflare/posthogRelay.ts`.
  Because the address is first-party, ad blockers don't drop it, which is why PostHog counts more visitors
  than GA4.
- No cookies: an anonymous id lives in local storage. There are no person profiles
  (`person_profiles: "identified_only"`, and nobody is identified), so analyse by `distinct_id` and
  sessions, not by persons.
- AI crawlers run no JavaScript. The middleware reports them server-side as `ai_crawler_visit`
  (`src/lib/analytics/aiCrawlers.ts`).

## Automatic events

| Event | What it is |
|---|---|
| `$pageview` | Every page load and client-side navigation. `$current_url`, `$pathname`, `$referrer`, UTM tags, device, country. |
| `$pageleave` | Leaving a page; carries time on page. |
| `$autocapture` | Clicks on buttons and links, and changes and submits on form controls (never their values). Element tag and attributes such as classes, `href`, `aria-label` and `data-attr`. **No text on screen** (`mask_all_text`). |
| `$exception` | Uncaught JavaScript errors, with stack. |
| `$web_vitals` | LCP, CLS, INP and FCP per page. |
| `ai_crawler_visit` | `agent` (the matched bot name), `path`, `format` (`html`, `markdown` or `llms`), `referrer`. One `distinct_id` per agent: `ai-crawler:<agent>`. |

Session replay, heatmaps, dead-click capture, surveys and feature flags are off in code (`POSTHOG_OPTIONS` in
`SitePostHog.tsx`), so turning them on in the PostHog project settings does nothing. Heatmaps stay off because
they key their data by the raw page address, which the scrubber can't fully clean.

## Custom events

| Event | Properties | Meaning |
|---|---|---|
| `round_start` | `piece_count`, `memorize_time`, `round_source`, `round_mode?` | A round began. `round_source` says which control started it (see below). `round_mode` is `blindfold` only for blindfold rounds. |
| `round_complete` | the same, plus `correct_pieces`, `accuracy`, `result_view?`, `days_since_first_round?`, `rounds_played?` (`1`, `2-5`, `6+`), `board_type?` (`daily`, `free`) | A round finished. The return-visit fields come from game rounds only, not the homepage calibration. |
| `score_submit` | `difficulty` (a tier or `daily`), `piece_count`, `round_mode?` | A score was sent to a leaderboard or the daily board. |
| `result_view_select` | `result_view` (`side`, `overlay`) | The result screen layout was switched. |
| `result_share` / `lab_dashboard_share` | `method` (`native`, `download`, `copy_image`, `copy`, `post`), `network?` | A result card or progress card left the page. |
| `reminder_set` | `surface` (`result`, `dashboard`, `daily`) | The daily board's calendar reminder was downloaded. |
| `streak_chip_view` | `state` (`active`, `ends_today`), `streak_days` (`2`, `3-6`, `7+`) | The header's streak chip showed. Once per page load, not again on client-side navigation. `ends_today` is the chip warning that skipping today ends the streak. |
| `lab_section_view` | none | The lab section (§06) scrolled into view. |
| `lab_panel_action` | `panel`, `action` | A lab panel's link or control was used. |
| `lab_export` / `lab_import` / `lab_backup_interest` | counts only | The lab record was downloaded, imported, or cross-device backup was asked for. |
| `home_intro_shown` / `_replayed` / `_skipped` / `_completed` | `beat?`, `play` (`first`, `replay`) | The homepage intro. |
| `learn_search` | `query_length`, `results`, `top`, `outcome`, `surface` | A settled Learn search. **Never the words.** |
| `learn_search_select` | `slug`, `rank`, `matched_question`, `surface` | A search result was opened. |
| `article_like` / `article_tile_click` | `slug`, `action?` | Article engagement. |
| `affiliate_click` | `store` | A shop link followed from a guide. |
| `video_start` / `_play` / `_pause` / `_progress` / `_complete` | `percent_complete?`, `time_position?` | The homepage tutorial video. |

`result_view` is also registered on every later event in the browser after the player chooses one.

`round_source` values: `home_quick`, `home_tier`, `calibration`, `calibration_cta`, `guide_cta`,
`article_cta`, `game_form`, `tile_drill`, `try_again`, `insight`, `result_next`, `plan`, `daily`, `review`,
`dashboard`, `share`, `link` (a round link naming no known source).

## Never collected

The privacy page promises these, and `before_send` in `SitePostHog.tsx` plus the event types enforce them:
- No typed text. `player` and `q` query parameters are removed from every address (`src/lib/analytics/typedText.ts`).
- No positions, squares, round ids, streak lengths or dates in events. `streak_chip_view` sends a streak only as its group, `2`, `3-6` or `7+`.
- No screen recordings, no names or emails, no cookies.

Adding an event or a property changes what the privacy page has to say, in English and in its 23
translations (`src/lib/pages/privacy.ts`, `scripts/articles-i18n/TRANSLATE-PAGES.md`).

## Key definitions

- **Activation:** a visitor's first `round_complete`.
- **Round funnel:** `$pageview` → `round_start` → `round_complete` → `score_submit`, within one session.
- **Retention:** weekly, returning to `round_complete` after a first `round_complete`.
- **Internal traffic:** the project's test-account filter. Always apply it (`filterTestAccounts: true`).
  Headless runs from the owner's Mac (Singapore, iOS 18.0 at 390x844) are the known source.

## Reading it as an agent

Use the PostHog MCP (project 675523). The `analyze-memory-chess` skill in `.claude/skills/` walks through it.
