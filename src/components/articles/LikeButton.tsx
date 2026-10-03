"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { ARTICLE_FOCUS_RING } from "@/components/articles/articleStyles";
import { trackEvent } from "@/lib/analytics/events";
import { ARTICLE_STATS_COPY, formatCount } from "@/lib/articles/copy";
import { likedStore } from "@/lib/articles/likedStore";
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

function setLiked(slug: string, isLiked: boolean): void {
  if (isLiked) likedStore.add(slug);
  else likedStore.remove(slug);
}

export default function LikeButton({ slug, likes }: LikeButtonProps) {
  const countId = useId();
  const isLiked = useSyncExternalStore(
    likedStore.subscribe,
    () => likedStore.has(slug),
    () => false,
  );
  const [shown, setShown] = useState<Shown>({ likes: likes ?? 0, hasFailed: false });
  const isSending = useRef(false);
  // The server's count can be five minutes older than this browser's own like, so a pressed heart counts for at least one.
  const likesShown = Math.max(shown.likes, isLiked ? 1 : 0);

  async function toggle() {
    if (isSending.current) return;
    isSending.current = true;

    const before = { isLiked, likes: likesShown };
    const willLike = !before.isLiked;
    setLiked(slug, willLike);
    setShown({ likes: Math.max(0, before.likes + (willLike ? 1 : -1)), hasFailed: false });

    const counts = await sendArticleEvent(slug, willLike ? "like" : "unlike");
    isSending.current = false;

    if (counts === null) {
      setLiked(slug, before.isLiked);
      setShown({ likes: before.likes, hasFailed: true });
      return;
    }
    setShown({ likes: counts.likes, hasFailed: false });
    if (willLike) trackEvent({ name: "article_like", params: { slug } });
  }

  const hasCount = likesShown > 0;

  return (
    <>
      <button
        type="button"
        aria-label={ARTICLE_STATS_COPY.likeButton}
        aria-pressed={isLiked}
        aria-describedby={hasCount ? countId : undefined}
        onClick={toggle}
        className={BUTTON_CLASS}
      >
        <Heart aria-hidden="true" strokeWidth={1.8} className={HEART_CLASS} />
        {hasCount ? <span id={countId}>{formatCount(likesShown)}</span> : null}
      </button>
      <p role="status" aria-live="polite" className="text-peach-200">
        {shown.hasFailed ? ARTICLE_STATS_COPY.likeFailed : null}
      </p>
    </>
  );
}
