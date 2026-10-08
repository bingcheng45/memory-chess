"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * The lab card's frame and the height it keeps, drawn before the card's code and the record arrive, so nothing under
 * it moves when the card fills in. The heights fit the tallest card the copy can make, measured at 320 to 1440 wide.
 */
export const RESULT_LAB_FRAME = "w-full rounded-xl border border-bg-light bg-bg-card p-4 sm:p-6 min-h-[300px] sm:min-h-[236px] lg:min-h-[216px]";

export default function ResultLabSlot() {
  return <div aria-hidden="true" data-testid="result-lab-slot" className={RESULT_LAB_FRAME} />;
}

/**
 * The slot once the card will not come. Taking the frame away would pull up whatever is under it, so it stays with a
 * quiet line while any of it is on screen, and goes only when it starts below the fold, where nobody sees the move.
 */
export function ResultLabEnd() {
  const t = useTranslations("home.lab.resultCard");
  const frame = useRef<HTMLDivElement>(null);
  const [belowFold, setBelowFold] = useState(false);

  useLayoutEffect(() => {
    const top = frame.current?.getBoundingClientRect().top;
    if (top !== undefined && top >= window.innerHeight) setBelowFold(true);
  }, []);

  if (belowFold) return null;
  return (
    <div ref={frame} data-testid="result-lab-slot" className={`${RESULT_LAB_FRAME} flex items-center`}>
      <p role="status" className="text-sm text-text-secondary">
        {t("unshown")}
      </p>
    </div>
  );
}
