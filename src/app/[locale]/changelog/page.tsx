import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { socialMetadata } from "@/lib/seo/brand";
import { Link } from "@/i18n/navigation";
import { LabReadingPage } from "@/components/lab-paper/LabReadingPage";
import type { PageSections } from "@/components/lab-paper/LabPaperHeader";
import {
  CHANGELOG_ENTRIES,
  LATEST_CHANGELOG_ENTRY,
  getChangelogEntryId,
  type ChangelogChange,
  type ChangelogGroup,
  type ChangelogTable,
} from "@/lib/changelog";
import { CHANGELOG_PAGE_COPY } from "@/lib/changelog/copy";

const siteUrl = "https://thememorychess.com";

export function generateMetadata(): Metadata {
  const meta = CHANGELOG_PAGE_COPY.meta;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: "/changelog",
    },
    ...socialMetadata({
      title: meta.socialTitle,
      description: meta.socialDescription,
      url: `${siteUrl}/changelog`,
    }),
  };
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Singapore",
});

const formatDate = (publishedAt: string) => dateFormatter.format(new Date(publishedAt));

const RELEASE_SECTIONS: PageSections = {
  trigger: CHANGELOG_PAGE_COPY.releases,
  heading: CHANGELOG_PAGE_COPY.releases,
  links: CHANGELOG_ENTRIES.map((entry) => ({
    href: `#${getChangelogEntryId(entry.version)}`,
    label: `v${entry.version}`,
    hint: formatDate(entry.publishedAt),
  })),
};

function changeKey(change: ChangelogChange): string {
  if (typeof change === "string") return change;
  return change.segments
    .map((segment) => (typeof segment === "string" ? segment : `${segment.text}:${segment.href}`))
    .join("");
}

function ChangeText({ change }: { change: ChangelogChange }) {
  if (typeof change === "string") return change;
  return change.segments.map((segment, index) =>
    typeof segment === "string" ? (
      <span key={index}>{segment}</span>
    ) : (
      <Link key={index} href={segment.href}>
        {segment.text}
      </Link>
    ),
  );
}

function ChangeTable({ table }: { table: ChangelogTable }) {
  return (
    <div className="lab-change-table" role="region" aria-label={table.caption} tabIndex={0}>
      <table>
        <caption>{table.caption}</caption>
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.values.map((value, index) => (
                <td key={`${row.label}-${table.columns[index + 1]}`}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChangeGroup({ group }: { group: ChangelogGroup }) {
  return (
    <section className="lab-change-group">
      <h4>{group.title}</h4>
      {group.description && <p>{group.description}</p>}
      {group.changes && (
        <ul className="lab-changes">
          {group.changes.map((change) => (
            <li key={changeKey(change)}>
              <ChangeText change={change} />
            </li>
          ))}
        </ul>
      )}
      {group.tables?.map((table) => <ChangeTable key={table.caption} table={table} />)}
      {group.note && <p className="lab-change-note">{group.note}</p>}
    </section>
  );
}

export default function ChangelogPage() {
  // English-only route: the bare URL is the only one served, as English.
  setRequestLocale(DEFAULT_LOCALE);
  return (
    <LabReadingPage
      kicker={CHANGELOG_PAGE_COPY.eyebrow}
      title={CHANGELOG_PAGE_COPY.title}
      lede={CHANGELOG_PAGE_COPY.meta.socialDescription}
      sections={RELEASE_SECTIONS}
    >
      {CHANGELOG_ENTRIES.map((entry) => (
        <article key={entry.version} id={getChangelogEntryId(entry.version)} className="lab-release">
          <div className="lab-release-meta">
            <h2>v{entry.version}</h2>
            <time dateTime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time>
            {entry.version === LATEST_CHANGELOG_ENTRY.version && (
              <span className="lab-tag lab-tag-accent">{CHANGELOG_PAGE_COPY.latest}</span>
            )}
          </div>
          <h3 className="lab-release-title">{entry.title}</h3>
          <p className="lab-release-summary">{entry.summary}</p>
          <div aria-label={CHANGELOG_PAGE_COPY.changesIn(entry.version)} role="group">
            {entry.groups.map((group) => (
              <ChangeGroup key={group.title} group={group} />
            ))}
          </div>
        </article>
      ))}
    </LabReadingPage>
  );
}
