"use client";

import { useEffect, useRef, useState } from "react";

export type CardImage = { readonly state: "rendering" } | { readonly state: "ready"; readonly blob: Blob; readonly src: string } | { readonly state: "failed" };

/** Draws a card on request; a draw that finishes after a newer one started is dropped, and each finished PNG's URL is freed once replaced. */
export function useCardImage(draw: () => Promise<Blob>) {
  const [image, setImage] = useState<CardImage>({ state: "rendering" });
  const latest = useRef(0);
  const src = image.state === "ready" ? image.src : null;

  useEffect(() => () => {
    if (src) URL.revokeObjectURL(src);
  }, [src]);

  const render = async () => {
    const run = ++latest.current;
    setImage({ state: "rendering" });
    const blob = await draw().catch(() => null);
    if (run !== latest.current) return;
    setImage(blob ? { state: "ready", blob, src: URL.createObjectURL(blob) } : { state: "failed" });
  };

  return { image, render };
}
