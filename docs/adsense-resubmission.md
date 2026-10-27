# AdSense resubmission checklist

AdSense has rejected thememorychess.com for "Low value content" four times. The rejection emails in the owner's Gmail
are dated 2026-08-24, 2026-09-13, 2026-09-28 and 2026-10-25. The fixes after the first two (PR 21 merged 2026-09-05,
PR 23 merged 2026-09-16) were on-page: word counts, hidden text, boilerplate, machine-translated guides, and the
`npm run audit:adsense` gate, which production passed before the third rejection. The third and fourth rejections name
three criteria:

1. Provides authentic, high-quality information, tools, or services.
2. Exhibits ongoing curation and structural maintenance.
3. Generates and sustains genuine user interest.

The fourth submission went in before the 2026-11-23 date below and was rejected 27 days after the third. Criteria 2
and 3 do not move in a few weeks, and no code change moves them. Resubmit only when every box below is ticked. The
dates and thresholds are our heuristics; Google publishes no numbers.

## Why the fourth rejection, as measured on 2026-10-28

The full review is at https://claude.ai/artifact/UPqNtC1LBciiv9FMzKNJyq. In short:

- **Google's index is mostly stale translated copies.** Search Console listed 370 indexed pages against 103 in the
  sitemap. 309 were translated `/xx/learn/*` guides last crawled on 2026-08-29, before they began to redirect or serve
  noindex on 2026-09-15. PR 190 lists them in `/retired-sitemap.xml` so Google recrawls and drops them.
- **Two thirds of the sitemap was translated interface pages.** 69 of 104 URLs were home, /game and /daily in 23
  languages. The 24 /daily URLs drew 22 landings and no engaged session in 60 days. PR 191 indexes /daily in English
  only. Home and /game stay, as decided below.
- **No owner-written piece and no steady cadence.** Every guide and article is AI-written and says so. They shipped in
  batches: 5 guides on 2026-03-06, 11 on 2026-03-24, 3 articles on 2026-10-05, 5 guides on 2026-10-20.
- **Interest is small.** GA4 weekly active users were 250 to 470 outside the Product Hunt week (1,035 in the week of
  2026-10-12). The three articles drew about 25 landing sessions in four weeks.
- **The production audit was failing** on /blindfold and five translated guides, from changes on 2026-10-26 and 27.
  PR 192 fixes both.

## Before resubmitting

- [ ] **Not before 2026-12-21**, 8 weeks after the fourth rejection.
- [ ] **Google's index matches the sitemap.** In Search Console, Pages, the indexed count is within 10% of the sitemap's
      count (81 after PR 191), and no `/xx/learn/` URL is in the indexed list. Then remove `/retired-sitemap.xml` and its
      robots.txt line (PR 190).
- [ ] **Re-enable the AdSense script.** Since 2026-10-18 the `adsbygoogle.js` script is not loaded, because it cost
      221 KB of JavaScript per mobile view and no page has an ad slot. The `google-adsense-account` meta tag and
      `ads.txt` stay, so site verification keeps working. Set `ADSENSE_SCRIPT_ENABLED` to `true` in `src/lib/adsense.ts`,
      merge and deploy before submitting, then confirm `curl -s https://thememorychess.com/ | grep -c adsbygoogle`
      prints 1. Turn it off again if the submission is rejected.
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
| 2026-10-28 | 469 | | | | Week of Oct 19-25, the week after the Product Hunt launch week (1,035). GA4 weekly active users only |

Read GA numbers for the `thememorychess.com` hostname only. Until 2026-09-29 the analytics scripts also loaded on local
and preview builds, so earlier weeks include test runs (257 users from `127.0.0.1` in the week of Sep 14).

| Date | Where | Link |
|---|---|---|
| | | |

### Published pieces

Every new piece since 2026-09-28, for the cadence box above. The date is the piece's `publishedAt`.

| Date | Title | URL | Written by |
|---|---|---|---|
| 2026-10-05 | How Magnus Carlsen names a famous game from one position | `/articles/magnus-carlsen` | AI-drafted, fact-checked, owner-reviewed |
| 2026-10-05 | Adriaan de Groot's 1944 test of chess memory, by the numbers | `/articles/adriaan-de-groot` | AI-drafted, fact-checked, owner-reviewed |
| 2026-10-05 | How Judit Polgár played blindfold chess at age seven | `/articles/judit-polgar` | AI-drafted, fact-checked, owner-reviewed |

The three launch articles share one week, so together they count as one week of the cadence. None counts as
owner-written. Each later article is one row, in its own week.

### Round funnel events

The round-funnel events start the day PR #33 merges. From then on production sends three GA4 events per round:

| Event | Fires when | Params |
|---|---|---|
| `round_start` | a round enters the memorize phase | `piece_count`, `memorize_time` |
| `round_complete` | a round reaches its result | `piece_count`, `memorize_time`, `correct_pieces`, `accuracy` |
| `score_submit` | the leaderboard accepts a submitted score | `difficulty`, `piece_count` |
| `round_intro_view` | a round from a link shows its one-line rule and Start (every such round since the free-round countdown fix; before it, only a first-ever round) | `piece_count`, `memorize_time`, `round_source` |

The clean production-only series for these events starts 2026-09-29. Read nothing earlier as comparable.

Note added 2026-10-18 for PR #117. From the day it merges, a player's first-ever round from a link waits behind a
one-line rule and Start. That round's `round_start` fires when Start is pressed, so `home_quick` (and other link)
`round_start` counts mean "players who pressed Start", not "visitors who landed". Visitors who leave at the rule
send only `round_intro_view`. GA4 cannot tell an intro round's `round_start` from a later round's, so read the
`round_start` series as broken on the merge date, and `round_intro_view` against `round_start` as the intro's own
start rate. Daily boards, replays and later rounds are unchanged. Databuddy's `round_started` (the mirror of
`round_start`) shifts on the same merge date, and `round_intro_view` is not mirrored to Databuddy. Like
`round_start` and `round_complete` since PR #118, `round_intro_view` names where the round began as `round_source`,
never `source`, which GA4 reads as the traffic source. Databuddy's mirrors keep `source`.

`sound_settings` fired once per finished round beside `round_complete` for four weeks after that merge, so the weekly
rounds series has no gap. It was retired in its own PR on 2026-10-16, eleven days early, because the counts already
matched. Read rounds from `round_complete` only. The check, on `thememorychess.com`, read on 2026-10-16:

| ISO week | `round_complete` | `sound_settings` | Note |
|---|---|---|---|
| 2026-09-28 to 10-04 | 1,034 | 1,132 | `round_complete` started on 2026-09-29, partway through the week |
| 2026-10-05 to 10-11 | 1,263 | 1,284 | within 2% |
| 2026-10-12 to 10-15 | 519 | 516 | partial week, within 1% |

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
- Articles are readable in all 24 languages and indexed only in English, decided 2026-10-04 at the operator's
  request. The decision stands. What it rests on, as of fix round 3 of PR 39 on 2026-10-05:
  - Who wrote the text. AI agents translated the 23 other languages and other AI agents reviewed them. No native
    speaker has read any of it. Each translated page says it was translated from English with AI assistance and
    links to the English article.
  - What `noindex` does. A translated list or article is served `noindex, follow` with a self canonical, no
    `hreflang` and no sitemap entry, so search does not offer it. That does not take it out of AdSense review, as
    the first entry in this list records. A reviewer who opens the site in another language reads these pages, and
    they count toward the "Low value content" judgement.
  - What the gates catch. `scripts/articles-i18n.mjs check` fails a translation whose structure differs from the
    English text, that loses a number, whose body paragraph lost most of its length, or that lists body text as
    kept in English. It fails English left in a translation: a whole text, a text that copies its English, and a
    sentence left in English inside a translated paragraph, when the sentence has more than three English
    function words. A title or a saying that the English text has word for word is not counted inside a sentence
    that is otherwise translated. It fails a text of 40 letters or more with less than half its letters in the
    script of its locale. Latin is a script like the others, so a Hindi or a Russian paragraph fails in a German
    article. It fails text in another locale's language: an article or the section's strings as a whole, and
    nearly every text of 40 words or more inside them. In the round 3 run, which puts one paragraph of another
    locale into each article, 125 of 20,502 such paragraphs passed: 45 of 88 between Danish and Norwegian, 17 of
    83 between Czech and Polish, 22 of 356 among Simplified Chinese, Traditional Chinese and Japanese, 19 of 892
    Turkish ones, and 22 single cases. None passed from another script into a language written in Latin letters.
    `approve` records a hash of the text, its locale and its article. `verify` runs `check` on every installed
    file and fails on an article file or a set of section strings that is missing, made from an older English
    text, unapproved, edited after its approval, or copied from another locale or article.
  - Where the gates run. `npm run build` runs `verify` before `next build`, through the `validate` script in
    `package.json`, so the host's build stops on everything above. Jest runs the same rules, and no deploy runs
    Jest. `verify` loads TypeScript files and needs Node 22.18 or newer. The Vercel build of PR 39 passed with
    `verify` in it on 2026-10-05, so the host's Node was new enough on that day. `package.json` does not pin a
    Node version. A build that fails in `verify` on an unknown file extension means the host's Node went back.
  - What the audit checks. `npm run audit:adsense` checks every translated page it is served and fails one that
    is indexable, canonical to another URL, has `hreflang`, lacks the note or its link to the English page, has
    hidden words or has more than one `h1`. It fails a translated article or article list that has a different
    number of `h2`, `p`, `li` or article cards than its English page, so a missing or an extra section or
    paragraph fails. That count leaves out the translation note and the view and like counts, and the audit
    does not compare the blocks of the leaderboard. Both depend on live data, and each locale's copy of a page
    is cached by itself for 300 seconds, so a count of them failed 46 pages with no defect in the first audit
    after a data change. The audit still has to print every sitemap URL and PASS. That was 96 URLs on
    2026-10-05. From PR 42 on it was 120, because /daily was indexed in all 24 languages, and from PR 191 it is 81, because /daily is indexed in English only. Expect the count to grow
    with each new indexed route; a drop with no route removed is a finding.
  - What the approval hash is. It is tamper evidence, not access control. It shows that a text is the one
    `approve` saw, in the place where it saw it, and it catches an accident or a careless edit. The recipe is in
    `src/lib/articles/articleText.ts`, so anyone who can write the repository can compute a hash that matches any
    text, with no review. A person who means to get round it can.
  - What the gates cannot catch. That a sentence is correct, natural or faithful to the English. A false
    sentence added in the right language, a sentence dropped inside a paragraph, two numbers swapped, a changed
    name and a replaced quotation all pass every gate. So do an English sentence with three English function
    words or fewer, the second half of a sentence left in English, a paragraph of under 40 words in another
    language of the same script, and most single paragraphs of Danish inside a Norwegian article or of Norwegian
    inside a Danish one. In the round 3 runs a paragraph with its second half left in English passed 20.1% of
    the time, one with its first half in English 7.7%, and one with only its last sentence in English 25.9%.
    All of that rests on the AI review alone. The reviewers' open doubts for each language are in the
    body of PR 39. Until a native reader has checked a language, treat its articles as unverified text that an
    AdSense reviewer can open.
- About, Privacy and Terms are readable in all 24 languages and indexed only in English, decided 2026-10-14 at the
  operator's request (PR 77 and PR 78, merged into PR 42). They follow the articles' model above, with these
  differences:
  - Why these three. They are trust pages, not content, so they are not what the "Low value content" judgement
    weighs. A privacy notice in the reader's language is ordinary practice. A reviewer browsing in another
    language now reads them in that language instead of being sent to English.
  - Who wrote the text. Opus agents translated, and a Sonnet agent reviewed each language and fixed 197 strings.
    For ro, hu, tr, ru, ja, ko, zh-CN and zh-TW the reviewer back-translated blind before comparing. For the other
    15 languages the reviewer compared sentence by sentence with the English open, which is weaker. An independent
    agent then spot-checked de, fr, es and ja and found one narrowed GDPR sentence in ja, now fixed. No native
    speaker has read any of it.
  - What the reader sees. A note under the lede says the page was translated with AI assistance and links to the
    English page. On Privacy and Terms it also says that the English version governs where the two differ.
  - What search sees. Each translation is `noindex, follow` with a self canonical, no `hreflang` and no sitemap
    entry. The sitemap lists the three English URLs once each, and their `lastmod` dates track the English text
    only.
  - The gates. `node scripts/articles-i18n.mjs --pages` runs the articles' checks on these pages, and `npm run
    build` runs `--pages verify`. The audit applies its note, legal-note and dropped-paragraph rules to them. The
    gates' limits are the articles' limits above. A German stand-in made of German function words passed `check`.
  - What an edit costs. Any change to the English text of these pages fails the build until every listed locale is
    retranslated and approved again, or is removed from `TRANSLATED_PAGE_LOCALES`.
  - The owner's gender is not stated. First-person sentences in pl, cs, ru, ro and hi use forms that carry no
    gender, and the operator confirmed on 2026-10-14 that they stay that way.
  - What stays English. /changelog, because every release would wait on 23 translations. The Learn hub, the
    search page and every other guide, because Learn is the content removed after the first rejections.
- Five Learn guides are readable in ru, pt-BR, fr, de and es and indexed only in English, decided 2026-10-21 by
  the program's root coordinator (PR 143); the operator can reverse it. They follow the articles' model above,
  with these differences:
  - Which guides. Blindfold training, seeing the whole board, visualization exercises, stopping blunders and
    getting better as a beginner, the five with AI-assistant landings in the 90 days before PR 143.
  - Who wrote the text. Opus agents translated, a separate Sonnet agent reviewed each language, and a separate
    Opus agent reviewed the piece-letter legend added in fix round 1. No native speaker has read any of it.
  - What the reader sees. The disclosure under the byline says the guide was translated with AI assistance and
    checked by a second AI, and links to the English guide. The hub and search page link each translation.
  - What search sees. Each translation is `noindex, follow` with a self canonical, no `hreflang`, no hreflang
    Link header and no sitemap entry. The English guide keeps its bare self canonical, no alternates and its one
    sitemap entry, exactly as before PR 143.
  - The switch. `GUIDE_LOCALE_INDEXING` in `src/lib/seo/learn/translatedGuides.ts` holds `indexed: false` for
    each locale. Setting one locale to `{ indexed: true, after: "adsense-approval" }` (or `"native-read"`) makes
    its translations indexable and lists them, with the
    English guide, in the HTML `hreflang`, the Link header and the sitemap, all together. Turn a locale on only
    after AdSense approves the site, or after a native speaker has read that locale's guides.
  - What an edit costs. An English edit to one of the five guides, or to the chrome every guide shares, does not
    fail the build. `--guides verify` withholds each translation that is no longer current, prints a warning
    naming it and the commands to approve it again, and writes the rest to `src/lib/seo/learn/servedGuides.json`.
    A withheld translation's URL answers a 307 to the English guide until it is translated and approved again.
    A changed game button label in a locale withholds the guides that name it the same way. A translation no
    reviewer approved, or a current one that breaks a rule, still fails the build.

## Follow-ups

- Replace the Accept-Language and geo 307 on `/` with a dismissible language-suggestion banner. Google's
  multi-regional guidance says to avoid redirecting on a guess at the user's language. When this lands, the
  locale-negotiation tests in `src/__tests__/middleware.test.ts` and the verify skill's language notes change with it.
- A screenshot or short recording of a real round near the top of the homepage, and later an original explainer to
  sit beside or replace the third-party video.
