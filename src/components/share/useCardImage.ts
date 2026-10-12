"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type CardImage = { readonly state: "rendering" } | { readonly state: "ready"; readonly blob: Blob; readonly src: string } | { readonly state: "failed" };

/**
 * The card drawn for `key`: drawn again whenever the key changes, and not at all while it is null. A draw that
 * finishes after a newer one started is dropped, and each finished PNG's URL is freed once replaced.
 */
export function useCardImage(draw: () => Promise<Blob>, key: string | null): CardImage {
  const [image, setImage] = useState<CardImage>({ state: "rendering" });
  const latestDraw = useRef(draw);
  const src = image.state === "ready" ? image.src : null;

  useLayoutEffect(() => {
    latestDraw.current = draw;
  });

  useEffect(() => {
    if (key === null) return;
    let current = true;
    setImage({ state: "rendering" });
    latestDraw.current().then(
      (blob) => current && setImage({ state: "ready", blob, src: URL.createObjectURL(blob) }),
      () => current && setImage({ state: "failed" }),
    );
    return () => {
      current = false;
    };
  }, [key]);

  useEffect(() => () => {
    if (src) URL.revokeObjectURL(src);
  }, [src]);

  return image;
}
