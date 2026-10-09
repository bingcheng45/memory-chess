"use client";

import { useEffect, useState } from "react";

// Safari, not Chrome or Firefox on iOS, which report Safari in their user agent too.
const SAFARI = /^((?!chrome|android|crios|fxios|edgios).)*safari/i;

/** False on the server and the first client render, so both match. */
export function useIsSafari(): boolean {
  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => setIsSafari(SAFARI.test(navigator.userAgent)), []);
  return isSafari;
}
