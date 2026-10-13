/**
 * The shared editorial language of the dark site's pages, such as Terms.
 *
 * Keep this intentionally small: dark canvas, narrow reading measure, peach
 * labels, quiet rules, and generous vertical rhythm. New editorial pages
 * should compose these primitives before introducing one-off card styles.
 */
export const EDITORIAL_STYLES = {
  page: "min-h-screen bg-bg-dark text-text-primary",
  main: "container mx-auto max-w-4xl px-2 sm:px-4 py-8 sm:py-10",
  brand: "mb-10 flex justify-center",
  readingColumn: "mx-auto max-w-2xl",
  hero: "mx-auto mb-12 max-w-2xl text-center sm:mb-16",
  eyebrow: "font-mono text-xs uppercase tracking-[0.22em] text-peach-400",
  pageTitle:
    "text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl",
  heroCopy:
    "mx-auto mt-4 max-w-xl text-base leading-7 text-text-muted sm:text-lg",
  section: "scroll-mt-24 border-t border-white/10 py-10 sm:py-12",
  sectionTitle: "text-2xl font-semibold tracking-tight text-white sm:text-3xl",
  body: "text-base leading-7 text-text-secondary sm:leading-8",
  muted: "text-sm leading-6 text-text-muted sm:text-base",
  link: "font-medium text-peach-300 underline decoration-peach-400/40 underline-offset-4 transition-colors hover:text-peach-200",
} as const;
