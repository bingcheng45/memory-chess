import type { Article, ArticleDrill, PortraitPhoto } from "./schema";

export type TileArticle = Pick<Article, "slug" | "title" | "person" | "drill"> & {
  readonly photo: PortraitPhoto;
};

export type RoundSize = Pick<ArticleDrill, "pieceCount" | "memorizeTime">;

export type ArticleTileState =
  | { readonly kind: "hidden" }
  | { readonly kind: "showing"; readonly article: TileArticle };

export type RandomSource = () => number;

export const HIDDEN_TILE: ArticleTileState = { kind: "hidden" };

/**
 * Every game page carries the tile's articles, and one article is published
 * each week. Twenty of them would add about 21 kB to the Hindi page before
 * compression, so a page carries only the newest.
 */
export const MAX_TILE_ARTICLES = 12;

export function tileArticleOf(article: Article): TileArticle {
  const { slug, title, person, drill } = article;
  const { src, width, height, alt } = article.photo;
  return { slug, title, person, photo: { src, width, height, alt }, drill };
}

export function chooseTile(
  articles: readonly TileArticle[],
  isOpened: (slug: string) => boolean,
  random: RandomSource,
): ArticleTileState {
  const unopened = articles.filter((article) => !isOpened(article.slug));
  const pool = unopened.length > 0 ? unopened : articles;
  if (pool.length === 0) return HIDDEN_TILE;

  const index = Math.min(Math.floor(random() * pool.length), pool.length - 1);
  return { kind: "showing", article: pool[index] };
}
