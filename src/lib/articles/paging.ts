export const ARTICLES_PER_PAGE = 10;

export type Page<T> = {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageCount: number;
  readonly firstPosition: number;
  readonly lastPosition: number;
};

export function paginate<T>(
  items: readonly T[],
  page: number,
  perPage: number = ARTICLES_PER_PAGE,
): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const requested = Number.isNaN(page) ? 1 : Math.floor(page);
  const current = Math.min(pageCount, Math.max(1, requested));
  const start = (current - 1) * perPage;
  const shown = items.slice(start, start + perPage);

  return {
    items: shown,
    page: current,
    pageCount,
    firstPosition: shown.length === 0 ? 0 : start + 1,
    lastPosition: shown.length === 0 ? 0 : start + shown.length,
  };
}
