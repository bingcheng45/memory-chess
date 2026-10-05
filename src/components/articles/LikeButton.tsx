"use client";

import { useId, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ARTICLE_FOCUS_RING } from "@/components/articles/articleStyles";
import { useLikesSeen } from "@/components/articles/useLikesSeen";
import { trackEvent } from "@/lib/analytics/events";
import { formatCount } from "@/lib/articles/format";
import { NOT_LIKED, likedStore } from "@/lib/articles/likedStore";
import { sendArticleEvent } from "@/lib/articles/statsClient";

type LikeButtonProps = {
  slug: string;
  likes: number | undefined;
};

type Shown = {
  readonly likes: number;
  readonly hasFailed: boolean;
};

const BUTTON_CLASS =
  "group inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-bg-card px-3.5 " +
  "text-sm text-text-secondary hover:border-peach-500/35 " +
  "aria-pressed:border-peach-500/45 aria-pressed:bg-peach-500/10 aria-pressed:text-peach-200 " +
  `transition-transform motion-reduce:transition-none motion-safe:active:scale-95 ${ARTICLE_FOCUS_RING}`;
const HEART_CLASS = "h-[17px] w-[17px] group-aria-pressed:fill-peach-500 group-aria-pressed:text-peach-500";

function setLikesSeen(slug: string, likesSeen: number): void {
  if (likesSeen === NOT_LIKED) likedStore.unlike(slug);
  else likedStore.like(slug, likesSeen);
}

export default function LikeButton({ slug, likes }: LikeButtonProps) {
  const t = useTranslations("articles.like");
  const locale = useLocale();
  const countId = useId();
  const likesSeen = useLikesSeen(slug);
  const isLiked = likesSeen !== NOT_LIKED;
  const [shown, setShown] = useState<Shown>({ likes: likes ?? 0, hasFailed: false });
  const isSending = useRef(false);
  const likesShown = Math.max(shown.likes, likesSeen);

  async function toggle() {
    if (isSending.current) return;
    isSending.current = true;

    const before = { likesSeen, likes: likesShown };
    const willLike = !isLiked;
    const likesAtOnce = Math.max(0, before.likes + (willLike ? 1 : -1));
    setLikesSeen(slug, willLike ? likesAtOnce : NOT_LIKED);
    setShown({ likes: likesAtOnce, hasFailed: false });

    const counts = await sendArticleEvent(slug, willLike ? "like" : "unlike");
    isSending.current = false;

    if (counts === null) {
      setLikesSeen(slug, before.likesSeen);
      setShown({ likes: before.likes, hasFailed: true });
      return;
    }
    setShown({ likes: counts.likes, hasFailed: false });
    if (!willLike) return;

    likedStore.like(slug, counts.likes);
    trackEvent({ name: "article_like", params: { slug } });
  }

  const hasCount = likesShown > 0;

  return (
    <>
      <button
        type="button"
        aria-label={t("button")}
        aria-pressed={isLiked}
        aria-describedby={hasCount ? countId : undefined}
        onClick={toggle}
        className={BUTTON_CLASS}
      >
        <Heart aria-hidden="true" strokeWidth={1.8} className={HEART_CLASS} />
        {hasCount ? <span id={countId}>{formatCount(likesShown, locale)}</span> : null}
      </button>
      <p role="status" aria-live="polite" className="text-peach-200">
        {shown.hasFailed ? t("failed") : null}
      </p>
    </>
  );
}
