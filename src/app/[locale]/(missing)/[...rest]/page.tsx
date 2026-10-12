import { notFound } from "next/navigation";

/**
 * Every path no other route matches ends here, so the locale layout draws its not-found page in the site's shell
 * instead of Next's bare default. The route group names it for useIsLabPaperRoute.
 */
export default function UnknownPath(): never {
  notFound();
}
