import { approvalHashOf, sourceHashOf, textOf } from "@/lib/articles/articleText";
import { formatArticleDate } from "@/lib/articles/format";
import { LIKED_STORAGE_KEY } from "@/lib/articles/likedStore";
import type { Article, ArticleSummary, ArticleTranslation } from "@/lib/articles/schema";

const SUBJECTS = [
  "Alder", "Birch", "Cedar", "Dogwood", "Elm", "Fir", "Ginkgo",
  "Hazel", "Ivy", "Juniper", "Kapok", "Larch", "Maple",
] as const;

export const FIXTURE_COUNT = SUBJECTS.length;
export const MIN_OWN_SECTIONS = 3;
export const SHARED_PHOTO_AUTHOR = "Fixture Photographer";
export const SHARED_DRILL_SENTENCE = "Five seconds and twelve pieces match the test this fixture describes.";

const SECTIONS_PER_FIXTURE = 4;
const PARAGRAPHS_PER_SECTION = 3;

function sectionsFor(subject: string) {
  return Array.from({ length: SECTIONS_PER_FIXTURE }, (_, section) => ({
    heading: `${subject} heading number ${section + 1}`,
    paragraphs: Array.from(
      { length: PARAGRAPHS_PER_SECTION },
      (_, paragraph) =>
        `${subject} wrote paragraph ${paragraph + 1} for ${subject} section ${section + 1} on ${subject} recall. ` +
        `Only ${subject} tells part ${section + 1} of the ${subject} story in ${subject} passage ${paragraph + 1}.`,
    ),
  }));
}

export function makeArticle(index: number, overrides: Partial<Article> = {}): Article {
  const subject = SUBJECTS[index];
  const day = String(index + 1).padStart(2, "0");

  return {
    slug: `${subject.toLowerCase()}-fixture`,
    publishedAt: `2026-01-${day}T00:00:00.000Z`,
    updatedAt: `2026-01-${day}T00:00:00.000Z`,
    title: `How ${subject} rebuilt a board from memory`,
    description: `${subject} looked at a position for a few seconds and rebuilt it. This fixture says how ${subject} ran the test and what it showed about recall.`,
    person: { name: `${subject} Fixture`, role: `Fixture champion ${index + 1}` },
    photo: {
      src: "/images/articles/magnus-carlsen.jpg",
      width: 840,
      height: 1050,
      alt: `${subject} Fixture at a chess board`,
      author: SHARED_PHOTO_AUTHOR,
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Fixture.jpg",
      changes: "Cropped and resized",
    },
    facts: {
      born: `${index + 1} Jan 1900, ${subject} Town`,
      country: `${subject}land`,
      knownFor: `${subject} openings`,
      memoryFeat: `${subject} blindfold display`,
    },
    drill: {
      pieceCount: 12,
      memorizeTime: 5,
      why: SHARED_DRILL_SENTENCE,
    },
    sections: sectionsFor(subject),
    sources: [
      {
        title: `${subject} source one`,
        url: `https://example.com/${subject.toLowerCase()}/one`,
        note: `Supports: the first ${subject} claim about recall.`,
      },
      {
        title: `${subject} source two`,
        url: `https://example.com/${subject.toLowerCase()}/two`,
        note: `Supports: the second ${subject} claim about recall.`,
      },
      {
        title: `${subject} source three`,
        url: `https://example.com/${subject.toLowerCase()}/three`,
        note: `Supports: the third ${subject} claim about recall.`,
      },
    ],
    ...overrides,
  };
}

export function makeArticles(count: number): Article[] {
  return Array.from({ length: count }, (_, index) => makeArticle(index));
}

export function summaryOf(article: Article): ArticleSummary {
  const { slug, publishedAt, title, description, person } = article;
  const { src, width, height, alt } = article.photo;
  return {
    slug,
    publishedAt,
    publishedLabel: formatArticleDate(publishedAt, "en"),
    title,
    description,
    person,
    photo: { src, width, height, alt },
  };
}

export function markEveryString<T>(value: T, marker: string): T {
  if (typeof value === "string") return `${marker}${value}` as T;
  if (Array.isArray(value)) return value.map((item) => markEveryString(item, marker)) as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, markEveryString(item, marker)]),
    ) as T;
  }
  return value;
}

export function reviewedTranslationOf(english: Article, marker: string, locale: string): ArticleTranslation {
  const englishText = textOf(english);
  const unit = { sourceHash: sourceHashOf(englishText), sameAsEnglish: [], text: markEveryString(englishText, marker) };
  return { ...unit, approvedHash: approvalHashOf({ ...unit, locale, name: english.slug }) };
}

export function storeLikes(likes: Record<string, number>): void {
  window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify({ version: 2, likes }));
}
