"use client";

import { useLocale } from "next-intl";
import { useSelectedLayoutSegments } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { isLabPaperRoute } from "./routes";

/** The route group of the catch-all that answers every unmatched path with the Lab Paper 404. */
export const UNKNOWN_PATH_GROUP = "(missing)";

/** The locale layout cannot read the path on the server, so its banner and footer ask here which shell this route uses. */
export function useIsLabPaperRoute(): boolean {
  // Outside the App Router, as in a component test, Next's pathname and segments are null.
  const pathname = usePathname() ?? "";
  const locale = useLocale();
  const segments = useSelectedLayoutSegments();
  return segments?.[0] === UNKNOWN_PATH_GROUP || isLabPaperRoute(pathname, locale);
}
