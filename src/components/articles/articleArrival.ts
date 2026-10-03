export type ArticleArrival = { readonly slug: string; readonly mayStart: Promise<void> };

let pending: ArticleArrival | null = null;

export function announceArrival(slug: string, mayStart: Promise<void>): void {
  pending = { slug, mayStart };
}

export function peekArrival(slug: string): ArticleArrival | null {
  return pending?.slug === slug ? pending : null;
}

export function clearArrival(): void {
  pending = null;
}
