import "server-only";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { translationProblems } from "@/lib/articles/articleText";
import { findLearnPage, toPage, type LearnPage } from ".";
import { LEARN_GUIDE_COPY, guideCopyOf, type GuideCopy } from "./copy";
import GUIDE_CHROME, { type GuideChrome } from "./guideChrome";
import { textOf, withText, type GuideText } from "./guideText";
import { guideLocalesOf } from "./links";
import { approvalNameOf, type GuideUnit } from "./translatedGuides";

export type GuideSource = (locale: Locale, unit: GuideUnit) => Promise<unknown>;

const readTranslationFile: GuideSource = async (locale, unit) =>
  (await import(`./translations/${locale}/${unit}.json`)).default;

const readStatLabels = async (locale: Locale): Promise<Record<string, string>> =>
  (await import(`../../../../messages/${locale}.json`)).default.dashboard.label;

export type LocalizedGuide = { readonly page: LearnPage; readonly copy: GuideCopy; readonly locale: Locale };

async function translated<T>(source: GuideSource, locale: Locale, unit: GuideUnit, english: T): Promise<T> {
  let file: unknown;
  try {
    file = await source(locale, unit);
  } catch (cause) {
    throw new Error(`Guide translation ${locale}/${unit} cannot be read`, { cause });
  }
  const problems = translationProblems(file, english, { locale, slug: approvalNameOf(unit) });
  if (problems.length > 0) {
    throw new Error(`Guide translation ${locale}/${unit} cannot be published: ${problems.join("; ")}`);
  }
  return (file as { text: T }).text;
}

export async function loadGuide(slug: string, locale: string, source: GuideSource = readTranslationFile): Promise<LocalizedGuide | undefined> {
  const english = findLearnPage(slug);
  if (!english || !guideLocalesOf(slug).includes(locale)) return undefined;
  if (locale === DEFAULT_LOCALE) return { page: english, copy: LEARN_GUIDE_COPY, locale };

  const served = locale as Locale;
  const [text, chrome, statLabels] = await Promise.all([
    translated<GuideText>(source, served, slug as GuideUnit, textOf(english)),
    translated<GuideChrome>(source, served, "chrome", GUIDE_CHROME),
    readStatLabels(served),
  ]);
  return { page: toPage(withText(english, text), chrome), copy: guideCopyOf(served, chrome, statLabels), locale: served };
}
