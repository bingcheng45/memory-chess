import { measureCards, slideCards } from "@/components/articles/cardReorder";
import { setReducedMotion } from "@/components/articles/__tests__/reducedMotion";

const SLIDE = { duration: 560, easing: "cubic-bezier(.16, 1, .3, 1)" };

function place(card: HTMLElement, left: number, top: number): void {
  Object.defineProperty(card, "offsetLeft", { configurable: true, value: left });
  Object.defineProperty(card, "offsetTop", { configurable: true, value: top });
}

function listOf(count: number) {
  const list = document.createElement("ol");
  const cards = Array.from({ length: count }, (_, index) => {
    const card = document.createElement("li");
    place(card, 0, index * 100);
    list.append(card);
    return card;
  });
  return { list, cards };
}

function stubAnimate() {
  const animate = jest.fn((): { finish: jest.Mock } => ({ finish: jest.fn() }));
  Object.defineProperty(Element.prototype, "animate", { configurable: true, writable: true, value: animate });
  return animate;
}

beforeEach(() => {
  setReducedMotion(false);
});

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, "animate");
});

describe("measureCards", () => {
  it("reads where the layout puts each card", () => {
    const { list, cards } = listOf(3);
    place(cards[2], 24, 310);

    const positions = measureCards(list);

    expect(positions.size).toBe(3);
    expect(positions.get(cards[0])).toEqual({ left: 0, top: 0 });
    expect(positions.get(cards[1])).toEqual({ left: 0, top: 100 });
    expect(positions.get(cards[2])).toEqual({ left: 24, top: 310 });
  });

  it("measures an empty list as no positions", () => {
    expect(measureCards(document.createElement("ol")).size).toBe(0);
  });
});

describe("slideCards", () => {
  it("slides each card from where it was to where it is now", () => {
    const animate = stubAnimate();
    const { list, cards } = listOf(3);
    const before = measureCards(list);
    place(cards[0], 0, 200);
    place(cards[2], 12, 0);

    const slides = slideCards(list, before);

    expect(animate.mock.contexts).toEqual([cards[0], cards[2]]);
    expect(animate).toHaveBeenNthCalledWith(
      1,
      [{ transform: "translate(0px, -200px)" }, { transform: "none" }],
      SLIDE,
    );
    expect(animate).toHaveBeenNthCalledWith(
      2,
      [{ transform: "translate(-12px, 200px)" }, { transform: "none" }],
      SLIDE,
    );
    expect(slides).toEqual(animate.mock.results.map((result) => result.value));
  });

  it("leaves a card that did not move alone", () => {
    const animate = stubAnimate();
    const { list } = listOf(3);

    expect(slideCards(list, measureCards(list))).toEqual([]);
    expect(animate).not.toHaveBeenCalled();
  });

  it("lets a card with no earlier place just appear", () => {
    const animate = stubAnimate();
    const { list, cards } = listOf(2);
    const before = measureCards(list);
    const arrived = document.createElement("li");
    place(arrived, 0, 0);
    list.prepend(arrived);
    place(cards[0], 0, 100);
    place(cards[1], 0, 200);

    slideCards(list, before);

    expect(animate.mock.contexts).toEqual([cards[0], cards[1]]);
  });

  it("slides nothing when the visitor asked for reduced motion", () => {
    const animate = stubAnimate();
    const { list, cards } = listOf(2);
    const before = measureCards(list);
    place(cards[0], 0, 100);
    setReducedMotion(true);

    expect(slideCards(list, before)).toEqual([]);
    expect(animate).not.toHaveBeenCalled();
  });

  it("slides nothing, and does not throw, in a browser without the Web Animations API", () => {
    const { list, cards } = listOf(2);
    const before = measureCards(list);
    place(cards[0], 0, 100);

    expect(slideCards(list, before)).toEqual([]);
  });

  it("animates the transform and no layout property", () => {
    const animate = stubAnimate();
    const { list, cards } = listOf(2);
    const before = measureCards(list);
    place(cards[0], 0, 100);

    slideCards(list, before);

    const [keyframes] = animate.mock.calls[0] as unknown as [Record<string, string>[]];
    expect(keyframes.flatMap((frame) => Object.keys(frame))).toEqual(["transform", "transform"]);
  });
});
