import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates, localizedPath } from "@/lib/seo/alternates";
import { Link } from "@/i18n/navigation";
import {
  EditorialHero,
  EditorialPageShell,
} from "@/components/editorial/EditorialPage";
import { EDITORIAL_STYLES } from "@/components/editorial/editorialStyles";
import { useTranslations } from "next-intl";
import {
  CHANGELOG_ENTRIES,
  LATEST_CHANGELOG_ENTRY,
  getChangelogEntryId,
} from "@/lib/changelog";

const siteUrl = "https://thememorychess.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelog.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates("/changelog", locale),
    openGraph: {
      title: t("socialTitle"),
      description: t("socialDescription"),
      url: `${siteUrl}${localizedPath("/changelog", locale)}`,
    },
    twitter: {
      title: t("socialTitle"),
      description: t("socialDescription"),
    },
  };
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Singapore",
});

export default function ChangelogPage() {
  const t = useTranslations("changelog");
  return (
    <EditorialPageShell>
      <EditorialHero
        eyebrow="What is new"
        title="Changelog"
        description="See what is new in Memory Chess."
      />

      <div className={EDITORIAL_STYLES.readingColumn}>
        {CHANGELOG_ENTRIES.map((entry, index) => {
          const isLatest = entry.version === LATEST_CHANGELOG_ENTRY.version;

          return (
            <article
              key={entry.version}
              id={getChangelogEntryId(entry.version)}
              className={`scroll-mt-6 py-9 first:pt-0 ${
                index < CHANGELOG_ENTRIES.length - 1
                  ? "border-b border-white/10"
                  : ""
              }`}
            >
              <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  v{entry.version}
                </h2>
                {isLatest && (
                  <span className="rounded-full border border-peach-500/25 bg-peach-500/10 px-2.5 py-1 text-xs font-medium text-peach-300">{t("latest")}</span>
                )}
                <time
                  dateTime={entry.publishedAt}
                  className="w-full text-sm text-text-muted sm:ml-auto sm:w-auto"
                >
                  {dateFormatter.format(new Date(entry.publishedAt))}
                </time>
              </div>

              <h3 className="text-lg font-medium text-text-primary">
                {entry.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-muted sm:text-base">
                {entry.summary}
              </p>

              <div
                className="mt-6 space-y-6"
                aria-label={`Changes in version ${entry.version}`}
              >
                {entry.groups.map((group) => (
                  <section key={group.title}>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-peach-300">
                      {group.title}
                    </h4>
                    {group.description && (
                      <p className="mt-2.5 text-sm leading-6 text-text-muted sm:text-base">
                        {group.description}
                      </p>
                    )}

                    {group.changes && (
                      <ul className="mt-2.5 space-y-2.5">
                        {group.changes.map((change) => {
                          const changeKey =
                            typeof change === "string"
                              ? change
                              : change.segments
                                  .map((segment) =>
                                    typeof segment === "string"
                                      ? segment
                                      : `${segment.text}:${segment.href}`,
                                  )
                                  .join("");

                          return (
                            <li
                              key={changeKey}
                              className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-6 text-text-secondary sm:text-base"
                            >
                              <span
                                aria-hidden="true"
                                className="mt-2.5 h-1 w-1 rounded-full bg-peach-400"
                              />
                              <span>
                                {typeof change === "string"
                                  ? change
                                  : change.segments.map((segment, index) =>
                                      typeof segment === "string" ? (
                                        <span key={`${changeKey}-${index}`}>
                                          {segment}
                                        </span>
                                      ) : (
                                        <Link
                                          key={`${segment.href}-${index}`}
                                          href={segment.href}
                                          className="font-medium text-peach-300 underline decoration-peach-400/40 underline-offset-4 transition-colors hover:text-peach-200"
                                        >
                                          {segment.text}
                                        </Link>
                                      ),
                                    )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {group.tables?.map((table) => (
                      <div
                        key={table.caption}
                        className="mt-4 overflow-x-auto rounded-lg border border-white/10"
                      >
                        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                          <caption className="border-b border-white/10 bg-white/[0.03] px-4 py-3 text-left font-semibold text-text-primary">
                            {table.caption}
                          </caption>
                          <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-text-muted">
                            <tr>
                              {table.columns.map((column) => (
                                <th
                                  key={column}
                                  scope="col"
                                  className="px-4 py-3 font-medium first:w-1/2"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10 text-text-secondary">
                            {table.rows.map((row) => (
                              <tr key={row.label}>
                                <th
                                  scope="row"
                                  className="px-4 py-3 font-medium text-text-primary"
                                >
                                  {row.label}
                                </th>
                                {row.values.map((value, index) => (
                                  <td
                                    key={`${row.label}-${table.columns[index + 1]}`}
                                    className="px-4 py-3 font-mono tabular-nums"
                                  >
                                    {value}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}

                    {group.note && (
                      <p className="mt-3 text-xs leading-5 text-text-muted sm:text-sm">
                        {group.note}
                      </p>
                    )}
                  </section>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </EditorialPageShell>
  );
}
