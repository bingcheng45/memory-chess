import Image from "next/image";
import type { PortraitPhoto } from "@/lib/articles/schema";

type ArticlePortraitProps = {
  photo: PortraitPhoto;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export default function ArticlePortrait({
  photo,
  sizes,
  priority = false,
  className = "",
}: ArticlePortraitProps) {
  return (
    <Image
      src={photo.src}
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      sizes={sizes}
      priority={priority}
      data-flight="portrait"
      className={`aspect-[4/5] h-auto w-full bg-bg-light object-cover ${className}`}
    />
  );
}
