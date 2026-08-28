/**
 * The shared editorial language used by Changelog and Learn.
 *
 * Keep this intentionally small: dark canvas, narrow reading measure, peach
 * labels, quiet rules, and generous vertical rhythm. New editorial pages
 * should compose these primitives before introducing one-off card styles.
 */
export const EDITORIAL_STYLES = {
  page: "min-h-screen bg-bg-dark text-text-primary",
  main: "container mx-auto max-w-4xl px-1 sm:px-4 py-8 sm:py-10",
  brand: "mb-10 flex justify-center",
  readingColumn: "mx-auto max-w-2xl",
  wideColumn: "mx-auto max-w-3xl",
  hero: "mx-auto mb-12 max-w-2xl text-center sm:mb-16",
  eyebrow: "font-mono text-xs uppercase tracking-[0.22em] text-peach-400",
  pageTitle:
    "text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl",
  heroCopy:
    "mx-auto mt-4 max-w-xl text-base leading-7 text-text-muted sm:text-lg",
  section: "scroll-mt-24 border-t border-white/10 py-10 sm:py-12",
  sectionTitle: "text-2xl font-semibold tracking-tight text-white sm:text-3xl",
  subsectionTitle:
    "text-sm font-semibold uppercase tracking-[0.12em] text-peach-300",
  body: "text-base leading-7 text-text-secondary sm:leading-8",
  muted: "text-sm leading-6 text-text-muted sm:text-base",
  link: "font-medium text-peach-300 underline decoration-peach-400/40 underline-offset-4 transition-colors hover:text-peach-200",
  pill: "inline-flex rounded-full border border-peach-500/25 bg-peach-500/10 px-2.5 py-1 text-xs font-medium text-peach-300",
  primaryAction:
    "inline-flex min-h-11 items-center justify-center rounded-full bg-peach-500 px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-peach-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300",
  secondaryAction:
    "inline-flex min-h-11 items-center justify-center rounded-full border border-peach-500/30 bg-peach-500/10 px-5 py-2.5 text-sm font-semibold text-peach-300 transition-colors hover:border-peach-400/50 hover:bg-peach-500/15 hover:text-peach-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300",
  callout: "border-l-2 border-peach-400 bg-white/[0.025] px-5 py-4 sm:px-6",
  tableFrame: "overflow-x-auto rounded-lg border border-white/10",
} as const;
