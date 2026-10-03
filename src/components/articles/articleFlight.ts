const ROUTE_COMMIT_LIMIT_MS = 400;
const CARD_ATTRIBUTE = "data-article-card";
const FLIGHT_ATTRIBUTE = "data-article-flight";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

let commitRoute: (() => void) | null = null;

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function canFly(): boolean {
  return typeof document.startViewTransition === "function" && !prefersReducedMotion();
}

export function signalRouteCommit(): void {
  commitRoute?.();
}

function nameCard(slug: string): Element | null {
  const card =
    Array.from(document.querySelectorAll(`[${CARD_ATTRIBUTE}]`)).find(
      (candidate) => candidate.getAttribute(CARD_ATTRIBUTE) === slug,
    ) ?? null;
  card?.setAttribute(FLIGHT_ATTRIBUTE, "");
  return card;
}

function waitForRouteCommit(): Promise<boolean> {
  return new Promise((resolve) => {
    const ownCommit = () => {
      clearTimeout(limit);
      commitRoute = null;
      resolve(true);
    };
    const limit = setTimeout(() => {
      if (commitRoute === ownCommit) commitRoute = null;
      resolve(false);
    }, ROUTE_COMMIT_LIMIT_MS);
    commitRoute = ownCommit;
  });
}

export function fly(navigate: () => void, slug: string): Promise<void> {
  if (!canFly()) {
    navigate();
    return Promise.resolve();
  }

  const leaving = nameCard(slug);
  let arriving: Element | null = null;
  const transition = document.startViewTransition(async () => {
    const committed = waitForRouteCommit();
    navigate();
    if (await committed) arriving = nameCard(slug);
    else transition.skipTransition();
  });
  const unname = () => {
    leaving?.removeAttribute(FLIGHT_ATTRIBUTE);
    arriving?.removeAttribute(FLIGHT_ATTRIBUTE);
  };
  // `ready` rejects whenever the transition is skipped.
  transition.ready.catch(() => {});
  return transition.finished.then(unname, unname);
}
