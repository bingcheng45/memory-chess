/**
 * Localized prose for the server-rendered reference blocks on /game,
 * /leaderboard, and /contact-us.
 *
 * Deliberately not in messages/*.json: src/i18n/request.ts loads the whole
 * catalogue and the locale layout hands it to NextIntlClientProvider
 * unnarrowed, so every key added there ships in the RSC payload on every
 * route. These files are server-imported by the route layouts alone, the same
 * split src/lib/changelog/localized.ts uses.
 *
 * The Record types over PositionViolation, RankedDifficulty, and
 * AccuracyBandKey are the guard: a locale file missing a rule or band fails
 * `next build`, so no separate validator script exists.
 */
import type { PositionViolation } from "@/lib/utils/memorizationPosition";

import type { AccuracyBandKey, RankedDifficulty } from "./facts";
import en from "./prose/en.json";

type PhaseProse = {
  title: string;
  body: string;
};

/** Keys of the contact form's inquiry select, mirrored by `contact.types.*`
 * in the message catalogue. */
export type ContactInquiryKey =
  | "feedback"
  | "featureRequest"
  | "general"
  | "business";

export type ReferenceProse = {
  game: {
    title: string;
    intro: string;
    phases: {
      heading: string;
      memorize: PhaseProse;
      place: PhaseProse;
      score: PhaseProse;
    };
    presets: {
      heading: string;
      intro: string;
      columns: { preset: string; pieces: string; time: string; trains: string };
      seconds: string;
      trains: Record<RankedDifficulty, string>;
      custom: { title: string; body: string };
    };
    scoring: {
      heading: string;
      match: string;
      accuracy: string;
      wrong: string;
      bandsIntro: string;
      bands: Record<AccuracyBandKey, string>;
      ranking: string;
    };
    positions: {
      heading: string;
      intro: string;
      rules: Record<PositionViolation, string>;
      distribution: string;
      outro: string;
    };
  };
  leaderboard: {
    heading: string;
    body: string;
    order: string;
    columnsNote: string;
    sectionIntro: string;
  };
  contact: {
    heading: string;
    body: string;
    typesIntro: string;
    types: Record<ContactInquiryKey, string>;
    privacyNote: string;
  };
};

const ENGLISH: ReferenceProse = en;

const PROSE_BY_LOCALE: Readonly<Record<string, ReferenceProse>> = {
  en: ENGLISH,
};

/** Falls back to English for any locale without a prose file, so the build
 * stays green while translations land one locale at a time. */
export function getReferenceProse(locale: string): ReferenceProse {
  return PROSE_BY_LOCALE[locale] ?? ENGLISH;
}

export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
