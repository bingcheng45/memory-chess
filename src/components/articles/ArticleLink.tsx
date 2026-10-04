"use client";

import type { ComponentProps, MouseEvent } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { announceArrival } from "@/components/articles/articleArrival";
import { fly } from "@/components/articles/articleFlight";
import { warmArticlePortrait } from "@/components/articles/portraitWarmUp";
import { ARTICLES_PATH, articlePath } from "@/lib/articles/paths";
import type { PortraitPhoto } from "@/lib/articles/schema";

type LinkProps = Omit<
  ComponentProps<typeof Link>,
  "href" | "replace" | "scroll" | "locale" | "target" | "download" | "onPointerEnter" | "onFocus" | "onTouchStart"
>;
type ArticleLinkProps = LinkProps &
  (
    | { article: string; portrait: PortraitPhoto; backFrom?: never }
    | { backFrom: string; article?: never; portrait?: never }
  );

const PRIMARY_BUTTON = 0;
const SHOWN_PORTRAIT = 'img[data-flight="portrait"]';

function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    event.button === PRIMARY_BUTTON && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
  );
}

function shownPortraitSrc(link: HTMLAnchorElement): string | null {
  return link.querySelector<HTMLImageElement>(SHOWN_PORTRAIT)?.currentSrc || null;
}

export default function ArticleLink({ article, portrait, backFrom, onClick, ...anchorProps }: ArticleLinkProps) {
  const router = useRouter();
  const href = article === undefined ? ARTICLES_PATH : articlePath(article);
  const warm = portrait === undefined ? undefined : () => warmArticlePortrait(portrait);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || !isPlainLeftClick(event)) return;

    event.preventDefault();
    const portraitSrc = shownPortraitSrc(event.currentTarget);
    const landed = fly(() => router.push(href), article ?? backFrom);
    if (article !== undefined) announceArrival(article, landed, portraitSrc);
  }

  return (
    <Link
      {...anchorProps}
      href={href}
      onClick={handleClick}
      onPointerEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
    />
  );
}
