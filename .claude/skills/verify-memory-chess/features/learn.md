# Learn hub and articles

`/learn` is the SEO content hub: a goal-based index over 14 long-form chess-training articles at `/learn/<slug>`, English-only and statically generated for the default locale (`generateStaticParams` in `src/app/[locale]/learn/[slug]/page.tsx`). A locale-prefixed Learn URL answers 308 to the bare URL (`src/middleware.ts`, route list in `src/lib/seo/englishOnly.ts`). This surface exists to carry the site's crawlable content, so the crawler view matters as much as the browser view.

## Sub-features

- `learn-hub` lists the articles grouped by training goal.
- `learn-article` renders one article with rich prose, internal links to related slugs, and metadata.
- `learn-english-only` redirects `/<locale>/learn[/slug]` to the bare URL and renders the bare URL in English for every visitor.
- `learn-404` unknown slugs return the not-found page.

## How to get to it (user POV)

- Open `/learn` from the home page.
- Open an article directly, e.g. `/learn/chess-memory-training`.
- Follow a related-article link from inside another article.
- Follow an old locale-prefixed link, e.g. `/es/learn/chess-visualization-exercises`, and land on the bare English URL.

## Driving it with cdp.mjs

Preconditions:

- `doctor.sh 4517` reports OK.
- The canonical slug list is `LEARN_SLUGS` in `src/lib/seo/learn/index.ts`; do not hardcode a stale copy.

- **Hub.** `goto(baseUrl + "/learn")`; assert article links exist: `document.querySelectorAll('a[href^="/learn/"]').length >= 14`. Screenshot.
- **Article.** `clickText('a[href^="/learn/"]', "Chess Memory Training")` or `goto` a slug; assert an `<h1>` and body prose render, and that related links point at other `/learn/` slugs.
- **Crawler floor.** `helpers/ssr-words.sh http://127.0.0.1:4517/learn/chess-memory-training 300 | tee .verify-evidence/<run>/learn-article.ssr.txt`. Articles are the content pages; a low count here is a serious defect.
- **English-only check.** `curl -sI http://127.0.0.1:4517/es/learn/chess-memory-training` answers 308 to `/learn/chess-memory-training`, and `curl -s -L -b 'NEXT_LOCALE=de' http://127.0.0.1:4517/learn/chess-memory-training` ends 200 with `<html lang="en"`.
- **404.** `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4517/learn/not-a-real-slug` returns 404.

## Gotchas

- A green build plus one rendered article is strong coverage; the 14 articles share one component.
- Two retired slugs, `chess-board-vision-drills` and `working-memory-exercises-for-chess`, answer one 308 to the guide that absorbed each, with or without a locale prefix (`src/lib/seo/learn/retired.ts`).
- Article pages are SSG; after editing prose you must rebuild before the served page changes. `npm run dev` reflects edits live but is not the production check.
