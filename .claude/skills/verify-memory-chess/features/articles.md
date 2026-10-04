# Articles list and articles

`/articles` lists profiles of chess players and memory researchers, newest first, ten to a page. Each `/articles/<slug>` page shows one credited portrait, a fact file, the article set in a serif face, a drill link that starts a round on `/game`, the sources, and a link to the next article. The section is English-only and statically generated for the default locale, the way Learn is. The entries are data in `src/lib/articles/entries/`, and the registry in `src/lib/articles/index.ts` orders them. Each card and each article shows a view count and a like count read from Supabase, the article has a like button, and the list sorts by newest, most viewed and most liked.

## Sub-features

- `articles-list` shows one card per article. The whole card is one link.
- `articles-paging` shows a pager only above ten articles, keeps the page in `?page=`, and always server-renders page 1.
- `article-page` renders the portrait, the photo credit, the fact file, the body, the drill link, the sources and the next-article link.
- `article-rail` keeps the portrait and fact file in a 280px left rail from 821px wide, sticky when the viewport is at least 847px tall, which fits the tallest rail with 20px above and below it. Below 821px the order is portrait, heading block, fact file, body.
- `article-drill` opens `/game?pieceCount=<n>&memorizeTime=<s>`, which starts the round at once.
- `articles-english-only` redirects `/<locale>/articles[/slug]` to the bare URL in one 308.
- `article-counts` shows views and likes as text on a card and views in the article heading block. A count of zero or a missing count shows nothing. Both routes read counts on the server with `revalidate = 300`, so a count on the page is up to five minutes old.
- `article-view` sends one `view` to `POST /api/articles/<slug>/stats` for each article in a browser tab session, remembered in `sessionStorage` under `memory-chess:article-viewed:v1`.
- `article-like` is a toggle button with `aria-pressed`. It updates at once, sends `like` or `unlike`, and on a failure returns to its earlier state and says `That did not save. Try again.` The like is remembered in `localStorage` under `memory-chess:article-likes:v1` as `{ "version": 2, "likes": { "<slug>": <count> } }`, where the count is the one the server answered for that like. While an article is liked, its button and its card on the list show the larger of the page's count and that count, so a reload inside the five stale minutes does not show a lower number under a pressed heart. An unlike forgets the count. The older shape, a bare array of slugs, still reads as liked.
- `articles-sort` shows Newest, Most viewed and Most liked when there are at least two articles and at least one count. The choice lives in `?sort=views` or `?sort=likes`. The server HTML is always newest first. On a direct load of `?sort=views` or `?sort=likes` an inline script ahead of the list sets `data-first-paint-sort` on `<html>`, and `articleList.css` orders the cards by the `--rank-views` or `--rank-likes` each `li` carries, so the first paint is already sorted. The same stylesheet gives the button with that `data-sort-option` the pressed look and Newest the unpressed look, so the control agrees with the cards before hydration, though the server HTML still has `aria-pressed="true"` on Newest. The list removes the attribute in the render that puts the DOM in that order. A press slides the cards with a 560 ms transform.
- `article-portrait-carry` keeps the portrait on screen when a card opens. The card asks the optimizer for `w=256` and the article for `w=384`, at 1440x900 and at 375x812 with a device scale of 2. The article paints the card's file as the `background-image` of its portrait `img` until the larger file loads, and an article link asks for the `w=384` file when a mouse pointer enters it or it takes focus, once per photo and never under Save-Data. A touch pointer does not ask, because a finger also enters a card when a scroll starts on it. A direct load has no background.
- `article-stats-route` answers 404 for an unknown slug, 204 with no write for a `view` from a crawler user agent, 400 for a body that is not `{"event":"view" | "like" | "unlike"}` sent as `application/json` in at most 64 bytes, and 200 with `{ views, likes }`.
- `articles-structured-data` emits an `Article` with an `about` `Person` and a `BreadcrumbList` on an article, and a `CollectionPage` with an `ItemList` on the list.

## How to get to it (user POV)

- Click Articles in the header or the footer of any page.
- Click a card on `/articles`.
- Click the next-article link at the end of an article.
- Open an article directly, such as `/articles/magnus-carlsen`.
- Follow a locale-prefixed link, such as `/de/articles`, and land on the bare English URL.

## Driving it with cdp.mjs

Preconditions:

- `doctor.sh <port>` reports OK.
- The slug list is `ARTICLE_SLUGS` in `src/lib/articles/index.ts`. Do not hardcode a stale copy.
- Block the analytics hosts before the first navigation: `await page.send("Network.enable")`, then `await page.send("Network.setBlockedURLs", { urls: [...] })`.

- **List.** `goto(baseUrl + "/articles")`. Assert `document.querySelectorAll('main a[href^="/articles/"]').length` equals the number of articles, up to ten, and that every `main img` has `naturalWidth > 0`. Screenshot.
- **Current nav link.** `document.querySelector('nav[aria-label="Main"] a[aria-current="page"]').textContent` is `Articles` on `/articles`, and nothing is current on an article.
- **Open an article.** `click('main a[href^="/articles/"]')`, then `waitFor("location.pathname.startsWith('/articles/')")`. Assert the `h1` text equals the card's `h2` text, `document.querySelectorAll("dl dt").length >= 4`, and `document.querySelector("figure cite a[href^='https://commons.wikimedia.org/']")` exists.
- **Rail.** At 1440x900, `window.scrollTo(0, 1200)`, then assert `document.querySelector("figure img").getBoundingClientRect()` is still inside the viewport. At 1440x847, the lowest height at which the rail sticks, do the same on every article and assert the `bottom` of `[data-article-rail]` is at most `innerHeight`. A rail that fails needs a higher gate in `STICKY_RAIL` in `ArticlePage.tsx`. At 375x812, read the `top` of `figure`, `header h1`, the fact file `section` and `[data-article-body]` and assert they rise in that order.
- **Body face and size.** `getComputedStyle(document.querySelector("[data-article-body]"))` reports a Literata `fontFamily`, `20px` from 561px wide and `18.5px` below.
- **No sideways scroll.** `document.documentElement.scrollWidth <= innerWidth` at 1440, 375 and 320 wide.
- **Drill.** `click("a[data-article-drill]")`, then `waitFor` a `Skip` button. Assert `location.pathname === "/game"` and that the count of `[data-coordinate][aria-label*=" with "]` equals the article's `drill.pieceCount`.
- **Paging.** With three articles there is no `nav[aria-label="Pages"]`. Above ten, click `button[aria-label="Page 2"]` and assert `location.search === "?page=2"`.
- **Crawler floor.** `helpers/ssr-words.sh http://127.0.0.1:<port>/articles/<slug> 900 | tee .verify-evidence/<run>/article.ssr.txt`, and the same with floor 300 for `/articles`.
- **English-only check.** `curl -sI http://127.0.0.1:<port>/de/articles/<slug>/` answers one 308 to `/articles/<slug>`.
- **Structured data.** `curl -s` the article and parse the `application/ld+json` script. It holds an `Article` with `datePublished` and an `about` of type `Person`. The HTML has a self canonical and no `hrefLang`.
- **Counts, sorting, a view, a like.** Start the fake with a seeded fixture (see Gotchas), build against it, then run `node .claude/skills/verify-memory-chess/helpers/cdp.mjs .claude/skills/verify-memory-chess/helpers/drive-article-stats.mjs --evidence .verify-evidence/article-stats --base http://127.0.0.1:<port>`. It blocks the analytics hosts, reads the counts on each card, presses Most viewed and Most liked and checks the order and the address, opens the first article and waits for one answered `view`, reloads and checks that no second `view` leaves, then likes and unlikes and checks the count, `aria-pressed` and the 44px height. Its second read is the request body and status of every call to `/api/articles/<slug>/stats`. The fake prints one `rpc record_article_event slug=<slug> event=<event> -> views=<n> likes=<n>` line for each write that reached it, which is a third read.
- **Rejected writes.** `curl -s -o /dev/null -w '%{http_code}' -X POST -H 'content-type: application/json' -A 'Googlebot/2.1' -d '{"event":"view"}' http://127.0.0.1:<port>/api/articles/<slug>/stats` answers 204 and the fake prints no line. Only views are filtered: the same call with `-d '{"event":"like"}'`, or with a DuckDuckGo browser agent such as `-A 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile DuckDuckGo/5 Safari/537.36'`, answers 200 with the counts and the fake prints its `event=like` line. The crawler pattern also matches real browsers, so a like is written for every agent. The view call to `/api/articles/not-a-real-slug/stats` with a browser user agent answers 404. With `-H 'content-type: text/plain'` it answers 400.
- **Supabase down.** Stop the fake, run `rm -rf .next && npm run build` with the same two env vars, and serve. Both pages render with no counts, no sort control and no error text. `drive-article-stats.mjs` then returns `mode: "stats unavailable"` after it sees the failure line beside the like button.
- **Portrait carry.** Hold the article-size file with `Fetch.enable` and the pattern `*/_next/image*w=384&*`, calling `Fetch.continueRequest` after 3 seconds. Move the mouse over a card with `Input.dispatchMouseEvent`, wait 300 ms, press and release. Screenshot at 100, 300, 600 and 1000 ms and measure the colour spread inside the portrait box. During the flight the box is `getComputedStyle(document.documentElement, "::view-transition-group(article-portrait)")`, whose `transform` and `width` give its place. A flat box has a spread of 0, and the photo has a spread above 60. With no hold, `Network.requestWillBeSent` lists one `w=384` request, started at the hover. A finger scroll from `Input.synthesizeScrollGesture` with `gestureSourceType: "touch"` that starts on a card lists none. The first load of `/articles` lists three `w=256` requests and nothing else.
- **Prerender.** `curl -sI http://127.0.0.1:<port>/articles/<slug>` shows `x-nextjs-prerender: 1` and `Cache-Control: s-maxage=300`.
- **404.** `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:<port>/articles/not-a-real-slug` returns 404.

## Gotchas

- The audit strips link text, `<cite>` and `data-authorship-note` before it looks for repeated sentences. The photo credit sits in `<cite>`, the drill sentence sits inside the drill link, and the authorship note carries the attribute. Moving any of them out fails the `boilerplate` rule once four articles exist. `src/components/articles/__tests__/articleAudit.test.tsx` proves it with thirteen fixtures.
- The fact file and the source list put two shared `h2` headings on every article, so an entry needs at least three sections of its own or the `heading-template` rule fails.
- The list page needs 300 main-content words. Three cards do not reach that, so the page carries a section on how the articles are made.
- Literata is declared in `src/lib/articles/readingFont.ts`, not `src/lib/fonts.ts`. A face declared in a module the root layout imports ships to every route.
- The rail sticks only because `src/components/articles/articlePage.css` sets `overflow-x: clip` on `body` when the page holds `[data-article-rail]`. `globals.css` sets `overflow-x: hidden` on `html` and `body`, which makes `body` a scroll container that never scrolls, so `position: sticky` does nothing on any other page.
- The heading block is first in the article's DOM, so the `h1` is the first heading a screen reader meets. Grid rows put the portrait above it on a phone, and grid columns put the rail on the left from 821px. On a phone the Tab order is therefore back link, author link, then the photo credit above them.
- Both routes call `setRequestLocale`. Without it next-intl reads the locale from the request headers and the page renders on every request. `curl -sI` on `/articles` must show `x-nextjs-prerender: 1`.
- Counts need a database. `helpers/fake-supabase.mjs <fixture.json> <port>` serves `article_stats` and `record_article_event` when the fixture is an object, `{ "leaderboard_entries": [...], "article_stats": [{ "slug": "magnus-carlsen", "views": 2140, "likes": 187 }] }`. A bare array still means leaderboard rows only. Export `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before `npm run build`, because the counts are read at build time.
- Run `rm -rf .next` before a rebuild. The build keeps Supabase answers in `.next/cache`, so a rebuild with the fake stopped would still show the old counts.
- A page shows the counts from its last regeneration. After a view or a like, the server HTML changes only when a request arrives more than 300 seconds after the last regeneration, and that request still gets the old page. Assert a write from the request, the response or the fake's log, not from a reload.
- The like button takes the count from the server's answer, so after a like it can jump by more than one when other likes arrived since the page was built.
- The liked visitor is the one exception to stale counts. After a like, a reload shows the remembered count on the button and on the card, though the server HTML still holds the older one. Assert it from the button text and from `localStorage`, and read the server HTML with `curl` to see the older number.
- A direct load of a sorted address must not move the cards. Record `layout-shift` entries from `Page.addScriptToEvaluateOnNewDocument` and compare the sum on `/articles?sort=likes` with the sum on `/articles`. With more than ten articles the first page under a sort holds other cards than the server's first page, and that load still shifts.
- The fake only imitates the database function. The real grants, row level security and `SECURITY DEFINER` are rehearsed in `schema/__tests__/articleStats.test.ts` on PGlite.
- The portrait placeholder sits on the `img` itself, because that element carries the `view-transition-name`. A background on a wrapper would stay behind while the portrait flies.
- `sharp(...).extract(...).stats()` reports the whole input image, not the crop. Write the crop to a buffer first and call `stats()` on that buffer.
- A second scenario in the same Chrome process can be served the `w=384` file from memory. Start a fresh `cdp.mjs` run for each cold-cache scenario.
- Chrome picks an already cached larger candidate from a `srcset`. After a visit to an article, its card on the list shows the `w=384` file.
- The sort slide starts only from a press on the sort control. `document.getAnimations()` right after a press lists one `transform` animation for each moved `li`. After a card click, Back or a direct load of `?sort=views` it lists none.
- The view count, the like count and the like button sit in the heading block, not in the rail, so the rail height the sticky gate was measured for is unchanged.
- The list keeps its page and its sort in the address and reads them through `useSyncExternalStore` in `src/components/articles/listAddress.ts`, so Back, Forward and a link to the bare `/articles` all move the page and the order. The server HTML and the first paint hold page 1.
- The list is a client component and gets `ArticleSummary` objects. Passing whole articles would put every body in the list page's payload.
- Article pages are static. Rebuild after editing an entry before the served page changes.
- A drill link starts the round on arrival and strips the query, so a reload shows the configuration screen.
