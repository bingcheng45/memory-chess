"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { hasLabCopy } from "./labLocales";

/**
 * Whether this render is the Lab Paper homepage, which draws its own header and footer. The locale layout's
 * changelog banner and footer render on every route, and a layout cannot read the path on the server, so they ask here.
 */
export function useIsLabHome(): boolean {
  const pathname = usePathname();
  const locale = useLocale();
  return pathname === "/" && hasLabCopy(locale);
}
