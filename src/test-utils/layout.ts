interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Gives every element the size `sizeOf` returns, through each API that reads
 * a laid out size, since jsdom lays nothing out. Restore with
 * `jest.restoreAllMocks()`.
 */
export function fakeLayout(sizeOf: () => Size) {
  jest.spyOn(Element.prototype, "clientWidth", "get").mockImplementation(() => sizeOf().width);
  jest.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(() => sizeOf().height);
  jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(() => sizeOf() as DOMRect);
}
