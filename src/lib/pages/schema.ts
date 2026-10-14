/**
 * The text of a trust page, the unit a translator translates. Every string is an ICU message: a link or a bold run
 * is a rich tag such as `<privacy>privacy policy</privacy>`, a value the page fills in is a placeholder such as
 * `{email}`. Where a tag points and what a placeholder holds live in code (`src/lib/pages/registry.ts`), outside the
 * hashed text, so a translation cannot change a URL or an address.
 */
export type Block = { readonly p: string } | { readonly ul: readonly string[] };

export interface PageSection {
  readonly title: string;
  readonly blocks: readonly Block[];
}

export interface PageText {
  readonly meta: {
    readonly title: string;
    readonly description: string;
    readonly socialTitle: string;
    readonly socialDescription: string;
  };
  readonly kicker: string;
  readonly title: string;
  readonly lede: string;
  /** Keyed by the section's anchor id, which is never translated. */
  readonly sections: Readonly<Record<string, PageSection>>;
}

/** The strings a reading page draws around its text. `lastUpdated` holds the date in a `<time>` tag. */
export interface ReadingChrome {
  readonly contents: string;
  readonly onThisPage: string;
  readonly lastUpdated: string;
  /** What a translated page says it is: `legal` on the privacy policy and the terms, `general` on any other page. */
  readonly note: { readonly general: string; readonly legal: string; readonly readInEnglish: string };
}
