# AdSense resubmission checklist

AdSense has rejected thememorychess.com for "Low value content" three times, the third around 2026-09-28. The fixes
after the first two (PR 21 merged 2026-09-05, PR 23 merged 2026-09-16) were on-page: word counts, hidden text, boilerplate, machine-translated guides, and the
`npm run audit:adsense` gate, which production passed before the third rejection. The third rejection names three
criteria:

1. Provides authentic, high-quality information, tools, or services.
2. Exhibits ongoing curation and structural maintenance.
3. Generates and sustains genuine user interest.

Criteria 2 and 3 do not move in the 12 days between submissions, and no code change moves them. Resubmit only when
every box below is ticked. The dates and thresholds are our heuristics; Google publishes no numbers.

## Before resubmitting

- [ ] **Not before 2026-11-23**, 8 weeks after the third rejection.
- [ ] **www works.** In Vercel Domains, `www.thememorychess.com` is attached as a 308 redirect to
      `thememorychess.com`, not as a second primary domain. `curl -I https://www.thememorychess.com/` answers 308 to
      the apex over valid TLS. Check which hostname the AdSense site entry uses.
- [ ] **Alias redirects.** `curl -I https://memory-chess.vercel.app/learn` answers 308 to
      `https://thememorychess.com/learn`.
- [ ] **Audit passes on production.** `npm run audit:adsense -- --base https://thememorychess.com`.
- [x] **Search Console** property verified (DNS or meta tag), sitemap submitted, clicks and impressions recorded below. Verified by DNS; sitemap submitted 2026-09-15 with 0 errors.
- [ ] **Community launch done**, organic posts only, no link exchanges. Record each date below.
- [ ] **One original piece by the owner**, in their own voice, built on the site's own play data, published as a
      Learn article with a chart. Label the source and query date on the chart and say plainly that the sample is
      submitted leaderboard rounds only. If AI drafted or edited any of it, the disclosure says what AI did.
- [ ] **Cadence.** At least 3 new pieces published on different weeks since 2026-09-28, at least 2 of them
      owner-written. Date bumps and edits without a changelog entry do not count.
- [ ] **Interest.** GA4 weekly active users and returning users above the baseline below for 4 consecutive weeks
      with an upward trend, read against the launch dates so a launch spike is not mistaken for sustained interest.
      Leaderboard names are a secondary signal only.
- [x] **Leaderboard hygiene.** Decided 2026-09-30: the zapan* rows (23 since 2026-08-20) are a real player and stay.
      22 of 23 submissions line up within 3 minutes with a GA4 finished round from one desktop Chrome visitor in
      Cambridge, United States, at US afternoon hours, with steadily improving scores. Verification runs never write to
      the production leaderboard.

## Baseline and log

| Date | GA4 weekly active users | GA4 returning users | Search Console clicks (7d) | Impressions (7d) | Note |
|---|---|---|---|---|---|
| 2026-09-28 | 247 | 53 | 122 | 3,080 | Baseline, week of Sep 21-27, thememorychess.com host only |

Read GA numbers for the `thememorychess.com` hostname only. Until 2026-09-29 the analytics scripts also loaded on local
and preview builds, so earlier weeks include test runs (257 users from `127.0.0.1` in the week of Sep 14).

| Date | Where | Link |
|---|---|---|
| | | |

### Round funnel events

The round-funnel events start the day PR #33 merges. From then on production sends three GA4 events per round:

| Event | Fires when | Params |
|---|---|---|
| `round_start` | a round enters the memorize phase | `piece_count`, `memorize_time` |
| `round_complete` | a round reaches its result | `piece_count`, `memorize_time`, `correct_pieces`, `accuracy` |
| `score_submit` | the leaderboard accepts a submitted score | `difficulty`, `piece_count` |

The clean production-only series for these events starts 2026-09-29. Read nothing earlier as comparable.

`sound_settings` keeps firing once per finished round beside `round_complete` for four weeks after that merge, so the
weekly rounds series has no gap. Then check that weekly `round_complete` counts match `sound_settings`, retire
`sound_settings` in its own PR, and read rounds from `round_complete` only.

The one-tap start from the home page is measured against this baseline, taken before it deploys. Over 2026-09-01 to
2026-09-28 on `thememorychess.com`, 23.7% of visitors finished a round (267 of 1,126), counted from `sound_settings`
per visitor. Organic Search visitors finished at 45.4% (216 of 476). Report them separately, because the launch posts
change the visitor mix in the same weeks.

At about 270 visitors a week, two weeks can detect only a change of about 6 points, so read the result as directional.
The one-tap start has two measures: the share of visitors with a `round_complete`, and the share of `round_start`
events that reach `round_complete`. A rise in starts with no rise in finished rounds is not a win.

| Reading | Window | Visitors who finished a round | Organic Search visitors | `round_start` reaching `round_complete` |
|---|---|---|---|---|
| Baseline | 2026-09-01 to 2026-09-28 | 23.7% (267 of 1,126) | 45.4% (216 of 476) | not tracked before 2026-09-29 |
| Two weeks after deploy | | | | |
| Four weeks after deploy | | | | |

## Decided and not to be redone

- Translated home, /game and /contact-us stay indexed in 24 languages. Noindexing them was proposed and rejected by
  all three reviewers: a localized UI for a working tool is not scaled content, noindex does not remove pages from
  AdSense review, and it would cut search entry points while interest is the bottleneck. Revisit only with 90 days
  of GA4 sessions per locale, and then only for locales with negligible traffic, in its own PR.
- Guide `updatedAt` dates are truthful and are not bumped to look fresh.

## Follow-ups

- Replace the Accept-Language and geo 307 on `/` with a dismissible language-suggestion banner. Google's
  multi-regional guidance says to avoid redirecting on a guess at the user's language. When this lands, the
  locale-negotiation tests in `src/__tests__/middleware.test.ts` and the verify skill's language notes change with it.
- A screenshot or short recording of a real round near the top of the homepage, and later an original explainer to
  sit beside or replace the third-party video.
