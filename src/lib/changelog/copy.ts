/**
 * Page chrome for /changelog, which is English-only. Only the banner that
 * links to it appears on translated pages, so only its two strings
 * (changelog.bannerLabel and changelog.bannerCta) stay in the catalogues.
 */
export const CHANGELOG_PAGE_COPY = {
  meta: {
    title: "Changelog",
    description: "See the latest Memory Chess features, improvements, and fixes in the official changelog.",
    socialTitle: "Memory Chess Changelog",
    socialDescription: "See the latest Memory Chess features, improvements, and fixes.",
  },
  title: "Changelog",
  latest: "Latest",
  eyebrow: "What is new",
  changesIn: (version: string) => `Changes in version ${version}`,
};
