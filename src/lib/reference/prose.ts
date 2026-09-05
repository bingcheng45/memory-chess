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
import es from "./prose/es.json";
import ru from "./prose/ru.json";
import pt_BR from "./prose/pt-BR.json";
import de from "./prose/de.json";
import fr from "./prose/fr.json";
import hi from "./prose/hi.json";
import it from "./prose/it.json";
import zh_CN from "./prose/zh-CN.json";
import tr from "./prose/tr.json";
import sv from "./prose/sv.json";
import nl from "./prose/nl.json";
import pl from "./prose/pl.json";
import id from "./prose/id.json";
import no from "./prose/no.json";
import fi from "./prose/fi.json";
import ro from "./prose/ro.json";
import vi from "./prose/vi.json";
import cs from "./prose/cs.json";
import ja from "./prose/ja.json";
import ko from "./prose/ko.json";
import zh_TW from "./prose/zh-TW.json";
import da from "./prose/da.json";
import hu from "./prose/hu.json";

type PhaseProse = {
  title: string;
  body: string;
};

/**
 * Keys of the contact form's inquiry select, in the order the explainer lists
 * them, mirrored by `contact.types.*` in the message catalogue.
 *
 * The array is the source and the type is derived from it. A hand-written
 * companion array would render a stale subset the day a fifth inquiry type is
 * added, and nothing would fail.
 */
export const CONTACT_INQUIRY_KEYS = [
  "feedback",
  "featureRequest",
  "general",
  "business",
] as const;

export type ContactInquiryKey = (typeof CONTACT_INQUIRY_KEYS)[number];

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
"es": es,
  "ru": ru,
  "pt-BR": pt_BR,
  "de": de,
  "fr": fr,
  "hi": hi,
  "it": it,
  "zh-CN": zh_CN,
  "tr": tr,
  "sv": sv,
  "nl": nl,
  "pl": pl,
  "id": id,
  "no": no,
  "fi": fi,
  "ro": ro,
  "vi": vi,
  "cs": cs,
  "ja": ja,
  "ko": ko,
  "zh-TW": zh_TW,
  "da": da,
  "hu": hu,
};

/**
 * Falls back to English for any locale without a prose file. Every shipped
 * locale has one, and src/lib/reference/__tests__/prose.test.ts fails if that
 * stops being true, so the fallback is a guard rather than a routine path.
 */
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
