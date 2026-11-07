---
name: write-changelog
description: "Write or edit a Memory Chess release in src/lib/changelog/index.ts (the /changelog page and the \"Version x is out\" banner). Use whenever adding a new version, cutting a release, writing release notes or \"what's new\", or rewording an existing entry. Every entry gets a player-first rewrite by a subagent before it ships."
---

# Write a changelog entry

The changelog is read by players, not developers. Write it the way Apple writes "What's New": what changed for the person playing, in plain words.

## Steps

1. **Gather what shipped.** List the PRs merged since the last entry (`git log` on main since the previous version's commit). Note only what a player sees or feels while playing or using the site.
2. **Draft the entry** at the top of `CHANGELOG_ENTRIES` in `src/lib/changelog/index.ts`. Use a new `version`, a `title`, a two-sentence `summary`, and 2 to 4 `groups` of 2 to 4 `changes` each. Set `publishedAt` to a time that has already passed, with the `+08:00` offset, so the sitemap never lists a future date.
3. **Bump the version.** Run `npm version <x.y.z> --no-git-tag-version` so `package.json` and `package-lock.json` match the entry. The changelog test requires it.
4. **Have a subagent rewrite it.** Spawn one subagent (use the strongest prose model) that edits only the new entry. Give it these rules and the list of what shipped:
   - Keep only changes a player notices in gameplay or experience. Drop internal, technical and performance-plumbing changes unless the player feels them, such as "loads faster".
   - Avoid build and developer words such as layout, panel, viewport, pinned, readout, prompt, header, preset, component, cache, row counts and thresholds. Describe what the player gets, not how it is built.
   - Lead each point with the benefit. Use short, warm, confident sentences that say "you" and "your". No exclamation marks and no em dashes.
   - Merge overlapping points. Fewer, stronger bullets beat many small ones.
   - Leave out anything that goes out of date, such as "these boards have room right now", and examples taken from test data.
   - Add no claims or numbers that are not in the facts given.
5. **Check the rewrite against what shipped.** Every line must be true for most players. Fix anything it overstates.
6. **Update the test.** Point `src/app/[locale]/changelog/__tests__/page.test.tsx` at the new version, date, `publishedAt` and title. Then run:

   ```bash
   npx jest "src/app/\[locale\]/changelog" --testPathIgnorePatterns=/node_modules/
   ```

   Put the path before `--testPathIgnorePatterns`. Placed after it, Jest reads the path as another ignore pattern and skips those tests.
7. **Look at `/changelog` on the dev server.** The new entry should show as Latest, and the banner should say "Version x is out".
