# Lab Paper: Memory Chess brand and style sheet

Mockup: `a-lab-paper.html` (same folder). Screenshots: `a-lab-paper-shots/` (light and dark, 1440 and 390 wide).

## Using the shell on a page

The shell is the part every Lab Paper route shares. It lives in `src/components/lab-paper/`. `lab-paper.css` holds the tokens, the page base, buttons, the changelog banner, the header and the footer. `shell.ts` holds the Open Sans body face and `LAB_PAPER_CLASS`. The registry of routes that use it is `src/lib/lab-paper/routes.ts`. A route opts in with three steps.

1. **Add the route to `LAB_PAPER_ROUTES`.** Give its unprefixed `path`. Set `scope: "subtree"` when the paths beneath it come too (`/articles` covers `/articles/[slug]`), or `"page"` for that path alone. Set `locales` to `"all"` when every locale has the page's copy, or to the list that does. The homepage is `["en"]` because only English carries `home.lab`. On a listed route, in a listed locale, the locale layout draws the Lab Paper changelog banner and footer. Anywhere else it draws the dark banner and footer, and the page keeps `PageHeader`.
2. **Wrap the page in one Lab Paper block.** The page's root element takes `className={LAB_PAPER_CLASS}`. That class turns on the tokens for the whole document, sets the paper background and the body face, and keeps the sticky header steady on iOS. Never set `overflow-x` on `html` or `body` for a Lab Paper page. The shell keeps the root visible and clips each block instead (commit e8a36a3). The banner and footer each carry their own block, because the layout renders them outside the page.
3. **Render `<LabPaperHeader />` first inside that block, in place of `PageHeader`.** With no props it shows the wordmark, the site links (the current route is marked `aria-current="page"`), the language switcher, Play and the phone menu, all from `common.nav`, so it reads correctly in all 24 locales. Optional props:
   - `sections`: an on-page menu, `{ trigger, heading, links: [{ href: "#anchor", label, hint? }] }`. It appears as a dropdown beside the site links and as the first column of the phone menu. The homepage passes its six sections as "Lab".
   - `playLabel`: a longer label and accessible name for Play on wide screens. Phones always show "Play".
   - `tools`: a page's own controls before Play, such as the homepage's streak chip.

Page-specific rules (sections, figures, tables) stay in the page's own stylesheet, under `.lab-paper` when the class name could also appear on the dashboard. A shared primitive that a second page needs moves into `lab-paper.css`. New copy in the shell must exist in all 24 locales (`npm run validate`).

## The idea

Memory Chess is a measuring instrument for board memory, so the whole site reads like one calm lab notebook: white paper, dark ink, one blue pen. V2's lab sheet becomes the brand, and v1's black header, black banner, black footer and peach accent are retired. The costume parts of v2 go too: the page-wide graph grid, the mono uppercase labels, the § numbering and the crosshair corners. What stays is what does a job. A faint grid sits only behind figures (boards, charts, the final call to action) to mark "this is a measurement surface". Mono is used only for numbers that are measurements. Blue is the only brand colour and means "act here" or "this matters". The night theme is the same notebook read under a lamp: deep ink-blue paper with the board kept lit like a specimen plate.

## What it keeps, what it retires

| From | Kept | Retired |
|---|---|---|
| v1 | The "Memory Chess" name as the only wordmark. The site destinations: Learn, Articles, Leaderboard, Progress, About. The footer links, Product Hunt awards and X link. The language picker. | Black header, black changelog banner, black footer. Peach accent on "Chess" and on footer links. Centred Title Case headings. Centred video and FAQ blocks. Wood board (#f0d9b5 / #b58863). "Memory Chess LAB" badge. |
| v2 | Paper and ink (#0d1b24). The blue (#1f4fe0) as the single accent. Sentence-case headlines that end in a full stop. Left-aligned section heads. Figure framing (Fig. n, Sample tags). Real research copy, phases, the record panels. | Second sticky lab index bar. Page-wide 24px graph grid. Geist Mono uppercase kickers ("§03 / FIELD RECORDING"). § numbering. Crosshair corners. Mint as a brand colour and mint board squares. Orange as a brand mark. Dark ink CTA card with mint button. |

The changelog banner is carried over in paper: one quiet line on the surface colour above the header, the release in ink and "See what's new" as a blue link, dismissible for that release and shown for 30 days after it. It is in the served HTML, so it never pushes the page down after load, and it scrolls away while the header stays. "Changelog" also stays in the footer and in the phone menu.

## Decisions and why

**Single accent: ink blue `#1f4fe0` (night `#8ea8ff`).** It was already v2's link and "defend" colour, so it carries no new meaning. It reads as a pen on paper rather than as a highlighter, it passes 6.0:1 as text on the paper, and it keeps clear of the two status hues the game needs (green for correct, vermilion for wrong). Peach and mint were both rejected: peach collides with the "wrong" vermilion, and mint collides with "correct" green. The blue has one job everywhere: primary buttons, links, the active nav item, the active phase, the hero emphasis and the kicker rule. Nothing decorative is blue.

**Wordmark: darker peach `#c2541a` on paper.** The logo keeps its peach "Chess", deepened from `#FFB380` (1.64:1 on paper) to `#c2541a` (4.29:1 on paper, 4.02:1 on the footer surface), which passes the 3:1 rule for the 20 px bold wordmark. It is the token `--lp-wordmark`, used only on the wordmark (class `lab-wordmark-chess`), never on buttons, links or text. Dark pages keep `#FFB380`, which reads 11.3:1 on near-black.

**Board palette: slate on paper (`#eef2f2` light squares, `#c4cfd4` dark squares).** The board is the specimen, and the marks on it carry the meaning: attack, defend, chain, correct, wrong, missed. So the squares must be close to hue-neutral. Wood's orange-brown would fight the vermilion "wrong" and "attack" marks. Mint would fight the green "correct" mark. A cool slate is calm, keeps black pieces at 10:1 or better on both square colours, and keeps all board marks at 3:1 or better. In night mode the board stays lit (`#d3dce0` / `#a3b3bd`) instead of going dark, because black pieces and dark marks must stay readable. A lit plate on a dark desk also matches the notebook idea. One palette for every board: hero, method, calibration, /game, results and share cards.

**Board marks use their own tokens** (`--mk-*`) that do not change with the theme, because they sit on the board, not on the page. The page legend draws each mark on a small board-coloured tile so the legend matches what the eye sees on the board in both themes.

**Section numbering: dropped for page sections, kept where order is real.** The § numbers claimed an order the reader does not need (nobody reads "Library" as step 7). Kept: the seven method phases (Study → Score is a real sequence), the three calibration steps, and Fig. 1–4 inside the lab record (figures are referenced by number). Section kickers are plain words in Geist ("Method", "Calibrate").

**One header.** The lab index becomes a dropdown under a "Lab" item, the current page. It is marked with a blue dot and lists the six on-page sections, each with a short hint. The site links sit beside it. On phones the header is wordmark, a short "Play" button and "Menu". The menu opens a two-column sheet: "On this page" and "Site", with language and theme below. The duplicate "Play" nav link is dropped because the primary button already says it.

**Light-first.** The paper theme is the default, with the night theme following `prefers-color-scheme`. The theme toggle in the header sets `data-theme`.

## Colour tokens

Contrast ratios are WCAG 2.x, computed against the token values below.

### Page

| Token | Light | Night | Role |
|---|---|---|---|
| `--paper` | `#f5f8f7` | `#0c1521` | Page background |
| `--surface` | `#ffffff` | `#121d2b` | Figures, cards, table, dropdown |
| `--surface-2` | `#ecf1ef` | `#172436` | Footer, table head, empty tracks, chips |
| `--ink` | `#0d1b24` | `#e7edf2` | Headings, primary text |
| `--ink-2` | `#364853` | `#b8c5d0` | Body and lede text |
| `--muted` | `#56666f` | `#91a1b0` | Meta, captions, axis labels |
| `--line` | `#d6dfe0` | `#233246` | Hairlines, row separators |
| `--line-strong` | `#87969d` | `#5a6f88` | Secondary button and control borders (3:1 or better) |
| `--grid` | blue at 6% | `#8ca6ff` at 7% | Graph grid, inside `.plate-grid` only |
| `--accent` | `#1f4fe0` | `#8ea8ff` | The one accent |
| `--accent-hover` | `#1a41bb` | `#adc0ff` | Hover on primary and links |
| `--accent-soft` | `#e5ebfc` | `#1c2b4d` | Tag background, highlighted phrase, pressed palette key |
| `--on-accent` | `#ffffff` | `#0c1521` | Text on primary buttons |
| `--correct` | `#0f7a55` | `#4fcf9f` | Correct, up-trend, "Recording" status |
| `--wrong` | `#c63f12` | `#ff8c63` | Wrong placement, missed square |

Text pairings (light / night):

| Pairing | Light | Night |
|---|---|---|
| ink on paper | 16.4 | 15.5 |
| ink on surface | 17.5 | 14.4 |
| ink-2 on paper | 8.9 | 10.4 |
| muted on paper | 5.6 | 6.9 |
| muted on surface-2 (footer meta) | 5.2 | 5.9 |
| accent on paper (links, kickers) | 6.0 | 8.0 |
| accent on accent-soft (tags) | 5.4 | 6.1 |
| on-accent on accent (primary button) | 6.5 | 8.0 |
| correct on surface | 5.3 | 8.7 |
| wrong on surface | 5.1 | 7.4 |
| line-strong on surface (control edge, needs 3:1) | 3.05 | 3.3 |

### Board (same in both themes, except the squares)

| Token | Value | Role | Lowest ratio on a square |
|---|---|---|---|
| `--sq-light` | `#eef2f2` (night `#d3dce0`) | Light square | |
| `--sq-dark` | `#c4cfd4` (night `#a3b3bd`) | Dark square | |
| `--piece-black` | `#15202a` | Black piece fill | 7.7 |
| `--piece-white` + `--piece-edge` | `#fcfcfa` + `#15202a` 1px outline | White piece | the outline carries it |
| `--mk-attack` | `#a8320b` | Attack arrow, solid | 3.1 |
| `--mk-defend` | `#1a3fc0` | Defend arrow, dashed; group ring for the active idea | 3.9 |
| `--mk-chain` | `#3d4d58` | Pawn chain line with end dots; neutral group rings | 4.1 |
| `--mk-ink` / `--mk-on` | `#0d1b24` / `#ffffff` | Blocked-pair bar, numbered group badges | |
| correct fill | `--correct` at 26% over the square | Correct square | |
| wrong fill | `--wrong` at 30% over the square | Wrong placement | |
| missed ring | 2.5px `--wrong` inset ring | Missed square | |

Each mark differs in shape as well as colour: attack is a solid arrow, defend is dashed, a chain is a line with dots, a block is a bar, and missed is a ring where wrong is a fill. So no mark depends on colour alone.

## Type

Families: **Geist** for headings, nav, buttons, labels, metrics and short UI text. **Open Sans** for paragraphs, ledes, FAQ answers, captions and helper text. **Geist Mono** only for measurements: clocks (`7.229s`, `t = 4.2s`), counts, scores, ranges, board coordinates and FEN-like figures. A word label in mono is a bug.

| Role | Family | Desktop | Mobile | Weight | Line height |
|---|---|---|---|---|---|
| Display (hero) | Geist | 64px, -0.03em | 40px | 650 | 1.04 / 1.08 |
| Section title (h2) | Geist | 40px, -0.02em | 30px | 650 | 1.12 |
| Phase title (h3) | Geist | 28px | 24px | 650 | 1.2 |
| Card / entry title | Geist | 20–21px | 20px | 600 | 1.3 |
| Lede | Open Sans | 19px | 17px | 400 | 1.6 |
| Body | Open Sans | 17px | 16px | 400 | 1.6 |
| Kicker | Geist | 14px, sentence case | 14px | 600 | 1.3 |
| Nav, buttons | Geist | 15–16px | 16px | 500 / 600 | 1.3 |
| Meta, fig labels, table head | Geist | 13px | 13px | 500–600 | 1.4 |
| Caption, helper | Open Sans | 14px | 14px | 400 | 1.55 |
| Metric value | Geist Mono, tabular | 20–32px | 20–28px | 500 | 1.2 |
| Coordinates | Geist Mono | 11px | 11px | 400 | 1 |

The hero keeps the SEO `h1` ("Memory chess game · chess memory trainer") as a small Geist line above the display sentence, as production does today.

## Spacing and radius

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96. Sections are 96px apart on desktop and 64px on phones, separated by one hairline. The section head (kicker, h2, lede) is capped at 760px and sits 48px above its content. The page container is 1200px wide with a gutter of `clamp(16px, 4vw, 48px)`. The header is 64px tall.

Radius: 6px for small controls and nav hovers, 8px for buttons and inputs, 12px for figures and cards, 999px for tags and phase pills only. The board itself uses 4px.

Shadows appear only on the dropdown (`0 12px 32px rgba(13,27,36,.12)`) and the video play disc. Everything else uses a 1px border. A dialog sits on one scrim, ink at 48% (`--lp-scrim`), whichever component draws it.

## Components

**Header.** Sticky, paper at 92% with an 8px blur, and a 1px bottom line. Left: the mark (a 2×2 board tile, ink outline, ink square top-left, accent square bottom-right) and "Memory Chess" in Geist 650 at 18px. The mark is the only drawn logo. Then "Lab ▾" (current page, blue dot, dropdown of on-page sections), Learn, Articles, Leaderboard, Progress, About. Right: language, theme toggle, then the primary "Play a free round". Below 1080px "About" moves to the menu. Below 860px the nav collapses into "Menu". Below 480px the button reads "Play".

**Buttons.** Primary: solid accent, on-accent text, 44px tall, 8px radius, Geist 600 at 16px. Use one per view. Secondary: surface fill, `--line-strong` border, ink text, and a border that darkens on hover. Small (36px tall, 14px text) is used in the header and table rows only. Link: accent, 1px underline, offset 3px. "Link with arrow" appends `→` for "show more" links. Focus: a 2px accent outline with a 2px offset on everything.

**Section head.** Kicker (Geist 14 / 600, accent, preceded by a 16×2px accent rule), then h2, then lede. Always left-aligned. No numbers.

**Figure frame (`.plate`).** Surface, 1px line, 12px radius, 24px padding (16px on phones). Add `.plate-grid` only when the plate holds a board, a chart or the final call to action. The top row is `.fig-meta`: "Fig. 2 · Miss map" on the left, a tag or a mono clock on the right. Do not nest plates.

**Tag.** A 24px pill, Geist 12 / 600. Accent tags (`Sample`, `Free · no account`) use accent on accent-soft. Neutral tags (`Study`, `Rig`, piece counts) use ink-2 on surface-2. Keep tag text short. A tag is a label, never a status by colour alone.

**Status.** A dot plus a word ("Recording"). The colour is only a second cue.

**Accordion (FAQ).** Native `<details>`. Question in Geist 18 / 500. A hairline above and below. A chevron made from two border strokes rotates 180°. Answer in Open Sans ink-2, capped at 680px. The first item is open. The FAQ section uses a two-column layout on desktop with a sticky head on the left.

**Table (difficulty).** A surface plate with a surface-2 head row. Text columns are left-aligned. Numbers are mono, right-aligned and tabular. The load glyph is 32 small squares with filled squares in accent. The row action is a small secondary "Play" button. Below 768px each row becomes a stacked block: name and description, then labelled Pieces and Exposure values, then Play. The load glyph is hidden there because its value is already in the number.

**Board.** CSS grid of 8×8 with Unicode solid glyphs (U+265A–265F plus VS15 for text presentation) for both colours. White is drawn as a light fill with a 1px dark outline, so both sides use the same glyph shape. Glyph size is 9.4% of board width (container query units). Coordinates sit outside the board in mono 11px. Overlays are one SVG with `viewBox="0 0 8 8"`, so marks are placed by square. Group outlines are dashed rounded squares with numbered ink badges, explained by a numbered legend outside the board. Labels never sit on the board itself.

**Record panels.** Fig. label and a `Sample` tag, then the title (a sentence ending with a full stop), the metric in mono, the change in green with an arrow and words ("Up 1 piece since last week"), the chart, then the caption. Charts use the accent for the measured series and neutral lines for grid lines. Baselines (King) use a hatched neutral bar and the word "baseline". Heatmaps use a single-hue accent ramp with a labelled "fewer misses → more" key. Streak days use fill (played), hatch (forgiven), outline (missed) and a dashed accent outline (today), each with a text key.

**Footer.** A surface-2 band with a top hairline, no black. Three columns: the mark with a one-line description, the site links (ink text that turns accent and underlined on hover), and the recognition badges (Product Hunt #5 Product of the Day, #2 Product of the Week in Education). Use the official Product Hunt badge images in their light theme (`theme=light`) on paper and their dark theme on dark pages; never redraw them. `ProductHuntBadges` in `src/components/ui/Footer.tsx` renders both. The base row holds the copyright, X (Twitter) and the language.

## Voice

- Headlines are sentences in sentence case and end with a full stop: "A round, under the microscope." "Questions about Memory Chess."
- Card and panel titles that are sentences also end with a full stop ("Where your squares slip."). Name-like titles do not ("Board vision", "Readout card").
- Kickers, nav, buttons and tags are sentence case with no full stop, and are never uppercase: "Play a free round", "Field recording".
- Buttons are verbs that name the action: "Take a calibration reading", "Submit reading", "Open your progress dashboard".
- Measurements carry their unit with no space: `10s`, `7.229s`, `0–100%`. Use en dashes for ranges.
- Write plainly and claim nothing about brains. Sample data is always labelled `Sample`.

## Do and don't

Do:
- Use the accent for actions and the one emphasised phrase per view, and nothing else.
- Put the graph grid only behind a measurement surface.
- Use mono only when the text is a number someone measured or a square name.
- Keep every board on the slate palette, with marks from `--mk-*`, and give every mark its own shape.
- Give every status a word as well as a colour.
- Left-align section heads and body. Cap prose at about 760px.

Don't:
- Bring back black bands, mint or wood anywhere, including /game. Peach appears only as the darker `--lp-wordmark` in the logo.
- Use uppercase mono kickers, § numbers or crosshair corners as decoration.
- Put two primary buttons side by side, or more than one primary button in the header.
- Centre a section inside the left-aligned page.
- Put text labels on the board. Use numbered badges and a legend outside.
- Invert colours for the night theme. Night has its own values, and the board stays lit.
