"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const WoodenGameDemo = dynamic(() => import("./WoodenGameDemo"), { ssr: false });

/** Holds the demo's space from the first paint and loads it only as it nears the screen, so it costs the guide no LCP. */
export default function LearnRulesDemo({ caption }: { readonly caption: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const target = box.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "200px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <figure className="wg-figure">
      <div ref={box} className="wg-stage">
        {near ? <WoodenGameDemo /> : null}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
