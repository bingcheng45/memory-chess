"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { isLabPaperRoute } from "./routes";

/** The locale layout cannot read the path on the server, so its banner and footer ask here which shell this route uses. */
export function useIsLabPaperRoute(): boolean {
  return isLabPaperRoute(usePathname(), useLocale());
}
