export type ArticleArrival = {
  readonly slug: string;
  readonly mayStart: Promise<void>;
  readonly portraitSrc: string | null;
};

let pending: ArticleArrival | null = null;

export function announceArrival(slug: string, mayStart: Promise<void>, portraitSrc: string | null = null): void {
  pending = { slug, mayStart, portraitSrc };
}

export function peekArrival(slug: string): ArticleArrival | null {
  return pending?.slug === slug ? pending : null;
}

export function clearArrival(): void {
  pending = null;
}
