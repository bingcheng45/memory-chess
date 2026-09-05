# Memory Chess verification map

This directory is the maintained source for verifying the user-facing behavior of Memory Chess. Read this index before driving the app, then use the matching feature file as the recipe. A proof that drives one convenient entry point is incomplete when the file lists others.

## Baseline preconditions

- Launch, doctor, selector preference, evidence, the crawler word floor, and cleanup are defined once in [SKILL.md](../SKILL.md); run its Launch and Doctor steps before any recipe here. Never port 3000.
- No env vars are required. Without `.env.local`, the leaderboard and games-played counter show their degraded states and the contact form's POST fails; the feature files say what to assert in each mode.

## Driving conventions

- Drive the bare English routes (`/game`, not `/en/game`) unless the feature under test is localization.
- Assert an observable end state plus one independent second read (persisted localStorage, a fresh HTTP response, a re-navigation), never a transient flash.

## Feature entry contract

Each feature file has an H1, one paragraph on the user-visible behavior, then exactly four H2s in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with cdp.mjs`, `Gotchas`. The driving section starts with `Preconditions:` and pairs each user action with an exact command or expression and its observable result.

## Features

- [Game round](./game-round.md) covers a full round end to end: configure, memorize, place, submit, result, and the persisted history.
- [Leaderboard](./leaderboard.md) covers the rankings tabs, the degraded no-credentials state, and the crawler word floor.
- [Learn hub and articles](./learn.md) covers the `/learn` index and the 16 statically generated articles.
- [Language switching](./language-switching.md) covers the switcher, prefixed locale URLs, and the bare-English rule.
- [Contact form](./contact-form.md) covers validation, submission, and the Google Sheets boundary.

Not yet mapped: the home page `/`, `/settings`, `/changelog`, `/privacy`. A new route under `src/app/[locale]/` needs an entry here before it counts as verifiable.
