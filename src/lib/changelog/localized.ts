/**
 * Translated release notes, overlaid on the English entries.
 *
 * Same shape as the Learn prose overlay in src/lib/seo/learn: the per-locale
 * files carry prose and nothing else, and every structural field -- version,
 * publishedAt, and a link's href -- is read from the English entry. A
 * translated href is a dead link and a translated version number is a broken
 * anchor, so translators never get the chance to write either.
 *
 * The overlay is positional. Entry i of a locale becomes entry i of the
 * English history, group j becomes group j. `version` is carried in the prose
 * files purely as an alignment key: nothing renders it, but the guard test in
 * src/lib/__tests__/changelogLocales.test.ts fails if it does not match, which
 * is what stops one release's text from being grafted onto another's date.
 *
 * Deliberately a separate module from ./index. ChangelogBanner is a client
 * component that imports the entries for their version string alone, and it
 * renders in the root layout on every page -- pulling twenty-three catalogues
 * of release notes into that bundle would cost every visitor on every route.
 */

import {
  CHANGELOG_ENTRIES,
  type ChangelogChange,
  type ChangelogEntry,
  type ChangelogGroup,
  type ChangelogTable,
} from "./index";

import cs from "./prose/cs.json";
import da from "./prose/da.json";
import de from "./prose/de.json";
import es from "./prose/es.json";
import fi from "./prose/fi.json";
import fr from "./prose/fr.json";
import hi from "./prose/hi.json";
import hu from "./prose/hu.json";
import id from "./prose/id.json";
import it from "./prose/it.json";
import ja from "./prose/ja.json";
import ko from "./prose/ko.json";
import nl from "./prose/nl.json";
import no from "./prose/no.json";
import pl from "./prose/pl.json";
import ptBR from "./prose/pt-BR.json";
import ro from "./prose/ro.json";
import ru from "./prose/ru.json";
import sv from "./prose/sv.json";
import tr from "./prose/tr.json";
import vi from "./prose/vi.json";
import zhCN from "./prose/zh-CN.json";
import zhTW from "./prose/zh-TW.json";

/** A prose file's entry: the translatable half of a ChangelogEntry. */
export type ChangelogEntryProse = {
  /** Alignment key, never rendered. */
  version: string;
  title: string;
  summary: string;
  groups: readonly ChangelogGroupProse[];
};

export type ChangelogGroupProse = {
  title: string;
  description?: string;
  changes?: readonly ChangelogChangeProse[];
  tables?: readonly ChangelogTableProse[];
  note?: string;
};

export type ChangelogChangeProse =
  | string
  | { segments: readonly (string | { text: string })[] };

export type ChangelogTableProse = {
  caption: string;
  columns: readonly string[];
  rows: readonly { label: string; values: readonly string[] }[];
};

/**
 * Static rather than a dynamic `import()` so the changelog page can stay a
 * synchronous component. The files are small and server-only; the Learn
 * overlay loads on demand instead because its articles are two orders of
 * magnitude larger.
 */
const PROSE_BY_LOCALE = {
  cs,
  da,
  de,
  es,
  fi,
  fr,
  hi,
  hu,
  id,
  it,
  ja,
  ko,
  nl,
  no,
  pl,
  "pt-BR": ptBR,
  ro,
  ru,
  sv,
  tr,
  vi,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
} as unknown as Record<string, readonly ChangelogEntryProse[]>;

class MisalignedProseError extends Error {}

function requiredProse<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new MisalignedProseError(`changelog prose is missing ${what}`);
  }

  return value;
}

function mergeChange(
  change: ChangelogChange,
  prose: ChangelogChangeProse,
): ChangelogChange {
  if (typeof change === "string") {
    if (typeof prose !== "string") {
      throw new MisalignedProseError("expected a plain change");
    }

    return prose;
  }

  if (typeof prose === "string") {
    throw new MisalignedProseError("expected a segmented change");
  }

  return {
    segments: change.segments.map((segment, index) => {
      const translated = requiredProse(
        prose.segments[index],
        `segment ${index}`,
      );

      if (typeof segment === "string") {
        if (typeof translated !== "string") {
          throw new MisalignedProseError("expected a text segment");
        }

        return translated;
      }

      if (typeof translated === "string") {
        throw new MisalignedProseError("expected a link segment");
      }

      // href stays English: it is a route, not copy.
      return { ...segment, text: translated.text };
    }),
  };
}

function mergeTable(
  table: ChangelogTable,
  prose: ChangelogTableProse,
): ChangelogTable {
  if (
    prose.columns.length !== table.columns.length ||
    prose.rows.length !== table.rows.length
  ) {
    throw new MisalignedProseError(`table "${table.caption}" has a new shape`);
  }

  return {
    caption: prose.caption,
    columns: prose.columns,
    rows: table.rows.map((row, index) => {
      const translated = prose.rows[index];

      if (translated.values.length !== row.values.length) {
        throw new MisalignedProseError(`row "${row.label}" has a new shape`);
      }

      return { label: translated.label, values: translated.values };
    }),
  };
}

function mergeGroup(
  group: ChangelogGroup,
  prose: ChangelogGroupProse,
): ChangelogGroup {
  return {
    title: prose.title,
    ...(group.description === undefined
      ? {}
      : {
          description: requiredProse(prose.description, "a group description"),
        }),
    ...(group.changes === undefined
      ? {}
      : {
          changes: group.changes.map((change, index) =>
            mergeChange(
              change,
              requiredProse(prose.changes?.[index], `change ${index}`),
            ),
          ),
        }),
    ...(group.tables === undefined
      ? {}
      : {
          tables: group.tables.map((table, index) =>
            mergeTable(
              table,
              requiredProse(prose.tables?.[index], `table ${index}`),
            ),
          ),
        }),
    ...(group.note === undefined
      ? {}
      : { note: requiredProse(prose.note, "a group note") }),
  };
}

function mergeEntry(
  entry: ChangelogEntry,
  prose: ChangelogEntryProse,
): ChangelogEntry {
  if (prose.version !== entry.version) {
    throw new MisalignedProseError(
      `prose for v${prose.version} sits where v${entry.version} belongs`,
    );
  }

  if (prose.groups.length !== entry.groups.length) {
    throw new MisalignedProseError(`v${entry.version} has a different shape`);
  }

  return {
    // version and publishedAt are English-sourced by construction.
    version: entry.version,
    publishedAt: entry.publishedAt,
    title: prose.title,
    summary: prose.summary,
    groups: entry.groups.map((group, index) =>
      mergeGroup(group, prose.groups[index]),
    ),
  };
}

/** The release history in `locale`, falling back to English. */
export function getLocalizedChangelogEntries(
  locale: string,
): readonly ChangelogEntry[] {
  const prose = PROSE_BY_LOCALE[locale];

  if (!prose || prose.length !== CHANGELOG_ENTRIES.length) {
    return CHANGELOG_ENTRIES;
  }

  try {
    return CHANGELOG_ENTRIES.map((entry, index) =>
      mergeEntry(entry, prose[index]),
    );
  } catch {
    // A prose file that has drifted from the English entries is a build
    // mistake, not a reader's problem. The guard test fails loudly on it;
    // here, English is a better answer than a broken page.
    return CHANGELOG_ENTRIES;
  }
}
