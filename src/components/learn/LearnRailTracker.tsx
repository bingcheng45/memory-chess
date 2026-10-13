"use client";

import { useEffect } from "react";

/** How far below the top of the viewport a section must start before it counts as the one being read. */
const READING_LINE = 0.3;

/** Marks the contents entry of the section being read and sets --lg-read, the share of the guide read, on the page. */
export default function LearnRailTracker() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lg-page");
    const body = root?.querySelector<HTMLElement>(".lg-body");
    const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-toc]")];
    const targets = links.flatMap((link) => {
      const target = document.getElementById(link.dataset.toc ?? "");
      return target ? [{ link, target }] : [];
    });
    if (!root || !body || targets.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * READING_LINE;
      const current = targets.filter(({ target }) => target.getBoundingClientRect().top <= line).at(-1) ?? targets[0];
      for (const { link } of targets) {
        if (link === current.link) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
      const box = body.getBoundingClientRect();
      const read = Math.min(1, Math.max(0, (line - box.top) / Math.max(1, box.height)));
      root.style.setProperty("--lg-read", read.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return null;
}
