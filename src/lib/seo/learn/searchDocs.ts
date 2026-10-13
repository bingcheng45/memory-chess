import { ARTICLES } from "@/lib/articles";
import { articlePath } from "@/lib/articles/paths";
import { EN_LEARN_PAGES, type LearnPage } from ".";
import { guidePath } from "./links";
import type { SearchDoc } from "./search";
import { blockText } from "./text";

function guideDoc(page: LearnPage, withBody: boolean): SearchDoc {
  const { meta, intro } = page;
  const questions = [...meta.questions, ...page.faq.map((item) => item.question)];
  const body = withBody
    ? page.sections
        .flatMap((section) => section.blocks)
        .filter((block) => block.kind === "prose" || block.kind === "list" || block.kind === "drills")
        .flatMap(blockText)
        .join(" ")
    : "";

  return {
    kind: "guide",
    slug: meta.slug,
    url: guidePath(meta.slug),
    title: meta.title,
    group: page.group.label,
    questions,
    fields: {
      questions: questions.join(" "),
      title: `${meta.title} ${meta.h1}`,
      keywords: [meta.keywords.primary, ...meta.keywords.secondary].join(" "),
      headings: page.sections.map((section) => section.heading).join(" "),
      description: `${meta.description} ${intro.quickAnswer}`,
      body,
    },
  };
}

const articleDocs = (): SearchDoc[] =>
  ARTICLES.map((article) => ({
    kind: "article",
    slug: article.slug,
    url: articlePath(article.slug),
    title: article.title,
    group: null,
    questions: [],
    fields: {
      questions: "",
      title: `${article.title} ${article.person.name}`,
      keywords: article.person.role,
      headings: article.sections.map((section) => section.heading).join(" "),
      description: article.description,
      body: "",
    },
  }));

/** The browser gets the index without guide prose, about a quarter of the size; the server route ranks with the prose too. */
export function learnSearchDocs({ withBody }: { readonly withBody: boolean }): SearchDoc[] {
  return [...EN_LEARN_PAGES.map((page) => guideDoc(page, withBody)), ...articleDocs()];
}
