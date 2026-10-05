import { act, screen } from "@/test-utils/intl";
import ArticleFlightGate from "@/components/articles/ArticleFlightGate";
import ArticleLink from "@/components/articles/ArticleLink";
import type { PortraitPhoto } from "@/lib/articles/schema";

export const SLUG = "alder-fixture";
const OTHER_SLUG = "birch-fixture";
export const ARTICLE_HREF = `/articles/${SLUG}`;
export const OTHER_ARTICLE_HREF = `/articles/${OTHER_SLUG}`;
export const ROUTE_COMMIT_LIMIT_MS = 400;
export const CARD_FILE = "http://localhost/_next/image?url=%2Fimages%2Farticles%2Falder.jpg&w=256&q=75";

export function photoNamed(name: string): PortraitPhoto {
  return { src: `/images/articles/${name}.jpg`, width: 840, height: 1050, alt: `${name} at a chess board` };
}

export const PORTRAIT = photoNamed("alder");

export const flush = () => act(async () => {});
export const flights = () => document.querySelectorAll("[data-article-flight]");

export async function isSettled(promise: Promise<unknown>) {
  let settled = false;
  const mark = () => {
    settled = true;
  };
  promise.then(mark, mark);
  await flush();
  return settled;
}

export function stubViewTransitions() {
  let finish = () => {};
  let fail = () => {};
  const finished = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = () => reject(new Error("the update callback threw"));
  });
  let flightsWhenStarted = -1;
  let updateDone: Promise<void> = Promise.resolve();
  const skip = jest.fn(() => finish());
  const start = jest.fn((update: () => Promise<void>) => {
    flightsWhenStarted = flights().length;
    updateDone = Promise.resolve().then(update);
    return { finished, ready: Promise.resolve(), updateCallbackDone: updateDone, skipTransition: skip };
  });
  Object.defineProperty(document, "startViewTransition", { configurable: true, writable: true, value: start });
  return {
    start,
    skip,
    finish: () => finish(),
    fail: () => fail(),
    get flightsWhenStarted() {
      return flightsWhenStarted;
    },
    get updateDone() {
      return updateDone;
    },
  };
}

export function Card() {
  return (
    <ArticleLink article={SLUG} portrait={PORTRAIT} data-article-card={SLUG}>
      Open the article
    </ArticleLink>
  );
}

export function OtherCard() {
  return (
    <ArticleLink article={OTHER_SLUG} portrait={photoNamed("birch")} data-article-card={OTHER_SLUG}>
      Another card
    </ArticleLink>
  );
}

export function BackLink() {
  return <ArticleLink backFrom={SLUG}>All articles</ArticleLink>;
}

export function ListPage() {
  return (
    <>
      <Card />
      <ArticleFlightGate />
    </>
  );
}

export function ArticlePage() {
  return (
    <>
      <BackLink />
      <ArticleFlightGate />
    </>
  );
}

export const card = () => screen.getByRole("link", { name: "Open the article" });
export const otherCard = () => screen.getByRole("link", { name: "Another card" });
export const backLink = () => screen.getByRole("link", { name: "All articles" });
