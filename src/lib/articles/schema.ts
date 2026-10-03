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

const FACT_LABELS_IN_DISPLAY_ORDER = {
  born: "Born",
  died: "Died",
  country: "Country",
  title: "Title",
  peakRating: "Peak rating",
  worldChampion: "World Champion",
  knownFor: "Known for",
  memoryFeat: "Memory feat",
} satisfies Record<FactKey, string>;

export const FACT_ROWS: readonly { readonly key: FactKey; readonly label: string }[] = (
  Object.keys(FACT_LABELS_IN_DISPLAY_ORDER) as FactKey[]
).map((key) => ({ key, label: FACT_LABELS_IN_DISPLAY_ORDER[key] }));

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

export type ArticleSummary = Pick<Article, "slug" | "publishedAt" | "title" | "description" | "person"> & {
  readonly photo: PortraitPhoto;
};
