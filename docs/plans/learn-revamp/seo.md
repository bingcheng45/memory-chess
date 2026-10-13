# Learn revamp: what SEO must keep and add

Learn is the site's main search entry point. This file lists what the revamp must keep exactly, what it should add, and the AdSense rules that a redesign can break without anyone noticing in a browser. Facts below were read from the source on `feat/brain-lab-landing` and from a production build served locally on port 4681.

## Keep exactly

### URLs

- The hub stays at `/learn`. Each guide stays at `/learn/<slug>`, with the 14 slugs listed in `inventory.md`. No slug changes in the revamp.
- Topic groups get fragment anchors on the hub (`/learn#board-vision`), not their own URLs. A group page with 2 guides would fall under the 300-word floor and share most of its text with the hub. Revisit when a group holds 5 or more guides.
- `/learn/search` is the one new path (see `search.md`). It is `noindex, follow`, kept out of the sitemap, and "search" becomes a reserved slug that no guide may take.

### Redirects

- `src/lib/seo/learn/retired.ts` keeps its 2 entries. The middleware answers a retired slug with one 308 to the live guide, with or without a locale prefix (`resolveRetiredLearnPath`, called from `src/middleware.ts`).
- When the revamp merges or renames a guide, add the old slug to `RETIRED_LEARN_SLUGS` in the same commit. Never chain one retired slug to another.
- Trailing slashes and locale prefixes keep redirecting in one 308 to the bare English URL. The AdSense audit's `trailing-slash-redirect` and `locale-prefix-redirect` checks cover both.

### Locale behaviour

- `/learn` is in `ENGLISH_ONLY_ROUTES` (`src/lib/seo/englishOnly.ts`). Each guide has one URL, one self canonical and no hreflang alternates, in both the HTML and the `Link` header. `buildLearnPageMetadata` sets `alternates: { canonical }` only, and the revamp keeps that.
- Links into Learn from translated pages carry `hrefLang="en"` and the "(English)" suffix from `englishOnlyLinkSuffix`. Keep both on any new link, such as an article CTA that points into a guide.
- Moving Learn onto Lab Paper means adding `{ path: "/learn", scope: "subtree", locales: ["en"] }` to `LAB_PAPER_ROUTES`. The `locales: ["en"]` value matters. Learn has no translations, so no other locale should draw the Lab Paper banner and footer around it.

### Metadata

- `title`, `description`, canonical, Open Graph `article` fields (`publishedTime`, `modifiedTime`, `authors`, `tags`) and the per-guide `opengraph-image` and `twitter-image` routes stay as `buildLearnPageMetadata` builds them today.
- Titles and descriptions stay unique across the site. The template caps them at 60 and 160 characters. 4 descriptions are over 160 today and need trimming (listed in `template.md`).
- The sitemap keeps `/learn` at priority 0.8 with `lastModified` from `LEARN_LAST_UPDATED`, and each guide at 0.7 with its own `updatedAt`. Only bump `updatedAt` when the guide's text changes, not when the template or CSS does.

### JSON-LD

The guide page emits one `@graph` today with `Article`, `WebPage`, `BreadcrumbList`, `FAQPage` (when the guide has an FAQ), `Organization` and `WebSite`. The hub emits `CollectionPage`, `ItemList`, `BreadcrumbList`, `Organization` and `WebSite`. Keep all of it, with these changes:

- **Article.** Keep `headline`, dates, the `Person` author `Bing Cheng` with `@id` `https://thememorychess.com/about#bing-cheng`, the publisher reference and `image`. `articleSection` becomes the group label. Add `educationalLevel` from `meta.level` and `timeRequired` as an ISO 8601 duration from `readingMinutes` (`PT6M`). Add `about` with `meta.keywords.primary`. Each addition is optional schema.org vocabulary and changes no rich result.
- **FAQPage.** Keep it on guides that have an FAQ. Google shows FAQ rich results only for a small set of authoritative health and government sites since 2023, so expect no snippet. The markup still describes the page and costs nothing. Answers must stay in the served HTML: keep the native `<details>` that `LearnArticleRich` uses, never a component that unmounts closed answers.
- **BreadcrumbList.** Keep Home, Learn, guide. The visible breadcrumb may show the group as plain text, as it shows the goal today. Do not put the group in the JSON-LD with a fragment URL.
- **ItemList on the hub.** Keep one flat `ItemList` of all guides, in display order, so `position` matches what a reader sees. Grouping lives in the HTML headings, not in nested lists.
- **Board diagrams.** No schema type fits a chess diagram. The caption is the accessible name and the visible text, which is enough.

## Add

- **Answer first.** The quick answer stays above the fold as text, not as an image or a collapsed block. Today it renders as a 30-word `h2`. Render it as a paragraph under a short label instead, so the heading outline stays topical.
- **Internal links by group.** Each guide links the other guides in its group plus 1 or 2 outside it, in the "What to learn next" list. The prose gets inline links through `Rich` text. Target at least 2 inbound guide links for every guide. `how-to-think-in-chess-for-beginners` has 1 today.
- **Hub as the topic index.** The hub lists every guide under its group heading as a plain link in the served HTML, with title and description, so a crawler sees the full list without running the search.
- **Questions on the page.** Show `meta.questions` as visible text on the guide (a "This guide answers" list near the top) only if each question appears on one guide. A question shared by two guides would add a repeated sentence.

## AdSense rules a redesign can break

The AdSense audit (`npm run audit:adsense`, described in `.claude/skills/verify-memory-chess/SKILL.md`) runs over every sitemap URL. Three of its rules are easy to break with a new template:

1. **Heading template.** A page with at least 4 `h2` headings fails when half or more of them each head more than three pages. A guide page has 11 `h2` today, and 3 of them are shared ("Run the drill now", "What to learn next", "FAQ"). Adding shared `h2` labels such as "Key takeaways", "Questions this answers", "Sources" or "Further reading" can push a short guide over half. Render shared chrome labels as `p` or `span`, as `ArticlePage`'s "Train it with a guide" does, and keep `h2` for the guide's own sections.
2. **Repeated sentences.** No sentence of 5 or more words may appear on more than three pages. CTA blurbs, empty-state text, search hints and group descriptions repeated on every guide break this. Write CTA `why` text per guide. Keep repeated chrome under 5 words or mark it `data-authorship-note` only where it truly is an authorship note.
3. **Hidden text.** Text inside a `hidden` attribute, `display: none`, or a bare `hidden` class counts as hidden at any viewport. A search panel, a "no results" message or a mobile-only table of contents rendered server-side and hidden fails the page. Render those only on the client, or render them visible.

Also keep:

- One `h1`, a title and a description per page.
- At least 300 main-content words on every guide and on the hub. The hub has 3 `h2` and its words come from guide titles and descriptions. If a layout collapses groups into closed `details`, the text is still in the HTML and still counts.
- No two guides sharing more than half their 5-word shingles.
- Links to privacy, about, terms and contact. The Lab Paper footer carries them.

## Server-rendered content

- Guides and the hub stay statically generated (`generateStaticParams` on the English locale only).
- Every block renders to HTML on the server, boards included. A board is a CSS grid with Unicode glyphs and one inline SVG, as `docs/design/brand-directions/lab-paper.md` specifies. Do not draw Learn diagrams with `BoardFigure` from `src/components/round`, which is a client component and loads piece images from `upload.wikimedia.org`.
- The search works without JavaScript through `/learn/search?q=` (see `search.md`). With JavaScript, the same ranking runs in the browser and the form does not reload.
- Check the floor with `ssr-words.sh` on `/learn` and two guides after the change. Baseline from this build, page chrome included: `/learn` 893 words, `/learn/how-to-stop-blundering-in-chess` 1582, `/learn/20-minute-daily-chess-study-plan` 1258.

## Core Web Vitals

- **LCP.** The h1 and the quick answer are the largest elements, so LCP is text. Open Sans is loaded with `preload: false` in `src/components/lab-paper/shell.ts`. On Learn, Open Sans is the body face above the fold. Measure LCP before and after, and preload the latin subset for `/learn` routes if it shows up as the LCP delay.
- **CLS.** Boards have a fixed aspect ratio. Images carry `width` and `height`. The search results area reserves no space on load because it does not exist until the reader types.
- **INP.** The search index for 14 guides and 3 articles is small. The reference ranker in `learn-proto/search.js` answers in under 5 ms per query in Node on this machine (measured). Load it on first focus of the search field, not on page load.
- **Motion.** Cross-document view transitions (`@view-transition { navigation: auto; }`) give hub-to-guide transitions with no JavaScript. They are off under `prefers-reduced-motion`, and browsers without support navigate normally.
- **JavaScript.** Today's Learn pages ship no Learn-specific client JavaScript beyond the shell. The revamp adds the search island and nothing else. The table of contents, FAQ and boards stay server-rendered HTML.

## Verification before merge

1. `npx jest --testPathIgnorePatterns=/node_modules/` with `learnPages`, `learnMetadata`, `crossLinks`, `guideFacts`, `retired` and the new `learnTemplate` tests green.
2. `npm run build`, serve on a free port, and run `npm run audit:adsense -- --base http://127.0.0.1:<port> --out .verify-evidence/learn-revamp/adsense`. It must exit 0.
3. `ssr-words.sh` on `/learn`, `/learn/search?q=blunder` and two guides.
4. Compare the JSON-LD `@type` set on one guide and on the hub before and after. Today the guide emits Article, ImageObject, Person, WebPage, CollectionPage, BreadcrumbList, ListItem, FAQPage, Question, Answer, Organization and WebSite.
