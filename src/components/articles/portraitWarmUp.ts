import { getImageProps } from "next/image";
import { ARTICLE_PAGE_PORTRAIT_SIZES, portraitImageProps } from "@/components/articles/ArticlePortrait";
import type { PortraitPhoto } from "@/lib/articles/schema";

type SaveDataNavigator = Navigator & { readonly connection?: { readonly saveData?: boolean } };

// A held element keeps its file in the document's image cache, so the article's portrait reuses it with no request.
const warmed = new Map<string, HTMLImageElement>();

export function warmArticlePortrait(photo: PortraitPhoto): void {
  if (warmed.has(photo.src) || (navigator as SaveDataNavigator).connection?.saveData) return;

  const { props } = getImageProps({ ...portraitImageProps(photo, ARTICLE_PAGE_PORTRAIT_SIZES), alt: "" });
  const image = new Image();
  image.sizes = props.sizes ?? "";
  image.srcset = props.srcSet ?? "";
  image.src = props.src;
  warmed.set(photo.src, image);
}
