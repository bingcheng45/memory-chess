"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { GameVideo } from "./gameVideo";

/** YouTube's hqdefault thumbnail size. */
const THUMBNAIL = { width: 480, height: 360 } as const;

/** The thumbnail stands in for the player, so no YouTube script or cookie loads until the visitor asks for the video. */
export function LabGameVideo({ video }: { video: GameVideo | null }) {
  const t = useTranslations("home");
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (playing) iframeRef.current?.focus();
  }, [playing]);

  if (!video) return null;

  return (
    <div className="lab-game-video">
      <figure className="lab-wrap">
        <div className="lab-video-frame">
          {playing ? (
            <iframe
              ref={iframeRef}
              src={`${video.embedUrl}?autoplay=1&playsinline=1&rel=0`}
              title={t("video.iframeTitle", { title: video.name })}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <button type="button" className="lab-video-facade" aria-label={t("gameVideo.play", { title: video.name })} onClick={() => setPlaying(true)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- YouTube already serves the thumbnail at its display size; next/image would only add an optimizer hop */}
              <img src={video.thumbnailUrl} alt="" width={THUMBNAIL.width} height={THUMBNAIL.height} loading="lazy" decoding="async" />
              <span className="lab-video-play" aria-hidden="true" />
            </button>
          )}
        </div>
        <figcaption className="lab-note">{t("gameVideo.caption")}</figcaption>
      </figure>
    </div>
  );
}
