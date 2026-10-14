# Night Study: Memory Chess brand and style sheet

Direction B. Mockup: `b-night-study.html` (same folder). Screenshots: `b-shots/ev/`.

## The idea

Memory Chess is played at a desk late in the evening, with a board in front of you and a number at the end. Night Study keeps the near-black room and the peach "Chess" that people already know from v1. It brings in v2's instruments (figures, boards, data panels, the seven-step method) and gives them a dark lab finish. Surfaces step up in grey layers instead of sitting on pure black. Text is a softened white. Peach is the only brand colour. The wooden board from /game is the one bright object on the page, the way a lit board is the brightest thing on a desk at night. Light is a designed second mode built from the same tokens, not an inversion.

## What it keeps, what it retires

Kept from v1
- The dark room. The default theme is dark, built on `#111214`, which is a step lighter than v1's `#0a0a0a`.
- The "Memory **Chess**" wordmark with peach on "Chess". It is the only wordmark.
- Peach as the brand colour. It is refined from peach-400 `#FFC299` to `#F5A97F`, which is more saturated and reads as a deliberate colour rather than a pastel. It is 9.7:1 on the page.
- The wood board from /game, toned down for a dark page.
- Footer content: links, the Product Hunt awards and the X link.

Kept from v2
- Every section, all the real copy and the method (seven numbered phases).
- Figures with captions, "Sample" tags, data panels, the unlock strip and the tier table.
- The voice: sentence-case headings, full stops on statements, and readings rather than scores.
- Kickers, now set in Geist instead of mono.

Retired
- The mint graph-paper island and the light lab inside a black site.
- The second sticky "Memory Chess Lab" bar. It is merged into the one header.
- Blue `#1f4fe0`, mint `#3fd0a8` and orange `#f2612d` as brand colours. Blue survives only as the board's "defends" mark.
- The mint board. Two board palettes become one.
- `§01 /` mono kickers, the crosshair-corner decoration and uppercase mono labels.
- Centred Title Case section heads ("See How Memory Chess Works") and the centred legacy video and FAQ blocks.
- The black changelog banner as a separate design. It is now a quiet strip in surface-1.

Section numbers: dropped from section heads. The sections are not a sequence the reader has to follow, and the sticky header already shows where you are. Numbers stay only where they mark a real order: the seven method phases, the three calibration steps and the figure numbers in the record (Fig. 1, 6, 7, 9 match the app's own figure ids).

## Colour tokens

Dark is the default on bare `:root`. Light lives under `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) }` and `:root[data-theme="light"]`. `body` takes `var(--bg)`.

| Token | Dark | Light | Role |
|---|---|---|---|
| `--bg` | `#111214` | `#f4f4f2` | Page |
| `--surface-1` | `#17191c` | `#fbfbfa` | Alternating section band, header strip, footer, table head |
| `--surface-2` | `#1e2125` | `#ffffff` | Cards, figures, the readout |
| `--surface-3` | `#272b30` | `#ecebe7` | Hover, bar tracks, empty cells |
| `--border` | `#2c3036` | `#e0dfda` | Dividers and card edges (decorative) |
| `--border-strong` | `#666d76` | `#8d8b84` | Boundaries of interactive controls |
| `--text` | `#ebe9e4` | `#18191b` | Headings and primary text |
| `--text-2` | `#b9bcc1` | `#45484d` | Body copy, ledes |
| `--text-3` | `#8f949b` | `#686c72` | Captions, metadata, axis labels |
| `--brand` | `#f5a97f` | `#f5a97f` | Primary button fill, chart line, active step, streak cells |
| `--brand-hover` | `#f8bb98` | `#f29a69` | Primary button hover |
| `--brand-ink` | `#f5a97f` | `#a8481a` | Peach used as text: wordmark, links, kickers |
| `--on-brand` | `#1f140d` | `#1f140d` | Text on a peach fill |
| `--ok` / `--ok-bg` | `#86c79f` / `#1c2a22` | `#1f7a48` / `#e5f2ea` | Gains, unlocked |
| `--warn` / `--warn-bg` | `#e2bd72` / `#2c2618` | `#8a5d00` / `#f8efd9` | The "Sample" tag |
| `--err` | `#ee9090` | `#b42e2e` | Recording dot, errors |
| `--info` | `#93b6ec` | `#2a5cb3` | Info notices |

Board tokens are the same in both themes (one board):

| Token | Value | Role |
|---|---|---|
| `--sq-light` | `#d9c4a0` | Light square |
| `--sq-dark` | `#96704f` | Dark square |
| `--board-edge` | `#3a2c20` | 1 px frame |
| `--coord-on-light` / `--coord-on-dark` | `#6e4f35` / `#fff6e6` | Coordinates on each square colour |
| `--mk-attack` | `#c0390f` | Attack arrow |
| `--mk-defend` | `#1f55b8` | Defend arrow, the long-diagonal line |
| `--mk-chain` | `#3f4449` | Pawn-chain dots, blocked-pair bar |
| `--mk-correct` | `#1b6b3f` | Correct square (tick) |
| `--mk-wrong` | `#c73333` | Wrong square (cross or fill) |
| `--mk-group` | `#1b1d20` | Dashed group outline and its number disc |
| `--mk-casing` | `#fbf6ec` | Light halo under every arrow and line |

### Contrast, computed (WCAG 2.x)

Dark: text/bg 15.45, text/surface-2 13.32, text-2/bg 9.84, text-2/surface-2 8.49, text-3/bg 6.14, text-3/surface-2 5.29, brand-ink/bg 9.70, brand-ink/surface-1 9.11, on-brand/brand 9.33, ok/surface-2 8.22, warn/warn-bg 8.41, err/surface-2 6.95, info/surface-2 7.81, border-strong/bg 3.58, border-strong/surface-2 3.09.

Light: text/bg 15.97, text/white 17.59, text-2/bg 8.34, text-2/white 9.18, text-3/bg 4.80, text-3/white 5.28, brand-ink/bg 5.29, brand-ink/white 5.82, ok/ok-bg 4.63, warn/warn-bg 5.03, err/white 6.23, on-brand/brand 9.33, border-strong/bg 3.10, border-strong/white 3.41.

Peach as text in light mode is 1.76 on the page, so light mode always uses `--brand-ink` `#a8481a` for text. The peach fill stays the same in both modes because its text, `--on-brand`, passes in both.

Board: black piece on light square 10.45, white piece on dark square 4.15, black piece on dark square 4.00, coordinates 4.36 and 4.14, dark square against the dark page 5.22. Marks over their casing: attack 5.09, defend 6.39, chain 9.13, correct 6.05. Without a casing, attack on a light square is 3.22, defend 4.05, correct 3.83 and wrong 3.13. On dark squares they fall to about 1.2 to 1.6, which is why every mark is drawn with a casing.

## Board: one palette, walnut

Use `--sq-light #d9c4a0` and `--sq-dark #96704f` for every board on every page: the hero showcase, the method, calibration, the video poster, and /game itself.

Why walnut works on a dark page:
- It is the /game board people already play on, toned down. The homepage now shows the board you will actually get.
- A mid-value warm board is the brightest object on a dark page without glaring. The dark square sits at 5.2:1 against `--bg`, so the board reads as one lit object, not a hole. Mint was built for paper and looked like a pastel sticker on dark. A slate board disappeared into the greys.
- Both piece colours read on both squares (4.0 or better). The dark square was darkened from `#b58863` to `#96704f` until white pieces passed.
- Warm wood next to warm peach gives one colour family. The marks (red-orange, blue, graphite) are the only cool or saturated colours on the board, so they stand out.

Pieces: the filled glyphs ♚♛♜♝♞♟ followed by U+FE0E, so they never turn into emoji. White pieces are `#faf7f0` with a dark 1 px outline. Black pieces are `#17181a` with a faint light halo. Size is 10.4% of the board width (container query units). Coordinates are in Geist Mono at 2.1% of the board width, with a 9 px minimum, inside the a-file and the first-rank squares.

Marks, which are always shape plus colour, never colour alone:
- Attack: a solid arrow with a head, `--mk-attack`.
- Defend: a solid arrow with a head, `--mk-defend`. The long-diagonal "line of sight" is the same colour, dashed.
- Chain: a dotted line with a node on each pawn, `--mk-chain`.
- Blocked pair: a short bar between the two pieces, `--mk-chain`.
- Group: a dashed rounded outline with a numbered disc that matches a numbered legend under the board.
- Correct: a tick in `--mk-correct`. Wrong: a cross or a fill in `--mk-wrong`. Missed: a ring on the square where the piece belonged.
- Every line and arrow sits on a `--mk-casing` halo 0.2 squares wide (85% opacity).

## Type

Font link: `https://fonts.googleapis.com/css2?family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&family=Open+Sans:wght@400;600;700&display=swap`

| Role | Family | Desktop | Mobile | Weight | Line height |
|---|---|---|---|---|---|
| Display (hero h1) | Geist | 68 | 40 | 680, -0.03em | 1.04 |
| Section title (h2) | Geist | 40 | 30 | 650, -0.015em | 1.15 |
| Final CTA title | Geist | 44 | 32 | 650 | 1.1 |
| Card or phase title (h3) | Geist | 19–22 | 18–21 | 600–650 | 1.3 |
| Lede | Open Sans | 18–19 | 16–17 | 400 | 1.6 |
| Body | Open Sans | 17 | 16 | 400 | 1.6 |
| Caption, helper | Open Sans | 14.5 | 14.5 | 400 | 1.55 |
| Kicker | Geist | 14 | 14 | 600, brand-ink | 1.3 |
| Nav, buttons | Geist | 14.5–15 | 15–16 | 500–600 | 1 |
| Figure label ("Fig. 6 · Miss map"), table head | Geist | 13.5 | 13.5 | 600, text-3 | 1.3 |
| Data: clock, stats, tier numbers, FEN, axes | Geist Mono | 20–34 (metrics), 11–13 (axes) | same | 500 | 1 |

Mono is only for things a machine measured or a notation: `7.229s`, `2–32`, `0–100%`, `10s`, `t = 4.0s`, `4 March 1998`, axis ticks, board coordinates, FEN. It is never used for labels, tags or kickers.

## Spacing and radius

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96. Sections are 96 apart on desktop and 64 on tablet and phone. A section head sits 48 above its content. Card padding is 24 (16 on phones).

Layout: content width 1200 with gutters of 40 (desktop), 24 (tablet) and 16 (phone). Section heads use a 5:6 two-column grid, with the kicker and h2 on the left and the lede on the right, aligned to the bottom. They stack below 900 px.

Radius: 6 for small controls, board squares and palette cells. 8 for buttons and inputs. 12 for cards, figures, tables and the CTA. 999 for tags only.

Elevation: no shadows on cards. A card is separated by one surface step plus a 1 px `--border`. `--shadow-pop` is only for menus and popovers.

## Components

**Header.** There is one sticky header, 64 tall, `--bg` at 88% with a blur and a bottom border. From left to right: the wordmark, then the page anchors (Method, Calibrate, Difficulty), a hairline separator, the site pages (Learn, Articles, Leaderboard, Progress, About), and finally the language button, the theme button and the primary "Play a free round". Below 1180 px the nav collapses into a "Menu" disclosure with two groups ("On this page", "Memory Chess"). On phones "Play" stays visible, shortened. The changelog notice is a 36 px strip in surface-1 above the header. It does not stick and it can be dismissed.

**Buttons.** All are 44 tall (36 for compact).
- Primary: `--brand` fill, `--on-brand` text, Geist 600. Hover uses `--brand-hover` and press moves it down 1 px. Use one per view.
- Secondary: transparent with a 1 px `--border-strong` border and `--text`. Hover fills `--surface-3`.
- Link: Geist 550, `--brand-ink`, always underlined, and the underline thickens on hover.
- Focus on all of them: a 2 px `--focus` outline offset by 2 px.

**Section head.** A kicker (a Geist 14/600 word in brand-ink), then a sentence-case h2, then an Open Sans lede in `--text-2` with a 640 px maximum width. The head is left-aligned and never centred.

**Card or figure frame.** `--surface-2`, a 1 px `--border` and radius 12. The label row has "Fig. N · Name" on the left in text-3 and the tag on the right. Then the title as a sentence, then the visual, then the caption in Open Sans 14.5.

**Tags.** A 24 px pill in Geist 12.5/600.
- Neutral: border-strong outline.
- `brand`: brand-ink outline.
- `sample`: warn on warn-bg.
- `ok`: ok on ok-bg.

A tag always carries a word ("Sample", "Rig", "Study 1/5"). It never relies on colour alone.

**Data panels.**
- Big numbers are mono 34 with a Geist unit after them.
- Deltas pair an arrow glyph with words ("▲ Up 2 pieces since last week").
- Bars have a surface-3 track with a brand fill. A baseline row (King) is grey and set off by a dashed rule.
- Heatmaps go from `--heat-0` to `--heat-4` and are capped at 360 px wide, with file and rank labels and a two-swatch key.
- Streak cells: played is a peach fill, a forgiven miss is an outlined cell with "–", and today is a dashed peach outline. Each state has its own shape.

**Unlock strip.** The count is in Geist ("1 of 10 figures unlocked"), followed by ten 8 px segments in `--ok` and the next requirement in words.

**Tables.** surface-2 with a surface-1 head row. Below 760 px each row becomes a stacked card with an inline label in front of each value.

**Accordion (FAQ).** A native `details`/`summary` with a 56 px minimum row and a chevron that rotates 180° in 200 ms. Answers are Open Sans in `--text-2` with a 640 px maximum width. The first item is open. The block sits in a 5:7 grid next to the heading.

**Final CTA.** A surface-2 card with a 4 px peach rule on the left edge. Primary and secondary buttons are stacked on desktop and sit side by side on phones.

**Footer.** surface-1. The wordmark sits above the link row (text-2, turning brand-ink on hover). The two Product Hunt award chips are on the right. A legal line at the bottom carries the X icon.

## Voice

- Sentence case everywhere: headings, buttons, nav and tags. Proper nouns stay capitalised ("Memory Chess", "Kasparov's Immortal").
- A heading that is a full sentence ends with a full stop ("A round, under the microscope."). A heading that is a label does not ("Reference library", "Questions about Memory Chess").
- Buttons are verbs plus objects: "Play a free round", "Submit reading", "Take a calibration reading". Avoid "Play a Free Round" Title Case.
- Use measurement words: reading, figure, sample, exposure, load. Make no claims about the brain.
- Numbers are written as digits with units: 10s, 6 pieces, 7.229s.

## Do and don't

Do
- Keep peach to one job per view: the primary action, the wordmark, links and the single data series.
- Separate layers by surface steps (bg, then surface-1, then surface-2) and hairlines.
- Draw every board with the walnut tokens and case every mark.
- Pair every status with a word or a shape.
- Use Geist Mono only for measured values and notation.

Don't
- Don't use pure `#000` surfaces or pure `#fff` text in dark mode.
- Don't add a second accent (mint, blue, purple) for decoration. Blue is a board mark only.
- Don't number sections, use `§` signs, or set uppercase mono labels.
- Don't centre section heads, and don't start a light "island" inside the dark page.
- Don't use peach as text on light backgrounds. Use `--brand-ink`.
- Don't stack two navs or show two wordmarks.
