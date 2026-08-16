import type { Metadata } from "next";
import Footer from "@/components/ui/Footer";
import PageHeader from "@/components/ui/PageHeader";
import {
  CHANGELOG_ENTRIES,
  LATEST_CHANGELOG_ENTRY,
  getChangelogEntryId,
} from "@/lib/changelog";

const siteUrl = "https://thememorychess.com";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "See the latest Memory Chess features, improvements, and fixes in the official changelog.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "Memory Chess Changelog",
    description:
      "See the latest Memory Chess features, improvements, and fixes.",
    url: `${siteUrl}/changelog`,
  },
  twitter: {
    title: "Memory Chess Changelog",
    description:
      "See the latest Memory Chess features, improvements, and fixes.",
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Singapore",
});

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <div className="mb-10 flex justify-center">
          <PageHeader showSoundSettings={false} className="mb-0" />
        </div>

        <header className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-peach-400">
            What is new
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Changelog
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-text-muted sm:text-base">
            See what is new in Memory Chess.
          </p>
        </header>

        <div className="mx-auto max-w-2xl">
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
                    <span className="rounded-full border border-peach-500/25 bg-peach-500/10 px-2.5 py-1 text-xs font-medium text-peach-300">
                      Latest
                    </span>
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
                      <ul className="mt-2.5 space-y-2.5">
                        {group.changes.map((change) => (
                          <li
                            key={change}
                            className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-6 text-text-secondary sm:text-base"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2.5 h-1 w-1 rounded-full bg-peach-400"
                            />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
