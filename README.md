# Memory Chess

Memory Chess is a free chess memory game at [thememorychess.com](https://thememorychess.com). You see a chess position for a few seconds, then rebuild it from memory and get a score. This repository is the source of the site.

![Memory Chess: a position on screen with a countdown timer, shown while the player studies it](public/social/v2/memory-chess-1200x675.jpg)

## How a round works

1. Pick how many pieces to show and how many seconds you get, or start a preset. The presets run from 2 pieces for 10 seconds (Easy) to 20 pieces for 5 seconds (Grandmaster).
2. Study the position. The board goes blank when the time runs out or when you press Hide board.
3. Rebuild it by choosing pieces from the palette and placing them on the squares where they stood.
4. Submit to see your accuracy score (pieces placed correctly out of the total), which pieces you got wrong, and how long you took.

Around the round:

- A rating that changes after each round, with a preview of what a win or a miss would do to it. Your rating history and stats are kept on your device.
- A daily board, the same position for every player that day.
- A leaderboard you can submit a score to.
- Learn guides and articles on chess memory and visualization.
- 24 languages.
- Free, with no account and no sign-up.

## For developers

Memory Chess is a Next.js 15 App Router app written in TypeScript. The Node version is not pinned in the repo. The versions below are from `package.json`.

**Stack**

- Next.js 15 (App Router) with React 19
- Tailwind CSS 3, Radix UI primitives, Zustand for game state
- chess.js for position handling
- next-intl for the 24 locales, with message files in `messages/`
- Supabase for the leaderboard and Google Sheets for feedback and contact forms
- Jest and Testing Library for tests
- Hosted on Vercel

**Setup**

```bash
git clone https://github.com/bingcheng45/memory-chess.git
cd memory-chess
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server uses Turbopack.

**Environment**

Put these in `.env.local`. The names come from `src/`.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: the leaderboard. Set `SUPABASE_READ_ONLY=true` to block every write from a local run.
- `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY`: where feedback and contact messages are appended. Feedback goes to a worksheet tab named `Game Feedback` with headers `Submitted At`, `Rating`, `Feedback`, `Accuracy`, `Correct Pieces`, `Piece Count`, `Difficulty`, `Memorization Time`, `Solution Time`, `App Version` in columns A to J.
- `NEXT_PUBLIC_DATABUDDY_CLIENT_ID`: analytics.

**Scripts**

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Validates messages and articles, builds the app, then checks the prerendered guides |
| `npm start` | Serves a production build |
| `npm run lint` | `next lint` |
| `npm run validate` | Checks the message files and the article translations |
| `npm run validate:messages` | Checks every locale file for missing keys and broken placeholders |

Other `npm run` scripts (`lab:*`, `measure:*`, `migrate:rehearse`, `backup:verify`) are measurement and maintenance tools. See `package.json` and `scripts/`.

**Tests and type checks**

```bash
npx jest
npx tsc --noEmit
```

There is no `test` script. Jest runs every `__tests__/**/*.test.ts(x)` file under `src/` and `scripts/`.

**Adding or changing text.** New user-facing strings go into `messages/en.json` and the other 23 locale files. Run `npm run validate:messages` before you open a pull request.

## Contributing

Issues and pull requests are welcome. Run `npm run lint`, `npx tsc --noEmit` and `npx jest` first.

## License

[MIT](LICENSE). Copyright 2025-2026 bing cheng.
