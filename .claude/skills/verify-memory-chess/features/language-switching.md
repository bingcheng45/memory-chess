# Language switching

The app ships 24 locales via next-intl with `localePrefix: "as-needed"` (`src/i18n/routing.ts`): English lives at bare URLs (`/game`) and every other locale is prefixed (`/es/game`). A globe button in the page header opens a menu of native-name language options and switches the current page in place.

## Sub-features

- `lang-switch` changes the UI language from the header menu and rewrites the URL.
- `lang-persist` keeps the chosen locale while navigating within the site.
- `lang-direct` serves any prefixed URL directly, fully translated.
- `lang-bare-english` redirect rule: English URLs never carry an `/en` prefix.

## How to get to it (user POV)

- Choose the globe button in the header on any page (aria-label "Change language, current language English").
- Open a prefixed URL directly, e.g. `/es/game` or `/ja/learn`.

## Driving it with cdp.mjs

Preconditions:

- `doctor.sh 4517` reports OK.
- Start from a bare English page, e.g. `goto(baseUrl + "/leaderboard")`.

- **Open the menu.** `click('[aria-label^="Change language"]')`. A `role="menu"` with `aria-label="Select language"` appears.
- **Pick a language.** `clickText('[role="menu"] *', "Español")`. The URL becomes `/es/leaderboard` (`waitFor` `location.pathname.startsWith("/es/")`) and the page heading changes language. Screenshot before and after.
- **Persistence.** Navigate to another page from the Spanish UI and assert the `/es/` prefix survives.
- **Direct entry.** `goto(baseUrl + "/es/game")`; assert the config screen is Spanish (`document.body.innerText` contains the Spanish start label, from `messages/es.json` under `game.config.start`).
- **Bare English.** `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4517/en/game` does not serve a canonical 200 English page under `/en` (expect a redirect to `/game`); and `/game` itself serves English.

## Gotchas

- All translated strings live in `messages/<locale>.json`; assert against those catalogues, never against a hand-translated guess.
- The menu renders in a portal with a motion animation; wait for the menu element to exist rather than clicking immediately after opening.
- On narrow windows the menu becomes a bottom sheet with the same aria-labels; the recipe above assumes the 1280x900 default.
- English text assertions elsewhere in this map silently break if you leave the session on a non-English locale; switch back or use a fresh Chrome run (each cdp.mjs run is already a fresh profile).
