#!/usr/bin/env node
/**
 * Derives the translatable prose skeleton from the English changelog.
 *
 * Structural fields are intentionally excluded so a translator never sees
 * them and cannot break them: `publishedAt` is a timestamp, and a link's
 * `href` is a route -- a translated href is a dead link. `version` is emitted
 * because the overlay is positional and the guard test uses it to prove entry
 * i of a locale really is entry i of the English set; it is never rendered
 * from a prose file.
 *
 * Usage: node scripts/extract-changelog-prose.mjs > /tmp/changelog.en.json
 */
import { CHANGELOG_ENTRIES } from "../src/lib/changelog/index.ts";

const proseChange = (change) =>
  typeof change === "string"
    ? change
    : {
        segments: change.segments.map((segment) =>
          typeof segment === "string" ? segment : { text: segment.text },
        ),
      };

const prose = CHANGELOG_ENTRIES.map((entry) => ({
  version: entry.version, // present for alignment only; never translated
  title: entry.title,
  summary: entry.summary,
  groups: entry.groups.map((group) => ({
    title: group.title,
    ...(group.description === undefined
      ? {}
      : { description: group.description }),
    ...(group.changes === undefined
      ? {}
      : { changes: group.changes.map(proseChange) }),
    ...(group.tables === undefined
      ? {}
      : {
          tables: group.tables.map((table) => ({
            caption: table.caption,
            columns: table.columns,
            rows: table.rows.map((row) => ({
              label: row.label,
              values: row.values,
            })),
          })),
        }),
    ...(group.note === undefined ? {} : { note: group.note }),
  })),
}));

process.stdout.write(JSON.stringify(prose, null, 2) + "\n");
