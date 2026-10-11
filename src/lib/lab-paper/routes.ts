import { LAB_LOCALES } from "@/lib/home/labLocales";

/**
 * A route drawn in the Lab Paper shell (docs/design/brand-directions/lab-paper.md, "Using the shell on a page").
 * `path` is unprefixed, as next-intl's usePathname returns it. `scope: "subtree"` also covers every path beneath it.
 * `locales` is "all", or the locales whose copy the page has; any other locale keeps the dark site shell.
 */
export interface LabPaperRoute {
  readonly path: `/${string}`;
  readonly scope: "page" | "subtree";
  readonly locales: "all" | readonly string[];
}

export const LAB_PAPER_ROUTES: readonly LabPaperRoute[] = [
  { path: "/", scope: "page", locales: LAB_LOCALES },
  { path: "/changelog", scope: "page", locales: ["en"] },
];

function covers(route: LabPaperRoute, pathname: string): boolean {
  if (pathname === route.path) return true;
  return route.scope === "subtree" && pathname.startsWith(`${route.path}/`);
}

export function isLabPaperRoute(pathname: string, locale: string, routes: readonly LabPaperRoute[] = LAB_PAPER_ROUTES): boolean {
  return routes.some((route) => covers(route, pathname) && (route.locales === "all" || route.locales.includes(locale)));
}
