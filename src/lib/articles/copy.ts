import type { SortKey } from "@/lib/articles/sorting";

export const ARTICLE_LIST_COPY = {
  meta: {
    title: "Articles on chess players and their memory",
    description:
      "Profiles of chess players and memory researchers. Each one gives the documented feat, the research that explains it, and a drill to try.",
  },
  heading: "Articles",
  sub: "Chess players and memory researchers, one profile at a time.",
  about: {
    heading: "How these articles are made",
    paragraphs: [
      "Each article follows one chess player or researcher and one question about their memory. The subject may be a player known for a feat of recall, or a researcher who measured what players remember after a few seconds.",
      "Every article has the same parts. A portrait comes with its photographer and licence. A fact file gives the dates, the titles and the memory feat the person is known for. The story sets that feat beside the research that explains it. A source list shows where each claim comes from. A drill at the end opens a round of Memory Chess with the piece count and viewing time the story suggests.",
      "The articles are researched and drafted with AI assistance from published sources such as interviews, tournament reports, books and research papers. A separate check then compares every date, number and quotation with those sources before anything is published. Where sources disagree, the article says who reported what. An anecdote that sources report only as a story is told as a story.",
    ],
    corrections: {
      text: "If something here is wrong,",
      linkLabel: "send a correction",
      href: "/contact-us",
    },
  },
} as const;

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatArticleDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

export const ARTICLE_PAGER_COPY = {
  label: "Pages",
  previous: "Previous page",
  next: "Next page",
  page: (page: number) => `Page ${page}`,
  showing: (first: number, last: number, total: number) => `Showing ${first} to ${last} of ${total}`,
} as const;

const COUNT_FORMAT = new Intl.NumberFormat("en-US");

export function formatCount(count: number): string {
  return COUNT_FORMAT.format(count);
}

export const ARTICLE_STATS_COPY = {
  views: (count: number) => `${formatCount(count)} ${count === 1 ? "view" : "views"}`,
  likes: (count: number) => `${formatCount(count)} ${count === 1 ? "like" : "likes"}`,
  likeButton: "Like this article",
  likeFailed: "That did not save. Try again.",
  sortLabel: "Sort",
  sortGroup: "Sort articles",
  sortOptions: {
    newest: "Newest",
    views: "Most viewed",
    likes: "Most liked",
  } satisfies Record<SortKey, string>,
} as const;

export const ARTICLE_COPY = {
  backToList: "All articles",
  factFile: "Fact file",
  byline: "By",
  authorshipNote:
    "Researched and drafted with AI assistance from the sources listed below. Every fact was checked against those sources before publication.",
  photoCredit: "Photo",
  photoSource: "Wikimedia Commons",
  drillHeading: "Your turn",
  drillAction: (pieceCount: number, memorizeTime: number) =>
    `Play ${pieceCount} pieces, ${memorizeTime} seconds`,
  sources: "Sources",
  nextArticle: "Next article",
} as const;
