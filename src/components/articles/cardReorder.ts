import { prefersReducedMotion } from "@/components/articles/articleFlight";

type Place = { readonly left: number; readonly top: number };

export type CardPlaces = ReadonlyMap<Element, Place>;

const SLIDE = { duration: 560, easing: "cubic-bezier(.16, 1, .3, 1)" } as const;

function cardsOf(list: HTMLElement): HTMLElement[] {
  return Array.from(list.children).filter((card): card is HTMLElement => card instanceof HTMLElement);
}

// offsetLeft and offsetTop are layout positions: a slide still running on the
// card and the page's scroll position leave them unchanged.
export function measureCards(list: HTMLElement): CardPlaces {
  return new Map(cardsOf(list).map((card) => [card, { left: card.offsetLeft, top: card.offsetTop }]));
}

export function slideCards(list: HTMLElement, before: CardPlaces): Animation[] {
  if (typeof Element.prototype.animate !== "function" || prefersReducedMotion()) return [];

  return cardsOf(list).flatMap((card) => {
    const was = before.get(card);
    if (was === undefined) return [];

    const dx = was.left - card.offsetLeft;
    const dy = was.top - card.offsetTop;
    if (dx === 0 && dy === 0) return [];

    return [card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], SLIDE)];
  });
}
