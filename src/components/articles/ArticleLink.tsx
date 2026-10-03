"use client";

import type { ComponentProps, MouseEvent } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { announceArrival } from "@/components/articles/articleArrival";
import { fly } from "@/components/articles/articleFlight";
import { ARTICLES_PATH, articlePath } from "@/lib/articles/paths";

type LinkProps = Omit<ComponentProps<typeof Link>, "href" | "replace" | "scroll" | "locale" | "target" | "download">;
type ArticleLinkProps = LinkProps &
  ({ article: string; backFrom?: never } | { backFrom: string; article?: never });

const PRIMARY_BUTTON = 0;

function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    event.button === PRIMARY_BUTTON && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
  );
}

export default function ArticleLink({ article, backFrom, onClick, ...anchorProps }: ArticleLinkProps) {
  const router = useRouter();
  const href = article === undefined ? ARTICLES_PATH : articlePath(article);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || !isPlainLeftClick(event)) return;

    event.preventDefault();
    const landed = fly(() => router.push(href), article ?? backFrom);
    if (article !== undefined) announceArrival(article, landed);
  }

  return <Link {...anchorProps} href={href} onClick={handleClick} />;
}
