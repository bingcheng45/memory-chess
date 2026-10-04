"use client";

import { useState, type CSSProperties } from "react";
import ArticlePortrait, { ARTICLE_PAGE_PORTRAIT_SIZES } from "@/components/articles/ArticlePortrait";
import { peekArrival } from "@/components/articles/articleArrival";
import type { PortraitPhoto } from "@/lib/articles/schema";

type ArrivingPortraitProps = { slug: string; photo: PortraitPhoto };

const OPTIMIZER_PATH = "/_next/image";
const PHOTO_FOLDER = "/images/articles/";
const ENDS_A_CSS_STRING = /["\\]/g;

function portraitFileOf(portraitSrc: string): URL | null {
  try {
    const file = new URL(portraitSrc);
    const isPortrait = file.pathname === OPTIMIZER_PATH || file.pathname.startsWith(PHOTO_FOLDER);
    return file.origin === window.location.origin && isPortrait ? file : null;
  } catch {
    return null;
  }
}

function placeholderOf(portraitSrc: string | null | undefined): CSSProperties | undefined {
  const file = portraitSrc ? portraitFileOf(portraitSrc) : null;
  if (file === null) return undefined;

  return {
    backgroundImage: `url("${file.href.replace(ENDS_A_CSS_STRING, "\\$&")}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export default function ArrivingPortrait({ slug, photo }: ArrivingPortraitProps) {
  const [placeholder] = useState(() => placeholderOf(peekArrival(slug)?.portraitSrc));

  return (
    <ArticlePortrait
      photo={photo}
      sizes={ARTICLE_PAGE_PORTRAIT_SIZES}
      priority
      className="rounded-[18px]"
      style={placeholder}
    />
  );
}
