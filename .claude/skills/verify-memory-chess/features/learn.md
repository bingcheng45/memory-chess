# Learn hub and articles

`/learn` is the SEO content hub: a goal-based index over 16 long-form chess-training articles at `/learn/<slug>`, all statically generated for every locale (`generateStaticParams` in `src/app/[locale]/learn/[slug]/page.tsx`). This surface exists to carry the site's crawlable content, so the crawler view matters as much as the browser view.

## Sub-features

- `learn-hub` lists the articles grouped by training goal.
- `learn-article` renders one article with rich prose, internal links to related slugs, and metadata.
- `learn-locales` serves every article in all 24 locales (prefixed URLs for non-English).
- `learn-404` unknown slugs return the not-found page.

## How to get to it (user POV)

- Open `/learn` from the home page.
- Open an article directly, e.g. `/learn/chess-memory-training`.
- Follow a related-article link from inside another article.
- Arrive from a search engine on any slug in any locale, e.g. `/es/learn/chess-visualization-exercises`.

## Driving it with cdp.mjs

Preconditions:

- `doctor.sh 4517` reports OK.
- The canonical slug list is `LEARN_SLUGS` in `src/lib/seo/learn/index.ts`; do not hardcode a stale copy.

- **Hub.** `goto(baseUrl + "/learn")`; assert article links exist: `document.querySelectorAll('a[href^="/learn/"]').length >= 16`. Screenshot.
- **Article.** `clickText('a[href^="/learn/"]', "Chess Memory Training")` or `goto` a slug; assert an `<h1>` and body prose render, and that related links point at other `/learn/` slugs.
- **Crawler floor.** `helpers/ssr-words.sh http://127.0.0.1:4517/learn/chess-memory-training 300 | tee .verify-evidence/<run>/learn-article.ssr.txt`. Articles are the content pages; a low count here is a serious defect.
- **Locale spot check.** `helpers/ssr-words.sh http://127.0.0.1:4517/es/learn/chess-memory-training 300` and assert the dumped text is Spanish.
- **404.** `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4517/learn/not-a-real-slug` returns 404.

## Gotchas

- `npm run build` already fails if any locale's Learn prose is missing or misaligned (`scripts/validate-learn-prose.mjs`); a green build plus one rendered article is strong coverage, you do not need to drive all 16 x 24 pages.
- Article pages are SSG; after editing prose you must rebuild before the served page changes. `npm run dev` reflects edits live but is not the production check.
