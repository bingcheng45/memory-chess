# Articles list and articles

`/articles` lists weekly profiles of chess players and memory researchers, newest first, ten to a page. Each `/articles/<slug>` page shows one credited portrait, a fact file, the article set in a serif face, a drill link that starts a round on `/game`, the sources, and a link to the next article. The section is English-only and statically generated for the default locale, the way Learn is. The entries are data in `src/lib/articles/entries/`, and the registry in `src/lib/articles/index.ts` orders them.

## Sub-features

- `articles-list` shows one card per article. The whole card is one link.
- `articles-paging` shows a pager only above ten articles, keeps the page in `?page=`, and always server-renders page 1.
- `article-page` renders the portrait, the photo credit, the fact file, the body, the drill link, the sources and the next-article link.
- `article-rail` keeps the portrait and fact file in a 280px left rail from 821px wide, sticky when the viewport is at least 820px tall. Below 821px the order is portrait, heading block, fact file, body.
- `article-drill` opens `/game?pieceCount=<n>&memorizeTime=<s>`, which starts the round at once.
- `articles-english-only` redirects `/<locale>/articles[/slug]` to the bare URL in one 308.
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
- **Rail.** At 1440x900, `window.scrollTo(0, 1200)`, then assert `document.querySelector("figure img").getBoundingClientRect()` is still inside the viewport. At 375x812, read the `top` of `figure`, `header h1`, the fact file `section` and `[data-article-body]` and assert they rise in that order.
- **Body face and size.** `getComputedStyle(document.querySelector("[data-article-body]"))` reports a Literata `fontFamily`, `20px` from 561px wide and `18.5px` below.
- **No sideways scroll.** `document.documentElement.scrollWidth <= innerWidth` at 1440, 375 and 320 wide.
- **Drill.** `click("a[data-article-drill]")`, then `waitFor` a `Skip` button. Assert `location.pathname === "/game"` and that the count of `[data-coordinate][aria-label*=" with "]` equals the article's `drill.pieceCount`.
- **Paging.** With three articles there is no `nav[aria-label="Pages"]`. Above ten, click `button[aria-label="Page 2"]` and assert `location.search === "?page=2"`.
- **Crawler floor.** `helpers/ssr-words.sh http://127.0.0.1:<port>/articles/<slug> 900 | tee .verify-evidence/<run>/article.ssr.txt`, and the same with floor 300 for `/articles`.
- **English-only check.** `curl -sI http://127.0.0.1:<port>/de/articles/<slug>/` answers one 308 to `/articles/<slug>`.
- **Structured data.** `curl -s` the article and parse the `application/ld+json` script. It holds an `Article` with `datePublished` and an `about` of type `Person`. The HTML has a self canonical and no `hrefLang`.
- **404.** `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:<port>/articles/not-a-real-slug` returns 404.

## Gotchas

- The audit strips link text, `<cite>` and `data-authorship-note` before it looks for repeated sentences. The photo credit sits in `<cite>`, the drill sentence sits inside the drill link, and the authorship note carries the attribute. Moving any of them out fails the `boilerplate` rule once four articles exist. `src/components/articles/__tests__/articleAudit.test.tsx` proves it with thirteen fixtures.
- The fact file and the source list put two shared `h2` headings on every article, so an entry needs at least three sections of its own or the `heading-template` rule fails.
- The list page needs 300 main-content words. Three cards do not reach that, so the page carries a section on how the articles are made.
- Literata is declared in `src/lib/articles/readingFont.ts`, not `src/lib/fonts.ts`. A face declared in a module the root layout imports ships to every route.
- The rail sticks only because `src/components/articles/articlePage.css` sets `overflow-x: clip` on `body` when the page holds `[data-article-rail]`. `globals.css` sets `overflow-x: hidden` on `html` and `body`, which makes `body` a scroll container that never scrolls, so `position: sticky` does nothing on any other page.
- Both routes call `setRequestLocale`. Without it next-intl reads the locale from the request headers and the page renders on every request. `curl -sI` on `/articles` must show `x-nextjs-prerender: 1`.
- The list keeps its page in the address and reads it through `useSyncExternalStore`, so Back, Forward and a link to the bare `/articles` all move the page. The server HTML and the first paint hold page 1.
- The list is a client component and gets `ArticleSummary` objects. Passing whole articles would put every body in the list page's payload.
- Article pages are static. Rebuild after editing an entry before the served page changes.
- A drill link starts the round on arrival and strips the query, so a reload shows the configuration screen.
