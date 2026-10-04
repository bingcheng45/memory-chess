import type { CSSProperties } from "react";
import Image from "next/image";
import type { PortraitPhoto } from "@/lib/articles/schema";

type ArticlePortraitProps = {
  photo: PortraitPhoto;
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
};

export const ARTICLE_PAGE_PORTRAIT_SIZES = "(max-width: 820px) 190px, 280px";

export function portraitImageProps(photo: PortraitPhoto, sizes: string) {
  return { src: photo.src, width: photo.width, height: photo.height, sizes };
}

export default function ArticlePortrait({
  photo,
  sizes,
  priority = false,
  className = "",
  style,
}: ArticlePortraitProps) {
  return (
    <Image
      {...portraitImageProps(photo, sizes)}
      alt={photo.alt}
      priority={priority}
      data-flight="portrait"
      className={`aspect-[4/5] h-auto w-full bg-bg-light object-cover ${className}`}
      style={style}
    />
  );
}
