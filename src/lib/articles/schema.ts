export type ArticlePerson = {
  readonly name: string;
  readonly role: string;
};

export type PortraitPhoto = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
};

export type PhotoCredit = {
  readonly author: string;
  readonly license: string;
  readonly licenseUrl: string | null;
  readonly sourceUrl: string;
  readonly changes: string;
};

export type ArticlePhoto = PortraitPhoto & PhotoCredit;

export type ArticleFacts = {
  readonly born: string;
  readonly country: string;
  readonly knownFor: string;
  readonly memoryFeat: string;
  readonly died?: string;
  readonly title?: string;
  readonly peakRating?: string;
  readonly worldChampion?: string;
};

export type FactKey = keyof ArticleFacts;

const FACT_KEYS_IN_DISPLAY_ORDER = [
  "born",
  "died",
  "country",
  "title",
  "peakRating",
  "worldChampion",
  "knownFor",
  "memoryFeat",
] as const satisfies readonly FactKey[];

/** The fact file's rows in display order. A row's label is the message `articles.page.facts.<key>`. */
export const FACT_ROWS: readonly { readonly key: FactKey }[] = FACT_KEYS_IN_DISPLAY_ORDER.map((key) => ({ key }));

export type ArticleDrill = {
  readonly pieceCount: number;
  readonly memorizeTime: number;
  readonly why: string;
};

export type ArticleSection = {
  readonly heading: string;
  readonly paragraphs: readonly string[];
};

export type ArticleSource = {
  readonly title: string;
  readonly url: string;
  readonly note: string;
};

export type Article = {
  readonly slug: string;
  readonly publishedAt: string;
  readonly updatedAt: string;
  readonly title: string;
  readonly description: string;
  readonly person: ArticlePerson;
  readonly photo: ArticlePhoto;
  readonly facts: ArticleFacts;
  readonly drill: ArticleDrill;
  readonly sections: readonly ArticleSection[];
  readonly sources: readonly ArticleSource[];
};

/** The part of an article that changes with language. The rest (`slug`, dates, photo file, drill numbers, links) does not. */
export type ArticleText = {
  readonly title: string;
  readonly description: string;
  readonly person: ArticlePerson;
  readonly photo: {
    readonly alt: string;
    readonly author: string;
    readonly license: string;
    readonly changes: string;
  };
  readonly facts: ArticleFacts;
  readonly drill: { readonly why: string };
  readonly sections: readonly ArticleSection[];
  readonly sources: readonly { readonly title: string; readonly note: string }[];
};

export type ArticleTranslation = {
  /** `sourceHashOf` the English `ArticleText` this translation was made from. */
  readonly sourceHash: string;
  readonly reviewed: boolean;
  /** Key paths the translator kept identical to English on purpose. */
  readonly sameAsEnglish: readonly string[];
  readonly text: ArticleText;
};

/** The list page's title and description in one language. */
export type ArticleListMeta = {
  readonly title: string;
  readonly description: string;
};

export type ArticleSummary = Pick<Article, "slug" | "publishedAt" | "title" | "description" | "person"> & {
  /** `publishedAt` formatted on the server for the page locale, so the browser never formats it with a second ICU. */
  readonly publishedLabel: string;
  readonly photo: PortraitPhoto;
};
