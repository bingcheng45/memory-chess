# Ranks and Files: Memory Chess brand and style sheet

Mockup: `c-ranks-files.html`. Screenshots: `c-shots/` (`c-w1440-NN.png`, `c-w390-NN.png`, `c-w390-menu.png`).

## The idea

A chessboard has two square colours, and nobody reads that as two designs. Ranks and Files turns the clash between v1 (black) and v2 (mint paper) into the same kind of rule. The page alternates **night bands** and **paper bands**, and each band type has one job. Night is for play and brand moments: header, hero, video, calibration round, final call to action, footer. Paper is for reading and data: notebook, method, difficulty, lab record, library, questions. Both bands use one palette, one accent hue, one board palette and one type system, and the board squares are taken from the band colours. That is why the alternation reads as rhythm and not as two sites.

## The band rule (apply this on other pages)

1. **Pick the band by the job of the section, not by taste.**
   - Night: the reader is about to *do* something (play, calibrate, watch), or the page is speaking as the brand (header, hero, final call to action, footer).
   - Paper: the reader is *reading or comparing* (explanations, tables, charts, guides, FAQ, legal text).
2. **Sections next to each other with the same job share one band.** Never put two bands of the same tone next to each other. Merge them. On the homepage that gives five bands: night (header + hero), paper (notebook + method), night (video + calibration), paper (difficulty + record + library + questions), night (final CTA + footer).
3. **Inside a paper band, sections are separated by a 1px rule inside the gutter and 96px of space.** Inside a night band, space alone separates them.
4. **Components never pick colours.** They use role variables (`--fg`, `--fg-2`, `--fg-3`, `--surface`, `--line`, `--link`, `--btn-bg`), and the band class (`.band--night` or `.band--paper`) maps those roles onto the palette. The same card, button or board markup works in either band.
5. **Primary buttons take the tone of the opposite band.** On night the primary button is paper; on paper it is ink. They work like the pieces: a light piece on a dark square, a dark piece on a light one.

**Limits.**
- A page needs at least one paper band. A page that is all play (`/game`) can be all night with no alternation. Do not invent paper bands just to get the rhythm.
- Long reading pages (articles, Learn guides, privacy) are one paper band between a night header and a night footer. Do not cut an article into stripes.
- Dashboards (`/progress`, `/leaderboard`) are paper. Only the page's main action strip (for example "Play a round" with today's board) may be night.
- Do not use more than five bands on a page. If you need more, the page has too many sections.
- No third band tone. If something needs to stand out inside a band, use a `--surface` card, not a new background colour.
- This is a single deliberate look, so there is no light/dark theme switch. The page already contains both tones. Every colour comes from a token.

## What it keeps, what it retires

| From | Kept | Retired |
|---|---|---|
| v1 | Black brand surfaces (as night bands), white text on dark, the single centred wordmark idea, footer links and Product Hunt awards, the FAQ content | Pure #0a0a0a black (now ink #0d1b24), peach accent, the centred two-row header, changelog banner above the header (moved to the footer as "Version 1.2.5 · What's new"), Title Case centred headings, wood board |
| v2 | Mint paper #f5f9f8, ink #0d1b24, blue #1f4fe0, orange as a board mark, sentence-case headlines ending in a full stop, left-aligned two-column section heads, ink final call to action | Graph-paper grid, crosshair figure corners, mono uppercase kickers, the second "Memory Chess Lab" index bar, mint board squares, mint button, § numbers |

**Section numbers.** The § numbers are dropped. The homepage sections are not a sequence a reader works through; they are a set of topics, and the numbers only added noise to the header menu. Numbers stay where they encode a real order: the seven method phases (Study to Score), the three calibration steps, and the step counter in the hero study ("Study 1/5"). The "Fig. 6.x" prefixes go too; each panel is named by its subject ("Memory span").

## Colour tokens

One palette. Two contexts map roles onto it.

### Palette

| Token | Hex | Role |
|---|---|---|
| `--night` | #0d1b24 | Night band background, ink text on paper, ink buttons |
| `--night-2` | #15262f | Card surface on night |
| `--night-3` | #1d313b | Hover and chip surface on night |
| `--night-line` | #2b404b | Borders and rules on night (decorative, see note) |
| `--chalk` | #eef3f2 | Primary text on night |
| `--chalk-2` | #b4c2c6 | Secondary text on night |
| `--chalk-3` | #8b9ba1 | Muted text on night, outline-button borders on night |
| `--paper` | #f5f9f8 | Paper band background, primary button on night |
| `--paper-2` | #ffffff | Card surface on paper |
| `--paper-3` | #ebf1f0 | Chip and table-head surface on paper |
| `--paper-line` | #d3dedc | Borders and rules on paper (decorative, see note) |
| `--ink` | #0d1b24 | Primary text on paper (same value as `--night`) |
| `--ink-2` | #3a4b56 | Secondary text on paper |
| `--ink-3` | #56666f | Muted text on paper, outline-button borders on paper |
| `--accent` | #1f4fe0 | Links, focus, active step, "defends" mark, on paper |
| `--accent-night` | #8ea8ff | The same blue hue lifted for night: links, focus, headline emphasis |
| `--accent-soft` | #e3eaff | Highlight wash behind text on paper |
| `--sq-light` | #e3eae8 | Light board square (paper, one step darker) |
| `--sq-dark` | #8fa29f | Dark board square (ink mixed into paper, about 55% paper, tinted to mint) |
| `--mark-attack` | #d9481c | Attack arrows, wrong-square fill base |
| `--mark-defend` | #1f4fe0 | Defend arrows (dashed) |
| `--mark-chain` | #56666f | Pawn-chain lines |
| `--mark-correct` | #1b7f5a | Correct-square ring, "Recording" status dot |
| `--mark-wrong` | #d9481c | Wrong placement, missed-square ring |

### Role variables per band

| Role | Night value | Paper value |
|---|---|---|
| `--bg` | `--night` | `--paper` |
| `--surface` | `--night-2` | `--paper-2` |
| `--surface-2` | `--night-3` | `--paper-3` |
| `--fg` / `--fg-2` / `--fg-3` | chalk / chalk-2 / chalk-3 | ink / ink-2 / ink-3 |
| `--line` | `--night-line` | `--paper-line` |
| `--line-strong` | `--chalk-3` | `--ink-3` |
| `--link` | `--accent-night` | `--accent` |
| `--btn-bg` / `--btn-fg` | paper / ink | ink / paper |

### Contrast (computed, WCAG 2.x)

| Pairing | Ratio |
|---|---|
| ink on paper | 16.50 |
| ink-2 on paper | 8.53 |
| ink-3 on paper | 5.61 |
| ink-3 on white card | 5.96 |
| accent on paper | 6.08 |
| accent on white card | 6.46 |
| accent on accent-soft | 5.37 |
| chalk on night | 15.62 |
| chalk-2 on night | 9.57 |
| chalk-3 on night | 6.09 |
| chalk-3 on night-2 card | 5.41 |
| accent-night on night | 7.67 |
| accent-night on night-2 card | 6.81 |
| paper button on night, ink label | 16.50 (label), 16.50 (button edge vs band) |
| ink button on paper, paper label | 16.50 |
| ink piece on dark square | 6.53 |
| dark square vs light square | 2.19 (squares are separated by their pattern, not by contrast alone) |
| attack orange on paper / light square | 4.04 / 3.51 (used for marks only, never body text) |
| correct green on paper | 4.68 |
| chain grey on light square | 4.88 |

Note: `--night-line` (2.01 on night) and `--paper-line` (1.42 on paper) are for dividers only. Anything a user has to find (outline buttons, inputs, the board edge on night) uses `--line-strong`, which is at least 5.6:1. White pieces get a 1.1px ink stroke, because white alone on the dark square is only 2.68:1.

## Type

Fonts: Geist (headings, navigation, buttons, labels, metrics), Open Sans (paragraphs, ledes, FAQ answers, captions, helper text), Geist Mono (data only: clocks, `t = 4.2s`, readout values, FEN strings, board coordinates). Load:
`https://fonts.googleapis.com/css2?family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&family=Open+Sans:wght@400;600;700&display=swap`

| Role | Family | Desktop | Mobile | Weight | Line height |
|---|---|---|---|---|---|
| Display (hero h1) | Geist | 64px | 40px | 650, tracking -0.035em | 1.04 |
| Final CTA title | Geist | 52px | 32px | 600, -0.03em | 1.12 |
| Section title (h2) | Geist | 44px | 30px | 600, -0.015em | 1.12 |
| Active phase title | Geist | 24px | 24px | 600 | 1.3 |
| Card / panel title (h3) | Geist | 20px | 20px | 600 | 1.3 |
| Lede | Open Sans | 19px | 17px | 400 | 1.6 |
| Body | Open Sans | 17px | 17px | 400 | 1.6 |
| FAQ question | Geist | 18px | 18px | 600 | 1.3 |
| Nav link / button | Geist | 15–16px | 15–16px | 500 / 600 | 1.25 |
| Label (section name, card kicker) | Geist | 14px | 14px | 600 | 1.3 |
| Metric value | Geist, tabular-nums | 26px (stats), 44px (panel figure) | same | 600–650 | 1 |
| Caption, helper | Open Sans | 14px | 14px | 400 | 1.5 |
| Data | Geist Mono, tabular-nums | 12–30px by context | same | 400–500 | 1 |

Nothing essential goes below 13px. Board coordinates are 12px mono metadata.

## Spacing and radius

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px (`--s1` to `--s9`).
- Section padding: 96px top and bottom (64px under 560px wide).
- Section head to content: 48px.
- Card padding: 24px (16px on phones for the hero showcase).
- Page width 1200px, gutter `clamp(16px, 4vw, 48px)`, so 16px on a 390px phone.
- Section head: a 200px label column and a content column on desktop; stacked under 860px.

Radius: 6px (small controls, chips), 10px (buttons, idea rows, awards), 14px (cards, figures, panels), 999px only for badges and the poster play pill. Board squares have no radius; the board frame is 2px.

## Components

**Header.** One sticky night bar, 64px high. Wordmark on the left (a 2x2 two-tone square mark, then "Memory Chess" in one colour). Site links (Learn, Articles, Leaderboard, Progress, About) next to it. On the right: a "Menu" disclosure, the language button, and the primary "Play a free round". The Menu holds the on-page links (Notebook to Questions) on desktop, and on screens under 1040px it holds the site links too. Under 560px the language button moves into the menu and the play button reads "Play". "Play" is not repeated as a nav link because the primary button already is that link.

**Buttons.**
- Primary: `--btn-bg` fill, `--btn-fg` label, 44px min height, radius 10px. One per section at most.
- Secondary: transparent, 1px `--line-strong` border, `--fg` label.
- Link action: Geist 600, `--link` colour, ends with an arrow ("Play →", "Read guide →"); underlines on hover.
- Disabled: 45% opacity, plus a line of helper text that says why ("Submit unlocks once you have placed a piece.").

**Section head.** Label (the section's name in sentence case, Geist 14px 600, `--fg-3`) in the left column; h2 plus lede in the right column. No numbers, no rules above it.

**Card / figure frame.** `--surface` fill, 1px `--line` border, radius 14px, 24px padding. A figure has an optional top bar of chips (status, clock, counts) and a figcaption in 14px `--fg-3`. No crosshair corners, no shadows.

**Tag / badge.** 24px pill, 1px `--line-strong` border, Geist 12.5px 600. Status badges carry a dot and a word ("Recording"). "Sample", "Rig" and "Free · no account" are badges. Never use colour alone.

**Accordion (FAQ).** Native `<details>`; 56px min row; question in Geist 18px 600; chevron rotates 180° in 150ms; answer in Open Sans `--fg-2`, max 66ch; the first item is open.

**Board.** CSS grid of 8x8 squares, `--sq-light` and `--sq-dark`, a1 dark. Frame 1px ink on paper, 1px `--chalk-3` on night. Pieces are Unicode glyphs (filled set for both sides, with U+FE0E): white is #fff with a 1.1px ink stroke, black is ink. Coordinates in 12px Geist Mono, `--fg-3`. One palette for every board on the site, `/game` included (it replaces the wood board).

**Board marks** (SVG overlay, 800-unit viewBox, every mark has a 16-unit paper halo so it reads on both square tones):
- Attack: solid `--mark-attack` arrow.
- Defend: dashed `--mark-defend` arrow.
- Chain: solid `--mark-chain` line joining pawn centres.
- Blocked pair: a short ink bar on the shared edge.
- Group outline: dashed ink rectangle at 55% opacity; the active group is solid accent with a 10% accent wash.
- Correct: `--mark-correct` 2px inner ring on the square.
- Wrong placement: the square fills with a light orange (#f6c7b6 light, #e59a7f dark).
- Missed square: dashed `--mark-wrong` circle.
Every mark has a text key next to the board.

**Data panels.** Single-hue ink for every chart: span staircase line, bars, heatmap (ink at 5% to 95% opacity), streak cells. Accent marks only the latest point. Baselines and forgiven days are hatched, not a second colour.

**Load grid (difficulty).** 8x4 cells, half a board, filled in ink for the piece count, with the text "6 of 32 squares filled" beside it.

## Voice

- Headlines are sentences in sentence case and end with a full stop: "Questions about Memory Chess." "See how Memory Chess works."
- Labels and buttons are sentence case with no full stop: "Play a free round", "Lab record", "Readout card".
- No uppercase kickers, no letter-spaced mono labels, no § marks.
- Numbers carry units: "10s exposure", "6 pieces", "0–100%". Use an en dash for ranges.
- Say what a sample is: "Sample record · 12 sessions". Never show sample data without the word Sample.

## Do and don't

Do
- Decide a section's band by its job (play or brand on night, reading or data on paper) before you style it.
- Use role variables in components so they work in both bands.
- Reuse the one board palette and mark set everywhere a board appears.
- Keep Geist Mono for values that change or are measured.
- Left-align headings and text in every band.

Don't
- Put two night bands or two paper bands next to each other.
- Add a third background tone, a gradient, a grid texture or a glow.
- Use the accent as a fill for large areas or as a button colour. It is for links, focus and one highlighted data point.
- Use orange for anything that is not a board mark or an error.
- Centre a section inside a left-aligned page, or use Title Case headings.
- Reintroduce peach, mint buttons, the wood board or the lab index bar.
